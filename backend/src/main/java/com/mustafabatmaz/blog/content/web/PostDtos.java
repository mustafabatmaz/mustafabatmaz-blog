package com.mustafabatmaz.blog.content.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.Slugs;
import com.mustafabatmaz.blog.content.domain.PostStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.jspecify.annotations.Nullable;

/** Request and response bodies of the posts API. */
public final class PostDtos {

    private PostDtos() {}

    // ---- public ----

    public record TagResponse(String name, String slug) {}

    /** @param alt empty when the image has no alt text (treated as decorative) */
    public record CoverResponse(String url, String alt) {}

    public record PostSummaryResponse(
            String slug,
            String title,
            @Nullable String summary,
            Instant publishedAt,
            int readingMinutes,
            List<TagResponse> tags,
            @Nullable CoverResponse cover,
            Language lang) {}

    /** Where the same post lives in a language; slugs differ per language. */
    public record TranslationLink(Language lang, String slug) {}

    public record PostLink(String slug, String title) {}

    /**
     * @param previous the older neighbour in the same language, or null
     * @param next the newer neighbour in the same language, or null
     */
    public record PostDetailResponse(
            String slug,
            Language lang,
            String title,
            @Nullable String summary,
            String bodyMd,
            Instant publishedAt,
            Instant updatedAt,
            int readingMinutes,
            List<TagResponse> tags,
            @Nullable CoverResponse cover,
            List<TranslationLink> availableTranslations,
            @Nullable PostLink previous,
            @Nullable PostLink next) {}

    public record TagCountResponse(String name, String slug, long postCount) {}

    // ---- admin ----

    /**
     * @param publishedAt optional: when publishing without a date the post goes live now;
     *     a future date schedules it
     * @param tags names, e.g. "Spring Boot"; tags are found or created by their derived slug
     */
    public record PostAdminRequest(
            @NotNull PostStatus status,
            @Nullable Instant publishedAt,
            @Nullable Long coverMediaId,
            @NotEmpty @Valid List<PostTranslationDto> translations,
            @NotNull @Size(max = 10) List<@NotBlank @Size(max = 50) String> tags,
            @Nullable Long version) {}

    public record PostTranslationDto(
            @NotNull Language lang,

            @NotBlank @Size(max = 150) @Pattern(regexp = Slugs.PATTERN)
            String slug,

            @NotBlank @Size(max = 200) String title,
            @Size(max = 500) @Nullable String summary,
            @NotBlank @Size(max = 200_000) String bodyMd) {}

    public record PostTranslationAdminResponse(
            Language lang,
            String slug,
            String title,
            @Nullable String summary,
            String bodyMd,
            int readingMinutes) {}

    /** @param scheduled published, but the publish date is still in the future */
    public record PostAdminResponse(
            Long id,
            PostStatus status,
            @Nullable Instant publishedAt,
            boolean scheduled,
            @Nullable Long coverMediaId,
            List<PostTranslationAdminResponse> translations,
            List<String> tags,
            long version,
            Instant createdAt,
            Instant updatedAt) {}

    public record TranslationTitle(Language lang, String slug, String title) {}

    public record PostAdminSummary(
            Long id,
            PostStatus status,
            @Nullable Instant publishedAt,
            boolean scheduled,
            List<TranslationTitle> translations,
            List<String> tags,
            long version,
            Instant updatedAt) {}
}
