package com.mustafabatmaz.blog.common.web;

import java.util.Locale;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;

/**
 * Lets URLs use lower case enum values ({@code ?lang=tr}, {@code /pages/about}).
 * Spring's built-in enum conversion is case-sensitive. Registered in {@link WebConfig}.
 */
public class CaseInsensitiveEnumConverterFactory implements ConverterFactory<String, Enum> {

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public <T extends Enum> Converter<String, T> getConverter(Class<T> targetType) {
        // Locale.ROOT: with a Turkish default locale "i".toUpperCase() would give "İ"
        return source -> (T) Enum.valueOf((Class) targetType, source.trim().toUpperCase(Locale.ROOT));
    }
}
