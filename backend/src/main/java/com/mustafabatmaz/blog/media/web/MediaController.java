package com.mustafabatmaz.blog.media.web;

import com.mustafabatmaz.blog.media.service.MediaService;
import com.mustafabatmaz.blog.media.service.MediaService.StoredFile;
import com.mustafabatmaz.blog.media.web.MediaDtos.MediaAdminRequest;
import com.mustafabatmaz.blog.media.web.MediaDtos.MediaAdminResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "media")
@RestController
@RequiredArgsConstructor
class MediaController {

    private final MediaService mediaService;

    /**
     * File names are random UUIDs and their bytes never change, so caches may keep them for a year.
     * Content-Type comes from what the bytes were detected as, never from the extension.
     */
    @Operation(operationId = "getMediaFile")
    @GetMapping("/api/public/media/{storageKey}")
    ResponseEntity<Resource> getMediaFile(@PathVariable String storageKey) {
        StoredFile file = mediaService.find(storageKey);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.format().contentType()))
                .contentLength(file.sizeBytes())
                .cacheControl(
                        CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().build().toString())
                .body(new FileSystemResource(file.path()));
    }

    @Operation(operationId = "uploadMedia")
    @PostMapping(path = "/api/admin/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    MediaAdminResponse uploadMedia(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String altTr,
            @RequestParam(required = false) String altEn) {
        return mediaService.upload(file, altTr, altEn);
    }

    @Operation(operationId = "listMedia")
    @GetMapping("/api/admin/media")
    List<MediaAdminResponse> listMedia() {
        return mediaService.list();
    }

    @Operation(operationId = "updateMedia")
    @PutMapping("/api/admin/media/{id}")
    MediaAdminResponse updateMedia(@PathVariable long id, @Valid @RequestBody MediaAdminRequest request) {
        return mediaService.update(id, request);
    }

    @Operation(operationId = "deleteMedia")
    @DeleteMapping("/api/admin/media/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteMedia(@PathVariable long id) {
        mediaService.delete(id);
    }
}
