package com.mustafabatmaz.blog.experience.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.experience.service.ExperienceService;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ExperienceAdminRequest;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ExperienceAdminResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ExperienceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "experience")
@RestController
@RequiredArgsConstructor
class ExperienceController {

    private final ExperienceService experienceService;

    @Operation(operationId = "listExperience")
    @GetMapping("/api/public/experience")
    List<ExperienceResponse> listExperience(@RequestParam(defaultValue = "tr") Language lang) {
        return experienceService.listPublic(lang);
    }

    @Operation(operationId = "listAdminExperiences")
    @GetMapping("/api/admin/experiences")
    List<ExperienceAdminResponse> listAdminExperiences() {
        return experienceService.listAdmin();
    }

    @Operation(operationId = "createExperience")
    @PostMapping("/api/admin/experiences")
    @ResponseStatus(HttpStatus.CREATED)
    ExperienceAdminResponse createExperience(@Valid @RequestBody ExperienceAdminRequest request) {
        return experienceService.create(request);
    }

    @Operation(operationId = "updateExperience")
    @PutMapping("/api/admin/experiences/{id}")
    ExperienceAdminResponse updateExperience(
            @PathVariable long id, @Valid @RequestBody ExperienceAdminRequest request) {
        return experienceService.update(id, request);
    }

    @Operation(operationId = "deleteExperience")
    @DeleteMapping("/api/admin/experiences/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteExperience(@PathVariable long id) {
        experienceService.delete(id);
    }
}
