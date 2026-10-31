package com.mustafabatmaz.blog.profile.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

/** One school on the profile. The school's name isn't translated; the degree is, per language. */
@Entity
@Table(name = "profile_education")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProfileEducation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id")
    private Profile profile;

    @Column(nullable = false)
    private String school;

    @Column(name = "start_year", nullable = false)
    private int startYear;

    // Empty while still studying
    @Column(name = "end_year")
    private @Nullable Integer endYear;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @OneToMany(mappedBy = "education", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProfileEducationTranslation> translations = new ArrayList<>();

    ProfileEducation(Profile profile, String school, int startYear, @Nullable Integer endYear, int sortOrder) {
        this.profile = profile;
        this.school = school;
        this.startYear = startYear;
        this.endYear = endYear;
        this.sortOrder = sortOrder;
    }
}
