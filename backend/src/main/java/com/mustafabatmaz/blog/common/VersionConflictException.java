package com.mustafabatmaz.blog.common;

import org.springframework.http.HttpStatus;

public class VersionConflictException extends ApiException {

    public VersionConflictException() {
        super(HttpStatus.CONFLICT, "The record was changed elsewhere; reload it and try again");
    }
}
