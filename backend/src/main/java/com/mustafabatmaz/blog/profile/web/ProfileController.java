package com.mustafabatmaz.blog.profile.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.profile.service.ProfileService;
import com.mustafabatmaz.blog.profile.web.ProfileDtos.ProfileAdminRequest;
import com.mustafabatmaz.blog.profile.web.ProfileDtos.ProfileAdminResponse;
import com.mustafabatmaz.blog.profile.web.ProfileDtos.ProfileResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "profile")
@RestController
@RequiredArgsConstructor
class ProfileController {

    private final ProfileService profileService;

    @Operation(operationId = "getProfile")
    @GetMapping("/api/public/profile")
    ProfileResponse getProfile(@RequestParam(defaultValue = "tr") Language lang) {
        return profileService.getPublic(lang);
    }

    @Operation(operationId = "getAdminProfile")
    @GetMapping("/api/admin/profile")
    ProfileAdminResponse getAdminProfile() {
        return profileService.getAdmin();
    }

    @Operation(operationId = "saveProfile")
    @PutMapping("/api/admin/profile")
    ProfileAdminResponse saveProfile(@Valid @RequestBody ProfileAdminRequest request) {
        return profileService.save(request);
    }
}
