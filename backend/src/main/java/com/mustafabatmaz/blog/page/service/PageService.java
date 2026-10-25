package com.mustafabatmaz.blog.page.service;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.NotFoundException;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.page.domain.Page;
import com.mustafabatmaz.blog.page.domain.PageKey;
import com.mustafabatmaz.blog.page.domain.PageTranslation;
import com.mustafabatmaz.blog.page.repository.PageRepository;
import com.mustafabatmaz.blog.page.web.PageDtos.PageAdminRequest;
import com.mustafabatmaz.blog.page.web.PageDtos.PageAdminResponse;
import com.mustafabatmaz.blog.page.web.PageDtos.PageResponse;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PageService {

    private final PageRepository repository;
    private final PageMapper mapper;
    private final Clock clock;

    @Transactional(readOnly = true)
    public PageResponse getPublic(PageKey key, Language language) {
        return mapper.toPublicResponse(load(key), language);
    }

    @Transactional(readOnly = true)
    public PageAdminResponse getAdmin(PageKey key) {
        return mapper.toAdminResponse(load(key));
    }

    /** Creates the page on the first save, replaces it afterwards (PUT semantics). */
    @Transactional
    public PageAdminResponse save(PageKey key, PageAdminRequest request) {
        Page page = repository
                .findById(key)
                .map(existing -> {
                    existing.checkVersion(request.version());
                    return existing;
                })
                .orElseGet(() -> new Page(key));

        Translations.sync(
                page.getTranslations(),
                request.translations(),
                t -> t.lang(),
                t -> new PageTranslation(page, t.lang(), t.title(), t.bodyMd()),
                (existing, t) -> existing.update(t.title(), t.bodyMd()));
        page.touch(clock.instant());

        return mapper.toAdminResponse(repository.saveAndFlush(page));
    }

    private Page load(PageKey key) {
        return repository.findById(key).orElseThrow(() -> new NotFoundException("Page not found"));
    }
}
