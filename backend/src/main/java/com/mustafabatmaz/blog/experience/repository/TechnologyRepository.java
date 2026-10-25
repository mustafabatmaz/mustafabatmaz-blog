package com.mustafabatmaz.blog.experience.repository;

import com.mustafabatmaz.blog.experience.domain.Technology;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TechnologyRepository extends JpaRepository<Technology, Long> {

    // lower() matches the unique index on lower(name); derived IgnoreCase queries would use upper()
    @Query("select t from Technology t where lower(t.name) = lower(:name)")
    Optional<Technology> findByNameIgnoringCase(@Param("name") String name);

    List<Technology> findAllByOrderByNameAsc();
}
