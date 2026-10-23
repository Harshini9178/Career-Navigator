package com.careernavigator.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResumeAnalysisResponse {

    private String id;
    private String userId;
    private String fileName;
    private String uploadedAt;
    private Integer atsScore;
    private List<ScoreCategoryBreakdown> categoryBreakdown = new ArrayList<>();
    private List<String> detectedSections = new ArrayList<>();
    private List<String> missingSections = new ArrayList<>();
    private List<SectionAnalysisResult> sectionDetails = new ArrayList<>();
    private List<String> skills = new ArrayList<>();
    private List<KeywordDensityResult> keywords = new ArrayList<>();
    private List<String> suggestions = new ArrayList<>();
    private List<String> grammarIssues = new ArrayList<>();
    private List<String> improvementsToAdd = new ArrayList<>();
    private List<String> improvementsToRemove = new ArrayList<>();
    private Integer wordCount;
    private String contentHash;
    private String targetRole;
    private Integer jdMatchScore;
    private String jobDescription;
    private List<String> matchedJDKeywords = new ArrayList<>();
    private List<String> missingJDKeywords = new ArrayList<>();

    public ResumeAnalysisResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(String uploadedAt) { this.uploadedAt = uploadedAt; }

    public Integer getAtsScore() { return atsScore; }
    public void setAtsScore(Integer atsScore) { this.atsScore = atsScore; }

    private boolean success = true;

    public boolean isSuccess() { return success; }
    public boolean getSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public List<ScoreCategoryBreakdown> getCategoryBreakdown() { return categoryBreakdown != null ? categoryBreakdown : new ArrayList<>(); }
    public void setCategoryBreakdown(List<ScoreCategoryBreakdown> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown != null ? categoryBreakdown : new ArrayList<>(); }

    public List<String> getDetectedSections() { return detectedSections != null ? detectedSections : new ArrayList<>(); }
    public void setDetectedSections(List<String> detectedSections) { this.detectedSections = detectedSections != null ? detectedSections : new ArrayList<>(); }

    public List<String> getMissingSections() { return missingSections != null ? missingSections : new ArrayList<>(); }
    public void setMissingSections(List<String> missingSections) { this.missingSections = missingSections != null ? missingSections : new ArrayList<>(); }

    public List<SectionAnalysisResult> getSectionDetails() { return sectionDetails != null ? sectionDetails : new ArrayList<>(); }
    public void setSectionDetails(List<SectionAnalysisResult> sectionDetails) { this.sectionDetails = sectionDetails != null ? sectionDetails : new ArrayList<>(); }

    public List<String> getSkills() { return skills != null ? skills : new ArrayList<>(); }
    public void setSkills(List<String> skills) { this.skills = skills != null ? skills : new ArrayList<>(); }

    public List<KeywordDensityResult> getKeywords() { return keywords != null ? keywords : new ArrayList<>(); }
    public void setKeywords(List<KeywordDensityResult> keywords) { this.keywords = keywords != null ? keywords : new ArrayList<>(); }

    public List<String> getSuggestions() { return suggestions != null ? suggestions : new ArrayList<>(); }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions != null ? suggestions : new ArrayList<>(); }

    public List<String> getGrammarIssues() { return grammarIssues != null ? grammarIssues : new ArrayList<>(); }
    public void setGrammarIssues(List<String> grammarIssues) { this.grammarIssues = grammarIssues != null ? grammarIssues : new ArrayList<>(); }

    public List<String> getImprovementsToAdd() { return improvementsToAdd != null ? improvementsToAdd : new ArrayList<>(); }
    public void setImprovementsToAdd(List<String> improvementsToAdd) { this.improvementsToAdd = improvementsToAdd != null ? improvementsToAdd : new ArrayList<>(); }

    public List<String> getImprovementsToRemove() { return improvementsToRemove != null ? improvementsToRemove : new ArrayList<>(); }
    public void setImprovementsToRemove(List<String> improvementsToRemove) { this.improvementsToRemove = improvementsToRemove != null ? improvementsToRemove : new ArrayList<>(); }

    public Integer getWordCount() { return wordCount; }
    public void setWordCount(Integer wordCount) { this.wordCount = wordCount; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public Integer getJdMatchScore() { return jdMatchScore; }
    public void setJdMatchScore(Integer jdMatchScore) { this.jdMatchScore = jdMatchScore; }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public List<String> getMatchedJDKeywords() { return matchedJDKeywords != null ? matchedJDKeywords : new ArrayList<>(); }
    public void setMatchedJDKeywords(List<String> matchedJDKeywords) { this.matchedJDKeywords = matchedJDKeywords != null ? matchedJDKeywords : new ArrayList<>(); }

    public List<String> getMissingJDKeywords() { return missingJDKeywords != null ? missingJDKeywords : new ArrayList<>(); }
    public void setMissingJDKeywords(List<String> missingJDKeywords) { this.missingJDKeywords = missingJDKeywords != null ? missingJDKeywords : new ArrayList<>(); }

    // Nested structures
    public static class ScoreCategoryBreakdown {
        private String category;
        private int score;
        private int maxScore;
        private int weight;
        private String reason;

        public ScoreCategoryBreakdown() {}
        public ScoreCategoryBreakdown(String category, int score, int maxScore, int weight, String reason) {
            this.category = category;
            this.score = score;
            this.maxScore = maxScore;
            this.weight = weight;
            this.reason = reason;
        }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }

        public int getMaxScore() { return maxScore; }
        public void setMaxScore(int maxScore) { this.maxScore = maxScore; }

        public int getWeight() { return weight; }
        public void setWeight(int weight) { this.weight = weight; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class SectionAnalysisResult {
        private String sectionName;
        private boolean detected;
        private String evidence;
        private double confidence;

        public SectionAnalysisResult() {}
        public SectionAnalysisResult(String sectionName, boolean detected, String evidence, double confidence) {
            this.sectionName = sectionName;
            this.detected = detected;
            this.evidence = evidence;
            this.confidence = confidence;
        }

        public String getSectionName() { return sectionName; }
        public void setSectionName(String sectionName) { this.sectionName = sectionName; }

        public boolean isDetected() { return detected; }
        public void setDetected(boolean detected) { this.detected = detected; }

        public String getEvidence() { return evidence; }
        public void setEvidence(String evidence) { this.evidence = evidence; }

        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }

    public static class KeywordDensityResult {
        private String keyword;
        private boolean match;
        private int count;
        private double density;
        private String category;
        private List<String> aliases = new ArrayList<>();

        public KeywordDensityResult() {}
        public KeywordDensityResult(String keyword, boolean match, int count, double density, String category, List<String> aliases) {
            this.keyword = keyword;
            this.match = match;
            this.count = count;
            this.density = density;
            this.category = category;
            this.aliases = aliases;
        }

        public String getKeyword() { return keyword; }
        public void setKeyword(String keyword) { this.keyword = keyword; }

        public boolean isMatch() { return match; }
        public void setMatch(boolean match) { this.match = match; }

        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }

        public double getDensity() { return density; }
        public void setDensity(double density) { this.density = density; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public List<String> getAliases() { return aliases; }
        public void setAliases(List<String> aliases) { this.aliases = aliases; }
    }
}
