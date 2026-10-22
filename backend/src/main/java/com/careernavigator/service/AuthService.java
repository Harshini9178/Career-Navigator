package com.careernavigator.service;

import com.careernavigator.dto.AuthRequests.*;
import com.careernavigator.dto.AuthResponse;
import com.careernavigator.dto.AuthResponse.UserDto;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.repository.UserRepository;
import com.careernavigator.security.CustomPasswordEncoder;
import com.careernavigator.security.SessionService;
import com.careernavigator.service.EmailService.EmailDeliveryResult;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;
    private final CustomPasswordEncoder passwordEncoder;
    private final SessionService sessionService;
    private final DatabaseStorageService databaseStorageService;
    private final EmailService emailService;

    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

    // In-memory OTP storage: identifier (email or phone) -> { otp, expiresAt }
    private static class OtpEntry {
        final String otp;
        final long expiresAt;
        OtpEntry(String otp, long expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }
    }
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final Map<String, Long> resendRateLimitMap = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            CustomPasswordEncoder passwordEncoder,
            SessionService sessionService,
            DatabaseStorageService databaseStorageService,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.sessionService = sessionService;
        this.databaseStorageService = databaseStorageService;
        this.emailService = emailService;
    }

    public AuthResponse register(RegisterRequest req, HttpServletResponse response) {
        // 1. Validate full name
        if (req.getName() == null || req.getName().trim().isBlank()) {
            throw new ApiException("Full Name is required.", 400);
        }

        // 2. Validate and normalize email
        if (req.getEmail() == null || req.getEmail().trim().isBlank()) {
            throw new ApiException("Email address is required.", 400);
        }
        String cleanEmail = req.getEmail().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            throw new ApiException("Please enter a valid email address.", 400);
        }

        // 3. Validate password rules
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            throw new ApiException("Password is required.", 400);
        }
        if (req.getPassword().length() < 8) {
            throw new ApiException("Password must be at least 8 characters in length.", 400);
        }
        if (!req.getPassword().matches(".*[A-Za-z].*") || !req.getPassword().matches(".*[0-9].*")) {
            throw new ApiException("Password must contain at least one letter and one number.", 400);
        }

        // 4. Case-insensitive duplicate check
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            logger.warn("[Auth] Registration rejected: Duplicate email [{}]", cleanEmail);
            throw new ApiException("An account with this email already exists.", 409);
        }

        // 5. Optional Phone validation & duplicate check
        String cleanPhone = null;
        if (req.getPhone() != null && !req.getPhone().trim().isBlank()) {
            String digits = req.getPhone().replaceAll("[^0-9]", "");
            if (digits.length() >= 10) {
                String last10 = digits.substring(digits.length() - 10);
                cleanPhone = req.getPhone().trim();
                boolean phoneExists = userRepository.findAll().stream().anyMatch(u -> {
                    if (u.getPhone() == null) return false;
                    String uDigits = u.getPhone().replaceAll("[^0-9]", "");
                    return uDigits.endsWith(last10);
                });
                if (phoneExists) {
                    throw new ApiException("An account with this mobile number already exists. Please log in.", 409);
                }
            }
        }

        // 6. Role sanitization: Prevent self-assigned administrator privileges
        // Public registration always assigns "student". Admin roles require authorized provisioning.
        String sanitizedRole = "student";

        // 7. Generate verification tokens
        String verificationCode = String.format("%06d", secureRandom.nextInt(1000000));
        byte[] tokenBytes = new byte[24];
        secureRandom.nextBytes(tokenBytes);
        String verificationToken = HexFormat.of().formatHex(tokenBytes);
        long tokenExpiresAt = System.currentTimeMillis() + (15 * 60 * 1000); // 15 minutes

        // 8. Create User Entity
        UserEntity user = new UserEntity();
        user.setId("usr-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 5));
        user.setEmail(cleanEmail);
        user.setName(req.getName().trim());
        user.setRole(sanitizedRole);
        user.setPhone(cleanPhone);
        user.setEmailVerified(false);
        user.setVerificationCode(verificationCode);
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiresAt(tokenExpiresAt);
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

        // 9. Dispatch verification email
        EmailDeliveryResult deliveryResult = emailService.sendVerificationEmail(
                cleanEmail, user.getName(), verificationCode, verificationToken);

        // 10. Issue session
        String sessionToken = sessionService.signSession(user.getId());
        setSessionCookie(response, sessionToken);

        AuthResponse authResp = AuthResponse.of("Account created successfully", user, sessionToken);
        authResp.setSuccess(true);
        Map<String, Object> deliveryMap = new HashMap<>();
        deliveryMap.put("sent", deliveryResult.isSent());
        deliveryMap.put("status", deliveryResult.getStatus());
        deliveryMap.put("devNotice", deliveryResult.getDevNotice());
        deliveryMap.put("correlationId", deliveryResult.getCorrelationId());
        if (deliveryResult.getError() != null) {
            deliveryMap.put("error", deliveryResult.getError());
        }
        authResp.setEmailDelivery(deliveryMap);

        logger.info("[Auth] User registered successfully [id={}, email={}, emailDeliveryStatus={}]",
                user.getId(), cleanEmail, deliveryResult.getStatus());

        return authResp;
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

        AuthResponse resp = AuthResponse.of("Login successful", user, sessionToken);
        resp.setSuccess(true);
        return resp;
    }

    public Map<String, Object> verifyEmail(VerifyEmailRequest req, HttpServletResponse response) {
        String email = req.getEmail().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException("No account found with email: " + email, 404));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Email is already verified.");
            res.put("user", UserDto.fromEntity(user));
            return res;
        }

        boolean codeMatch = (req.getCode() != null && !req.getCode().isBlank()
                && req.getCode().trim().equals(user.getVerificationCode()));
        boolean tokenMatch = (req.getToken() != null && !req.getToken().isBlank()
                && req.getToken().trim().equals(user.getVerificationToken()));

        if (!codeMatch && !tokenMatch) {
            throw new ApiException("Invalid or incorrect verification code.", 400);
        }

        if (user.getVerificationTokenExpiresAt() != null
                && System.currentTimeMillis() > user.getVerificationTokenExpiresAt()) {
            throw new ApiException("Verification code has expired. Please request a new one.", 400);
        }

        // Single-use: clear verification secrets
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);

        userRepository.save(user);
        databaseStorageService.syncToDbJson();

        // Send welcome email upon successful verification
        emailService.sendWelcomeEmail(user.getEmail(), user.getName());

        String sessionToken = sessionService.signSession(user.getId());
        setSessionCookie(response, sessionToken);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Email verified successfully! Welcome to Career Navigator.");
        res.put("user", UserDto.fromEntity(user));
        res.put("token", sessionToken);
        return res;
    }

    public Map<String, Object> resendVerification(String email) {
        String cleanEmail = email.trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new ApiException("No account found with email: " + cleanEmail, 404));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Email is already verified. You may log in directly.");
            return res;
        }

        // Rate limit: 60s cooldown per email
        Long lastSent = resendRateLimitMap.get(cleanEmail);
        long now = System.currentTimeMillis();
        if (lastSent != null && (now - lastSent) < 60000) {
            long remainingSeconds = (60000 - (now - lastSent)) / 1000;
            throw new ApiException("Please wait " + remainingSeconds + " seconds before requesting another verification email.", 429);
        }
        resendRateLimitMap.put(cleanEmail, now);

        String code = String.format("%06d", secureRandom.nextInt(1000000));
        byte[] tokenBytes = new byte[24];
        secureRandom.nextBytes(tokenBytes);
        String token = HexFormat.of().formatHex(tokenBytes);

        user.setVerificationCode(code);
        user.setVerificationToken(token);
        user.setVerificationTokenExpiresAt(now + (15 * 60 * 1000));
        userRepository.save(user);
        databaseStorageService.syncToDbJson();

        EmailDeliveryResult deliveryResult = emailService.sendVerificationEmail(cleanEmail, user.getName(), code, token);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "A new verification code has been dispatched to " + cleanEmail);
        res.put("emailDelivery", Map.of(
                "sent", deliveryResult.isSent(),
                "status", deliveryResult.getStatus(),
                "devNotice", deliveryResult.getDevNotice() != null ? deliveryResult.getDevNotice() : ""
        ));
        return res;
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
            user = new UserEntity();
            user.setId("demo-" + targetRole + "-1");
            user.setEmail(targetRole + "@careernavigator.com");
            user.setName("Demo " + targetRole.substring(0, 1).toUpperCase() + targetRole.substring(1));
            user.setRole(targetRole);
            user.setEmailVerified(true);
            user.setCompletedProfile(true);
            user.setPasswordHash(passwordEncoder.encode("DemoPass123!"));
            user.setCreatedAt(new Date().toInstant().toString());
            userRepository.save(user);
            databaseStorageService.syncToDbJson();
        }

        String sessionToken = sessionService.signSession(user.getId());
        setSessionCookie(response, sessionToken);

        AuthResponse resp = AuthResponse.of("Demo login successful", user, sessionToken);
        resp.setSuccess(true);
        return resp;
    }

    public Map<String, Object> sendOtp(String identifier) {
        if (identifier == null || identifier.trim().isBlank()) {
            throw new ApiException("Identifier (email or mobile number) is required.", 400);
        }
        String cleanId = identifier.trim().toLowerCase();
        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        otpStore.put(cleanId, new OtpEntry(otp, System.currentTimeMillis() + (10 * 60 * 1000)));

        // If identifier is an email address, dispatch via emailService
        if (cleanId.contains("@") && EMAIL_PATTERN.matcher(cleanId).matches()) {
            emailService.sendPasswordResetEmail(cleanId, "User", otp);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "OTP sent successfully to " + cleanId);
        res.put("otp", otp);
        res.put("otpCode", otp); // Compatible with frontend
        return res;
    }

    public Map<String, Object> verifyOtp(String identifier, String otp, String name, HttpServletResponse response) {
        if (identifier == null || identifier.trim().isBlank()) {
            throw new ApiException("Identifier is required.", 400);
        }
        String cleanId = identifier.trim().toLowerCase();
        OtpEntry entry = otpStore.get(cleanId);

        if (entry == null || System.currentTimeMillis() > entry.expiresAt || !entry.otp.equals(otp)) {
            throw new ApiException("Invalid or expired OTP code.", 400);
        }

        otpStore.remove(cleanId);

        // Find or create user for mobile/OTP login
        UserEntity user;
        Optional<UserEntity> existingUser = userRepository.findByEmailIgnoreCase(cleanId);
        if (existingUser.isEmpty() && cleanId.replaceAll("[^0-9]", "").length() >= 10) {
            String digits = cleanId.replaceAll("[^0-9]", "");
            existingUser = userRepository.findAll().stream()
                    .filter(u -> u.getPhone() != null && u.getPhone().replaceAll("[^0-9]", "").endsWith(digits.substring(digits.length() - 10)))
                    .findFirst();
        }

        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            user = new UserEntity();
            user.setId("usr-otp-" + System.currentTimeMillis());
            if (cleanId.contains("@")) {
                user.setEmail(cleanId);
            } else {
                String cleanDigits = cleanId.replaceAll("[^0-9]", "");
                user.setEmail("mobile_" + cleanDigits + "@careernavigator.app");
                user.setPhone(cleanId);
            }
            user.setName((name != null && !name.isBlank()) ? name : "Career Navigator User");
            user.setRole("student");
            user.setEmailVerified(true);
            user.setCompletedProfile(false);
            user.setCreatedAt(new Date().toInstant().toString());
            userRepository.save(user);
            databaseStorageService.syncToDbJson();
        }

        String sessionToken = sessionService.signSession(user.getId());
        if (response != null) {
            setSessionCookie(response, sessionToken);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "OTP verified successfully");
        res.put("verified", true);
        res.put("user", UserDto.fromEntity(user));
        res.put("token", sessionToken);
        return res;
    }

    public Map<String, Object> resetPassword(ResetPasswordRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        OtpEntry entry = otpStore.get(email);
        if (entry == null || System.currentTimeMillis() > entry.expiresAt || !entry.otp.equals(req.getOtp())) {
            throw new ApiException("Invalid or expired OTP code.", 400);
        }
        otpStore.remove(email);

        Optional<UserEntity> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            throw new ApiException("No account found with this email.", 404);
        }

        UserEntity user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        databaseStorageService.syncToDbJson();

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
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
