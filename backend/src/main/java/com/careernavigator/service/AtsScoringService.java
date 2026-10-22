package com.careernavigator.service;

import com.careernavigator.dto.ResumeAnalysisResponse;
import com.careernavigator.dto.ResumeAnalysisResponse.*;
import com.careernavigator.util.KeywordCatalog;
import com.careernavigator.util.TextNormalizer;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AtsScoringService {

    private static class SectionDef {
        final String name;
        final Pattern headingPattern;
        final Pattern contextPattern;

        SectionDef(String name, String headingRegex, String contextRegex) {
            this.name = name;
            this.headingPattern = Pattern.compile(headingRegex, Pattern.CASE_INSENSITIVE);
            this.contextPattern = Pattern.compile(contextRegex, Pattern.CASE_INSENSITIVE);
        }
    }

    private final List<SectionDef> sectionDefinitions = Arrays.asList(
            new SectionDef("Contact Information",
                    "\\b(contact\\s*(information|details|info)?|personal\\s*details)\\b",
                    "\\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}|(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}|github\\.com/[a-zA-Z0-9_-]+|linkedin\\.com/in/[a-zA-Z0-9_-]+)\\b"),

            new SectionDef("Professional Summary",
                    "\\b(professional\\s*summary|career\\s*(objective|goal)|summary|objective|profile|about\\s*me|overview|executive\\s*summary|background)\\b",
                    "\\b(years?\\s+of\\s+experience|seeking\\s+a\\s+role|passionate\\s+software|proven\\s+track\\s+record|results-oriented|dedicated\\s+engineer)\\b"),

            new SectionDef("Education",
                    "\\b(education|academic\\s*(qualifications?|background|history|credentials?)|academics|qualifications)\\b",
                    "\\b(bachelor|master|b\\.?tech|b\\.?e\\.?|m\\.?tech|m\\.?e\\.?|bca|mca|b\\.?sc|m\\.?sc|degree|university|college|institute|cgpa|gpa|percentage|graduation)\\b"),

            new SectionDef("Technical Skills",
                    "\\b(technical\\s*skills?|core\\s*competencies|skills?\\s*(&|and)?\\s*abilities|tech\\s*stack|skills|technologies|proficiencies|tools\\s*(&|and)?\\s*frameworks|programming\\s*languages)\\b",
                    "\\b(javascript|typescript|python|react|java|c\\+\\+|node|sql|docker|git|aws|html|css|express|mongodb|postgresql)\\b"),

            new SectionDef("Projects",
                    "\\b(projects?|personal\\s*projects?|academic\\s*projects?|key\\s*projects?|featured\\s*projects?|technical\\s*projects?|portfolio)\\b",
                    "\\b(github\\.com|developed\\s+(an?|the)|built\\s+(an?|the)|architected|full-stack\\s+application|web\\s+app|capstone|open-source)\\b"),

            new SectionDef("Work Experience / Internships",
                    "\\b(work\\s*experience|professional\\s*experience|employment\\s*(history)?|experience|internships?|industrial\\s*training|work\\s*history)\\b",
                    "\\b(intern(ship)?|software\\s*engineer|developer|consultant|analyst|associate|lead\\s*engineer|full-time|part-time|responsibilities|managed|reported\\s*to)\\b"),

            new SectionDef("Certifications",
                    "\\b(certifications?|certificates?|licenses?\\s*(&|and)?\\s*certifications?|accreditations?|courses?\\s*(&|and)?\\s*certifications?|online\\s*certifications?)\\b",
                    "\\b(certified|certification|credential|coursera|udemy|aws\\s*certified|meta\\s*frontend|oracle\\s*certified|comptia|freecodecamp)\\b")
    );

    public ResumeAnalysisResponse evaluateResume(String rawText, String fileName, String targetRole, String jobDescription) {
        String normalized = TextNormalizer.normalizeResumeText(rawText);
        String[] lines = normalized.split("\n");
        String textLower = normalized.toLowerCase();
        int wordCount = Math.max(1, normalized.split("\\s+").length);

        // 1. Detect Sections
        List<String> detectedSections = new ArrayList<>();
        List<String> missingSections = new ArrayList<>();
        List<SectionAnalysisResult> sectionDetails = new ArrayList<>();

        for (SectionDef def : sectionDefinitions) {
            boolean detected = false;
            String evidence = null;
            double confidence = 0.0;

            for (String line : lines) {
                line = line.trim();
                if (line.length() <= 60 && def.headingPattern.matcher(line).find()) {
                    detected = true;
                    evidence = "Found heading: \"" + line + "\"";
                    confidence = 0.95;
                    break;
                }
            }

            if (!detected) {
                Matcher m = def.contextPattern.matcher(normalized);
                if (m.find()) {
                    detected = true;
                    evidence = "Contextual match: \"" + m.group() + "\"";
                    confidence = 0.75;
                }
            }

            sectionDetails.add(new SectionAnalysisResult(def.name, detected, evidence, confidence));
            if (detected) {
                detectedSections.add(def.name);
            } else {
                missingSections.add(def.name);
            }
        }

        // 2. Keyword Density Analysis
        List<KeywordDensityResult> keywords = KeywordCatalog.analyzeKeywords(normalized);
        List<String> skills = new ArrayList<>();
        for (KeywordDensityResult k : keywords) {
            if (k.isMatch()) {
                skills.add(k.getKeyword());
            }
        }

        // 3. Category Breakdown & Dynamic Scoring
        List<String> suggestions = new ArrayList<>();
        List<String> grammarIssues = new ArrayList<>();
        List<String> improvementsToAdd = new ArrayList<>();
        List<String> improvementsToRemove = new ArrayList<>(Arrays.asList(
                "Vague introductory fluff (e.g. \"Hardworking team player looking for any opportunity\")",
                "Non-technical high school coursework or obsolete computer package references"
        ));

        // Category 1: Section Completeness (Weight: 20%)
        double sectionRatio = (double) detectedSections.size() / 7.0;
        int sectionScore = Math.min(20, (int) Math.round(sectionRatio * 20.0));
        String sectionReason = "Detected " + detectedSections.size() + " of 7 core structural sections.";
        if (!missingSections.isEmpty()) {
            sectionReason += " Missing: " + String.join(", ", missingSections) + ".";
            suggestions.add("Add a distinct \"" + missingSections.get(0) + "\" section to pass automated category parsers.");
        }

        // Category 2: Technical Skills & Density (Weight: 25%)
        double keywordRatio = Math.min(1.0, (double) skills.size() / 6.0);
        int techScore = Math.min(25, (int) Math.round(keywordRatio * 25.0));
        String techReason = "Found " + skills.size() + " verified technologies in resume text.";
        if (skills.size() < 4) {
            suggestions.add("Expand your Technical Skills inventory with primary programming languages, frameworks, and databases.");
        }

        // Category 3: Experience & Project Depth (Weight: 20%)
        List<String> actionVerbs = Arrays.asList(
                "architected", "engineered", "developed", "implemented", "designed",
                "spearheaded", "overhauled", "optimized", "refactored", "built",
                "launched", "deployed", "automated", "accelerated", "scaled",
                "secured", "resolved", "mentored", "orchestrated", "created", "maintained"
        );
        int verbCount = 0;
        for (String verb : actionVerbs) {
            if (textLower.contains(verb)) verbCount++;
        }
        boolean hasProjectsOrWork = detectedSections.contains("Projects") || detectedSections.contains("Work Experience / Internships");
        double verbRatio = Math.min(1.0, (double) verbCount / 4.0);
        int depthScore = Math.min(20, (int) Math.round((hasProjectsOrWork ? 10 : 0) + (verbRatio * 10.0)));
        String depthReason = "Found " + verbCount + " action verbs across project and work bullet points.";
        if (verbCount < 3) {
            suggestions.add("Format your project bullets using the STAR method: Begin each bullet with strong verbs like Engineered, Optimized, or Deployed.");
            grammarIssues.add("Action verb density is low. Lead technical accomplishment bullets with active verbs rather than passive statements.");
        }

        // Category 4: Quantified Metrics & Impact (Weight: 15%)
        List<Pattern> metricPatterns = Arrays.asList(
                Pattern.compile("\\b\\d+%\\b"),
                Pattern.compile("\\b\\d+\\s*percent\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b\\d+\\s*ms\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b\\d+\\s*sec(onds)?\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\$\\d+"),
                Pattern.compile("₹\\d+"),
                Pattern.compile("\\b\\d+\\s*k\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b\\d+\\s*million\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b\\d+\\s*users?\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\breduced\\s+by\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bincreased\\s+by\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\blatency\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bthroughput\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\brequests?\\s+per\\s+second\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\brps\\b", Pattern.CASE_INSENSITIVE)
        );
        int metricCount = 0;
        for (Pattern p : metricPatterns) {
            if (p.matcher(normalized).find()) metricCount++;
        }
        double metricRatio = Math.min(1.0, (double) metricCount / 3.0);
        int metricScore = Math.min(15, (int) Math.round(metricRatio * 15.0));
        String metricReason = "Found " + metricCount + " measurable metrics/outcomes.";
        if (metricCount < 2) {
            suggestions.add("Substantiate your achievements with quantifiable results (e.g., \"improved query performance by 25%\" or \"servicing 10k+ requests\").");
            grammarIssues.add("Impact warning: Absence of measurable metrics (%, latency, user scale) to substantiate project accomplishments.");
        }

        // Category 5: Contact Information (Weight: 10%)
        boolean hasEmail = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}").matcher(normalized).find();
        boolean hasPhone = Pattern.compile("(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}|\\+?\\d{10}").matcher(normalized).find();
        boolean hasLink = Pattern.compile("(github\\.com|linkedin\\.com|portfolio|\\.dev|\\.io)", Pattern.CASE_INSENSITIVE).matcher(normalized).find();
        int contactPoints = 0;
        if (hasEmail) contactPoints += 4;
        if (hasPhone) contactPoints += 3;
        if (hasLink) contactPoints += 3;
        int contactScore = Math.min(10, contactPoints);
        String contactReason = "Contact points evaluated (Email: " + (hasEmail ? "✓" : "✗") + ", Phone: " + (hasPhone ? "✓" : "✗") + ", Links: " + (hasLink ? "✓" : "✗") + ").";
        if (!hasEmail) {
            grammarIssues.add("Header warning: No email address detected in candidate contact section.");
        }

        // Category 6: Readability & Document Structure (Weight: 10%)
        int readScore = 10;
        if (wordCount < 100) {
            readScore = 2;
            grammarIssues.add("Length warning: Resume text is very brief (under 100 words). Expand your project and technical descriptions.");
        } else if (wordCount < 200) {
            readScore = 6;
        } else if (wordCount > 1800) {
            readScore = 7;
            grammarIssues.add("Length warning: Resume exceeds 1,800 words. Consider condensing to 1-2 pages.");
        }
        String readReason = "Document contains " + wordCount + " words with formatted section spacing.";

        int baseScore = sectionScore + techScore + depthScore + metricScore + contactScore + readScore;

        // Specific technology recommendations
        boolean hasDocker = keywords.stream().anyMatch(k -> "Docker".equals(k.getKeyword()) && k.isMatch());
        if (!hasDocker && !textLower.contains("cloud")) {
            improvementsToAdd.add("Cloud & Containerization context (Docker, AWS, Kubernetes, or Vercel)");
        }
        boolean hasGit = keywords.stream().anyMatch(k -> "Git / GitHub".equals(k.getKeyword()) && k.isMatch());
        if (!hasGit) {
            improvementsToAdd.add("Version control and automation workflows (Git, GitHub Actions, CI/CD pipelines)");
        }

        int finalScore = Math.max(10, Math.min(98, baseScore));

        List<ScoreCategoryBreakdown> categoryBreakdown = Arrays.asList(
                new ScoreCategoryBreakdown("Section Completeness", sectionScore, 20, 20, sectionReason),
                new ScoreCategoryBreakdown("Technical Skills & Density", techScore, 25, 25, techReason),
                new ScoreCategoryBreakdown("Experience & Project Depth", depthScore, 20, 20, depthReason),
                new ScoreCategoryBreakdown("Quantified Impact & Metrics", metricScore, 15, 15, metricReason),
                new ScoreCategoryBreakdown("Contact Information", contactScore, 10, 10, contactReason),
                new ScoreCategoryBreakdown("Readability & Structure", readScore, 10, 10, readReason)
        );

        // 4. Job Description Matching (if provided)
        Integer jdMatchScore = null;
        List<String> matchedJDKeywords = new ArrayList<>();
        List<String> missingJDKeywords = new ArrayList<>();

        if (jobDescription != null && !jobDescription.isBlank()) {
            for (KeywordCatalog.CatalogItem item : KeywordCatalog.ITEMS) {
                if (item.match(jobDescription).getCount() > 0) {
                    if (item.match(normalized).getCount() > 0) {
                        matchedJDKeywords.add(item.getCanonical());
                    } else {
                        missingJDKeywords.add(item.getCanonical());
                    }
                }
            }

            int totalRequired = matchedJDKeywords.size() + missingJDKeywords.size();
            jdMatchScore = totalRequired > 0 ? (int) Math.round(((double) matchedJDKeywords.size() / totalRequired) * 100.0) : 50;
        }

        ResumeAnalysisResponse resp = new ResumeAnalysisResponse();
        resp.setId("res-" + UUID.randomUUID().toString().substring(0, 8));
        resp.setFileName(fileName);
        resp.setUploadedAt(new Date().toInstant().toString());
        resp.setAtsScore(finalScore);
        resp.setCategoryBreakdown(categoryBreakdown);
        resp.setDetectedSections(detectedSections);
        resp.setMissingSections(missingSections);
        resp.setSectionDetails(sectionDetails);
        resp.setSkills(skills);
        resp.setKeywords(keywords);
        resp.setSuggestions(suggestions.stream().limit(5).toList());
        resp.setGrammarIssues(grammarIssues);
        resp.setImprovementsToAdd(improvementsToAdd.stream().limit(5).toList());
        resp.setImprovementsToRemove(improvementsToRemove);
        resp.setWordCount(wordCount);
        resp.setContentHash(TextNormalizer.computeContentHash(normalized));
        resp.setTargetRole(targetRole);
        resp.setJdMatchScore(jdMatchScore);
        resp.setJobDescription(jobDescription);
        resp.setMatchedJDKeywords(matchedJDKeywords);
        resp.setMissingJDKeywords(missingJDKeywords);

        return resp;
    }
}
