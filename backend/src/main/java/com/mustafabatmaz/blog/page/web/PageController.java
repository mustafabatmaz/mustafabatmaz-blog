package com.mustafabatmaz.blog.page.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.page.domain.PageKey;
import com.mustafabatmaz.blog.page.service.PageService;
import com.mustafabatmaz.blog.page.web.PageDtos.PageAdminRequest;
import com.mustafabatmaz.blog.page.web.PageDtos.PageAdminResponse;
import com.mustafabatmaz.blog.page.web.PageDtos.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "pages")
@RestController
@RequiredArgsConstructor
class PageController {

    private final PageService pageService;

    @Operation(operationId = "getPage")
    @GetMapping("/api/public/pages/{key}")
    PageResponse getPage(@PathVariable PageKey key, @RequestParam(defaultValue = "tr") Language lang) {
        return pageService.getPublic(key, lang);
    }

    @Operation(operationId = "getAdminPage")
    @GetMapping("/api/admin/pages/{key}")
    PageAdminResponse getAdminPage(@PathVariable PageKey key) {
        return pageService.getAdmin(key);
    }

    @Operation(operationId = "savePage")
    @PutMapping("/api/admin/pages/{key}")
    PageAdminResponse savePage(@PathVariable PageKey key, @Valid @RequestBody PageAdminRequest request) {
        return pageService.save(key, request);
    }
}
