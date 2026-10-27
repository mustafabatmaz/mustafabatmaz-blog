package com.mustafabatmaz.blog.content.domain;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.Translatable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** One language version of a post, with its own URL slug. */
@Entity
@Table(name = "post_translation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostTranslation implements Translatable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(nullable = false)
    private Language lang;

    @Column(nullable = false)
    private String slug;

    @Column(nullable = false)
    private String title;

    private String summary;

    @Column(name = "body_md", nullable = false, columnDefinition = "text")
    private String bodyMd;

    /** Stored so the list page never has to load full bodies. */
    @Column(name = "reading_minutes", nullable = false)
    private int readingMinutes;

    public PostTranslation(Post post, Language lang) {
        this.post = post;
        this.lang = lang;
    }

    public void update(String slug, String title, String summary, String bodyMd) {
        this.slug = slug;
        this.title = title;
        this.summary = summary;
        this.bodyMd = bodyMd;
        this.readingMinutes = ReadingTime.minutes(bodyMd);
    }
}
