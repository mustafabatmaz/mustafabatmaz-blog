package com.mustafabatmaz.blog.media.domain;

import java.util.Optional;

/**
 * The orientation tag of a JPEG's EXIF segment: how the stored pixels are turned when shown. Kept when metadata
 * is stripped, and it decides which side is the width. Shared by the stripper and {@link ImageDimensions}.
 */
public final class ExifOrientation {

    private ExifOrientation() {}

    /** Reads tag 0x0112 from IFD0 of the TIFF structure inside an EXIF segment. */
    public static Optional<Integer> read(byte[] data, int tiffStart, int segmentEnd) {
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

    /** Orientations 5 to 8 turn the image a quarter, so width and height swap on screen. */
    public static boolean swapsSides(int orientation) {
        return orientation >= 5 && orientation <= 8;
    }

    private static int u16(byte[] data, int offset, boolean littleEndian) {
        int first = data[offset] & 0xFF;
        int second = data[offset + 1] & 0xFF;
        return littleEndian ? first | second << 8 : first << 8 | second;
    }

    private static int u32(byte[] data, int offset, boolean littleEndian) {
        return littleEndian
                ? u16(data, offset, true) | u16(data, offset + 2, true) << 16
                : u16(data, offset, false) << 16 | u16(data, offset + 2, false);
    }
}
