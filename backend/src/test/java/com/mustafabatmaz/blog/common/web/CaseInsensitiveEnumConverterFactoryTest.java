package com.mustafabatmaz.blog.common.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafabatmaz.blog.common.Language;
import java.util.Locale;
import org.junit.jupiter.api.Test;

class CaseInsensitiveEnumConverterFactoryTest {

    private final CaseInsensitiveEnumConverterFactory factory = new CaseInsensitiveEnumConverterFactory();

    @Test
    void shouldConvert_whenValueIsLowerCase() {
        assertThat(factory.getConverter(Language.class).convert("tr")).isEqualTo(Language.TR);
    }

    @Test
    void shouldConvert_whenDefaultLocaleIsTurkish() {
        // In a Turkish locale "i".toUpperCase() is "İ"; the converter must not depend on it
        Locale original = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            assertThat(factory.getConverter(Sample.class).convert("first_item")).isEqualTo(Sample.FIRST_ITEM);
        } finally {
            Locale.setDefault(original);
        }
    }

    private enum Sample {
        FIRST_ITEM
    }
}
