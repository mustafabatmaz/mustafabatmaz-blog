package com.mustafabatmaz.blog.uses.service;

import com.mustafabatmaz.blog.common.BadRequestException;
import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.NotFoundException;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.uses.domain.UsesCategory;
import com.mustafabatmaz.blog.uses.domain.UsesItem;
import com.mustafabatmaz.blog.uses.domain.UsesItemTranslation;
import com.mustafabatmaz.blog.uses.repository.UsesItemRepository;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesCategoryResponse;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesItemAdminRequest;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesItemAdminResponse;
import com.mustafabatmaz.blog.uses.web.UsesDtos.UsesItemResponse;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsesService {

    private final UsesItemRepository repository;
    private final UsesMapper mapper;
    private final Clock clock;

    /** Items grouped by category in enum order; empty categories are left out. */
    @Transactional(readOnly = true)
    public List<UsesCategoryResponse> listPublic(Language language) {
        Map<UsesCategory, List<UsesItemResponse>> byCategory = new EnumMap<>(UsesCategory.class);
        for (UsesItem item : repository.findAllByOrderBySortOrderAsc()) {
            byCategory
                    .computeIfAbsent(item.getCategory(), category -> new ArrayList<>())
                    .add(mapper.toPublicResponse(item, language));
        }
        return byCategory.entrySet().stream()
                .map(entry -> new UsesCategoryResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UsesItemAdminResponse> listAdmin() {
        return mapper.toAdminResponses(repository.findAllByOrderBySortOrderAsc());
    }

    @Transactional
    public UsesItemAdminResponse create(UsesItemAdminRequest request) {
        UsesItem item = new UsesItem(request.category(), request.url(), repository.findMaxSortOrder() + 1);
        applyTranslations(item, request);
        item.touch(clock.instant());
        return mapper.toAdminResponse(repository.saveAndFlush(item));
    }

    @Transactional
    public UsesItemAdminResponse update(long id, UsesItemAdminRequest request) {
        UsesItem item = load(id);
        item.checkVersion(request.version());
        item.update(request.category(), request.url());
        applyTranslations(item, request);
        item.touch(clock.instant());
        return mapper.toAdminResponse(repository.saveAndFlush(item));
    }

    @Transactional
    public void delete(long id) {
        repository.delete(load(id));
    }

    @Transactional
    public List<UsesItemAdminResponse> reorder(List<Long> ids) {
        List<UsesItem> items = repository.findAllByOrderBySortOrderAsc();
        Map<Long, UsesItem> byId = items.stream().collect(Collectors.toMap(UsesItem::getId, Function.identity()));
        // A partial list would leave two items on the same position
        if (ids.size() != items.size() || !byId.keySet().equals(new HashSet<>(ids))) {
            throw new BadRequestException("The order must list every item exactly once");
        }

        Instant now = clock.instant();
        for (int position = 0; position < ids.size(); position++) {
            UsesItem item = byId.get(ids.get(position));
            item.moveTo(position);
            item.touch(now);
        }
        repository.flush();
        return listAdmin();
    }

    private void applyTranslations(UsesItem item, UsesItemAdminRequest request) {
        Translations.sync(
                item.getTranslations(),
                request.translations(),
                t -> t.lang(),
                t -> new UsesItemTranslation(item, t.lang(), t.name(), t.description()),
                (existing, t) -> existing.update(t.name(), t.description()));
    }

    private UsesItem load(long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Item not found"));
    }
}
