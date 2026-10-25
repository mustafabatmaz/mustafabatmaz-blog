package com.mustafabatmaz.blog.experience.service;

import com.mustafabatmaz.blog.common.BadRequestException;
import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.NotFoundException;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.experience.domain.Experience;
import com.mustafabatmaz.blog.experience.domain.ExperienceProject;
import com.mustafabatmaz.blog.experience.domain.ExperienceTranslation;
import com.mustafabatmaz.blog.experience.repository.ExperienceProjectRepository;
import com.mustafabatmaz.blog.experience.repository.ExperienceRepository;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ExperienceAdminRequest;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ExperienceAdminResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ExperienceResponse;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final ExperienceProjectRepository projectRepository;
    private final ExperienceMapper mapper;
    private final Clock clock;

    /** The whole timeline, newest position first, each with its projects in admin order. */
    @Transactional(readOnly = true)
    public List<ExperienceResponse> listPublic(Language language) {
        List<Experience> experiences = experienceRepository.findAllByOrderByStartMonthDescIdDesc();
        Map<Long, List<ExperienceProject>> projects = projectsByExperience(experiences);
        return experiences.stream()
                .map(e -> mapper.toPublicResponse(e, projects.getOrDefault(e.getId(), List.of()), language))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExperienceAdminResponse> listAdmin() {
        List<Experience> experiences = experienceRepository.findAllByOrderByStartMonthDescIdDesc();
        Map<Long, List<ExperienceProject>> projects = projectsByExperience(experiences);
        return experiences.stream()
                .map(e ->
                        mapper.toAdminResponse(e, mapper.toAdminResponses(projects.getOrDefault(e.getId(), List.of()))))
                .toList();
    }

    @Transactional
    public ExperienceAdminResponse create(ExperienceAdminRequest request) {
        checkDates(request);
        Experience experience = new Experience(request.company(), request.startMonth(), request.endMonth());
        applyTranslations(experience, request);
        experience.touch(clock.instant());
        return mapper.toAdminResponse(experienceRepository.saveAndFlush(experience), List.of());
    }

    @Transactional
    public ExperienceAdminResponse update(long id, ExperienceAdminRequest request) {
        Experience experience = load(id);
        experience.checkVersion(request.version());
        checkDates(request);
        experience.update(request.company(), request.startMonth(), request.endMonth());
        applyTranslations(experience, request);
        experience.touch(clock.instant());
        experienceRepository.saveAndFlush(experience);
        return mapper.toAdminResponse(
                experience, mapper.toAdminResponses(projectRepository.findAllByExperience_IdOrderBySortOrderAsc(id)));
    }

    /** Also removes the experience's projects (ON DELETE CASCADE in the schema). */
    @Transactional
    public void delete(long id) {
        experienceRepository.delete(load(id));
    }

    private Map<Long, List<ExperienceProject>> projectsByExperience(List<Experience> experiences) {
        if (experiences.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = experiences.stream().map(Experience::getId).toList();
        // groupingBy keeps each list in the query's sort order
        return projectRepository.findAllByExperience_IdInOrderBySortOrderAsc(ids).stream()
                .collect(Collectors.groupingBy(p -> p.getExperience().getId()));
    }

    private static void checkDates(ExperienceAdminRequest request) {
        if (request.endMonth() != null && request.endMonth().isBefore(request.startMonth())) {
            throw new BadRequestException("The end month cannot be before the start month");
        }
    }

    private static void applyTranslations(Experience experience, ExperienceAdminRequest request) {
        Translations.sync(
                experience.getTranslations(),
                request.translations(),
                t -> t.lang(),
                t -> new ExperienceTranslation(experience, t.lang(), t.roleTitle(), t.summary()),
                (existing, t) -> existing.update(t.roleTitle(), t.summary()));
    }

    private Experience load(long id) {
        return experienceRepository.findById(id).orElseThrow(() -> new NotFoundException("Experience not found"));
    }
}
