package com.mustafabatmaz.blog.auth.service;

import com.mustafabatmaz.blog.auth.config.AuthProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Checks a login against the single admin account configured in the environment. */
@Component
public class AdminCredentialsVerifier {

    private final PasswordEncoder passwordEncoder;
    private final AuthProperties properties;
    private final String dummyHash;

    public AdminCredentialsVerifier(PasswordEncoder passwordEncoder, AuthProperties properties) {
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
        // Compared against when the username is wrong, so both cases take the same time
        this.dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    public boolean matches(String username, String password) {
        boolean usernameMatches = MessageDigest.isEqual(
                username.getBytes(StandardCharsets.UTF_8),
                properties.adminUsername().getBytes(StandardCharsets.UTF_8));
        String hash = usernameMatches ? properties.adminPasswordHash() : dummyHash;
        boolean passwordMatches = passwordEncoder.matches(password, hash);
        return usernameMatches && passwordMatches;
    }
}
