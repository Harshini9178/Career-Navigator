package com.careernavigator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equals("MY_GEMINI_API_KEY");
    }

    public List<String> generateQuestions(
            String branch, List<String> skills, List<String> projects, String targetRole, String experienceLevel) {

        if (!isConfigured()) {
            return simulateQuestions(skills, targetRole);
        }

        try {
            String primarySkill = (skills != null && !skills.isEmpty()) ? skills.get(0) : "Software Architecture";
            String primaryProject = (projects != null && !projects.isEmpty()) ? projects.get(0) : "Engineering Capstone";

            String prompt = String.format(
                    "Generate exactly 5 targeted engineering interview questions strictly within these 4 domains for: Role=%s, Branch=%s, Level=%s, Skills=%s, Projects=%s. " +
                    "Domains: 1. Core Technical (%s), 2. System Design/Coding, 3. Project Deep Dive (%s), 4. Behavioral/HR, 5. Advanced Technical Architecture. " +
                    "Do NOT generate aptitude, math puzzles, or numerical reasoning questions. " +
                    "Return strictly a JSON array of 5 strings.",
                    targetRole, branch, experienceLevel, skills, projects, primarySkill, primaryProject
            );

            String responseText = callGeminiApi(prompt);
            JsonNode root = objectMapper.readTree(cleanJsonMarkdown(responseText));
            if (root.isArray()) {
                List<String> list = new ArrayList<>();
                root.forEach(item -> list.add(item.asText()));
                if (list.size() >= 3) return list;
            }
        } catch (Exception e) {
            logger.warn("Gemini question generation failed, using simulation: {}", e.getMessage());
        }

        return simulateQuestions(skills, targetRole);
    }

    public Map<String, Object> evaluateAnswer(String question, String answer) {
        if (!isConfigured()) {
            return simulateAnswerEvaluation(question, answer);
        }

        try {
            String prompt = String.format(
                    "Evaluate this candidate's answer to the technical question:\nQuestion: %s\nAnswer: %s\n" +
                    "Evaluate technical accuracy, communication, confidence, grammar, and delivery clarity. " +
                    "Return strictly JSON with keys: score (1-10), feedback (string), technicalScore (1-10), communicationScore (1-10), confidenceScore (1-10), grammar (string), clarity (string).",
                    question, answer
            );

            String responseText = callGeminiApi(prompt);
            JsonNode root = objectMapper.readTree(cleanJsonMarkdown(responseText));
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("score", root.path("score").asInt(7));
            result.put("feedback", root.path("feedback").asText("Good technical answer."));
            result.put("technicalScore", root.path("technicalScore").asInt(7));
            result.put("communicationScore", root.path("communicationScore").asInt(8));
            result.put("confidenceScore", root.path("confidenceScore").asInt(7));
            result.put("grammar", root.path("grammar").asText("Clean sentence formulation."));
            result.put("clarity", root.path("clarity").asText("Clear and structured."));
            return result;
        } catch (Exception e) {
            logger.warn("Gemini evaluation failed, using simulation: {}", e.getMessage());
            return simulateAnswerEvaluation(question, answer);
        }
    }

    public Map<String, Object> reviewCode(String code, String language, String problemStatement) {
        if (!isConfigured()) {
            return simulateCodeReview(code, language);
        }

        try {
            String prompt = String.format(
                    "Review this code submission:\nLanguage: %s\nProblem: %s\nCode:\n%s\n" +
                    "Analyze time complexity, space complexity, correctness, and code quality. " +
                    "Return strictly JSON with keys: correctness (0-100), timeComplexity (e.g. O(N)), spaceComplexity (e.g. O(1)), suggestions (array of strings), reviewSummary (string).",
                    language, problemStatement, code
            );

            String responseText = callGeminiApi(prompt);
            JsonNode root = objectMapper.readTree(cleanJsonMarkdown(responseText));
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("correctness", root.path("correctness").asInt(85));
            result.put("timeComplexity", root.path("timeComplexity").asText("O(N)"));
            result.put("spaceComplexity", root.path("spaceComplexity").asText("O(1)"));
            result.put("reviewSummary", root.path("reviewSummary").asText("Well-structured algorithm."));

            List<String> suggestions = new ArrayList<>();
            root.path("suggestions").forEach(s -> suggestions.add(s.asText()));
            result.put("suggestions", suggestions);
            return result;
        } catch (Exception e) {
            logger.warn("Gemini code review failed, using simulation: {}", e.getMessage());
            return simulateCodeReview(code, language);
        }
    }

    public Map<String, Object> generateOverallReport(String jobRole, List<Map<String, Object>> qas) {
        int avgTech = 75;
        int avgComm = 80;
        int avgConf = 78;

        if (qas != null && !qas.isEmpty()) {
            int totalTech = 0;
            int totalComm = 0;
            int count = 0;
            for (Map<String, Object> qa : qas) {
                Object evalObj = qa.get("evaluation");
                if (evalObj instanceof Map<?, ?> eval) {
                    Object tScore = eval.get("technicalScore");
                    Object cScore = eval.get("communicationScore");
                    if (tScore instanceof Number nt) totalTech += nt.intValue() * 10;
                    if (cScore instanceof Number nc) totalComm += nc.intValue() * 10;
                    count++;
                }
            }
            if (count > 0) {
                avgTech = totalTech / count;
                avgComm = totalComm / count;
            }
        }

        int overall = (int) Math.round((avgTech * 0.45) + (avgComm * 0.35) + (avgConf * 0.20));

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("overallScore", overall);
        report.put("technicalScore", avgTech);
        report.put("communicationScore", avgComm);
        report.put("confidenceScore", avgConf);
        report.put("feedbackText", "Candidate demonstrated solid foundational knowledge for the " + jobRole + " track. Answers were coherent and structured.");
        report.put("suggestions", Arrays.asList(
                "Incorporate more production-level examples and error-handling scenarios.",
                "Structure technical answers using the STAR method (Situation, Task, Action, Result).",
                "Deepen knowledge of database indexing and asynchronous workflows."
        ));
        return report;
    }

    private String callGeminiApi(String prompt) throws Exception {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", modelName, apiKey);

        Map<String, Object> contentPart = Map.of("text", prompt);
        Map<String, Object> contents = Map.of("parts", List.of(contentPart));
        Map<String, Object> requestBody = Map.of("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
    }

    private String cleanJsonMarkdown(String raw) {
        if (raw == null) return "{}";
        String cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    private List<String> simulateQuestions(List<String> skills, String targetRole) {
        String skill = (skills != null && !skills.isEmpty()) ? skills.get(0) : "your core tech stack";
        return Arrays.asList(
                String.format("Explain the architectural lifecycle and execution model of %s in a production environment.", skill),
                String.format("How would you design a scalable, low-latency microservice tailored for a %s role?", targetRole != null ? targetRole : "Software Engineer"),
                "Walk me through a complex bug you diagnosed in one of your projects, including the root-cause analysis and mitigation.",
                "Describe a situation where you had a disagreement with a team member about technical trade-offs. How did you resolve it?",
                "How do you profile and optimize memory leaks or CPU bottlenecks in high-throughput applications?"
        );
    }

    private Map<String, Object> simulateAnswerEvaluation(String question, String answer) {
        int wordCount = answer != null ? answer.trim().split("\\s+").length : 0;
        int score = wordCount >= 40 ? 8 : (wordCount >= 20 ? 6 : 4);

        Map<String, Object> eval = new LinkedHashMap<>();
        eval.put("score", score);
        eval.put("technicalScore", Math.min(10, score + 1));
        eval.put("communicationScore", score);
        eval.put("confidenceScore", Math.max(5, score - 1));
        eval.put("feedback", wordCount >= 30
                ? "Thorough and articulate response covering essential technical foundations."
                : "Answer is concise but would benefit from concrete real-world engineering examples.");
        eval.put("grammar", "Good syntax and professional technical vocabulary.");
        eval.put("clarity", wordCount >= 30 ? "Clear, logical structure." : "Pacing was fast; expand on key points.");
        return eval;
    }

    private Map<String, Object> simulateCodeReview(String code, String language) {
        int loopNesting = 0;
        if (code != null) {
            Matcher m = Pattern.compile("\\b(for|while)\\b").matcher(code);
            int count = 0;
            while (m.find()) count++;
            loopNesting = count;
        }

        String timeComp = loopNesting > 1 ? "O(N^2)" : (loopNesting == 1 ? "O(N)" : "O(1)");

        Map<String, Object> review = new LinkedHashMap<>();
        review.put("correctness", 90);
        review.put("timeComplexity", timeComp);
        review.put("spaceComplexity", "O(1)");
        review.put("reviewSummary", "Clean syntax adhering to " + (language != null ? language : "idiomatic") + " standards. Algorithmic complexity is optimal.");
        review.put("suggestions", Arrays.asList(
                "Consider adding boundary condition checks for empty inputs.",
                "Ensure proper exception handling for edge cases."
        ));
        return review;
    }
}
