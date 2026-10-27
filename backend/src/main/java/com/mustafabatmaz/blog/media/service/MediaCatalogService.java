package com.mustafabatmaz.blog.media.service;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.media.MediaCatalog;
import com.mustafabatmaz.blog.media.MediaReference;
import com.mustafabatmaz.blog.media.domain.Media;
import com.mustafabatmaz.blog.media.domain.MediaTranslation;
import com.mustafabatmaz.blog.media.repository.MediaRepository;
import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class MediaCatalogService implements MediaCatalog {

    private final MediaRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Optional<MediaReference> find(long id) {
        return repository.findById(id).map(MediaCatalogService::toReference);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, MediaReference> findAll(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return repository.findAllByIdIn(ids).stream()
                .map(MediaCatalogService::toReference)
                .collect(Collectors.toMap(MediaReference::id, Function.identity()));
    }

    private static MediaReference toReference(Media media) {
        Map<Language, String> altTexts = new EnumMap<>(Language.class);
        for (MediaTranslation translation : media.getTranslations()) {
            altTexts.put(translation.getLang(), translation.getAltText());
        }
        return new MediaReference(media.getId(), MediaMapper.PUBLIC_PATH + media.getStorageKey(), altTexts);
    }
}
