package com.mustafabatmaz.blog.media.domain;

import java.nio.charset.StandardCharsets;

/**
 * Walks the segments of a JPEG header: each is FF, a marker byte and (for most) a two-byte length, up to the start
 * of scan, after which the compressed image follows. Shared by the metadata stripper and {@link ImageDimensions}.
 * Reads are plain array access: a file that ends early throws IndexOutOfBoundsException, which callers handle.
 */
public final class JpegSegments {

    public static final int SOS = 0xDA; // start of scan
    public static final int EOI = 0xD9; // end of image
    public static final int APP0 = 0xE0; // JFIF
    public static final int APP1 = 0xE1; // EXIF and XMP

    private static final byte[] EXIF_HEADER = "Exif\0\0".getBytes(StandardCharsets.US_ASCII);

    /** @param end just past the segment; for markers without a length, start + 2 */
    public record Segment(int marker, int start, int end) {}

    private JpegSegments() {}

    /**
     * The segment at position, past any fill bytes (extra FFs before a marker); null where the bytes are not a
     * marker. The length isn't checked against the file size here: the stripper rejects such files, the size
     * reader gives up on them.
     */
    public static Segment at(byte[] data, int position) {
        int start = position;
        while (u8(data, start) == 0xFF && u8(data, start + 1) == 0xFF) {
            start++;
        }
        if (u8(data, start) != 0xFF) {
            return null;
        }
        int marker = u8(data, start + 1);
        int end = hasLength(marker) ? start + 2 + u16(data, start + 2) : start + 2;
        return new Segment(marker, start, end);
    }

    /** Restart markers (D0 to D7), TEM (01), and the scan start and image end, where the walk stops. */
    public static boolean hasLength(int marker) {
        return !((marker >= 0xD0 && marker <= 0xD7) || marker == 0x01 || isScanOrEnd(marker));
    }

    public static boolean isScanOrEnd(int marker) {
        return marker == SOS || marker == EOI;
    }

    public static boolean isExif(byte[] data, Segment segment) {
        return segment.marker() == APP1 && startsWith(data, segment.start() + 4, EXIF_HEADER);
    }

    /** Where the TIFF structure (and the orientation tag in it) starts inside an EXIF segment. */
    public static int exifTiffStart(Segment segment) {
        return segment.start() + 4 + EXIF_HEADER.length;
    }

    /** SOF0 to SOF15, except DHT (C4), JPG (C8) and DAC (CC), which share the range. */
    public static boolean isFrameHeader(int marker) {
        return marker >= 0xC0 && marker <= 0xCF && marker != 0xC4 && marker != 0xC8 && marker != 0xCC;
    }

    private static int u8(byte[] data, int offset) {
        return data[offset] & 0xFF;
    }

    private static int u16(byte[] data, int offset) {
        return u8(data, offset) << 8 | u8(data, offset + 1);
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
