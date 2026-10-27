package com.mustafabatmaz.blog.media.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.media.domain.ImageFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/** Request and response bodies of the media API. */
public final class MediaDtos {

    public static final int MAX_ALT_TEXT_LENGTH = 300;

    private MediaDtos() {}

    /**
     * @param url relative path the image is served from
     * @param metadataStripped false means location and camera data may still be in the file
     */
    public record MediaAdminResponse(
            Long id,
            String url,
            ImageFormat format,
            String contentType,
            long sizeBytes,
            String originalFilename,
            boolean metadataStripped,
            List<MediaTranslationDto> translations,
            long version,
            Instant createdAt,
            Instant updatedAt) {}

    /** An empty list removes all alt texts. */
    public record MediaAdminRequest(@NotNull @Valid List<MediaTranslationDto> translations, Long version) {}

    public record MediaTranslationDto(
            @NotNull Language lang,
            @NotBlank @Size(max = MAX_ALT_TEXT_LENGTH) String altText) {}
}
