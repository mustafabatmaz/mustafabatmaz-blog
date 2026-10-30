package com.mustafabatmaz.blog.content.service;

import com.mustafabatmaz.blog.common.ConflictException;
import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.ProblemTypes;
import java.util.List;
import java.util.Map;

/** A post's slug is already used in some of its languages; "languages" tells the client which slug fields to mark. */
class SlugTakenException extends ConflictException {

    private final List<Language> languages;

    SlugTakenException(List<Language> languages) {
        super("The slug is already used by another post in this language", ProblemTypes.SLUG_TAKEN);
        this.languages = List.copyOf(languages);
    }

    @Override
    public Map<String, Object> getProperties() {
        return Map.of("languages", languages);
    }
}
