package com.mustafabatmaz.blog.common;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Stores {@link Language} as its code ("tr"), matching the CHECK constraints in the schema. */
@Converter(autoApply = true)
public class LanguageAttributeConverter implements AttributeConverter<Language, String> {

    @Override
    public String convertToDatabaseColumn(Language language) {
        return language == null ? null : language.code();
    }

    @Override
    public Language convertToEntityAttribute(String code) {
        return code == null ? null : Language.fromCode(code);
    }
}
