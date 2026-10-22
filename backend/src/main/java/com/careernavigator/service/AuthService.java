package com.careernavigator.service;

import com.careernavigator.dto.AuthRequests.*;
import com.careernavigator.dto.AuthResponse;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.repository.UserRepository;
import com.careernavigator.security.CustomPasswordEncoder;
import com.careernavigator.security.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CustomPasswordEncoder passwordEncoder;
    private final SessionService sessionService;
    private final DatabaseStorageService databaseStorageService;

    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

    // In-memory OTP storage: email -> { otp, expiresAt }
    private static class OtpEntry {
        final String otp;
        final long expiresAt;
        OtpEntry(String otp, long expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }
    }
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            CustomPasswordEncoder passwordEncoder,
            SessionService sessionService,
            DatabaseStorageService databaseStorageService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.sessionService = sessionService;
        this.databaseStorageService = databaseStorageService;
    }

    public AuthResponse register(RegisterRequest req, HttpServletResponse response) {
        String email = req.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException("An account with this email already exists.", 409);
        }

        UserEntity user = new UserEntity();
        user.setId("usr-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 5));
        user.setEmail(email);
        user.setName(req.getName() != null && !req.getName().isBlank() ? req.getName() : email.split("@")[0]);
        user.setRole(req.getRole() != null && req.getRole().equalsIgnoreCase("admin") ? "admin" : "student");
        user.setBranch(req.getBranch() != null ? req.getBranch() : "Computer Science");
        user.setTargetRole(req.getTargetRole() != null ? req.getTargetRole() : "Full Stack Developer");
        user.setExperienceLevel(req.getExperienceLevel() != null ? req.getExperienceLevel() : "Entry Level");
        user.setSkills(req.getSkills() != null ? req.getSkills() : new ArrayList<>());
        user.setProjects(req.getProjects() != null ? req.getProjects() : new ArrayList<>());
        user.setCompletedProfile(true);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setCreatedAt(new Date().toInstant().toString());
        user.setPicture("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120");

        userRepository.save(user);
        databaseStorageService.syncToDbJson();

        String sessionToken = sessionService.signSession(user.getId());
        setSessionCookie(response, sessionToken);

        return AuthResponse.of("Account created successfully", user, sessionToken);
    }

    public AuthResponse login(LoginRequest req, HttpServletResponse response) {
        String email = req.getEmail().trim().toLowerCase();
        Optional<UserEntity> userOpt = userRepository.findByEmailIgnoreCase(email);

        if (userOpt.isEmpty()) {
            throw new ApiException("Invalid email or password.", 401);
        }

        UserEntity user = userOpt.get();

        if (user.getPasswordHash() != null) {
            if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
                throw new ApiException("Invalid email or password.", 401);
            }
        }

        String sessionToken = sessionService.signSession(user.getId());
        setSessionCookie(response, sessionToken);

        return AuthResponse.of("Login successful", user, sessionToken);
    }

    public AuthResponse demoLogin(String role, HttpServletResponse response) {
        String targetRole = (role != null && role.equalsIgnoreCase("admin")) ? "admin" : "student";

        Optional<UserEntity> userOpt = userRepository.findAll().stream()
                .filter(u -> targetRole.equalsIgnoreCase(u.getRole()))
                .findFirst();

        UserEntity user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            // Create demo user if not present
            user = new UserEntity();
            user.setId("demo-" + targetRole + "-1");
            user.setEmail(targetRole + "@careernavigator.com");
            user.setName("Demo " + targetRole.substring(0, 1).toUpperCase() + targetRole.substring(1));
            user.setRole(targetRole);
            user.setCompletedProfile(true);
            user.setPasswordHash(passwordEncoder.encode("DemoPass123!"));
            user.setCreatedAt(new Date().toInstant().toString());
            userRepository.save(user);
            databaseStorageService.syncToDbJson();
        }

        String sessionToken = sessionService.signSession(user.getId());
        setSessionCookie(response, sessionToken);

        return AuthResponse.of("Demo login successful", user, sessionToken);
    }

    public Map<String, Object> sendOtp(String email) {
        email = email.trim().toLowerCase();
        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        otpStore.put(email, new OtpEntry(otp, System.currentTimeMillis() + (10 * 60 * 1000)));

        Map<String, Object> res = new HashMap<>();
        res.put("message", "OTP sent successfully to " + email);
        res.put("otp", otp); // Returned in dev mode for easy testing and verification
        return res;
    }

    public Map<String, Object> verifyOtp(String email, String otp) {
        email = email.trim().toLowerCase();
        OtpEntry entry = otpStore.get(email);

        if (entry == null || System.currentTimeMillis() > entry.expiresAt || !entry.otp.equals(otp)) {
            throw new ApiException("Invalid or expired OTP code.", 400);
        }

        otpStore.remove(email);
        Map<String, Object> res = new HashMap<>();
        res.put("message", "OTP verified successfully");
        res.put("verified", true);
        return res;
    }

    public Map<String, Object> resetPassword(ResetPasswordRequest req) {
        verifyOtp(req.getEmail(), req.getOtp());
        String email = req.getEmail().trim().toLowerCase();

        Optional<UserEntity> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            throw new ApiException("No account found with this email.", 404);
        }

        UserEntity user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        databaseStorageService.syncToDbJson();

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Password reset successfully. You may now log in.");
        return res;
    }

    public UserEntity updateProfile(String userId, ProfileUpdateRequest req) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", 404));

        if (req.getName() != null) user.setName(req.getName());
        if (req.getPicture() != null) user.setPicture(req.getPicture());
        if (req.getBranch() != null) user.setBranch(req.getBranch());
        if (req.getTargetRole() != null) user.setTargetRole(req.getTargetRole());
        if (req.getExperienceLevel() != null) user.setExperienceLevel(req.getExperienceLevel());
        if (req.getSkills() != null) user.setSkills(req.getSkills());
        if (req.getProjects() != null) user.setProjects(req.getProjects());
        user.setCompletedProfile(true);

        userRepository.save(user);
        databaseStorageService.syncToDbJson();
        return user;
    }

    public void logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("session", "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
    }

    private void setSessionCookie(HttpServletResponse response, String signedToken) {
        Cookie cookie = new Cookie("session", signedToken);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(30 * 24 * 3600);
        response.addCookie(cookie);
    }
}
