package com.mustafabatmaz.blog.common;

import java.net.URI;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

/**
 * Base for errors a module wants to return to the client as a ProblemDetail.
 * The message is the client-facing detail, so it must never contain internals.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final URI type;

    protected ApiException(HttpStatus status, String detail) {
        this(status, detail, null);
    }

    /** With a problem type, for errors a client must tell apart from others with the same status. */
    protected ApiException(HttpStatus status, String detail, URI type) {
        super(detail);
        this.status = status;
        this.type = type;
    }

    public HttpStatus getStatus() {
        return status;
    }

    /** The ProblemDetail "type", or null for the default "about:blank". */
    public URI getType() {
        return type;
    }

    /** Extra response headers, e.g. Retry-After. */
    public HttpHeaders getHeaders() {
        return new HttpHeaders();
    }

    /** Extension members of the problem detail (RFC 9457 §3.2), rendered next to "type" and "detail". */
    public Map<String, Object> getProperties() {
        return Map.of();
    }
}
