package com.mustafabatmaz.blog.content.repository;

import com.mustafabatmaz.blog.content.domain.Tag;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findBySlug(String slug);

    List<Tag> findAllByOrderByNameAsc();
}
