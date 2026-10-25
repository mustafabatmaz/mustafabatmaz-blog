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
@Table(name = "profile_translation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProfileTranslation implements Translatable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id")
    private Profile profile;

    @Column(nullable = false)
    private Language lang;

    @Column(nullable = false)
    private String headline;

    private String intro;

    public ProfileTranslation(Profile profile, Language lang, String headline, String intro) {
        this.profile = profile;
        this.lang = lang;
        update(headline, intro);
    }

    public void update(String headline, String intro) {
        this.headline = headline;
        this.intro = intro;
    }
}
