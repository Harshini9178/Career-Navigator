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
                Languages: JavaScript, TypeScript, Java, Python, SQL
                Frameworks: Spring Boot, React, Node.js, Express.js, REST APIs
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

    @Autowired
    private com.careernavigator.service.ResumeService resumeService;

    @Test
    void testScenario1_AllRelevantSectionsDetectedWithAliases() {
        String resumeWithAliases = """
                Jane Doe
                jane.doe@example.com | +1 555-0199 | github.com/janedoe | linkedin.com/in/janedoe
                
                PROFILE
                Results-oriented engineer with 4+ years of experience building scalable backend architectures.
                
                CORE COMPETENCIES
                Java, Spring Boot, PostgreSQL, Docker, AWS, Git, REST APIs, Microservices
                
                EMPLOYMENT HISTORY
                Senior Software Engineer | Acme Corp
                - Architected microservices handling 25k requests/second with 99.9% availability.
                - Reduced query response times by 40% through redis caching.
                
                ACADEMIC BACKGROUND
                Bachelor of Science in Computer Science, State University, 2020
                
                ACADEMIC PROJECTS
                Real-Time Chat Engine: Built WebSockets-based platform supporting 10,000 concurrent channels.
                
                LICENSES & CERTIFICATIONS
                AWS Certified Developer Associate
                """;

        ResumeAnalysisResponse response = atsScoringService.evaluateResume(resumeWithAliases, "jane.pdf", "Java Developer", null);

        assertThat(response.getDetectedSections()).contains(
                "Contact Information",
                "Professional Summary",
                "Technical Skills",
                "Work Experience / Internships",
                "Education",
                "Projects",
                "Certifications"
        );
        assertThat(response.getMissingSections()).isEmpty();
    }

    @Test
    void testScenario2_ContactDetailsWithoutHeadingNotMarkedMissing() {
        String resumeNoHeading = """
                Alex Smith
                alex.smith@gmail.com | (415) 555-2671 | linkedin.com/in/alexsmith | github.com/alexsmith
                
                SUMMARY
                Software engineer with experience in cloud architectures and full stack web development.
                
                SKILLS
                Java, Python, React, SQL
                
                EXPERIENCE
                Software Engineer | Global Tech (2022 - Present)
                - Developed RESTful microservices reducing latency by 20%.
                
                EDUCATION
                B.S. in Computer Science
                """;

        ResumeAnalysisResponse response = atsScoringService.evaluateResume(resumeNoHeading, "alex.pdf", "Software Engineer", null);

        assertThat(response.getDetectedSections()).contains("Contact Information");
        assertThat(response.getMissingSections()).doesNotContain("Contact Information");
    }

    @Test
    void testScenario3_KeywordDetection_JavaScript_TypeScript_Java_Python_React_HtmlCss() {
        String techResume = """
                Tech Specialist
                contact@tech.org | 555-0100
                
                SKILLS & TECHNOLOGIES
                Languages & Frameworks: JavaScript, TypeScript, Java, Python, React, HTML/CSS, C++, C#, .NET, Go, SQL.
                Cloud & Tools: Docker, Kubernetes, AWS, Git, CI/CD pipelines.
                
                EXPERIENCE
                Engineer at DevStudio
                - Implemented full stack web apps using React, TypeScript, and Java Spring Boot.
                - Authored Python data processing scripts and tuned SQL database queries.
                
                EDUCATION
                B.S. in Computer Science
                """;

        ResumeAnalysisResponse response = atsScoringService.evaluateResume(techResume, "tech.pdf", "Full Stack Engineer", null);

        var keywords = response.getKeywords();
        String[] expectedKeywords = {"JavaScript", "TypeScript", "Java", "Python", "React", "HTML/CSS", "C++", "C# / .NET", "Go", "SQL"};

        for (String expected : expectedKeywords) {
            boolean matched = keywords.stream().anyMatch(k -> k.getKeyword().equalsIgnoreCase(expected) && k.isMatch());
            assertThat(matched)
                    .as("Expected keyword '%s' to be detected in resume text", expected)
                    .isTrue();
        }
    }

    @Test
    void testScenario4_MissingRequiredSkillReportedWithEvidenceAndRecommendation() {
        String resumeWithoutSpringBoot = """
                Junior Coder
                junior@coder.com | 555-0199
                
                SUMMARY
                Backend developer experienced in Java programming language, SQL databases, Git version control, and REST APIs.
                
                WORK EXPERIENCE
                Junior Developer at Beta Labs
                - Built core Java applications and executed SQL queries.
                
                EDUCATION
                B.S. in Computer Science
                """;

        ResumeAnalysisResponse response = atsScoringService.evaluateResume(resumeWithoutSpringBoot, "junior.pdf", "Java Developer", null);

        boolean springBootMissing = response.getKeywords().stream()
                .anyMatch(k -> k.getKeyword().equalsIgnoreCase("Spring Boot") && !k.isMatch());
        assertThat(springBootMissing)
                .as("Spring Boot should be recognized as missing for Java Developer role")
                .isTrue();

        assertThat(response.getImprovementsToAdd())
                .as("Improvements should recommend adding missing relevant skills")
                .anyMatch(s -> s.contains("Spring Boot") || s.contains("Docker"));
    }

    @Test
    void testScenario5_DeterministicScoring_SameResumeTwiceProducesIdenticalScore() {
        String testResume = """
                Samantha Ray
                samantha@test.com | 555-9876 | github.com/samanthar
                
                SUMMARY
                Full Stack Developer with 3 years building web apps.
                
                SKILLS
                JavaScript, TypeScript, React, Node.js, SQL, Git, Docker
                
                EXPERIENCE
                Web Developer at Innovate LLC
                - Developed responsive React frontend with TypeScript.
                - Reduced page load time by 30% through code splitting.
                
                PROJECTS
                Task Manager: Built full-stack app with React and REST API.
                
                EDUCATION
                B.S. in Software Engineering
                """;

        ResumeAnalysisResponse run1 = atsScoringService.evaluateResume(testResume, "sam.pdf", "Full Stack Engineer", null);
        ResumeAnalysisResponse run2 = atsScoringService.evaluateResume(testResume, "sam.pdf", "Full Stack Engineer", null);

        assertThat(run1.getAtsScore()).isEqualTo(run2.getAtsScore());
        assertThat(run1.getMissingSections()).isEqualTo(run2.getMissingSections());
        assertThat(run1.getDetectedSections()).isEqualTo(run2.getDetectedSections());
        assertThat(run1.getWordCount()).isEqualTo(run2.getWordCount());
        assertThat(run1.getCategoryBreakdown().size()).isEqualTo(run2.getCategoryBreakdown().size());
        for (int i = 0; i < run1.getCategoryBreakdown().size(); i++) {
            assertThat(run1.getCategoryBreakdown().get(i).getScore())
                    .isEqualTo(run2.getCategoryBreakdown().get(i).getScore());
        }
    }

    @Test
    void testScenario6_RoleSpecificKeywordEvaluationChangesWithRole() {
        String pythonDataResume = """
                Data Specialist
                data@example.com | 555-4321 | github.com/datadev
                
                SUMMARY
                Data professional focused on data cleaning, analysis, SQL, visualization, and Python scripting.
                
                TECHNICAL SKILLS
                Python, SQL, Data Analysis, Data Visualization, Git, Linux
                
                WORK EXPERIENCE
                Analyst at Insights Corp
                - Processed 1M+ rows of customer data using SQL and Python.
                - Created interactive dashboards boosting reporting efficiency by 45%.
                
                EDUCATION
                B.S. in Statistics
                """;

        ResumeAnalysisResponse dataAnalystResult = atsScoringService.evaluateResume(pythonDataResume, "data.pdf", "Data Analyst", null);
        ResumeAnalysisResponse frontendResult = atsScoringService.evaluateResume(pythonDataResume, "data.pdf", "Frontend Developer", null);

        double dataSkillScore = dataAnalystResult.getCategoryBreakdown().stream()
                .filter(c -> c.getName().contains("Skills"))
                .mapToDouble(ResumeAnalysisResponse.ScoreCategoryBreakdown::getScore)
                .findFirst().orElse(0);

        double frontendSkillScore = frontendResult.getCategoryBreakdown().stream()
                .filter(c -> c.getName().contains("Skills"))
                .mapToDouble(ResumeAnalysisResponse.ScoreCategoryBreakdown::getScore)
                .findFirst().orElse(0);

        assertThat(dataSkillScore)
                .as("Data Analyst role score should be significantly higher for a data resume than Frontend role")
                .isGreaterThan(frontendSkillScore);
    }

    @Test
    void testScenario7_MateriallyDifferentResumesProduceDifferentScores() {
        String comprehensiveResume = """
                Dr. Alan Turing
                alan@crypto.org | +1 555-0100 | github.com/aturing | linkedin.com/in/aturing
                
                PROFESSIONAL SUMMARY
                Lead System Architect with 8+ years designing fault-tolerant distributed platforms.
                
                EDUCATION
                Ph.D. in Computer Science, Cambridge University
                
                TECHNICAL SKILLS
                Languages: Java, C++, Python, TypeScript, SQL
                Frameworks: Spring Boot, React, Kafka, Docker, Kubernetes, AWS, CI/CD
                
                EXPERIENCE
                Principal Engineer | Prime Tech (2020 - Present)
                - Architected multi-region cloud services handling 100k requests/sec with 99.999% SLA.
                - Reduced infrastructure costs by $1.2M annually by optimizing container clusters.
                - Led a team of 15 engineers across 4 timezones and increased release velocity by 50%.
                
                PROJECTS
                High-Frequency Trading Engine:
                - Sub-millisecond latency order routing platform processing 5M messages/sec.
                
                CERTIFICATIONS
                AWS Certified Solutions Architect Professional, Certified Kubernetes Administrator (CKA)
                """;

        String minimalResume = """
                Bob
                bob@mail.com
                
                SKILLS
                Java
                
                EXPERIENCE
                Worked on some code.
                """;

        ResumeAnalysisResponse richResult = atsScoringService.evaluateResume(comprehensiveResume, "alan.pdf", "Java Developer", null);
        ResumeAnalysisResponse minResult = atsScoringService.evaluateResume(minimalResume, "bob.pdf", "Java Developer", null);

        assertThat(richResult.getAtsScore())
                .as("Comprehensive resume must score significantly higher than minimal resume")
                .isGreaterThan(minResult.getAtsScore() + 25);
    }

    @Test
    void testScenario8_JobDescriptionSpecificMatchingReflectsText() {
        String candidateResume = """
                DevOps Engineer
                devops@cloud.net | 555-7788
                
                SKILLS
                Docker, Kubernetes, Linux, Git, Python, CI/CD
                
                EXPERIENCE
                DevOps Specialist at CloudFleet
                - Maintained Kubernetes clusters and automated CI/CD deployment pipelines.
                """;

        String jd = """
                Looking for a Senior DevOps Engineer.
                Must have: Docker, Kubernetes, Terraform, AWS, Prometheus, Grafana.
                """;

        ResumeAnalysisResponse response = atsScoringService.evaluateResume(candidateResume, "devops.pdf", "DevOps & Cloud Engineer", jd);

        assertThat(response.getJdMatchScore()).isNotNull();
        assertThat(response.getMatchedJDKeywords()).contains("Docker", "Kubernetes");
        assertThat(response.getMissingJDKeywords()).contains("Terraform", "AWS", "Prometheus");
    }

    @Test
    void testScenario9_EmptyOrCorruptedResumeThrowsValidationError() {
        org.junit.jupiter.api.Assertions.assertThrows(
                com.careernavigator.exception.ApiException.class,
                () -> resumeService.analyzeResumeText("", "empty.pdf", "Full Stack Engineer", null, null)
        );

        org.junit.jupiter.api.Assertions.assertThrows(
                com.careernavigator.exception.ApiException.class,
                () -> resumeService.analyzeResumeText("Too short", "short.pdf", "Full Stack Engineer", null, null)
        );
    }
}
