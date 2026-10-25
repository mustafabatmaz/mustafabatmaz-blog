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
@Table(name = "experience_translation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExperienceTranslation implements Translatable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "experience_id")
    private Experience experience;

    @Column(nullable = false)
    private Language lang;

    @Column(name = "role_title", nullable = false)
    private String roleTitle;

    private String summary;

    public ExperienceTranslation(Experience experience, Language lang, String roleTitle, String summary) {
        this.experience = experience;
        this.lang = lang;
        update(roleTitle, summary);
    }

    public void update(String roleTitle, String summary) {
        this.roleTitle = roleTitle;
        this.summary = summary;
    }
}
