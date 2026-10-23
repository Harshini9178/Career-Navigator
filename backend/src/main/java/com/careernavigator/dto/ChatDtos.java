package com.careernavigator.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ChatDtos {

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ChatMessageDto {
        private String id;
        private String role; // "user" | "assistant" | "system"
        private String content;
        private String timestamp;
        private Boolean error;
        private Boolean learningMode;

        public ChatMessageDto() {}

        public ChatMessageDto(String id, String role, String content, String timestamp) {
            this.id = id;
            this.role = role;
            this.content = content;
            this.timestamp = timestamp;
            this.error = false;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

        public Boolean getError() { return error != null && error; }
        public void setError(Boolean error) { this.error = error; }

        public Boolean getLearningMode() { return learningMode; }
        public void setLearningMode(Boolean learningMode) { this.learningMode = learningMode; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ChatRequest {
        private String conversationId;
        private String message;
        private Boolean learningMode = false;
        private Map<String, Object> careerContext;
        private List<ChatMessageDto> history = new ArrayList<>();

        public ChatRequest() {}

        public String getConversationId() { return conversationId; }
        public void setConversationId(String conversationId) { this.conversationId = conversationId; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public Boolean getLearningMode() { return learningMode != null ? learningMode : false; }
        public void setLearningMode(Boolean learningMode) { this.learningMode = learningMode; }

        public Map<String, Object> getCareerContext() { return careerContext; }
        public void setCareerContext(Map<String, Object> careerContext) { this.careerContext = careerContext; }

        public List<ChatMessageDto> getHistory() { return history != null ? history : new ArrayList<>(); }
        public void setHistory(List<ChatMessageDto> history) { this.history = history; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ChatResponse {
        private boolean success;
        private String conversationId;
        private String title;
        private ChatMessageDto message;
        private String reply;
        private Boolean learningMode;
        private String source; // "gemini-live" | "ai-mentor"
        private String error;

        public ChatResponse() {}

        public static ChatResponse ok(String conversationId, String title, ChatMessageDto message, String source, Boolean learningMode) {
            ChatResponse r = new ChatResponse();
            r.setSuccess(true);
            r.setConversationId(conversationId);
            r.setTitle(title);
            r.setMessage(message);
            r.setReply(message != null ? message.getContent() : "");
            r.setSource(source);
            r.setLearningMode(learningMode);
            return r;
        }

        public static ChatResponse fail(String error, String conversationId) {
            ChatResponse r = new ChatResponse();
            r.setSuccess(false);
            r.setError(error);
            r.setConversationId(conversationId);
            return r;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getConversationId() { return conversationId; }
        public void setConversationId(String conversationId) { this.conversationId = conversationId; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public ChatMessageDto getMessage() { return message; }
        public void setMessage(ChatMessageDto message) { this.message = message; }

        public String getReply() { return reply; }
        public void setReply(String reply) { this.reply = reply; }

        public Boolean getLearningMode() { return learningMode; }
        public void setLearningMode(Boolean learningMode) { this.learningMode = learningMode; }

        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }

        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ConversationSummaryDto {
        private String id;
        private String title;
        private int messageCount;
        private Boolean learningMode;
        private String createdAt;
        private String updatedAt;
        private String lastMessageSnippet;

        public ConversationSummaryDto() {}

        public ConversationSummaryDto(String id, String title, int messageCount, Boolean learningMode, String createdAt, String updatedAt, String lastMessageSnippet) {
            this.id = id;
            this.title = title;
            this.messageCount = messageCount;
            this.learningMode = learningMode;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
            this.lastMessageSnippet = lastMessageSnippet;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public int getMessageCount() { return messageCount; }
        public void setMessageCount(int messageCount) { this.messageCount = messageCount; }

        public Boolean getLearningMode() { return learningMode; }
        public void setLearningMode(Boolean learningMode) { this.learningMode = learningMode; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

        public String getLastMessageSnippet() { return lastMessageSnippet; }
        public void setLastMessageSnippet(String lastMessageSnippet) { this.lastMessageSnippet = lastMessageSnippet; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ConversationDetailDto {
        private String id;
        private String title;
        private Boolean learningMode;
        private String createdAt;
        private String updatedAt;
        private List<ChatMessageDto> messages = new ArrayList<>();
        private Map<String, Object> careerContext;

        public ConversationDetailDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public Boolean getLearningMode() { return learningMode; }
        public void setLearningMode(Boolean learningMode) { this.learningMode = learningMode; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

        public List<ChatMessageDto> getMessages() { return messages; }
        public void setMessages(List<ChatMessageDto> messages) { this.messages = messages; }

        public Map<String, Object> getCareerContext() { return careerContext; }
        public void setCareerContext(Map<String, Object> careerContext) { this.careerContext = careerContext; }
    }
}
