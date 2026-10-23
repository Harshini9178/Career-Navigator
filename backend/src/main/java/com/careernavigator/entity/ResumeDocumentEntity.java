package com.careernavigator.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;

@Entity
@Table(name = "resume_documents")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResumeDocumentEntity {

    @Id
    @Column(nullable = false, unique = true)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String title;

    @Column
    private String targetRole;

    @Column
    private String templateId; // classic-ats, modern-pro, software-engineer, fresher-grad, experienced-pro, data-analyst, minimalist, executive

    @Column
    private Integer atsScore;

    @Lob
    @Column(name = "content_json", length = 1048576) // Up to 1MB JSON document
    private String contentJson;

    @Column
    private String createdAt;

    @Column
    private String updatedAt;

    public ResumeDocumentEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getTemplateId() { return templateId != null ? templateId : "classic-ats"; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }

    public Integer getAtsScore() { return atsScore != null ? atsScore : 0; }
    public void setAtsScore(Integer atsScore) { this.atsScore = atsScore; }

    public String getContentJson() { return contentJson; }
    public void setContentJson(String contentJson) { this.contentJson = contentJson; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
