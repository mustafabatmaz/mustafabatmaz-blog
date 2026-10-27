package com.mustafabatmaz.blog.media.domain;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * The image types we accept. The type of an upload is decided only by its first bytes
 * ("magic bytes"): the file name and the Content-Type the browser sends can both be forged.
 */
public enum ImageFormat {
    JPEG("image/jpeg", "jpg"),
    PNG("image/png", "png"),
    WEBP("image/webp", "webp"),
    AVIF("image/avif", "avif");

    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};

    private final String contentType;
    private final String extension;

    ImageFormat(String contentType, String extension) {
        this.contentType = contentType;
        this.extension = extension;
    }

    public String contentType() {
        return contentType;
    }

    public String extension() {
        return extension;
    }

    public static Optional<ImageFormat> detect(byte[] data) {
        if (data.length >= 3 && (data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8 && (data[2] & 0xFF) == 0xFF) {
            return Optional.of(JPEG);
        }
        if (startsWith(data, 0, PNG_SIGNATURE)) {
            return Optional.of(PNG);
        }
        if (startsWith(data, 0, ascii("RIFF")) && startsWith(data, 8, ascii("WEBP"))) {
            return Optional.of(WEBP);
        }
        // ISO base media file: box size, "ftyp", then the major brand
        if (startsWith(data, 4, ascii("ftyp"))
                && (startsWith(data, 8, ascii("avif")) || startsWith(data, 8, ascii("avis")))) {
            return Optional.of(AVIF);
        }
        return Optional.empty();
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

    private static byte[] ascii(String text) {
        return text.getBytes(StandardCharsets.US_ASCII);
    }
}
