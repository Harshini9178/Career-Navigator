package com.careernavigator.util;

import java.util.*;

public class RoleCatalog {

    public static class RoleProfile {
        private final String canonicalName;
        private final List<String> aliases;
        private final List<String> requiredSkills;
        private final List<String> preferredSkills;
        private final String description;

        public RoleProfile(
                String canonicalName,
                List<String> aliases,
                List<String> requiredSkills,
                List<String> preferredSkills,
                String description) {
            this.canonicalName = canonicalName;
            this.aliases = aliases != null ? aliases : Collections.emptyList();
            this.requiredSkills = requiredSkills != null ? requiredSkills : Collections.emptyList();
            this.preferredSkills = preferredSkills != null ? preferredSkills : Collections.emptyList();
            this.description = description;
        }

        public String getCanonicalName() { return canonicalName; }
        public List<String> getAliases() { return aliases; }
        public List<String> getRequiredSkills() { return requiredSkills; }
        public List<String> getPreferredSkills() { return preferredSkills; }
        public String getDescription() { return description; }

        public boolean matches(String roleInput) {
            if (roleInput == null || roleInput.isBlank()) return false;
            String lower = roleInput.trim().toLowerCase();
            if (lower.equals(canonicalName.toLowerCase())) return true;
            for (String alias : aliases) {
                if (lower.contains(alias.toLowerCase()) || alias.toLowerCase().contains(lower)) {
                    return true;
                }
            }
            return false;
        }
    }

    private static final List<RoleProfile> PROFILES = List.of(
            new RoleProfile(
                    "Full Stack Engineer",
                    List.of("full stack", "fullstack", "full stack developer", "full stack software engineer"),
                    List.of("JavaScript", "TypeScript", "React", "Node.js", "SQL", "REST APIs", "Git / GitHub"),
                    List.of("Docker", "HTML/CSS", "PostgreSQL", "MongoDB", "Express.js", "CI/CD", "AWS"),
                    "End-to-end web architecture, frontend UI, backend services, databases, and deployment"
            ),
            new RoleProfile(
                    "Frontend Developer",
                    List.of("frontend", "frontend developer", "frontend engineer", "front end", "ui engineer", "web developer"),
                    List.of("JavaScript", "TypeScript", "React", "HTML/CSS", "Git / GitHub", "REST APIs"),
                    List.of("Node.js", "Testing / QA", "CI/CD", "GraphQL"),
                    "Client-side user interfaces, reactive state management, responsive design, and web accessibility"
            ),
            new RoleProfile(
                    "Backend Developer",
                    List.of("backend", "backend developer", "backend engineer", "back end", "server engineer"),
                    List.of("Java", "Python", "Node.js", "SQL", "REST APIs", "Git / GitHub"),
                    List.of("Spring Boot", "Docker", "PostgreSQL", "MongoDB", "CI/CD", "AWS", "Kubernetes"),
                    "Server-side microservices, distributed data architecture, REST/gRPC APIs, and database optimization"
            ),
            new RoleProfile(
                    "Java Developer",
                    List.of("java developer", "java engineer", "java software engineer", "java backend", "java"),
                    List.of("Java", "Spring Boot", "SQL", "REST APIs", "Git / GitHub"),
                    List.of("PostgreSQL", "MySQL", "Docker", "CI/CD", "AWS", "Testing / QA", "Linux / Unix"),
                    "Enterprise Java development, Spring Boot microservices, ORM/JPA persistence, and robust API endpoints"
            ),
            new RoleProfile(
                    "Python Developer",
                    List.of("python developer", "python engineer", "python software engineer", "python backend", "python"),
                    List.of("Python", "SQL", "REST APIs", "Git / GitHub"),
                    List.of("Docker", "PostgreSQL", "MongoDB", "Data Analysis / Pandas", "CI/CD", "AWS", "Testing / QA"),
                    "Python application development, API microservices, asynchronous processing, and database integrations"
            ),
            new RoleProfile(
                    "General Software Engineer",
                    List.of("software engineer", "general software engineer", "sde", "software developer", "swe"),
                    List.of("Java", "Python", "C++", "TypeScript", "SQL", "REST APIs", "Git / GitHub"),
                    List.of("Docker", "CI/CD", "Linux / Unix", "Testing / QA", "AWS"),
                    "Core computer science foundations, algorithms, system design, object-oriented architecture, and testing"
            ),
            new RoleProfile(
                    "Data Analyst",
                    List.of("data analyst", "business intelligence", "bi analyst", "data analytics"),
                    List.of("SQL", "Python", "Data Analysis / Pandas", "Data Visualization"),
                    List.of("PostgreSQL", "MySQL", "Git / GitHub", "Machine Learning"),
                    "Data exploration, SQL querying, statistical data modeling, and reporting dashboard visualization"
            ),
            new RoleProfile(
                    "DevOps & Cloud Engineer",
                    List.of("devops", "cloud engineer", "devops engineer", "sre", "site reliability", "infrastructure"),
                    List.of("Docker", "Kubernetes", "CI/CD", "Git / GitHub", "AWS", "Linux / Unix"),
                    List.of("Google Cloud / GCP", "Python", "Go", "REST APIs"),
                    "Infrastructure as Code, container orchestration, automated delivery pipelines, and cloud observability"
            ),
            new RoleProfile(
                    "Mobile App Developer",
                    List.of("mobile", "mobile app developer", "mobile engineer", "ios", "android", "react native", "flutter"),
                    List.of("React", "JavaScript", "TypeScript", "REST APIs", "Git / GitHub"),
                    List.of("Node.js", "Testing / QA", "CI/CD", "HTML/CSS"),
                    "Cross-platform or native mobile client development, offline caching, and responsive mobile interfaces"
            ),
            new RoleProfile(
                    "Data Scientist / AI/ML Engineer",
                    List.of("data scientist", "ai", "machine learning", "ml engineer", "ai/ml", "deep learning"),
                    List.of("Python", "Machine Learning", "Data Analysis / Pandas", "SQL"),
                    List.of("Docker", "Git / GitHub", "Data Visualization", "AWS"),
                    "Predictive modeling, deep learning architectures, feature engineering, and MLOps deployment"
            ),
            new RoleProfile(
                    "Cybersecurity Engineer",
                    List.of("cybersecurity", "security", "security engineer", "infosec", "cyber security"),
                    List.of("Linux / Unix", "Python", "Git / GitHub", "REST APIs"),
                    List.of("C++", "AWS", "Docker", "CI/CD"),
                    "Security auditing, vulnerability management, secure coding standards, and threat modeling"
            ),
            new RoleProfile(
                    "Embedded Systems Engineer",
                    List.of("embedded", "embedded systems", "embedded engineer", "firmware", "iot"),
                    List.of("C++", "Linux / Unix", "Git / GitHub"),
                    List.of("Python", "Testing / QA", "CI/CD"),
                    "Low-level systems programming, real-time operating systems (RTOS), firmware development, and hardware interfaces"
            )
    );

    public static RoleProfile resolveProfile(String targetRole) {
        if (targetRole == null || targetRole.isBlank()) {
            return PROFILES.get(0); // Default to Full Stack Engineer
        }
        for (RoleProfile profile : PROFILES) {
            if (profile.matches(targetRole)) {
                return profile;
            }
        }
        return PROFILES.get(0); // Default to Full Stack Engineer
    }

    public static List<RoleProfile> getAllProfiles() {
        return PROFILES;
    }
}
