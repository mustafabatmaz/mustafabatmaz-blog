package com.mustafabatmaz.blog.profile.domain;

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
@Table(name = "profile_education_translation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProfileEducationTranslation implements Translatable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "education_id")
    private ProfileEducation education;

    @Column(nullable = false)
    private Language lang;

    @Column(nullable = false)
    private String degree;

    public ProfileEducationTranslation(ProfileEducation education, Language lang, String degree) {
        this.education = education;
        this.lang = lang;
        update(degree);
    }

    public void update(String degree) {
        this.degree = degree;
    }
}
