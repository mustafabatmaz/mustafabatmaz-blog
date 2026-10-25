package com.mustafabatmaz.blog.experience.service;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.experience.domain.Experience;
import com.mustafabatmaz.blog.experience.domain.ExperienceProject;
import com.mustafabatmaz.blog.experience.domain.ExperienceProjectTranslation;
import com.mustafabatmaz.blog.experience.domain.ExperienceTranslation;
import com.mustafabatmaz.blog.experience.domain.Technology;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.CaseStudyResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ExperienceAdminResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ExperienceResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ExperienceTranslationDto;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ProjectAdminResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ProjectSummaryResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ProjectTranslationDto;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.TechnologyResponse;
import java.util.Collection;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
interface ExperienceMapper {

    // ---- generated: field-by-field copies ----

    ExperienceTranslationDto toDto(ExperienceTranslation translation);

    ProjectTranslationDto toDto(ExperienceProjectTranslation translation);

    TechnologyResponse toResponse(Technology technology);

    List<TechnologyResponse> toResponses(List<Technology> technologies);

    @Mapping(target = "experienceId", source = "experience.id")
    ProjectAdminResponse toAdminResponse(ExperienceProject project);

    List<ProjectAdminResponse> toAdminResponses(List<ExperienceProject> projects);

    // The second parameter fills the "projects" field
    ExperienceAdminResponse toAdminResponse(Experience experience, List<ProjectAdminResponse> projects);

    // ---- written by hand: language selection and derived fields ----

    default List<String> technologyNames(Collection<Technology> technologies) {
        return technologies.stream()
                .map(Technology::getName)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    default ExperienceResponse toPublicResponse(
            Experience experience, List<ExperienceProject> projects, Language requested) {
        ExperienceTranslation translation =
                Translations.pick(experience.getTranslations(), requested).orElseThrow();
        return new ExperienceResponse(
                experience.getCompany(),
                experience.getStartMonth(),
                experience.getEndMonth(),
                experience.isCurrent(),
                translation.getRoleTitle(),
                translation.getSummary(),
                translation.getLang(),
                projects.stream().map(p -> toSummaryResponse(p, requested)).toList());
    }

    default ProjectSummaryResponse toSummaryResponse(ExperienceProject project, Language requested) {
        ExperienceProjectTranslation translation =
                Translations.pick(project.getTranslations(), requested).orElseThrow();
        return new ProjectSummaryResponse(
                project.getSlug(),
                translation.getName(),
                translation.getClient(),
                translation.getDescription(),
                translation.getHighlightsMd(),
                technologyNames(project.getTechnologies()),
                project.hasCaseStudy(),
                translation.getLang());
    }

    /** {@code translation} is the one carrying the case study, possibly in the other language. */
    default CaseStudyResponse toCaseStudyResponse(
            ExperienceProject project, ExperienceProjectTranslation translation, List<Language> availableLanguages) {
        Experience experience = project.getExperience();
        return new CaseStudyResponse(
                project.getSlug(),
                experience.getCompany(),
                experience.getStartMonth(),
                experience.getEndMonth(),
                translation.getName(),
                translation.getClient(),
                translation.getDescription(),
                translation.getHighlightsMd(),
                translation.getCaseStudyMd(),
                technologyNames(project.getTechnologies()),
                translation.getLang(),
                availableLanguages);
    }
}
