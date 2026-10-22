package com.careernavigator.dto;

import java.util.List;

public class InterviewRequests {

    public static class GenerateInterviewRequest {
        private String targetRole;
        private String branch;
        private String experienceLevel;
        private List<String> skills;
        private List<String> projects;
        private String resumeText;

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
    }

    public static class AnswerRequest {
        private String question;
        private String answer;

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }

        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }
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

        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
    }
}
