package com.mustafabatmaz.blog.common;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

/**
 * Base for errors a module wants to return to the client as a ProblemDetail.
 * The message is the client-facing detail, so it must never contain internals.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;

    protected ApiException(HttpStatus status, String detail) {
        super(detail);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    /** Extra response headers, e.g. Retry-After. */
    public HttpHeaders getHeaders() {
        return new HttpHeaders();
    }
}
