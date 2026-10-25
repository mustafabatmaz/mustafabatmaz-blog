package com.mustafabatmaz.blog.auth.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafabatmaz.blog.IntegrationTest;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

/**
 * The CSRF flow exactly as the admin SPA will use it, over real HTTP.
 * MockMvc can't cover this: Spring Security's test support swaps in a session-based
 * CSRF repository and the csrf() helper skips the token check entirely.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CsrfFlowTests extends IntegrationTest {

    private final HttpClient http = HttpClient.newHttpClient();

    @Autowired
    private Environment environment;

    @Test
    void shouldIssueJavaScriptReadableCsrfCookie_whenAdminPanelChecksSession() throws Exception {
        HttpResponse<String> response =
                send(HttpRequest.newBuilder(uri("/api/admin/auth/me")).GET());

        assertThat(response.statusCode()).isEqualTo(401);
        String csrfCookie = setCookie(response, "XSRF-TOKEN");
        assertThat(csrfCookie).doesNotContainIgnoringCase("HttpOnly");
    }

    @Test
    void shouldLogIn_whenCsrfTokenFromCookieIsSentAsHeader() throws Exception {
        String csrfToken = fetchCsrfToken();

        HttpResponse<String> response =
                send(loginRequest().header("Cookie", "XSRF-TOKEN=" + csrfToken).header("X-XSRF-TOKEN", csrfToken));

        assertThat(response.statusCode()).isEqualTo(204);
        assertThat(setCookie(response, AuthCookies.SESSION_COOKIE)).containsIgnoringCase("HttpOnly");
    }

    @Test
    void shouldRejectLogin_whenCsrfHeaderIsMissing() throws Exception {
        String csrfToken = fetchCsrfToken();

        // Cookie alone is what a cross-site attacker could get the browser to send
        HttpResponse<String> response = send(loginRequest().header("Cookie", "XSRF-TOKEN=" + csrfToken));

        assertThat(response.statusCode()).isEqualTo(403);
    }

    private String fetchCsrfToken() throws Exception {
        HttpResponse<String> response =
                send(HttpRequest.newBuilder(uri("/api/admin/auth/me")).GET());
        String cookie = setCookie(response, "XSRF-TOKEN");
        return cookie.substring("XSRF-TOKEN=".length(), cookie.indexOf(';'));
    }

    private HttpRequest.Builder loginRequest() {
        String body = "{\"username\":\"%s\",\"password\":\"%s\"}".formatted(ADMIN_USERNAME, ADMIN_PASSWORD);
        return HttpRequest.newBuilder(uri("/api/admin/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body));
    }

    private static String setCookie(HttpResponse<String> response, String name) {
        List<String> cookies = response.headers().allValues("Set-Cookie");
        return cookies.stream()
                .filter(c -> c.startsWith(name + "="))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No Set-Cookie for " + name + " in " + cookies));
    }

    private HttpResponse<String> send(HttpRequest.Builder request) throws IOException, InterruptedException {
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + environment.getProperty("local.server.port") + path);
    }
}
