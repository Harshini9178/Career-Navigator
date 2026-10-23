package com.careernavigator.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "templates")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResumeTemplateEntity {

    @Id
    @Column(nullable = false, unique = true)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column
    private String targetRole;

    @Column
    private Integer atsScore;

    @Column
    private Integer downloads;

    @Column
    private String category;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "template_tags", joinColumns = @JoinColumn(name = "template_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @Lob
    @Column(name = "sections_json", length = 65536)
    private String sectionsJson;

    public ResumeTemplateEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public Integer getAtsScore() { return atsScore; }
    public void setAtsScore(Integer atsScore) { this.atsScore = atsScore; }

    public Integer getDownloads() { return downloads; }
    public void setDownloads(Integer downloads) { this.downloads = downloads; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags != null ? tags : new ArrayList<>(); }

    public String getSectionsJson() { return sectionsJson; }
    public void setSectionsJson(String sectionsJson) { this.sectionsJson = sectionsJson; }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("downloadCount")
    public Integer getDownloadCount() {
        return downloads != null ? downloads : 0;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("fileContent")
    public String getFileContent() {
        return sectionsJson != null ? sectionsJson : "";
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("description")
    public String getDescription() {
        return category != null && !category.isBlank() ? category : "Standard ATS Resume Template";
    }
}
