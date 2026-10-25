package com.mustafabatmaz.blog.profile.service;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.NotFoundException;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.profile.domain.Profile;
import com.mustafabatmaz.blog.profile.domain.ProfileTranslation;
import com.mustafabatmaz.blog.profile.repository.ProfileRepository;
import com.mustafabatmaz.blog.profile.web.ProfileDtos.ProfileAdminRequest;
import com.mustafabatmaz.blog.profile.web.ProfileDtos.ProfileAdminResponse;
import com.mustafabatmaz.blog.profile.web.ProfileDtos.ProfileResponse;
import com.mustafabatmaz.blog.profile.web.ProfileDtos.SocialLinkDto;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository repository;
    private final ProfileMapper mapper;
    private final Clock clock;

    @Transactional(readOnly = true)
    public ProfileResponse getPublic(Language language) {
        return mapper.toPublicResponse(load(), language);
    }

    @Transactional(readOnly = true)
    public ProfileAdminResponse getAdmin() {
        return mapper.toAdminResponse(load());
    }

    /** Creates the profile on the first save, replaces it afterwards (PUT semantics). */
    @Transactional
    public ProfileAdminResponse save(ProfileAdminRequest request) {
        Profile profile = repository
                .findById(Profile.SINGLETON_ID)
                .map(existing -> {
                    existing.checkVersion(request.version());
                    return existing;
                })
                .orElseGet(Profile::create);

        profile.updateDetails(request.fullName(), request.email(), request.location());
        Translations.sync(
                profile.getTranslations(),
                request.translations(),
                t -> t.lang(),
                t -> new ProfileTranslation(profile, t.lang(), t.headline(), t.intro()),
                (existing, t) -> existing.update(t.headline(), t.intro()));
        profile.clearSocialLinks();
        for (SocialLinkDto link : request.socialLinks()) {
            profile.addSocialLink(link.platform(), link.url());
        }
        profile.touch(clock.instant());

        // Flush now so the response carries the version the database just wrote
        return mapper.toAdminResponse(repository.saveAndFlush(profile));
    }

    private Profile load() {
        return repository.findById(Profile.SINGLETON_ID).orElseThrow(() -> new NotFoundException("Profile not found"));
    }
}
