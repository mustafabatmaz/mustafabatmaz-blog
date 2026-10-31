package com.mustafabatmaz.blog.profile.domain;

import com.mustafabatmaz.blog.common.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

/** The site owner. There is exactly one row (id 1), enforced by a CHECK constraint. */
@Entity
@Table(name = "profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Profile extends AuditableEntity {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String email;

    private String location;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProfileTranslation> translations = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder")
    private List<SocialLink> socialLinks = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder")
    private List<ProfileEducation> education = new ArrayList<>();

    public static Profile create() {
        Profile profile = new Profile();
        profile.id = SINGLETON_ID;
        return profile;
    }

    public void updateDetails(String fullName, String email, String location) {
        this.fullName = fullName;
        this.email = email;
        this.location = location;
    }

    public void clearSocialLinks() {
        socialLinks.clear();
    }

    public void addSocialLink(SocialPlatform platform, String url) {
        socialLinks.add(new SocialLink(this, platform, url, socialLinks.size()));
    }

    public void clearEducation() {
        education.clear();
    }

    /** Appended after the existing entries; the caller adds the degree translations to the returned entry. */
    public ProfileEducation addEducation(String school, int startYear, @Nullable Integer endYear) {
        ProfileEducation entry = new ProfileEducation(this, school, startYear, endYear, education.size());
        education.add(entry);
        return entry;
    }
}
