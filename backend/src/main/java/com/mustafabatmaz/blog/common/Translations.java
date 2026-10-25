package com.mustafabatmaz.blog.common;

import java.util.Arrays;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.BiConsumer;
import java.util.function.Function;

public final class Translations {

    private Translations() {}

    /** The requested language if present, otherwise the other one. */
    public static <T extends Translatable> Optional<T> pick(Collection<T> translations, Language requested) {
        return find(translations, requested).or(() -> find(translations, requested.other()));
    }

    public static <T extends Translatable> List<Language> available(Collection<T> translations) {
        return Arrays.stream(Language.values())
                .filter(language -> find(translations, language).isPresent())
                .toList();
    }

    /**
     * Makes {@code current} match {@code desired}: existing languages are updated in place,
     * new ones are created, missing ones are removed. Updating in place (instead of clear + add)
     * avoids Hibernate inserting the new row before deleting the old one, which would break the
     * unique (parent, lang) constraint.
     */
    public static <T extends Translatable, D> void sync(
            List<T> current,
            List<D> desired,
            Function<D, Language> languageOf,
            Function<D, T> create,
            BiConsumer<T, D> update) {
        Map<Language, D> byLanguage = new EnumMap<>(Language.class);
        for (D item : desired) {
            if (byLanguage.put(languageOf.apply(item), item) != null) {
                throw new BadRequestException("Each language may appear only once");
            }
        }
        current.removeIf(translation -> !byLanguage.containsKey(translation.getLang()));
        byLanguage.forEach((language, item) -> find(current, language)
                .ifPresentOrElse(existing -> update.accept(existing, item), () -> current.add(create.apply(item))));
    }

    private static <T extends Translatable> Optional<T> find(Collection<T> translations, Language language) {
        return translations.stream().filter(t -> t.getLang() == language).findFirst();
    }
}
