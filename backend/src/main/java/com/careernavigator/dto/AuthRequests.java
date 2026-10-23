package com.careernavigator.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AuthRequests {

    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) {
            this.email = email != null ? email.trim() : null;
        }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        private String name;
        private String role;
        private String branch;
        private String targetRole;
        private String experienceLevel;
        private List<String> skills;
        private List<String> projects;
        private String phone;

        public String getEmail() { return email; }
        public void setEmail(String email) {
            this.email = email != null ? email.trim() : null;
        }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }

        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

        public String getExperienceLevel() { return experienceLevel; }
        public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

        public List<String> getSkills() { return skills != null ? skills : new java.util.ArrayList<>(); }
        
        @com.fasterxml.jackson.annotation.JsonSetter
        public void setSkills(Object skillsObj) {
            this.skills = ProfileUpdateRequest.parseStringOrList(skillsObj);
        }

        public List<String> getProjects() { return projects != null ? projects : new java.util.ArrayList<>(); }
        
        @com.fasterxml.jackson.annotation.JsonSetter
        public void setProjects(Object projectsObj) {
            this.projects = ProfileUpdateRequest.parseStringOrList(projectsObj);
        }

        public String getPhone() { return phone; }
        public void setPhone(String phone) {
            this.phone = phone != null ? phone.trim() : null;
        }
    }

    public static class SendOtpRequest {
        private String email;
        private String phone;
        private String identifier;

        public String getEmail() { return email; }
        public void setEmail(String email) {
            this.email = email != null ? email.trim() : null;
        }

        public String getPhone() { return phone; }
        public void setPhone(String phone) {
            this.phone = phone != null ? phone.trim() : null;
        }

        public String getIdentifier() {
            if (identifier != null && !identifier.isBlank()) return identifier.trim();
            if (email != null && !email.isBlank()) return email.trim();
            return phone != null ? phone.trim() : null;
        }
        public void setIdentifier(String identifier) {
            this.identifier = identifier != null ? identifier.trim() : null;
        }
    }

    public static class VerifyOtpRequest {
        private String email;
        private String phone;
        private String identifier;
        private String name;

        @NotBlank(message = "OTP code is required")
        private String otp;

        public String getEmail() { return email; }
        public void setEmail(String email) {
            this.email = email != null ? email.trim() : null;
        }

        public String getPhone() { return phone; }
        public void setPhone(String phone) {
            this.phone = phone != null ? phone.trim() : null;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getIdentifier() {
            if (identifier != null && !identifier.isBlank()) return identifier.trim();
            if (email != null && !email.isBlank()) return email.trim();
            return phone != null ? phone.trim() : null;
        }
        public void setIdentifier(String identifier) {
            this.identifier = identifier != null ? identifier.trim() : null;
        }

        public String getOtp() { return otp; }
        public void setOtp(String otp) {
            this.otp = otp != null ? otp.trim() : null;
        }
    }

    public static class VerifyEmailRequest {
        @NotBlank(message = "Email is required")
        private String email;

        private String token;
        private String code;

        public String getEmail() { return email; }
        public void setEmail(String email) {
            this.email = email != null ? email.trim() : null;
        }

        public String getToken() { return token; }
        public void setToken(String token) {
            this.token = token != null ? token.trim() : null;
        }

        public String getCode() { return code; }
        public void setCode(String code) {
            this.code = code != null ? code.trim() : null;
        }
    }

    public static class ResendVerificationRequest {
        @NotBlank(message = "Email is required")
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String email) {
            this.email = email != null ? email.trim() : null;
        }
    }

    public static class ResetPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "OTP is required")
        private String otp;

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String newPassword;

        public String getEmail() { return email; }
        public void setEmail(String email) {
            this.email = email != null ? email.trim() : null;
        }

        public String getOtp() { return otp; }
        public void setOtp(String otp) {
            this.otp = otp != null ? otp.trim() : null;
        }

        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class ProfileUpdateRequest {
        private String name;
        private String picture;
        private String phone;
        private String branch;
        private String targetRole;
        private String experienceLevel;
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
        private List<String> skills;
        private List<String> projects;
        private String skillsDataJson;
        private String projectsDataJson;
        private String educationDataJson;
        private String certificationsDataJson;
        private String experienceDataJson;
        private String interviewPreferencesJson;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getPicture() { return picture; }
        public void setPicture(String picture) { this.picture = picture; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }

        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

        public String getExperienceLevel() { return experienceLevel; }
        public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

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

        public List<String> getSkills() { return skills != null ? skills : new java.util.ArrayList<>(); }
        
        @com.fasterxml.jackson.annotation.JsonSetter
        public void setSkills(Object skillsObj) {
            this.skills = parseStringOrList(skillsObj);
        }

        public List<String> getProjects() { return projects != null ? projects : new java.util.ArrayList<>(); }
        
        @com.fasterxml.jackson.annotation.JsonSetter
        public void setProjects(Object projectsObj) {
            this.projects = parseStringOrList(projectsObj);
        }

        public static List<String> parseStringOrList(Object obj) {
            if (obj == null) return new java.util.ArrayList<>();
            if (obj instanceof List<?> list) {
                return list.stream().map(Object::toString).toList();
            }
            if (obj instanceof String str) {
                return java.util.Arrays.stream(str.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
            }
            return new java.util.ArrayList<>();
        }
    }
}
