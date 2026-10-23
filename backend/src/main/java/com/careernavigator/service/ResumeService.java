package com.careernavigator.service;

import com.careernavigator.dto.ResumeAnalysisResponse;
import com.careernavigator.entity.ResumeAnalysisEntity;
import com.careernavigator.entity.ResumeTemplateEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.repository.ResumeRepository;
import com.careernavigator.repository.TemplateRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class ResumeService {

    private final ResumeParserService resumeParserService;
    private final AtsScoringService atsScoringService;
    private final ResumeRepository resumeRepository;
    private final TemplateRepository templateRepository;
    private final DatabaseStorageService databaseStorageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeService(
            ResumeParserService resumeParserService,
            AtsScoringService atsScoringService,
            ResumeRepository resumeRepository,
            TemplateRepository templateRepository,
            DatabaseStorageService databaseStorageService) {
        this.resumeParserService = resumeParserService;
        this.atsScoringService = atsScoringService;
        this.resumeRepository = resumeRepository;
        this.templateRepository = templateRepository;
        this.databaseStorageService = databaseStorageService;
    }

    public ResumeAnalysisResponse analyzeResume(MultipartFile file, String targetRole, UserEntity user) {
        return processResumeAnalysis(file, targetRole, null, user);
    }

    public ResumeAnalysisResponse analyzeResumeWithJD(MultipartFile file, String jobDescription, String targetRole, UserEntity user) {
        if (jobDescription == null || jobDescription.trim().length() < 10) {
            throw new ApiException("Please provide a valid Job Description with at least 10 characters.", 400);
        }
        return processResumeAnalysis(file, targetRole, jobDescription, user);
    }

    private ResumeAnalysisResponse processResumeAnalysis(MultipartFile file, String targetRole, String jobDescription, UserEntity user) {
        String extractedText = resumeParserService.extractText(file);
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf";
        return analyzeResumeText(extractedText, fileName, targetRole, jobDescription, user);
    }

    public ResumeAnalysisResponse analyzeResumeText(String resumeText, String fileName, String targetRole, String jobDescription, UserEntity user) {
        if (resumeText == null || resumeText.trim().length() < 30) {
            throw new ApiException("Resume text content is required and must be at least 30 characters.", 400);
        }
        String safeFileName = (fileName != null && !fileName.isBlank()) ? fileName : "resume.pdf";
        ResumeAnalysisResponse response = atsScoringService.evaluateResume(resumeText, safeFileName, targetRole, jobDescription);
        response.setUserId(user != null ? user.getId() : "anonymous");

        // Persist to JPA and db.json
        try {
            ResumeAnalysisEntity entity = new ResumeAnalysisEntity();
            entity.setId(response.getId());
            entity.setUserId(response.getUserId());
            entity.setFileName(response.getFileName());
            entity.setUploadedAt(response.getUploadedAt());
            entity.setAtsScore(response.getAtsScore());
            entity.setSkills(response.getSkills());
            entity.setMissingSections(response.getMissingSections());
            entity.setSuggestions(response.getSuggestions());
            entity.setGrammarIssues(response.getGrammarIssues());
            entity.setImprovementsToAdd(response.getImprovementsToAdd());
            entity.setImprovementsToRemove(response.getImprovementsToRemove());
            entity.setWordCount(response.getWordCount());
            entity.setContentHash(response.getContentHash());
            entity.setTargetRole(response.getTargetRole());
            entity.setJdMatchScore(response.getJdMatchScore());
            entity.setJobDescription(response.getJobDescription());
            entity.setMatchedJDKeywords(response.getMatchedJDKeywords());
            entity.setMissingJDKeywords(response.getMissingJDKeywords());

            entity.setKeywordsJson(objectMapper.writeValueAsString(response.getKeywords()));
            entity.setCategoryBreakdownJson(objectMapper.writeValueAsString(response.getCategoryBreakdown()));
            entity.setSectionDetailsJson(objectMapper.writeValueAsString(response.getSectionDetails()));

            resumeRepository.save(entity);
            databaseStorageService.syncToDbJson();
        } catch (Exception ignored) {
        }

        return response;
    }

    public Optional<ResumeAnalysisResponse> findLatestAnalysis(String userId) {
        Optional<ResumeAnalysisEntity> opt = resumeRepository.findFirstByUserIdOrderByUploadedAtDesc(userId);
        if (opt.isEmpty()) {
            return Optional.empty();
        }
        ResumeAnalysisEntity entity = opt.get();
        ResumeAnalysisResponse resp = new ResumeAnalysisResponse();
        resp.setId(entity.getId());
        resp.setUserId(entity.getUserId());
        resp.setFileName(entity.getFileName());
        resp.setUploadedAt(entity.getUploadedAt());
        resp.setAtsScore(entity.getAtsScore());
        resp.setSkills(entity.getSkills());
        resp.setMissingSections(entity.getMissingSections());
        resp.setSuggestions(entity.getSuggestions());
        resp.setGrammarIssues(entity.getGrammarIssues());
        resp.setImprovementsToAdd(entity.getImprovementsToAdd());
        resp.setImprovementsToRemove(entity.getImprovementsToRemove());
        resp.setWordCount(entity.getWordCount());
        resp.setContentHash(entity.getContentHash());
        resp.setTargetRole(entity.getTargetRole());
        resp.setJdMatchScore(entity.getJdMatchScore());
        resp.setJobDescription(entity.getJobDescription());
        resp.setMatchedJDKeywords(entity.getMatchedJDKeywords());
        resp.setMissingJDKeywords(entity.getMissingJDKeywords());

        try {
            if (entity.getKeywordsJson() != null) {
                resp.setKeywords(objectMapper.readValue(entity.getKeywordsJson(), new TypeReference<>() {}));
            }
            if (entity.getCategoryBreakdownJson() != null) {
                resp.setCategoryBreakdown(objectMapper.readValue(entity.getCategoryBreakdownJson(), new TypeReference<>() {}));
            }
            if (entity.getSectionDetailsJson() != null) {
                resp.setSectionDetails(objectMapper.readValue(entity.getSectionDetailsJson(), new TypeReference<>() {}));
            }
        } catch (Exception ignored) {
        }
        return Optional.of(resp);
    }

    public ResumeAnalysisResponse getLatestAnalysis(String userId) {
        return findLatestAnalysis(userId)
                .orElseThrow(() -> new ApiException("No resume analysis found for the current user.", 404));
    }

    public List<ResumeTemplateEntity> getAllTemplates() {
        return templateRepository.findAll();
    }

    public Map<String, Object> downloadTemplate(String templateId) {
        ResumeTemplateEntity template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ApiException("Template not found", 404));

        int downloads = template.getDownloads() != null ? template.getDownloads() + 1 : 1;
        template.setDownloads(downloads);
        templateRepository.save(template);
        databaseStorageService.syncToDbJson();

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("downloads", downloads);
        res.put("template", template);
        return res;
    }
}
