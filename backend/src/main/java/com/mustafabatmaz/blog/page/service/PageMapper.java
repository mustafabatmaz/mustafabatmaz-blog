package com.mustafabatmaz.blog.page.service;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.NotFoundException;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.page.domain.Page;
import com.mustafabatmaz.blog.page.domain.PageTranslation;
import com.mustafabatmaz.blog.page.web.PageDtos.PageAdminResponse;
import com.mustafabatmaz.blog.page.web.PageDtos.PageResponse;
import com.mustafabatmaz.blog.page.web.PageDtos.PageTranslationDto;
import org.mapstruct.Mapper;

@Mapper
interface PageMapper {

    PageAdminResponse toAdminResponse(Page page);

    PageTranslationDto toDto(PageTranslation translation);

    default PageResponse toPublicResponse(Page page, Language requested) {
        PageTranslation translation = Translations.pick(page.getTranslations(), requested)
                .orElseThrow(() -> new NotFoundException("Page not found"));
        return new PageResponse(
                page.getKey(),
                translation.getLang(),
                Translations.available(page.getTranslations()),
                translation.getTitle(),
                translation.getBodyMd(),
                page.getUpdatedAt());
    }
}
