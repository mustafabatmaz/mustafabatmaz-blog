package com.mustafabatmaz.blog.media.service;

import static com.mustafabatmaz.blog.media.ImageBytes.ascii;
import static com.mustafabatmaz.blog.media.ImageBytes.avif;
import static com.mustafabatmaz.blog.media.ImageBytes.comment;
import static com.mustafabatmaz.blog.media.ImageBytes.concat;
import static com.mustafabatmaz.blog.media.ImageBytes.contains;
import static com.mustafabatmaz.blog.media.ImageBytes.exif;
import static com.mustafabatmaz.blog.media.ImageBytes.iccProfile;
import static com.mustafabatmaz.blog.media.ImageBytes.jfif;
import static com.mustafabatmaz.blog.media.ImageBytes.jpeg;
import static com.mustafabatmaz.blog.media.ImageBytes.png;
import static com.mustafabatmaz.blog.media.ImageBytes.pngChunk;
import static com.mustafabatmaz.blog.media.ImageBytes.vp8x;
import static com.mustafabatmaz.blog.media.ImageBytes.webp;
import static com.mustafabatmaz.blog.media.ImageBytes.webpChunk;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mustafabatmaz.blog.media.domain.ImageFormat;
import java.util.Arrays;
import org.junit.jupiter.api.Test;

class MetadataStripperTest {

    private final MetadataStripper stripper = new MetadataStripper();

    @Test
    void shouldRemoveExifFromJpeg_includingLocationData() {
        byte[] photo = jpeg(jfif(), exif(1, "GPS:39.92,32.85"), comment("taken at home"));

        MetadataStripper.Result result = stripper.strip(ImageFormat.JPEG, photo);

        assertThat(result.stripped()).isTrue();
        assertThat(contains(result.data(), "GPS:")).isFalse();
        assertThat(contains(result.data(), "taken at home")).isFalse();
        assertThat(contains(result.data(), "JFIF")).isTrue();
    }

    @Test
    void shouldKeepOrientation_soPhonePhotosAreNotShownSideways() {
        byte[] photo = jpeg(jfif(), exif(6, "GPS:39.92,32.85"));

        byte[] cleaned = stripper.strip(ImageFormat.JPEG, photo).data();

        assertThat(contains(cleaned, "GPS:")).isFalse();
        assertThat(contains(cleaned, "Exif")).isTrue();
        // Orientation tag 0x0112, type SHORT, value 6
        assertThat(indexOf(cleaned, new byte[] {0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6}))
                .isPositive();
    }

    @Test
    void shouldNotAddExif_whenOrientationIsNormal() {
        byte[] cleaned =
                stripper.strip(ImageFormat.JPEG, jpeg(jfif(), exif(1, "GPS"))).data();

        assertThat(contains(cleaned, "Exif")).isFalse();
    }

    @Test
    void shouldKeepColourProfileAndImageData_inJpeg() {
        byte[] photo = jpeg(jfif(), iccProfile(), exif(1, "GPS"));

        byte[] cleaned = stripper.strip(ImageFormat.JPEG, photo).data();

        assertThat(contains(cleaned, "ICC_PROFILE")).isTrue();
        assertThat(Arrays.copyOfRange(cleaned, cleaned.length - 5, cleaned.length))
                .containsExactly(0x11, 0x22, 0x33, 0xFF, 0xD9);
    }

    @Test
    void shouldRemoveTextAndExifChunks_fromPng() {
        byte[] image = png(
                pngChunk("tEXt", ascii("Comment\0secret")),
                pngChunk("iTXt", ascii("XML:com.adobe.xmp\0\0\0\0\0<x:xmpmeta/>")),
                pngChunk("eXIf", ascii("MM GPS")));

        byte[] cleaned = stripper.strip(ImageFormat.PNG, image).data();

        assertThat(contains(cleaned, "tEXt")).isFalse();
        assertThat(contains(cleaned, "iTXt")).isFalse();
        assertThat(contains(cleaned, "eXIf")).isFalse();
        assertThat(contains(cleaned, "IHDR")).isTrue();
        assertThat(contains(cleaned, "IDAT")).isTrue();
        assertThat(contains(cleaned, "IEND")).isTrue();
    }

    @Test
    void shouldDropBytesHiddenAfterTheEndOfAPng() {
        byte[] image = concat(png(), ascii("<script>hidden</script>"));

        byte[] cleaned = stripper.strip(ImageFormat.PNG, image).data();

        assertThat(contains(cleaned, "hidden")).isFalse();
    }

    @Test
    void shouldRemoveExifAndXmpChunks_fromWebp_andFixTheHeader() {
        byte[] image = webp(
                vp8x(0x08 | 0x04 | 0x10),
                webpChunk("VP8L", new byte[] {1, 2, 3, 4}),
                webpChunk("EXIF", ascii("MM GPS:39.92")),
                webpChunk("XMP ", ascii("<x:xmpmeta/>")));

        byte[] cleaned = stripper.strip(ImageFormat.WEBP, image).data();

        assertThat(contains(cleaned, "EXIF")).isFalse();
        assertThat(contains(cleaned, "XMP ")).isFalse();
        assertThat(contains(cleaned, "VP8L")).isTrue();
        // VP8X flags (first byte of its data, offset 20): EXIF and XMP cleared, alpha kept
        assertThat(cleaned[20] & 0xFF).isEqualTo(0x10);
        // RIFF size covers everything after the first 8 bytes
        int riffSize =
                (cleaned[4] & 0xFF) | (cleaned[5] & 0xFF) << 8 | (cleaned[6] & 0xFF) << 16 | (cleaned[7] & 0xFF) << 24;
        assertThat(riffSize).isEqualTo(cleaned.length - 8);
    }

    @Test
    void shouldLeaveAvifUntouched_andReportItWasNotStripped() {
        byte[] image = avif();

        MetadataStripper.Result result = stripper.strip(ImageFormat.AVIF, image);

        assertThat(result.stripped()).isFalse();
        assertThat(result.data()).isEqualTo(image);
    }

    @Test
    void shouldRejectTruncatedJpeg() {
        byte[] truncated = Arrays.copyOf(jpeg(jfif(), exif(1, "GPS")), 12);

        assertThatThrownBy(() -> stripper.strip(ImageFormat.JPEG, truncated)).isInstanceOf(InvalidImageException.class);
    }

    @Test
    void shouldRejectPng_withChunkLengthPastTheEnd() {
        byte[] broken = png();
        broken[8] = 0x7F; // IHDR length now claims ~2 GB

        assertThatThrownBy(() -> stripper.strip(ImageFormat.PNG, broken)).isInstanceOf(InvalidImageException.class);
    }

    private static int indexOf(byte[] haystack, byte[] needle) {
        outer:
        for (int i = 0; i <= haystack.length - needle.length; i++) {
            for (int j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    continue outer;
                }
            }
            return i;
        }
        return -1;
    }
}
