package com.mustafabatmaz.blog.common;

import java.net.URI;
import org.springframework.http.HttpStatus;

/** The request is valid but clashes with existing data, e.g. a slug already in use. */
public class ConflictException extends ApiException {

    public ConflictException(String detail) {
        super(HttpStatus.CONFLICT, detail);
    }

    public ConflictException(String detail, URI type) {
        super(HttpStatus.CONFLICT, detail, type);
    }
}
