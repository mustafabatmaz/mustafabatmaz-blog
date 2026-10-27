package com.mustafabatmaz.blog.content.repository;

/** A tag with how many visible posts in one language carry it. */
public record TagCount(String name, String slug, long postCount) {}
