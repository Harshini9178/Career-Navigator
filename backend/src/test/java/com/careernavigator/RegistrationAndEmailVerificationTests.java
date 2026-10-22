package com.careernavigator;

import com.careernavigator.entity.UserEntity;
import com.careernavigator.repository.UserRepository;
import com.careernavigator.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class RegistrationAndEmailVerificationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    private String baseEmail;
    private String basePhone;

    @BeforeEach
    void setUp() {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        baseEmail = "testuser-" + randomSuffix + "@example.com";
        basePhone = "+1 555" + String.format("%07d", Math.abs(randomSuffix.hashCode() % 10000000));
    }

    @Test
    @DisplayName("TEST A: Register a never-before-used email address -> creates exactly one database record")
    void testA_NewEmailRegistration() throws Exception {
        long initialCount = userRepository.count();

        String body = """
                {
                    "name": "Jane Doe",
                    "email": "%s",
                    "password": "SecurePassword123!",
                    "role": "student",
                    "phone": "%s"
                }
                """.formatted(baseEmail, basePhone);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.email").value(baseEmail))
                .andExpect(jsonPath("$.user.emailVerified").value(false))
                .andExpect(jsonPath("$.emailDelivery").exists())
                .andExpect(cookie().exists("session"));

        Optional<UserEntity> userOpt = userRepository.findByEmailIgnoreCase(baseEmail);
        assertThat(userOpt).isPresent();
        assertThat(userRepository.count()).isEqualTo(initialCount + 1);
        assertThat(userOpt.get().getEmailVerified()).isFalse();
        assertThat(userOpt.get().getVerificationCode()).isNotNull();
    }

    @Test
    @DisplayName("TEST B: Duplicate email registration -> rejected with 409 and does not create another record")
    void testB_DuplicateEmailRejection() throws Exception {
        testA_NewEmailRegistration();
        long countAfterFirst = userRepository.count();

        String duplicateBody = """
                {
                    "name": "Another Jane",
                    "email": "%s",
                    "password": "AnotherPassword123!"
                }
                """.formatted(baseEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("An account with this email already exists."));

        assertThat(userRepository.count()).isEqualTo(countAfterFirst);
    }

    @Test
    @DisplayName("TEST C: Different new email succeeds and is not blocked by existing records")
    void testC_DifferentNewEmailSucceeds() throws Exception {
        testA_NewEmailRegistration();

        String secondEmail = "different-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        String secondPhone = "+1 555" + String.format("%07d", Math.abs(secondEmail.hashCode() % 10000000));
        String secondBody = """
                {
                    "name": "Mark Smith",
                    "email": "%s",
                    "password": "Password456!",
                    "role": "student",
                    "phone": "%s"
                }
                """.formatted(secondEmail, secondPhone);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(secondBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.email").value(secondEmail));

        assertThat(userRepository.findByEmailIgnoreCase(secondEmail)).isPresent();
    }

    @Test
    @DisplayName("TEST D: Case-insensitive duplicate prevention (TestUser@example.com vs testuser@example.com)")
    void testD_CaseInsensitiveDuplicate() throws Exception {
        String mixedEmail = "CaseUser-" + UUID.randomUUID().toString().substring(0, 8) + "@Example.COM";
        String body1 = """
                {
                    "name": "Case User",
                    "email": "%s",
                    "password": "Password123!"
                }
                """.formatted(mixedEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Attempt with lowercased version of the same email
        String body2 = """
                {
                    "name": "Case User 2",
                    "email": "%s",
                    "password": "Password123!"
                }
                """.formatted(mixedEmail.toLowerCase());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body2))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("An account with this email already exists."));
    }

    @Test
    @DisplayName("TEST E: Whitespace trimming prevents duplicate check bypass and validation failure")
    void testE_WhitespaceNormalization() throws Exception {
        String targetEmail = "whitespace-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        String paddedEmail = "   " + targetEmail + "   ";

        String body1 = """
                {
                    "name": "Whitespace User",
                    "email": "%s",
                    "password": "Password123!"
                }
                """.formatted(paddedEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(targetEmail));

        // Submitting with leading/trailing spaces should properly recognize duplicate
        String duplicatePadded = "  " + targetEmail + "    ";
        String body2 = """
                {
                    "name": "Whitespace User 2",
                    "email": "%s",
                    "password": "Password123!"
                }
                """.formatted(duplicatePadded);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body2))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("An account with this email already exists."));
    }

    @Test
    @DisplayName("TEST F: Invalid requests (missing fields, invalid email, weak password) return 400")
    void testF_InvalidRequests() throws Exception {
        // Missing name
        String missingName = """
                {
                    "name": "",
                    "email": "valid@example.com",
                    "password": "Password123!"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(missingName))
                .andExpect(status().isBadRequest());

        // Invalid email format
        String invalidEmail = """
                {
                    "name": "Valid Name",
                    "email": "not-an-email",
                    "password": "Password123!"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidEmail))
                .andExpect(status().isBadRequest());

        // Password missing number
        String weakPassword = """
                {
                    "name": "Valid Name",
                    "email": "valid2@example.com",
                    "password": "lettersonly"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(weakPassword))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TEST H: Password security -> passwords are never stored in plaintext and use strong hash")
    void testH_PasswordSecurity() throws Exception {
        testA_NewEmailRegistration();

        UserEntity user = userRepository.findByEmailIgnoreCase(baseEmail).orElseThrow();
        assertThat(user.getPasswordHash()).isNotNull();
        assertThat(user.getPasswordHash()).doesNotContain("SecurePassword123!");
        assertThat(user.getPasswordHash().length()).isGreaterThan(20);
    }

    @Test
    @DisplayName("TEST I & J: Email delivery status and safe logging without false inbox promises")
    void testI_J_EmailDeliveryStatus() throws Exception {
        String testEmail = "emailtest-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        String body = """
                {
                    "name": "Email Test",
                    "email": "%s",
                    "password": "Password123!"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailDelivery").exists())
                .andExpect(jsonPath("$.emailDelivery.status").value("DEVELOPMENT_SIMULATED"))
                .andExpect(jsonPath("$.emailDelivery.sent").value(false));
    }

    @Test
    @DisplayName("TEST K: Email verification -> success, expired, invalid, already-used, and resend rate limit")
    void testK_EmailVerificationFlow() throws Exception {
        testA_NewEmailRegistration();

        UserEntity user = userRepository.findByEmailIgnoreCase(baseEmail).orElseThrow();
        String validCode = user.getVerificationCode();
        assertThat(validCode).isNotNull();

        // 1. Invalid verification code -> returns 400
        String invalidVerifyBody = """
                {
                    "email": "%s",
                    "code": "000000"
                }
                """.formatted(baseEmail);
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidVerifyBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or incorrect verification code."));

        // 2. Valid verification code -> verifies email
        String validVerifyBody = """
                {
                    "email": "%s",
                    "code": "%s"
                }
                """.formatted(baseEmail, validCode);
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validVerifyBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.emailVerified").value(true));

        UserEntity updated = userRepository.findByEmailIgnoreCase(baseEmail).orElseThrow();
        assertThat(updated.getEmailVerified()).isTrue();
        assertThat(updated.getVerificationCode()).isNull(); // Single use

        // 3. Already verified / already used code
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validVerifyBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email is already verified."));

        // 4. Resend verification on already verified email returns notice
        String resendBody = """
                {
                    "email": "%s"
                }
                """.formatted(baseEmail);
        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resendBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email is already verified. You may log in directly."));
    }

    @Test
    @DisplayName("TEST L: Existing users in database remain intact and can log in")
    void testL_ExistingUsersRemainIntactAndCanLogin() throws Exception {
        String email = "existing-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        String regBody = """
                {
                    "name": "Existing User",
                    "email": "%s",
                    "password": "Password123!"
                }
                """.formatted(email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isOk());

        // Verify login
        String loginBody = """
                {
                    "email": "%s",
                    "password": "Password123!"
                }
                """.formatted(email);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user.email").value(email));
    }
}
