package com.mustafabatmaz.blog.media.repository;

import com.mustafabatmaz.blog.media.domain.Media;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaRepository extends JpaRepository<Media, Long> {

    @EntityGraph(attributePaths = "translations")
    List<Media> findAllByOrderByCreatedAtDescIdDesc();

    Optional<Media> findByStorageKey(String storageKey);
}
