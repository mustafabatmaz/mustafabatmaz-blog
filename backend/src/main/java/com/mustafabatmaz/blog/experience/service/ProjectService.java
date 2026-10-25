package com.mustafabatmaz.blog.experience.service;

import com.mustafabatmaz.blog.common.BadRequestException;
import com.mustafabatmaz.blog.common.ConflictException;
import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.NotFoundException;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.experience.domain.Experience;
import com.mustafabatmaz.blog.experience.domain.ExperienceProject;
import com.mustafabatmaz.blog.experience.domain.ExperienceProjectTranslation;
import com.mustafabatmaz.blog.experience.domain.Technology;
import com.mustafabatmaz.blog.experience.repository.ExperienceProjectRepository;
import com.mustafabatmaz.blog.experience.repository.ExperienceRepository;
import com.mustafabatmaz.blog.experience.repository.TechnologyRepository;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.CaseStudyResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ProjectAdminRequest;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ProjectAdminResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ProjectTranslationDto;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.TechnologyResponse;
import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ExperienceRepository experienceRepository;
    private final ExperienceProjectRepository projectRepository;
    private final TechnologyRepository technologyRepository;
    private final ExperienceMapper mapper;
    private final Clock clock;

    /** The case study in the requested language, or in the other one if only that exists. */
    @Transactional(readOnly = true)
    public CaseStudyResponse getCaseStudy(String slug, Language language) {
        ExperienceProject project = projectRepository.findBySlug(slug).orElseThrow(ProjectService::caseStudyNotFound);
        List<ExperienceProjectTranslation> withCaseStudy = project.getTranslations().stream()
                .filter(ExperienceProjectTranslation::hasCaseStudy)
                .toList();
        ExperienceProjectTranslation translation =
                Translations.pick(withCaseStudy, language).orElseThrow(ProjectService::caseStudyNotFound);
        return mapper.toCaseStudyResponse(project, translation, Translations.available(withCaseStudy));
    }

    @Transactional(readOnly = true)
    public List<TechnologyResponse> listTechnologies() {
        return mapper.toResponses(technologyRepository.findAllByOrderByNameAsc());
    }

    @Transactional
    public ProjectAdminResponse create(long experienceId, ProjectAdminRequest request) {
        Experience experience = experienceRepository
                .findById(experienceId)
                .orElseThrow(() -> new NotFoundException("Experience not found"));
        if (projectRepository.existsBySlug(request.slug())) {
            throw slugTaken();
        }
        Set<Technology> technologies = resolveTechnologies(request.technologies());
        ExperienceProject project =
                new ExperienceProject(experience, request.slug(), projectRepository.findMaxSortOrder(experienceId) + 1);
        apply(project, request, technologies);
        return mapper.toAdminResponse(projectRepository.saveAndFlush(project));
    }

    @Transactional
    public ProjectAdminResponse update(long id, ProjectAdminRequest request) {
        ExperienceProject project = load(id);
        project.checkVersion(request.version());
        if (projectRepository.existsBySlugAndIdNot(request.slug(), id)) {
            throw slugTaken();
        }
        // Queries run before the entity is touched, so no intermediate flush bumps the version twice
        Set<Technology> technologies = resolveTechnologies(request.technologies());
        project.changeSlug(request.slug());
        apply(project, request, technologies);
        return mapper.toAdminResponse(projectRepository.saveAndFlush(project));
    }

    @Transactional
    public void delete(long id) {
        projectRepository.delete(load(id));
    }

    @Transactional
    public List<ProjectAdminResponse> reorder(long experienceId, List<Long> ids) {
        if (!experienceRepository.existsById(experienceId)) {
            throw new NotFoundException("Experience not found");
        }
        List<ExperienceProject> projects = projectRepository.findAllByExperience_IdOrderBySortOrderAsc(experienceId);
        Map<Long, ExperienceProject> byId =
                projects.stream().collect(Collectors.toMap(ExperienceProject::getId, Function.identity()));
        // A partial list would leave two projects on the same position
        if (ids.size() != projects.size() || !byId.keySet().equals(new HashSet<>(ids))) {
            throw new BadRequestException("The order must list every project of this experience exactly once");
        }

        Instant now = clock.instant();
        for (int position = 0; position < ids.size(); position++) {
            ExperienceProject project = byId.get(ids.get(position));
            project.moveTo(position);
            project.touch(now);
        }
        projectRepository.flush();
        return mapper.toAdminResponses(projectRepository.findAllByExperience_IdOrderBySortOrderAsc(experienceId));
    }

    private void apply(ExperienceProject project, ProjectAdminRequest request, Set<Technology> technologies) {
        Translations.sync(
                project.getTranslations(),
                request.translations(),
                ProjectTranslationDto::lang,
                t -> {
                    ExperienceProjectTranslation translation = new ExperienceProjectTranslation(project, t.lang());
                    update(translation, t);
                    return translation;
                },
                ProjectService::update);
        project.replaceTechnologies(technologies);
        project.touch(clock.instant());
    }

    /** Finds each technology ignoring case, creating the ones that don't exist yet. */
    private Set<Technology> resolveTechnologies(List<String> names) {
        Map<String, String> byKey = new LinkedHashMap<>();
        for (String name : names) {
            String trimmed = name.trim();
            byKey.putIfAbsent(trimmed.toLowerCase(Locale.ROOT), trimmed);
        }
        Set<Technology> technologies = new LinkedHashSet<>();
        for (String name : byKey.values()) {
            technologies.add(technologyRepository
                    .findByNameIgnoringCase(name)
                    .orElseGet(() -> technologyRepository.save(new Technology(name))));
        }
        return technologies;
    }

    private static void update(ExperienceProjectTranslation translation, ProjectTranslationDto dto) {
        translation.update(dto.name(), dto.client(), dto.description(), dto.highlightsMd(), dto.caseStudyMd());
    }

    private ExperienceProject load(long id) {
        return projectRepository.findById(id).orElseThrow(() -> new NotFoundException("Project not found"));
    }

    private static NotFoundException caseStudyNotFound() {
        return new NotFoundException("Case study not found");
    }

    private static ConflictException slugTaken() {
        return new ConflictException("The slug is already used by another project");
    }
}
