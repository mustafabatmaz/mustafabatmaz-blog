package com.mustafabatmaz.blog.common;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;

/** Turns free text ("Güvenlik", "Spring Boot") into a URL segment ("guvenlik", "spring-boot"). */
public final class Slugs {

    /** The format every slug in the system must match. */
    public static final String PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";

    // Mapped before lower-casing: "İ".toLowerCase() is "i" plus a combining dot, and "ı" has no accent
    // to strip, so Unicode normalisation alone would get both wrong
    private static final Map<Character, Character> TURKISH = Map.ofEntries(
            Map.entry('ç', 'c'),
            Map.entry('Ç', 'c'),
            Map.entry('ğ', 'g'),
            Map.entry('Ğ', 'g'),
            Map.entry('ı', 'i'),
            Map.entry('I', 'i'),
            Map.entry('İ', 'i'),
            Map.entry('ö', 'o'),
            Map.entry('Ö', 'o'),
            Map.entry('ş', 's'),
            Map.entry('Ş', 's'),
            Map.entry('ü', 'u'),
            Map.entry('Ü', 'u'));

    private Slugs() {}

    public static String slugify(String text) {
        StringBuilder mapped = new StringBuilder(text.length());
        for (char c : text.toCharArray()) {
            mapped.append(TURKISH.getOrDefault(c, c));
        }
        String slug = Normalizer.normalize(mapped, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "") // accents left after decomposition (é → e)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (slug.isEmpty()) {
            throw new BadRequestException("\"" + text + "\" has no letters or digits to build a URL from");
        }
        return slug;
    }
}
