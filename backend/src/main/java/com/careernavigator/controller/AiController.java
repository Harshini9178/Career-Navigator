package com.careernavigator.controller;

import com.careernavigator.dto.ChatDtos.*;
import com.careernavigator.dto.InterviewRequests.QuickAskRequest;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.service.ChatService;
import com.careernavigator.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final GeminiService geminiService;
    private final ChatService chatService;

    public AiController(GeminiService geminiService, ChatService chatService) {
        this.geminiService = geminiService;
        this.chatService = chatService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAiStatus() {
        boolean configured = geminiService.isConfigured();
        return ResponseEntity.ok(Map.of(
                "configured", configured,
                "mode", configured ? "gemini-live" : "unconfigured",
                "model", "gemini-2.5-flash",
                "features", List.of(
                        "Technical Doubt Solver & Code Explainer",
                        "Placement & Interview Preparation Assistant",
                        "Resume & Job Competency Guidance",
                        "Interactive Step-by-Step Learning Mode",
                        "Stack Trace & Code Debugging Assistant"
                )
        ));
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest req,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required to use Career Assistant", 401);
        }
        ChatResponse response = chatService.processChatMessage(user, req);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummaryDto>> getConversations(
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        return ResponseEntity.ok(chatService.getUserConversations(user.getId()));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ConversationDetailDto> getConversation(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        return ResponseEntity.ok(chatService.getConversation(user.getId(), id));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Map<String, Object>> deleteConversation(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        chatService.deleteConversation(user.getId(), id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Conversation deleted successfully"));
    }

    @DeleteMapping("/conversations")
    public ResponseEntity<Map<String, Object>> clearAllConversations(
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            throw new ApiException("Authentication required", 401);
        }
        chatService.clearAllConversations(user.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "All conversation history cleared"));
    }

    @PostMapping("/quick-ask")
    public ResponseEntity<Map<String, Object>> quickAsk(
            @RequestBody QuickAskRequest req,
            @AuthenticationPrincipal UserEntity user) {
        String query = req != null ? req.getQuery() : null;
        return ResponseEntity.ok(chatService.executeQuickAsk(query, user));
    }
}
