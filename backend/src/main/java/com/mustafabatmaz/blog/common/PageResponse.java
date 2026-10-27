package com.mustafabatmaz.blog.common;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/**
 * One page of a list. Our own shape instead of serialising Spring's Page, whose JSON layout is an
 * implementation detail that may change between versions.
 *
 * @param page 1-based, as in the URL
 */
public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

    /** Builds the response from a page of ids and the items those ids were turned into. */
    public static <T> PageResponse<T> of(Page<?> source, List<T> items) {
        return new PageResponse<>(
                items, source.getNumber() + 1, source.getSize(), source.getTotalElements(), source.getTotalPages());
    }

    public static <S, T> PageResponse<T> map(Page<S> source, Function<S, T> mapper) {
        return of(source, source.getContent().stream().map(mapper).toList());
    }
}
