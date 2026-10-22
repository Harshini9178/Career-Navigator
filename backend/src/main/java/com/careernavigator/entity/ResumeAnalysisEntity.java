package com.careernavigator.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resumes")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResumeAnalysisEntity {

    @Id
    @Column(nullable = false, unique = true)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column
    private String fileName;

    @Column
    private String uploadedAt;

    @Column
    private Integer atsScore;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_skills", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "skill")
    private List<String> skills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_missing_sections", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "section")
    private List<String> missingSections = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_suggestions", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "suggestion", length = 1000)
    private List<String> suggestions = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_grammar_issues", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "grammar_issue", length = 1000)
    private List<String> grammarIssues = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_improvements_add", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "improvement", length = 1000)
    private List<String> improvementsToAdd = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_improvements_remove", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "improvement", length = 1000)
    private List<String> improvementsToRemove = new ArrayList<>();

    @Lob
    @Column(name = "keywords_json", length = 65536)
    private String keywordsJson;

    @Column
    private Integer wordCount;

    @Column
    private String contentHash;

    @Column
    private String targetRole;

    @Column
    private Integer jdMatchScore;

    @Lob
    @Column(name = "job_description", length = 65536)
    private String jobDescription;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_matched_jd_keywords", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "keyword")
    private List<String> matchedJDKeywords = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_missing_jd_keywords", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "keyword")
    private List<String> missingJDKeywords = new ArrayList<>();

    @Lob
    @Column(name = "category_breakdown_json", length = 65536)
    private String categoryBreakdownJson;

    @Lob
    @Column(name = "section_details_json", length = 65536)
    private String sectionDetailsJson;

    public ResumeAnalysisEntity() {}

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

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills != null ? skills : new ArrayList<>(); }

    public List<String> getMissingSections() { return missingSections; }
    public void setMissingSections(List<String> missingSections) { this.missingSections = missingSections != null ? missingSections : new ArrayList<>(); }

    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions != null ? suggestions : new ArrayList<>(); }

    public List<String> getGrammarIssues() { return grammarIssues; }
    public void setGrammarIssues(List<String> grammarIssues) { this.grammarIssues = grammarIssues != null ? grammarIssues : new ArrayList<>(); }

    public List<String> getImprovementsToAdd() { return improvementsToAdd; }
    public void setImprovementsToAdd(List<String> improvementsToAdd) { this.improvementsToAdd = improvementsToAdd != null ? improvementsToAdd : new ArrayList<>(); }

    public List<String> getImprovementsToRemove() { return improvementsToRemove; }
    public void setImprovementsToRemove(List<String> improvementsToRemove) { this.improvementsToRemove = improvementsToRemove != null ? improvementsToRemove : new ArrayList<>(); }

    public String getKeywordsJson() { return keywordsJson; }
    public void setKeywordsJson(String keywordsJson) { this.keywordsJson = keywordsJson; }

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

    public List<String> getMatchedJDKeywords() { return matchedJDKeywords; }
    public void setMatchedJDKeywords(List<String> matchedJDKeywords) { this.matchedJDKeywords = matchedJDKeywords != null ? matchedJDKeywords : new ArrayList<>(); }

    public List<String> getMissingJDKeywords() { return missingJDKeywords; }
    public void setMissingJDKeywords(List<String> missingJDKeywords) { this.missingJDKeywords = missingJDKeywords != null ? missingJDKeywords : new ArrayList<>(); }

    public String getCategoryBreakdownJson() { return categoryBreakdownJson; }
    public void setCategoryBreakdownJson(String categoryBreakdownJson) { this.categoryBreakdownJson = categoryBreakdownJson; }

    public String getSectionDetailsJson() { return sectionDetailsJson; }
    public void setSectionDetailsJson(String sectionDetailsJson) { this.sectionDetailsJson = sectionDetailsJson; }
}
