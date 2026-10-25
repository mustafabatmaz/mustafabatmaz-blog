package com.mustafabatmaz.blog.common.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
class WebConfig implements WebMvcConfigurer {

    /**
     * Registered here rather than as a bean: Boot wraps converter beans whose generics it can't
     * resolve (the raw {@code Enum} here) in an adapter that never matches a concrete enum, so the
     * case-sensitive default would win. Registered directly, it takes precedence over the default.
     */
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverterFactory(new CaseInsensitiveEnumConverterFactory());
    }
}
