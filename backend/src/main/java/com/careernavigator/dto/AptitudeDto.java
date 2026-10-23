package com.careernavigator.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.*;

public class AptitudeDto {

    /**
     * Question payload sent to candidate during active test.
     * Crucially does NOT contain correctAnswerIndex or explanation.
     */
    public static class AptitudeQuestionClientDto {
        private String id;
        private String questionText;
        private String category;
        private String topic;
        private String difficulty;
        private List<String> options;

        public AptitudeQuestionClientDto() {}

        public AptitudeQuestionClientDto(String id, String questionText, String category, String topic, String difficulty, List<String> options) {
            this.id = id;
            this.questionText = questionText;
            this.category = category;
            this.topic = topic;
            this.difficulty = difficulty;
            this.options = options;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public List<String> getOptions() { return options; }
        public void setOptions(List<String> options) { this.options = options; }
    }

    public static class CategoryScoreDto {
        private String category;
        private int score;
        private int total;
        private double percentage;

        public CategoryScoreDto() {}

        public CategoryScoreDto(String category, int score, int total, double percentage) {
            this.category = category;
            this.score = score;
            this.total = total;
            this.percentage = percentage;
        }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
    }

    public static class AptitudeAttemptDto {
        private String id;
        private String userId;
        private String status;
        private String startedAt;
        private String deadline;
        private long remainingSeconds;
        private int totalQuestions;
        private int answeredCount;
        private int markedCount;
        private int violationsCount;
        private List<AptitudeQuestionClientDto> questions = new ArrayList<>();
        private Map<String, Integer> answers = new HashMap<>();
        private List<String> markedForReview = new ArrayList<>();

        public AptitudeAttemptDto() {}

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
        public long getRemainingSeconds() { return remainingSeconds; }
        public void setRemainingSeconds(long remainingSeconds) { this.remainingSeconds = remainingSeconds; }
        public int getTotalQuestions() { return totalQuestions; }
        public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
        public int getAnsweredCount() { return answeredCount; }
        public void setAnsweredCount(int answeredCount) { this.answeredCount = answeredCount; }
        public int getMarkedCount() { return markedCount; }
        public void setMarkedCount(int markedCount) { this.markedCount = markedCount; }
        public int getViolationsCount() { return violationsCount; }
        public void setViolationsCount(int violationsCount) { this.violationsCount = violationsCount; }
        public List<AptitudeQuestionClientDto> getQuestions() { return questions; }
        public void setQuestions(List<AptitudeQuestionClientDto> questions) { this.questions = questions; }
        public Map<String, Integer> getAnswers() { return answers; }
        public void setAnswers(Map<String, Integer> answers) { this.answers = answers; }
        public List<String> getMarkedForReview() { return markedForReview; }
        public void setMarkedForReview(List<String> markedForReview) { this.markedForReview = markedForReview; }
    }

    public static class QuestionReviewDto {
        private String id;
        private String questionText;
        private String category;
        private String topic;
        private String difficulty;
        private List<String> options;
        private Integer selectedOption; // null if unanswered
        private int correctAnswerIndex;
        private boolean isCorrect;
        private String explanation;

        public QuestionReviewDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public List<String> getOptions() { return options; }
        public void setOptions(List<String> options) { this.options = options; }
        public Integer getSelectedOption() { return selectedOption; }
        public void setSelectedOption(Integer selectedOption) { this.selectedOption = selectedOption; }
        public int getCorrectAnswerIndex() { return correctAnswerIndex; }
        public void setCorrectAnswerIndex(int correctAnswerIndex) { this.correctAnswerIndex = correctAnswerIndex; }
        
        @JsonProperty("isCorrect")
        public boolean isCorrect() { return isCorrect; }
        
        @JsonProperty("isCorrect")
        public void setCorrect(boolean correct) { isCorrect = correct; }
        
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
    }

    public static class AptitudeResultDto {
        private String id;
        private String userId;
        private int score;
        private double percentage;
        private int totalQuestions;
        private int correctCount;
        private int incorrectCount;
        private int unansweredCount;
        private int durationSeconds;
        private String status;
        private String startedAt;
        private String completedAt;
        private int violationsCount;
        private String forcedSubmissionReason;
        private List<CategoryScoreDto> categoryScores = new ArrayList<>();
        private List<String> strengths = new ArrayList<>();
        private List<String> improvements = new ArrayList<>();
        private List<String> recommendations = new ArrayList<>();
        private List<QuestionReviewDto> questionReviews = new ArrayList<>();

        public AptitudeResultDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
        public int getTotalQuestions() { return totalQuestions; }
        public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
        public int getCorrectCount() { return correctCount; }
        public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }
        public int getIncorrectCount() { return incorrectCount; }
        public void setIncorrectCount(int incorrectCount) { this.incorrectCount = incorrectCount; }
        public int getUnansweredCount() { return unansweredCount; }
        public void setUnansweredCount(int unansweredCount) { this.unansweredCount = unansweredCount; }
        public int getDurationSeconds() { return durationSeconds; }
        public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getStartedAt() { return startedAt; }
        public void setStartedAt(String startedAt) { this.startedAt = startedAt; }
        public String getCompletedAt() { return completedAt; }
        public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
        public int getViolationsCount() { return violationsCount; }
        public void setViolationsCount(int violationsCount) { this.violationsCount = violationsCount; }
        public String getForcedSubmissionReason() { return forcedSubmissionReason; }
        public void setForcedSubmissionReason(String forcedSubmissionReason) { this.forcedSubmissionReason = forcedSubmissionReason; }
        public List<CategoryScoreDto> getCategoryScores() { return categoryScores; }
        public void setCategoryScores(List<CategoryScoreDto> categoryScores) { this.categoryScores = categoryScores; }
        public List<String> getStrengths() { return strengths; }
        public void setStrengths(List<String> strengths) { this.strengths = strengths; }
        public List<String> getImprovements() { return improvements; }
        public void setImprovements(List<String> improvements) { this.improvements = improvements; }
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
        public List<QuestionReviewDto> getQuestionReviews() { return questionReviews; }
        public void setQuestionReviews(List<QuestionReviewDto> questionReviews) { this.questionReviews = questionReviews; }
    }

    public static class AptitudeHistoryItemDto {
        private String id;
        private String startedAt;
        private String completedAt;
        private int score;
        private double percentage;
        private int totalQuestions;
        private int durationSeconds;
        private String status;
        private int violationsCount;
        private String forcedSubmissionReason;
        private Map<String, Integer> categoryScores = new HashMap<>();

        public AptitudeHistoryItemDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getStartedAt() { return startedAt; }
        public void setStartedAt(String startedAt) { this.startedAt = startedAt; }
        public String getCompletedAt() { return completedAt; }
        public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
        public int getTotalQuestions() { return totalQuestions; }
        public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
        public int getDurationSeconds() { return durationSeconds; }
        public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public int getViolationsCount() { return violationsCount; }
        public void setViolationsCount(int violationsCount) { this.violationsCount = violationsCount; }
        public String getForcedSubmissionReason() { return forcedSubmissionReason; }
        public void setForcedSubmissionReason(String forcedSubmissionReason) { this.forcedSubmissionReason = forcedSubmissionReason; }
        public Map<String, Integer> getCategoryScores() { return categoryScores; }
        public void setCategoryScores(Map<String, Integer> categoryScores) { this.categoryScores = categoryScores; }
    }

    public static class SaveAnswerRequest {
        private Integer selectedOption; // 0, 1, 2, 3 or null
        private Boolean markedForReview;

        public Integer getSelectedOption() { return selectedOption; }
        public void setSelectedOption(Integer selectedOption) { this.selectedOption = selectedOption; }
        public Boolean getMarkedForReview() { return markedForReview; }
        public void setMarkedForReview(Boolean markedForReview) { this.markedForReview = markedForReview; }
    }

    public static class RecordViolationRequest {
        private String eventType; // e.g. "TAB_SWITCH", "WINDOW_BLUR", "EXIT_FULLSCREEN"

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
    }

    public static class SubmitAttemptRequest {
        private String forcedReason;

        public String getForcedReason() { return forcedReason; }
        public void setForcedReason(String forcedReason) { this.forcedReason = forcedReason; }
    }
}
