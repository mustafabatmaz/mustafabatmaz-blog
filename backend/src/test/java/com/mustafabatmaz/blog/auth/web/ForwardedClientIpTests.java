package com.mustafabatmaz.blog.auth.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafabatmaz.blog.IntegrationTest;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

/**
 * Behind nginx every request comes from the proxy's address; the client is in X-Forwarded-For. Tomcat's
 * RemoteIpValve only runs in a real server, so this goes over HTTP. The test client connects from 127.0.0.1,
 * which Tomcat trusts as an internal proxy, just like nginx on the compose network.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ForwardedClientIpTests extends IntegrationTest {

    private final HttpClient http = HttpClient.newHttpClient();

    @Autowired
    private Environment environment;

    @Test
    void shouldLimitLoginAttemptsPerForwardedClient_whenRequestsComeThroughProxy() throws Exception {
        String csrfToken = fetchCsrfToken();

        for (int attempt = 1; attempt <= 10; attempt++) {
            assertThat(wrongLogin(csrfToken, "203.0.113.1").statusCode()).isEqualTo(401);
        }
        assertThat(wrongLogin(csrfToken, "203.0.113.1").statusCode()).isEqualTo(429);

        // Another client behind the same proxy is not locked out
        assertThat(wrongLogin(csrfToken, "203.0.113.2").statusCode()).isEqualTo(401);
    }

    private HttpResponse<String> wrongLogin(String csrfToken, String clientIp) throws Exception {
        String body = "{\"username\":\"%s\",\"password\":\"wrong-password\"}".formatted(ADMIN_USERNAME);
        return send(HttpRequest.newBuilder(uri("/api/admin/auth/login"))
                .header("Content-Type", "application/json")
                .header("Cookie", "XSRF-TOKEN=" + csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .header("X-Forwarded-For", clientIp)
                .POST(HttpRequest.BodyPublishers.ofString(body)));
    }

    private String fetchCsrfToken() throws Exception {
        HttpResponse<String> response =
                send(HttpRequest.newBuilder(uri("/api/admin/auth/me")).GET());
        String cookie = response.headers().allValues("Set-Cookie").stream()
                .filter(c -> c.startsWith("XSRF-TOKEN="))
                .findFirst()
                .orElseThrow();
        return cookie.substring("XSRF-TOKEN=".length(), cookie.indexOf(';'));
    }

    private HttpResponse<String> send(HttpRequest.Builder request) throws IOException, InterruptedException {
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + environment.getProperty("local.server.port") + path);
    }
}
