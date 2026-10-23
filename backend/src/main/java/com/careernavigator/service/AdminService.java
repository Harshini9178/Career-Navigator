package com.careernavigator.service;

import com.careernavigator.entity.MockInterviewEntity;
import com.careernavigator.entity.ResumeAnalysisEntity;
import com.careernavigator.entity.ResumeTemplateEntity;
import com.careernavigator.entity.StudentFeedbackEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final InterviewRepository interviewRepository;
    private final FeedbackRepository feedbackRepository;
    private final TemplateRepository templateRepository;
    private final DatabaseStorageService databaseStorageService;

    public AdminService(
            UserRepository userRepository,
            ResumeRepository resumeRepository,
            InterviewRepository interviewRepository,
            FeedbackRepository feedbackRepository,
            TemplateRepository templateRepository,
            DatabaseStorageService databaseStorageService) {
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.interviewRepository = interviewRepository;
        this.feedbackRepository = feedbackRepository;
        this.templateRepository = templateRepository;
        this.databaseStorageService = databaseStorageService;
    }

    public Map<String, Object> getMetrics() {
        List<UserEntity> students = userRepository.findAll().stream()
                .filter(u -> !"admin".equalsIgnoreCase(u.getRole()))
                .toList();

        List<MockInterviewEntity> interviews = interviewRepository.findAll();
        List<ResumeAnalysisEntity> resumes = resumeRepository.findAll();

        double avgAts = resumes.stream()
                .filter(r -> r.getAtsScore() != null)
                .mapToInt(ResumeAnalysisEntity::getAtsScore)
                .average().orElse(78.0);

        double avgInterview = interviews.stream()
                .filter(i -> i.getOverallScore() != null)
                .mapToInt(MockInterviewEntity::getOverallScore)
                .average().orElse(74.0);

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalStudents", students.size());
        metrics.put("totalInterviews", interviews.size());
        metrics.put("totalResumes", resumes.size());
        metrics.put("averageAtsScore", Math.round(avgAts));
        metrics.put("averageInterviewScore", Math.round(avgInterview));
        metrics.put("avgATSScore", Math.round(avgAts));
        metrics.put("avgInterviewScore", Math.round(avgInterview));
        metrics.put("readinessRate", Math.round((avgAts + avgInterview) / 2.0));

        // Branch Distribution
        Map<String, Long> branchMap = students.stream()
                .filter(u -> u.getBranch() != null && !u.getBranch().isBlank())
                .collect(java.util.stream.Collectors.groupingBy(UserEntity::getBranch, java.util.stream.Collectors.counting()));
        List<Map<String, Object>> branchDistribution = new ArrayList<>();
        branchMap.forEach((branch, count) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("branch", branch);
            item.put("count", count.intValue());
            branchDistribution.add(item);
        });
        if (branchDistribution.isEmpty()) {
            branchDistribution.add(Map.of("branch", "General Engineering", "count", students.size()));
        }
        metrics.put("branchDistribution", branchDistribution);

        // Weekly Activity Trends
        List<Map<String, Object>> weeklyInterviews = new ArrayList<>();
        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        int baseCount = interviews.isEmpty() ? 0 : Math.max(1, interviews.size() / 7);
        for (String day : days) {
            Map<String, Object> dayMap = new LinkedHashMap<>();
            dayMap.put("name", day);
            dayMap.put("count", baseCount);
            weeklyInterviews.add(dayMap);
        }
        metrics.put("weeklyInterviews", weeklyInterviews);

        // Recent Audit Activity
        List<Map<String, Object>> recentActivity = new ArrayList<>();
        for (ResumeAnalysisEntity r : resumes.stream().limit(5).toList()) {
            Map<String, Object> act = new LinkedHashMap<>();
            act.put("id", "act-r-" + r.getId());
            act.put("type", "resume_upload");
            act.put("userName", r.getFileName() != null ? r.getFileName() : "Student");
            act.put("detail", "ATS Score: " + (r.getAtsScore() != null ? r.getAtsScore() : 75) + "%");
            act.put("timestamp", r.getUploadedAt() != null ? r.getUploadedAt() : new Date().toInstant().toString());
            recentActivity.add(act);
        }
        metrics.put("recentActivity", recentActivity);

        return metrics;
    }

    public List<Map<String, Object>> getStudents() {
        List<UserEntity> students = userRepository.findAll().stream()
                .filter(u -> !"admin".equalsIgnoreCase(u.getRole()))
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (UserEntity s : students) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("name", s.getName());
            map.put("email", s.getEmail());
            map.put("branch", s.getBranch());
            map.put("targetRole", s.getTargetRole());
            map.put("skills", s.getSkills());
            map.put("completedProfile", s.getCompletedProfile());

            int interviewCount = interviewRepository.findByUserIdOrderByDateDesc(s.getId()).size();
            map.put("interviewsCount", interviewCount);

            Optional<ResumeAnalysisEntity> latestResume = resumeRepository.findFirstByUserIdOrderByUploadedAtDesc(s.getId());
            map.put("hasResume", latestResume.isPresent());
            map.put("atsScore", latestResume.map(ResumeAnalysisEntity::getAtsScore).orElse(null));

            result.add(map);
        }
        return result;
    }

    public List<StudentFeedbackEntity> getFeedbacks() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<MockInterviewEntity> getStudentInterviews(String userId) {
        return interviewRepository.findByUserIdOrderByDateDesc(userId);
    }

    public Optional<ResumeAnalysisEntity> getStudentResume(String userId) {
        return resumeRepository.findFirstByUserIdOrderByUploadedAtDesc(userId);
    }

    public ResumeTemplateEntity createTemplate(ResumeTemplateEntity template) {
        if (template.getId() == null || template.getId().isBlank()) {
            template.setId("tmpl-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (template.getDownloads() == null) {
            template.setDownloads(0);
        }
        ResumeTemplateEntity saved = templateRepository.save(template);
        databaseStorageService.syncToDbJson();
        return saved;
    }

    public ResumeTemplateEntity updateTemplate(String id, ResumeTemplateEntity updated) {
        ResumeTemplateEntity existing = templateRepository.findById(id)
                .orElseThrow(() -> new ApiException("Template not found", 404));

        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getTargetRole() != null) existing.setTargetRole(updated.getTargetRole());
        if (updated.getAtsScore() != null) existing.setAtsScore(updated.getAtsScore());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getTags() != null) existing.setTags(updated.getTags());
        if (updated.getSectionsJson() != null) existing.setSectionsJson(updated.getSectionsJson());

        ResumeTemplateEntity saved = templateRepository.save(existing);
        databaseStorageService.syncToDbJson();
        return saved;
    }

    public void deleteTemplate(String id) {
        if (!templateRepository.existsById(id)) {
            throw new ApiException("Template not found", 404);
        }
        templateRepository.deleteById(id);
        databaseStorageService.syncToDbJson();
    }
}
