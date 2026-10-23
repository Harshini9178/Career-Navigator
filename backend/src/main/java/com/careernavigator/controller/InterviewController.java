package com.careernavigator.controller;

import com.careernavigator.dto.InterviewRequests.*;
import com.careernavigator.entity.MockInterviewEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.service.GeminiService;
import com.careernavigator.service.InterviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    private final InterviewService interviewService;
    private final GeminiService geminiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public InterviewController(InterviewService interviewService, GeminiService geminiService) {
        this.interviewService = interviewService;
        this.geminiService = geminiService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateInterview(
            @RequestBody(required = false) GenerateInterviewRequest req,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        if (req == null) {
            req = new GenerateInterviewRequest();
        }
        Map<String, Object> intv = interviewService.generateInterview(req, user);
        Map<String, Object> body = new LinkedHashMap<>(intv);
        body.put("success", true);
        body.put("interview", intv);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getInterview(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        Map<String, Object> intv = interviewService.getInterview(id, user);
        Map<String, Object> body = new LinkedHashMap<>(intv);
        body.put("success", true);
        body.put("interview", intv);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        List<MockInterviewEntity> history = interviewService.getUserInterviewHistory(user.getId());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("history", history);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<Map<String, Object>> answerQuestion(
            @PathVariable("id") String id,
            @RequestBody(required = false) AnswerRequest req,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        if (req == null) {
            req = new AnswerRequest();
        }
        Map<String, Object> eval = interviewService.evaluateAnswer(id, req, user);
        Map<String, Object> body = new LinkedHashMap<>(eval);
        body.put("success", true);
        body.put("interview", interviewService.getInterview(id, user));
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitInterview(
            @PathVariable("id") String id,
            @RequestBody(required = false) Map<String, Object> payload,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        Map<String, Object> report = interviewService.submitInterview(id, payload, user);
        Map<String, Object> body = new LinkedHashMap<>(report);
        body.put("success", true);
        body.put("interview", report);
        return ResponseEntity.ok(body);
    }

    @PostMapping(value = "/{id}/answer-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter answerQuestionStream(
            @PathVariable("id") String id,
            @RequestBody AnswerRequest req,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }

        SseEmitter emitter = new SseEmitter(60000L);
        CompletableFuture.runAsync(() -> {
            try {
                Map<String, Object> eval = interviewService.evaluateAnswer(id, req, user);
                String feedback = (String) eval.get("feedback");
                String[] words = feedback != null ? feedback.split(" ") : new String[]{"Answer", "evaluated."};

                for (String word : words) {
                    Map<String, String> tokenObj = Map.of("token", word + " ");
                    emitter.send(SseEmitter.event().data(objectMapper.writeValueAsString(tokenObj)));
                    Thread.sleep(40);
                }

                Map<String, Object> updatedIntv = interviewService.getInterview(id, user);
                Map<String, Object> doneObj = new LinkedHashMap<>();
                doneObj.put("done", true);
                doneObj.put("interview", updatedIntv);
                doneObj.put("currentEvaluation", eval);
                emitter.send(SseEmitter.event().data(objectMapper.writeValueAsString(doneObj)));
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    @PostMapping("/code-review")
    public ResponseEntity<Map<String, Object>> reviewCode(
            @RequestBody CodeReviewRequest req,
            @AuthenticationPrincipal UserEntity user) {
        Map<String, Object> review = interviewService.reviewCode(req);
        Map<String, Object> body = new LinkedHashMap<>(review);
        body.put("success", true);
        body.put("review", review);
        return ResponseEntity.ok(body);
    }
}
