package com.mustafabatmaz.blog.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafabatmaz.blog.auth.config.AuthProperties;
import com.mustafabatmaz.blog.auth.config.JwtConfig;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

class JwtTokenServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-25T10:00:00Z");

    private final AuthProperties properties = new AuthProperties(
            "admin", "unused", "dGVzdC1vbmx5LWp3dC1zZWNyZXQtZm9yLXVuaXQtdGVzdHMtMTIzNDU=", Duration.ofHours(8), false);
    private final JwtConfig jwtConfig = new JwtConfig();
    private final JwtTokenService tokenService =
            new JwtTokenService(jwtConfig.jwtEncoder(properties), properties, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void shouldIssueToken_withSubjectIssuerAndConfiguredLifetime() {
        String token = tokenService.issue("admin");

        Jwt jwt = decoderIgnoringExpiry().decode(token);
        assertThat(jwt.getSubject()).isEqualTo("admin");
        assertThat(jwt.getClaimAsString("iss")).isEqualTo(JwtTokenService.ISSUER);
        assertThat(jwt.getIssuedAt()).isEqualTo(NOW);
        assertThat(jwt.getExpiresAt()).isEqualTo(NOW.plus(Duration.ofHours(8)));
    }

    // The token is issued at a fixed time in the past, so the timestamp check is skipped here
    private NimbusJwtDecoder decoderIgnoringExpiry() {
        NimbusJwtDecoder decoder = jwtConfig.jwtDecoder(properties);
        decoder.setJwtValidator(jwt -> OAuth2TokenValidatorResult.success());
        return decoder;
    }
}
