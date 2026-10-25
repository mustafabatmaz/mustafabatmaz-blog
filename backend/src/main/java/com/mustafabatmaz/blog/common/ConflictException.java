package com.mustafabatmaz.blog.common;

import org.springframework.http.HttpStatus;

/** The request is valid but clashes with existing data, e.g. a slug already in use. */
public class ConflictException extends ApiException {

    public ConflictException(String detail) {
        super(HttpStatus.CONFLICT, detail);
    }
}
