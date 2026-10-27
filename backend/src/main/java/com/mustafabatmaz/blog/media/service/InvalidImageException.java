package com.mustafabatmaz.blog.media.service;

import com.mustafabatmaz.blog.common.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidImageException extends ApiException {

    public InvalidImageException(String detail) {
        super(HttpStatus.UNSUPPORTED_MEDIA_TYPE, detail);
    }
}
