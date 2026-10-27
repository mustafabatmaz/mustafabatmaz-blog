package com.mustafabatmaz.blog.media.domain;

import static com.mustafabatmaz.blog.media.ImageBytes.ascii;
import static com.mustafabatmaz.blog.media.ImageBytes.avif;
import static com.mustafabatmaz.blog.media.ImageBytes.jfif;
import static com.mustafabatmaz.blog.media.ImageBytes.jpeg;
import static com.mustafabatmaz.blog.media.ImageBytes.png;
import static com.mustafabatmaz.blog.media.ImageBytes.vp8x;
import static com.mustafabatmaz.blog.media.ImageBytes.webp;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ImageFormatTest {

    @Test
    void shouldDetectEachSupportedFormat_fromItsFirstBytes() {
        assertThat(ImageFormat.detect(jpeg(jfif()))).contains(ImageFormat.JPEG);
        assertThat(ImageFormat.detect(png())).contains(ImageFormat.PNG);
        assertThat(ImageFormat.detect(webp(vp8x(0)))).contains(ImageFormat.WEBP);
        assertThat(ImageFormat.detect(avif())).contains(ImageFormat.AVIF);
    }

    @Test
    void shouldRejectSvg_evenThoughItIsAnImage() {
        // SVG is XML and can carry scripts
        assertThat(ImageFormat.detect(ascii("<svg xmlns=\"http://www.w3.org/2000/svg\"><script/></svg>")))
                .isEmpty();
    }

    @Test
    void shouldRejectHtml_disguisedAsAnImage() {
        assertThat(ImageFormat.detect(ascii("<html><script>alert(1)</script></html>")))
                .isEmpty();
    }

    @Test
    void shouldRejectFiles_tooShortToIdentify() {
        assertThat(ImageFormat.detect(new byte[] {(byte) 0xFF, (byte) 0xD8})).isEmpty();
        assertThat(ImageFormat.detect(new byte[0])).isEmpty();
    }
}
