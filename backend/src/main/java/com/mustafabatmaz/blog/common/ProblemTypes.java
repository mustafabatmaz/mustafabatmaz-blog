package com.mustafabatmaz.blog.common;

import java.net.URI;

/**
 * Problem types for errors a client must tell apart (RFC 9457: clients use "type", never "detail"). Absolute URIs
 * that don't resolve yet; the RFC allows that, and keeping them stable avoids a breaking change later.
 */
public final class ProblemTypes {

    /** The record was saved elsewhere since it was loaded: reload it. */
    public static final URI VERSION_CONFLICT = URI.create("https://mustafabatmaz.com/problems/version-conflict");

    /** Another record already uses this slug: pick a different one. */
    public static final URI SLUG_TAKEN = URI.create("https://mustafabatmaz.com/problems/slug-taken");

    /** Another record (e.g. a post's cover) still points at this image, so it can't be deleted. */
    public static final URI MEDIA_IN_USE = URI.create("https://mustafabatmaz.com/problems/media-in-use");

    private ProblemTypes() {}
}
