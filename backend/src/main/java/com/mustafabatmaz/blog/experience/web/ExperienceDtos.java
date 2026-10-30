package com.mustafabatmaz.blog.experience.web;

import com.mustafabatmaz.blog.common.Language;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;
import org.jspecify.annotations.Nullable;

/** Request and response bodies of the experience API. Months are written as "2025-06". */
public final class ExperienceDtos {

    static final String SLUG = "^[a-z0-9]+(-[a-z0-9]+)*$";

    private ExperienceDtos() {}

    // ---- public ----

    /** @param current true when the position has no end month yet */
    public record ExperienceResponse(
            String company,
            YearMonth startMonth,
            @Nullable YearMonth endMonth,
            boolean current,
            String roleTitle,
            @Nullable String summary,
            Language lang,
            List<ProjectSummaryResponse> projects) {}

    public record ProjectSummaryResponse(
            String slug,
            String name,
            @Nullable String client,
            @Nullable String description,
            @Nullable String highlightsMd,
            List<String> technologies,
            boolean hasCaseStudy,
            Language lang) {}

    public record CaseStudyResponse(
            String slug,
            String company,
            YearMonth startMonth,
            @Nullable YearMonth endMonth,
            String name,
            @Nullable String client,
            @Nullable String description,
            @Nullable String highlightsMd,
            String caseStudyMd,
            List<String> technologies,
            Language lang,
            List<Language> availableLanguages) {}

    // ---- admin: experience ----

    public record ExperienceAdminRequest(
            @NotBlank @Size(max = 100) String company,
            @NotNull YearMonth startMonth,
            @Nullable YearMonth endMonth,
            @NotEmpty @Valid List<ExperienceTranslationDto> translations,
            @Nullable Long version) {}

    public record ExperienceAdminResponse(
            Long id,
            String company,
            YearMonth startMonth,
            @Nullable YearMonth endMonth,
            List<ExperienceTranslationDto> translations,
            List<ProjectAdminResponse> projects,
            long version,
            Instant updatedAt) {}

    public record ExperienceTranslationDto(
            @NotNull Language lang,
            @NotBlank @Size(max = 150) String roleTitle,
            @Size(max = 2000) @Nullable String summary) {}

    // ---- admin: project ----

    public record ProjectAdminRequest(
            @NotBlank @Size(max = 100) @Pattern(regexp = SLUG)
            String slug,

            @NotEmpty @Valid List<ProjectTranslationDto> translations,
            @NotNull @Size(max = 30) List<@NotBlank @Size(max = 50) String> technologies,
            @Nullable Long version) {}

    public record ProjectAdminResponse(
            Long id,
            Long experienceId,
            String slug,
            int sortOrder,
            List<ProjectTranslationDto> translations,
            List<String> technologies,
            long version,
            Instant updatedAt) {}

    public record ProjectTranslationDto(
            @NotNull Language lang,
            @NotBlank @Size(max = 150) String name,
            @Size(max = 150) @Nullable String client,
            @Size(max = 2000) @Nullable String description,
            @Size(max = 10_000) @Nullable String highlightsMd,
            @Size(max = 100_000) @Nullable String caseStudyMd) {}

    /** The complete new order of one company's projects: every project id exactly once. */
    public record ProjectOrderRequest(@NotEmpty List<Long> ids) {}

    public record TechnologyResponse(Long id, String name) {}
}
