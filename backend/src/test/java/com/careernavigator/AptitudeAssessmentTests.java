package com.careernavigator;

import com.careernavigator.entity.AptitudeQuestionEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.repository.AptitudeQuestionRepository;
import com.careernavigator.repository.AssessmentAttemptRepository;
import com.careernavigator.repository.UserRepository;
import com.careernavigator.util.AptitudeQuestionBank;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AptitudeAssessmentTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AptitudeQuestionRepository questionRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Cookie sessionCookie;
    private Cookie csrfCookie;

    @BeforeEach
    void setUpUserSession() throws Exception {
        String uid = UUID.randomUUID().toString().substring(0, 8);
        String email = "aptitude.tester." + uid + "@careernavigator.test";

        String registerPayload = """
                {
                    "email": "%s",
                    "password": "Password123!",
                    "name": "Aptitude Candidate %s",
                    "role": "student",
                    "branch": "Computer Science",
                    "targetRole": "Full Stack Engineer"
                }
                """.formatted(email, uid);

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isOk())
                .andReturn();

        sessionCookie = regResult.getResponse().getCookie("session");
        csrfCookie = regResult.getResponse().getCookie("csrf-token");
        assertThat(sessionCookie).isNotNull();
        assertThat(csrfCookie).isNotNull();
    }

    @Test
    @DisplayName("Verify Question Bank has 75 distinct, validated questions across all 5 domains")
    void testQuestionBankIntegrityAndSeeding() {
        List<AptitudeQuestionEntity> seedList = AptitudeQuestionBank.getSeedQuestions();
        assertThat(seedList).hasSize(75);

        Map<String, Integer> categoryCounts = new HashMap<>();
        Set<String> uniqueIds = new HashSet<>();

        for (AptitudeQuestionEntity q : seedList) {
            assertThat(q.getId()).isNotBlank();
            assertThat(uniqueIds.add(q.getId())).as("Duplicate question ID: " + q.getId()).isTrue();
            assertThat(q.getQuestionText()).isNotBlank();
            assertThat(q.getCategory()).isNotBlank();
            assertThat(q.getTopic()).isNotBlank();
            assertThat(q.getDifficulty()).isIn("Easy", "Medium", "Hard");
            assertThat(q.getOptions()).hasSize(4);
            assertThat(q.getCorrectAnswerIndex()).isBetween(0, 3);
            assertThat(q.getExplanation()).isNotBlank();

            categoryCounts.put(q.getCategory(), categoryCounts.getOrDefault(q.getCategory(), 0) + 1);
        }

        for (String expectedCat : AptitudeQuestionBank.ALL_CATEGORIES) {
            assertThat(categoryCounts.get(expectedCat))
                    .as("Category " + expectedCat + " must have exactly 15 questions")
                    .isEqualTo(15);
        }

        // Verify repository has also been seeded
        assertThat(questionRepository.count()).isGreaterThanOrEqualTo(75);
    }

    @Test
    @DisplayName("Verify Categories endpoint returns all 5 domains with accurate metadata")
    void testCategoriesEndpoint() throws Exception {
        mockMvc.perform(get("/api/aptitude/categories")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.categories").isArray())
                .andExpect(jsonPath("$.categories.length()").value(5))
                .andExpect(jsonPath("$.categories[0].name").exists())
                .andExpect(jsonPath("$.categories[0].totalInBank").value(15))
                .andExpect(jsonPath("$.categories[0].questionsPerTest").value(6));
    }

    @Test
    @DisplayName("Verify Starting an Attempt produces exactly 30 questions with 6 per category without leaking answers")
    void testStartAttemptCreatesThirtyQuestions() throws Exception {
        MvcResult res = mockMvc.perform(post("/api/aptitude/attempts")
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.attempt.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.attempt.totalQuestions").value(30))
                .andExpect(jsonPath("$.attempt.questions.length()").value(30))
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        JsonNode questions = root.path("attempt").path("questions");

        Map<String, Integer> perCategory = new HashMap<>();
        for (JsonNode q : questions) {
            // Client question must not contain answers or explanations
            assertThat(q.has("correctAnswerIndex")).isFalse();
            assertThat(q.has("explanation")).isFalse();
            assertThat(q.get("options")).hasSize(4);

            String cat = q.get("category").asText();
            perCategory.put(cat, perCategory.getOrDefault(cat, 0) + 1);
        }

        for (String expectedCat : AptitudeQuestionBank.ALL_CATEGORIES) {
            assertThat(perCategory.get(expectedCat))
                    .as("Expected exactly 6 questions from " + expectedCat)
                    .isEqualTo(6);
        }
    }

    @Test
    @DisplayName("Verify Saving Answers and Marking Questions for Review")
    void testSaveAnswersAndMarkForReview() throws Exception {
        // Step 1: Start attempt
        MvcResult startRes = mockMvc.perform(post("/api/aptitude/attempts")
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode startJson = objectMapper.readTree(startRes.getResponse().getContentAsString());
        String attemptId = startJson.path("attempt").path("id").asText();
        String firstQId = startJson.path("attempt").path("questions").get(0).path("id").asText();

        // Step 2: Save answer for first question
        String saveAnswerPayload = """
                {
                    "selectedOption": 2,
                    "markedForReview": true
                }
                """;

        mockMvc.perform(put("/api/aptitude/attempts/" + attemptId + "/answers/" + firstQId)
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveAnswerPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attempt.answeredCount").value(1))
                .andExpect(jsonPath("$.attempt.markedCount").value(1))
                .andExpect(jsonPath("$.attempt.answers." + firstQId).value(2));

        // Step 3: Clear review mark while keeping answer
        String unmarkPayload = """
                {
                    "selectedOption": 2,
                    "markedForReview": false
                }
                """;

        mockMvc.perform(put("/api/aptitude/attempts/" + attemptId + "/answers/" + firstQId)
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unmarkPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attempt.answeredCount").value(1))
                .andExpect(jsonPath("$.attempt.markedCount").value(0));
    }

    @Test
    @DisplayName("Verify Proctoring Violations tracking and automatic termination upon reaching 3 violations")
    void testProctoringViolationIncrementsAndTerminatesAtThree() throws Exception {
        MvcResult startRes = mockMvc.perform(post("/api/aptitude/attempts")
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue()))
                .andExpect(status().isOk())
                .andReturn();

        String attemptId = objectMapper.readTree(startRes.getResponse().getContentAsString())
                .path("attempt").path("id").asText();

        String violationPayload = """
                {
                    "eventType": "TAB_SWITCH"
                }
                """;

        // Violation 1
        mockMvc.perform(post("/api/aptitude/attempts/" + attemptId + "/violations")
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(violationPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.violationsCount").value(1))
                .andExpect(jsonPath("$.terminated").value(false));

        // Violation 2
        mockMvc.perform(post("/api/aptitude/attempts/" + attemptId + "/violations")
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(violationPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.violationsCount").value(2))
                .andExpect(jsonPath("$.terminated").value(false));

        // Violation 3 -> Auto-terminate
        mockMvc.perform(post("/api/aptitude/attempts/" + attemptId + "/violations")
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(violationPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.violationsCount").value(3))
                .andExpect(jsonPath("$.terminated").value(true))
                .andExpect(jsonPath("$.attempt.status").value("VIOLATION_TERMINATED"));
    }

    @Test
    @DisplayName("Verify Submitting Attempt calculates score, percentages, category breakdown, and solutions review")
    void testSubmitAttemptAndVerifyDetailedResult() throws Exception {
        // Start attempt
        MvcResult startRes = mockMvc.perform(post("/api/aptitude/attempts")
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode startNode = objectMapper.readTree(startRes.getResponse().getContentAsString());
        String attemptId = startNode.path("attempt").path("id").asText();

        // Answer 1st question correctly
        String firstQId = startNode.path("attempt").path("questions").get(0).path("id").asText();
        AptitudeQuestionEntity firstQ = questionRepository.findById(firstQId).orElseThrow();
        int correctIndex = firstQ.getCorrectAnswerIndex();

        mockMvc.perform(put("/api/aptitude/attempts/" + attemptId + "/answers/" + firstQId)
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"selectedOption\": " + correctIndex + "}"))
                .andExpect(status().isOk());

        // Submit attempt
        MvcResult submitRes = mockMvc.perform(post("/api/aptitude/attempts/" + attemptId + "/submit")
                        .cookie(sessionCookie)
                        .cookie(csrfCookie)
                        .header("X-CSRF-Token", csrfCookie.getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result.score").value(1))
                .andExpect(jsonPath("$.result.correctCount").value(1))
                .andExpect(jsonPath("$.result.unansweredCount").value(29))
                .andExpect(jsonPath("$.result.totalQuestions").value(30))
                .andExpect(jsonPath("$.result.categoryScores").isArray())
                .andExpect(jsonPath("$.result.questionReviews").isArray())
                .andExpect(jsonPath("$.result.questionReviews.length()").value(30))
                .andReturn();

        JsonNode resultNode = objectMapper.readTree(submitRes.getResponse().getContentAsString()).path("result");

        // Verify that in questionReviews, explanations and correct answers are now visible for review
        JsonNode firstReview = resultNode.path("questionReviews").get(0);
        assertThat(firstReview.has("correctAnswerIndex")).isTrue();
        assertThat(firstReview.has("explanation")).isTrue();
        assertThat(firstReview.path("explanation").asText()).isNotBlank();
        assertThat(firstReview.path("isCorrect").asBoolean()).isTrue();

        // Test history endpoint
        mockMvc.perform(get("/api/aptitude/history")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.history").isArray())
                .andExpect(jsonPath("$.history[0].id").value(attemptId))
                .andExpect(jsonPath("$.history[0].score").value(1));
    }
}
