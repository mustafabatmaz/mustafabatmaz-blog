package com.mustafabatmaz.blog.content.repository;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.content.domain.Post;
import com.mustafabatmaz.blog.content.domain.PostStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Paged queries return ids only. Paging a query that also fetches collections makes Hibernate
 * load every row and page in memory, so: one query for a page of ids, then
 * {@link #findAllByIdIn} for those posts with their translations and tags.
 */
public interface PostRepository extends JpaRepository<Post, Long> {

    String VISIBLE = "t.lang = :lang and p.status = :status and p.publishedAt <= :now";

    @Query(
            value = "select p.id from Post p join p.translations t where " + VISIBLE
                    + " order by p.publishedAt desc, p.id desc",
            countQuery = "select count(p) from Post p join p.translations t where " + VISIBLE)
    Page<Long> findVisibleIds(
            @Param("lang") Language lang,
            @Param("status") PostStatus status,
            @Param("now") Instant now,
            Pageable pageable);

    @Query(
            value = "select p.id from Post p join p.translations t join p.tags tg where " + VISIBLE
                    + " and tg.slug = :tag order by p.publishedAt desc, p.id desc",
            countQuery = "select count(p) from Post p join p.translations t join p.tags tg where " + VISIBLE
                    + " and tg.slug = :tag")
    Page<Long> findVisibleIdsByTag(
            @Param("lang") Language lang,
            @Param("status") PostStatus status,
            @Param("now") Instant now,
            @Param("tag") String tag,
            Pageable pageable);

    @Query("select p.id from Post p join p.translations t where " + VISIBLE + " and t.slug = :slug")
    Optional<Long> findVisibleIdBySlug(
            @Param("lang") Language lang,
            @Param("status") PostStatus status,
            @Param("now") Instant now,
            @Param("slug") String slug);

    /** Admin list; the order comes from the Pageable's sort. */
    @Query("select p.id from Post p")
    Page<Long> findAllIds(Pageable pageable);

    @Query("select p.id from Post p where p.status = :status")
    Page<Long> findIdsByStatus(@Param("status") PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"translations", "tags"})
    List<Post> findAllByIdIn(Collection<Long> ids);

    @Query("select new com.mustafabatmaz.blog.content.repository.TagCount(tg.name, tg.slug, count(distinct p.id))"
            + " from Post p join p.tags tg join p.translations t where " + VISIBLE
            + " group by tg.id, tg.name, tg.slug order by tg.name")
    List<TagCount> countVisibleByTag(
            @Param("lang") Language lang, @Param("status") PostStatus status, @Param("now") Instant now);
}
