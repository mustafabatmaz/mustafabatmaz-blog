package com.mustafabatmaz.blog.auth.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mustafabatmaz.blog.IntegrationTest;
import com.mustafabatmaz.blog.auth.service.JwtTokenService;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

class AuthControllerTests extends IntegrationTest {

    private static final String LOGIN = "/api/admin/auth/login";
    private static final String LOGOUT = "/api/admin/auth/logout";
    private static final String ME = "/api/admin/auth/me";
    private static final String SESSION_COOKIE = "access_token";

    // Every test gets its own client IP so rate-limit counters never leak between tests
    private static final AtomicInteger NEXT_IP = new AtomicInteger(1);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Test
    void shouldSetSecureSessionCookie_whenCredentialsAreValid() throws Exception {
        mockMvc.perform(loginRequest(ADMIN_USERNAME, ADMIN_PASSWORD, newClientIp()))
                .andExpect(status().isNoContent())
                .andExpect(cookie().exists(SESSION_COOKIE))
                .andExpect(cookie().httpOnly(SESSION_COOKIE, true))
                .andExpect(cookie().sameSite(SESSION_COOKIE, "Strict"))
                .andExpect(cookie().path(SESSION_COOKIE, "/api/admin"))
                .andExpect(cookie().maxAge(SESSION_COOKIE, 8 * 3600));
    }

    @Test
    void shouldReturnProblemDetail_whenPasswordIsWrong() throws Exception {
        mockMvc.perform(loginRequest(ADMIN_USERNAME, "wrong-password", newClientIp()))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Invalid credentials"))
                .andExpect(cookie().doesNotExist(SESSION_COOKIE));
    }

    @Test
    void shouldGiveSameAnswer_whenUsernameIsWrong() throws Exception {
        mockMvc.perform(loginRequest("not-the-admin", ADMIN_PASSWORD, newClientIp()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid credentials"));
    }

    @Test
    void shouldRejectLogin_whenCsrfTokenIsMissing() throws Exception {
        mockMvc.perform(post(LOGIN)
                        .with(clientIp(newClientIp()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_USERNAME, ADMIN_PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(cookie().doesNotExist(SESSION_COOKIE));
    }

    @Test
    void shouldReturnBadRequest_whenLoginBodyIsInvalid() throws Exception {
        mockMvc.perform(loginRequest("", "", newClientIp()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void shouldRejectWithRetryAfter_whenLoginAttemptsExceedLimit() throws Exception {
        String ip = newClientIp();
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(loginRequest(ADMIN_USERNAME, "wrong-password", ip)).andExpect(status().isUnauthorized());
        }

        // Even the correct password is refused once the limit is reached
        mockMvc.perform(loginRequest(ADMIN_USERNAME, ADMIN_PASSWORD, ip))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(cookie().doesNotExist(SESSION_COOKIE));
    }

    @Test
    void shouldReturnUsername_whenSessionCookieIsValid() throws Exception {
        Cookie session = loginAndGetSessionCookie();

        mockMvc.perform(get(ME).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(ADMIN_USERNAME));
    }

    @Test
    void shouldReturnUnauthorized_whenSessionCookieIsMissing() throws Exception {
        mockMvc.perform(get(ME))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void shouldReturnUnauthorized_whenTokenHasExpired() throws Exception {
        Instant issuedAt = Instant.now().minusSeconds(9 * 3600);
        String expired = encode(JwtClaimsSet.builder()
                .issuer(JwtTokenService.ISSUER)
                .subject(ADMIN_USERNAME)
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(8 * 3600))
                .build());

        mockMvc.perform(get(ME).cookie(new Cookie(SESSION_COOKIE, expired))).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnUnauthorized_whenTokenIsTampered() throws Exception {
        String[] parts = loginAndGetSessionCookie().getValue().split("\\.");
        // Swap in a different payload while keeping the original signature
        String forgedClaims = "{\"iss\":\"%s\",\"sub\":\"intruder\",\"exp\":%d}"
                .formatted(
                        JwtTokenService.ISSUER, Instant.now().plusSeconds(3600).getEpochSecond());
        String forgedPayload =
                Base64.getUrlEncoder().withoutPadding().encodeToString(forgedClaims.getBytes(StandardCharsets.UTF_8));
        String forged = parts[0] + "." + forgedPayload + "." + parts[2];

        mockMvc.perform(get(ME).cookie(new Cookie(SESSION_COOKIE, forged))).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldClearSessionCookie_whenLoggingOut() throws Exception {
        Cookie session = loginAndGetSessionCookie();

        mockMvc.perform(post(LOGOUT).with(csrf()).cookie(session))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge(SESSION_COOKIE, 0));
    }

    @Test
    void shouldAllowHealthCheck_withoutAuthentication() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void shouldNotRequireAuthentication_whenReadingPublicApi() throws Exception {
        // No public endpoints exist yet: 404 (not 401) proves the path is open
        mockMvc.perform(get("/api/public/does-not-exist")).andExpect(status().isNotFound());
    }

    @Test
    void shouldDenyAccess_whenPathIsNotConfigured() throws Exception {
        mockMvc.perform(get("/api/something-else")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldSendSecurityHeaders_onApiResponses() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(header().string("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    private Cookie loginAndGetSessionCookie() throws Exception {
        MvcResult result = mockMvc.perform(loginRequest(ADMIN_USERNAME, ADMIN_PASSWORD, newClientIp()))
                .andExpect(status().isNoContent())
                .andReturn();
        Cookie session = result.getResponse().getCookie(SESSION_COOKIE);
        assertThat(session).isNotNull();
        return session;
    }

    private MockHttpServletRequestBuilder loginRequest(String username, String password, String ip) {
        return post(LOGIN)
                .with(csrf())
                .with(clientIp(ip))
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(username, password));
    }

    private static String loginJson(String username, String password) {
        return "{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, password);
    }

    private String encode(JwtClaimsSet claims) {
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private static String newClientIp() {
        return "10.0.0." + NEXT_IP.getAndIncrement();
    }

    private static RequestPostProcessor clientIp(String ip) {
        return request -> {
            request.setRemoteAddr(ip);
            return request;
        };
    }
}
