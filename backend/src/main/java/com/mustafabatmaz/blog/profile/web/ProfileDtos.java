package com.mustafabatmaz.blog.profile.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.profile.domain.SocialPlatform;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.jspecify.annotations.Nullable;

/** Request and response bodies of the profile API. */
public final class ProfileDtos {

    // Only http(s): blocks javascript: and data: URLs that would run when rendered as a link
    static final String HTTP_URL = "^https?://\\S+$";

    private ProfileDtos() {}

    public record ProfileResponse(
            String fullName,
            String headline,
            @Nullable String intro,
            @Nullable String location,
            @Nullable String email,
            Language lang,
            List<SocialLinkDto> socialLinks) {}

    public record ProfileAdminRequest(
            @NotBlank @Size(max = 100) String fullName,
            @Email @Size(max = 254) @Nullable String email,
            @Size(max = 100) @Nullable String location,
            @NotEmpty @Valid List<ProfileTranslationDto> translations,
            @NotNull @Size(max = 20) @Valid List<SocialLinkDto> socialLinks,
            @Nullable Long version) {}

    public record ProfileAdminResponse(
            String fullName,
            @Nullable String email,
            @Nullable String location,
            List<ProfileTranslationDto> translations,
            List<SocialLinkDto> socialLinks,
            long version,
            Instant updatedAt) {}

    public record ProfileTranslationDto(
            @NotNull Language lang,
            @NotBlank @Size(max = 150) String headline,
            @Size(max = 2000) @Nullable String intro) {}

    public record SocialLinkDto(
            @NotNull SocialPlatform platform,

            @NotBlank @Size(max = 500) @Pattern(regexp = HTTP_URL)
            String url) {}
}
