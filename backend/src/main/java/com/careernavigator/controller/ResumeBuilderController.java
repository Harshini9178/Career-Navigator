package com.careernavigator.controller;

import com.careernavigator.dto.ResumeBuilderDto.*;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.service.ResumeBuilderService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resumes")
public class ResumeBuilderController {

    private final ResumeBuilderService resumeBuilderService;

    public ResumeBuilderController(ResumeBuilderService resumeBuilderService) {
        this.resumeBuilderService = resumeBuilderService;
    }

    private void ensureAuthenticated(UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to access Resume Builder Studio", 401);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listResumes(@AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        List<ResumeDocumentResponse> list = resumeBuilderService.listUserResumes(user.getId());
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("resumes", list);
        resp.put("total", list.size());
        return ResponseEntity.ok(resp);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createResume(
            @RequestBody(required = false) ResumeCreateRequest req,
            @AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        if (req == null) {
            req = new ResumeCreateRequest();
        }
        ResumeDocumentResponse doc = resumeBuilderService.createResume(req, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("resume", doc);
        resp.put("message", "Resume created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getResume(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        ResumeDocumentResponse doc = resumeBuilderService.getResume(id, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("resume", doc);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateResume(
            @PathVariable("id") String id,
            @RequestBody ResumeUpdateRequest req,
            @AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        if (req == null) {
            throw new ApiException("Update request body cannot be empty", 400);
        }
        ResumeDocumentResponse doc = resumeBuilderService.updateResume(id, req, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("resume", doc);
        resp.put("message", "Resume updated successfully");
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteResume(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        resumeBuilderService.deleteResume(id, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Resume deleted successfully");
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<Map<String, Object>> duplicateResume(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        ResumeDocumentResponse doc = resumeBuilderService.duplicateResume(id, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("resume", doc);
        resp.put("message", "Resume duplicated successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        byte[] pdfBytes = resumeBuilderService.exportPdf(id, user);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Resume-" + id + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/{id}/ats-check")
    public ResponseEntity<Map<String, Object>> runAtsCheck(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        ResumeDocumentResponse doc = resumeBuilderService.getResume(id, user);
        AtsCheckResponse check = resumeBuilderService.calculateAtsReadiness(doc.getContent(), doc.getTargetRole());
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("atsCheck", check);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/ats-check-preview")
    public ResponseEntity<Map<String, Object>> runAtsCheckPreview(
            @RequestBody AtsPreviewRequest req,
            @AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        ResumeContent content = req != null ? req.getContent() : null;
        String role = req != null ? req.getTargetRole() : "Full Stack Engineer";
        AtsCheckResponse check = resumeBuilderService.calculateAtsReadiness(content, role);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("atsCheck", check);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/job-match")
    public ResponseEntity<Map<String, Object>> runJobMatch(
            @PathVariable("id") String id,
            @RequestBody JobMatchRequest req,
            @AuthenticationPrincipal UserEntity user) {
        ensureAuthenticated(user);
        ResumeDocumentResponse doc = resumeBuilderService.getResume(id, user);
        ResumeContent content = (req != null && req.getContent() != null) ? req.getContent() : doc.getContent();
        String targetRole = (req != null && req.getTargetRole() != null) ? req.getTargetRole() : doc.getTargetRole();
        String jd = req != null ? req.getJobDescription() : "";

        JobMatchResponse match = resumeBuilderService.calculateJobMatch(content, targetRole, jd);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("jobMatch", match);
        return ResponseEntity.ok(resp);
    }

    public static class AtsPreviewRequest {
        private String targetRole;
        private ResumeContent content;

        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public ResumeContent getContent() { return content; }
        public void setContent(ResumeContent content) { this.content = content; }
    }
}
