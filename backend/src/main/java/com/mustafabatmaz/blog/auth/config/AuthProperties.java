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
        @NotBlank String adminUsername,
        @NotBlank String adminPasswordHash,
        @NotBlank String jwtSecret,
        @NotNull Duration jwtTtl,
        boolean cookieSecure) {}
