package com.elearning.controller;

import com.elearning.dto.AuthDTO;
import com.elearning.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthDTO.RegisterRequest request) {
        try {
            AuthDTO.AuthResponse response = userService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDTO.LoginRequest request) {
        try {
            AuthDTO.AuthResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/auth/profile — update user profile (requires current password)
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody AuthDTO.UpdateProfileRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            Long userId = userService.getUserIdFromToken(token);
            AuthDTO.AuthResponse response = userService.updateProfile(userId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/auth/me — get current user info from token
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            Long userId = userService.getUserIdFromToken(token);
            var user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "createdAt", user.getCreatedAt().toString()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // ===============================================
    // DELETE /api/auth/account — delete user account
    // ===============================================
    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(
            @RequestBody AuthDTO.DeleteAccountRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            Long userId = userService.getUserIdFromToken(token);
            userService.deleteAccount(userId, request.getPassword());
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===============================================
    // POST /api/auth/forgot-password — send reset code
    // ===============================================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody AuthDTO.ForgotPasswordRequest request) {
        try {
            userService.sendResetCode(request.getEmail());
            return ResponseEntity.ok(Map.of("message", "Reset code sent to your email"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===============================================
    // POST /api/auth/verify-code — verify the reset code
    // ===============================================
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody AuthDTO.VerifyCodeRequest request) {
        try {
            userService.verifyResetCode(request.getEmail(), request.getCode());
            return ResponseEntity.ok(Map.of("message", "Code verified successfully", "valid", true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage(), "valid", false));
        }
    }

    // ===============================================
    // POST /api/auth/reset-password — reset with code
    // ===============================================
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody AuthDTO.ResetPasswordRequest request) {
        try {
            userService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===============================================
    // POST /api/auth/contact — send contact form message
    // ===============================================
    @Autowired
    private com.elearning.service.EmailService emailService;

    @PostMapping("/contact")
    public ResponseEntity<?> contactUs(@RequestBody java.util.Map<String, String> request) {
        try {
            String name    = request.getOrDefault("name", "");
            String email   = request.getOrDefault("email", "");
            String subject = request.getOrDefault("subject", "");
            String message = request.getOrDefault("message", "");

            if (name.isBlank() || email.isBlank() || message.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name, email and message are required"));
            }

            emailService.sendContactMessage(name, email, subject, message);
            return ResponseEntity.ok(Map.of("message", "Message sent successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
