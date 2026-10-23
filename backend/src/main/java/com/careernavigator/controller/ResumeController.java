package com.careernavigator.controller;

import com.careernavigator.dto.ResumeAnalysisResponse;
import com.careernavigator.entity.ResumeTemplateEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.service.ResumeService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeService resumeService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    private Map<String, Object> formatResponse(ResumeAnalysisResponse resp) {
        Map<String, Object> body = objectMapper.convertValue(resp, new TypeReference<Map<String, Object>>() {});
        body.put("success", true);
        body.put("analysis", resp);
        return body;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadResumeMultipart(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to analyze resume", 401);
        }
        ResumeAnalysisResponse resp = resumeService.analyzeResume(file, targetRole, user);
        return ResponseEntity.ok(formatResponse(resp));
    }

    @PostMapping(value = "/upload", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> uploadResumeJson(
            @RequestBody ResumeUploadJsonRequest req,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to analyze resume", 401);
        }
        ResumeAnalysisResponse resp = resumeService.analyzeResumeText(
                req.getResumeText(), req.getFileName(), req.getTargetRole(), null, user);
        return ResponseEntity.ok(formatResponse(resp));
    }

    @PostMapping(value = "/upload-with-jd", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadWithJobDescriptionMultipart(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobDescription") String jobDescription,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to analyze resume", 401);
        }
        ResumeAnalysisResponse resp = resumeService.analyzeResumeWithJD(file, jobDescription, targetRole, user);
        return ResponseEntity.ok(formatResponse(resp));
    }

    @PostMapping(value = "/upload-with-jd", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> uploadWithJobDescriptionJson(
            @RequestBody ResumeWithJdJsonRequest req,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to analyze resume", 401);
        }
        ResumeAnalysisResponse resp = resumeService.analyzeResumeText(
                req.getResumeText(), req.getFileName(), req.getTargetRole(), req.getJobDescription(), user);
        return ResponseEntity.ok(formatResponse(resp));
    }

    @GetMapping("/my-analysis")
    public ResponseEntity<Map<String, Object>> getMyAnalysis(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        Optional<ResumeAnalysisResponse> opt = resumeService.findLatestAnalysis(user.getId());
        if (opt.isEmpty()) {
            Map<String, Object> emptyBody = new LinkedHashMap<>();
            emptyBody.put("success", true);
            emptyBody.put("analysis", null);
            return ResponseEntity.ok(emptyBody);
        }
        return ResponseEntity.ok(formatResponse(opt.get()));
    }

    @GetMapping("/templates")
    public ResponseEntity<Map<String, Object>> getTemplates() {
        List<ResumeTemplateEntity> list = resumeService.getAllTemplates();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("templates", list);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/templates/{id}/download")
    public ResponseEntity<Map<String, Object>> downloadTemplate(@PathVariable("id") String id) {
        return ResponseEntity.ok(resumeService.downloadTemplate(id));
    }

    public static class ResumeUploadJsonRequest {
        private String fileName;
        private String resumeText;
        private String targetRole;

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getResumeText() { return resumeText; }
        public void setResumeText(String resumeText) { this.resumeText = resumeText; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    }

    public static class ResumeWithJdJsonRequest {
        private String fileName;
        private String resumeText;
        private String jobDescription;
        private String targetRole;

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getResumeText() { return resumeText; }
        public void setResumeText(String resumeText) { this.resumeText = resumeText; }
        public String getJobDescription() { return jobDescription; }
        public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    }
}
