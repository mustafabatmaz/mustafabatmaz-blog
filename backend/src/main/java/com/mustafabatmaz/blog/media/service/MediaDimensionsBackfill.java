package com.mustafabatmaz.blog.media.service;

import com.mustafabatmaz.blog.media.domain.ImageDimensions;
import com.mustafabatmaz.blog.media.domain.Media;
import com.mustafabatmaz.blog.media.repository.MediaRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Images uploaded before sizes were stored (changeset 0008) get theirs from their files at startup (run by
 * MediaConfig, through this bean's proxy so the transaction applies). Idempotent:
 * once filled, a row is never read again; an image whose size can't be read is tried again next time, which
 * costs one header read. A missing file is logged and never stops the app.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MediaDimensionsBackfill {

    private final MediaRepository repository;
    private final MediaStorage storage;

    @Transactional
    public void fillMissing() {
        List<Media> missing = repository.findAllByWidthIsNull();
        int filled = 0;
        for (Media media : missing) {
            Optional<ImageDimensions> size = read(media);
            if (size.isPresent()) {
                media.setDimensions(size.get());
                filled++;
            }
        }
        if (!missing.isEmpty()) {
            log.info("Image sizes filled in for {} of {} uploads without one", filled, missing.size());
        }
    }

    private Optional<ImageDimensions> read(Media media) {
        Optional<Path> file = storage.find(media.getStorageKey());
        if (file.isEmpty()) {
            log.warn("Media row {} has no file on disk; its size stays unknown", media.getId());
            return Optional.empty();
        }
        try {
            return ImageDimensions.read(media.getFormat(), Files.readAllBytes(file.get()));
        } catch (IOException ex) {
            log.warn("Could not read the file of media row {}: {}", media.getId(), ex.getMessage());
            return Optional.empty();
        }
    }
}
