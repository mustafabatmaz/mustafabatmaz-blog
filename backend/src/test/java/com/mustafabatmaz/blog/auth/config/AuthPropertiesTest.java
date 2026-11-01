package com.mustafabatmaz.blog.auth.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

/**
 * A missing secret must stop the app with a message that names the variable. An unresolved ${JWT_SECRET} used
 * to reach the code as literal text and fail later as "must be base64 encoded" (or, for the password hash, make
 * every login fail without a word).
 */
class AuthPropertiesTest {

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(AuthProperties.class)
    static class Properties {}

    // application.yml, as the app reads it, with nothing from the environment
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(Properties.class);

    @Test
    void shouldNameEachMissingSecret_whenTheEnvironmentLacksThem() {
        assumeTrue(
                System.getenv("JWT_SECRET") == null
                        && System.getenv("ADMIN_USERNAME") == null
                        && System.getenv("ADMIN_PASSWORD_HASH") == null,
                "the secrets are set in this environment");

        runner.run(context -> {
            assertThat(context).hasFailed();
            String message = rootMessage(context.getStartupFailure());
            assertThat(message)
                    .contains("JWT_SECRET is not set")
                    .contains("ADMIN_USERNAME is not set")
                    .contains("ADMIN_PASSWORD_HASH is not set");
        });
    }

    @Test
    void shouldStart_whenTheSecretsAreSet() {
        runner.withPropertyValues(
                        "blog.auth.admin-username=admin",
                        "blog.auth.admin-password-hash=hash",
                        "blog.auth.jwt-secret=c2VjcmV0")
                .run(context -> assertThat(context).hasNotFailed());
    }

    private static String rootMessage(Throwable failure) {
        StringBuilder messages = new StringBuilder();
        for (Throwable t = failure; t != null; t = t.getCause()) {
            messages.append(t.getMessage()).append('\n');
        }
        return messages.toString();
    }
}
