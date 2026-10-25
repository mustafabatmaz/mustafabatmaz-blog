package com.mustafabatmaz.blog.experience.domain;

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
@Table(name = "experience_project_translation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExperienceProjectTranslation implements Translatable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    private ExperienceProject project;

    @Column(nullable = false)
    private Language lang;

    @Column(nullable = false)
    private String name;

    private String client;

    private String description;

    @Column(name = "highlights_md", columnDefinition = "text")
    private String highlightsMd;

    @Column(name = "case_study_md", columnDefinition = "text")
    private String caseStudyMd;

    public ExperienceProjectTranslation(ExperienceProject project, Language lang) {
        this.project = project;
        this.lang = lang;
    }

    public void update(String name, String client, String description, String highlightsMd, String caseStudyMd) {
        this.name = name;
        this.client = client;
        this.description = description;
        this.highlightsMd = highlightsMd;
        this.caseStudyMd = caseStudyMd;
    }

    public boolean hasCaseStudy() {
        return caseStudyMd != null && !caseStudyMd.isBlank();
    }
}
