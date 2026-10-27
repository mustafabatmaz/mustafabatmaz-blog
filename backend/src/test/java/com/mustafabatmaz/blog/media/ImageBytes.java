package com.mustafabatmaz.blog.media;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

/** Builds small, structurally valid image files byte by byte, so tests control every segment. */
public final class ImageBytes {

    private ImageBytes() {}

    // ---- JPEG ----

    public static byte[] jpeg(byte[]... segments) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.writeBytes(new byte[] {(byte) 0xFF, (byte) 0xD8});
        for (byte[] segment : segments) {
            out.writeBytes(segment);
        }
        // Start of scan, some "compressed" data, end of image
        out.writeBytes(jpegSegment(0xDA, new byte[] {0, 1, 2, 3}));
        out.writeBytes(new byte[] {0x11, 0x22, 0x33, (byte) 0xFF, (byte) 0xD9});
        return out.toByteArray();
    }

    public static byte[] jpegSegment(int marker, byte[] payload) {
        int length = payload.length + 2;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.writeBytes(new byte[] {(byte) 0xFF, (byte) marker, (byte) (length >> 8), (byte) length});
        out.writeBytes(payload);
        return out.toByteArray();
    }

    public static byte[] jfif() {
        return jpegSegment(0xE0, concat(ascii("JFIF\0"), new byte[] {1, 1, 0, 0, 1, 0, 1, 0, 0}));
    }

    /** An EXIF segment with an orientation tag, followed by data that stands in for GPS tags. */
    public static byte[] exif(int orientation, String trailingData) {
        byte[] tiff = concat(
                ascii("MM"),
                new byte[] {0, 0x2A, 0, 0, 0, 8}, // big-endian TIFF header, IFD0 at offset 8
                new byte[] {0, 1}, // one entry
                new byte[] {0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, (byte) orientation, 0, 0},
                new byte[] {0, 0, 0, 0}, // no next IFD
                ascii(trailingData));
        return jpegSegment(0xE1, concat(ascii("Exif\0\0"), tiff));
    }

    public static byte[] iccProfile() {
        return jpegSegment(0xE2, ascii("ICC_PROFILE\0colour-data"));
    }

    public static byte[] comment(String text) {
        return jpegSegment(0xFE, ascii(text));
    }

    // ---- PNG ----

    public static byte[] png(byte[]... chunks) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.writeBytes(new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A});
        out.writeBytes(pngChunk("IHDR", new byte[] {0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0}));
        for (byte[] chunk : chunks) {
            out.writeBytes(chunk);
        }
        out.writeBytes(pngChunk("IDAT", new byte[] {1, 2, 3}));
        out.writeBytes(pngChunk("IEND", new byte[0]));
        return out.toByteArray();
    }

    public static byte[] pngChunk(String type, byte[] data) {
        byte[] typeBytes = ascii(type);
        CRC32 crc = new CRC32();
        crc.update(typeBytes);
        crc.update(data);
        return concat(int32(data.length), typeBytes, data, int32((int) crc.getValue()));
    }

    // ---- WebP ----

    public static byte[] webp(byte[]... chunks) {
        byte[] body = concat(chunks);
        return concat(ascii("RIFF"), int32LittleEndian(4 + body.length), ascii("WEBP"), body);
    }

    public static byte[] webpChunk(String fourCc, byte[] data) {
        byte[] padding = data.length % 2 == 1 ? new byte[1] : new byte[0];
        return concat(ascii(fourCc), int32LittleEndian(data.length), data, padding);
    }

    /** Extended-format header with the given feature flags (0x08 = EXIF, 0x04 = XMP). */
    public static byte[] vp8x(int flags) {
        return webpChunk("VP8X", new byte[] {(byte) flags, 0, 0, 0, 0, 0, 0, 0, 0, 0});
    }

    // ---- AVIF ----

    public static byte[] avif() {
        return concat(int32(24), ascii("ftypavif"), new byte[] {0, 0, 0, 0}, ascii("mif1miaf"), ascii("Exif"));
    }

    // ---- helpers ----

    public static byte[] ascii(String text) {
        return text.getBytes(StandardCharsets.ISO_8859_1);
    }

    public static boolean contains(byte[] haystack, String needle) {
        return new String(haystack, StandardCharsets.ISO_8859_1).contains(needle);
    }

    public static byte[] concat(byte[]... parts) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] part : parts) {
            out.writeBytes(part);
        }
        return out.toByteArray();
    }

    private static byte[] int32(int value) {
        return new byte[] {(byte) (value >> 24), (byte) (value >> 16), (byte) (value >> 8), (byte) value};
    }

    private static byte[] int32LittleEndian(int value) {
        return new byte[] {(byte) value, (byte) (value >> 8), (byte) (value >> 16), (byte) (value >> 24)};
    }
}
