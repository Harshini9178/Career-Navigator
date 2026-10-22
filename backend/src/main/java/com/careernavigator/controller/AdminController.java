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
        return ResponseEntity.ok(adminService.getMetrics());
    }

    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> getStudents() {
        return ResponseEntity.ok(adminService.getStudents());
    }

    @GetMapping("/feedbacks")
    public ResponseEntity<List<StudentFeedbackEntity>> getFeedbacks() {
        return ResponseEntity.ok(adminService.getFeedbacks());
    }

    @GetMapping("/interview/{id}")
    public ResponseEntity<Map<String, Object>> getInterview(@PathVariable("id") String id) {
        return ResponseEntity.ok(interviewService.getInterview(id, null));
    }

    @GetMapping("/student/{userId}/interviews")
    public ResponseEntity<List<MockInterviewEntity>> getStudentInterviews(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(adminService.getStudentInterviews(userId));
    }

    @GetMapping("/student/{userId}/resume")
    public ResponseEntity<ResumeAnalysisEntity> getStudentResume(@PathVariable("userId") String userId) {
        return adminService.getStudentResume(userId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ApiException("Resume not found for student", 404));
    }

    @PostMapping("/templates")
    public ResponseEntity<ResumeTemplateEntity> createTemplate(@RequestBody ResumeTemplateEntity template) {
        return ResponseEntity.ok(adminService.createTemplate(template));
    }

    @PutMapping("/templates/{id}")
    public ResponseEntity<ResumeTemplateEntity> updateTemplate(
            @PathVariable("id") String id,
            @RequestBody ResumeTemplateEntity template) {
        return ResponseEntity.ok(adminService.updateTemplate(id, template));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Map<String, String>> deleteTemplate(@PathVariable("id") String id) {
        adminService.deleteTemplate(id);
        return ResponseEntity.ok(Map.of("message", "Template deleted successfully"));
    }
}
