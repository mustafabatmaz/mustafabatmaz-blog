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

/** Request and response bodies of the experience API. Months are written as "2025-06". */
public final class ExperienceDtos {

    static final String SLUG = "^[a-z0-9]+(-[a-z0-9]+)*$";

    private ExperienceDtos() {}

    // ---- public ----

    /** @param current true when the position has no end month yet */
    public record ExperienceResponse(
            String company,
            YearMonth startMonth,
            YearMonth endMonth,
            boolean current,
            String roleTitle,
            String summary,
            Language lang,
            List<ProjectSummaryResponse> projects) {}

    public record ProjectSummaryResponse(
            String slug,
            String name,
            String client,
            String description,
            String highlightsMd,
            List<String> technologies,
            boolean hasCaseStudy,
            Language lang) {}

    public record CaseStudyResponse(
            String slug,
            String company,
            YearMonth startMonth,
            YearMonth endMonth,
            String name,
            String client,
            String description,
            String highlightsMd,
            String caseStudyMd,
            List<String> technologies,
            Language lang,
            List<Language> availableLanguages) {}

    // ---- admin: experience ----

    public record ExperienceAdminRequest(
            @NotBlank @Size(max = 100) String company,
            @NotNull YearMonth startMonth,
            YearMonth endMonth,
            @NotEmpty @Valid List<ExperienceTranslationDto> translations,
            Long version) {}

    public record ExperienceAdminResponse(
            Long id,
            String company,
            YearMonth startMonth,
            YearMonth endMonth,
            List<ExperienceTranslationDto> translations,
            List<ProjectAdminResponse> projects,
            long version,
            Instant updatedAt) {}

    public record ExperienceTranslationDto(
            @NotNull Language lang,
            @NotBlank @Size(max = 150) String roleTitle,
            @Size(max = 2000) String summary) {}

    // ---- admin: project ----

    public record ProjectAdminRequest(
            @NotBlank @Size(max = 100) @Pattern(regexp = SLUG)
            String slug,

            @NotEmpty @Valid List<ProjectTranslationDto> translations,
            @NotNull @Size(max = 30) List<@NotBlank @Size(max = 50) String> technologies,
            Long version) {}

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
            @Size(max = 150) String client,
            @Size(max = 2000) String description,
            @Size(max = 10_000) String highlightsMd,
            @Size(max = 100_000) String caseStudyMd) {}

    /** The complete new order of one company's projects: every project id exactly once. */
    public record ProjectOrderRequest(@NotEmpty List<Long> ids) {}

    public record TechnologyResponse(Long id, String name) {}
}
