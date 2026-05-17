package com.elearning.service;

import com.elearning.dto.AuthDTO;
import com.elearning.model.PasswordResetToken;
import com.elearning.model.User;
import com.elearning.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.Optional;
import java.util.Random;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    private EmailService emailService;

    // Register a new user (student or teacher)
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        User user = new User(
            request.getName(),
            request.getEmail(),
            passwordEncoder.encode(request.getPassword()),
            User.Role.valueOf(request.getRole().toUpperCase())
        );

        User saved = userRepository.save(user);
        String token = generateToken(saved);
        return new AuthDTO.AuthResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole().name(), token);
    }

    // Login: check email + password
    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        Optional<User> found = userRepository.findByEmail(request.getEmail());

        if (found.isEmpty()) {
            throw new RuntimeException("User not found with email: " + request.getEmail());
        }

        User user = found.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = generateToken(user);
        return new AuthDTO.AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole().name(), token);
    }

    // Find user by ID
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    // Simple token: Base64 of "userId:email"
    private String generateToken(User user) {
        String raw = user.getId() + ":" + user.getEmail();
        return Base64.getEncoder().encodeToString(raw.getBytes());
    }

    // Update user profile (name, email, password)
    // Current password is ALWAYS required for security
    public AuthDTO.AuthResponse updateProfile(Long userId, AuthDTO.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Security: verify current password before allowing any changes
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new RuntimeException("Current password is required");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Update name if provided
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        // Update email if provided (check uniqueness)
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Email already in use: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        // Update password if provided
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getNewPassword().length() < 6) {
                throw new RuntimeException("New password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User saved = userRepository.save(user);
        String token = generateToken(saved);
        return new AuthDTO.AuthResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole().name(), token);
    }

    // Decode token and return user ID
    public Long getUserIdFromToken(String token) {
        try {
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            return Long.parseLong(parts[0]);
        } catch (Exception e) {
            throw new RuntimeException("Invalid token");
        }
    }

    // ===============================================
    // DELETE ACCOUNT
    // ===============================================
    @Transactional
    public void deleteAccount(Long userId, String password) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Incorrect password");
        }

        userRepository.delete(user);
    }

    // ===============================================
    // FORGOT PASSWORD — Send reset code by email
    // ===============================================
    @Transactional
    public void sendResetCode(String email) {
        Optional<User> found = userRepository.findByEmail(email);
        if (found.isEmpty()) {
            throw new RuntimeException("No account found with this email");
        }

        // Generate a 6-digit code
        String code = String.format("%06d", new Random().nextInt(999999));

        // Save the token (expires in 10 minutes)
        PasswordResetToken resetToken = new PasswordResetToken(email, code, 10);
        resetTokenRepository.save(resetToken);

        // Send the email
        emailService.sendResetCode(email, code);
    }

    // ===============================================
    // VERIFY RESET CODE
    // ===============================================
    public boolean verifyResetCode(String email, String code) {
        Optional<PasswordResetToken> found =
            resetTokenRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc(email);

        if (found.isEmpty()) {
            throw new RuntimeException("No reset code found. Please request a new one.");
        }

        PasswordResetToken token = found.get();

        if (token.isExpired()) {
            throw new RuntimeException("Code has expired. Please request a new one.");
        }

        if (!token.getCode().equals(code)) {
            throw new RuntimeException("Invalid code. Please try again.");
        }

        return true;
    }

    // ===============================================
    // RESET PASSWORD (after code verification)
    // ===============================================
    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        // Verify the code first
        verifyResetCode(email, code);

        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        Optional<PasswordResetToken> token =
            resetTokenRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc(email);
        token.ifPresent(t -> {
            t.setUsed(true);
            resetTokenRepository.save(t);
        });
    }
}
