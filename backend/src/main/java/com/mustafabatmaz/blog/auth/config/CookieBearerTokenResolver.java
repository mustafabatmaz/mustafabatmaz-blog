package com.mustafabatmaz.blog.auth.config;

import com.mustafabatmaz.blog.auth.web.AuthCookies;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;

/**
 * Reads the JWT from the httpOnly session cookie instead of the Authorization header.
 * Spring Security has no cookie resolver built in; see
 * https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/bearer-tokens.html
 */
class CookieBearerTokenResolver implements BearerTokenResolver {

    @Override
    public String resolve(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (AuthCookies.SESSION_COOKIE.equals(cookie.getName())
                    && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
