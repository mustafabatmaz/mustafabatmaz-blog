package com.mustafabatmaz.blog.media.service;

import com.mustafabatmaz.blog.common.BadRequestException;
import com.mustafabatmaz.blog.common.ConflictException;
import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.NotFoundException;
import com.mustafabatmaz.blog.common.ProblemTypes;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.media.config.MediaProperties;
import com.mustafabatmaz.blog.media.domain.ImageFormat;
import com.mustafabatmaz.blog.media.domain.Media;
import com.mustafabatmaz.blog.media.domain.MediaTranslation;
import com.mustafabatmaz.blog.media.repository.MediaRepository;
import com.mustafabatmaz.blog.media.web.MediaDtos;
import com.mustafabatmaz.blog.media.web.MediaDtos.MediaAdminRequest;
import com.mustafabatmaz.blog.media.web.MediaDtos.MediaAdminResponse;
import com.mustafabatmaz.blog.media.web.MediaDtos.MediaTranslationDto;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaRepository repository;
    private final MediaStorage storage;
    private final MetadataStripper metadataStripper;
    private final MediaMapper mapper;
    private final MediaProperties properties;
    private final Clock clock;

    public record StoredFile(Path path, ImageFormat format, long sizeBytes) {}

    /**
     * Checks the upload by its content, removes metadata, writes the file and records it.
     * If the database part fails, the file written for it is deleted again.
     */
    @Transactional
    public MediaAdminResponse upload(MultipartFile file, String altTr, String altEn) {
        if (file.isEmpty()) {
            throw new BadRequestException("The file is empty");
        }
        if (file.getSize() > properties.maxFileSize().toBytes()) {
            throw new FileTooLargeException(
                    "Images can be at most " + properties.maxFileSize().toMegabytes() + " MB");
        }
        byte[] bytes = readBytes(file);
        ImageFormat format = ImageFormat.detect(bytes)
                .orElseThrow(() -> new InvalidImageException("Only JPEG, PNG, WebP and AVIF images are accepted"));
        MetadataStripper.Result cleaned = metadataStripper.strip(format, bytes);

        String key = UUID.randomUUID() + "." + format.extension();
        storage.write(key, cleaned.data());
        deleteFileUnlessCommitted(key);

        Media media = new Media(
                key, format, cleaned.data().length, fileNameOnly(file.getOriginalFilename()), cleaned.stripped());
        applyAltTexts(media, altTextsFromForm(altTr, altEn));
        media.touch(clock.instant());
        return mapper.toAdminResponse(repository.saveAndFlush(media));
    }

    @Transactional(readOnly = true)
    public List<MediaAdminResponse> list() {
        return mapper.toAdminResponses(repository.findAllByOrderByCreatedAtDescIdDesc());
    }

    @Transactional
    public MediaAdminResponse update(long id, MediaAdminRequest request) {
        Media media = load(id);
        media.checkVersion(request.version());
        applyAltTexts(media, request.translations());
        media.touch(clock.instant());
        return mapper.toAdminResponse(repository.saveAndFlush(media));
    }

    /**
     * Rejected with 409 while a post still uses the image (foreign key). This module can't know which post
     * (content depends on media, not the other way round), so the database constraint is the check. The file
     * is removed only after the row is gone for good, so a failed delete never leaves a row without its file.
     */
    @Transactional
    public void delete(long id) {
        Media media = load(id);
        repository.delete(media);
        try {
            repository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("The image is in use and can't be deleted", ProblemTypes.MEDIA_IN_USE);
        }
        String key = media.getStorageKey();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                storage.delete(key);
            }
        });
    }

    @Transactional(readOnly = true)
    public StoredFile find(String storageKey) {
        Media media =
                repository.findByStorageKey(storageKey).orElseThrow(() -> new NotFoundException("Image not found"));
        Path path = storage.find(storageKey).orElseThrow(() -> {
            log.warn("Media row {} has no file on disk", media.getId());
            return new NotFoundException("Image not found");
        });
        return new StoredFile(path, media.getFormat(), media.getSizeBytes());
    }

    private void deleteFileUnlessCommitted(String key) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    storage.delete(key);
                }
            }
        });
    }

    private void applyAltTexts(Media media, List<MediaTranslationDto> altTexts) {
        Translations.sync(
                media.getTranslations(),
                altTexts,
                MediaTranslationDto::lang,
                t -> new MediaTranslation(media, t.lang(), t.altText()),
                (existing, t) -> existing.update(t.altText()));
    }

    private static List<MediaTranslationDto> altTextsFromForm(String altTr, String altEn) {
        List<MediaTranslationDto> altTexts = new ArrayList<>();
        addIfPresent(altTexts, Language.TR, altTr);
        addIfPresent(altTexts, Language.EN, altEn);
        return altTexts;
    }

    private static void addIfPresent(List<MediaTranslationDto> altTexts, Language language, String altText) {
        if (altText == null || altText.isBlank()) {
            return;
        }
        if (altText.length() > MediaDtos.MAX_ALT_TEXT_LENGTH) {
            throw new BadRequestException("Alt text can be at most " + MediaDtos.MAX_ALT_TEXT_LENGTH + " characters");
        }
        altTexts.add(new MediaTranslationDto(language, altText.trim()));
    }

    /** Browsers may send a full path ("C:\Users\..."); keep only the last part, without control characters. */
    private static String fileNameOnly(String original) {
        if (original == null) {
            return null;
        }
        String name = original.substring(Math.max(original.lastIndexOf('/'), original.lastIndexOf('\\')) + 1);
        name = name.replaceAll("\\p{Cntrl}", "").trim();
        return name.isEmpty() ? null : name.substring(0, Math.min(name.length(), 255));
    }

    private static byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private Media load(long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Image not found"));
    }
}
