package com.mustafabatmaz.blog.content.domain;

import com.mustafabatmaz.blog.common.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "post")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.DRAFT;

    @Column(name = "published_at")
    private Instant publishedAt;

    /**
     * Only the id: the image belongs to the media module, so there is no JPA relation to its
     * entity. The database foreign key still stops an image in use from being deleted.
     */
    @Column(name = "cover_media_id")
    private Long coverMediaId;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostTranslation> translations = new ArrayList<>();

    // A Set, not a List: Hibernate can't fetch two Lists (bags) in one query
    @ManyToMany
    @JoinTable(
            name = "post_tag",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new LinkedHashSet<>();

    /** A new post starts as a draft. */
    public static Post create() {
        return new Post();
    }

    /** Publishing without a date means "now"; a future date schedules the post. */
    public void changePublication(PostStatus status, Instant publishedAt, Instant now) {
        this.status = status;
        this.publishedAt = status == PostStatus.PUBLISHED && publishedAt == null ? now : publishedAt;
    }

    public void changeCover(Long coverMediaId) {
        this.coverMediaId = coverMediaId;
    }

    public void replaceTags(Collection<Tag> tags) {
        this.tags.clear();
        this.tags.addAll(tags);
    }

    public boolean isScheduled(Instant now) {
        return status == PostStatus.PUBLISHED && publishedAt.isAfter(now);
    }
}
