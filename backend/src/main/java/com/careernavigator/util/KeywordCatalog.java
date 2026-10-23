package com.careernavigator.util;

import com.careernavigator.dto.ResumeAnalysisResponse.KeywordDensityResult;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class KeywordCatalog {

    public static class CatalogItem {
        private final String canonical;
        private final String category;
        private final List<String> aliases;
        private final Pattern pattern;

        public CatalogItem(String canonical, String category, List<String> aliases, String regex, int flags) {
            this.canonical = canonical;
            this.category = category;
            this.aliases = aliases;
            this.pattern = Pattern.compile(regex, flags);
        }

        public String getCanonical() { return canonical; }
        public String getCategory() { return category; }
        public List<String> getAliases() { return aliases; }

        public KeywordMatchResult match(String text) {
            if (text == null) return new KeywordMatchResult(0, new ArrayList<>());
            Matcher matcher = pattern.matcher(text);
            int count = 0;
            List<String> matched = new ArrayList<>();
            while (matcher.find()) {
                count++;
                String m = matcher.group();
                if (!matched.contains(m.toLowerCase())) {
                    matched.add(m.toLowerCase());
                }
            }
            return new KeywordMatchResult(count, matched);
        }
    }

    public static class KeywordMatchResult {
        private final int count;
        private final List<String> matchedAliases;

        public KeywordMatchResult(int count, List<String> matchedAliases) {
            this.count = count;
            this.matchedAliases = matchedAliases;
        }

        public int getCount() { return count; }
        public List<String> getMatchedAliases() { return matchedAliases; }
    }

    public static final List<CatalogItem> ITEMS = Arrays.asList(
            // Languages
            new CatalogItem("JavaScript", "Languages", List.of("javascript", "js", "es6", "ecmascript"),
                    "\\b(javascript|ecmascript|es6|es20\\d\\d)\\b|(?<![a-zA-Z0-9_])js(?![a-zA-Z0-9_])", Pattern.CASE_INSENSITIVE),

            new CatalogItem("TypeScript", "Languages", List.of("typescript", "ts"),
                    "\\btypescript\\b|(?<![a-zA-Z0-9_])ts(?![a-zA-Z0-9_])", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Python", "Languages", List.of("python", "py"),
                    "\\bpython\\d?(\\.\\d+)?\\b|(?<![a-zA-Z0-9_])py(?![a-zA-Z0-9_])", Pattern.CASE_INSENSITIVE),

            // Token boundary: Must not match JavaScript or JavaBean
            new CatalogItem("Java", "Languages", List.of("java", "jvm", "jdk"),
                    "(?<![a-zA-Z0-9_])java(?![a-zA-Z0-9_]|script|bean)", Pattern.CASE_INSENSITIVE),

            new CatalogItem("C++", "Languages", List.of("c++", "cpp", "c/c++"),
                    "\\bc\\+\\+|\\bcpp\\b|\\bc/c\\+\\+", Pattern.CASE_INSENSITIVE),

            new CatalogItem("C# / .NET", "Languages", List.of("c#", "c sharp", ".net", "dotnet", "asp.net"),
                    "\\bc#|\\bc\\s*sharp|\\b\\.net\\b|\\bdotnet\\b|\\basp\\.net\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Go", "Languages", List.of("golang", "go language"),
                    "\\bgolang\\b|\\bgo\\s+language\\b|(?<![a-zA-Z0-9_])Go(?![a-zA-Z0-9_])", 0),

            new CatalogItem("Rust", "Languages", List.of("rust", "cargo"),
                    "\\brust(\\s+lang(uage)?)?\\b|\\bcargo\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("HTML/CSS", "Languages", List.of("html", "css", "html5", "css3", "tailwind", "sass", "scss"),
                    "\\bhtml5?\\b|\\bcss3?\\b|\\bhtml\\s*[/&]?\\s*css\\b|\\btailwind(\\s*css)?\\b|\\bsass\\b|\\bscss\\b", Pattern.CASE_INSENSITIVE),

            // Frameworks
            new CatalogItem("React", "Frameworks", List.of("react", "react.js", "reactjs", "react native"),
                    "\\breact(\\.js|js)?\\b|\\breact\\s+native\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Node.js", "Frameworks", List.of("node.js", "nodejs", "node"),
                    "\\bnode(\\.js|js)\\b|(?<![a-zA-Z0-9_])Node(?![a-zA-Z0-9_])", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Express.js", "Frameworks", List.of("express", "express.js", "expressjs"),
                    "\\bexpress(\\.js|js)?\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Spring Boot", "Frameworks", List.of("spring boot", "spring", "spring-boot", "spring framework"),
                    "\\bspring(\\s*boot|\\s*framework)?\\b", Pattern.CASE_INSENSITIVE),

            // Databases & APIs
            new CatalogItem("SQL", "Databases & APIs", List.of("sql", "rdbms"),
                    "\\bsql\\b|\\brdbms\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("PostgreSQL", "Databases & APIs", List.of("postgresql", "postgres"),
                    "\\bpostgres(ql)?\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("MySQL", "Databases & APIs", List.of("mysql"),
                    "\\bmysql\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("MongoDB", "Databases & APIs", List.of("mongodb", "mongo"),
                    "\\bmongo(db)?\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("REST APIs", "Databases & APIs", List.of("rest api", "restful", "apis"),
                    "\\brest(ful)?\\s*(api|apis|endpoints?)?\\b|\\bapis?\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("GraphQL", "Databases & APIs", List.of("graphql", "gql"),
                    "\\bgraphql\\b|(?<![a-zA-Z0-9_])gql(?![a-zA-Z0-9_])", Pattern.CASE_INSENSITIVE),

            // DevOps & Cloud
            new CatalogItem("Git / GitHub", "DevOps & Cloud", List.of("git", "github", "gitlab", "version control"),
                    "\\bgit\\b|\\bgithub\\b|\\bgitlab\\b|\\bversion\\s*control\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Docker", "DevOps & Cloud", List.of("docker", "containerization"),
                    "\\bdocker\\b|\\bcontainer(s|ization)?\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Kubernetes", "DevOps & Cloud", List.of("kubernetes", "k8s"),
                    "\\bkubernetes\\b|\\bk8s\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("AWS", "DevOps & Cloud", List.of("aws", "amazon web services"),
                    "\\baws\\b|\\bamazon\\s+web\\s+services\\b|\\bs3\\b|\\bec2\\b|\\blambda\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Google Cloud / GCP", "DevOps & Cloud", List.of("gcp", "google cloud"),
                    "\\bgoogle\\s+cloud\\b|\\bgcp\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("CI/CD", "DevOps & Cloud", List.of("ci/cd", "cicd", "jenkins", "github actions"),
                    "\\bci/cd\\b|\\bcicd\\b|\\bjenkins\\b|\\bgithub\\s+actions\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Terraform", "DevOps & Cloud", List.of("terraform", "iac"),
                    "\\bterraform\\b|\\biac\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Prometheus", "DevOps & Cloud", List.of("prometheus"),
                    "\\bprometheus\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Grafana", "DevOps & Cloud", List.of("grafana"),
                    "\\bgrafana\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Kafka", "Databases & APIs", List.of("kafka"),
                    "\\b(apache\\s*)?kafka\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Redis", "Databases & APIs", List.of("redis"),
                    "\\bredis\\b", Pattern.CASE_INSENSITIVE),

            // Testing, Architecture & Systems
            new CatalogItem("Testing / QA", "Testing & Tools", List.of("unit test", "jest", "junit", "mockito", "pytest", "cypress", "selenium", "tdd"),
                    "\\b(unit\\s*test(ing)?|jest|junit|mockito|pytest|cypress|selenium|tdd|test\\s*driven)\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Linux / Unix", "DevOps & Cloud", List.of("linux", "unix", "bash", "shell"),
                    "\\blinux\\b|\\bunix\\b|\\bbash\\b|\\bshell\\s*scripting\\b", Pattern.CASE_INSENSITIVE),

            // Data & AI
            new CatalogItem("Data Analysis / Pandas", "Data & AI", List.of("pandas", "numpy", "data analysis", "data cleaning"),
                    "\\b(pandas|numpy|data\\s*analysis|data\\s*cleaning|eda)\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Data Visualization", "Data & AI", List.of("tableau", "power bi", "matplotlib", "seaborn", "excel"),
                    "\\b(tableau|power\\s*bi|matplotlib|seaborn|d3\\.js|excel)\\b", Pattern.CASE_INSENSITIVE),

            new CatalogItem("Machine Learning", "Data & AI", List.of("machine learning", "scikit-learn", "tensorflow", "pytorch", "deep learning"),
                    "\\b(machine\\s*learning|scikit-learn|tensorflow|pytorch|deep\\s*learning|ml\\b)", Pattern.CASE_INSENSITIVE)
    );

    public static List<KeywordDensityResult> analyzeKeywords(String normalizedText) {
        return analyzeKeywords(normalizedText, null);
    }

    public static List<KeywordDensityResult> analyzeKeywords(String normalizedText, RoleCatalog.RoleProfile roleProfile) {
        String[] tokens = normalizedText.split("\\s+");
        int totalTokens = Math.max(1, tokens.length);
        List<KeywordDensityResult> results = new ArrayList<>();

        List<String> required = (roleProfile != null) ? roleProfile.getRequiredSkills() : Collections.emptyList();
        List<String> preferred = (roleProfile != null) ? roleProfile.getPreferredSkills() : Collections.emptyList();

        for (CatalogItem item : ITEMS) {
            KeywordMatchResult matchResult = item.match(normalizedText);
            boolean match = matchResult.getCount() > 0;
            double density = Math.round(((double) matchResult.getCount() / totalTokens) * 10000.0) / 100.0;

            String relevance = "Supporting";
            if (required.contains(item.getCanonical())) {
                relevance = "Required";
            } else if (preferred.contains(item.getCanonical())) {
                relevance = "Preferred";
            }

            KeywordDensityResult kdr = new KeywordDensityResult(
                    item.getCanonical(),
                    match,
                    matchResult.getCount(),
                    density,
                    item.getCategory(),
                    item.getAliases()
            );
            kdr.setRelevance(relevance);
            results.add(kdr);
        }

        return results;
    }
}
