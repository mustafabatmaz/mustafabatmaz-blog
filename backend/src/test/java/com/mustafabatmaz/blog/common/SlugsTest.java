package com.mustafabatmaz.blog.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SlugsTest {

    @Test
    void shouldTransliterateTurkishLetters() {
        assertThat(Slugs.slugify("Güvenlik")).isEqualTo("guvenlik");
        assertThat(Slugs.slugify("Ölçeklenebilirlik")).isEqualTo("olceklenebilirlik");
        assertThat(Slugs.slugify("İŞ AKIŞI")).isEqualTo("is-akisi");
        assertThat(Slugs.slugify("ğıüşöç ĞIÜŞÖÇ")).isEqualTo("giusoc-giusoc");
    }

    @Test
    void shouldJoinWordsWithSingleDashes() {
        assertThat(Slugs.slugify("  Spring   Boot 4 ")).isEqualTo("spring-boot-4");
        assertThat(Slugs.slugify("C++ & Java/Kotlin")).isEqualTo("c-java-kotlin");
    }

    @Test
    void shouldDropApostrophes_soSuffixesStayWithTheirWord() {
        assertThat(Slugs.slugify("Kafka'da kaybolan event'ler")).isEqualTo("kafkada-kaybolan-eventler");
        assertThat(Slugs.slugify("Spring\u2019in yeni sürümü")).isEqualTo("springin-yeni-surumu");
        assertThat(Slugs.slugify("Don\u02BCt panic")).isEqualTo("dont-panic");
    }

    @Test
    void shouldDropOtherAccents() {
        assertThat(Slugs.slugify("Café Déjà Vu")).isEqualTo("cafe-deja-vu");
    }

    @Test
    void shouldRejectText_withNothingUsable() {
        assertThatThrownBy(() -> Slugs.slugify("!!!")).isInstanceOf(BadRequestException.class);
    }
}
