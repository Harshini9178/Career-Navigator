package com.careernavigator;

import com.careernavigator.entity.UserEntity;
import com.careernavigator.repository.UserRepository;
import com.careernavigator.security.SessionService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthAndSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionService sessionService;

    private String testEmail;

    @BeforeEach
    void setUp() {
        testEmail = "candidate-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }

    @Test
    void testSuccessfulRegistration() throws Exception {
        // Test 3: Successful registration
        String body = """
                {
                    "email": "%s",
                    "password": "Password123!",
                    "name": "Alex Johnson",
                    "role": "student",
                    "branch": "Computer Science",
                    "targetRole": "Full Stack Developer"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("session"))
                .andExpect(jsonPath("$.user.email").value(testEmail))
                .andExpect(jsonPath("$.user.name").value("Alex Johnson"))
                .andExpect(jsonPath("$.user.role").value("student"));

        assertThat(userRepository.findByEmailIgnoreCase(testEmail)).isPresent();
    }

    @Test
    void testDuplicateRegistrationRejection() throws Exception {
        // Test 4: Duplicate registration rejection
        testSuccessfulRegistration();

        String body = """
                {
                    "email": "%s",
                    "password": "Password123!",
                    "name": "Duplicate Candidate"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("An account with this email already exists."));
    }

    @Test
    void testSuccessfulLoginAndIncorrectCredentials() throws Exception {
        // Test 5: Successful login & Test 6: Incorrect credentials
        testSuccessfulRegistration();

        // 6: Incorrect credentials
        String badBody = """
                {
                    "email": "%s",
                    "password": "WrongPassword123!"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badBody))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password."));

        // 5: Successful login
        String goodBody = """
                {
                    "email": "%s",
                    "password": "Password123!"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(goodBody))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("session"))
                .andExpect(jsonPath("$.user.email").value(testEmail));
    }

    @Test
    void testSessionRestorationAndLogout() throws Exception {
        // Test 7: Session restoration and logout
        testSuccessfulRegistration();
        UserEntity user = userRepository.findByEmailIgnoreCase(testEmail).orElseThrow();
        String sessionToken = sessionService.signSession(user.getId());

        // Restore session via cookie on /api/auth/me
        mockMvc.perform(get("/api/auth/me")
                        .cookie(new Cookie("session", sessionToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(testEmail));

        // Logout
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(cookie().value("session", ""));
    }

    @Test
    void testProtectedEndpointsRejectUnauthenticatedUsers() throws Exception {
        // Test 8: Protected endpoints
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/resume/my-analysis"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRoleBasedAccessControlForAdminEndpoints() throws Exception {
        // Test 9: Role-based access control
        // Candidate student trying to access admin metrics -> Forbidden (403)
        testSuccessfulRegistration();
        UserEntity student = userRepository.findByEmailIgnoreCase(testEmail).orElseThrow();
        String studentToken = sessionService.signSession(student.getId());

        mockMvc.perform(get("/api/admin/metrics")
                        .cookie(new Cookie("session", studentToken)))
                .andExpect(status().isForbidden());

        // Admin accessing admin metrics -> Ok (200)
        String adminEmail = "admin-" + UUID.randomUUID().toString().substring(0, 6) + "@careernavigator.com";
        UserEntity admin = new UserEntity();
        admin.setId("admin-" + System.currentTimeMillis());
        admin.setEmail(adminEmail);
        admin.setName("Admin Officer");
        admin.setRole("admin");
        userRepository.save(admin);

        String adminToken = sessionService.signSession(admin.getId());

        mockMvc.perform(get("/api/admin/metrics")
                        .cookie(new Cookie("session", adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStudents").exists());
    }

    @Test
    void testUserDataIsolation() throws Exception {
        // Test 19: User-level data isolation
        testSuccessfulRegistration();
        UserEntity user1 = userRepository.findByEmailIgnoreCase(testEmail).orElseThrow();
        String token1 = sessionService.signSession(user1.getId());

        MvcResult result = mockMvc.perform(get("/api/auth/me")
                        .cookie(new Cookie("session", token1)))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains(user1.getId());
        assertThat(result.getResponse().getContentAsString()).doesNotContain("admin-1");
    }
}
