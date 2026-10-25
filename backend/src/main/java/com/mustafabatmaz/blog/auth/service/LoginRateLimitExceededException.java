package com.mustafabatmaz.blog.auth.service;

import com.mustafabatmaz.blog.common.ApiException;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

public class LoginRateLimitExceededException extends ApiException {

    private final Duration retryAfter;

    public LoginRateLimitExceededException(Duration retryAfter) {
        super(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts, try again later");
        this.retryAfter = retryAfter;
    }

    @Override
    public HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        // Whole seconds, rounded up so the client never retries too early
        long seconds = Math.max(1, (retryAfter.toMillis() + 999) / 1000);
        headers.set(HttpHeaders.RETRY_AFTER, String.valueOf(seconds));
        return headers;
    }
}
