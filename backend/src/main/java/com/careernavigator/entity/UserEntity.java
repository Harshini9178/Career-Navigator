package com.careernavigator.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserEntity {

    @Id
    @Column(nullable = false, unique = true)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String name;

    @Column
    private String picture;

    @Column
    private String role; // student or admin

    @Column
    private String branch;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "skill")
    private List<String> skills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_projects", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "project")
    private List<String> projects = new ArrayList<>();

    @Column
    private String targetRole;

    @Column
    private String experienceLevel;

    @Column
    private Boolean completedProfile = false;

    @Column
    private String passwordHash;

    @Column
    private String createdAt;

    public UserEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }

    public String getRole() { return role != null ? role : "student"; }
    public void setRole(String role) { this.role = role; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills != null ? skills : new ArrayList<>(); }

    public List<String> getProjects() { return projects; }
    public void setProjects(List<String> projects) { this.projects = projects != null ? projects : new ArrayList<>(); }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public Boolean getCompletedProfile() { return completedProfile; }
    public void setCompletedProfile(Boolean completedProfile) { this.completedProfile = completedProfile; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
