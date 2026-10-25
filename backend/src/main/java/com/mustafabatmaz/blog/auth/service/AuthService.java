package com.mustafabatmaz.blog.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final LoginRateLimiter rateLimiter;
    private final AdminCredentialsVerifier credentialsVerifier;
    private final JwtTokenService tokenService;

    /**
     * Returns a signed token for a valid admin login.
     * Logs every attempt with the client address; credentials are never logged.
     */
    public String login(String username, String password, String clientIp) {
        LoginRateLimiter.Decision decision = rateLimiter.tryAcquire(clientIp);
        if (!decision.allowed()) {
            log.warn("Admin login blocked by rate limit, ip={}", clientIp);
            throw new LoginRateLimitExceededException(decision.retryAfter());
        }
        if (!credentialsVerifier.matches(username, password)) {
            log.warn("Admin login failed, ip={}", clientIp);
            throw new InvalidCredentialsException();
        }
        rateLimiter.reset(clientIp);
        log.info("Admin login succeeded, ip={}", clientIp);
        return tokenService.issue(username);
    }
}
