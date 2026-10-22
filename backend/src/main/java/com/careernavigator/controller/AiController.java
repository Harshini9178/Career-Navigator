package com.careernavigator.controller;

import com.careernavigator.dto.InterviewRequests.QuickAskRequest;
import com.careernavigator.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final GeminiService geminiService;

    public AiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAiStatus() {
        boolean configured = geminiService.isConfigured();
        return ResponseEntity.ok(Map.of(
                "configured", configured,
                "mode", configured ? "gemini-live" : "simulation-fallback",
                "model", "gemini-2.5-flash"
        ));
    }

    @PostMapping("/quick-ask")
    public ResponseEntity<Map<String, String>> quickAsk(@RequestBody QuickAskRequest req) {
        String query = req.getQuery() != null ? req.getQuery() : "Explain placement prep";
        return ResponseEntity.ok(Map.of(
                "response", "Career Navigator Career Assistant: Focus on foundational DSA (Arrays, Trees, Graphs), practicing STAR-method behavioral responses, and tailoring your resume keywords specifically to your target engineering track."
        ));
    }
}
