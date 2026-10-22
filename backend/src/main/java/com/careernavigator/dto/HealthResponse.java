package com.careernavigator.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class HealthResponse {

    private String status;
    private String version;
    private String timestamp;
    private String database;
    private Map<String, Object> memory;

    public HealthResponse() {}

    public HealthResponse(String status, String version, String timestamp, String database, Map<String, Object> memory) {
        this.status = status;
        this.version = version;
        this.timestamp = timestamp;
        this.database = database;
        this.memory = memory;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getDatabase() { return database; }
    public void setDatabase(String database) { this.database = database; }

    public Map<String, Object> getMemory() { return memory; }
    public void setMemory(Map<String, Object> memory) { this.memory = memory; }
}
