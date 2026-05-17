package com.elearning.dto;

import lombok.Data;

// Data Transfer Object: what the client sends for login/register
// This avoids exposing the full User entity to the frontend
public class AuthDTO {

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String role; // "STUDENT" or "TEACHER"
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class UpdateProfileRequest {
        private String name;           // new name (optional)
        private String email;          // new email (optional)
        private String currentPassword; // REQUIRED — must verify identity
        private String newPassword;     // new password (optional)
    }

    @Data
    public static class AuthResponse {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String token; // simple session token

        public AuthResponse(Long id, String name, String email, String role, String token) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.role = role;
            this.token = token;
        }
    }

    @Data
    public static class ForgotPasswordRequest {
        private String email;
    }

    @Data
    public static class VerifyCodeRequest {
        private String email;
        private String code;
    }

    @Data
    public static class ResetPasswordRequest {
        private String email;
        private String code;
        private String newPassword;
    }

    @Data
    public static class DeleteAccountRequest {
        private String password;
    }
}
