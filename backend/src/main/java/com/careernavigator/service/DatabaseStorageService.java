package com.careernavigator.service;

import com.careernavigator.entity.*;
import com.careernavigator.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;

@Service
public class DatabaseStorageService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseStorageService.class);

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final InterviewRepository interviewRepository;
    private final TemplateRepository templateRepository;
    private final FeedbackRepository feedbackRepository;
    private final ResumeDocumentRepository resumeDocumentRepository;
    private final ChatConversationRepository chatConversationRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.data.db-json-path:../data/db.json}")
    private String dbJsonPath;

    public DatabaseStorageService(
            UserRepository userRepository,
            ResumeRepository resumeRepository,
            InterviewRepository interviewRepository,
            TemplateRepository templateRepository,
            FeedbackRepository feedbackRepository,
            ResumeDocumentRepository resumeDocumentRepository,
            ChatConversationRepository chatConversationRepository,
            AssessmentAttemptRepository attemptRepository,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.interviewRepository = interviewRepository;
        this.templateRepository = templateRepository;
        this.feedbackRepository = feedbackRepository;
        this.resumeDocumentRepository = resumeDocumentRepository;
        this.chatConversationRepository = chatConversationRepository;
        this.attemptRepository = attemptRepository;
        this.objectMapper = objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    private File resolveDbFile() {
        // Try relative path from working directory, then relative to parent
        Path p = Paths.get(dbJsonPath);
        if (Files.exists(p)) return p.toFile();
        Path p2 = Paths.get("data", "db.json");
        if (Files.exists(p2)) return p2.toFile();
        Path p3 = Paths.get("..", "data", "db.json");
        if (Files.exists(p3)) return p3.toFile();
        return p.toFile();
    }

    @PostConstruct
    public synchronized void initializeDatabase() {
        File dbFile = resolveDbFile();
        if (!dbFile.exists()) {
            logger.warn("db.json file not found at {}. Initializing empty in-memory state.", dbFile.getAbsolutePath());
            return;
        }

        try {
            logger.info("Loading initial dataset from {}", dbFile.getCanonicalPath());
            JsonNode root = objectMapper.readTree(dbFile);

            // 1. Users
            if (root.has("users") && root.get("users").isArray()) {
                for (JsonNode uNode : root.get("users")) {
                    UserEntity u = new UserEntity();
                    u.setId(uNode.path("id").asText(UUID.randomUUID().toString()));
                    u.setEmail(uNode.path("email").asText(""));
                    u.setName(uNode.path("name").asText(""));
                    u.setPicture(uNode.path("picture").asText(null));
                    u.setRole(uNode.path("role").asText("student"));
                    u.setBranch(uNode.path("branch").asText(null));
                    u.setTargetRole(uNode.path("targetRole").asText(null));
                    u.setExperienceLevel(uNode.path("experienceLevel").asText(null));
                    u.setCompletedProfile(uNode.path("completedProfile").asBoolean(false));
                    u.setPasswordHash(uNode.path("passwordHash").asText(null));
                    u.setPhone(uNode.has("phone") && !uNode.get("phone").isNull() ? uNode.get("phone").asText() : null);
                    u.setEmailVerified(uNode.has("emailVerified") ? uNode.get("emailVerified").asBoolean(true) : true);
                    u.setCreatedAt(uNode.path("createdAt").asText(null));
                    u.setCityState(uNode.path("cityState").asText(null));
                    u.setCollege(uNode.path("college").asText(null));
                    u.setDegree(uNode.path("degree").asText(null));
                    u.setGraduationYear(uNode.path("graduationYear").asText(null));
                    u.setCurrentSemester(uNode.path("currentSemester").asText(null));
                    u.setLinkedIn(uNode.path("linkedIn").asText(null));
                    u.setGithub(uNode.path("github").asText(null));
                    u.setPortfolioWebsite(uNode.path("portfolioWebsite").asText(null));
                    u.setPreferredLocation(uNode.path("preferredLocation").asText(null));
                    u.setWorkPreference(uNode.path("workPreference").asText(null));
                    u.setExpectedSalary(uNode.path("expectedSalary").asText(null));
                    u.setEmploymentType(uNode.path("employmentType").asText(null));
                    u.setTargetCompanies(uNode.path("targetCompanies").asText(null));
                    u.setSkillsDataJson(uNode.path("skillsDataJson").asText(null));
                    u.setProjectsDataJson(uNode.path("projectsDataJson").asText(null));
                    u.setEducationDataJson(uNode.path("educationDataJson").asText(null));
                    u.setCertificationsDataJson(uNode.path("certificationsDataJson").asText(null));
                    u.setExperienceDataJson(uNode.path("experienceDataJson").asText(null));
                    u.setInterviewPreferencesJson(uNode.path("interviewPreferencesJson").asText(null));

                    if (uNode.has("skills") && uNode.get("skills").isArray()) {
                        List<String> skills = new ArrayList<>();
                        uNode.get("skills").forEach(s -> skills.add(s.asText()));
                        u.setSkills(skills);
                    }
                    if (uNode.has("projects") && uNode.get("projects").isArray()) {
                        List<String> projects = new ArrayList<>();
                        uNode.get("projects").forEach(p -> projects.add(p.asText()));
                        u.setProjects(projects);
                    }

                    if (!u.getEmail().isEmpty()) {
                        userRepository.save(u);
                    }
                }
                logger.info("Imported {} users from db.json", userRepository.count());
            }

            // 2. Resumes
            if (root.has("resumes") && root.get("resumes").isArray()) {
                for (JsonNode rNode : root.get("resumes")) {
                    ResumeAnalysisEntity r = new ResumeAnalysisEntity();
                    r.setId(rNode.path("id").asText(UUID.randomUUID().toString()));
                    r.setUserId(rNode.path("userId").asText(""));
                    r.setFileName(rNode.path("fileName").asText(""));
                    r.setUploadedAt(rNode.path("uploadedAt").asText(""));
                    r.setAtsScore(rNode.path("atsScore").asInt(75));
                    r.setWordCount(rNode.path("wordCount").asInt(300));
                    r.setContentHash(rNode.path("contentHash").asText(""));
                    r.setTargetRole(rNode.path("targetRole").asText(null));
                    r.setJdMatchScore(rNode.has("jdMatchScore") ? rNode.get("jdMatchScore").asInt() : null);
                    r.setJobDescription(rNode.path("jobDescription").asText(null));

                    if (rNode.has("skills") && rNode.get("skills").isArray()) {
                        List<String> list = new ArrayList<>();
                        rNode.get("skills").forEach(s -> list.add(s.asText()));
                        r.setSkills(list);
                    }
                    if (rNode.has("missingSections") && rNode.get("missingSections").isArray()) {
                        List<String> list = new ArrayList<>();
                        rNode.get("missingSections").forEach(s -> list.add(s.asText()));
                        r.setMissingSections(list);
                    }
                    if (rNode.has("suggestions") && rNode.get("suggestions").isArray()) {
                        List<String> list = new ArrayList<>();
                        rNode.get("suggestions").forEach(s -> list.add(s.asText()));
                        r.setSuggestions(list);
                    }
                    if (rNode.has("grammarIssues") && rNode.get("grammarIssues").isArray()) {
                        List<String> list = new ArrayList<>();
                        rNode.get("grammarIssues").forEach(s -> list.add(s.asText()));
                        r.setGrammarIssues(list);
                    }
                    if (rNode.has("improvementsToAdd") && rNode.get("improvementsToAdd").isArray()) {
                        List<String> list = new ArrayList<>();
                        rNode.get("improvementsToAdd").forEach(s -> list.add(s.asText()));
                        r.setImprovementsToAdd(list);
                    }
                    if (rNode.has("improvementsToRemove") && rNode.get("improvementsToRemove").isArray()) {
                        List<String> list = new ArrayList<>();
                        rNode.get("improvementsToRemove").forEach(s -> list.add(s.asText()));
                        r.setImprovementsToRemove(list);
                    }
                    if (rNode.has("keywords")) {
                        r.setKeywordsJson(rNode.get("keywords").toString());
                    }
                    if (rNode.has("categoryBreakdown")) {
                        r.setCategoryBreakdownJson(rNode.get("categoryBreakdown").toString());
                    }
                    if (rNode.has("sectionDetails")) {
                        r.setSectionDetailsJson(rNode.get("sectionDetails").toString());
                    }

                    resumeRepository.save(r);
                }
                logger.info("Imported {} resumes from db.json", resumeRepository.count());
            }

            // 3. Interviews
            if (root.has("interviews") && root.get("interviews").isArray()) {
                for (JsonNode iNode : root.get("interviews")) {
                    MockInterviewEntity i = new MockInterviewEntity();
                    i.setId(iNode.path("id").asText(UUID.randomUUID().toString()));
                    i.setUserId(iNode.path("userId").asText(""));
                    String dateVal = iNode.path("date").asText("");
                    if (dateVal.isBlank() && iNode.has("createdAt")) {
                        dateVal = iNode.path("createdAt").asText("");
                    }
                    if (dateVal.isBlank()) {
                        dateVal = new Date().toInstant().toString();
                    }
                    i.setDate(dateVal);
                    i.setJobRole(iNode.path("jobRole").asText("Full Stack Engineer"));
                    i.setBranch(iNode.path("branch").asText(null));
                    i.setExperienceLevel(iNode.path("experienceLevel").asText(null));
                    i.setOverallScore(iNode.path("overallScore").asInt(70));
                    i.setTechnicalScore(iNode.path("technicalScore").asInt(70));
                    i.setCommunicationScore(iNode.path("communicationScore").asInt(70));
                    i.setConfidenceScore(iNode.path("confidenceScore").asInt(70));
                    i.setFeedbackText(iNode.path("feedbackText").asText(""));

                    if (iNode.has("suggestions") && iNode.get("suggestions").isArray()) {
                        List<String> list = new ArrayList<>();
                        iNode.get("suggestions").forEach(s -> list.add(s.asText()));
                        i.setSuggestions(list);
                    }
                    if (iNode.has("qas")) {
                        i.setQasJson(iNode.get("qas").toString());
                    } else if (iNode.has("questions")) {
                        List<Map<String, Object>> qasList = new ArrayList<>();
                        JsonNode qArr = iNode.get("questions");
                        JsonNode aArr = iNode.has("answers") ? iNode.get("answers") : null;
                        int idx = 0;
                        for (JsonNode qNode : qArr) {
                            Map<String, Object> qa = new LinkedHashMap<>();
                            qa.put("question", qNode.asText());
                            if (aArr != null && aArr.has(idx)) {
                                qa.put("answer", aArr.get(idx).path("answer").asText(""));
                            } else {
                                qa.put("answer", "");
                            }
                            qasList.add(qa);
                            idx++;
                        }
                        i.setQasJson(objectMapper.writeValueAsString(qasList));
                    }

                    if (i.getQasJson() == null || i.getQasJson().isBlank()) {
                        List<Map<String, Object>> defaultQas = new ArrayList<>();
                        String[] defaultQuestions = {
                                "Explain the core architectural patterns you use in " + i.getJobRole(),
                                "How do you design and structure scalable microservice APIs?",
                                "Describe a challenging technical debugging problem you resolved."
                        };
                        for (String dq : defaultQuestions) {
                            Map<String, Object> qa = new LinkedHashMap<>();
                            qa.put("question", dq);
                            qa.put("answer", "Evaluated during assessment session.");
                            defaultQas.add(qa);
                        }
                        i.setQasJson(objectMapper.writeValueAsString(defaultQas));
                    }

                    interviewRepository.save(i);
                }
                logger.info("Imported {} interviews from db.json", interviewRepository.count());
            }

            // 4. Templates
            if (root.has("templates") && root.get("templates").isArray()) {
                for (JsonNode tNode : root.get("templates")) {
                    ResumeTemplateEntity t = new ResumeTemplateEntity();
                    t.setId(tNode.path("id").asText(UUID.randomUUID().toString()));
                    t.setName(tNode.path("name").asText("Standard Resume Template"));
                    t.setTargetRole(tNode.path("targetRole").asText("Software Engineer"));
                    t.setAtsScore(tNode.path("atsScore").asInt(92));
                    t.setDownloads(tNode.has("downloads") ? tNode.get("downloads").asInt() : tNode.path("downloadCount").asInt(0));
                    t.setCategory(tNode.path("category").asText(tNode.path("description").asText("Standard")));
                    if (tNode.has("tags") && tNode.get("tags").isArray()) {
                        List<String> list = new ArrayList<>();
                        tNode.get("tags").forEach(s -> list.add(s.asText()));
                        t.setTags(list);
                    }
                    if (tNode.has("sections")) {
                        t.setSectionsJson(tNode.get("sections").toString());
                    } else if (tNode.has("fileContent")) {
                        t.setSectionsJson(tNode.get("fileContent").asText());
                    }
                    templateRepository.save(t);
                }
                logger.info("Imported {} templates from db.json", templateRepository.count());
            }

            // 5. Feedback
            if (root.has("feedback") && root.get("feedback").isArray()) {
                for (JsonNode fNode : root.get("feedback")) {
                    StudentFeedbackEntity f = new StudentFeedbackEntity();
                    f.setId(fNode.path("id").asText(UUID.randomUUID().toString()));
                    f.setUserId(fNode.path("userId").asText(""));
                    f.setStudentName(fNode.has("studentName") ? fNode.path("studentName").asText("") : fNode.path("userName").asText(""));
                    f.setEmail(fNode.path("email").asText(""));
                    f.setRating(fNode.path("rating").asInt(5));
                    f.setCategory(fNode.path("category").asText("general"));
                    f.setComment(fNode.path("comment").asText(""));
                    f.setCreatedAt(fNode.path("createdAt").asText(""));
                    feedbackRepository.save(f);
                }
                logger.info("Imported {} feedbacks from db.json", feedbackRepository.count());
            }

            // 6. Resume Documents (Builder)
            if (root.has("resumeDocuments") && root.get("resumeDocuments").isArray()) {
                for (JsonNode rNode : root.get("resumeDocuments")) {
                    ResumeDocumentEntity rd = new ResumeDocumentEntity();
                    rd.setId(rNode.path("id").asText(UUID.randomUUID().toString()));
                    rd.setUserId(rNode.path("userId").asText(""));
                    rd.setTitle(rNode.path("title").asText("Professional Resume"));
                    rd.setTargetRole(rNode.path("targetRole").asText("Full Stack Engineer"));
                    rd.setTemplateId(rNode.path("templateId").asText("classic-ats"));
                    rd.setAtsScore(rNode.path("atsScore").asInt(85));
                    rd.setContentJson(rNode.has("contentJson") ? rNode.get("contentJson").asText() : "{}");
                    rd.setCreatedAt(rNode.path("createdAt").asText(Instant.now().toString()));
                    rd.setUpdatedAt(rNode.path("updatedAt").asText(Instant.now().toString()));
                    resumeDocumentRepository.save(rd);
                }
                logger.info("Imported {} resume documents from db.json", resumeDocumentRepository.count());
            }

            // 7. Chat Conversations
            if (root.has("chatConversations") && root.get("chatConversations").isArray()) {
                for (JsonNode cNode : root.get("chatConversations")) {
                    ChatConversationEntity c = new ChatConversationEntity();
                    c.setId(cNode.path("id").asText(UUID.randomUUID().toString()));
                    c.setUserId(cNode.path("userId").asText(""));
                    c.setTitle(cNode.path("title").asText("New Chat"));
                    c.setLearningMode(cNode.path("learningMode").asBoolean(false));
                    c.setMessagesJson(cNode.has("messagesJson") ? cNode.path("messagesJson").asText("[]") : "[]");
                    c.setCareerContextJson(cNode.has("careerContextJson") ? cNode.path("careerContextJson").asText("{}") : "{}");
                    c.setCreatedAt(cNode.path("createdAt").asText(""));
                    c.setUpdatedAt(cNode.path("updatedAt").asText(""));
                    chatConversationRepository.save(c);
                }
                logger.info("Imported {} chat conversations from db.json", chatConversationRepository.count());
            }

            // 8. Aptitude Attempts
            if (root.has("aptitudeAttempts") && root.get("aptitudeAttempts").isArray()) {
                for (JsonNode aNode : root.get("aptitudeAttempts")) {
                    AssessmentAttemptEntity att = new AssessmentAttemptEntity();
                    att.setId(aNode.path("id").asText(UUID.randomUUID().toString()));
                    att.setUserId(aNode.path("userId").asText(""));
                    att.setStatus(aNode.path("status").asText("COMPLETED"));
                    att.setStartedAt(aNode.path("startedAt").asText(""));
                    att.setDeadline(aNode.path("deadline").asText(""));
                    att.setCompletedAt(aNode.path("completedAt").asText(null));
                    att.setDurationSeconds(aNode.path("durationSeconds").asInt(0));
                    att.setScore(aNode.path("score").asInt(0));
                    att.setPercentage(aNode.path("percentage").asDouble(0.0));
                    att.setTotalQuestions(aNode.path("totalQuestions").asInt(30));
                    att.setViolationsCount(aNode.path("violationsCount").asInt(0));
                    att.setForcedSubmissionReason(aNode.path("forcedSubmissionReason").asText(null));
                    att.setQuestionsJson(aNode.has("questionsJson") ? aNode.path("questionsJson").asText("[]") : "[]");
                    att.setAnswersJson(aNode.has("answersJson") ? aNode.path("answersJson").asText("{}") : "{}");
                    att.setMarkedForReviewJson(aNode.has("markedForReviewJson") ? aNode.path("markedForReviewJson").asText("[]") : "[]");
                    att.setCategoryScoresJson(aNode.has("categoryScoresJson") ? aNode.path("categoryScoresJson").asText("{}") : "{}");
                    attemptRepository.save(att);
                }
                logger.info("Imported {} aptitude attempts from db.json", attemptRepository.count());
            }

        } catch (Exception e) {
            logger.error("Failed to parse db.json: {}", e.getMessage(), e);
        }
    }

    public synchronized void syncToDbJson() {
        File dbFile = resolveDbFile();
        if (!dbFile.exists() && dbFile.getParentFile() != null) {
            dbFile.getParentFile().mkdirs();
        }

        try {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("users", userRepository.findAll());
            data.put("resumes", resumeRepository.findAll());
            data.put("interviews", interviewRepository.findAll());
            data.put("templates", templateRepository.findAll());
            data.put("feedback", feedbackRepository.findAll());
            data.put("resumeDocuments", resumeDocumentRepository.findAll());
            data.put("chatConversations", chatConversationRepository.findAll());
            data.put("aptitudeAttempts", attemptRepository.findAll());

            objectMapper.writeValue(dbFile, data);
            logger.debug("Synchronized current state to {}", dbFile.getAbsolutePath());
        } catch (IOException e) {
            logger.error("Failed to sync to db.json: {}", e.getMessage(), e);
        }
    }
}
