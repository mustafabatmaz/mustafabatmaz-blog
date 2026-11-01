package com.mustafabatmaz.blog.media.service;

import com.mustafabatmaz.blog.media.domain.ExifOrientation;
import com.mustafabatmaz.blog.media.domain.ImageFormat;
import com.mustafabatmaz.blog.media.domain.JpegSegments;
import com.mustafabatmaz.blog.media.domain.JpegSegments.Segment;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Removes metadata (EXIF, XMP, text) from uploads without re-encoding the image, so there is no
 * quality loss. The main concern is privacy: phone photos usually carry the GPS position where
 * they were taken. Every length read from the file is bounds-checked; a malformed file is rejected.
 */
@Component
public class MetadataStripper {

    // Only carries the outcome back to the caller; never compared or hashed, so comparing the array by reference
    // (the record default Sonar warns about) never matters
    @SuppressWarnings("java:S6218")
    public record Result(byte[] data, boolean stripped) {}

    public Result strip(ImageFormat format, byte[] data) {
        try {
            return switch (format) {
                case JPEG -> new Result(stripJpeg(data), true);
                case PNG -> new Result(stripPng(data), true);
                case WEBP -> new Result(stripWebp(data), true);
                // ISO-BMFF boxes are too involved to rewrite safely by hand; stored as is
                case AVIF -> new Result(data, false);
            };
        } catch (IndexOutOfBoundsException ex) {
            throw malformed();
        }
    }

    // ---- JPEG: a list of segments (FF xx + length) up to "start of scan", then image data ----

    private static final int APP13 = 0xED; // Photoshop / IPTC
    private static final int COM = 0xFE; // free-text comment

    // Two steps: decide which header segments stay (EXIF, IPTC and comments go; the orientation is remembered),
    // then write them back with the orientation in its own small segment and the image data unchanged
    private byte[] stripJpeg(byte[] data) {
        if (data.length < 4 || u8(data, 0) != 0xFF || u8(data, 1) != 0xD8) {
            throw malformed();
        }
        List<byte[]> kept = new ArrayList<>();
        Integer orientation = null;
        Segment segment = jpegSegmentAt(data, 2);
        while (!JpegSegments.isScanOrEnd(segment.marker())) {
            if (JpegSegments.isExif(data, segment)) {
                orientation = ExifOrientation.read(data, JpegSegments.exifTiffStart(segment), segment.end())
                        .orElse(orientation);
            }
            if (segment.marker() != JpegSegments.APP1 && segment.marker() != APP13 && segment.marker() != COM) {
                kept.add(slice(data, segment.start(), segment.end()));
            }
            segment = jpegSegmentAt(data, segment.end());
        }
        return writeJpeg(kept, orientation, data, segment.start());
    }

    // The next segment, or a rejected file: not a marker, or a length that runs past the end or is too short to
    // hold itself. Fill bytes are skipped, so they don't reach the output.
    private static Segment jpegSegmentAt(byte[] data, int position) {
        Segment segment = JpegSegments.at(data, position);
        if (segment == null
                || segment.end() > data.length
                || (JpegSegments.hasLength(segment.marker()) && segment.end() < segment.start() + 4)) {
            throw malformed();
        }
        return segment;
    }

    // EXIF goes right after the start of image, or after JFIF when there is one. Most photos have no JFIF;
    // appended after the frame header, standard readers miss the orientation (found in feat/image-dimensions)
    private static byte[] writeJpeg(List<byte[]> kept, Integer orientation, byte[] data, int scanStart) {
        if (orientation != null && orientation != 1) {
            boolean startsWithJfif = !kept.isEmpty() && u8(kept.get(0), 1) == JpegSegments.APP0;
            kept.add(startsWithJfif ? 1 : 0, orientationSegment(orientation));
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream(data.length);
        out.write(0xFF);
        out.write(0xD8);
        kept.forEach(out::writeBytes);
        out.write(data, scanStart, data.length - scanStart); // scan data, copied unchanged
        return out.toByteArray();
    }

    /** A minimal EXIF segment carrying only the orientation, so phone photos are not shown sideways. */
    private static byte[] orientationSegment(int orientation) {
        byte[] payload = {
            'E',
            'x',
            'i',
            'f',
            0,
            0,
            'M',
            'M',
            0,
            0x2A,
            0,
            0,
            0,
            8, // big-endian TIFF header, IFD0 at offset 8
            0,
            1, // one entry
            0x01,
            0x12,
            0,
            3,
            0,
            0,
            0,
            1,
            0,
            (byte) orientation,
            0,
            0, // orientation, SHORT, count 1
            0,
            0,
            0,
            0 // no next IFD
        };
        int length = payload.length + 2;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.writeBytes(new byte[] {(byte) 0xFF, (byte) JpegSegments.APP1, (byte) (length >> 8), (byte) length});
        out.writeBytes(payload);
        return out.toByteArray();
    }

    // ---- PNG: signature, then chunks of (length, type, data, CRC) until IEND ----

    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    private static final Set<String> PNG_METADATA_CHUNKS = Set.of("tEXt", "zTXt", "iTXt", "eXIf");

    private byte[] stripPng(byte[] data) {
        if (!startsWith(data, 0, PNG_SIGNATURE)) {
            throw malformed();
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream(data.length);
        out.write(data, 0, PNG_SIGNATURE.length);
        int position = PNG_SIGNATURE.length;
        while (true) {
            long length = u32(data, position, false) & 0xFFFFFFFFL;
            long end = position + 12L + length;
            if (end > data.length) {
                throw malformed();
            }
            String type = new String(data, position + 4, 4, StandardCharsets.US_ASCII);
            if (!PNG_METADATA_CHUNKS.contains(type)) {
                out.write(data, position, (int) (end - position));
            }
            position = (int) end;
            // Anything after IEND is dropped: it is not part of the image and can hide content
            if (type.equals("IEND")) {
                return out.toByteArray();
            }
        }
    }

    // ---- WebP: RIFF header, then chunks of (FourCC, little-endian size, data, pad byte) ----

    private static final Set<String> WEBP_METADATA_CHUNKS = Set.of("EXIF", "XMP ");
    private static final int VP8X_EXIF_AND_XMP_FLAGS = 0x08 | 0x04;

    private byte[] stripWebp(byte[] data) {
        long riffEnd = 8L + (u32(data, 4, true) & 0xFFFFFFFFL);
        if (riffEnd > data.length || riffEnd < 12) {
            throw malformed();
        }
        ByteArrayOutputStream chunks = new ByteArrayOutputStream(data.length);
        int position = 12;
        while (position + 8 <= riffEnd) {
            String fourCc = new String(data, position, 4, StandardCharsets.US_ASCII);
            long size = u32(data, position + 4, true) & 0xFFFFFFFFL;
            long end = Math.min(position + 8L + size + (size & 1), riffEnd);
            if (position + 8L + size > riffEnd) {
                throw malformed();
            }
            if (!WEBP_METADATA_CHUNKS.contains(fourCc)) {
                byte[] chunk = slice(data, position, (int) end);
                if (fourCc.equals("VP8X") && chunk.length > 8) {
                    // The header announces which chunks follow; it must not promise removed ones
                    chunk[8] = (byte) (chunk[8] & ~VP8X_EXIF_AND_XMP_FLAGS);
                }
                chunks.writeBytes(chunk);
            }
            position = (int) end;
        }

        int riffSize = 4 + chunks.size();
        ByteArrayOutputStream out = new ByteArrayOutputStream(riffSize + 8);
        out.writeBytes("RIFF".getBytes(StandardCharsets.US_ASCII));
        out.writeBytes(
                new byte[] {(byte) riffSize, (byte) (riffSize >> 8), (byte) (riffSize >> 16), (byte) (riffSize >> 24)});
        out.writeBytes("WEBP".getBytes(StandardCharsets.US_ASCII));
        out.writeBytes(chunks.toByteArray());
        return out.toByteArray();
    }

    // ---- byte helpers (array access throws IndexOutOfBounds on truncated files) ----

    private static int u8(byte[] data, int offset) {
        return data[offset] & 0xFF;
    }

    private static int u16(byte[] data, int offset, boolean littleEndian) {
        return littleEndian
                ? u8(data, offset) | u8(data, offset + 1) << 8
                : u8(data, offset) << 8 | u8(data, offset + 1);
    }

    private static int u32(byte[] data, int offset, boolean littleEndian) {
        return littleEndian
                ? u16(data, offset, true) | u16(data, offset + 2, true) << 16
                : u16(data, offset, false) << 16 | u16(data, offset + 2, false);
    }

    private static boolean startsWith(byte[] data, int offset, byte[] prefix) {
        if (data.length < offset + prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (data[offset + i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    private static byte[] slice(byte[] data, int from, int to) {
        byte[] result = new byte[to - from];
        System.arraycopy(data, from, result, 0, result.length);
        return result;
    }

    private static InvalidImageException malformed() {
        return new InvalidImageException("The image file is damaged or could not be read");
    }
}
