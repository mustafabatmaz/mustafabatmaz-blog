package com.mustafabatmaz.blog.common;

import org.springframework.http.HttpStatus;

/** Input that passes field validation but breaks a rule spanning several fields. */
public class BadRequestException extends ApiException {

    public BadRequestException(String detail) {
        super(HttpStatus.BAD_REQUEST, detail);
    }
}
