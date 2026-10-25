package com.mustafabatmaz.blog.uses.service;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.uses.domain.UsesItem;
import com.mustafabatmaz.blog.uses.domain.UsesItemTranslation;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesItemAdminResponse;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesItemResponse;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesItemTranslationDto;
import java.util.List;
import org.mapstruct.Mapper;

@Mapper
interface UsesMapper {

    UsesItemAdminResponse toAdminResponse(UsesItem item);

    List<UsesItemAdminResponse> toAdminResponses(List<UsesItem> items);

    UsesItemTranslationDto toDto(UsesItemTranslation translation);

    /** Items always have at least one translation (validated on save). */
    default UsesItemResponse toPublicResponse(UsesItem item, Language requested) {
        UsesItemTranslation translation =
                Translations.pick(item.getTranslations(), requested).orElseThrow();
        return new UsesItemResponse(
                translation.getName(), translation.getDescription(), item.getUrl(), translation.getLang());
    }
}
