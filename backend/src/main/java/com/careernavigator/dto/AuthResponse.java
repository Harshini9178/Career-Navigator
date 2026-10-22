package com.careernavigator.dto;

import com.careernavigator.entity.UserEntity;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String message;
    private UserDto user;
    private String token;

    public AuthResponse() {}

    public AuthResponse(String message, UserDto user, String token) {
        this.message = message;
        this.user = user;
        this.token = token;
    }

    public static AuthResponse of(String message, UserEntity entity, String token) {
        return new AuthResponse(message, UserDto.fromEntity(entity), token);
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

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
        private String createdAt;

        public static UserDto fromEntity(UserEntity u) {
            if (u == null) return null;
            UserDto dto = new UserDto();
            dto.setId(u.getId());
            dto.setEmail(u.getEmail());
            dto.setName(u.getName());
            dto.setPicture(u.getPicture());
            dto.setRole(u.getRole());
            dto.setBranch(u.getBranch());
            dto.setSkills(u.getSkills());
            dto.setProjects(u.getProjects());
            dto.setTargetRole(u.getTargetRole());
            dto.setExperienceLevel(u.getExperienceLevel());
            dto.setCompletedProfile(u.getCompletedProfile());
            dto.setCreatedAt(u.getCreatedAt());
            return dto;
        }

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
