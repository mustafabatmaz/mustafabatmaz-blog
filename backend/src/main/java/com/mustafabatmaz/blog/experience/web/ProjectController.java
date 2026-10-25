package com.mustafabatmaz.blog.experience.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.experience.service.ProjectService;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.CaseStudyResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ProjectAdminRequest;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ProjectAdminResponse;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.ProjectOrderRequest;
import com.mustafabatmaz.blog.experience.web.ExperienceDtos.TechnologyResponse;
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
class ProjectController {

    private final ProjectService projectService;

    @Operation(operationId = "getCaseStudy")
    @GetMapping("/api/public/experience/projects/{slug}")
    CaseStudyResponse getCaseStudy(@PathVariable String slug, @RequestParam(defaultValue = "tr") Language lang) {
        return projectService.getCaseStudy(slug, lang);
    }

    @Operation(operationId = "createProject")
    @PostMapping("/api/admin/experiences/{experienceId}/projects")
    @ResponseStatus(HttpStatus.CREATED)
    ProjectAdminResponse createProject(
            @PathVariable long experienceId, @Valid @RequestBody ProjectAdminRequest request) {
        return projectService.create(experienceId, request);
    }

    @Operation(operationId = "reorderProjects")
    @PutMapping("/api/admin/experiences/{experienceId}/projects/order")
    List<ProjectAdminResponse> reorderProjects(
            @PathVariable long experienceId, @Valid @RequestBody ProjectOrderRequest request) {
        return projectService.reorder(experienceId, request.ids());
    }

    @Operation(operationId = "updateProject")
    @PutMapping("/api/admin/projects/{id}")
    ProjectAdminResponse updateProject(@PathVariable long id, @Valid @RequestBody ProjectAdminRequest request) {
        return projectService.update(id, request);
    }

    @Operation(operationId = "deleteProject")
    @DeleteMapping("/api/admin/projects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteProject(@PathVariable long id) {
        projectService.delete(id);
    }

    @Operation(operationId = "listTechnologies")
    @GetMapping("/api/admin/technologies")
    List<TechnologyResponse> listTechnologies() {
        return projectService.listTechnologies();
    }
}
