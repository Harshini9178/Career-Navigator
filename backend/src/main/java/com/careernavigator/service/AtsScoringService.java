package com.careernavigator.service;

import com.careernavigator.dto.ResumeAnalysisResponse;
import com.careernavigator.dto.ResumeAnalysisResponse.*;
import com.careernavigator.util.KeywordCatalog;
import com.careernavigator.util.RoleCatalog;
import com.careernavigator.util.RoleCatalog.RoleProfile;
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
                    "^(contact(\\s*(information|details|info))?|personal\\s*(details|information|info))$",
                    "([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}|(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}|github\\.com/[a-zA-Z0-9_-]+|linkedin\\.com/in/[a-zA-Z0-9_-]+)"),

            new SectionDef("Professional Summary",
                    "^(professional\\s*summary|career\\s*(objective|goal|summary)|summary|objective|profile|about\\s*me|overview|executive\\s*summary|background)$",
                    "\\b(years?\\s+of\\s+experience|seeking\\s+(a\\s+)?role|passionate\\s+software|proven\\s+track\\s+record|results-oriented|dedicated\\s+engineer)\\b"),

            new SectionDef("Education",
                    "^(education|academic\\s*(qualifications?|background|history|credentials?)|academics|qualifications)$",
                    "\\b(bachelor|master|b\\.?tech|b\\.?e\\.?|m\\.?tech|m\\.?e\\.?|bca|mca|b\\.?sc|m\\.?sc|degree|university|college|institute|cgpa|gpa|percentage|graduation)\\b"),

            new SectionDef("Technical Skills",
                    "^(technical\\s*skills?|core\\s*competencies|skills?\\s*(&|and)?\\s*abilities|tech\\s*stack|skills|technologies|proficiencies|tools\\s*(&|and)?\\s*frameworks|programming\\s*languages)$",
                    "\\b(javascript|typescript|python|react|java|c\\+\\+|node|sql|docker|git|aws|html|css|express|mongodb|postgresql)\\b"),

            new SectionDef("Projects",
                    "^(projects?|personal\\s*projects?|academic\\s*projects?|key\\s*projects?|featured\\s*projects?|technical\\s*projects?|portfolio)$",
                    "\\b(github\\.com|developed\\s+(an?|the)|built\\s+(an?|the)|architected|full-stack\\s+application|web\\s+app|capstone|open-source)\\b"),

            new SectionDef("Work Experience / Internships",
                    "^(work\\s*experience|professional\\s*experience|employment\\s*(history)?|experience|internships?|industrial\\s*training|work\\s*history)$",
                    "\\b(intern(ship)?|software\\s*engineer|developer|consultant|analyst|associate|lead\\s*engineer|full-time|part-time|responsibilities|managed|reported\\s*to)\\b"),

            new SectionDef("Certifications",
                    "^(certifications?|certificates?|licenses?\\s*(&|and)?\\s*certifications?|accreditations?|courses?\\s*(&|and)?\\s*certifications?|online\\s*certifications?)$",
                    "\\b(certified|certification|credential|coursera|udemy|aws\\s*certified|meta\\s*frontend|oracle\\s*certified|comptia|freecodecamp)\\b")
    );

    public ResumeAnalysisResponse evaluateResume(String rawText, String fileName, String targetRole, String jobDescription) {
        String normalized = TextNormalizer.normalizeResumeText(rawText);
        String[] lines = normalized.split("\n");
        String textLower = normalized.toLowerCase();
        int wordCount = Math.max(1, normalized.split("\\s+").length);

        // Resolve Target Role Profile
        RoleProfile roleProfile = RoleCatalog.resolveProfile(targetRole);
        String resolvedRoleName = roleProfile.getCanonicalName();

        // 1. Detect Sections using heading aliases and contextual patterns
        List<String> detectedSections = new ArrayList<>();
        List<String> missingSections = new ArrayList<>();
        List<SectionAnalysisResult> sectionDetails = new ArrayList<>();

        for (SectionDef def : sectionDefinitions) {
            boolean detected = false;
            String evidence = null;
            double confidence = 0.0;

            // Heading match (strip punctuation, whitespace)
            for (String line : lines) {
                String cleanLine = line.replaceAll("[^a-zA-Z0-9\\s/&]", "").trim();
                if (cleanLine.length() > 0 && cleanLine.length() <= 50 && def.headingPattern.matcher(cleanLine).matches()) {
                    detected = true;
                    evidence = "Found section heading: \"" + line.trim() + "\"";
                    confidence = 0.98;
                    break;
                }
            }

            // Contextual fallback match if no explicit heading found
            if (!detected) {
                Matcher m = def.contextPattern.matcher(normalized);
                if (m.find()) {
                    detected = true;
                    evidence = "Contextual content detected: \"" + m.group() + "\"";
                    confidence = 0.85;
                }
            }

            sectionDetails.add(new SectionAnalysisResult(def.name, detected, evidence, confidence));
            if (detected) {
                detectedSections.add(def.name);
            } else {
                missingSections.add(def.name);
            }
        }

        // 2. Skill & Tech Keyword Density Analysis with Role Relevance
        List<KeywordDensityResult> keywords = KeywordCatalog.analyzeKeywords(normalized, roleProfile);
        List<String> presentSkills = new ArrayList<>();
        List<String> missingRoleRequiredSkills = new ArrayList<>();
        List<String> missingRolePreferredSkills = new ArrayList<>();

        for (KeywordDensityResult k : keywords) {
            if (k.isMatch()) {
                presentSkills.add(k.getKeyword());
            } else {
                if ("Required".equals(k.getRelevance())) {
                    missingRoleRequiredSkills.add(k.getKeyword());
                } else if ("Preferred".equals(k.getRelevance())) {
                    missingRolePreferredSkills.add(k.getKeyword());
                }
            }
        }

        // 3. Category Breakdown & Dynamic Deterministic Scoring (100% Total)
        List<String> suggestions = new ArrayList<>();
        List<String> grammarIssues = new ArrayList<>();
        List<String> improvementsToAdd = new ArrayList<>();
        List<String> improvementsToRemove = new ArrayList<>(Arrays.asList(
                "Generic objective statements (e.g. \"Hardworking individual looking for a challenging opportunity\")",
                "Non-technical secondary school grades or outdated software packages"
        ));

        // Category 1: Technical Skills & Role Alignment (Weight: 25%)
        int techScore;
        String techReason;

        // If Job Description is supplied, base skills alignment directly on JD keywords!
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
            int totalJdSkills = matchedJDKeywords.size() + missingJDKeywords.size();
            if (totalJdSkills > 0) {
                double matchRatio = (double) matchedJDKeywords.size() / totalJdSkills;
                jdMatchScore = (int) Math.round(matchRatio * 100.0);
                techScore = Math.min(25, (int) Math.round(matchRatio * 25.0));
                techReason = "JD Keyword Alignment: Matched " + matchedJDKeywords.size() + " of " + totalJdSkills + " technical competencies requested in the job description.";
            } else {
                jdMatchScore = 75;
                techScore = Math.min(25, Math.max(10, (int) Math.round((presentSkills.size() / 6.0) * 25.0)));
                techReason = "Evaluated against general engineering criteria.";
            }
        } else {
            // Evaluated against target role skill profile
            List<String> reqSkills = roleProfile.getRequiredSkills();
            List<String> prefSkills = roleProfile.getPreferredSkills();

            long reqMatched = reqSkills.stream().filter(presentSkills::contains).count();
            long prefMatched = prefSkills.stream().filter(presentSkills::contains).count();

            double reqRatio = reqSkills.isEmpty() ? 1.0 : (double) reqMatched / reqSkills.size();
            double prefRatio = prefSkills.isEmpty() ? 1.0 : (double) prefMatched / prefSkills.size();

            // 18 pts for required role skills + 7 pts for preferred role skills = 25 pts max
            techScore = Math.min(25, (int) Math.round((reqRatio * 18.0) + (prefRatio * 7.0)));
            techReason = "Role Alignment (" + resolvedRoleName + "): Matched " + reqMatched + "/" + reqSkills.size()
                    + " required and " + prefMatched + "/" + prefSkills.size() + " preferred core competencies.";
        }

        // Generate tailored suggestions for missing role skills
        if (!missingRoleRequiredSkills.isEmpty()) {
            suggestions.add("Add target role required skills (" + String.join(", ", missingRoleRequiredSkills.stream().limit(3).toList())
                    + ") if you have hands-on academic or project experience with them.");
            improvementsToAdd.add("Role requirement: Hands-on context for " + missingRoleRequiredSkills.get(0));
        }

        // Category 2: Section Completeness (Weight: 20%)
        double sectionRatio = (double) detectedSections.size() / (double) sectionDefinitions.size();
        int sectionScore = Math.min(20, (int) Math.round(sectionRatio * 20.0));
        String sectionReason = "Detected " + detectedSections.size() + " of " + sectionDefinitions.size() + " structural sections.";
        if (!missingSections.isEmpty()) {
            sectionReason += " Missing: " + String.join(", ", missingSections) + ".";
            suggestions.add("Add a distinct \"" + missingSections.get(0) + "\" section heading to pass automated applicant tracking parsers.");
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
            if (Pattern.compile("\\b" + verb + "\\b", Pattern.CASE_INSENSITIVE).matcher(normalized).find()) {
                verbCount++;
            }
        }
        boolean hasProjectsOrWork = detectedSections.contains("Projects") || detectedSections.contains("Work Experience / Internships");
        double verbRatio = Math.min(1.0, (double) verbCount / 4.0);
        int depthScore = Math.min(20, (int) Math.round((hasProjectsOrWork ? 10 : 0) + (verbRatio * 10.0)));
        String depthReason = "Found " + verbCount + " action verbs across project and work accomplishment bullets.";
        if (verbCount < 3) {
            suggestions.add("Structure technical accomplishment bullets using the STAR method: Begin with strong action verbs (e.g. Engineered, Architected, Optimized).");
            grammarIssues.add("Action verb density is low. Lead bullet points with past-tense action verbs rather than passive duties.");
        }

        // Category 4: Measurable Achievements & Impact (Weight: 15%)
        List<Pattern> metricPatterns = Arrays.asList(
                Pattern.compile("\\b\\d+%(?:\\s*increase|\\s*reduction|\\s*improvement)?\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b\\d+\\s*percent\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b\\d+\\s*(?:ms|milliseconds?|seconds?)\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("[\\$₹]\\s*\\d+"),
                Pattern.compile("\\b\\d+\\s*(?:k|million|m)\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b\\d+\\s*users?\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\breduced\\s+(?:latency|cost|build\\s*time|time)\\s+by\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bincreased\\s+(?:throughput|performance|velocity|conversion)\\s+by\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b(?:requests?\\s+per\\s+second|rps|qps)\\b", Pattern.CASE_INSENSITIVE)
        );
        int metricCount = 0;
        for (Pattern p : metricPatterns) {
            if (p.matcher(normalized).find()) metricCount++;
        }
        double metricRatio = Math.min(1.0, (double) metricCount / 3.0);
        int metricScore = Math.min(15, (int) Math.round(metricRatio * 15.0));
        String metricReason = "Found " + metricCount + " quantifiable metrics/performance outcomes.";
        if (metricCount < 2) {
            suggestions.add("Substantiate your achievements with measurable results (e.g., \"reduced p99 latency by 35%\" or \"servicing 50,000+ active users\").");
            grammarIssues.add("Impact warning: Absence of quantitative metrics (%, ms latency, scale) to validate technical achievements.");
        }

        // Category 5: Contact Information & Reachability (Weight: 10%)
        boolean hasEmail = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}").matcher(normalized).find();
        boolean hasPhone = Pattern.compile("(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}|\\+?\\d{10}").matcher(normalized).find();
        boolean hasLink = Pattern.compile("(github\\.com/[a-zA-Z0-9_-]+|linkedin\\.com/in/[a-zA-Z0-9_-]+|portfolio|\\.dev|\\.io)", Pattern.CASE_INSENSITIVE).matcher(normalized).find();
        int contactPoints = 0;
        if (hasEmail) contactPoints += 4;
        if (hasPhone) contactPoints += 3;
        if (hasLink) contactPoints += 3;
        int contactScore = Math.min(10, contactPoints);
        String contactReason = "Contact reachability evaluated (Email: " + (hasEmail ? "✓" : "✗")
                + ", Phone: " + (hasPhone ? "✓" : "✗") + ", GitHub/LinkedIn: " + (hasLink ? "✓" : "✗") + ").";
        if (!hasEmail) {
            grammarIssues.add("Header warning: No valid email address detected.");
        }

        // Category 6: Formatting & Machine Readability (Weight: 10%)
        int readScore = 10;
        if (wordCount < 100) {
            readScore = 2;
            grammarIssues.add("Length warning: Resume text is very brief (under 100 words). Add project and technical details.");
        } else if (wordCount < 200) {
            readScore = 6;
        } else if (wordCount > 1800) {
            readScore = 7;
            grammarIssues.add("Length warning: Document exceeds 1,800 words. Consider condensing to 1-2 focused pages.");
        }
        String readReason = "Document contains " + wordCount + " words with machine-readable layout.";

        // Total calculated score strictly bounded between 0 and 100
        int baseTotal = sectionScore + techScore + depthScore + metricScore + contactScore + readScore;
        int finalScore = Math.max(10, Math.min(100, baseTotal));

        // Add cloud/version control recommendations if missing
        boolean hasGit = keywords.stream().anyMatch(k -> "Git / GitHub".equals(k.getKeyword()) && k.isMatch());
        if (!hasGit && !textLower.contains("git")) {
            improvementsToAdd.add("Version control and automation workflows (Git, GitHub, CI/CD pipelines)");
        }
        boolean hasDocker = keywords.stream().anyMatch(k -> "Docker".equals(k.getKeyword()) && k.isMatch());
        if (!hasDocker && !textLower.contains("docker") && !textLower.contains("container")) {
            improvementsToAdd.add("Containerization & deployment context (Docker, AWS, or Cloud Run)");
        }

        // Construct 6 Documented Category Breakdowns (Sum: 100%)
        List<ScoreCategoryBreakdown> categoryBreakdown = Arrays.asList(
                new ScoreCategoryBreakdown("Technical Skills & Role Alignment", techScore, 25, 25, techReason),
                new ScoreCategoryBreakdown("Section Completeness", sectionScore, 20, 20, sectionReason),
                new ScoreCategoryBreakdown("Experience & Project Depth", depthScore, 20, 20, depthReason),
                new ScoreCategoryBreakdown("Quantified Impact & Metrics", metricScore, 15, 15, metricReason),
                new ScoreCategoryBreakdown("Contact Information", contactScore, 10, 10, contactReason),
                new ScoreCategoryBreakdown("Formatting & Readability", readScore, 10, 10, readReason)
        );

        ResumeAnalysisResponse resp = new ResumeAnalysisResponse();
        resp.setId("res-" + UUID.randomUUID().toString().substring(0, 8));
        resp.setFileName(fileName);
        resp.setUploadedAt(new Date().toInstant().toString());
        resp.setAtsScore(finalScore);
        resp.setCategoryBreakdown(categoryBreakdown);
        resp.setDetectedSections(detectedSections);
        resp.setMissingSections(missingSections);
        resp.setSectionDetails(sectionDetails);
        resp.setSkills(presentSkills);
        resp.setKeywords(keywords);
        resp.setSuggestions(suggestions.stream().limit(5).toList());
        resp.setGrammarIssues(grammarIssues);
        resp.setImprovementsToAdd(improvementsToAdd.stream().limit(5).toList());
        resp.setImprovementsToRemove(improvementsToRemove);
        resp.setWordCount(wordCount);
        resp.setContentHash(TextNormalizer.computeContentHash(normalized));
        resp.setTargetRole(resolvedRoleName);
        resp.setJdMatchScore(jdMatchScore);
        resp.setJobDescription(jobDescription);
        resp.setMatchedJDKeywords(matchedJDKeywords);
        resp.setMissingJDKeywords(missingJDKeywords);

        return resp;
    }
}
