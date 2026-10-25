package com.mustafabatmaz.blog.page.domain;

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

@Entity
@Table(name = "page_translation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PageTranslation implements Translatable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "page_key")
    private Page page;

    @Column(nullable = false)
    private Language lang;

    @Column(nullable = false)
    private String title;

    // "text" so Hibernate's schema validation matches the Liquibase column type
    @Column(name = "body_md", nullable = false, columnDefinition = "text")
    private String bodyMd;

    public PageTranslation(Page page, Language lang, String title, String bodyMd) {
        this.page = page;
        this.lang = lang;
        update(title, bodyMd);
    }

    public void update(String title, String bodyMd) {
        this.title = title;
        this.bodyMd = bodyMd;
    }
}
