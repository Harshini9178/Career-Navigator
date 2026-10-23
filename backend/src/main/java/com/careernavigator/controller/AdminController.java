package com.careernavigator.controller;

import com.careernavigator.entity.MockInterviewEntity;
import com.careernavigator.entity.ResumeAnalysisEntity;
import com.careernavigator.entity.ResumeTemplateEntity;
import com.careernavigator.entity.StudentFeedbackEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.service.AdminService;
import com.careernavigator.service.InterviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final InterviewService interviewService;

    public AdminController(AdminService adminService, InterviewService interviewService) {
        this.adminService = adminService;
        this.interviewService = interviewService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        Map<String, Object> metrics = adminService.getMetrics();
        Map<String, Object> body = new java.util.LinkedHashMap<>(metrics);
        body.put("success", true);
        body.put("metrics", metrics);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/students")
    public ResponseEntity<Map<String, Object>> getStudents() {
        List<Map<String, Object>> students = adminService.getStudents();
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("success", true);
        body.put("students", students);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/feedbacks")
    public ResponseEntity<Map<String, Object>> getFeedbacks() {
        List<StudentFeedbackEntity> feedbacks = adminService.getFeedbacks();
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("success", true);
        body.put("feedbacks", feedbacks);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/interview/{id}")
    public ResponseEntity<Map<String, Object>> getInterview(@PathVariable("id") String id) {
        Map<String, Object> intv = interviewService.getInterview(id, null);
        Map<String, Object> body = new java.util.LinkedHashMap<>(intv);
        body.put("success", true);
        body.put("interview", intv);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/student/{userId}/interviews")
    public ResponseEntity<Map<String, Object>> getStudentInterviews(@PathVariable("userId") String userId) {
        List<MockInterviewEntity> interviews = adminService.getStudentInterviews(userId);
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("success", true);
        body.put("interviews", interviews);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/student/{userId}/resume")
    public ResponseEntity<Map<String, Object>> getStudentResume(@PathVariable("userId") String userId) {
        Optional<ResumeAnalysisEntity> resume = adminService.getStudentResume(userId);
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("success", true);
        body.put("analysis", resume.orElse(null));
        return ResponseEntity.ok(body);
    }

    @PostMapping("/templates")
    public ResponseEntity<Map<String, Object>> createTemplate(@RequestBody ResumeTemplateEntity template) {
        ResumeTemplateEntity saved = adminService.createTemplate(template);
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("success", true);
        body.put("template", saved);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/templates/{id}")
    public ResponseEntity<Map<String, Object>> updateTemplate(
            @PathVariable("id") String id,
            @RequestBody ResumeTemplateEntity template) {
        ResumeTemplateEntity updated = adminService.updateTemplate(id, template);
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("success", true);
        body.put("template", updated);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Map<String, Object>> deleteTemplate(@PathVariable("id") String id) {
        adminService.deleteTemplate(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Template deleted successfully"));
    }
}
