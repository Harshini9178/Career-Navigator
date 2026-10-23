package com.careernavigator.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "assessment_attempts", indexes = {
        @Index(name = "idx_attempt_user", columnList = "userId"),
        @Index(name = "idx_attempt_status", columnList = "status"),
        @Index(name = "idx_attempt_started", columnList = "startedAt")
})
public class AssessmentAttemptEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 64)
    private String userId;

    @Column(nullable = false, length = 32)
    private String status; // "IN_PROGRESS", "COMPLETED", "TIMED_OUT", "VIOLATION_TERMINATED"

    @Column(nullable = false, length = 32)
    private String startedAt; // ISO-8601 string

    @Column(nullable = false, length = 32)
    private String deadline; // ISO-8601 string (startedAt + 30 mins)

    @Column(length = 32)
    private String completedAt;

    @Column(nullable = false)
    private int durationSeconds = 0; // Total time spent

    @Column(nullable = false)
    private int score = 0; // Correct count out of 30

    @Column(nullable = false)
    private double percentage = 0.0;

    @Column(nullable = false)
    private int totalQuestions = 30;

    @Column(nullable = false)
    private int violationsCount = 0;

    @Column(columnDefinition = "TEXT")
    private String forcedSubmissionReason;

    // JSON payload of question IDs in assigned sequence
    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionsJson;

    // JSON payload of candidate answers: Map<questionId, selectedOptionIndex>
    @Column(columnDefinition = "TEXT")
    private String answersJson;

    // JSON payload of marked-for-review question IDs
    @Column(columnDefinition = "TEXT")
    private String markedForReviewJson;

    // JSON payload of category scores: Map<category, CategoryScoreDto>
    @Column(columnDefinition = "TEXT")
    private String categoryScoresJson;

    public AssessmentAttemptEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStartedAt() { return startedAt; }
    public void setStartedAt(String startedAt) { this.startedAt = startedAt; }

    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getViolationsCount() { return violationsCount; }
    public void setViolationsCount(int violationsCount) { this.violationsCount = violationsCount; }

    public String getForcedSubmissionReason() { return forcedSubmissionReason; }
    public void setForcedSubmissionReason(String forcedSubmissionReason) { this.forcedSubmissionReason = forcedSubmissionReason; }

    public String getQuestionsJson() { return questionsJson; }
    public void setQuestionsJson(String questionsJson) { this.questionsJson = questionsJson; }

    public String getAnswersJson() { return answersJson; }
    public void setAnswersJson(String answersJson) { this.answersJson = answersJson; }

    public String getMarkedForReviewJson() { return markedForReviewJson; }
    public void setMarkedForReviewJson(String markedForReviewJson) { this.markedForReviewJson = markedForReviewJson; }

    public String getCategoryScoresJson() { return categoryScoresJson; }
    public void setCategoryScoresJson(String categoryScoresJson) { this.categoryScoresJson = categoryScoresJson; }
}
