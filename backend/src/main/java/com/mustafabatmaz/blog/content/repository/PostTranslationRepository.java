package com.mustafabatmaz.blog.content.repository;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.content.domain.PostStatus;
import com.mustafabatmaz.blog.content.domain.PostTranslation;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostTranslationRepository extends JpaRepository<PostTranslation, Long> {

    boolean existsByLangAndSlug(Language lang, String slug);

    boolean existsByLangAndSlugAndPost_IdNot(Language lang, String slug, Long postId);

    /** Visible posts after the given one; the id breaks ties between equal publish times. */
    @Query("select t from PostTranslation t join t.post p"
            + " where t.lang = :lang and p.status = :status and p.publishedAt <= :now"
            + " and (p.publishedAt > :at or (p.publishedAt = :at and p.id > :id))"
            + " order by p.publishedAt asc, p.id asc")
    List<PostTranslation> findNewer(
            @Param("lang") Language lang,
            @Param("status") PostStatus status,
            @Param("now") Instant now,
            @Param("at") Instant at,
            @Param("id") Long id,
            Pageable limit);

    @Query("select t from PostTranslation t join t.post p"
            + " where t.lang = :lang and p.status = :status and p.publishedAt <= :now"
            + " and (p.publishedAt < :at or (p.publishedAt = :at and p.id < :id))"
            + " order by p.publishedAt desc, p.id desc")
    List<PostTranslation> findOlder(
            @Param("lang") Language lang,
            @Param("status") PostStatus status,
            @Param("now") Instant now,
            @Param("at") Instant at,
            @Param("id") Long id,
            Pageable limit);
}
