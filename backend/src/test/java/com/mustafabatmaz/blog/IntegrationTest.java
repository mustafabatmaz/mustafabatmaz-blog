package com.mustafabatmaz.blog;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

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

    // All test classes share one database, so each class clears the tables it uses
    @Autowired
    protected JdbcTemplate jdbc;

    @DynamicPropertySource
    static void authProperties(DynamicPropertyRegistry registry) {
        // Cost 4 keeps the tests fast; production hashes use cost 12
        registry.add("blog.auth.admin-username", () -> ADMIN_USERNAME);
        registry.add("blog.auth.admin-password-hash", () -> new BCryptPasswordEncoder(4).encode(ADMIN_PASSWORD));
        registry.add("blog.auth.jwt-secret", () -> "dGVzdC1vbmx5LWp3dC1zZWNyZXQtZm9yLWludGVncmF0aW9uLXRlc3Rz");
        registry.add("blog.auth.cookie-secure", () -> "false");
    }

    /**
     * An admin request with a JSON body. jwt() signs the request in directly; the real cookie and
     * CSRF flow is covered by the auth tests.
     */
    protected static MockHttpServletRequestBuilder asAdmin(MockHttpServletRequestBuilder request, String json) {
        return asAdmin(request).contentType(MediaType.APPLICATION_JSON).content(json);
    }

    protected static MockHttpServletRequestBuilder asAdmin(MockHttpServletRequestBuilder request) {
        return request.with(jwt().jwt(token -> token.subject(ADMIN_USERNAME))).with(csrf());
    }
}
