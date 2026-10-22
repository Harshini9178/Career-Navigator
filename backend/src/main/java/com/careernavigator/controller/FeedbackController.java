package com.careernavigator.controller;

import com.careernavigator.dto.FeedbackRequest;
import com.careernavigator.entity.StudentFeedbackEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.repository.FeedbackRepository;
import com.careernavigator.service.DatabaseStorageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private final DatabaseStorageService databaseStorageService;

    public FeedbackController(FeedbackRepository feedbackRepository, DatabaseStorageService databaseStorageService) {
        this.feedbackRepository = feedbackRepository;
        this.databaseStorageService = databaseStorageService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitFeedback(
            @Valid @RequestBody FeedbackRequest req,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to submit feedback", 401);
        }

        StudentFeedbackEntity entity = new StudentFeedbackEntity();
        entity.setId("feed-" + UUID.randomUUID().toString().substring(0, 8));
        entity.setUserId(user.getId());
        entity.setStudentName(user.getName() != null ? user.getName() : user.getEmail());
        entity.setEmail(user.getEmail());
        entity.setRating(req.getRating());
        entity.setCategory(req.getCategory());
        entity.setComment(req.getComment());
        entity.setCreatedAt(new Date().toInstant().toString());

        feedbackRepository.save(entity);
        databaseStorageService.syncToDbJson();

        return ResponseEntity.ok(Map.of(
                "message", "Thank you for your valuable feedback!",
                "feedback", entity
        ));
    }
}
