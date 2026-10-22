package com.careernavigator.controller;

import com.careernavigator.dto.InterviewRequests.*;
import com.careernavigator.entity.MockInterviewEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.service.GeminiService;
import com.careernavigator.service.InterviewService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    private final InterviewService interviewService;
    private final GeminiService geminiService;

    public InterviewController(InterviewService interviewService, GeminiService geminiService) {
        this.interviewService = interviewService;
        this.geminiService = geminiService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateInterview(
            @RequestBody GenerateInterviewRequest req,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        return ResponseEntity.ok(interviewService.generateInterview(req, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getInterview(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        return ResponseEntity.ok(interviewService.getInterview(id, user));
    }

    @GetMapping("/history")
    public ResponseEntity<List<MockInterviewEntity>> getHistory(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        return ResponseEntity.ok(interviewService.getUserInterviewHistory(user.getId()));
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<Map<String, Object>> answerQuestion(
            @PathVariable("id") String id,
            @RequestBody AnswerRequest req,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        return ResponseEntity.ok(interviewService.evaluateAnswer(id, req, user));
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
                    emitter.send(SseEmitter.event().data(word + " "));
                    Thread.sleep(40);
                }
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
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        return ResponseEntity.ok(interviewService.reviewCode(req));
    }
}
