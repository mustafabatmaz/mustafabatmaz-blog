package com.mustafabatmaz.blog.revalidation.config;

import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.time.Duration;
import org.jspecify.annotations.Nullable;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * @param url public-web's address as the backend reaches it (PUBLIC_WEB_URL)
 * @param secret shared with public-web (REVALIDATE_SECRET); without it revalidation is off
 * @param timeout for connecting and for the answer; a slow public-web never holds anything up
 */
@Validated
@ConfigurationProperties(prefix = "blog.revalidation")
public record RevalidationProperties(
        @NotNull URI url,
        @Nullable String secret,
        @DefaultValue("5s") Duration timeout) {

    public boolean enabled() {
        return secret != null && !secret.isBlank();
    }
}
