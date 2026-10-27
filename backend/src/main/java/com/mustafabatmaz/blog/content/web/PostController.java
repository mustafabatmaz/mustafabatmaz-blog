package com.mustafabatmaz.blog.content.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.PageResponse;
import com.mustafabatmaz.blog.content.domain.PostStatus;
import com.mustafabatmaz.blog.content.service.PostService;
import com.mustafabatmaz.blog.content.web.PostDtos.PostAdminRequest;
import com.mustafabatmaz.blog.content.web.PostDtos.PostAdminResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.PostAdminSummary;
import com.mustafabatmaz.blog.content.web.PostDtos.PostDetailResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.PostSummaryResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.TagCountResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.TagResponse;
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

@Tag(name = "posts")
@RestController
@RequiredArgsConstructor
class PostController {

    private final PostService postService;

    // ---- public ----

    /** @param page 1-based */
    @Operation(operationId = "listPosts")
    @GetMapping("/api/public/posts")
    PageResponse<PostSummaryResponse> listPosts(
            @RequestParam(defaultValue = "tr") Language lang,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) String tag) {
        return postService.listPublic(lang, page, tag);
    }

    @Operation(operationId = "getPost")
    @GetMapping("/api/public/posts/{slug}")
    PostDetailResponse getPost(@PathVariable String slug, @RequestParam(defaultValue = "tr") Language lang) {
        return postService.getPublic(slug, lang);
    }

    @Operation(operationId = "listTags")
    @GetMapping("/api/public/tags")
    List<TagCountResponse> listTags(@RequestParam(defaultValue = "tr") Language lang) {
        return postService.listPublicTags(lang);
    }

    // ---- admin ----

    @Operation(operationId = "listAdminPosts")
    @GetMapping("/api/admin/posts")
    PageResponse<PostAdminSummary> listAdminPosts(
            @RequestParam(defaultValue = "1") int page, @RequestParam(required = false) PostStatus status) {
        return postService.listAdmin(page, status);
    }

    @Operation(operationId = "getAdminPost")
    @GetMapping("/api/admin/posts/{id}")
    PostAdminResponse getAdminPost(@PathVariable long id) {
        return postService.getAdmin(id);
    }

    @Operation(operationId = "createPost")
    @PostMapping("/api/admin/posts")
    @ResponseStatus(HttpStatus.CREATED)
    PostAdminResponse createPost(@Valid @RequestBody PostAdminRequest request) {
        return postService.create(request);
    }

    @Operation(operationId = "updatePost")
    @PutMapping("/api/admin/posts/{id}")
    PostAdminResponse updatePost(@PathVariable long id, @Valid @RequestBody PostAdminRequest request) {
        return postService.update(id, request);
    }

    @Operation(operationId = "deletePost")
    @DeleteMapping("/api/admin/posts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deletePost(@PathVariable long id) {
        postService.delete(id);
    }

    @Operation(operationId = "listAdminTags")
    @GetMapping("/api/admin/tags")
    List<TagResponse> listAdminTags() {
        return postService.listTags();
    }
}
