package com.mustafabatmaz.blog.page.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.page.domain.PageKey;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/** Request and response bodies of the page API. */
public final class PageDtos {

    private PageDtos() {}

    /**
     * @param lang the language actually returned; differs from the requested one when it was missing
     * @param updatedAt shown as "last updated" on /now
     */
    public record PageResponse(
            PageKey key,
            Language lang,
            List<Language> availableLanguages,
            String title,
            String bodyMd,
            Instant updatedAt) {}

    public record PageAdminRequest(@NotEmpty @Valid List<PageTranslationDto> translations, Long version) {}

    public record PageAdminResponse(
            PageKey key, List<PageTranslationDto> translations, long version, Instant updatedAt) {}

    public record PageTranslationDto(
            @NotNull Language lang,
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 50_000) String bodyMd) {}
}
