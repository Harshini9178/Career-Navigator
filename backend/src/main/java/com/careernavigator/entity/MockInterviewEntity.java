package com.careernavigator.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interviews")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MockInterviewEntity {

    @Id
    @Column(nullable = false, unique = true)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column
    private String date;

    @Column
    private String jobRole;

    @Column
    private String branch;

    @Column
    private String experienceLevel;

    @Column
    private Integer overallScore;

    @Column
    private Integer technicalScore;

    @Column
    private Integer communicationScore;

    @Column
    private Integer confidenceScore;

    @Lob
    @Column(name = "feedback_text", length = 65536)
    private String feedbackText;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "interview_suggestions", joinColumns = @JoinColumn(name = "interview_id"))
    @Column(name = "suggestion", length = 1000)
    private List<String> suggestions = new ArrayList<>();

    @Lob
    @Column(name = "qas_json", length = 65536)
    private String qasJson;

    public MockInterviewEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getJobRole() { return jobRole; }
    public void setJobRole(String jobRole) { this.jobRole = jobRole; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public Integer getOverallScore() { return overallScore; }
    public void setOverallScore(Integer overallScore) { this.overallScore = overallScore; }

    public Integer getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(Integer technicalScore) { this.technicalScore = technicalScore; }

    public Integer getCommunicationScore() { return communicationScore; }
    public void setCommunicationScore(Integer communicationScore) { this.communicationScore = communicationScore; }

    public Integer getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Integer confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) { this.feedbackText = feedbackText; }

    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions != null ? suggestions : new ArrayList<>(); }

    public String getQasJson() { return qasJson; }
    public void setQasJson(String qasJson) { this.qasJson = qasJson; }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("questions")
    public List<String> getQuestions() {
        List<String> list = new ArrayList<>();
        if (qasJson != null && !qasJson.isBlank()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<java.util.Map<String, Object>> qas = mapper.readValue(qasJson, new com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, Object>>>() {});
                for (java.util.Map<String, Object> qa : qas) {
                    Object q = qa.get("question");
                    if (q != null) list.add(q.toString());
                }
            } catch (Exception ignored) {}
        }
        return list;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("answers")
    public List<java.util.Map<String, Object>> getAnswers() {
        List<java.util.Map<String, Object>> list = new ArrayList<>();
        if (qasJson != null && !qasJson.isBlank()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<java.util.Map<String, Object>> qas = mapper.readValue(qasJson, new com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, Object>>>() {});
                for (java.util.Map<String, Object> qa : qas) {
                    Object a = qa.get("answer");
                    if (a != null && !a.toString().isBlank()) {
                        list.add(qa);
                    }
                }
            } catch (Exception ignored) {}
        }
        return list;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public String getCreatedAt() {
        return date != null && !date.isBlank() ? date : new java.util.Date().toInstant().toString();
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
        return overallScore != null ? "completed" : "started";
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("currentQuestionIndex")
    public int getCurrentQuestionIndex() {
        return getAnswers().size();
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("skills")
    public List<String> getSkills() {
        return new ArrayList<>();
    }
}
