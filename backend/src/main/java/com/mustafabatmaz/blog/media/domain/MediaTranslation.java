package com.mustafabatmaz.blog.media.domain;

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

/** The alt text of an image in one language, read out by screen readers. */
@Entity
@Table(name = "media_translation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MediaTranslation implements Translatable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "media_id")
    private Media media;

    @Column(nullable = false)
    private Language lang;

    @Column(name = "alt_text", nullable = false)
    private String altText;

    public MediaTranslation(Media media, Language lang, String altText) {
        this.media = media;
        this.lang = lang;
        this.altText = altText;
    }

    public void update(String altText) {
        this.altText = altText;
    }
}
