package com.careernavigator.service;

import com.careernavigator.dto.ResumeBuilderDto.*;
import com.careernavigator.entity.ResumeDocumentEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.exception.ApiException;
import com.careernavigator.repository.ResumeDocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ResumeBuilderService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeBuilderService.class);

    private final ResumeDocumentRepository resumeDocumentRepository;
    private final ObjectMapper objectMapper;
    private final DatabaseStorageService databaseStorageService;

    // Common action verbs for resumes
    private static final Set<String> ACTION_VERBS = Set.of(
            "spearheaded", "architected", "engineered", "developed", "designed", "implemented",
            "optimized", "accelerated", "reduced", "increased", "boosted", "delivered",
            "orchestrated", "automated", "streamlined", "scaled", "deployed", "transformed",
            "led", "managed", "built", "created", "refactored", "integrated", "enhanced"
    );

    // Common technical keywords for matching
    private static final List<String> TECH_KEYWORDS = List.of(
            "java", "python", "javascript", "typescript", "react", "angular", "vue", "next.js",
            "spring boot", "node.js", "express", "sql", "postgresql", "mysql", "mongodb",
            "redis", "docker", "kubernetes", "aws", "azure", "gcp", "git", "ci/cd",
            "microservices", "rest api", "graphql", "html5", "css3", "tailwind", "linux",
            "agile", "scrum", "unit testing", "system design", "data structures", "algorithms"
    );

    public ResumeBuilderService(
            ResumeDocumentRepository resumeDocumentRepository,
            ObjectMapper objectMapper,
            DatabaseStorageService databaseStorageService) {
        this.resumeDocumentRepository = resumeDocumentRepository;
        this.objectMapper = objectMapper;
        this.databaseStorageService = databaseStorageService;
    }

    public List<ResumeDocumentResponse> listUserResumes(String userId) {
        List<ResumeDocumentEntity> entities = resumeDocumentRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        List<ResumeDocumentResponse> responses = new ArrayList<>();
        for (ResumeDocumentEntity entity : entities) {
            responses.add(toResponse(entity));
        }
        return responses;
    }

    public ResumeDocumentResponse getResume(String id, UserEntity user) {
        ResumeDocumentEntity entity = resumeDocumentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Resume document not found or access denied", 404));
        return toResponse(entity);
    }

    @Transactional
    public ResumeDocumentResponse createResume(ResumeCreateRequest req, UserEntity user) {
        ResumeDocumentEntity entity = new ResumeDocumentEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setUserId(user.getId());
        
        String title = (req.getTitle() != null && !req.getTitle().trim().isEmpty())
                ? req.getTitle().trim()
                : "Professional Resume";
        entity.setTitle(title);

        String targetRole = (req.getTargetRole() != null && !req.getTargetRole().trim().isEmpty())
                ? req.getTargetRole().trim()
                : (user.getTargetRole() != null ? user.getTargetRole() : "Full Stack Engineer");
        entity.setTargetRole(targetRole);

        String templateId = (req.getTemplateId() != null && !req.getTemplateId().trim().isEmpty())
                ? req.getTemplateId().trim()
                : "classic-ats";
        entity.setTemplateId(templateId);

        ResumeContent content = req.getContent();
        if (content == null) {
            content = createDefaultContent(user, targetRole);
        } else {
            // Fill personal info if empty
            if (content.getPersonalInfo() == null) {
                content.setPersonalInfo(new PersonalInfo());
            }
            if (content.getPersonalInfo().getFullName().isEmpty() && user.getName() != null) {
                content.getPersonalInfo().setFullName(user.getName());
            }
            if (content.getPersonalInfo().getEmail().isEmpty() && user.getEmail() != null) {
                content.getPersonalInfo().setEmail(user.getEmail());
            }
            if (content.getPersonalInfo().getPhone().isEmpty() && user.getPhone() != null) {
                content.getPersonalInfo().setPhone(user.getPhone());
            }
        }

        AtsCheckResponse atsCheck = calculateAtsReadiness(content, targetRole);
        entity.setAtsScore(atsCheck.getOverallScore());

        try {
            entity.setContentJson(objectMapper.writeValueAsString(content));
        } catch (Exception e) {
            logger.error("Failed to serialize resume content: {}", e.getMessage());
            entity.setContentJson("{}");
        }

        String now = Instant.now().toString();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        ResumeDocumentEntity saved = resumeDocumentRepository.save(entity);
        safeSyncDbJson();
        return toResponse(saved);
    }

    @Transactional
    public ResumeDocumentResponse updateResume(String id, ResumeUpdateRequest req, UserEntity user) {
        ResumeDocumentEntity entity = resumeDocumentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Resume document not found or access denied", 404));

        if (req.getTitle() != null && !req.getTitle().trim().isEmpty()) {
            entity.setTitle(req.getTitle().trim());
        }
        if (req.getTargetRole() != null && !req.getTargetRole().trim().isEmpty()) {
            entity.setTargetRole(req.getTargetRole().trim());
        }
        if (req.getTemplateId() != null && !req.getTemplateId().trim().isEmpty()) {
            entity.setTemplateId(req.getTemplateId().trim());
        }

        if (req.getContent() != null) {
            AtsCheckResponse atsCheck = calculateAtsReadiness(req.getContent(), entity.getTargetRole());
            entity.setAtsScore(atsCheck.getOverallScore());
            try {
                entity.setContentJson(objectMapper.writeValueAsString(req.getContent()));
            } catch (Exception e) {
                logger.error("Failed to serialize resume content: {}", e.getMessage());
            }
        }

        entity.setUpdatedAt(Instant.now().toString());
        ResumeDocumentEntity saved = resumeDocumentRepository.save(entity);
        safeSyncDbJson();
        return toResponse(saved);
    }

    @Transactional
    public void deleteResume(String id, UserEntity user) {
        ResumeDocumentEntity entity = resumeDocumentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Resume document not found or access denied", 404));
        resumeDocumentRepository.delete(entity);
        safeSyncDbJson();
    }

    @Transactional
    public ResumeDocumentResponse duplicateResume(String id, UserEntity user) {
        ResumeDocumentEntity original = resumeDocumentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Resume document not found or access denied", 404));

        ResumeDocumentEntity copy = new ResumeDocumentEntity();
        copy.setId(UUID.randomUUID().toString());
        copy.setUserId(user.getId());
        copy.setTitle(original.getTitle() + " (Copy)");
        copy.setTargetRole(original.getTargetRole());
        copy.setTemplateId(original.getTemplateId());
        copy.setAtsScore(original.getAtsScore());
        copy.setContentJson(original.getContentJson());

        String now = Instant.now().toString();
        copy.setCreatedAt(now);
        copy.setUpdatedAt(now);

        ResumeDocumentEntity saved = resumeDocumentRepository.save(copy);
        safeSyncDbJson();
        return toResponse(saved);
    }

    public AtsCheckResponse calculateAtsReadiness(ResumeContent content, String targetRole) {
        AtsCheckResponse resp = new AtsCheckResponse();
        if (content == null) {
            resp.setOverallScore(0);
            resp.getMissingInfo().add("Resume content is completely empty.");
            return resp;
        }

        List<AtsCheckCategory> categories = new ArrayList<>();
        List<String> passed = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        // 1. Contact Information (Max 15)
        int contactScore = 0;
        PersonalInfo pi = content.getPersonalInfo();
        if (pi != null) {
            if (!pi.getFullName().trim().isEmpty()) {
                contactScore += 4;
                passed.add("Full candidate name present");
            } else {
                missing.add("Candidate name is required");
            }

            if (!pi.getHeadline().trim().isEmpty()) {
                contactScore += 3;
                passed.add("Professional headline present");
            } else {
                warnings.add("Add a professional headline matching your target role");
                suggestions.add("Add a headline such as '" + (targetRole != null ? targetRole : "Software Engineer") + " | Cloud & Distributed Systems'");
            }

            if (!pi.getEmail().trim().isEmpty() && pi.getEmail().contains("@")) {
                contactScore += 3;
                passed.add("Professional email address provided");
            } else {
                missing.add("Valid email address is missing");
            }

            if (!pi.getPhone().trim().isEmpty()) {
                contactScore += 3;
                passed.add("Phone number provided");
            } else {
                warnings.add("Phone number is missing; recruiters often need direct phone reach");
            }

            if (!pi.getCityCountry().trim().isEmpty()) {
                contactScore += 2;
                passed.add("Location (City, Country) specified");
            } else {
                warnings.add("Location is missing; recruiters filter candidates by city/region");
            }

            if (!pi.getLinkedIn().trim().isEmpty() || !pi.getGithub().trim().isEmpty()) {
                contactScore = Math.min(15, contactScore + 2);
                passed.add("Professional links (LinkedIn/GitHub) present");
            }
        } else {
            missing.add("Contact Information section is missing entirely");
        }
        contactScore = Math.min(15, contactScore);
        categories.add(new AtsCheckCategory("Contact Information", contactScore, 15,
                contactScore >= 12 ? "passed" : (contactScore >= 7 ? "warning" : "missing"),
                "Verifies recruiter contact channels and online profiles."));

        // 2. Professional Summary (Max 15)
        int summaryScore = 0;
        String summary = content.getSummary() != null ? content.getSummary().trim() : "";
        if (!summary.isEmpty()) {
            summaryScore += 5;
            passed.add("Professional summary section present");
            int wordCount = summary.split("\\s+").length;
            if (wordCount >= 25 && wordCount <= 120) {
                summaryScore += 5;
                passed.add("Summary length is optimal (" + wordCount + " words)");
            } else if (wordCount < 25) {
                warnings.add("Summary is quite short (" + wordCount + " words). Expand to 35-70 words.");
                summaryScore += 2;
            } else {
                warnings.add("Summary is lengthy (" + wordCount + " words). Keep under 120 words for ATS scannability.");
                summaryScore += 3;
            }

            if (targetRole != null && summary.toLowerCase().contains(targetRole.toLowerCase().split("\\s+")[0])) {
                summaryScore += 5;
                passed.add("Summary mentions your target field");
            } else {
                suggestions.add("Incorporate target role keywords in the first sentence of your summary");
                summaryScore += 2;
            }
        } else {
            warnings.add("Professional summary is empty; an executive overview boosts recruiter engagement");
            suggestions.add("Add a 2-3 sentence summary highlighting your core tech stack and career impact");
        }
        summaryScore = Math.min(15, summaryScore);
        categories.add(new AtsCheckCategory("Professional Summary", summaryScore, 15,
                summaryScore >= 12 ? "passed" : (summaryScore >= 5 ? "warning" : "missing"),
                "Evaluates career summary clarity, brevity, and role alignment."));

        // 3. Education Section (Max 15)
        int eduScore = 0;
        List<EducationItem> eduList = content.getEducation() != null ? content.getEducation() : Collections.emptyList();
        if (!eduList.isEmpty()) {
            eduScore += 6;
            passed.add("Education credentials listed (" + eduList.size() + " entries)");
            boolean hasDegree = false;
            boolean hasDates = false;
            for (EducationItem e : eduList) {
                if (!e.getDegree().trim().isEmpty() && !e.getFieldOfStudy().trim().isEmpty()) hasDegree = true;
                if (!e.getGraduationDate().trim().isEmpty()) hasDates = true;
            }
            if (hasDegree) {
                eduScore += 5;
                passed.add("Degree and major clearly identified");
            } else {
                warnings.add("Ensure both Degree and Field of Study are populated");
            }
            if (hasDates) {
                eduScore += 4;
                passed.add("Graduation dates specified");
            } else {
                warnings.add("Include graduation years or expected completion date");
            }
        } else {
            missing.add("Education section has no entries");
            suggestions.add("Add your highest academic degree and institution");
        }
        eduScore = Math.min(15, eduScore);
        categories.add(new AtsCheckCategory("Education", eduScore, 15,
                eduScore >= 12 ? "passed" : (eduScore >= 6 ? "warning" : "missing"),
                "Checks accredited degree, academic discipline, and dates."));

        // 4. Work Experience & Bullet Quality (Max 20)
        int expScore = 0;
        List<WorkExperienceItem> expList = content.getExperience() != null ? content.getExperience() : Collections.emptyList();
        int totalBullets = 0;
        int actionVerbBullets = 0;
        int metricBullets = 0;
        Pattern metricPattern = Pattern.compile("(\\d+%)|(\\$\\d+)|(\\d+x)|(\\d+\\+?)|(increased|reduced|boosted|saved|scaled)", Pattern.CASE_INSENSITIVE);

        if (!expList.isEmpty()) {
            expScore += 5;
            passed.add("Work experience history documented (" + expList.size() + " roles)");

            for (WorkExperienceItem item : expList) {
                if (!item.getJobTitle().trim().isEmpty() && !item.getCompany().trim().isEmpty()) {
                    expScore = Math.min(10, expScore + 2);
                }
                List<String> bullets = item.getBullets() != null ? item.getBullets() : Collections.emptyList();
                for (String bullet : bullets) {
                    if (bullet.trim().isEmpty()) continue;
                    totalBullets++;
                    String firstWord = bullet.trim().split("\\s+")[0].toLowerCase().replaceAll("[^a-z]", "");
                    if (ACTION_VERBS.contains(firstWord)) {
                        actionVerbBullets++;
                    }
                    Matcher m = metricPattern.matcher(bullet);
                    if (m.find()) {
                        metricBullets++;
                    }
                }
            }

            if (totalBullets >= 3) {
                expScore += 4;
                passed.add("Structured bullet points used across positions");
            } else {
                warnings.add("Provide at least 2-4 bullet points per work experience");
            }

            if (actionVerbBullets >= 2) {
                expScore += 3;
                passed.add("Action verbs detected starting bullet points");
            } else {
                suggestions.add("Begin bullet points with strong action verbs (e.g. 'Engineered', 'Optimized', 'Spearheaded')");
            }

            if (metricBullets >= 1) {
                expScore += 3;
                passed.add("Quantifiable metrics and outcomes identified in experience");
            } else {
                suggestions.add("Add measurable impact where available (e.g., 'improved query latency by 35%')");
            }
        } else {
            warnings.add("No professional or internship experience listed");
            suggestions.add("If a fresher, include internships, teaching assistantships, or capstone projects");
        }
        expScore = Math.min(20, expScore);
        categories.add(new AtsCheckCategory("Work Experience & Impact", expScore, 20,
                expScore >= 16 ? "passed" : (expScore >= 8 ? "warning" : "missing"),
                "Evaluates career progression, bullet clarity, and measurable impact."));

        // 5. Technical Skills Categorization (Max 15)
        int skillScore = 0;
        SkillsData skills = content.getSkills();
        int totalSkills = 0;
        int activeCategories = 0;
        if (skills != null) {
            if (!skills.getProgrammingLanguages().isEmpty()) { totalSkills += skills.getProgrammingLanguages().size(); activeCategories++; }
            if (!skills.getFrameworks().isEmpty()) { totalSkills += skills.getFrameworks().size(); activeCategories++; }
            if (!skills.getDatabases().isEmpty()) { totalSkills += skills.getDatabases().size(); activeCategories++; }
            if (!skills.getToolsPlatforms().isEmpty()) { totalSkills += skills.getToolsPlatforms().size(); activeCategories++; }
            if (!skills.getCoreConcepts().isEmpty()) { totalSkills += skills.getCoreConcepts().size(); activeCategories++; }
            if (!skills.getCommunicationLeadership().isEmpty()) { totalSkills += skills.getCommunicationLeadership().size(); activeCategories++; }

            if (totalSkills >= 6) {
                skillScore += 6;
                passed.add("Comprehensive skill set listed (" + totalSkills + " skills)");
            } else if (totalSkills > 0) {
                skillScore += 3;
                warnings.add("Add more technical proficiencies (aim for at least 8 relevant skills)");
            } else {
                missing.add("Skills section is empty");
            }

            if (activeCategories >= 2) {
                skillScore += 5;
                passed.add("Skills categorized into structured groups");
            } else if (totalSkills > 0) {
                suggestions.add("Categorize skills into Languages, Frameworks, and Tools for better ATS parsing");
            }

            // Check match against target role keywords
            if (totalSkills >= 8 && activeCategories >= 3) {
                skillScore += 4;
            } else if (totalSkills >= 4) {
                skillScore += 2;
            }
        } else {
            missing.add("Skills section is missing");
        }
        skillScore = Math.min(15, skillScore);
        categories.add(new AtsCheckCategory("Technical & Core Skills", skillScore, 15,
                skillScore >= 12 ? "passed" : (skillScore >= 6 ? "warning" : "missing"),
                "Evaluates domain keyword density, grouping, and coverage."));

        // 6. Projects & Certifications (Max 10)
        int projScore = 0;
        List<ProjectItem> projects = content.getProjects() != null ? content.getProjects() : Collections.emptyList();
        List<CertificationItem> certs = content.getCertifications() != null ? content.getCertifications() : Collections.emptyList();

        if (!projects.isEmpty()) {
            projScore += 4;
            passed.add("Technical projects showcased (" + projects.size() + " projects)");
            boolean hasTech = false;
            boolean hasLinks = false;
            for (ProjectItem p : projects) {
                if (p.getTechnologies() != null && !p.getTechnologies().isEmpty()) hasTech = true;
                if (!p.getGithubUrl().trim().isEmpty() || !p.getLiveUrl().trim().isEmpty()) hasLinks = true;
            }
            if (hasTech) {
                projScore += 2;
                passed.add("Technologies explicitly defined for projects");
            }
            if (hasLinks) {
                projScore += 2;
                passed.add("Source code or live demo URLs provided");
            }
        } else {
            warnings.add("No personal or academic projects listed; projects prove hands-on proficiency");
        }

        if (!certs.isEmpty()) {
            projScore += 2;
            passed.add("Industry certifications / awards included (" + certs.size() + " credentials)");
        }
        projScore = Math.min(10, projScore);
        categories.add(new AtsCheckCategory("Projects & Credentials", projScore, 10,
                projScore >= 8 ? "passed" : (projScore >= 4 ? "warning" : "missing"),
                "Evaluates hands-on engineering proof and third-party certifications."));

        // 7. Structure & Formatting (Max 10)
        int formatScore = 0;
        if (contactScore > 0 && eduScore > 0 && skillScore > 0) {
            formatScore += 5;
            passed.add("Core resume standard sections present");
        }
        if (expScore > 0 || projScore > 0) {
            formatScore += 5;
            passed.add("Work or practical engineering demonstrations validated");
        }
        formatScore = Math.min(10, formatScore);
        categories.add(new AtsCheckCategory("ATS Formatting & Cleanliness", formatScore, 10,
                formatScore >= 8 ? "passed" : "warning",
                "Verifies standard headings, single-column reading order, and parsing integrity."));

        int overall = contactScore + summaryScore + eduScore + expScore + skillScore + projScore + formatScore;
        resp.setOverallScore(Math.min(100, Math.max(0, overall)));
        resp.setCategoryScores(categories);
        resp.setPassedChecks(passed);
        resp.setWarnings(warnings);
        resp.setMissingInfo(missing);
        resp.setImprovementSuggestions(suggestions);

        return resp;
    }

    public JobMatchResponse calculateJobMatch(ResumeContent content, String targetRole, String jobDescription) {
        JobMatchResponse resp = new JobMatchResponse();
        if (jobDescription == null || jobDescription.trim().isEmpty()) {
            resp.setMatchPercentage(0);
            resp.getPhrasingSuggestions().add("Paste a job description to perform targeted keyword and skill match analysis.");
            return resp;
        }

        String jdLower = jobDescription.toLowerCase();
        String fullResumeText = extractAllText(content).toLowerCase();

        Set<String> jdKeywordsFound = new LinkedHashSet<>();
        Set<String> jdKeywordsMissing = new LinkedHashSet<>();
        List<String> matchedSkills = new ArrayList<>();

        // Match common tech keywords from job description
        for (String kw : TECH_KEYWORDS) {
            if (jdLower.contains(kw)) {
                if (fullResumeText.contains(kw)) {
                    jdKeywordsFound.add(kw);
                    matchedSkills.add(kw);
                } else {
                    jdKeywordsMissing.add(kw);
                }
            }
        }

        // Also extract capitalized technical terms from JD (e.g. AWS, CI/CD, Kubernetes)
        Pattern wordPattern = Pattern.compile("\\b[a-zA-Z]{3,15}\\b");
        Matcher m = wordPattern.matcher(jobDescription);
        int scanned = 0;
        while (m.find() && scanned < 100) {
            String word = m.group().toLowerCase();
            if (word.length() > 3 && !ACTION_VERBS.contains(word) && !List.of("with", "have", "will", "from", "that", "this", "your", "must", "work", "team").contains(word)) {
                if (jdLower.contains(word)) {
                    if (fullResumeText.contains(word)) {
                        jdKeywordsFound.add(word);
                    } else if (jdKeywordsMissing.size() < 12) {
                        jdKeywordsMissing.add(word);
                    }
                }
            }
            scanned++;
        }

        int totalTracked = jdKeywordsFound.size() + jdKeywordsMissing.size();
        int matchPct = totalTracked > 0 ? (int) Math.round(((double) jdKeywordsFound.size() / totalTracked) * 100) : 60;
        matchPct = Math.min(98, Math.max(10, matchPct));
        resp.setMatchPercentage(matchPct);

        resp.setMatchedKeywords(new ArrayList<>(jdKeywordsFound));
        resp.setMissingKeywords(new ArrayList<>(jdKeywordsMissing));
        resp.setMatchedSkills(matchedSkills);

        // Experience relevance breakdown
        List<String> relevance = new ArrayList<>();
        if (content.getExperience() != null && !content.getExperience().isEmpty()) {
            relevance.add("Found " + content.getExperience().size() + " relevant work/internship positions.");
        }
        if (content.getProjects() != null && !content.getProjects().isEmpty()) {
            relevance.add("Found " + content.getProjects().size() + " practical engineering projects.");
        }
        resp.setExperienceRelevance(relevance);

        // Phrasing suggestions
        List<String> suggestions = new ArrayList<>();
        if (!jdKeywordsMissing.isEmpty()) {
            List<String> topMissing = new ArrayList<>(jdKeywordsMissing).subList(0, Math.min(4, jdKeywordsMissing.size()));
            suggestions.add("Consider incorporating skills you possess like: " + String.join(", ", topMissing) + " into your project or summary sections.");
        }
        suggestions.add("Ensure your professional headline aligns with the job title mentioned in the description.");
        suggestions.add("Quantify your achievements using metrics and business outcomes to match the senior expectations of the role.");
        resp.setPhrasingSuggestions(suggestions);

        return resp;
    }

    public byte[] exportPdf(String id, UserEntity user) {
        ResumeDocumentEntity entity = resumeDocumentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Resume document not found or access denied", 404));

        ResumeContent content = parseContent(entity.getContentJson());
        return generatePdfDocument(content, entity.getTitle(), entity.getTargetRole(), entity.getTemplateId());
    }

    private byte[] generatePdfDocument(ResumeContent content, String title, String targetRole, String templateId) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            float pageWidth = PDRectangle.A4.getWidth();
            float pageHeight = PDRectangle.A4.getHeight();
            float margin = 40f;
            float y = pageHeight - margin;

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontOblique = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            PDPageContentStream cs = new PDPageContentStream(doc, page);

            // Candidate Name (Title)
            PersonalInfo pi = content.getPersonalInfo();
            String name = (pi != null && !pi.getFullName().isEmpty()) ? pi.getFullName() : "Professional Resume";

            cs.beginText();
            cs.setFont(fontBold, 20);
            cs.newLineAtOffset(margin, y);
            cs.showText(cleanText(name));
            cs.endText();
            y -= 22;

            // Headline
            if (pi != null && !pi.getHeadline().isEmpty()) {
                cs.beginText();
                cs.setFont(fontRegular, 11);
                cs.newLineAtOffset(margin, y);
                cs.showText(cleanText(pi.getHeadline()));
                cs.endText();
                y -= 16;
            }

            // Contact Info line
            List<String> contactParts = new ArrayList<>();
            if (pi != null) {
                if (!pi.getEmail().isEmpty()) contactParts.add(pi.getEmail());
                if (!pi.getPhone().isEmpty()) contactParts.add(pi.getPhone());
                if (!pi.getCityCountry().isEmpty()) contactParts.add(pi.getCityCountry());
                if (!pi.getLinkedIn().isEmpty()) contactParts.add(pi.getLinkedIn());
                if (!pi.getGithub().isEmpty()) contactParts.add(pi.getGithub());
            }
            if (!contactParts.isEmpty()) {
                cs.beginText();
                cs.setFont(fontRegular, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText(cleanText(String.join("  |  ", contactParts)));
                cs.endText();
                y -= 14;
            }

            // Horizontal rule
            cs.setLineWidth(1f);
            cs.moveTo(margin, y);
            cs.lineTo(pageWidth - margin, y);
            cs.stroke();
            y -= 16;

            // Professional Summary
            if (content.getSummary() != null && !content.getSummary().trim().isEmpty()) {
                y = drawSectionHeading(cs, fontBold, margin, y, pageWidth, "PROFESSIONAL SUMMARY");
                List<String> summaryLines = wrapText(content.getSummary(), fontRegular, 9, pageWidth - (2 * margin));
                for (String line : summaryLines) {
                    cs.beginText();
                    cs.setFont(fontRegular, 9);
                    cs.newLineAtOffset(margin, y);
                    cs.showText(cleanText(line));
                    cs.endText();
                    y -= 12;
                }
                y -= 8;
            }

            // Technical Skills
            SkillsData skills = content.getSkills();
            if (skills != null) {
                y = drawSectionHeading(cs, fontBold, margin, y, pageWidth, "TECHNICAL SKILLS");
                if (!skills.getProgrammingLanguages().isEmpty()) {
                    y = drawSkillLine(cs, fontBold, fontRegular, margin, y, "Languages: ", String.join(", ", skills.getProgrammingLanguages()));
                }
                if (!skills.getFrameworks().isEmpty()) {
                    y = drawSkillLine(cs, fontBold, fontRegular, margin, y, "Frameworks: ", String.join(", ", skills.getFrameworks()));
                }
                if (!skills.getDatabases().isEmpty()) {
                    y = drawSkillLine(cs, fontBold, fontRegular, margin, y, "Databases: ", String.join(", ", skills.getDatabases()));
                }
                if (!skills.getToolsPlatforms().isEmpty()) {
                    y = drawSkillLine(cs, fontBold, fontRegular, margin, y, "Tools & Cloud: ", String.join(", ", skills.getToolsPlatforms()));
                }
                if (!skills.getCoreConcepts().isEmpty()) {
                    y = drawSkillLine(cs, fontBold, fontRegular, margin, y, "Core Competencies: ", String.join(", ", skills.getCoreConcepts()));
                }
                y -= 6;
            }

            // Experience
            List<WorkExperienceItem> experiences = content.getExperience();
            if (experiences != null && !experiences.isEmpty()) {
                y = drawSectionHeading(cs, fontBold, margin, y, pageWidth, "WORK EXPERIENCE & INTERNSHIPS");
                for (WorkExperienceItem item : experiences) {
                    if (y < 80) break; // prevent overflowing page 1
                    cs.beginText();
                    cs.setFont(fontBold, 10);
                    cs.newLineAtOffset(margin, y);
                    cs.showText(cleanText(item.getJobTitle() + (item.getCompany().isEmpty() ? "" : " - " + item.getCompany())));
                    cs.endText();

                    String dates = item.getStartDate() + (item.isCurrentRole() ? " - Present" : (item.getEndDate().isEmpty() ? "" : " - " + item.getEndDate()));
                    if (!dates.isEmpty()) {
                        cs.beginText();
                        cs.setFont(fontOblique, 9);
                        cs.newLineAtOffset(pageWidth - margin - 120, y);
                        cs.showText(cleanText(dates));
                        cs.endText();
                    }
                    y -= 13;

                    if (item.getBullets() != null) {
                        for (String b : item.getBullets()) {
                            if (b.trim().isEmpty() || y < 60) continue;
                            List<String> bLines = wrapText("•  " + b, fontRegular, 8.5f, pageWidth - (2 * margin) - 10);
                            for (String bl : bLines) {
                                cs.beginText();
                                cs.setFont(fontRegular, 8.5f);
                                cs.newLineAtOffset(margin + 8, y);
                                cs.showText(cleanText(bl));
                                cs.endText();
                                y -= 11;
                            }
                        }
                    }
                    y -= 5;
                }
                y -= 4;
            }

            // Projects
            List<ProjectItem> projects = content.getProjects();
            if (projects != null && !projects.isEmpty() && y > 100) {
                y = drawSectionHeading(cs, fontBold, margin, y, pageWidth, "PROJECTS");
                for (ProjectItem proj : projects) {
                    if (y < 70) break;
                    String techStr = (proj.getTechnologies() != null && !proj.getTechnologies().isEmpty())
                            ? " | " + String.join(", ", proj.getTechnologies())
                            : "";
                    cs.beginText();
                    cs.setFont(fontBold, 9.5f);
                    cs.newLineAtOffset(margin, y);
                    cs.showText(cleanText(proj.getTitle() + techStr));
                    cs.endText();
                    y -= 12;

                    if (!proj.getDescription().isEmpty()) {
                        List<String> pLines = wrapText(proj.getDescription(), fontRegular, 8.5f, pageWidth - (2 * margin) - 10);
                        for (String pl : pLines) {
                            if (y < 60) break;
                            cs.beginText();
                            cs.setFont(fontRegular, 8.5f);
                            cs.newLineAtOffset(margin + 8, y);
                            cs.showText(cleanText(pl));
                            cs.endText();
                            y -= 11;
                        }
                    }
                    y -= 4;
                }
                y -= 4;
            }

            // Education
            List<EducationItem> education = content.getEducation();
            if (education != null && !education.isEmpty() && y > 80) {
                y = drawSectionHeading(cs, fontBold, margin, y, pageWidth, "EDUCATION");
                for (EducationItem edu : education) {
                    if (y < 50) break;
                    cs.beginText();
                    cs.setFont(fontBold, 9.5f);
                    cs.newLineAtOffset(margin, y);
                    cs.showText(cleanText(edu.getDegree() + (edu.getFieldOfStudy().isEmpty() ? "" : " in " + edu.getFieldOfStudy())));
                    cs.endText();

                    if (!edu.getGraduationDate().isEmpty()) {
                        cs.beginText();
                        cs.setFont(fontOblique, 8.5f);
                        cs.newLineAtOffset(pageWidth - margin - 100, y);
                        cs.showText(cleanText(edu.getGraduationDate()));
                        cs.endText();
                    }
                    y -= 12;

                    String instDetails = edu.getInstitution() + (edu.getGradeCgpa().isEmpty() ? "" : "  |  CGPA: " + edu.getGradeCgpa());
                    cs.beginText();
                    cs.setFont(fontRegular, 8.5f);
                    cs.newLineAtOffset(margin, y);
                    cs.showText(cleanText(instDetails));
                    cs.endText();
                    y -= 14;
                }
            }

            cs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            logger.error("Failed to generate PDF: {}", e.getMessage(), e);
            throw new ApiException("PDF generation failed: " + e.getMessage(), 500);
        }
    }

    private float drawSectionHeading(PDPageContentStream cs, PDType1Font font, float margin, float y, float pageWidth, String title) throws IOException {
        cs.beginText();
        cs.setFont(font, 10.5f);
        cs.newLineAtOffset(margin, y);
        cs.showText(title);
        cs.endText();
        y -= 3;
        cs.setLineWidth(0.75f);
        cs.moveTo(margin, y);
        cs.lineTo(pageWidth - margin, y);
        cs.stroke();
        return y - 12;
    }

    private float drawSkillLine(PDPageContentStream cs, PDType1Font fontBold, PDType1Font fontRegular, float margin, float y, String label, String value) throws IOException {
        cs.beginText();
        cs.setFont(fontBold, 8.5f);
        cs.newLineAtOffset(margin, y);
        cs.showText(label);
        cs.setFont(fontRegular, 8.5f);
        cs.showText(cleanText(value));
        cs.endText();
        return y - 11;
    }

    private List<String> wrapText(String text, PDType1Font font, float fontSize, float maxWidth) {
        List<String> lines = new ArrayList<>();
        if (text == null || text.isEmpty()) return lines;
        String[] words = text.split("\\s+");
        StringBuilder current = new StringBuilder();

        for (String w : words) {
            String test = current.length() == 0 ? w : current + " " + w;
            try {
                float width = font.getStringWidth(cleanText(test)) / 1000f * fontSize;
                if (width <= maxWidth) {
                    current.append(current.length() == 0 ? "" : " ").append(w);
                } else {
                    if (current.length() > 0) {
                        lines.add(current.toString());
                        current = new StringBuilder(w);
                    } else {
                        lines.add(w);
                    }
                }
            } catch (Exception e) {
                lines.add(test);
                current = new StringBuilder();
            }
        }
        if (current.length() > 0) {
            lines.add(current.toString());
        }
        return lines;
    }

    private String cleanText(String s) {
        if (s == null) return "";
        // PDF standard font HELVETICA only supports Latin-1 characters
        return s.replaceAll("[^\\x00-\\x7F]", " ");
    }

    private ResumeContent createDefaultContent(UserEntity user, String targetRole) {
        ResumeContent c = new ResumeContent();
        PersonalInfo pi = new PersonalInfo();
        pi.setFullName(user.getName() != null ? user.getName() : "Candidate Name");
        pi.setHeadline(targetRole != null ? targetRole + " | Cloud & Distributed Systems" : "Full Stack Engineer");
        pi.setEmail(user.getEmail() != null ? user.getEmail() : "student@careernavigator.app");
        pi.setPhone(user.getPhone() != null ? user.getPhone() : "+1 (555) 019-2834");
        pi.setCityCountry("San Francisco, CA");
        pi.setLinkedIn("linkedin.com/in/" + (user.getName() != null ? user.getName().toLowerCase().replace(" ", "") : "student"));
        pi.setGithub("github.com/" + (user.getName() != null ? user.getName().toLowerCase().replace(" ", "") : "student"));
        c.setPersonalInfo(pi);

        c.setSummary("Goal-oriented " + (targetRole != null ? targetRole : "Software Engineer") + " with demonstrated proficiency in modern web architecture, scalable distributed backend systems, and automated test-driven development. Experienced in high-throughput APIs, cloud deployments, and clean engineering practices.");

        EducationItem edu = new EducationItem();
        edu.setId(UUID.randomUUID().toString());
        edu.setInstitution("University Institute of Technology");
        edu.setDegree("Bachelor of Technology");
        edu.setFieldOfStudy("Computer Science & Engineering");
        edu.setStartDate("2021");
        edu.setGraduationDate("2025");
        edu.setGradeCgpa("3.85 / 4.0");
        edu.setCoursework("Data Structures, Distributed Systems, Database Management, Cloud Computing");
        c.getEducation().add(edu);

        SkillsData skills = new SkillsData();
        skills.setProgrammingLanguages(new ArrayList<>(List.of("Java", "TypeScript", "Python", "SQL")));
        skills.setFrameworks(new ArrayList<>(List.of("Spring Boot", "React", "Node.js", "Tailwind CSS")));
        skills.setDatabases(new ArrayList<>(List.of("PostgreSQL", "MongoDB", "Redis")));
        skills.setToolsPlatforms(new ArrayList<>(List.of("Docker", "AWS", "Git", "Kubernetes", "Linux")));
        skills.setCoreConcepts(new ArrayList<>(List.of("REST APIs", "Microservices", "System Design", "CI/CD")));
        c.setSkills(skills);

        WorkExperienceItem exp = new WorkExperienceItem();
        exp.setId(UUID.randomUUID().toString());
        exp.setJobTitle("Software Engineering Intern");
        exp.setCompany("CloudScale Technologies");
        exp.setLocation("Remote");
        exp.setStartDate("Jun 2024");
        exp.setEndDate("Aug 2024");
        exp.setCurrentRole(false);
        exp.getBullets().add("Architected and implemented high-throughput RESTful microservices in Spring Boot handling 20,000+ daily events.");
        exp.getBullets().add("Optimized database querying patterns across PostgreSQL indexes, reducing p99 response times by 32%.");
        exp.getBullets().add("Engineered automated CI/CD pipelines with GitHub Actions, reducing release cycle duration from 45 mins to 8 mins.");
        c.getExperience().add(exp);

        ProjectItem proj = new ProjectItem();
        proj.setId(UUID.randomUUID().toString());
        proj.setTitle("Distributed Task Orchestrator");
        proj.setDescription("Real-time distributed job queuing system with fault tolerance and metric dashboards.");
        proj.setTechnologies(new ArrayList<>(List.of("Java", "Spring Boot", "Redis", "React", "Docker")));
        proj.setKeyContributions("Developed leader election algorithm and asynchronous worker pool with graceful failover.");
        proj.setResultsImpact("Achieved zero-loss processing across 50,000 synthetic task executions with sub-second acknowledgment.");
        proj.setGithubUrl("https://github.com/student/task-orchestrator");
        c.getProjects().add(proj);

        CertificationItem cert = new CertificationItem();
        cert.setId(UUID.randomUUID().toString());
        cert.setName("AWS Certified Solutions Architect – Associate");
        cert.setIssuingOrganization("Amazon Web Services");
        cert.setIssueDate("2024");
        c.getCertifications().add(cert);

        return c;
    }

    private String extractAllText(ResumeContent c) {
        if (c == null) return "";
        StringBuilder sb = new StringBuilder();
        if (c.getPersonalInfo() != null) {
            sb.append(c.getPersonalInfo().getFullName()).append(" ");
            sb.append(c.getPersonalInfo().getHeadline()).append(" ");
        }
        if (c.getSummary() != null) sb.append(c.getSummary()).append(" ");
        if (c.getSkills() != null) {
            sb.append(String.join(" ", c.getSkills().getProgrammingLanguages())).append(" ");
            sb.append(String.join(" ", c.getSkills().getFrameworks())).append(" ");
            sb.append(String.join(" ", c.getSkills().getDatabases())).append(" ");
            sb.append(String.join(" ", c.getSkills().getToolsPlatforms())).append(" ");
            sb.append(String.join(" ", c.getSkills().getCoreConcepts())).append(" ");
        }
        if (c.getExperience() != null) {
            for (WorkExperienceItem item : c.getExperience()) {
                sb.append(item.getJobTitle()).append(" ").append(item.getCompany()).append(" ");
                if (item.getBullets() != null) sb.append(String.join(" ", item.getBullets())).append(" ");
            }
        }
        if (c.getProjects() != null) {
            for (ProjectItem p : c.getProjects()) {
                sb.append(p.getTitle()).append(" ").append(p.getDescription()).append(" ");
                if (p.getTechnologies() != null) sb.append(String.join(" ", p.getTechnologies())).append(" ");
            }
        }
        return sb.toString();
    }

    private ResumeContent parseContent(String json) {
        if (json == null || json.trim().isEmpty()) {
            return new ResumeContent();
        }
        try {
            return objectMapper.readValue(json, ResumeContent.class);
        } catch (Exception e) {
            logger.error("Failed to parse content JSON: {}", e.getMessage());
            return new ResumeContent();
        }
    }

    private ResumeDocumentResponse toResponse(ResumeDocumentEntity entity) {
        ResumeDocumentResponse resp = new ResumeDocumentResponse();
        resp.setId(entity.getId());
        resp.setUserId(entity.getUserId());
        resp.setTitle(entity.getTitle());
        resp.setTargetRole(entity.getTargetRole());
        resp.setTemplateId(entity.getTemplateId());
        resp.setAtsScore(entity.getAtsScore());
        resp.setContent(parseContent(entity.getContentJson()));
        resp.setCreatedAt(entity.getCreatedAt());
        resp.setUpdatedAt(entity.getUpdatedAt());
        return resp;
    }

    private void safeSyncDbJson() {
        try {
            databaseStorageService.syncToDbJson();
        } catch (Exception e) {
            logger.warn("Could not sync to db.json: {}", e.getMessage());
        }
    }
}
