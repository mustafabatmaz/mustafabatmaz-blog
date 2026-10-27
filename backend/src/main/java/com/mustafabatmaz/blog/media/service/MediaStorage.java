package com.mustafabatmaz.blog.media.service;

import com.mustafabatmaz.blog.media.config.MediaProperties;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Reads and writes image files inside the media folder, and nowhere else. */
@Slf4j
@Component
public class MediaStorage {

    // Only names we generate ourselves: a UUID and one of our extensions
    private static final Pattern KEY =
            Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp|avif)$");

    private final Path root;

    public MediaStorage(MediaProperties properties) {
        this.root = properties.dir().toAbsolutePath().normalize();
    }

    /** Writes to a temporary file first and then moves it, so a half-written file is never visible. */
    public void write(String key, byte[] data) {
        Path target = resolve(key).orElseThrow(() -> new IllegalArgumentException("Invalid storage key"));
        try {
            Files.createDirectories(root);
            Path temporary = Files.createTempFile(root, "upload-", ".tmp");
            Files.write(temporary, data);
            Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not store " + key, ex);
        }
    }

    public Optional<Path> find(String key) {
        return resolve(key).filter(Files::isRegularFile);
    }

    public void delete(String key) {
        resolve(key).ifPresent(path -> {
            try {
                Files.deleteIfExists(path);
            } catch (IOException ex) {
                // The row is already gone; a leftover file is harmless and can be cleaned up by hand
                log.warn("Could not delete media file {}", path, ex);
            }
        });
    }

    /**
     * The file for a key, or empty when the key is not one of ours. Two checks: the strict pattern
     * rejects anything like "../", and the resolved path must sit directly inside the media folder.
     */
    private Optional<Path> resolve(String key) {
        if (key == null || !KEY.matcher(key).matches()) {
            return Optional.empty();
        }
        Path path = root.resolve(key).normalize();
        return root.equals(path.getParent()) ? Optional.of(path) : Optional.empty();
    }
}
