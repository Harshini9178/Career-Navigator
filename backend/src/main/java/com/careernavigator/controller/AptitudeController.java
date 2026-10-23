package com.careernavigator.controller;

import com.careernavigator.dto.AptitudeDto.*;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.service.AptitudeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/aptitude")
public class AptitudeController {

    private final AptitudeService aptitudeService;

    public AptitudeController(AptitudeService aptitudeService) {
        this.aptitudeService = aptitudeService;
    }

    private void checkAuth(UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to access Aptitude Assessment", 401);
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories(@AuthenticationPrincipal UserEntity user) {
        // Can be viewed by authenticated users
        List<Map<String, Object>> categories = aptitudeService.getCategories();
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("categories", categories);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/attempts")
    public ResponseEntity<Map<String, Object>> startOrResumeAttempt(@AuthenticationPrincipal UserEntity user) {
        checkAuth(user);
        AptitudeAttemptDto attempt = aptitudeService.startOrResumeAttempt(user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("attempt", attempt);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/attempts/new")
    public ResponseEntity<Map<String, Object>> createNewAttempt(@AuthenticationPrincipal UserEntity user) {
        checkAuth(user);
        AptitudeAttemptDto attempt = aptitudeService.createNewAttempt(user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("attempt", attempt);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<Map<String, Object>> getAttempt(
            @PathVariable("attemptId") String attemptId,
            @AuthenticationPrincipal UserEntity user) {
        checkAuth(user);
        AptitudeAttemptDto attempt = aptitudeService.getAttempt(attemptId, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("attempt", attempt);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/attempts/{attemptId}/answers/{questionId}")
    public ResponseEntity<Map<String, Object>> saveAnswer(
            @PathVariable("attemptId") String attemptId,
            @PathVariable("questionId") String questionId,
            @RequestBody SaveAnswerRequest req,
            @AuthenticationPrincipal UserEntity user) {
        checkAuth(user);
        AptitudeAttemptDto updated = aptitudeService.saveAnswer(attemptId, questionId, req, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("attempt", updated);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/attempts/{attemptId}/violations")
    public ResponseEntity<Map<String, Object>> recordViolation(
            @PathVariable("attemptId") String attemptId,
            @RequestBody RecordViolationRequest req,
            @AuthenticationPrincipal UserEntity user) {
        checkAuth(user);
        AptitudeAttemptDto updated = aptitudeService.recordViolation(attemptId, req, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("attempt", updated);
        resp.put("terminated", "VIOLATION_TERMINATED".equals(updated.getStatus()));
        resp.put("violationsCount", updated.getViolationsCount());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<Map<String, Object>> submitAttempt(
            @PathVariable("attemptId") String attemptId,
            @RequestBody(required = false) SubmitAttemptRequest req,
            @AuthenticationPrincipal UserEntity user) {
        checkAuth(user);
        AptitudeResultDto result = aptitudeService.submitAttempt(attemptId, req, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("result", result);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/attempts/{attemptId}/result")
    public ResponseEntity<Map<String, Object>> getAttemptResult(
            @PathVariable("attemptId") String attemptId,
            @AuthenticationPrincipal UserEntity user) {
        checkAuth(user);
        AptitudeResultDto result = aptitudeService.getAttemptResult(attemptId, user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("result", result);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory(@AuthenticationPrincipal UserEntity user) {
        checkAuth(user);
        List<AptitudeHistoryItemDto> history = aptitudeService.getHistory(user);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("history", history);
        return ResponseEntity.ok(resp);
    }
}
