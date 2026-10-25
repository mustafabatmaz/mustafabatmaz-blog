package com.mustafabatmaz.blog.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class LoginRateLimiterTest {

    private static final int MAX_ATTEMPTS = 10;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final MutableClock clock = new MutableClock(Instant.parse("2026-10-25T10:00:00Z"));
    private final LoginRateLimiter limiter = new LoginRateLimiter(clock, MAX_ATTEMPTS, WINDOW);

    @Test
    void shouldAllowAttempts_whenUnderLimit() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            assertThat(limiter.tryAcquire("10.0.0.1").allowed()).isTrue();
        }
    }

    @Test
    void shouldRejectAttempt_whenLimitIsExceeded() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.tryAcquire("10.0.0.1");
        }

        LoginRateLimiter.Decision decision = limiter.tryAcquire("10.0.0.1");

        assertThat(decision.allowed()).isFalse();
        assertThat(decision.retryAfter()).isEqualTo(WINDOW);
    }

    @Test
    void shouldReportRemainingTime_whenRejectedMidWindow() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.tryAcquire("10.0.0.1");
        }
        clock.advance(Duration.ofMinutes(5));

        LoginRateLimiter.Decision decision = limiter.tryAcquire("10.0.0.1");

        assertThat(decision.retryAfter()).isEqualTo(Duration.ofMinutes(10));
    }

    @Test
    void shouldAllowAgain_whenWindowHasPassed() {
        for (int i = 0; i < MAX_ATTEMPTS + 1; i++) {
            limiter.tryAcquire("10.0.0.1");
        }
        clock.advance(WINDOW);

        assertThat(limiter.tryAcquire("10.0.0.1").allowed()).isTrue();
    }

    @Test
    void shouldStartFresh_whenCounterIsReset() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.tryAcquire("10.0.0.1");
        }

        limiter.reset("10.0.0.1");

        assertThat(limiter.tryAcquire("10.0.0.1").allowed()).isTrue();
    }

    @Test
    void shouldCountClientsSeparately_whenKeysDiffer() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.tryAcquire("10.0.0.1");
        }

        assertThat(limiter.tryAcquire("10.0.0.2").allowed()).isTrue();
    }

    private static final class MutableClock extends Clock {

        private Instant now;

        private MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
