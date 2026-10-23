package com.careernavigator.service;

import com.careernavigator.dto.ChatDtos.*;
import com.careernavigator.entity.ChatConversationEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.repository.ChatConversationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    private final ChatConversationRepository conversationRepository;
    private final GeminiService geminiService;
    private final DatabaseStorageService databaseStorageService;
    private final ObjectMapper objectMapper;

    public ChatService(
            ChatConversationRepository conversationRepository,
            GeminiService geminiService,
            DatabaseStorageService databaseStorageService,
            ObjectMapper objectMapper) {
        this.conversationRepository = conversationRepository;
        this.geminiService = geminiService;
        this.databaseStorageService = databaseStorageService;
        this.objectMapper = objectMapper;
    }

    public ChatResponse processChatMessage(UserEntity user, ChatRequest req) {
        if (req == null || req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            throw new ApiException("Question message cannot be empty", 400);
        }

        String userQuery = req.getMessage().trim();
        if (userQuery.length() > 4000) {
            throw new ApiException("Message exceeds maximum permitted limit of 4000 characters", 400);
        }

        String now = Instant.now().toString();

        // 1. Locate or create conversation session
        ChatConversationEntity conversation;
        if (req.getConversationId() != null && !req.getConversationId().isBlank()) {
            conversation = conversationRepository.findByIdAndUserId(req.getConversationId(), user.getId())
                    .orElseGet(() -> createNewConversation(user, userQuery, req.getLearningMode(), req.getCareerContext()));
        } else {
            conversation = createNewConversation(user, userQuery, req.getLearningMode(), req.getCareerContext());
        }

        // 2. Load existing messages
        List<ChatMessageDto> messages = parseMessages(conversation.getMessagesJson());

        // 3. Append current user message
        ChatMessageDto userMsg = new ChatMessageDto(
                "msg-" + UUID.randomUUID().toString().substring(0, 8),
                "user",
                userQuery,
                now
        );
        userMsg.setLearningMode(req.getLearningMode());
        messages.add(userMsg);

        // 4. Update title if needed
        if (conversation.getTitle() == null || conversation.getTitle().equals("New Conversation") || conversation.getTitle().isBlank()) {
            conversation.setTitle(deriveTitle(userQuery));
        }
        conversation.setLearningMode(req.getLearningMode());
        conversation.setUpdatedAt(now);

        // 5. Check if Gemini AI is configured
        if (!geminiService.isConfigured()) {
            // Save user message so far
            try {
                conversation.setMessagesJson(objectMapper.writeValueAsString(messages));
                conversationRepository.save(conversation);
                databaseStorageService.syncToDbJson();
            } catch (Exception ignored) {}

            return ChatResponse.fail(
                    "Google Gemini AI service is currently not configured on this server. Please set GEMINI_API_KEY in your server environment to enable live AI responses.",
                    conversation.getId()
            );
        }

        // 6. Execute Gemini AI Chat Request
        try {
            String aiReply = geminiService.callGeminiChat(
                    userQuery,
                    messages,
                    Boolean.TRUE.equals(req.getLearningMode()),
                    req.getCareerContext()
            );

            ChatMessageDto assistantMsg = new ChatMessageDto(
                    "msg-" + UUID.randomUUID().toString().substring(0, 8),
                    "assistant",
                    aiReply,
                    Instant.now().toString()
            );
            assistantMsg.setLearningMode(req.getLearningMode());
            messages.add(assistantMsg);

            // Save conversation with assistant response
            conversation.setMessagesJson(objectMapper.writeValueAsString(messages));
            conversationRepository.save(conversation);
            databaseStorageService.syncToDbJson();

            return ChatResponse.ok(
                    conversation.getId(),
                    conversation.getTitle(),
                    assistantMsg,
                    "gemini-live",
                    req.getLearningMode()
            );

        } catch (Exception e) {
            logger.error("Gemini AI Chat generation error for user {}: {}", user.getEmail(), e.getMessage());

            String errText = (e.getMessage() != null && !e.getMessage().isBlank())
                    ? e.getMessage()
                    : "Unable to reach Gemini AI service. Please click Retry Question.";

            ChatMessageDto errorMsg = new ChatMessageDto(
                    "msg-" + UUID.randomUUID().toString().substring(0, 8),
                    "assistant",
                    errText,
                    Instant.now().toString()
            );
            errorMsg.setError(true);
            messages.add(errorMsg);

            try {
                conversation.setMessagesJson(objectMapper.writeValueAsString(messages));
                conversationRepository.save(conversation);
                databaseStorageService.syncToDbJson();
            } catch (Exception ignored) {}

            return ChatResponse.fail(errText, conversation.getId());
        }
    }

    public List<ConversationSummaryDto> getUserConversations(String userId) {
        List<ChatConversationEntity> list = conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        List<ConversationSummaryDto> result = new ArrayList<>();

        for (ChatConversationEntity entity : list) {
            List<ChatMessageDto> msgs = parseMessages(entity.getMessagesJson());
            String snippet = "";
            if (!msgs.isEmpty()) {
                ChatMessageDto last = msgs.get(msgs.size() - 1);
                snippet = last.getContent() != null ? last.getContent() : "";
                if (snippet.length() > 90) {
                    snippet = snippet.substring(0, 87) + "...";
                }
            }
            result.add(new ConversationSummaryDto(
                    entity.getId(),
                    entity.getTitle() != null ? entity.getTitle() : "Career Consultation",
                    msgs.size(),
                    entity.getLearningMode(),
                    entity.getCreatedAt(),
                    entity.getUpdatedAt(),
                    snippet
            ));
        }

        return result;
    }

    public ConversationDetailDto getConversation(String userId, String conversationId) {
        ChatConversationEntity entity = conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ApiException("Conversation session not found", 404));

        ConversationDetailDto detail = new ConversationDetailDto();
        detail.setId(entity.getId());
        detail.setTitle(entity.getTitle());
        detail.setLearningMode(entity.getLearningMode());
        detail.setCreatedAt(entity.getCreatedAt());
        detail.setUpdatedAt(entity.getUpdatedAt());
        detail.setMessages(parseMessages(entity.getMessagesJson()));

        if (entity.getCareerContextJson() != null && !entity.getCareerContextJson().isBlank()) {
            try {
                Map<String, Object> ctx = objectMapper.readValue(entity.getCareerContextJson(), new TypeReference<Map<String, Object>>() {});
                detail.setCareerContext(ctx);
            } catch (Exception ignored) {}
        }

        return detail;
    }

    public void deleteConversation(String userId, String conversationId) {
        ChatConversationEntity entity = conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ApiException("Conversation session not found", 404));
        conversationRepository.delete(entity);
        databaseStorageService.syncToDbJson();
    }

    public void clearAllConversations(String userId) {
        List<ChatConversationEntity> list = conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        conversationRepository.deleteAll(list);
        databaseStorageService.syncToDbJson();
    }

    public Map<String, Object> executeQuickAsk(String question, UserEntity user) {
        if (question == null || question.trim().isEmpty()) {
            return Map.of("success", false, "error", "Question prompt is required.");
        }

        if (!geminiService.isConfigured()) {
            return Map.of(
                    "success", false,
                    "error", "Gemini AI API key is not configured on the server. Please set GEMINI_API_KEY in your .env file to enable live AI responses."
            );
        }

        try {
            Map<String, Object> context = new LinkedHashMap<>();
            if (user != null) {
                if (user.getTargetRole() != null) context.put("targetRole", user.getTargetRole());
                if (user.getSkills() != null) context.put("skills", user.getSkills());
            }

            String answer = geminiService.callGeminiChat(question.trim(), Collections.emptyList(), false, context);
            return Map.of(
                    "success", true,
                    "answer", answer,
                    "response", answer, // supports both key conventions
                    "source", "gemini-live"
            );
        } catch (Exception e) {
            logger.error("Quick Ask failed: {}", e.getMessage());
            return Map.of(
                    "success", false,
                    "error", "Gemini AI inference failed: " + e.getMessage()
            );
        }
    }

    private ChatConversationEntity createNewConversation(UserEntity user, String initialQuery, Boolean learningMode, Map<String, Object> context) {
        ChatConversationEntity entity = new ChatConversationEntity();
        entity.setId("chat-" + UUID.randomUUID().toString());
        entity.setUserId(user.getId());
        entity.setTitle(deriveTitle(initialQuery));
        entity.setLearningMode(learningMode != null ? learningMode : false);
        entity.setMessagesJson("[]");

        String now = Instant.now().toString();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        if (context != null) {
            try {
                entity.setCareerContextJson(objectMapper.writeValueAsString(context));
            } catch (Exception ignored) {}
        }

        return conversationRepository.save(entity);
    }

    private List<ChatMessageDto> parseMessages(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<ChatMessageDto>>() {});
        } catch (Exception e) {
            logger.warn("Failed to parse conversation messages JSON: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private String deriveTitle(String query) {
        if (query == null || query.isBlank()) return "New Conversation";
        String cleaned = query.trim().replaceAll("[\\r\\n]+", " ");
        if (cleaned.length() <= 38) return cleaned;
        return cleaned.substring(0, 35) + "...";
    }
}
