package com.careernavigator.service;

import com.careernavigator.dto.InterviewRequests.*;
import com.careernavigator.entity.MockInterviewEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.repository.InterviewRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final GeminiService geminiService;
    private final DatabaseStorageService databaseStorageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public InterviewService(
            InterviewRepository interviewRepository,
            GeminiService geminiService,
            DatabaseStorageService databaseStorageService) {
        this.interviewRepository = interviewRepository;
        this.geminiService = geminiService;
        this.databaseStorageService = databaseStorageService;
    }

    public Map<String, Object> generateInterview(GenerateInterviewRequest req, UserEntity user) {
        String role = req.getTargetRole() != null ? req.getTargetRole() : "Full Stack Developer";
        String branch = req.getBranch() != null ? req.getBranch() : "Computer Science";
        String level = req.getExperienceLevel() != null ? req.getExperienceLevel() : "Entry Level";
        List<String> skills = req.getSkills() != null ? req.getSkills() : List.of("Java", "Spring Boot", "React");
        List<String> projects = req.getProjects() != null ? req.getProjects() : List.of("Placement Navigator");

        List<String> questions = geminiService.generateQuestions(branch, skills, projects, role, level);

        MockInterviewEntity interview = new MockInterviewEntity();
        interview.setId("int-" + UUID.randomUUID().toString().substring(0, 8));
        interview.setUserId(user != null ? user.getId() : "anonymous");
        interview.setDate(new Date().toInstant().toString());
        interview.setJobRole(role);
        interview.setBranch(branch);
        interview.setExperienceLevel(level);

        List<Map<String, Object>> qasList = new ArrayList<>();
        for (String q : questions) {
            Map<String, Object> qa = new LinkedHashMap<>();
            qa.put("question", q);
            qa.put("answer", "");
            qasList.add(qa);
        }

        try {
            interview.setQasJson(objectMapper.writeValueAsString(qasList));
            interviewRepository.save(interview);
            databaseStorageService.syncToDbJson();
        } catch (Exception ignored) {
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", interview.getId());
        res.put("userId", interview.getUserId());
        res.put("jobRole", role);
        res.put("branch", branch);
        res.put("experienceLevel", level);
        res.put("status", "started");
        res.put("questions", questions);
        res.put("answers", Collections.emptyList());
        res.put("currentQuestionIndex", 0);
        res.put("date", interview.getDate());
        res.put("createdAt", interview.getDate());
        res.put("suggestions", Collections.emptyList());
        return res;
    }

    public Map<String, Object> getInterview(String interviewId, UserEntity user) {
        MockInterviewEntity interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ApiException("Interview session not found", 404));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", interview.getId());
        res.put("userId", interview.getUserId());
        res.put("jobRole", interview.getJobRole());
        res.put("branch", interview.getBranch());
        res.put("experienceLevel", interview.getExperienceLevel());
        res.put("date", interview.getDate());
        res.put("createdAt", interview.getDate() != null ? interview.getDate() : "");
        res.put("overallScore", interview.getOverallScore());
        res.put("technicalScore", interview.getTechnicalScore());
        res.put("communicationScore", interview.getCommunicationScore());
        res.put("confidenceScore", interview.getConfidenceScore());
        res.put("feedbackText", interview.getFeedbackText());
        res.put("suggestions", interview.getSuggestions() != null ? interview.getSuggestions() : Collections.emptyList());

        List<String> questions = new ArrayList<>();
        List<Map<String, Object>> answers = new ArrayList<>();
        try {
            if (interview.getQasJson() != null) {
                List<Map<String, Object>> qasList = objectMapper.readValue(interview.getQasJson(), new TypeReference<>() {});
                for (Map<String, Object> qa : qasList) {
                    if (qa.get("question") != null) questions.add(qa.get("question").toString());
                    if (qa.get("answer") != null && !qa.get("answer").toString().isBlank()) {
                        answers.add(qa);
                    }
                }
            }
        } catch (Exception ignored) {
        }
        res.put("questions", questions);
        res.put("answers", answers);
        res.put("currentQuestionIndex", answers.size());
        res.put("status", (interview.getOverallScore() != null || (questions.size() > 0 && answers.size() >= questions.size())) ? "completed" : "started");

        return res;
    }

    public List<MockInterviewEntity> getUserInterviewHistory(String userId) {
        return interviewRepository.findByUserIdOrderByDateDesc(userId);
    }

    public Map<String, Object> evaluateAnswer(String interviewId, AnswerRequest req, UserEntity user) {
        MockInterviewEntity interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ApiException("Interview not found", 404));

        Map<String, Object> eval;
        try {
            List<Map<String, Object>> qasList = new ArrayList<>();
            if (interview.getQasJson() != null) {
                qasList = objectMapper.readValue(interview.getQasJson(), new TypeReference<>() {});
            }

            String question = req.getQuestion();
            if (question == null || question.isBlank()) {
                for (Map<String, Object> qa : qasList) {
                    if (qa.get("answer") == null || qa.get("answer").toString().isBlank()) {
                        question = qa.get("question") != null ? qa.get("question").toString() : null;
                        break;
                    }
                }
                if (question == null || question.isBlank()) {
                    question = "Interview Technical Question";
                }
            }

            eval = geminiService.evaluateAnswer(question, req.getAnswer());

            boolean found = false;
            for (Map<String, Object> qa : qasList) {
                if (question.equals(qa.get("question")) || qa.get("answer") == null || qa.get("answer").toString().isBlank()) {
                    qa.put("question", question);
                    qa.put("answer", req.getAnswer());
                    qa.put("evaluation", eval);
                    found = true;
                    break;
                }
            }
            if (!found) {
                Map<String, Object> newQa = new LinkedHashMap<>();
                newQa.put("question", question);
                newQa.put("answer", req.getAnswer());
                newQa.put("evaluation", eval);
                qasList.add(newQa);
            }

            // Check if all answered to generate overall report
            boolean allAnswered = qasList.stream().allMatch(qa -> qa.get("answer") != null && !qa.get("answer").toString().isBlank());
            if (allAnswered && qasList.size() >= 3) {
                Map<String, Object> report = geminiService.generateOverallReport(interview.getJobRole(), qasList);
                interview.setOverallScore((Integer) report.get("overallScore"));
                interview.setTechnicalScore((Integer) report.get("technicalScore"));
                interview.setCommunicationScore((Integer) report.get("communicationScore"));
                interview.setConfidenceScore((Integer) report.get("confidenceScore"));
                interview.setFeedbackText((String) report.get("feedbackText"));
                @SuppressWarnings("unchecked")
                List<String> suggestions = (List<String>) report.get("suggestions");
                interview.setSuggestions(suggestions);
            }

            interview.setQasJson(objectMapper.writeValueAsString(qasList));
            interviewRepository.save(interview);
            databaseStorageService.syncToDbJson();

        } catch (Exception e) {
            throw new ApiException("Failed to record answer evaluation: " + e.getMessage(), 500);
        }

        return eval;
    }

    public Map<String, Object> reviewCode(CodeReviewRequest req) {
        if (req.getCode() == null || req.getCode().trim().isEmpty()) {
            throw new ApiException("Please provide non-empty code for review.", 400);
        }
        return geminiService.reviewCode(req.getCode(), req.getLanguage(), req.getProblemStatement());
    }
}
