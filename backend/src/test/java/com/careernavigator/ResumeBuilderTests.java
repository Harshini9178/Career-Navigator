package com.careernavigator;

import com.careernavigator.dto.ResumeBuilderDto.*;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.repository.ResumeDocumentRepository;
import com.careernavigator.repository.UserRepository;
import com.careernavigator.security.SessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ResumeBuilderTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResumeDocumentRepository resumeDocumentRepository;

    @Autowired
    private SessionService sessionService;

    @Autowired
    private ObjectMapper objectMapper;

    private UserEntity userA;
    private UserEntity userB;
    private Cookie sessionCookieA;
    private Cookie sessionCookieB;
    private Cookie csrfCookieA;
    private Cookie csrfCookieB;
    private String csrfTokenA = "csrf-token-test-a-123456";
    private String csrfTokenB = "csrf-token-test-b-123456";

    @BeforeEach
    void setUp() throws Exception {
        userA = new UserEntity();
        userA.setId("user-a-" + UUID.randomUUID());
        userA.setEmail("usera-" + UUID.randomUUID().toString().substring(0, 6) + "@example.com");
        userA.setName("Alice Engineer");
        userA.setRole("student");
        userA.setTargetRole("Full Stack Engineer");
        userRepository.save(userA);

        userB = new UserEntity();
        userB.setId("user-b-" + UUID.randomUUID());
        userB.setEmail("userb-" + UUID.randomUUID().toString().substring(0, 6) + "@example.com");
        userB.setName("Bob Candidate");
        userB.setRole("student");
        userB.setTargetRole("Data Analyst");
        userRepository.save(userB);

        String sessionTokenA = sessionService.signSession(userA.getId());
        sessionCookieA = new Cookie("session", sessionTokenA);
        csrfCookieA = new Cookie("csrf-token", csrfTokenA);

        String sessionTokenB = sessionService.signSession(userB.getId());
        sessionCookieB = new Cookie("session", sessionTokenB);
        csrfCookieB = new Cookie("csrf-token", csrfTokenB);
    }

    @Test
    void testCreateListUpdateDuplicateDeleteLifecycle() throws Exception {
        // 1. Create Resume
        ResumeCreateRequest createReq = new ResumeCreateRequest();
        createReq.setTitle("Alice Senior Resume");
        createReq.setTargetRole("Full Stack Engineer");
        createReq.setTemplateId("classic-ats");

        MvcResult createResult = mockMvc.perform(post("/api/resumes")
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resume.title").value("Alice Senior Resume"))
                .andExpect(jsonPath("$.resume.content.personalInfo.fullName").value("Alice Engineer"))
                .andReturn();

        String createJson = createResult.getResponse().getContentAsString();
        String resumeId = objectMapper.readTree(createJson).path("resume").path("id").asText();
        assertThat(resumeId).isNotEmpty();

        // 2. List Resumes for User A
        mockMvc.perform(get("/api/resumes")
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resumes[0].id").value(resumeId));

        // 3. User B should have 0 resumes
        mockMvc.perform(get("/api/resumes")
                        .cookie(sessionCookieB)
                        .header("X-CSRF-Token", csrfTokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumes").isEmpty());

        // 4. Update Resume
        ResumeUpdateRequest updateReq = new ResumeUpdateRequest();
        updateReq.setTitle("Alice Principal Architect Resume");
        updateReq.setTemplateId("modern-pro");

        mockMvc.perform(put("/api/resumes/" + resumeId)
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resume.title").value("Alice Principal Architect Resume"))
                .andExpect(jsonPath("$.resume.templateId").value("modern-pro"));

        // 5. Duplicate Resume
        MvcResult dupResult = mockMvc.perform(post("/api/resumes/" + resumeId + "/duplicate")
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resume.title").value("Alice Principal Architect Resume (Copy)"))
                .andReturn();

        String dupId = objectMapper.readTree(dupResult.getResponse().getContentAsString()).path("resume").path("id").asText();
        assertThat(dupId).isNotEqualTo(resumeId);

        // 6. Delete Duplicate Resume
        mockMvc.perform(delete("/api/resumes/" + dupId)
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify deleted
        mockMvc.perform(get("/api/resumes/" + dupId)
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCrossUserAuthorizationEnforcement() throws Exception {
        // User A creates a resume
        ResumeCreateRequest createReq = new ResumeCreateRequest();
        createReq.setTitle("Alice Private Resume");
        MvcResult result = mockMvc.perform(post("/api/resumes")
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String resumeId = objectMapper.readTree(result.getResponse().getContentAsString()).path("resume").path("id").asText();

        // User B tries to read User A's resume -> 404/403
        mockMvc.perform(get("/api/resumes/" + resumeId)
                        .cookie(sessionCookieB, csrfCookieB)
                        .header("X-CSRF-Token", csrfTokenB))
                .andExpect(status().isNotFound());

        // User B tries to update User A's resume -> 404/403
        ResumeUpdateRequest updateReq = new ResumeUpdateRequest();
        updateReq.setTitle("Hacked Title");
        mockMvc.perform(put("/api/resumes/" + resumeId)
                        .cookie(sessionCookieB, csrfCookieB)
                        .header("X-CSRF-Token", csrfTokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());

        // User B tries to delete User A's resume -> 404/403
        mockMvc.perform(delete("/api/resumes/" + resumeId)
                        .cookie(sessionCookieB, csrfCookieB)
                        .header("X-CSRF-Token", csrfTokenB))
                .andExpect(status().isNotFound());

        // User B tries to export PDF for User A's resume -> 404/403
        mockMvc.perform(get("/api/resumes/" + resumeId + "/export/pdf")
                        .cookie(sessionCookieB, csrfCookieB)
                        .header("X-CSRF-Token", csrfTokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    void testAtsCheckAndJobMatchScoring() throws Exception {
        // Create resume for user A
        ResumeCreateRequest createReq = new ResumeCreateRequest();
        createReq.setTitle("Targeted Software Engineer Resume");
        createReq.setTargetRole("Full Stack Engineer");

        ResumeContent content = new ResumeContent();
        PersonalInfo pi = new PersonalInfo();
        pi.setFullName("Alice Engineer");
        pi.setHeadline("Full Stack Engineer");
        pi.setEmail("alice@example.com");
        pi.setPhone("+1 555-0199");
        pi.setCityCountry("Seattle, WA");
        content.setPersonalInfo(pi);

        content.setSummary("Results-driven Full Stack Engineer with 3+ years experience building scalable Java Spring Boot and React applications.");

        SkillsData skills = new SkillsData();
        skills.setProgrammingLanguages(new ArrayList<>(List.of("Java", "TypeScript", "Python")));
        skills.setFrameworks(new ArrayList<>(List.of("Spring Boot", "React", "Express")));
        skills.setDatabases(new ArrayList<>(List.of("PostgreSQL", "Redis")));
        skills.setToolsPlatforms(new ArrayList<>(List.of("Docker", "AWS", "Git")));
        skills.setCoreConcepts(new ArrayList<>(List.of("Microservices", "REST APIs", "CI/CD")));
        content.setSkills(skills);

        createReq.setContent(content);

        MvcResult createResult = mockMvc.perform(post("/api/resumes")
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String resumeId = objectMapper.readTree(createResult.getResponse().getContentAsString()).path("resume").path("id").asText();

        // Run ATS check
        mockMvc.perform(post("/api/resumes/" + resumeId + "/ats-check")
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.atsCheck.overallScore").isNumber())
                .andExpect(jsonPath("$.atsCheck.categoryScores").isArray())
                .andExpect(jsonPath("$.atsCheck.passedChecks").isArray());

        // Run Job Match against a job description
        JobMatchRequest jmReq = new JobMatchRequest();
        jmReq.setTargetRole("Full Stack Engineer");
        jmReq.setJobDescription("We are looking for a Full Stack Engineer experienced with Java, Spring Boot, React, Docker, and AWS microservices.");

        mockMvc.perform(post("/api/resumes/" + resumeId + "/job-match")
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.jobMatch.matchPercentage").isNumber())
                .andExpect(jsonPath("$.jobMatch.matchedKeywords").isArray());
    }

    @Test
    void testPdfExportReturnsValidPdfBytes() throws Exception {
        ResumeCreateRequest createReq = new ResumeCreateRequest();
        createReq.setTitle("Alice Printable Resume");
        MvcResult createResult = mockMvc.perform(post("/api/resumes")
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String resumeId = objectMapper.readTree(createResult.getResponse().getContentAsString()).path("resume").path("id").asText();

        MvcResult pdfResult = mockMvc.perform(get("/api/resumes/" + resumeId + "/export/pdf")
                        .cookie(sessionCookieA, csrfCookieA)
                        .header("X-CSRF-Token", csrfTokenA))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn();

        byte[] pdfBytes = pdfResult.getResponse().getContentAsByteArray();
        assertThat(pdfBytes).isNotEmpty();
        // Check PDF header signature "%PDF-"
        String header = new String(pdfBytes, 0, Math.min(5, pdfBytes.length));
        assertThat(header).isEqualTo("%PDF-");
    }
}
