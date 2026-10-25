package com.mustafabatmaz.blog.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafabatmaz.blog.auth.config.AuthProperties;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class AdminCredentialsVerifierTest {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final AuthProperties properties =
            new AuthProperties("admin", encoder.encode("s3cret"), "unused-in-this-test", Duration.ofHours(8), false);
    private final AdminCredentialsVerifier verifier = new AdminCredentialsVerifier(encoder, properties);

    @Test
    void shouldAccept_whenUsernameAndPasswordMatch() {
        assertThat(verifier.matches("admin", "s3cret")).isTrue();
    }

    @Test
    void shouldReject_whenPasswordIsWrong() {
        assertThat(verifier.matches("admin", "wrong")).isFalse();
    }

    @Test
    void shouldReject_whenUsernameIsWrong() {
        assertThat(verifier.matches("someone-else", "s3cret")).isFalse();
    }
}
