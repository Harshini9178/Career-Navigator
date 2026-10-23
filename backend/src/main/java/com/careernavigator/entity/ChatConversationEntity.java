package com.careernavigator.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;

@Entity
@Table(name = "chat_conversations")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatConversationEntity {

    @Id
    @Column(nullable = false, unique = true)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String title;

    @Column
    private Boolean learningMode = false;

    @Lob
    @Column(name = "messages_json", length = 1048576)
    private String messagesJson;

    @Lob
    @Column(name = "career_context_json", length = 65536)
    private String careerContextJson;

    @Column
    private String createdAt;

    @Column
    private String updatedAt;

    public ChatConversationEntity() {}

    public ChatConversationEntity(String id, String userId, String title, Boolean learningMode, String messagesJson, String careerContextJson, String createdAt, String updatedAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.learningMode = learningMode;
        this.messagesJson = messagesJson;
        this.careerContextJson = careerContextJson;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Boolean getLearningMode() {
        return learningMode != null ? learningMode : false;
    }

    public void setLearningMode(Boolean learningMode) {
        this.learningMode = learningMode;
    }

    public String getMessagesJson() {
        return messagesJson;
    }

    public void setMessagesJson(String messagesJson) {
        this.messagesJson = messagesJson;
    }

    public String getCareerContextJson() {
        return careerContextJson;
    }

    public void setCareerContextJson(String careerContextJson) {
        this.careerContextJson = careerContextJson;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
