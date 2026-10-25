package com.mustafabatmaz.blog.experience.repository;

import com.mustafabatmaz.blog.experience.domain.ExperienceProject;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExperienceProjectRepository extends JpaRepository<ExperienceProject, Long> {

    @EntityGraph(attributePaths = {"translations", "technologies"})
    List<ExperienceProject> findAllByExperience_IdInOrderBySortOrderAsc(Collection<Long> experienceIds);

    @EntityGraph(attributePaths = {"translations", "technologies"})
    List<ExperienceProject> findAllByExperience_IdOrderBySortOrderAsc(Long experienceId);

    @EntityGraph(attributePaths = {"translations", "technologies", "experience"})
    Optional<ExperienceProject> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    @Query("select coalesce(max(p.sortOrder), -1) from ExperienceProject p where p.experience.id = :experienceId")
    int findMaxSortOrder(@Param("experienceId") Long experienceId);
}
