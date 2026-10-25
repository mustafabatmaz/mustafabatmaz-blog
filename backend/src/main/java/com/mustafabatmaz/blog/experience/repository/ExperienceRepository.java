package com.mustafabatmaz.blog.experience.repository;

import com.mustafabatmaz.blog.experience.domain.Experience;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {

    /** Newest first; id breaks ties between positions starting in the same month. */
    @EntityGraph(attributePaths = "translations")
    List<Experience> findAllByOrderByStartMonthDescIdDesc();
}
