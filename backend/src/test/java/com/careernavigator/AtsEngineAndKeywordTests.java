package com.careernavigator;

import com.careernavigator.dto.ResumeAnalysisResponse;
import com.careernavigator.service.AtsScoringService;
import com.careernavigator.util.KeywordCatalog;
import com.careernavigator.util.TextNormalizer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AtsEngineAndKeywordTests {

    @Autowired
    private AtsScoringService atsScoringService;

    @Test
    void testJavaVsJavaScriptKeywordBoundaryMatching() {
        // Test 14: Java versus JavaScript keyword matching
        String jsOnlyResume = "Full stack engineer experienced in JavaScript, React, and Node.js. Built high-traffic web applications.";
        var jsResults = KeywordCatalog.analyzeKeywords(jsOnlyResume);

        boolean jsMatched = jsResults.stream().anyMatch(k -> "JavaScript".equals(k.getKeyword()) && k.isMatch());
        boolean javaMatched = jsResults.stream().anyMatch(k -> "Java".equals(k.getKeyword()) && k.isMatch());

        assertThat(jsMatched).isTrue();
        assertThat(javaMatched).isFalse(); // JavaScript must NOT falsely trigger Java keyword!

        String javaOnlyResume = "Backend engineer specializing in Java enterprise systems, JVM profiling, and Spring Boot.";
        var javaResults = KeywordCatalog.analyzeKeywords(javaOnlyResume);

        boolean javaMatchedInJava = javaResults.stream().anyMatch(k -> "Java".equals(k.getKeyword()) && k.isMatch());
        boolean jsMatchedInJava = javaResults.stream().anyMatch(k -> "JavaScript".equals(k.getKeyword()) && k.isMatch());

        assertThat(javaMatchedInJava).isTrue();
        assertThat(jsMatchedInJava).isFalse();
    }

    @Test
    void testGoVsGoogleCloudKeywordBoundaryMatching() {
        // Test 15: Go versus Google Cloud keyword matching
        String googleCloudResume = "Cloud Architect certified in Google Cloud Platform (GCP). Familiar with Google infrastructure.";
        var gcpResults = KeywordCatalog.analyzeKeywords(googleCloudResume);

        boolean gcpMatched = gcpResults.stream().anyMatch(k -> "Google Cloud / GCP".equals(k.getKeyword()) && k.isMatch());
        boolean goMatched = gcpResults.stream().anyMatch(k -> "Go".equals(k.getKeyword()) && k.isMatch());

        assertThat(gcpMatched).isTrue();
        assertThat(goMatched).isFalse(); // "Google" must NOT trigger Go programming language!

        String golangResume = "Software Engineer building microservices using Golang and Go concurrent channels.";
        var goResults = KeywordCatalog.analyzeKeywords(golangResume);

        boolean goMatchedInGo = goResults.stream().anyMatch(k -> "Go".equals(k.getKeyword()) && k.isMatch());
        assertThat(goMatchedInGo).isTrue();
    }

    @Test
    void testMissingSectionDetection() {
        // Test 13: Missing-section detection
        String partialResume = """
                John Doe
                john@example.com
                
                TECHNICAL SKILLS
                Java, Python, SQL, Docker
                
                PROJECTS
                E-Commerce API: Built high performance service handling 10k rps.
                """;

        ResumeAnalysisResponse response = atsScoringService.evaluateResume(partialResume, "sample.txt", "Software Engineer", null);

        assertThat(response.getDetectedSections()).contains("Contact Information", "Technical Skills", "Projects");
        assertThat(response.getMissingSections()).contains("Education", "Work Experience / Internships", "Certifications");
    }

    @Test
    void testDynamicAtsScoringCalculation() {
        // Test 16: Dynamic ATS scoring
        String comprehensiveResume = """
                Jane Doe
                jane.doe@example.com | +1 555-0199 | github.com/janedoe | linkedin.com/in/janedoe
                
                PROFESSIONAL SUMMARY
                Results-oriented Software Engineer with 3+ years of experience designing robust distributed systems.
                
                EDUCATION
                Bachelor of Technology in Computer Science, State University, CGPA: 3.9
                
                TECHNICAL SKILLS
                Languages: Java, TypeScript, Python, SQL
                Frameworks: Spring Boot, React, Express.js
                DevOps: Docker, Kubernetes, AWS, Git
                
                PROJECTS
                Distributed Payment Gateway:
                - Architected microservices processing 50k transactions/sec with 99.99% uptime.
                - Reduced latency by 35% through Redis caching and PostgreSQL query optimization.
                
                WORK EXPERIENCE
                Senior Backend Developer | Tech Innovations Inc.
                - Engineered real-time event streaming pipeline using Kafka and Spring Cloud.
                - Mentored junior engineers and accelerated sprint velocity by 25%.
                
                CERTIFICATIONS
                AWS Certified Solutions Architect, Oracle Certified Java Professional
                """;

        ResumeAnalysisResponse response = atsScoringService.evaluateResume(comprehensiveResume, "jane.pdf", "Full Stack Developer", null);

        assertThat(response.getAtsScore()).isGreaterThanOrEqualTo(85);
        assertThat(response.getMissingSections()).isEmpty();
        assertThat(response.getCategoryBreakdown()).hasSize(6);
        assertThat(response.getWordCount()).isGreaterThan(80);
    }

    @Test
    void testJobDescriptionMatchingAndDiffing() {
        // Test 17: Job description matching
        String resume = """
                John Smith
                john@smith.io
                Full stack developer with skills in Java, React, Docker, and PostgreSQL.
                """;

        String jobDescription = """
                We are seeking a Backend Engineer with strong expertise in Java, Docker, Kubernetes, and AWS.
                """;

        ResumeAnalysisResponse response = atsScoringService.evaluateResume(resume, "john.pdf", "Backend Engineer", jobDescription);

        assertThat(response.getJdMatchScore()).isNotNull();
        assertThat(response.getMatchedJDKeywords()).contains("Java", "Docker");
        assertThat(response.getMissingJDKeywords()).contains("Kubernetes", "AWS");
    }

    @Test
    void testTextNormalizerCleansPunctuationAndDashes() {
        String dirty = "“Smart quotes” and ’apostrophes’ with em—dash and • bullet points \uFB01gure";
        String cleaned = TextNormalizer.normalizeResumeText(dirty);

        assertThat(cleaned).contains("\"Smart quotes\"");
        assertThat(cleaned).contains("'apostrophes'");
        assertThat(cleaned).contains("figure"); // Ligature \uFB01 replaced with "fi"
    }
}
