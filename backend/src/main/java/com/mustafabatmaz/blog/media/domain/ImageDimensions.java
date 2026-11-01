package com.mustafabatmaz.blog.media.domain;

import com.mustafabatmaz.blog.media.domain.JpegSegments.Segment;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * An image's size as a browser shows it, read from the file header without decoding the picture. The public site
 * puts it on the img tag so the page keeps room for the image before it arrives (no layout shift). Unknown
 * (empty) when the header can't be read: the size is an improvement, never a reason to refuse an upload.
 */
public record ImageDimensions(int width, int height) {

    public static Optional<ImageDimensions> read(ImageFormat format, byte[] data) {
        try {
            Optional<ImageDimensions> size = switch (format) {
                case JPEG -> jpeg(data);
                case PNG -> png(data);
                case WEBP -> webp(data);
                case AVIF -> avif(data);
            };
            return size.filter(s -> s.width() > 0 && s.height() > 0);
        } catch (IndexOutOfBoundsException ex) {
            // A file that ends early: every read below is plain array access
            return Optional.empty();
        }
    }

    // PNG: the first chunk is IHDR, starting with width and height
    private static Optional<ImageDimensions> png(byte[] data) {
        if (!ascii(data, 12, "IHDR")) {
            return Optional.empty();
        }
        return Optional.of(new ImageDimensions(u32(data, 16), u32(data, 20)));
    }

    // JPEG: segments up to the start of scan; the frame header (SOF) holds height and width, and the EXIF
    // orientation decides which side is the width on screen. EXIF normally comes first, but files stripped before
    // feat/image-dimensions have it after the frame header, so the walk goes on to the start of scan.
    private static Optional<ImageDimensions> jpeg(byte[] data) {
        if (u8(data, 0) != 0xFF || u8(data, 1) != 0xD8) {
            return Optional.empty();
        }
        int orientation = 1;
        ImageDimensions frame = null;
        Segment segment = JpegSegments.at(data, 2);
        while (segment != null && !JpegSegments.isScanOrEnd(segment.marker())) {
            if (JpegSegments.isExif(data, segment)) {
                orientation = ExifOrientation.read(data, JpegSegments.exifTiffStart(segment), segment.end())
                        .orElse(orientation);
            }
            if (JpegSegments.isFrameHeader(segment.marker())) {
                frame = new ImageDimensions(u16(data, segment.start() + 7), u16(data, segment.start() + 5));
            }
            segment = JpegSegments.at(data, segment.end());
        }
        if (segment == null || frame == null) {
            return Optional.empty();
        }
        return Optional.of(
                ExifOrientation.swapsSides(orientation) ? new ImageDimensions(frame.height(), frame.width()) : frame);
    }

    // WebP: RIFF header, then the first chunk tells the kind: lossy (VP8), lossless (VP8L) or extended (VP8X)
    private static Optional<ImageDimensions> webp(byte[] data) {
        if (!ascii(data, 0, "RIFF") || !ascii(data, 8, "WEBP")) {
            return Optional.empty();
        }
        int chunk = 20;
        if (ascii(data, 12, "VP8 ")) {
            // Frame tag (3 bytes), start code 9D 01 2A, then 14-bit width and height
            if (u8(data, chunk + 3) != 0x9D || u8(data, chunk + 4) != 0x01 || u8(data, chunk + 5) != 0x2A) {
                return Optional.empty();
            }
            return Optional.of(new ImageDimensions(u16le(data, chunk + 6) & 0x3FFF, u16le(data, chunk + 8) & 0x3FFF));
        }
        if (ascii(data, 12, "VP8L")) {
            // Signature byte 2F, then width - 1 and height - 1 in 14 bits each
            if (u8(data, chunk) != 0x2F) {
                return Optional.empty();
            }
            int bits = u16le(data, chunk + 1) | u16le(data, chunk + 3) << 16;
            return Optional.of(new ImageDimensions((bits & 0x3FFF) + 1, ((bits >>> 14) & 0x3FFF) + 1));
        }
        if (ascii(data, 12, "VP8X")) {
            // Flags and reserved bytes, then canvas width - 1 and height - 1 in 24 bits each
            return Optional.of(new ImageDimensions(u24le(data, chunk + 4) + 1, u24le(data, chunk + 7) + 1));
        }
        return Optional.empty();
    }

    // AVIF (ISO base media file): meta > iprp > ipco holds the item properties; ispe is an image's size. A file
    // can describe more than one image (a thumbnail, an alpha plane): the largest is the picture itself.
    // A rotation property (irot) isn't applied.
    private static Optional<ImageDimensions> avif(byte[] data) {
        Box meta = findBox(data, 0, data.length, "meta");
        if (meta == null) {
            return Optional.empty();
        }
        // meta is a "full box": version and flags come before its children
        Box iprp = findBox(data, meta.contentStart() + 4, meta.end(), "iprp");
        Box ipco = iprp == null ? null : findBox(data, iprp.contentStart(), iprp.end(), "ipco");
        if (ipco == null) {
            return Optional.empty();
        }
        ImageDimensions largest = null;
        for (Box box = box(data, ipco.contentStart(), ipco.end());
                box != null;
                box = box(data, box.end(), ipco.end())) {
            if (box.type().equals("ispe")) {
                ImageDimensions size =
                        new ImageDimensions(u32(data, box.contentStart() + 4), u32(data, box.contentStart() + 8));
                if (largest == null
                        || (long) size.width() * size.height() > (long) largest.width() * largest.height()) {
                    largest = size;
                }
            }
        }
        return Optional.ofNullable(largest);
    }

    private record Box(String type, int contentStart, int end) {}

    private static Box findBox(byte[] data, int from, int to, String type) {
        for (Box box = box(data, from, to); box != null; box = box(data, box.end(), to)) {
            if (box.type().equals(type)) {
                return box;
            }
        }
        return null;
    }

    // The box at position, or null when none fits before limit (the end of the list it belongs to). Size (4 bytes,
    // including the header) and type; the 64-bit and "to the end" sizes don't occur in the headers we read, so they
    // count as unreadable
    private static Box box(byte[] data, int position, int limit) {
        if (position + 8 > limit) {
            return null;
        }
        long size = u32(data, position) & 0xFFFFFFFFL;
        if (size < 8 || position + size > limit) {
            return null;
        }
        String type = new String(data, position + 4, 4, StandardCharsets.US_ASCII);
        return new Box(type, position + 8, (int) (position + size));
    }

    // ---- byte helpers ----

    private static int u8(byte[] data, int offset) {
        return data[offset] & 0xFF;
    }

    private static int u16(byte[] data, int offset) {
        return u8(data, offset) << 8 | u8(data, offset + 1);
    }

    private static int u16le(byte[] data, int offset) {
        return u8(data, offset) | u8(data, offset + 1) << 8;
    }

    private static int u24le(byte[] data, int offset) {
        return u16le(data, offset) | u8(data, offset + 2) << 16;
    }

    private static int u32(byte[] data, int offset) {
        return u16(data, offset) << 16 | u16(data, offset + 2);
    }

    private static boolean ascii(byte[] data, int offset, String text) {
        return startsWith(data, offset, text.getBytes(StandardCharsets.US_ASCII));
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
}
