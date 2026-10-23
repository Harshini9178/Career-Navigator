package com.careernavigator.dto;

import java.util.List;
import java.util.Map;

public class InterviewRequests {

    public static class GenerateInterviewRequest {
        private String targetRole;
        private String branch;
        private String experienceLevel;
        private List<String> skills;
        private List<String> projects;
        private String resumeText;
        private Integer questionCount;
        private List<String> categories;
        private Integer durationMinutes;
        private Integer prepTimerSeconds;
        private String selectedResumeId;
        private String selectedResumeName;
        private List<Map<String, Object>> structuredQuestions;

        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }

        public String getExperienceLevel() { return experienceLevel; }
        public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

        public List<String> getSkills() { return skills; }
        public void setSkills(List<String> skills) { this.skills = skills; }

        public List<String> getProjects() { return projects; }
        public void setProjects(List<String> projects) { this.projects = projects; }

        public String getResumeText() { return resumeText; }
        public void setResumeText(String resumeText) { this.resumeText = resumeText; }

        public Integer getQuestionCount() { return questionCount; }
        public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }

        public List<String> getCategories() { return categories; }
        public void setCategories(List<String> categories) { this.categories = categories; }

        public Integer getDurationMinutes() { return durationMinutes; }
        public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

        public Integer getPrepTimerSeconds() { return prepTimerSeconds; }
        public void setPrepTimerSeconds(Integer prepTimerSeconds) { this.prepTimerSeconds = prepTimerSeconds; }

        public String getSelectedResumeId() { return selectedResumeId; }
        public void setSelectedResumeId(String selectedResumeId) { this.selectedResumeId = selectedResumeId; }

        public String getSelectedResumeName() { return selectedResumeName; }
        public void setSelectedResumeName(String selectedResumeName) { this.selectedResumeName = selectedResumeName; }

        public List<Map<String, Object>> getStructuredQuestions() { return structuredQuestions; }
        public void setStructuredQuestions(List<Map<String, Object>> structuredQuestions) { this.structuredQuestions = structuredQuestions; }
    }

    public static class AnswerRequest {
        private String question;
        private String questionId;
        private String category;
        private String difficulty;
        private String answer;
        private String code;
        private String language;
        private Boolean skipped;
        private Integer wordsPerMinute;
        private Integer fillerWordCount;
        private Integer answerDurationSeconds;

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }

        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }

        public Boolean getSkipped() { return skipped; }
        public void setSkipped(Boolean skipped) { this.skipped = skipped; }

        public Integer getWordsPerMinute() { return wordsPerMinute; }
        public void setWordsPerMinute(Integer wordsPerMinute) { this.wordsPerMinute = wordsPerMinute; }

        public Integer getFillerWordCount() { return fillerWordCount; }
        public void setFillerWordCount(Integer fillerWordCount) { this.fillerWordCount = fillerWordCount; }

        public Integer getAnswerDurationSeconds() { return answerDurationSeconds; }
        public void setAnswerDurationSeconds(Integer answerDurationSeconds) { this.answerDurationSeconds = answerDurationSeconds; }
    }

    public static class CodeReviewRequest {
        private String code;
        private String language;
        private String problemStatement;

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }

        public String getProblemStatement() { return problemStatement; }
        public void setProblemStatement(String problemStatement) { this.problemStatement = problemStatement; }
    }

    public static class QuickAskRequest {
        private String query;
        private String question;

        public String getQuery() {
            if (query != null && !query.isBlank()) return query;
            return question;
        }
        public void setQuery(String query) { this.query = query; }

        public String getQuestion() {
            if (question != null && !question.isBlank()) return question;
            return query;
        }
        public void setQuestion(String question) { this.question = question; }
    }
}

