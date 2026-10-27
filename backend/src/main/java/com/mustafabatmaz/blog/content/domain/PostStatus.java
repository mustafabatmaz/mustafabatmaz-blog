package com.mustafabatmaz.blog.content.domain;

/**
 * Only two states. A "scheduled" post is a PUBLISHED one whose publish date is still in the
 * future: visibility is decided at query time, so no background job ever changes a status.
 */
public enum PostStatus {
    DRAFT,
    PUBLISHED
}
