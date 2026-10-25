package com.mustafabatmaz.blog.profile.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "social_link")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SocialLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id")
    private Profile profile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SocialPlatform platform;

    @Column(nullable = false)
    private String url;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    SocialLink(Profile profile, SocialPlatform platform, String url, int sortOrder) {
        this.profile = profile;
        this.platform = platform;
        this.url = url;
        this.sortOrder = sortOrder;
    }
}
