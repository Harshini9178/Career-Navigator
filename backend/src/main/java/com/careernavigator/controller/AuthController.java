package com.careernavigator.controller;

import com.careernavigator.dto.AuthRequests.*;
import com.careernavigator.dto.AuthResponse;
import com.careernavigator.dto.AuthResponse.UserDto;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req, HttpServletResponse response) {
        return ResponseEntity.ok(authService.register(req, response));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        return ResponseEntity.ok(authService.login(req, response));
    }

    @PostMapping({"/api/auth/demo", "/api/auth/demo-login"})
    public ResponseEntity<AuthResponse> demoLogin(
            @RequestBody(required = false) Map<String, String> body,
            HttpServletResponse response) {
        String role = (body != null && body.containsKey("role")) ? body.get("role") : "student";
        return ResponseEntity.ok(authService.demoLogin(role, response));
    }

    @PostMapping("/api/auth/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@Valid @RequestBody SendOtpRequest req) {
        return ResponseEntity.ok(authService.sendOtp(req.getIdentifier()));
    }

    @PostMapping("/api/auth/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@Valid @RequestBody VerifyOtpRequest req, HttpServletResponse response) {
        return ResponseEntity.ok(authService.verifyOtp(req.getIdentifier(), req.getOtp(), req.getName(), response));
    }

    @PostMapping("/api/auth/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@Valid @RequestBody VerifyEmailRequest req, HttpServletResponse response) {
        return ResponseEntity.ok(authService.verifyEmail(req, response));
    }

    @GetMapping("/api/auth/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmailGet(
            @RequestParam String email,
            @RequestParam(required = false) String token,
            @RequestParam(required = false) String code,
            HttpServletResponse response) {
        VerifyEmailRequest req = new VerifyEmailRequest();
        req.setEmail(email);
        req.setToken(token);
        req.setCode(code);
        return ResponseEntity.ok(authService.verifyEmail(req, response));
    }

    @PostMapping("/api/auth/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerification(@Valid @RequestBody ResendVerificationRequest req) {
        return ResponseEntity.ok(authService.resendVerification(req.getEmail()));
    }

    @PostMapping({"/api/auth/forgot-password", "/api/auth/reset-password"})
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        return ResponseEntity.ok(authService.resetPassword(req));
    }

    @GetMapping("/api/auth/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "success", true,
                "user", UserDto.fromEntity(user)
        ));
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/api/auth/url")
    public ResponseEntity<Map<String, String>> getAuthUrl() {
        return ResponseEntity.ok(Map.of(
                "url", "/login?oauth=simulated",
                "message", "Google OAuth configured"
        ));
    }

    @PutMapping("/api/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal UserEntity user,
            @RequestBody ProfileUpdateRequest req) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        UserEntity updated = authService.updateProfile(user.getId(), req);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profile updated successfully",
                "user", UserDto.fromEntity(updated)
        ));
    }
}
