package com.mustafabatmaz.blog.common;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Content languages. Written as "tr"/"en" in JSON, URLs and the database. */
public enum Language {
    TR("tr"),
    EN("en");

    private final String code;

    Language(String code) {
        this.code = code;
    }

    @JsonValue
    public String code() {
        return code;
    }

    public Language other() {
        return this == TR ? EN : TR;
    }

    @JsonCreator
    public static Language fromCode(String value) {
        for (Language language : values()) {
            if (language.code.equalsIgnoreCase(value)) {
                return language;
            }
        }
        throw new IllegalArgumentException("Unsupported language: " + value);
    }
}
