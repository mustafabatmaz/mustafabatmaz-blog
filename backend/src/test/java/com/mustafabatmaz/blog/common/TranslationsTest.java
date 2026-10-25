package com.mustafabatmaz.blog.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class TranslationsTest {

    @Test
    void shouldPickRequestedLanguage_whenItExists() {
        List<Text> texts = List.of(new Text(Language.TR, "Merhaba"), new Text(Language.EN, "Hello"));

        assertThat(Translations.pick(texts, Language.EN)).map(Text::value).contains("Hello");
    }

    @Test
    void shouldFallBackToOtherLanguage_whenRequestedOneIsMissing() {
        List<Text> texts = List.of(new Text(Language.TR, "Merhaba"));

        assertThat(Translations.pick(texts, Language.EN)).map(Text::getLang).contains(Language.TR);
    }

    @Test
    void shouldReturnEmpty_whenThereAreNoTranslations() {
        assertThat(Translations.pick(List.<Text>of(), Language.TR)).isEmpty();
    }

    @Test
    void shouldListAvailableLanguagesInFixedOrder() {
        List<Text> texts = List.of(new Text(Language.EN, "Hello"), new Text(Language.TR, "Merhaba"));

        assertThat(Translations.available(texts)).containsExactly(Language.TR, Language.EN);
    }

    @Test
    void shouldUpdateAddAndRemove_whenSyncing() {
        List<Text> current = new ArrayList<>(List.of(new Text(Language.TR, "eski")));
        Text tr = current.getFirst();

        Translations.sync(current, List.of(new Text(Language.TR, "yeni")), Text::getLang, d -> d, Text::copyFrom);
        assertThat(current).containsExactly(tr);
        assertThat(tr.value()).isEqualTo("yeni");

        Translations.sync(current, List.of(new Text(Language.EN, "new")), Text::getLang, d -> d, Text::copyFrom);
        assertThat(current).extracting(Text::getLang).containsExactly(Language.EN);
    }

    @Test
    void shouldRejectRequest_whenLanguageAppearsTwice() {
        List<Text> current = new ArrayList<>();
        List<Text> desired = List.of(new Text(Language.TR, "a"), new Text(Language.TR, "b"));

        assertThatThrownBy(() -> Translations.sync(current, desired, Text::getLang, d -> d, Text::copyFrom))
                .isInstanceOf(BadRequestException.class);
    }

    private static final class Text implements Translatable {

        private final Language lang;
        private String value;

        private Text(Language lang, String value) {
            this.lang = lang;
            this.value = value;
        }

        @Override
        public Language getLang() {
            return lang;
        }

        String value() {
            return value;
        }

        void copyFrom(Text other) {
            this.value = other.value;
        }
    }
}
