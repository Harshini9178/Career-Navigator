package com.careernavigator.controller;

import com.careernavigator.dto.ResumeAnalysisResponse;
import com.careernavigator.entity.ResumeTemplateEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.service.ResumeService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeAnalysisResponse> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to analyze resume", 401);
        }
        return ResponseEntity.ok(resumeService.analyzeResume(file, targetRole, user));
    }

    @PostMapping(value = "/upload-with-jd", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeAnalysisResponse> uploadWithJobDescription(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobDescription") String jobDescription,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to analyze resume", 401);
        }
        return ResponseEntity.ok(resumeService.analyzeResumeWithJD(file, jobDescription, targetRole, user));
    }

    @GetMapping("/my-analysis")
    public ResponseEntity<ResumeAnalysisResponse> getMyAnalysis(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        return ResponseEntity.ok(resumeService.getLatestAnalysis(user.getId()));
    }

    @GetMapping("/templates")
    public ResponseEntity<List<ResumeTemplateEntity>> getTemplates() {
        return ResponseEntity.ok(resumeService.getAllTemplates());
    }

    @PostMapping("/templates/{id}/download")
    public ResponseEntity<Map<String, Object>> downloadTemplate(@PathVariable("id") String id) {
        return ResponseEntity.ok(resumeService.downloadTemplate(id));
    }
}
