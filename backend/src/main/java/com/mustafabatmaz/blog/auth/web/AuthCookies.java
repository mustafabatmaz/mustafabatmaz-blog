package com.mustafabatmaz.blog.auth.web;

import com.mustafabatmaz.blog.auth.config.AuthProperties;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/** Builds the session cookie that carries the JWT. */
@Component
@RequiredArgsConstructor
public class AuthCookies {

    public static final String SESSION_COOKIE = "access_token";

    // The browser only sends the cookie to admin endpoints, never to the public API
    private static final String COOKIE_PATH = "/api/admin";

    private final AuthProperties properties;

    ResponseCookie session(String token) {
        return base(token).maxAge(properties.jwtTtl()).build();
    }

    ResponseCookie cleared() {
        return base("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(SESSION_COOKIE, value)
                .httpOnly(true)
                .secure(properties.cookieSecure())
                .sameSite("Strict")
                .path(COOKIE_PATH);
    }
}
