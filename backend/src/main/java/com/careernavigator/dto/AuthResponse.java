package com.careernavigator.dto;

import com.careernavigator.entity.UserEntity;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private boolean success = true;
    private String message;
    private UserDto user;
    private String token;
    private java.util.Map<String, Object> emailDelivery;

    public AuthResponse() {}

    public AuthResponse(String message, UserDto user, String token) {
        this.success = true;
        this.message = message;
        this.user = user;
        this.token = token;
    }

    public static AuthResponse of(String message, UserEntity entity, String token) {
        return new AuthResponse(message, UserDto.fromEntity(entity), token);
    }

    public boolean isSuccess() { return success; }
    public boolean getSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public java.util.Map<String, Object> getEmailDelivery() { return emailDelivery; }
    public void setEmailDelivery(java.util.Map<String, Object> emailDelivery) { this.emailDelivery = emailDelivery; }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserDto {
        private String id;
        private String email;
        private String name;
        private String picture;
        private String role;
        private String branch;
        private List<String> skills;
        private List<String> projects;
        private String targetRole;
        private String experienceLevel;
        private Boolean completedProfile;
        private String phone;
        private Boolean emailVerified;
        private String createdAt;
        private String cityState;
        private String college;
        private String degree;
        private String graduationYear;
        private String currentSemester;
        private String linkedIn;
        private String github;
        private String portfolioWebsite;
        private String preferredLocation;
        private String workPreference;
        private String expectedSalary;
        private String employmentType;
        private String targetCompanies;
        private String skillsDataJson;
        private String projectsDataJson;
        private String educationDataJson;
        private String certificationsDataJson;
        private String experienceDataJson;
        private String interviewPreferencesJson;

        public static UserDto fromEntity(UserEntity u) {
            if (u == null) return null;
            UserDto dto = new UserDto();
            dto.setId(u.getId());
            dto.setEmail(u.getEmail());
            dto.setName(u.getName());
            dto.setPicture(u.getPicture());
            dto.setRole(u.getRole());
            dto.setBranch(u.getBranch());
            dto.setSkills(u.getSkills() != null ? u.getSkills() : new java.util.ArrayList<>());
            dto.setProjects(u.getProjects() != null ? u.getProjects() : new java.util.ArrayList<>());
            dto.setTargetRole(u.getTargetRole());
            dto.setExperienceLevel(u.getExperienceLevel());
            dto.setCompletedProfile(u.getCompletedProfile());
            dto.setPhone(u.getPhone());
            dto.setEmailVerified(u.getEmailVerified());
            dto.setCreatedAt(u.getCreatedAt());
            dto.setCityState(u.getCityState());
            dto.setCollege(u.getCollege());
            dto.setDegree(u.getDegree());
            dto.setGraduationYear(u.getGraduationYear());
            dto.setCurrentSemester(u.getCurrentSemester());
            dto.setLinkedIn(u.getLinkedIn());
            dto.setGithub(u.getGithub());
            dto.setPortfolioWebsite(u.getPortfolioWebsite());
            dto.setPreferredLocation(u.getPreferredLocation());
            dto.setWorkPreference(u.getWorkPreference());
            dto.setExpectedSalary(u.getExpectedSalary());
            dto.setEmploymentType(u.getEmploymentType());
            dto.setTargetCompanies(u.getTargetCompanies());
            dto.setSkillsDataJson(u.getSkillsDataJson());
            dto.setProjectsDataJson(u.getProjectsDataJson());
            dto.setEducationDataJson(u.getEducationDataJson());
            dto.setCertificationsDataJson(u.getCertificationsDataJson());
            dto.setExperienceDataJson(u.getExperienceDataJson());
            dto.setInterviewPreferencesJson(u.getInterviewPreferencesJson());
            return dto;
        }

        public String getCityState() { return cityState; }
        public void setCityState(String cityState) { this.cityState = cityState; }

        public String getCollege() { return college; }
        public void setCollege(String college) { this.college = college; }

        public String getDegree() { return degree; }
        public void setDegree(String degree) { this.degree = degree; }

        public String getGraduationYear() { return graduationYear; }
        public void setGraduationYear(String graduationYear) { this.graduationYear = graduationYear; }

        public String getCurrentSemester() { return currentSemester; }
        public void setCurrentSemester(String currentSemester) { this.currentSemester = currentSemester; }

        public String getLinkedIn() { return linkedIn; }
        public void setLinkedIn(String linkedIn) { this.linkedIn = linkedIn; }

        public String getGithub() { return github; }
        public void setGithub(String github) { this.github = github; }

        public String getPortfolioWebsite() { return portfolioWebsite; }
        public void setPortfolioWebsite(String portfolioWebsite) { this.portfolioWebsite = portfolioWebsite; }

        public String getPreferredLocation() { return preferredLocation; }
        public void setPreferredLocation(String preferredLocation) { this.preferredLocation = preferredLocation; }

        public String getWorkPreference() { return workPreference; }
        public void setWorkPreference(String workPreference) { this.workPreference = workPreference; }

        public String getExpectedSalary() { return expectedSalary; }
        public void setExpectedSalary(String expectedSalary) { this.expectedSalary = expectedSalary; }

        public String getEmploymentType() { return employmentType; }
        public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

        public String getTargetCompanies() { return targetCompanies; }
        public void setTargetCompanies(String targetCompanies) { this.targetCompanies = targetCompanies; }

        public String getSkillsDataJson() { return skillsDataJson; }
        public void setSkillsDataJson(String skillsDataJson) { this.skillsDataJson = skillsDataJson; }

        public String getProjectsDataJson() { return projectsDataJson; }
        public void setProjectsDataJson(String projectsDataJson) { this.projectsDataJson = projectsDataJson; }

        public String getEducationDataJson() { return educationDataJson; }
        public void setEducationDataJson(String educationDataJson) { this.educationDataJson = educationDataJson; }

        public String getCertificationsDataJson() { return certificationsDataJson; }
        public void setCertificationsDataJson(String certificationsDataJson) { this.certificationsDataJson = certificationsDataJson; }

        public String getExperienceDataJson() { return experienceDataJson; }
        public void setExperienceDataJson(String experienceDataJson) { this.experienceDataJson = experienceDataJson; }

        public String getInterviewPreferencesJson() { return interviewPreferencesJson; }
        public void setInterviewPreferencesJson(String interviewPreferencesJson) { this.interviewPreferencesJson = interviewPreferencesJson; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public Boolean getEmailVerified() { return emailVerified; }
        public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getPicture() { return picture; }
        public void setPicture(String picture) { this.picture = picture; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }

        public List<String> getSkills() { return skills; }
        public void setSkills(List<String> skills) { this.skills = skills; }

        public List<String> getProjects() { return projects; }
        public void setProjects(List<String> projects) { this.projects = projects; }

        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

        public String getExperienceLevel() { return experienceLevel; }
        public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

        public Boolean getCompletedProfile() { return completedProfile; }
        public void setCompletedProfile(Boolean completedProfile) { this.completedProfile = completedProfile; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }
}
