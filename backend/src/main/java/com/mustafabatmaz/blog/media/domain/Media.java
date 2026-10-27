package com.mustafabatmaz.blog.media.domain;

import com.mustafabatmaz.blog.common.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** An uploaded image. The bytes live on disk under {@link #storageKey}; this row describes them. */
@Entity
@Table(name = "media")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Media extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** File name on disk and in the public URL: a random UUID plus the extension of {@link #format}. */
    @Column(name = "storage_key", nullable = false, updatable = false)
    private String storageKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private ImageFormat format;

    @Column(name = "size_bytes", nullable = false, updatable = false)
    private long sizeBytes;

    /** Shown only in the admin panel, to recognise the upload. */
    @Column(name = "original_filename", updatable = false)
    private String originalFilename;

    /** False for formats we can't clean (AVIF); the admin panel warns about these. */
    @Column(name = "metadata_stripped", nullable = false, updatable = false)
    private boolean metadataStripped;

    @OneToMany(mappedBy = "media", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MediaTranslation> translations = new ArrayList<>();

    public Media(
            String storageKey, ImageFormat format, long sizeBytes, String originalFilename, boolean metadataStripped) {
        this.storageKey = storageKey;
        this.format = format;
        this.sizeBytes = sizeBytes;
        this.originalFilename = originalFilename;
        this.metadataStripped = metadataStripped;
    }
}
