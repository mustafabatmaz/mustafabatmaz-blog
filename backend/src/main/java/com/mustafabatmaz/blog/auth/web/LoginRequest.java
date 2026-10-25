package com.mustafabatmaz.blog.auth.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(max = 100) String username,
        @NotBlank @Size(max = 200) String password) {

    // Keeps the password out of logs if this object is ever printed
    @Override
    public String toString() {
        return "LoginRequest[username=" + username + ", password=***]";
    }
}
