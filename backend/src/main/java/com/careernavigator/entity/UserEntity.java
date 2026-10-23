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

    @Lob
    @Column(name = "picture", length = 10485760)
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
    private String phone;

    @Column
    private Boolean emailVerified = true;

    @Column
    private String verificationToken;

    @Column
    private Long verificationTokenExpiresAt;

    @Column
    private String verificationCode;

    @Column
    private String createdAt;

    @Column
    private String cityState;

    @Column
    private String college;

    @Column
    private String degree;

    @Column
    private String graduationYear;

    @Column
    private String currentSemester;

    @Column
    private String linkedIn;

    @Column
    private String github;

    @Column
    private String portfolioWebsite;

    @Column
    private String preferredLocation;

    @Column
    private String workPreference;

    @Column
    private String expectedSalary;

    @Column
    private String employmentType;

    @Column
    private String targetCompanies;

    @Lob
    @Column(name = "skills_data_json", length = 1048576)
    private String skillsDataJson;

    @Lob
    @Column(name = "projects_data_json", length = 1048576)
    private String projectsDataJson;

    @Lob
    @Column(name = "education_data_json", length = 1048576)
    private String educationDataJson;

    @Lob
    @Column(name = "certifications_data_json", length = 1048576)
    private String certificationsDataJson;

    @Lob
    @Column(name = "experience_data_json", length = 1048576)
    private String experienceDataJson;

    @Lob
    @Column(name = "interview_preferences_json", length = 1048576)
    private String interviewPreferencesJson;

    public UserEntity() {}

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Boolean getEmailVerified() { return emailVerified != null ? emailVerified : true; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }

    public Long getVerificationTokenExpiresAt() { return verificationTokenExpiresAt; }
    public void setVerificationTokenExpiresAt(Long verificationTokenExpiresAt) { this.verificationTokenExpiresAt = verificationTokenExpiresAt; }

    public String getVerificationCode() { return verificationCode; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }

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
}
