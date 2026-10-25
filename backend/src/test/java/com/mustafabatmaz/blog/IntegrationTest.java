package com.mustafabatmaz.blog;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Base for tests that start the full application against a Testcontainers PostgreSQL.
 * Provides test-only admin credentials so no real secret is needed.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public abstract class IntegrationTest {

    protected static final String ADMIN_USERNAME = "admin";
    protected static final String ADMIN_PASSWORD = "correct-horse-battery-staple";

    @DynamicPropertySource
    static void authProperties(DynamicPropertyRegistry registry) {
        // Cost 4 keeps the tests fast; production hashes use cost 12
        registry.add("blog.auth.admin-username", () -> ADMIN_USERNAME);
        registry.add("blog.auth.admin-password-hash", () -> new BCryptPasswordEncoder(4).encode(ADMIN_PASSWORD));
        registry.add("blog.auth.jwt-secret", () -> "dGVzdC1vbmx5LWp3dC1zZWNyZXQtZm9yLWludGVncmF0aW9uLXRlc3Rz");
        registry.add("blog.auth.cookie-secure", () -> "false");
    }
}
