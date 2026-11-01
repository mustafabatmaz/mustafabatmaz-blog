package com.mustafabatmaz.blog.media.domain;

import static com.mustafabatmaz.blog.media.ImageBytes.avif;
import static com.mustafabatmaz.blog.media.ImageBytes.exif;
import static com.mustafabatmaz.blog.media.ImageBytes.jfif;
import static com.mustafabatmaz.blog.media.ImageBytes.jpeg;
import static com.mustafabatmaz.blog.media.ImageBytes.jpegSegment;
import static org.assertj.core.api.Assertions.assertThat;

import com.mustafabatmaz.blog.media.service.MetadataStripper;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * The files under test/resources/images are 5 × 3 pixels, made by a real encoder (sharp); 5 × 3 so that swapped
 * sides show up.
 */
class ImageDimensionsTest {

    @ParameterizedTest
    @CsvSource({
        "5x3.jpg, JPEG",
        "5x3.png, PNG",
        "5x3-lossy.webp, WEBP",
        "5x3-lossless.webp, WEBP",
        "5x3-alpha.webp, WEBP",
        "5x3.avif, AVIF"
    })
    void shouldReadTheSize_fromTheFileHeader(String file, ImageFormat format) throws IOException {
        assertThat(ImageDimensions.read(format, resource(file))).contains(new ImageDimensions(5, 3));
    }

    @Test
    void shouldSwapTheSides_whenAJpegIsShownRotatedByItsExifOrientation() throws IOException {
        // Orientation 6: stored 5 × 3, shown turned a quarter, so the page needs room for 3 × 5
        assertThat(ImageDimensions.read(ImageFormat.JPEG, resource("5x3-orientation-6.jpg")))
                .contains(new ImageDimensions(3, 5));
    }

    @Test
    void shouldStillSeeTheRotation_afterTheMetadataIsStripped() throws IOException {
        byte[] cleaned = new MetadataStripper()
                .strip(ImageFormat.JPEG, resource("5x3-orientation-6.jpg"))
                .data();

        assertThat(ImageDimensions.read(ImageFormat.JPEG, cleaned)).contains(new ImageDimensions(3, 5));
    }

    @Test
    void shouldFindTheOrientation_evenAfterTheFrameHeader() {
        // Files stripped before the fix kept EXIF after the frame header; already uploaded photos look like this
        byte[] storedEarlier = jpeg(jpegSegment(0xC0, new byte[] {8, 0, 3, 0, 5, 1}), exif(6, ""));

        assertThat(ImageDimensions.read(ImageFormat.JPEG, storedEarlier)).contains(new ImageDimensions(3, 5));
    }

    @Test
    void shouldGiveNoSize_whenTheHeaderIsMissingOrCutShort() throws IOException {
        // No frame header, no ispe box, and files that end too early: unknown, never an exception
        assertThat(ImageDimensions.read(ImageFormat.JPEG, jpeg(jfif()))).isEmpty();
        assertThat(ImageDimensions.read(ImageFormat.AVIF, avif())).isEmpty();
        assertThat(ImageDimensions.read(ImageFormat.PNG, Arrays.copyOf(resource("5x3.png"), 20)))
                .isEmpty();
        assertThat(ImageDimensions.read(ImageFormat.WEBP, Arrays.copyOf(resource("5x3-lossy.webp"), 24)))
                .isEmpty();
        assertThat(ImageDimensions.read(ImageFormat.JPEG, Arrays.copyOf(resource("5x3.jpg"), 30)))
                .isEmpty();
    }

    private static byte[] resource(String name) throws IOException {
        try (InputStream in = ImageDimensionsTest.class.getResourceAsStream("/images/" + name)) {
            if (in == null) {
                throw new IOException("Missing test image " + name);
            }
            return in.readAllBytes();
        }
    }
}
