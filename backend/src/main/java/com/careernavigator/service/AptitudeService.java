package com.careernavigator.service;

import com.careernavigator.dto.AptitudeDto.*;
import com.careernavigator.entity.AptitudeQuestionEntity;
import com.careernavigator.entity.AssessmentAttemptEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.repository.AptitudeQuestionRepository;
import com.careernavigator.repository.AssessmentAttemptRepository;
import com.careernavigator.util.AptitudeQuestionBank;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AptitudeService {

    private static final Logger logger = LoggerFactory.getLogger(AptitudeService.class);

    private final AptitudeQuestionRepository questionRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final ObjectMapper objectMapper;
    private final DatabaseStorageService databaseStorageService;

    public AptitudeService(
            AptitudeQuestionRepository questionRepository,
            AssessmentAttemptRepository attemptRepository,
            ObjectMapper objectMapper,
            DatabaseStorageService databaseStorageService) {
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
        this.objectMapper = objectMapper;
        this.databaseStorageService = databaseStorageService;
    }

    @PostConstruct
    public void init() {
        try {
            long count = questionRepository.count();
            if (count < 75) {
                logger.info("Seeding Aptitude Question Bank (current count: {})...", count);
                List<AptitudeQuestionEntity> seedQuestions = AptitudeQuestionBank.getSeedQuestions();
                questionRepository.saveAll(seedQuestions);
                logger.info("Successfully seeded {} aptitude questions.", seedQuestions.size());
            }
        } catch (Exception e) {
            logger.error("Error initializing Aptitude Question Bank: {}", e.getMessage(), e);
        }
    }

    public List<Map<String, Object>> getCategories() {
        List<Map<String, Object>> list = new ArrayList<>();

        for (String cat : AptitudeQuestionBank.ALL_CATEGORIES) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("name", cat);
            map.put("totalInBank", questionRepository.findByCategoryAndActiveTrue(cat).size());
            map.put("questionsPerTest", 6);

            switch (cat) {
                case AptitudeQuestionBank.CAT_QUANT:
                    map.put("description", "Work & Time, Speed & Distance, Profit & Loss, Percentages, Probability, Mensuration, Number Systems");
                    map.put("icon", "Calculator");
                    break;
                case AptitudeQuestionBank.CAT_LOGIC:
                    map.put("description", "Syllogisms, Blood Relations, Coding-Decoding, Seating Arrangements, Critical Reasoning");
                    map.put("icon", "Lightbulb");
                    break;
                case AptitudeQuestionBank.CAT_VERBAL:
                    map.put("description", "Grammar, Synonyms, Antonyms, Sentence Correction, Para Jumbles, Tone & Reading");
                    map.put("icon", "BookOpen");
                    break;
                case AptitudeQuestionBank.CAT_TECH:
                    map.put("description", "Java Core, OOP, Spring Boot, Data Structures & Algorithms, SQL, System Design, Concurrency");
                    map.put("icon", "Cpu");
                    break;
                case AptitudeQuestionBank.CAT_DATA:
                    map.put("description", "Tabular Analysis, Pie Charts, Trend Growth, Data Sufficiency, Caselets, Demographics");
                    map.put("icon", "BarChart3");
                    break;
                default:
                    map.put("description", "General Aptitude");
                    map.put("icon", "Brain");
            }
            list.add(map);
        }
        return list;
    }

    @Transactional
    public AptitudeAttemptDto startOrResumeAttempt(UserEntity user) {
        // 1. Look for existing in-progress attempt
        Optional<AssessmentAttemptEntity> activeOpt = attemptRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), "IN_PROGRESS");

        if (activeOpt.isPresent()) {
            AssessmentAttemptEntity attempt = activeOpt.get();
            Instant deadline = Instant.parse(attempt.getDeadline());
            long remaining = Duration.between(Instant.now(), deadline).getSeconds();

            if (remaining > 0 && attempt.getViolationsCount() < 3) {
                logger.info("Resuming active aptitude attempt {} for user {}", attempt.getId(), user.getEmail());
                return mapToAttemptDto(attempt, remaining);
            } else {
                // Time expired or violation limit reached; finalize it
                logger.info("Active attempt {} has expired (remaining: {}s). Finalizing...", attempt.getId(), remaining);
                finalizeAttempt(attempt, remaining <= 0 ? "TIMED_OUT" : "VIOLATION_TERMINATED", "Time limit expired");
            }
        }

        // 2. Create brand-new 30-question assessment
        return createNewAttempt(user);
    }

    @Transactional
    public AptitudeAttemptDto createNewAttempt(UserEntity user) {
        // Collect previously seen question IDs for this user
        List<AssessmentAttemptEntity> previousAttempts = attemptRepository.findByUserIdOrderByStartedAtDesc(user.getId());
        Set<String> seenQuestionIds = new HashSet<>();
        for (AssessmentAttemptEntity prev : previousAttempts) {
            try {
                List<String> qIds = objectMapper.readValue(prev.getQuestionsJson(), new TypeReference<List<String>>() {});
                seenQuestionIds.addAll(qIds);
            } catch (Exception ignored) {}
        }

        List<AptitudeQuestionEntity> selectedQuestions = new ArrayList<>();

        // Pick exactly 6 questions from each of the 5 categories
        for (String category : AptitudeQuestionBank.ALL_CATEGORIES) {
            List<AptitudeQuestionEntity> allCatQuestions = questionRepository.findByCategoryAndActiveTrue(category);
            List<AptitudeQuestionEntity> unseen = allCatQuestions.stream()
                    .filter(q -> !seenQuestionIds.contains(q.getId()))
                    .collect(Collectors.toList());
            List<AptitudeQuestionEntity> seen = allCatQuestions.stream()
                    .filter(q -> seenQuestionIds.contains(q.getId()))
                    .collect(Collectors.toList());

            Collections.shuffle(unseen);
            Collections.shuffle(seen);

            List<AptitudeQuestionEntity> catSelection = new ArrayList<>();
            for (AptitudeQuestionEntity q : unseen) {
                if (catSelection.size() < 6) catSelection.add(q);
            }
            if (catSelection.size() < 6) {
                for (AptitudeQuestionEntity q : seen) {
                    if (catSelection.size() < 6) catSelection.add(q);
                }
            }
            selectedQuestions.addAll(catSelection);
        }

        // If for any reason total < 30 (e.g. database has missing entries), fill from whatever active questions exist
        if (selectedQuestions.size() < 30) {
            List<AptitudeQuestionEntity> allActive = questionRepository.findAllByActiveTrue();
            Set<String> alreadyPicked = selectedQuestions.stream().map(AptitudeQuestionEntity::getId).collect(Collectors.toSet());
            for (AptitudeQuestionEntity q : allActive) {
                if (selectedQuestions.size() >= 30) break;
                if (!alreadyPicked.contains(q.getId())) {
                    selectedQuestions.add(q);
                    alreadyPicked.add(q.getId());
                }
            }
        }

        // Interleave / shuffle questions across categories for a dynamic exam feel
        Collections.shuffle(selectedQuestions);

        List<String> questionIds = selectedQuestions.stream().map(AptitudeQuestionEntity::getId).collect(Collectors.toList());

        AssessmentAttemptEntity attempt = new AssessmentAttemptEntity();
        attempt.setId(UUID.randomUUID().toString());
        attempt.setUserId(user.getId());
        attempt.setStatus("IN_PROGRESS");
        Instant now = Instant.now();
        attempt.setStartedAt(now.toString());
        attempt.setDeadline(now.plusSeconds(1800).toString()); // exactly 30 minutes
        attempt.setDurationSeconds(0);
        attempt.setScore(0);
        attempt.setPercentage(0.0);
        attempt.setTotalQuestions(selectedQuestions.size());
        attempt.setViolationsCount(0);

        try {
            attempt.setQuestionsJson(objectMapper.writeValueAsString(questionIds));
            attempt.setAnswersJson(objectMapper.writeValueAsString(new HashMap<String, Integer>()));
            attempt.setMarkedForReviewJson(objectMapper.writeValueAsString(new ArrayList<String>()));
            attempt.setCategoryScoresJson(objectMapper.writeValueAsString(new HashMap<String, CategoryScoreDto>()));
        } catch (Exception e) {
            throw new RuntimeException("Error serializing attempt state", e);
        }

        AssessmentAttemptEntity saved = attemptRepository.save(attempt);
        databaseStorageService.syncToDbJson();
        logger.info("Created new Aptitude Assessment Attempt {} with {} questions for user {}", saved.getId(), saved.getTotalQuestions(), user.getEmail());

        return mapToAttemptDto(saved, 1800);
    }

    public AptitudeAttemptDto getAttempt(String attemptId, UserEntity user) {
        AssessmentAttemptEntity attempt = findUserAttempt(attemptId, user);
        long remaining = calculateRemainingSeconds(attempt);

        if ("IN_PROGRESS".equals(attempt.getStatus()) && remaining <= 0) {
            attempt = finalizeAttempt(attempt, "TIMED_OUT", "Time expired");
            remaining = 0;
        }

        return mapToAttemptDto(attempt, remaining);
    }

    @Transactional
    public AptitudeAttemptDto saveAnswer(String attemptId, String questionId, SaveAnswerRequest req, UserEntity user) {
        AssessmentAttemptEntity attempt = findUserAttempt(attemptId, user);

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            throw new IllegalStateException("Assessment is not in progress. Current status: " + attempt.getStatus());
        }

        long remaining = calculateRemainingSeconds(attempt);
        if (remaining <= 0) {
            attempt = finalizeAttempt(attempt, "TIMED_OUT", "Time limit expired while submitting answer");
            return mapToAttemptDto(attempt, 0);
        }

        Map<String, Integer> answers = parseAnswers(attempt.getAnswersJson());
        List<String> marked = parseMarked(attempt.getMarkedForReviewJson());

        if (req.getSelectedOption() != null) {
            if (req.getSelectedOption() >= 0 && req.getSelectedOption() <= 3) {
                answers.put(questionId, req.getSelectedOption());
            }
        } else {
            answers.remove(questionId);
        }

        if (Boolean.TRUE.equals(req.getMarkedForReview())) {
            if (!marked.contains(questionId)) marked.add(questionId);
        } else if (Boolean.FALSE.equals(req.getMarkedForReview())) {
            marked.remove(questionId);
        }

        try {
            attempt.setAnswersJson(objectMapper.writeValueAsString(answers));
            attempt.setMarkedForReviewJson(objectMapper.writeValueAsString(marked));
            long spent = Duration.between(Instant.parse(attempt.getStartedAt()), Instant.now()).getSeconds();
            attempt.setDurationSeconds((int) Math.min(1800, spent));
        } catch (Exception e) {
            throw new RuntimeException("Error updating attempt answers", e);
        }

        AssessmentAttemptEntity saved = attemptRepository.save(attempt);
        databaseStorageService.syncToDbJson();
        return mapToAttemptDto(saved, remaining);
    }

    @Transactional
    public AptitudeAttemptDto recordViolation(String attemptId, RecordViolationRequest req, UserEntity user) {
        AssessmentAttemptEntity attempt = findUserAttempt(attemptId, user);

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            return mapToAttemptDto(attempt, 0);
        }

        int count = attempt.getViolationsCount() + 1;
        attempt.setViolationsCount(count);
        logger.warn("Security/Integrity violation #{} recorded for user {} on attempt {}: {}", count, user.getEmail(), attemptId, req.getEventType());

        if (count >= 3) {
            attempt = finalizeAttempt(attempt, "VIOLATION_TERMINATED", "Terminated due to multiple integrity violations (3 tab-switches or fullscreen exits detected).");
            return mapToAttemptDto(attempt, 0);
        } else {
            AssessmentAttemptEntity saved = attemptRepository.save(attempt);
            long remaining = calculateRemainingSeconds(saved);
            return mapToAttemptDto(saved, remaining);
        }
    }

    @Transactional
    public AptitudeResultDto submitAttempt(String attemptId, SubmitAttemptRequest req, UserEntity user) {
        AssessmentAttemptEntity attempt = findUserAttempt(attemptId, user);

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            return getAttemptResult(attemptId, user);
        }

        long remaining = calculateRemainingSeconds(attempt);
        String finalStatus = (remaining <= 0) ? "TIMED_OUT" : "COMPLETED";
        String reason = (req != null && req.getForcedReason() != null) ? req.getForcedReason() : (remaining <= 0 ? "Time limit expired" : null);

        AssessmentAttemptEntity finalized = finalizeAttempt(attempt, finalStatus, reason);
        return buildResultDto(finalized);
    }

    public AptitudeResultDto getAttemptResult(String attemptId, UserEntity user) {
        AssessmentAttemptEntity attempt = findUserAttempt(attemptId, user);

        if ("IN_PROGRESS".equals(attempt.getStatus())) {
            long remaining = calculateRemainingSeconds(attempt);
            if (remaining <= 0) {
                attempt = finalizeAttempt(attempt, "TIMED_OUT", "Time expired");
            }
        }

        return buildResultDto(attempt);
    }

    public List<AptitudeHistoryItemDto> getHistory(UserEntity user) {
        List<AssessmentAttemptEntity> attempts = attemptRepository.findByUserIdOrderByStartedAtDesc(user.getId());
        List<AptitudeHistoryItemDto> history = new ArrayList<>();

        for (AssessmentAttemptEntity att : attempts) {
            AptitudeHistoryItemDto item = new AptitudeHistoryItemDto();
            item.setId(att.getId());
            item.setStartedAt(att.getStartedAt());
            item.setCompletedAt(att.getCompletedAt());
            item.setScore(att.getScore());
            item.setPercentage(att.getPercentage());
            item.setTotalQuestions(att.getTotalQuestions());
            item.setDurationSeconds(att.getDurationSeconds());
            item.setStatus(att.getStatus());
            item.setViolationsCount(att.getViolationsCount());
            item.setForcedSubmissionReason(att.getForcedSubmissionReason());

            try {
                if (att.getCategoryScoresJson() != null) {
                    Map<String, Map<String, Object>> catMap = objectMapper.readValue(
                            att.getCategoryScoresJson(),
                            new TypeReference<Map<String, Map<String, Object>>>() {}
                    );
                    Map<String, Integer> catScores = new HashMap<>();
                    catMap.forEach((k, v) -> {
                        Object s = v.get("score");
                        if (s instanceof Number) catScores.put(k, ((Number) s).intValue());
                    });
                    item.setCategoryScores(catScores);
                }
            } catch (Exception ignored) {}

            history.add(item);
        }
        return history;
    }

    // ==========================================
    // Internal Helper Methods
    // ==========================================

    private AssessmentAttemptEntity findUserAttempt(String attemptId, UserEntity user) {
        AssessmentAttemptEntity attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NoSuchElementException("Assessment attempt not found: " + attemptId));

        if (!attempt.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to assessment attempt");
        }
        return attempt;
    }

    private long calculateRemainingSeconds(AssessmentAttemptEntity attempt) {
        try {
            Instant deadline = Instant.parse(attempt.getDeadline());
            return Math.max(0, Duration.between(Instant.now(), deadline).getSeconds());
        } catch (Exception e) {
            return 0;
        }
    }

    private AssessmentAttemptEntity finalizeAttempt(AssessmentAttemptEntity attempt, String status, String reason) {
        attempt.setStatus(status);
        attempt.setForcedSubmissionReason(reason);
        Instant now = Instant.now();
        attempt.setCompletedAt(now.toString());

        long duration = Duration.between(Instant.parse(attempt.getStartedAt()), now).getSeconds();
        attempt.setDurationSeconds((int) Math.min(1800, Math.max(0, duration)));

        // Score calculations
        List<String> questionIds = parseQuestionIds(attempt.getQuestionsJson());
        Map<String, Integer> answers = parseAnswers(attempt.getAnswersJson());

        Map<String, AptitudeQuestionEntity> questionMap = questionRepository.findAllById(questionIds)
                .stream().collect(Collectors.toMap(AptitudeQuestionEntity::getId, q -> q));

        int totalScore = 0;
        Map<String, int[]> categoryTally = new HashMap<>(); // [correct, total]

        for (String qId : questionIds) {
            AptitudeQuestionEntity q = questionMap.get(qId);
            if (q == null) continue;

            String cat = q.getCategory();
            categoryTally.putIfAbsent(cat, new int[]{0, 0});
            categoryTally.get(cat)[1]++;

            Integer selected = answers.get(qId);
            if (selected != null && selected == q.getCorrectAnswerIndex()) {
                totalScore++;
                categoryTally.get(cat)[0]++;
            }
        }

        attempt.setScore(totalScore);
        int total = attempt.getTotalQuestions() > 0 ? attempt.getTotalQuestions() : 30;
        double pct = Math.round((totalScore * 100.0 / total) * 10.0) / 10.0;
        attempt.setPercentage(pct);

        Map<String, CategoryScoreDto> catScores = new LinkedHashMap<>();
        for (String cat : AptitudeQuestionBank.ALL_CATEGORIES) {
            int[] tally = categoryTally.getOrDefault(cat, new int[]{0, 6});
            int cScore = tally[0];
            int cTotal = tally[1] > 0 ? tally[1] : 6;
            double cPct = Math.round((cScore * 100.0 / cTotal) * 10.0) / 10.0;
            catScores.put(cat, new CategoryScoreDto(cat, cScore, cTotal, cPct));
        }

        try {
            attempt.setCategoryScoresJson(objectMapper.writeValueAsString(catScores));
        } catch (Exception ignored) {}

        AssessmentAttemptEntity saved = attemptRepository.save(attempt);
        databaseStorageService.syncToDbJson();
        return saved;
    }

    private AptitudeAttemptDto mapToAttemptDto(AssessmentAttemptEntity attempt, long remainingSeconds) {
        AptitudeAttemptDto dto = new AptitudeAttemptDto();
        dto.setId(attempt.getId());
        dto.setUserId(attempt.getUserId());
        dto.setStatus(attempt.getStatus());
        dto.setStartedAt(attempt.getStartedAt());
        dto.setDeadline(attempt.getDeadline());
        dto.setRemainingSeconds(remainingSeconds);
        dto.setTotalQuestions(attempt.getTotalQuestions());
        dto.setViolationsCount(attempt.getViolationsCount());

        Map<String, Integer> answers = parseAnswers(attempt.getAnswersJson());
        List<String> marked = parseMarked(attempt.getMarkedForReviewJson());
        dto.setAnswers(answers);
        dto.setMarkedForReview(marked);
        dto.setAnsweredCount(answers.size());
        dto.setMarkedCount(marked.size());

        List<String> qIds = parseQuestionIds(attempt.getQuestionsJson());
        Map<String, AptitudeQuestionEntity> qMap = questionRepository.findAllById(qIds)
                .stream().collect(Collectors.toMap(AptitudeQuestionEntity::getId, q -> q));

        List<AptitudeQuestionClientDto> clientQuestions = new ArrayList<>();
        for (String qId : qIds) {
            AptitudeQuestionEntity q = qMap.get(qId);
            if (q != null) {
                // Strips correctAnswerIndex & explanation for client security
                clientQuestions.add(new AptitudeQuestionClientDto(
                        q.getId(),
                        q.getQuestionText(),
                        q.getCategory(),
                        q.getTopic(),
                        q.getDifficulty(),
                        q.getOptions()
                ));
            }
        }
        dto.setQuestions(clientQuestions);

        return dto;
    }

    private AptitudeResultDto buildResultDto(AssessmentAttemptEntity attempt) {
        AptitudeResultDto dto = new AptitudeResultDto();
        dto.setId(attempt.getId());
        dto.setUserId(attempt.getUserId());
        dto.setScore(attempt.getScore());
        dto.setPercentage(attempt.getPercentage());
        dto.setTotalQuestions(attempt.getTotalQuestions());
        dto.setDurationSeconds(attempt.getDurationSeconds());
        dto.setStatus(attempt.getStatus());
        dto.setStartedAt(attempt.getStartedAt());
        dto.setCompletedAt(attempt.getCompletedAt());
        dto.setViolationsCount(attempt.getViolationsCount());
        dto.setForcedSubmissionReason(attempt.getForcedSubmissionReason());

        List<String> qIds = parseQuestionIds(attempt.getQuestionsJson());
        Map<String, Integer> answers = parseAnswers(attempt.getAnswersJson());
        Map<String, AptitudeQuestionEntity> qMap = questionRepository.findAllById(qIds)
                .stream().collect(Collectors.toMap(AptitudeQuestionEntity::getId, q -> q));

        int correctCount = 0;
        int incorrectCount = 0;
        int unansweredCount = 0;

        List<QuestionReviewDto> reviews = new ArrayList<>();
        Map<String, int[]> categoryTally = new LinkedHashMap<>();

        for (String qId : qIds) {
            AptitudeQuestionEntity q = qMap.get(qId);
            if (q == null) continue;

            String cat = q.getCategory();
            categoryTally.putIfAbsent(cat, new int[]{0, 0});
            categoryTally.get(cat)[1]++;

            Integer selected = answers.get(qId);
            boolean isCorrect = false;

            if (selected == null) {
                unansweredCount++;
            } else if (selected == q.getCorrectAnswerIndex()) {
                correctCount++;
                categoryTally.get(cat)[0]++;
                isCorrect = true;
            } else {
                incorrectCount++;
            }

            QuestionReviewDto rev = new QuestionReviewDto();
            rev.setId(q.getId());
            rev.setQuestionText(q.getQuestionText());
            rev.setCategory(q.getCategory());
            rev.setTopic(q.getTopic());
            rev.setDifficulty(q.getDifficulty());
            rev.setOptions(q.getOptions());
            rev.setSelectedOption(selected);
            rev.setCorrectAnswerIndex(q.getCorrectAnswerIndex());
            rev.setCorrect(isCorrect);
            rev.setExplanation(q.getExplanation());
            reviews.add(rev);
        }

        dto.setCorrectCount(correctCount);
        dto.setIncorrectCount(incorrectCount);
        dto.setUnansweredCount(unansweredCount);
        dto.setQuestionReviews(reviews);

        List<CategoryScoreDto> catScoresList = new ArrayList<>();
        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        for (String cat : AptitudeQuestionBank.ALL_CATEGORIES) {
            int[] tally = categoryTally.getOrDefault(cat, new int[]{0, 6});
            int sc = tally[0];
            int tot = tally[1] > 0 ? tally[1] : 6;
            double pct = Math.round((sc * 100.0 / tot) * 10.0) / 10.0;
            catScoresList.add(new CategoryScoreDto(cat, sc, tot, pct));

            if (pct >= 66.7) {
                strengths.add(cat + " (" + (int)pct + "% accuracy - solid conceptual grasp)");
            } else if (pct < 50.0) {
                improvements.add(cat + " (" + (int)pct + "% accuracy - needs revision & practice)");
            }
        }

        if (strengths.isEmpty()) {
            strengths.add("Foundational problem solving and test endurance across standard assessment conditions.");
        }
        if (improvements.isEmpty()) {
            improvements.add("Fine-tune speed and time management to target a 95%+ top-percentile percentile ranking.");
        }

        if (categoryTally.getOrDefault(AptitudeQuestionBank.CAT_TECH, new int[]{0, 6})[0] < 4) {
            recommendations.add("Revisit Java concurrency fundamentals, Spring Boot bean lifecycle, and SQL JOIN mechanics.");
        }
        if (categoryTally.getOrDefault(AptitudeQuestionBank.CAT_QUANT, new int[]{0, 6})[0] < 4) {
            recommendations.add("Practice short-cut formulas for Time & Work, Speed-Distance, and Compound Interest calculations.");
        }
        if (categoryTally.getOrDefault(AptitudeQuestionBank.CAT_DATA, new int[]{0, 6})[0] < 4) {
            recommendations.add("Enhance tabular and percentage approximation techniques to evaluate Data Interpretation sets under 60 seconds.");
        }
        if (recommendations.isEmpty()) {
            recommendations.add("Maintain consistency by taking timed mock assessments weekly and reviewing edge-case reasoning questions.");
        }

        dto.setCategoryScores(catScoresList);
        dto.setStrengths(strengths);
        dto.setImprovements(improvements);
        dto.setRecommendations(recommendations);

        return dto;
    }

    private List<String> parseQuestionIds(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private Map<String, Integer> parseAnswers(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private List<String> parseMarked(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
