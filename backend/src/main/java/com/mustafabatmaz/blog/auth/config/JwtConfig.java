package com.mustafabatmaz.blog.auth.config;

import com.mustafabatmaz.blog.auth.service.JwtTokenService;
import java.util.Base64;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/** HS256 signing and verification with the shared secret from JWT_SECRET. */
@Configuration(proxyBeanMethods = false)
public class JwtConfig {

    private static final int MIN_SECRET_BYTES = 32;

    @Bean
    public JwtEncoder jwtEncoder(AuthProperties properties) {
        return NimbusJwtEncoder.withSecretKey(secretKey(properties)).build();
    }

    @Bean
    public NimbusJwtDecoder jwtDecoder(AuthProperties properties) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey(properties))
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        // Checks signature, expiry and that we issued the token
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(JwtTokenService.ISSUER));
        return decoder;
    }

    private static SecretKey secretKey(AuthProperties properties) {
        byte[] key;
        try {
            key = Base64.getDecoder().decode(properties.jwtSecret());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("JWT_SECRET must be base64 encoded", ex);
        }
        if (key.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("JWT_SECRET must be at least 256 bits (32 bytes) after base64 decoding");
        }
        return new SecretKeySpec(key, "HmacSHA256");
    }
}
