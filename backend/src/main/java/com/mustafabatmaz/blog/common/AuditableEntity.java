package com.mustafabatmaz.blog.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import java.time.Instant;
import lombok.Getter;

/**
 * Timestamps and optimistic-lock version for every aggregate root.
 *
 * <p>Timestamps are set explicitly through {@link #touch} rather than with Spring Data auditing:
 * auditing only fires when the root's own columns change, so editing just a translation would
 * neither move {@code updatedAt} nor bump the version.
 */
@Getter
@MappedSuperclass
public abstract class AuditableEntity {

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // A wrapper, not long: null marks a new row, so save() persists instead of merging.
    // With a primitive 0, Hibernate treats a new entity with an assigned id as detached.
    @Version
    private Long version;

    /** Call on every create and update. */
    public void touch(Instant now) {
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    /** Rejects an update that was based on an older copy of this record. */
    public void checkVersion(Long expectedVersion) {
        if (expectedVersion == null || !expectedVersion.equals(version)) {
            throw new VersionConflictException();
        }
    }
}
