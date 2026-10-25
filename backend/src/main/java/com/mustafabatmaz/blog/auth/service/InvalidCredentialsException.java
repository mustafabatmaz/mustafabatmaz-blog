package com.mustafabatmaz.blog.auth.service;

import com.mustafabatmaz.blog.common.ApiException;
import org.springframework.http.HttpStatus;

/** Same message for a wrong username and a wrong password, so neither can be guessed separately. */
public class InvalidCredentialsException extends ApiException {

    public InvalidCredentialsException() {
        super(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
}
