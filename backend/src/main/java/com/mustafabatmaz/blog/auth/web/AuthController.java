package com.mustafabatmaz.blog.auth.web;

import com.mustafabatmaz.blog.auth.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
@Tag(name = "auth")
@RequiredArgsConstructor
class AuthController {

    private final AuthService authService;
    private final AuthCookies authCookies;

    // @ResponseStatus documents the 204 in the OpenAPI spec; springdoc cannot see ResponseEntity.noContent()
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    ResponseEntity<Void> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String token = authService.login(request.username(), request.password(), httpRequest.getRemoteAddr());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, authCookies.session(token).toString())
                .build();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, authCookies.cleared().toString())
                .build();
    }

    @GetMapping("/me")
    MeResponse me(@AuthenticationPrincipal Jwt jwt) {
        return new MeResponse(jwt.getSubject());
    }
}
