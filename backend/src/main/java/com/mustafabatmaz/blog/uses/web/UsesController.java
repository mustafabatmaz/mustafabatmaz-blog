package com.mustafabatmaz.blog.uses.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.uses.service.UsesService;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesCategoryResponse;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesItemAdminRequest;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesItemAdminResponse;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesOrderRequest;
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

@Tag(name = "uses")
@RestController
@RequiredArgsConstructor
class UsesController {

    private final UsesService usesService;

    @Operation(operationId = "listUses")
    @GetMapping("/api/public/uses")
    List<UsesCategoryResponse> listUses(@RequestParam(defaultValue = "tr") Language lang) {
        return usesService.listPublic(lang);
    }

    @Operation(operationId = "listAdminUses")
    @GetMapping("/api/admin/uses")
    List<UsesItemAdminResponse> listAdminUses() {
        return usesService.listAdmin();
    }

    @Operation(operationId = "createUsesItem")
    @PostMapping("/api/admin/uses")
    @ResponseStatus(HttpStatus.CREATED)
    UsesItemAdminResponse createUsesItem(@Valid @RequestBody UsesItemAdminRequest request) {
        return usesService.create(request);
    }

    // A literal path segment wins over {id}, so this never reaches updateUsesItem
    @Operation(operationId = "reorderUses")
    @PutMapping("/api/admin/uses/order")
    List<UsesItemAdminResponse> reorderUses(@Valid @RequestBody UsesOrderRequest request) {
        return usesService.reorder(request.ids());
    }

    @Operation(operationId = "updateUsesItem")
    @PutMapping("/api/admin/uses/{id}")
    UsesItemAdminResponse updateUsesItem(@PathVariable long id, @Valid @RequestBody UsesItemAdminRequest request) {
        return usesService.update(id, request);
    }

    @Operation(operationId = "deleteUsesItem")
    @DeleteMapping("/api/admin/uses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteUsesItem(@PathVariable long id) {
        usesService.delete(id);
    }
}
