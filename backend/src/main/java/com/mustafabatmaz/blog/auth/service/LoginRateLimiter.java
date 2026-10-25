package com.mustafabatmaz.blog.auth.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fixed-window attempt counter per client, kept in memory.
 * Fine for a single instance; with more instances the counters must move to a shared store.
 */
public class LoginRateLimiter {

    // Bounds memory if many different clients hit the endpoint
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final Clock clock;
    private final int maxAttempts;
    private final Duration window;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public LoginRateLimiter(Clock clock, int maxAttempts, Duration window) {
        this.clock = clock;
        this.maxAttempts = maxAttempts;
        this.window = window;
    }

    public Decision tryAcquire(String clientKey) {
        Instant now = clock.instant();
        if (windows.size() > MAX_TRACKED_CLIENTS) {
            windows.values().removeIf(w -> w.hasEnded(now, window));
        }
        Window current = windows.compute(
                clientKey,
                (key, existing) -> existing == null || existing.hasEnded(now, window)
                        ? new Window(now, 1)
                        : new Window(existing.start(), existing.attempts() + 1));

        if (current.attempts() <= maxAttempts) {
            return new Decision(true, Duration.ZERO);
        }
        return new Decision(false, Duration.between(now, current.start().plus(window)));
    }

    public void reset(String clientKey) {
        windows.remove(clientKey);
    }

    public record Decision(boolean allowed, Duration retryAfter) {}

    private record Window(Instant start, int attempts) {

        boolean hasEnded(Instant now, Duration window) {
            return !now.isBefore(start.plus(window));
        }
    }
}
