package com.mustafabatmaz.blog.media.service;

import com.mustafabatmaz.blog.common.ApiException;
import org.springframework.http.HttpStatus;

public class FileTooLargeException extends ApiException {

    public FileTooLargeException(String detail) {
        super(HttpStatus.PAYLOAD_TOO_LARGE, detail);
    }
}
