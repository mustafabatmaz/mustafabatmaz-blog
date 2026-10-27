package com.mustafabatmaz.blog.media.service;

import com.mustafabatmaz.blog.media.domain.ImageFormat;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Removes metadata (EXIF, XMP, text) from uploads without re-encoding the image, so there is no
 * quality loss. The main concern is privacy: phone photos usually carry the GPS position where
 * they were taken. Every length read from the file is bounds-checked; a malformed file is rejected.
 */
@Component
public class MetadataStripper {

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

    private static final int SOS = 0xDA;
    private static final int EOI = 0xD9;
    private static final int APP0 = 0xE0;
    private static final int APP1 = 0xE1; // EXIF and XMP
    private static final int APP13 = 0xED; // Photoshop / IPTC
    private static final int COM = 0xFE; // free-text comment
    private static final byte[] EXIF_HEADER = "Exif\0\0".getBytes(StandardCharsets.US_ASCII);

    private byte[] stripJpeg(byte[] data) {
        if (data.length < 4 || u8(data, 0) != 0xFF || u8(data, 1) != 0xD8) {
            throw malformed();
        }
        List<byte[]> kept = new ArrayList<>();
        Integer orientation = null;
        int position = 2;
        while (true) {
            if (u8(data, position) != 0xFF) {
                throw malformed();
            }
            int marker = u8(data, position + 1);
            if (marker == 0xFF) { // fill byte
                position++;
                continue;
            }
            if (marker == SOS || marker == EOI) {
                break;
            }
            if ((marker >= 0xD0 && marker <= 0xD7) || marker == 0x01) { // markers without a length
                kept.add(slice(data, position, position + 2));
                position += 2;
                continue;
            }
            int end = position + 2 + u16(data, position + 2);
            if (end > data.length || end < position + 4) {
                throw malformed();
            }
            if (marker == APP1 && startsWith(data, position + 4, EXIF_HEADER)) {
                orientation = readOrientation(data, position + 4 + EXIF_HEADER.length, end)
                        .orElse(orientation);
            }
            if (marker != APP1 && marker != APP13 && marker != COM) {
                kept.add(slice(data, position, end));
            }
            position = end;
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream(data.length);
        out.write(0xFF);
        out.write(0xD8);
        boolean orientationWritten = orientation == null || orientation == 1;
        for (byte[] segment : kept) {
            out.writeBytes(segment);
            // The EXIF segment conventionally follows the JFIF one
            if (!orientationWritten && u8(segment, 1) == APP0) {
                out.writeBytes(orientationSegment(orientation));
                orientationWritten = true;
            }
        }
        if (!orientationWritten) {
            out.writeBytes(orientationSegment(orientation));
        }
        out.write(data, position, data.length - position); // scan data, copied unchanged
        return out.toByteArray();
    }

    /** Reads tag 0x0112 from IFD0 of the TIFF structure inside an EXIF segment. */
    private static Optional<Integer> readOrientation(byte[] data, int tiffStart, int segmentEnd) {
        if (tiffStart + 8 > segmentEnd) {
            return Optional.empty();
        }
        boolean littleEndian = data[tiffStart] == 'I' && data[tiffStart + 1] == 'I';
        int ifd = tiffStart + u32(data, tiffStart + 4, littleEndian);
        if (ifd < tiffStart || ifd + 2 > segmentEnd) {
            return Optional.empty();
        }
        int entries = u16(data, ifd, littleEndian);
        for (int i = 0; i < entries; i++) {
            int entry = ifd + 2 + i * 12;
            if (entry + 12 > segmentEnd) {
                return Optional.empty();
            }
            if (u16(data, entry, littleEndian) == 0x0112) {
                int value = u16(data, entry + 8, littleEndian);
                return value >= 1 && value <= 8 ? Optional.of(value) : Optional.empty();
            }
        }
        return Optional.empty();
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
        out.writeBytes(new byte[] {(byte) 0xFF, (byte) APP1, (byte) (length >> 8), (byte) length});
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

    private static int u16(byte[] data, int offset) {
        return u16(data, offset, false);
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
