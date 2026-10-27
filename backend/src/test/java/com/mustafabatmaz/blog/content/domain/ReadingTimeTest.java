package com.mustafabatmaz.blog.content.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ReadingTimeTest {

    @Test
    void shouldBeAtLeastOneMinute() {
        assertThat(ReadingTime.minutes("Kısa bir not.")).isEqualTo(1);
        assertThat(ReadingTime.minutes("")).isEqualTo(1);
    }

    @Test
    void shouldRoundUp_at200WordsPerMinute() {
        assertThat(ReadingTime.minutes(words(200))).isEqualTo(1);
        assertThat(ReadingTime.minutes(words(201))).isEqualTo(2);
        assertThat(ReadingTime.minutes(words(1000))).isEqualTo(5);
    }

    @Test
    void shouldCountWords_acrossLinesAndMarkdown() {
        assertThat(ReadingTime.minutes("## Başlık\n\n" + words(399) + "\n```java\nint x;\n```"))
                .isEqualTo(3);
    }

    private static String words(int count) {
        return "kelime ".repeat(count).trim();
    }
}
