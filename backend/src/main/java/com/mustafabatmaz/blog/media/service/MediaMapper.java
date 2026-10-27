package com.mustafabatmaz.blog.media.service;

import com.mustafabatmaz.blog.media.domain.ImageFormat;
import com.mustafabatmaz.blog.media.domain.Media;
import com.mustafabatmaz.blog.media.domain.MediaTranslation;
import com.mustafabatmaz.blog.media.web.MediaDtos.MediaAdminResponse;
import com.mustafabatmaz.blog.media.web.MediaDtos.MediaTranslationDto;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper
interface MediaMapper {

    String PUBLIC_PATH = "/api/public/media/";

    @Mapping(target = "url", source = "storageKey", qualifiedByName = "toUrl")
    @Mapping(target = "contentType", source = "format", qualifiedByName = "toContentType")
    MediaAdminResponse toAdminResponse(Media media);

    List<MediaAdminResponse> toAdminResponses(List<Media> media);

    MediaTranslationDto toDto(MediaTranslation translation);

    @Named("toUrl")
    default String toUrl(String storageKey) {
        return PUBLIC_PATH + storageKey;
    }

    @Named("toContentType")
    default String toContentType(ImageFormat format) {
        return format.contentType();
    }
}
