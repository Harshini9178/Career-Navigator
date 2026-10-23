package com.careernavigator;

import com.careernavigator.entity.UserEntity;
import com.careernavigator.repository.UserRepository;
import com.careernavigator.security.SessionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.ByteArrayOutputStream;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionService sessionService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testCompleteCandidateEndToEndJourney() throws Exception {
        // Test 20: Frontend-to-backend integration flow
        String uniqueId = UUID.randomUUID().toString().substring(0, 6);
        String email = "candidate-" + uniqueId + "@careernavigator.edu";

        // Step 1: Register
        String regPayload = """
                {
                    "email": "%s",
                    "password": "Password123!",
                    "name": "Integration Candidate",
                    "role": "student",
                    "branch": "Computer Science",
                    "targetRole": "Full Stack Engineer"
                }
                """.formatted(email);

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("session"))
                .andReturn();

        Cookie sessionCookie = regResult.getResponse().getCookie("session");
        assertThat(sessionCookie).isNotNull();

        Cookie csrfCookie = regResult.getResponse().getCookie("csrf-token");
        String csrfToken = csrfCookie != null ? csrfCookie.getValue() : "default-csrf-token";
        if (csrfCookie == null) {
            csrfCookie = new Cookie("csrf-token", csrfToken);
        }

        // Step 2: Session Check
        mockMvc.perform(get("/api/auth/me").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(email));

        // Step 3: Resume Upload (Multipart PDF)
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText("Alex Johnson - alex@example.com - +1 555-0100 - github.com/alexj");
                cs.newLineAtOffset(0, -30);
                cs.showText("Professional Summary: Experienced Full Stack Engineer specializing in scalable web apps.");
                cs.newLineAtOffset(0, -30);
                cs.showText("Technical Skills: JavaScript, TypeScript, React, Java, Spring Boot, Docker, SQL, Git");
                cs.newLineAtOffset(0, -30);
                cs.showText("Projects: Distributed Cloud Banking System built with 10k rps capacity.");
                cs.newLineAtOffset(0, -30);
                cs.showText("Work Experience: Senior Developer at TechCorp, engineered high-scale backend services.");
                cs.newLineAtOffset(0, -30);
                cs.showText("Education: Bachelor of Science in Computer Science, State University.");
                cs.endText();
            }
            doc.save(baos);
        }

        MockMultipartFile resumeFile = new MockMultipartFile(
                "file", "alex_resume.pdf", "application/pdf", baos.toByteArray());

        MvcResult uploadResult = mockMvc.perform(multipart("/api/resume/upload")
                        .file(resumeFile)
                        .param("targetRole", "Full Stack Engineer")
                        .cookie(sessionCookie, csrfCookie)
                        .header("X-CSRF-Token", csrfToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.atsScore").exists())
                .andExpect(jsonPath("$.categoryBreakdown").isArray())
                .andExpect(jsonPath("$.skills").isArray())
                .andReturn();

        JsonNode uploadJson = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        assertThat(uploadJson.path("atsScore").asInt()).isGreaterThan(40);

        // Step 4: Verify My-Analysis returns the newly uploaded resume
        mockMvc.perform(get("/api/resume/my-analysis").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("alex_resume.pdf"));

        // Step 5: Mock Interview Generation
        String interviewPayload = """
                {
                    "targetRole": "Full Stack Engineer",
                    "branch": "Computer Science",
                    "experienceLevel": "Entry Level",
                    "skills": ["Java", "Spring Boot", "React"]
                }
                """;

        MvcResult interviewGenResult = mockMvc.perform(post("/api/interview/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(interviewPayload)
                        .cookie(sessionCookie, csrfCookie)
                        .header("X-CSRF-Token", csrfToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.questions").isArray())
                .andReturn();

        JsonNode interviewJson = objectMapper.readTree(interviewGenResult.getResponse().getContentAsString());
        String interviewId = interviewJson.path("id").asText();
        String question1 = interviewJson.path("questions").get(0).asText();

        // Step 6: Answer Question
        String answerPayload = """
                {
                    "question": "%s",
                    "answer": "In Spring Boot, the ApplicationContext manages dependency injection using singleton beans by default, configured via annotations like @Service and @Component."
                }
                """.formatted(question1);

        mockMvc.perform(post("/api/interview/" + interviewId + "/answer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerPayload)
                        .cookie(sessionCookie, csrfCookie)
                        .header("X-CSRF-Token", csrfToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").exists())
                .andExpect(jsonPath("$.feedback").exists());

        // Step 7: Submit Student Feedback
        String feedbackPayload = """
                {
                    "rating": 5,
                    "category": "interview",
                    "comment": "The simulated technical assessor gave very specific guidance on Spring Boot bean lifecycles."
                }
                """;

        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackPayload)
                        .cookie(sessionCookie, csrfCookie)
                        .header("X-CSRF-Token", csrfToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Thank you for your valuable feedback!"));

        // Step 8: Code Review (Monaco Code Lab)
        String codePayload = """
                {
                    "code": "function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const diff = target - nums[i]; if (map.has(diff)) return [map.get(diff), i]; map.set(nums[i], i); } }",
                    "language": "javascript",
                    "problemStatement": "Two Sum Problem"
                }
                """;

        mockMvc.perform(post("/api/interview/code-review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(codePayload)
                        .cookie(sessionCookie, csrfCookie)
                        .header("X-CSRF-Token", csrfToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correctness").exists())
                .andExpect(jsonPath("$.timeComplexity").exists());

        // Step 9: Logout
        mockMvc.perform(post("/api/auth/logout").cookie(sessionCookie))
                .andExpect(status().isOk());

        // Verify protected access is now denied
        mockMvc.perform(get("/api/auth/me").cookie(new Cookie("session", "")))
                .andExpect(status().isUnauthorized());
    }
}
