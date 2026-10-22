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
        public void setEmail(String email) { this.email = email; }

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

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

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

        public List<String> getSkills() { return skills; }
        public void setSkills(List<String> skills) { this.skills = skills; }

        public List<String> getProjects() { return projects; }
        public void setProjects(List<String> projects) { this.projects = projects; }
    }

    public static class SendOtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class VerifyOtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "OTP is required")
        private String otp;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
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
        public void setEmail(String email) { this.email = email; }

        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }

        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class ProfileUpdateRequest {
        private String name;
        private String picture;
        private String branch;
        private String targetRole;
        private String experienceLevel;
        private List<String> skills;
        private List<String> projects;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getPicture() { return picture; }
        public void setPicture(String picture) { this.picture = picture; }

        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }

        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

        public String getExperienceLevel() { return experienceLevel; }
        public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

        public List<String> getSkills() { return skills; }
        public void setSkills(List<String> skills) { this.skills = skills; }

        public List<String> getProjects() { return projects; }
        public void setProjects(List<String> projects) { this.projects = projects; }
    }
}
