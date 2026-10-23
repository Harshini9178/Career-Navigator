package com.careernavigator.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ResumeBuilderDto {

    public static class FlexibleStringDeserializer extends JsonDeserializer<String> {
        @Override
        public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            if (p.currentToken() == JsonToken.START_ARRAY) {
                List<String> list = new ArrayList<>();
                while (p.nextToken() != JsonToken.END_ARRAY) {
                    list.add(p.getValueAsString());
                }
                return String.join("\n", list);
            }
            return p.getValueAsString();
        }
    }

    public static class FlexibleListDeserializer extends JsonDeserializer<List<String>> {
        @Override
        public List<String> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            if (p.currentToken() == JsonToken.START_ARRAY) {
                List<String> list = new ArrayList<>();
                while (p.nextToken() != JsonToken.END_ARRAY) {
                    list.add(p.getValueAsString());
                }
                return list;
            } else if (p.currentToken() == JsonToken.VALUE_STRING) {
                String val = p.getValueAsString();
                if (val == null || val.isBlank()) return new ArrayList<>();
                List<String> list = new ArrayList<>();
                for (String part : val.split("\\r?\\n")) {
                    if (!part.isBlank()) list.add(part.trim());
                }
                return list;
            }
            return new ArrayList<>();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PersonalInfo {
        private String fullName = "";
        private String headline = "";
        private String email = "";
        private String phone = "";
        private String cityCountry = "";
        private String linkedIn = "";
        private String github = "";
        private String portfolioWebsite = "";

        public PersonalInfo() {}

        public String getFullName() { return fullName != null ? fullName : ""; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getHeadline() { return headline != null ? headline : ""; }
        public void setHeadline(String headline) { this.headline = headline; }
        public String getEmail() { return email != null ? email : ""; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone != null ? phone : ""; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getCityCountry() { return cityCountry != null ? cityCountry : ""; }
        public void setCityCountry(String cityCountry) { this.cityCountry = cityCountry; }
        public String getLinkedIn() { return linkedIn != null ? linkedIn : ""; }
        public void setLinkedIn(String linkedIn) { this.linkedIn = linkedIn; }
        public String getGithub() { return github != null ? github : ""; }
        public void setGithub(String github) { this.github = github; }
        public String getPortfolioWebsite() { return portfolioWebsite != null ? portfolioWebsite : ""; }
        public void setPortfolioWebsite(String portfolioWebsite) { this.portfolioWebsite = portfolioWebsite; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class EducationItem {
        private String id;
        private String institution = "";
        private String degree = "";
        private String fieldOfStudy = "";
        private String startDate = "";
        private String graduationDate = "";
        private String gradeCgpa = "";
        @JsonDeserialize(using = FlexibleStringDeserializer.class)
        private String coursework = "";

        public EducationItem() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getInstitution() { return institution != null ? institution : ""; }
        public void setInstitution(String institution) { this.institution = institution; }
        public String getDegree() { return degree != null ? degree : ""; }
        public void setDegree(String degree) { this.degree = degree; }
        public String getFieldOfStudy() { return fieldOfStudy != null ? fieldOfStudy : ""; }
        public void setFieldOfStudy(String fieldOfStudy) { this.fieldOfStudy = fieldOfStudy; }
        public String getStartDate() { return startDate != null ? startDate : ""; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getGraduationDate() { return graduationDate != null ? graduationDate : ""; }
        public void setGraduationDate(String graduationDate) { this.graduationDate = graduationDate; }
        public String getGradeCgpa() { return gradeCgpa != null ? gradeCgpa : ""; }
        public void setGradeCgpa(String gradeCgpa) { this.gradeCgpa = gradeCgpa; }
        public String getCoursework() { return coursework != null ? coursework : ""; }
        public void setCoursework(Object coursework) {
            if (coursework instanceof List<?> list) {
                this.coursework = String.join(", ", list.stream().map(Object::toString).toList());
            } else if (coursework != null) {
                this.coursework = coursework.toString();
            }
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class WorkExperienceItem {
        private String id;
        private String jobTitle = "";
        private String company = "";
        private String location = "";
        private String startDate = "";
        private String endDate = "";
        private boolean currentRole;
        private String responsibilities = "";
        private String achievements = "";
        private String impact = "";
        private List<String> bullets = new ArrayList<>();

        public WorkExperienceItem() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getJobTitle() { return jobTitle != null ? jobTitle : ""; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
        public String getCompany() { return company != null ? company : ""; }
        public void setCompany(String company) { this.company = company; }
        public String getLocation() { return location != null ? location : ""; }
        public void setLocation(String location) { this.location = location; }
        public String getStartDate() { return startDate != null ? startDate : ""; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate != null ? endDate : ""; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public boolean isCurrentRole() { return currentRole; }
        public void setCurrentRole(boolean currentRole) { this.currentRole = currentRole; }
        public String getResponsibilities() { return responsibilities != null ? responsibilities : ""; }
        public void setResponsibilities(Object val) {
            if (val instanceof List<?> list) {
                this.responsibilities = String.join("\n", list.stream().map(Object::toString).toList());
                if (this.bullets == null || this.bullets.isEmpty()) {
                    this.bullets = list.stream().map(Object::toString).toList();
                }
            } else if (val != null) {
                this.responsibilities = val.toString();
            }
        }
        public String getAchievements() { return achievements != null ? achievements : ""; }
        public void setAchievements(Object val) {
            if (val instanceof List<?> list) {
                this.achievements = String.join("\n", list.stream().map(Object::toString).toList());
            } else if (val != null) {
                this.achievements = val.toString();
            }
        }
        public String getImpact() { return impact != null ? impact : ""; }
        public void setImpact(Object val) {
            if (val instanceof List<?> list) {
                this.impact = String.join("\n", list.stream().map(Object::toString).toList());
            } else if (val != null) {
                this.impact = val.toString();
            }
        }
        public List<String> getBullets() { return bullets != null ? bullets : new ArrayList<>(); }
        public void setBullets(Object val) {
            if (val instanceof List<?> list) {
                this.bullets = list.stream().map(Object::toString).toList();
            } else if (val != null) {
                this.bullets = List.of(val.toString().split("\\r?\\n"));
            }
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SkillsData {
        @JsonDeserialize(using = FlexibleListDeserializer.class)
        private List<String> programmingLanguages = new ArrayList<>();
        @JsonDeserialize(using = FlexibleListDeserializer.class)
        private List<String> frameworks = new ArrayList<>();
        @JsonDeserialize(using = FlexibleListDeserializer.class)
        private List<String> databases = new ArrayList<>();
        @JsonDeserialize(using = FlexibleListDeserializer.class)
        private List<String> toolsPlatforms = new ArrayList<>();
        @JsonDeserialize(using = FlexibleListDeserializer.class)
        private List<String> coreConcepts = new ArrayList<>();
        @JsonDeserialize(using = FlexibleListDeserializer.class)
        private List<String> communicationLeadership = new ArrayList<>();

        public SkillsData() {}

        public List<String> getProgrammingLanguages() { return programmingLanguages != null ? programmingLanguages : new ArrayList<>(); }
        public void setProgrammingLanguages(List<String> programmingLanguages) { this.programmingLanguages = programmingLanguages; }
        public List<String> getFrameworks() { return frameworks != null ? frameworks : new ArrayList<>(); }
        public void setFrameworks(List<String> frameworks) { this.frameworks = frameworks; }
        public List<String> getDatabases() { return databases != null ? databases : new ArrayList<>(); }
        public void setDatabases(List<String> databases) { this.databases = databases; }
        public List<String> getToolsPlatforms() { return toolsPlatforms != null ? toolsPlatforms : new ArrayList<>(); }
        public void setToolsPlatforms(List<String> toolsPlatforms) { this.toolsPlatforms = toolsPlatforms; }
        public List<String> getCoreConcepts() { return coreConcepts != null ? coreConcepts : new ArrayList<>(); }
        public void setCoreConcepts(List<String> coreConcepts) { this.coreConcepts = coreConcepts; }
        public List<String> getCommunicationLeadership() { return communicationLeadership != null ? communicationLeadership : new ArrayList<>(); }
        public void setCommunicationLeadership(List<String> communicationLeadership) { this.communicationLeadership = communicationLeadership; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProjectItem {
        private String id;
        private String title = "";
        private String description = "";
        @JsonDeserialize(using = FlexibleListDeserializer.class)
        private List<String> technologies = new ArrayList<>();
        @JsonDeserialize(using = FlexibleStringDeserializer.class)
        private String keyContributions = "";
        @JsonDeserialize(using = FlexibleStringDeserializer.class)
        private String resultsImpact = "";
        private String githubUrl = "";
        private String liveUrl = "";

        public ProjectItem() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTitle() { return title != null ? title : ""; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description != null ? description : ""; }
        public void setDescription(String description) { this.description = description; }
        public List<String> getTechnologies() { return technologies != null ? technologies : new ArrayList<>(); }
        public void setTechnologies(List<String> technologies) { this.technologies = technologies; }
        public String getKeyContributions() { return keyContributions != null ? keyContributions : ""; }
        public void setKeyContributions(Object val) {
            if (val instanceof List<?> list) {
                this.keyContributions = String.join("\n", list.stream().map(Object::toString).toList());
            } else if (val != null) {
                this.keyContributions = val.toString();
            }
        }
        public String getResultsImpact() { return resultsImpact != null ? resultsImpact : ""; }
        public void setResultsImpact(Object val) {
            if (val instanceof List<?> list) {
                this.resultsImpact = String.join("\n", list.stream().map(Object::toString).toList());
            } else if (val != null) {
                this.resultsImpact = val.toString();
            }
        }
        public String getGithubUrl() { return githubUrl != null ? githubUrl : ""; }
        public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
        public String getLiveUrl() { return liveUrl != null ? liveUrl : ""; }
        public void setLiveUrl(String liveUrl) { this.liveUrl = liveUrl; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CertificationItem {
        private String id;
        private String name = "";
        private String issuingOrganization = "";
        private String issueDate = "";
        private String credentialUrl = "";
        private String type = "certification"; // certification, award, hackathon, academic

        public CertificationItem() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name != null ? name : ""; }
        public void setName(String name) { this.name = name; }
        public String getIssuingOrganization() { return issuingOrganization != null ? issuingOrganization : ""; }
        public void setIssuingOrganization(String issuingOrganization) { this.issuingOrganization = issuingOrganization; }
        public String getIssueDate() { return issueDate != null ? issueDate : ""; }
        public void setIssueDate(String issueDate) { this.issueDate = issueDate; }
        public String getCredentialUrl() { return credentialUrl != null ? credentialUrl : ""; }
        public void setCredentialUrl(String credentialUrl) { this.credentialUrl = credentialUrl; }
        public String getType() { return type != null ? type : "certification"; }
        public void setType(String type) { this.type = type; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CustomSectionItem {
        private String id;
        private String heading = "";
        private List<String> items = new ArrayList<>();

        public CustomSectionItem() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getHeading() { return heading != null ? heading : ""; }
        public void setHeading(String heading) { this.heading = heading; }
        public List<String> getItems() { return items != null ? items : new ArrayList<>(); }
        public void setItems(List<String> items) { this.items = items; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AdditionalSections {
        private List<String> publications = new ArrayList<>();
        private List<String> volunteerExperience = new ArrayList<>();
        private List<String> leadership = new ArrayList<>();
        private List<String> languages = new ArrayList<>();
        private List<String> interests = new ArrayList<>();
        private List<CustomSectionItem> customSections = new ArrayList<>();

        public AdditionalSections() {}

        public List<String> getPublications() { return publications != null ? publications : new ArrayList<>(); }
        public void setPublications(List<String> publications) { this.publications = publications; }
        public List<String> getVolunteerExperience() { return volunteerExperience != null ? volunteerExperience : new ArrayList<>(); }
        public void setVolunteerExperience(List<String> volunteerExperience) { this.volunteerExperience = volunteerExperience; }
        public List<String> getLeadership() { return leadership != null ? leadership : new ArrayList<>(); }
        public void setLeadership(List<String> leadership) { this.leadership = leadership; }
        public List<String> getLanguages() { return languages != null ? languages : new ArrayList<>(); }
        public void setLanguages(List<String> languages) { this.languages = languages; }
        public List<String> getInterests() { return interests != null ? interests : new ArrayList<>(); }
        public void setInterests(List<String> interests) { this.interests = interests; }
        public List<CustomSectionItem> getCustomSections() { return customSections != null ? customSections : new ArrayList<>(); }
        public void setCustomSections(List<CustomSectionItem> customSections) { this.customSections = customSections; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResumeContent {
        private PersonalInfo personalInfo = new PersonalInfo();
        private String summary = "";
        private List<EducationItem> education = new ArrayList<>();
        private SkillsData skills = new SkillsData();
        private List<WorkExperienceItem> experience = new ArrayList<>();
        private List<ProjectItem> projects = new ArrayList<>();
        private List<CertificationItem> certifications = new ArrayList<>();
        private AdditionalSections additionalSections = new AdditionalSections();

        public ResumeContent() {}

        public PersonalInfo getPersonalInfo() { return personalInfo != null ? personalInfo : new PersonalInfo(); }
        public void setPersonalInfo(PersonalInfo personalInfo) { this.personalInfo = personalInfo; }
        public String getSummary() { return summary != null ? summary : ""; }
        public void setSummary(String summary) { this.summary = summary; }
        public List<EducationItem> getEducation() { return education != null ? education : new ArrayList<>(); }
        public void setEducation(List<EducationItem> education) { this.education = education; }
        public SkillsData getSkills() { return skills != null ? skills : new SkillsData(); }
        public void setSkills(SkillsData skills) { this.skills = skills; }
        public List<WorkExperienceItem> getExperience() { return experience != null ? experience : new ArrayList<>(); }
        public void setExperience(List<WorkExperienceItem> experience) { this.experience = experience; }
        public List<ProjectItem> getProjects() { return projects != null ? projects : new ArrayList<>(); }
        public void setProjects(List<ProjectItem> projects) { this.projects = projects; }
        public List<CertificationItem> getCertifications() { return certifications != null ? certifications : new ArrayList<>(); }
        public void setCertifications(List<CertificationItem> certifications) { this.certifications = certifications; }
        public AdditionalSections getAdditionalSections() { return additionalSections != null ? additionalSections : new AdditionalSections(); }
        public void setAdditionalSections(AdditionalSections additionalSections) { this.additionalSections = additionalSections; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResumeDocumentResponse {
        private String id;
        private String userId;
        private String title;
        private String targetRole;
        private String templateId;
        private Integer atsScore;
        private ResumeContent content;
        private String createdAt;
        private String updatedAt;

        public ResumeDocumentResponse() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public String getTemplateId() { return templateId; }
        public void setTemplateId(String templateId) { this.templateId = templateId; }
        public Integer getAtsScore() { return atsScore; }
        public void setAtsScore(Integer atsScore) { this.atsScore = atsScore; }
        public ResumeContent getContent() { return content; }
        public void setContent(ResumeContent content) { this.content = content; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResumeCreateRequest {
        private String title;
        private String targetRole;
        private String templateId;
        private ResumeContent content;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public String getTemplateId() { return templateId; }
        public void setTemplateId(String templateId) { this.templateId = templateId; }
        public ResumeContent getContent() { return content; }
        public void setContent(ResumeContent content) { this.content = content; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResumeUpdateRequest {
        private String title;
        private String targetRole;
        private String templateId;
        private ResumeContent content;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public String getTemplateId() { return templateId; }
        public void setTemplateId(String templateId) { this.templateId = templateId; }
        public ResumeContent getContent() { return content; }
        public void setContent(ResumeContent content) { this.content = content; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AtsCheckCategory {
        private String name;
        private int score;
        private int maxScore;
        private String status; // passed, warning, missing
        private String explanation;

        public AtsCheckCategory() {}
        public AtsCheckCategory(String name, int score, int maxScore, String status, String explanation) {
            this.name = name;
            this.score = score;
            this.maxScore = maxScore;
            this.status = status;
            this.explanation = explanation;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        public int getMaxScore() { return maxScore; }
        public void setMaxScore(int maxScore) { this.maxScore = maxScore; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AtsCheckResponse {
        private int overallScore;
        private List<AtsCheckCategory> categoryScores = new ArrayList<>();
        private List<String> passedChecks = new ArrayList<>();
        private List<String> warnings = new ArrayList<>();
        private List<String> missingInfo = new ArrayList<>();
        private List<String> improvementSuggestions = new ArrayList<>();

        public int getOverallScore() { return overallScore; }
        public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
        public List<AtsCheckCategory> getCategoryScores() { return categoryScores; }
        public void setCategoryScores(List<AtsCheckCategory> categoryScores) { this.categoryScores = categoryScores; }
        public List<String> getPassedChecks() { return passedChecks; }
        public void setPassedChecks(List<String> passedChecks) { this.passedChecks = passedChecks; }
        public List<String> getWarnings() { return warnings; }
        public void setWarnings(List<String> warnings) { this.warnings = warnings; }
        public List<String> getMissingInfo() { return missingInfo; }
        public void setMissingInfo(List<String> missingInfo) { this.missingInfo = missingInfo; }
        public List<String> getImprovementSuggestions() { return improvementSuggestions; }
        public void setImprovementSuggestions(List<String> improvementSuggestions) { this.improvementSuggestions = improvementSuggestions; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class JobMatchRequest {
        private String targetRole;
        private String jobDescription;
        private ResumeContent content;

        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public String getJobDescription() { return jobDescription; }
        public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }
        public ResumeContent getContent() { return content; }
        public void setContent(ResumeContent content) { this.content = content; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class JobMatchResponse {
        private int matchPercentage;
        private List<String> matchedKeywords = new ArrayList<>();
        private List<String> missingKeywords = new ArrayList<>();
        private List<String> matchedSkills = new ArrayList<>();
        private List<String> experienceRelevance = new ArrayList<>();
        private List<String> phrasingSuggestions = new ArrayList<>();

        public int getMatchPercentage() { return matchPercentage; }
        public void setMatchPercentage(int matchPercentage) { this.matchPercentage = matchPercentage; }
        public List<String> getMatchedKeywords() { return matchedKeywords; }
        public void setMatchedKeywords(List<String> matchedKeywords) { this.matchedKeywords = matchedKeywords; }
        public List<String> getMissingKeywords() { return missingKeywords; }
        public void setMissingKeywords(List<String> missingKeywords) { this.missingKeywords = missingKeywords; }
        public List<String> getMatchedSkills() { return matchedSkills; }
        public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }
        public List<String> getExperienceRelevance() { return experienceRelevance; }
        public void setExperienceRelevance(List<String> experienceRelevance) { this.experienceRelevance = experienceRelevance; }
        public List<String> getPhrasingSuggestions() { return phrasingSuggestions; }
        public void setPhrasingSuggestions(List<String> phrasingSuggestions) { this.phrasingSuggestions = phrasingSuggestions; }
    }
}
