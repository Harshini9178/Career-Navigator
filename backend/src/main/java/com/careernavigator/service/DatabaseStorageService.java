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
import java.util.*;

@Service
public class DatabaseStorageService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseStorageService.class);

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final InterviewRepository interviewRepository;
    private final TemplateRepository templateRepository;
    private final FeedbackRepository feedbackRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.data.db-json-path:../data/db.json}")
    private String dbJsonPath;

    public DatabaseStorageService(
            UserRepository userRepository,
            ResumeRepository resumeRepository,
            InterviewRepository interviewRepository,
            TemplateRepository templateRepository,
            FeedbackRepository feedbackRepository,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.interviewRepository = interviewRepository;
        this.templateRepository = templateRepository;
        this.feedbackRepository = feedbackRepository;
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
                    i.setDate(iNode.path("date").asText(""));
                    i.setJobRole(iNode.path("jobRole").asText(""));
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

            objectMapper.writeValue(dbFile, data);
            logger.debug("Synchronized current state to {}", dbFile.getAbsolutePath());
        } catch (IOException e) {
            logger.error("Failed to sync to db.json: {}", e.getMessage(), e);
        }
    }
}
