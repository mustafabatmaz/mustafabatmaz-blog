package com.mustafabatmaz.blog.auth.config;

import com.mustafabatmaz.blog.auth.service.LoginRateLimiter;
import java.time.Clock;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.servlet.HandlerExceptionResolver;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(AuthProperties.class)
class SecurityConfig {

    private static final String[] API_DOCS = {"/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"};

    /** Swagger UI needs scripts, so it gets its own chain without the strict API CSP. */
    @Bean
    @Order(1)
    SecurityFilterChain apiDocsSecurityFilterChain(HttpSecurity http) throws Exception {
        http.securityMatcher(API_DOCS)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain apiSecurityFilterChain(
            HttpSecurity http, @Qualifier("handlerExceptionResolver") HandlerExceptionResolver exceptionResolver)
            throws Exception {
        // Security errors are rendered by GlobalExceptionHandler, so they are ProblemDetails too
        AuthenticationEntryPoint entryPoint =
                (request, response, ex) -> exceptionResolver.resolveException(request, response, null, ex);
        AccessDeniedHandler accessDeniedHandler =
                (request, response, ex) -> exceptionResolver.resolveException(request, response, null, ex);

        http.authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.GET, "/api/public/**")
                        .permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/auth/login")
                        .permitAll()
                        .requestMatchers("/api/admin/**")
                        .authenticated()
                        .requestMatchers("/error")
                        .permitAll()
                        // Anything not listed above is closed by default
                        .anyRequest()
                        .denyAll())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // XSRF-TOKEN cookie + X-XSRF-TOKEN header; see
                // https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript-spa
                .csrf(csrf -> csrf.spa())
                .oauth2ResourceServer(oauth2 -> oauth2.bearerTokenResolver(new CookieBearerTokenResolver())
                        .jwt(Customizer.withDefaults())
                        .authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .exceptionHandling(exceptions ->
                        exceptions.authenticationEntryPoint(entryPoint).accessDeniedHandler(accessDeniedHandler))
                // The API only returns JSON, so nothing may be loaded or framed
                .headers(headers -> headers.contentSecurityPolicy(
                        csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'")))
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    LoginRateLimiter loginRateLimiter(Clock clock) {
        return new LoginRateLimiter(clock, 10, Duration.ofMinutes(15));
    }
}
