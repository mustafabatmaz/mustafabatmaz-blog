package com.mustafabatmaz.blog.revalidation.web;

import com.mustafabatmaz.blog.revalidation.service.PublicSiteRevalidator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.core.task.TaskExecutor;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * "The admin changed something" is exactly "an admin write request succeeded", so this one place covers every
 * admin endpoint, including future ones (6a decision 2). afterCompletion runs once the service's transaction
 * has committed, so public-web never reads data that might still roll back. The call runs in the background:
 * the admin's response doesn't wait for public-web.
 */
@RequiredArgsConstructor
public class RevalidationInterceptor implements HandlerInterceptor {

    private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final PublicSiteRevalidator revalidator;
    private final TaskExecutor executor;

    @Override
    public void afterCompletion(
            HttpServletRequest request, HttpServletResponse response, Object handler, @Nullable Exception ex) {
        boolean succeeded = ex == null && response.getStatus() >= 200 && response.getStatus() < 300;
        if (succeeded && WRITE_METHODS.contains(request.getMethod()) && revalidator.enabled()) {
            executor.execute(revalidator::revalidate);
        }
    }
}
