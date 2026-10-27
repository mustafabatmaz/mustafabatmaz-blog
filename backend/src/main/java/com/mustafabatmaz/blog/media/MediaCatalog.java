package com.mustafabatmaz.blog.media;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

/**
 * What other modules may know about uploaded images. Lives in the module's base package, which
 * Spring Modulith treats as its public API; everything in the sub-packages stays internal.
 */
public interface MediaCatalog {

    Optional<MediaReference> find(long id);

    /** Ids without a matching image are left out of the result. The map may be immutable. */
    Map<Long, MediaReference> findAll(Collection<Long> ids);
}
