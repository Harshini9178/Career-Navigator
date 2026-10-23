package com.careernavigator.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "aptitude_questions", indexes = {
        @Index(name = "idx_apt_category", columnList = "category"),
        @Index(name = "idx_apt_active", columnList = "active")
})
public class AptitudeQuestionEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 100)
    private String topic;

    @Column(nullable = false, length = 30)
    private String difficulty; // "Easy", "Medium", "Hard"

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "aptitude_question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text", columnDefinition = "TEXT")
    @OrderColumn(name = "option_order")
    private List<String> options = new ArrayList<>();

    @Column(nullable = false)
    private int correctAnswerIndex; // 0, 1, 2, or 3

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false)
    private boolean active = true;

    public AptitudeQuestionEntity() {}

    public AptitudeQuestionEntity(
            String id,
            String questionText,
            String category,
            String topic,
            String difficulty,
            List<String> options,
            int correctAnswerIndex,
            String explanation) {
        this.id = id;
        this.questionText = questionText;
        this.category = category;
        this.topic = topic;
        this.difficulty = difficulty;
        this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
        this.correctAnswerIndex = correctAnswerIndex;
        this.explanation = explanation;
        this.active = true;
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

    public int getCorrectAnswerIndex() { return correctAnswerIndex; }
    public void setCorrectAnswerIndex(int correctAnswerIndex) { this.correctAnswerIndex = correctAnswerIndex; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
