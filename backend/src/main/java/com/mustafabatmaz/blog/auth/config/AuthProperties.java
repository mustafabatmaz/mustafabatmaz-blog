package com.mustafabatmaz.blog.auth.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Admin credentials and token settings, all supplied through the environment (.env).
 *
 * @param jwtSecret base64-encoded HMAC key, at least 256 bits
 */
@Validated
@ConfigurationProperties(prefix = "blog.auth")
public record AuthProperties(
        @NotBlank(message = "ADMIN_USERNAME is not set (infra/.env)")
        String adminUsername,

        @NotBlank(message = "ADMIN_PASSWORD_HASH is not set (infra/.env)")
        String adminPasswordHash,

        @NotBlank(message = "JWT_SECRET is not set (infra/.env)")
        String jwtSecret,

        @NotNull Duration jwtTtl,
        boolean cookieSecure) {}
