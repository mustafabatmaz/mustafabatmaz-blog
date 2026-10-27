package com.mustafabatmaz.blog.content.domain;

public final class ReadingTime {

    private static final int WORDS_PER_MINUTE = 200;

    private ReadingTime() {}

    /** Whole minutes, rounded up, at least one. Markdown symbols count as words; close enough. */
    public static int minutes(String text) {
        String trimmed = text.strip();
        int words = trimmed.isEmpty() ? 0 : trimmed.split("\\s+").length;
        return Math.max(1, (words + WORDS_PER_MINUTE - 1) / WORDS_PER_MINUTE);
    }
}
