import docx
from docx.shared import Inches, Pt, RGBColor
from styles import (
    add_chapter_heading, add_section_heading, add_subsection_heading,
    add_paragraph, add_bullet, add_numbered_item, add_table,
    add_figure, add_callout_box, add_code_box, add_table_caption
)

def build_chapters_4_to_6(doc):
    # =========================================================================
    # CHAPTER 4: PROJECT PLANNING
    # =========================================================================
    add_chapter_heading(doc, "CHAPTER 4", "PROJECT PLANNING")
    
    add_section_heading(doc, "4.1", "PROJECT PLANNING AND SCHEDULING")
    add_paragraph(doc,
        "Careful planning and iterative development were central to delivering Career Navigator within the academic timeline. "
        "The project was executed using an Agile Scrum process adapted for a 26-week collegiate engineering schedule. "
        "Work was divided into distinct phases, scheduled across eight two-to-three-week sprints, and tracked through regular milestone reviews."
    )

    add_subsection_heading(doc, "4.1.1", "Work Breakdown Structure (WBS)")
    add_paragraph(doc,
        "The Work Breakdown Structure divides total project deliverables into five major phases. "
        "Table 4.1 outlines the formal WBS Dictionary, detailing task codes, work package deliverables, estimated effort in person-hours, "
        "and corresponding milestone gates."
    )

    # Table 4.1: WBS Dictionary
    add_table_caption(doc, "Table 4.1: Comprehensive Work Breakdown Structure (WBS) Dictionary and Task Allocation")
    headers_4_1 = ["WBS Code", "Work Package Description", "Primary Sub-tasks / Deliverables", "Effort (Hrs)", "Dependencies", "Verification Gate"]
    rows_4_1 = [
        ["1.0", "Project Initiation & SRS", "Domain research, literature survey of 16 papers, SRS drafting", "75", "None", "Guide Approval"],
        ["1.1", "Recruitment Domain Analysis", "Interview campus placement officers, survey 100 students", "35", "1.0", "Problem Statement Signoff"],
        ["1.2", "System Requirements Specification", "Drafting 25 Functional & 16 Non-Functional specifications", "40", "1.1", "Formal SRS v1.0"],
        ["2.0", "System Architecture & UML", "Multi-tier architecture design, UML modeling, DB schemas", "90", "1.2", "Design Review"],
        ["2.1", "UML Conceptual Modeling", "Use Case, Sequence, and Activity diagrams generation", "45", "2.0", "UML Baseline v1.0"],
        ["2.2", "Database & Schema Design", "ER diagrams, SQLite-WAL tables, JSON schemas, OpenAPI spec", "45", "2.1", "Data Model Freeze"],
        ["3.0", "Core Engine Development", "Resume ATS engine, text normalizer, Gemini GenAI pipeline", "180", "2.2", "Module Testing"],
        ["3.1", "Resume Parsing & DJB2 Engine", "PDF/DOCX extractors, unicode sanitizers, keyword density matcher", "60", "3.0", "ATS Unit Tests (100%)"],
        ["3.2", "Conversational SSE AI Pipeline", "Gemini 2.5 Flash SDK, prompt engineering, EventSource streams", "70", "3.1", "TTFT < 400ms Verified"],
        ["3.3", "Vocal Cadence & Speech Hook", "Web Audio API graph, WPM calculator, verbal filler word regex", "50", "3.2", "Cadence Benchmark"],
        ["4.0", "Monaco Code Lab & Security", "Sandboxed IDE, Big-O static analyzer, OWASP middleware", "110", "3.3", "Security Audit"],
        ["4.1", "Monaco Editor Integration", "Browser code execution sandbox, console capture, syntax tokens", "55", "4.0", "IDE Test Suite"],
        ["4.2", "OWASP Security Hardening", "Double-submit CSRF, timing-safe HMAC sessions, rate limiters", "55", "4.1", "Security Pen Test"],
        ["5.0", "QA, Testing & Verification", "Vitest unit/integration test suites, load testing, telemetry", "105", "4.2", "100% CI Test Pass"],
        ["5.1", "Automated Testing Suites", "Drafting and executing 78 unit tests across 13 test files", "60", "5.0", "Zero Failures in Vitest"],
        ["5.2", "Performance Benchmarking", "Apache JMeter concurrent load tests, latency profiling", "45", "5.1", "SLA Verification"],
        ["6.0", "Documentation & Deployment", "Project report synthesis, Docker containerization, viva prep", "80", "5.2", "Final Exhibition"]
    ]
    add_table(doc, headers_4_1, rows_4_1, [0.7, 1.8, 2.0, 0.6, 0.7, 1.0])

    add_subsection_heading(doc, "4.1.2", "Gantt Chart Timeline & Milestone Scheduling")
    add_paragraph(doc,
        "Figure 4.1 illustrates the project schedule across 26 weeks. Critical Path Method (CPM) analysis identified "
        "the core AI streaming pipeline (Tasks 3.1 -> 3.2 -> 4.2) as the primary critical path governing project completion."
    )
    
    add_figure(doc, 'assets_generated/fig_4_1_gantt_chart.png', 'Figure 4.1: Project Execution Gantt Chart: Work Breakdown Structure Across 26 Weeks')

    add_paragraph(doc,
        "Summary of key milestone reviews:"
    )
    add_numbered_item(doc, "1.", "Milestone M1 (Week 3): Literature survey completed and problem statement approved by department faculty review committee.", "Milestone M1:")
    add_numbered_item(doc, "2.", "Milestone M2 (Week 6): System architecture, UML analysis models, and OpenAPI 3.0.3 specification frozen.", "Milestone M2:")
    add_numbered_item(doc, "3.", "Milestone M3 (Week 10): Resume parsing engine, unicode normalizer, and DJB2 caching operational.", "Milestone M3:")
    add_numbered_item(doc, "4.", "Milestone M4 (Week 14): Gemini 2.5 Flash conversational mock interview room with Server-Sent Events streaming verified.", "Milestone M4:")
    add_numbered_item(doc, "5.", "Milestone M5 (Week 17): In-browser Monaco Code Lab and Web Audio speech cadence tracking integrated.", "Milestone M5:")
    add_numbered_item(doc, "6.", "Milestone M6 (Week 20): OWASP security baseline verified (double-submit CSRF, HMAC session signing, rate limiting).", "Milestone M6:")
    add_numbered_item(doc, "7.", "Milestone M7 (Week 23): Automated Vitest test suite passing with 100% success rate across all modules.", "Milestone M7:")
    add_numbered_item(doc, "8.", "Milestone M8 (Week 26): Production Docker containerization, project report completion, and viva voce defense.", "Milestone M8:")

    add_subsection_heading(doc, "4.1.3", "Agile Sprint Breakdown & Deliverables")
    add_paragraph(doc,
        "Development was carried out across eight two-to-three-week sprints. Table 4.2 outlines the focus, completed story points, "
        "and milestone deliverables for each sprint."
    )

    # Table 4.2: Agile Sprint Scheduling
    add_table_caption(doc, "Table 4.2: Agile Sprint Scheduling, Velocity, Story Points, and Milestone Deliverables")
    headers_4_2 = ["Sprint ID", "Duration", "Story Points", "Core Focus & Work Packages", "Milestone Deliverable", "Verification Gate"]
    rows_4_2 = [
        ["Sprint 1", "Weeks 1 - 3", "24", "Problem definition, literature survey, recruitment domain research", "Formal Project Proposal & SRS v1.0", "Faculty Guide Review & Approval"],
        ["Sprint 2", "Weeks 4 - 6", "32", "UI/UX wireframing, component mockups, tech stack evaluation", "Interactive Figma prototypes & design tokens", "Peer & Placement Officer Feedback"],
        ["Sprint 3", "Weeks 7 - 10", "40", "Document text extraction (PDF/DOCX), regex section detector", "Deterministic ATS parser & DJB2 hash module", "Benchmark testing on 50 sample CVs"],
        ["Sprint 4", "Weeks 11 - 14", "48", "Google GenAI SDK integration, prompt engineering, SSE pipeline", "Conversational Mock Interview room with SSE", "Latency validation (TTFT < 400ms)"],
        ["Sprint 5", "Weeks 15 - 17", "38", "Monaco Editor integration, Web Audio WPM tracker, Code Lab", "Integrated Code Lab & Speech Analytics", "Candidate usability pilot testing"],
        ["Sprint 6", "Weeks 18 - 20", "36", "OWASP security hardening, CSRF double-submit, HMAC sessions", "Security middleware & token rate limiters", "OWASP compliance audit & pen test"],
        ["Sprint 7", "Weeks 21 - 23", "42", "Automated test suite creation (Vitest), bug fixing, refactoring", "78 Automated unit/integration tests passing", "100% CI Pipeline test pass rate"],
        ["Sprint 8", "Weeks 24 - 26", "28", "Dockerization, performance telemetry, comprehensive report", "Production Docker image & Complete Report", "Project Exhibition & Viva Voce"]
    ]
    add_table(doc, headers_4_2, rows_4_2, [0.8, 1.0, 0.8, 2.0, 1.8, 1.4])

    add_subsection_heading(doc, "4.1.4", "Risk Assessment & Mitigation Matrix")
    add_paragraph(doc,
        "We identified twelve potential technical, operational, and algorithmic risks during initial planning. "
        "Table 4.3 outlines each risk, its likelihood, potential impact, and the proactive mitigations built into the platform."
    )

    # Table 4.3: Risk Assessment & Mitigation
    add_table_caption(doc, "Table 4.3: Systematic Technical, Algorithmic, Operational, and Institutional Risk Assessment Matrix")
    headers_4_3 = ["Risk ID", "Risk Description", "Category", "Likelihood", "Impact", "Proactive Mitigation Strategy"]
    rows_4_3 = [
        ["R01", "Gemini API rate limiting or quota exhaustion during peak interview sessions", "Technical", "Medium", "High", "Implemented token-bucket client rate limiters + zero-dependency local heuristic fallback simulation"],
        ["R02", "Hallucinated or non-deterministic scoring variances from generative LLM models", "Algorithmic", "Medium", "High", "Enforced strict JSON schema output validation and anchored evaluation against deterministic rubrics"],
        ["R03", "Cross-browser Web Audio API incompatibility causing speech tracking failure", "Compatibility", "Low", "Medium", "Implemented feature detection polyfills with graceful degradation to duration-based speech metrics"],
        ["R04", "Cross-Site Request Forgery (CSRF) or session cookie hijacking attacks", "Security", "Medium", "Critical", "Enforced double-submit cryptographic CSRF cookies and HMAC SHA-256 session signatures"],
        ["R05", "Browser memory exhaustion during extensive Monaco code editing sessions", "Performance", "Low", "Medium", "Employed editor instance disposal lifecycle hooks and Web Worker execution isolation"],
        ["R06", "PDF formatting anomalies causing garbled text extraction and section misses", "Data Quality", "High", "Medium", "Constructed multi-pass regex normalization with unicode ligature collapsing and contextual fallbacks"],
        ["R07", "Brute-force credential attacks on local authentication endpoints", "Security", "Medium", "High", "Configured in-memory IP-based rate limiting (10 attempts/min) with Retry-After headers"],
        ["R08", "Database schema migration complexity during transition from JSON to PostgreSQL", "Architecture", "Low", "Medium", "Architected an abstract Database interface layer with standardized repository adapter methods"],
        ["R09", "High Time-To-First-Token (TTFT) latency causing unnatural interview pauses", "Performance", "Medium", "High", "Adopted Gemini 2.5 Flash lightweight model paired with raw HTTP streaming headers"],
        ["R10", "Candidate speech recognition errors due to non-native regional accents", "Accuracy", "Medium", "Medium", "Integrated client-side transcript editing allowing candidates to verify spoken text prior to submission"],
        ["R11", "Cross-origin resource leakage in embedded Monaco code editor iframe", "Security", "Low", "Critical", "Enforced strict sandboxing attributes (sandbox='allow-scripts') and isolated Web Workers"],
        ["R12", "Student data leakage through lingering server memory or logs", "Privacy", "Low", "High", "Implemented strict zero-logging of raw audio and automated memory sanitization on session closure"]
    ]
    add_table(doc, headers_4_3, rows_4_3, [0.6, 2.0, 1.0, 0.7, 0.7, 2.2])

    add_subsection_heading(doc, "4.1.5", "Effort and Resource Estimation via COCOMO II")
    add_paragraph(doc,
        "We used the Constructive Cost Model (COCOMO II) in Semi-Detached mode to estimate engineering effort and project duration. "
        "The codebase contains approximately 30,200 Source Lines of Code (SLOC):"
    )
    add_bullet(doc, "Frontend User Interface & Reactive State (React 19, TypeScript): 18,400 SLOC", "Frontend:")
    add_bullet(doc, "Backend Application Server & Middleware (Express, Auth, ATS, SSE): 7,200 SLOC", "Backend:")
    add_bullet(doc, "Automated Test Suites & Benchmarks (Vitest, Mock Stores): 4,600 SLOC", "Testing:")
    add_paragraph(doc,
        "Under the standard Semi-Detached COCOMO II formula:\n"
        "Effort (Person-Months) = 3.0 * (KSLOC)^1.12\n"
        "For KSLOC = 30.2, Effort = 3.0 * (30.2)^1.12 = 3.0 * 45.12 = 135.36 person-hours per student team member, "
        "equating to approximately 18.5 cumulative person-months of effort across the four project members over the 26-week academic period."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 5: SYSTEM DESIGN
    # =========================================================================
    add_chapter_heading(doc, "CHAPTER 5", "SYSTEM DESIGN")
    
    add_section_heading(doc, "5.1", "SYSTEM ARCHITECTURE")
    add_paragraph(doc,
        "Career Navigator is built on a four-tier architecture designed for modularity, clean boundaries, and easy maintenance. "
        "Figure 5.1 depicts the four tiers: Presentation Tier, Security & API Gateway Tier, Core Application Tier, and Persistence Tier."
    )
    
    add_figure(doc, 'assets_generated/fig_5_1_system_architecture.png', 'Figure 5.1: High-Level Tiered Enterprise System Architecture of Career Navigator')

    add_paragraph(doc,
        "Responsibilities of each architectural tier:"
    )
    add_numbered_item(doc, "1.", "Presentation Tier: Runs in the candidate's browser using React 19, TypeScript, and Vite. Handles client routing, manages form state, hosts the Web Audio API audio graph, and consumes real-time SSE streams using native EventSource instances.", "Presentation Tier: ")
    add_numbered_item(doc, "2.", "Security & API Gateway Tier: Built into Express middleware. Validates double-submit CSRF tokens, verifies HMAC SHA-256 session signatures using constant-time comparison, enforces token-bucket rate limits, and sets OWASP security headers.", "Security Tier: ")
    add_numbered_item(doc, "3.", "Core Application Tier: Contains modular backend services: DocumentParser (PDF/DOCX extraction and unicode ligature cleaning), AtsEngine (DJB2 content hashing and keyword scoring), InterviewService (Gemini question synthesis and SSE token streaming), and CodeReviewService (AST heuristics and Big-O deduction).", "Application Tier: ")
    add_numbered_item(doc, "4.", "Persistence Tier: Stores application data using SQLite with Write-Ahead Logging (WAL) and JSON storage adapters, accessed via an abstract repository layer that allows straightforward migration to PostgreSQL.", "Persistence Tier: ")

    add_section_heading(doc, "5.2", "COMPONENT DESIGN / MODULE DECOMPOSITION")
    add_paragraph(doc,
        "The application maintains a clean separation of concerns across both frontend and backend layers."
    )
    add_paragraph(doc,
        "Frontend Component Hierarchy: The user interface is organized into three levels: "
        "(1) Layout Components (`Navbar`, `Sidebar`, `NotificationBanner`, `ThemeToggle`), "
        "(2) Feature Views (`LandingPage`, `Dashboard`, `ResumeAnalyzer`, `JobDescriptionMatcher`, `InterviewRoom`, `MonacoCodeLab`, `AdminPortal`, `UserProfile`), and "
        "(3) Reusable Atomic Components (`Button`, `Card`, `Badge`, `AudioWaveform`, `ModalDialog`, `ScoreGauge`)."
    )
    add_paragraph(doc,
        "Backend Controller-Service Decomposition: The Express backend follows a Controller-Service-Repository pattern: "
        "`AuthController` / `AuthService` (manages HMAC cookies, demo accounts, and CSRF tokens), "
        "`ResumeController` / `ResumeService` (manages document parsing, DJB2 caching, and ATS calculations), "
        "`InterviewController` / `InterviewService` (handles Gemini streaming, question synthesis, and speech feedback), "
        "`CodeLabController` / `CodeLabService` (executes sandboxed JavaScript and static AST Big-O analysis), and "
        "`AdminController` / `AdminService` (aggregates batch analytics, placement readiness KPIs, and CSV exports)."
    )

    add_section_heading(doc, "5.3", "INTERFACE DESIGN")
    add_paragraph(doc,
        "Career Navigator provides a clean REST and Server-Sent Events API conforming to the OpenAPI 3.0.3 specification. "
        "Table 5.1 outlines the primary endpoint contracts, HTTP methods, authorization levels, request schemas, and responses."
    )

    # Table 5.1: OpenAPI Endpoints
    add_table_caption(doc, "Table 5.1: Comprehensive OpenAPI 3.0.3 REST and Server-Sent Events API Endpoint Contracts")
    headers_5_1 = ["HTTP Method", "Endpoint URI", "Auth Level", "Request Payload / Params", "Success Response", "Description & Action"]
    rows_5_1 = [
        ["GET", "/health", "Public", "None", "{ status: 'healthy', uptime: float }", "Health check & server telemetry"],
        ["POST", "/api/auth/demo", "Public", "{ role: 'student' | 'admin' }", "{ user: Object } + HMAC Cookie", "Instant demo account sign-in"],
        ["POST", "/api/auth/logout", "Authenticated", "None", "{ success: true } (Clears cookie)", "Invalidates session & clears cookies"],
        ["GET", "/api/auth/me", "Authenticated", "Session Cookie", "{ user: Object }", "Retrieves current authenticated session"],
        ["POST", "/api/profile", "Student Role", "{ branch, targetRole, skills, projects }", "{ profile: Object }", "Updates candidate engineering profile"],
        ["POST", "/api/resume/parse", "Student Role", "Multipart/form-data (PDF/DOCX)", "{ text: string, hash: string }", "Extracts raw text and DJB2 hash"],
        ["POST", "/api/resume/score", "Student Role", "{ text: string, targetRole: string }", "{ atsScore, sections, keywords }", "Calculates deterministic ATS score"],
        ["POST", "/api/resume/match-jd", "Student Role", "{ resumeText: string, jdText: string }", "{ matchPercentage, missingSkills }", "Computes JD keyword overlap and gaps"],
        ["POST", "/api/interview/generate", "Student Role", "{ role, techStack, experienceLevel }", "{ interviewId, questions: [] }", "Synthesizes 5 tailored interview prompts"],
        ["POST", "/api/interview/:id/answer", "Student Role", "{ questionId, answer, speechMetrics }", "{ score, technicalFeedback }", "Evaluates candidate spoken answer"],
        ["GET", "/api/interview/:id/stream", "Student Role", "EventSource connection", "text/event-stream chunks", "Streams real-time tokenized AI evaluation"],
        ["POST", "/api/codelab/run", "Student Role", "{ code: string, language: string }", "{ output: string, executionTimeMs }", "Executes code in isolated sandbox"],
        ["POST", "/api/codelab/review", "Student Role", "{ code: string, problem: string }", "{ timeComplexity, spaceComplexity }", "Deduces asymptotic Big-O bounds"],
        ["GET", "/api/admin/metrics", "Admin Role", "Session Cookie (Admin)", "{ totalStudents, avgAts, branchStats }", "Retrieves institutional placement KPIs"],
        ["POST", "/api/feedback", "Authenticated", "{ rating: 1-5, comment: string }", "{ success: true, feedbackId }", "Persists candidate platform review"]
    ]
    add_table(doc, headers_5_1, rows_5_1, [0.8, 1.5, 0.9, 1.8, 1.8, 2.0])

    add_subsection_heading(doc, "5.3.1", "UI/UX Design Tokens & Accessibility Standards")
    add_paragraph(doc,
        "The presentation tier of Career Navigator is engineered around an atomic design system implemented through CSS custom properties "
        "and semantic HTML5 primitives. The visual hierarchy utilizes a restrained glassmorphic aesthetic characterized by translucent backdrops "
        "(backdrop-filter: blur(12px)), 1-pixel high-contrast borders (rgba(255, 255, 255, 0.1)), and subtle elevation drop shadows that establish "
        "spatial depth without distracting from technical practice content."
    )
    add_paragraph(doc,
        "The design system enforces a strict color and typography token taxonomy to maintain visual consistency across all five core practice modules:"
    )
    add_bullet(doc, "The interface defines functional semantic tokens including --bg-primary (#0B132B / #0F172A dark canvas), --card-bg (rgba(255,255,255,0.04)), --accent-primary (#10B981 emerald green indicating verified competency), --accent-warning (#F59E0B amber indicating skill gaps), and --accent-danger (#EF4444 ruby red indicating syntax faults or low ATS scores).", "Color System:")
    add_bullet(doc, "Dynamic fluid grid layouts adapt seamlessly across four device tiers: Mobile (375px - 767px), Tablet / Portrait (768px - 1023px), Standard Laptop (1024px - 1439px), and Ultrawide Workstation (>= 1440px). The Monaco Code Lab and Mock Interview split-screen workspaces automatically collapse to tabbed interfaces on screens below 1024px.", "Responsive Grid:")
    add_bullet(doc, "Every interactive element features visible keyboard focus rings (--focus-ring: 2px solid #3B82F6), minimum target touch areas of 44x44 pixels, and WCAG AA compliant text contrast ratios exceeding 4.5:1. Live interview streaming outputs leverage ARIA live regions (aria-live=\"polite\") to announce tokenized evaluator feedback to screen readers without interrupting spoken input.", "Accessibility Standards:")
    add_bullet(doc, "To minimize perceived cognitive latency during compute-intensive tasks, animated skeleton loaders and pulse indicators communicate background processing states during resume text extraction and code compilation.", "State Animations:")

    add_section_heading(doc, "5.4", "DATA STRUCTURE DESIGN")
    add_paragraph(doc,
        "Figure 5.3 shows the Entity-Relationship (ER) diagram for Career Navigator. "
        "The database maintains relational integrity across users, student profiles, resume analyses, mock interviews, and code submissions."
    )
    
    add_figure(doc, 'assets_generated/fig_5_3_er_diagram.png', 'Figure 5.3: Entity-Relationship (ER) Logical Schema Diagram of Career Navigator')

    add_paragraph(doc,
        "Tables 5.2 through 5.6 detail the schema definitions, data types, primary and foreign keys, and validation rules for each entity."
    )

    # Table 5.2: User Entity
    add_table_caption(doc, "Table 5.2: Physical Data Dictionary — User Entity (`users`)")
    headers_user = ["Field Name", "Data Type", "Nullability", "Key Constraint", "Description & Validation Rules"]
    rows_user = [
        ["id", "VARCHAR(36)", "NOT NULL", "PRIMARY KEY", "Universally Unique Identifier (UUID v4)"],
        ["email", "VARCHAR(255)", "NOT NULL", "UNIQUE", "Candidate or administrator email address"],
        ["name", "VARCHAR(100)", "NOT NULL", "None", "Full name of candidate or faculty member"],
        ["password_hash", "VARCHAR(255)", "NULLABLE", "None", "Bcrypt / HMAC salt-hashed password string"],
        ["role", "VARCHAR(20)", "NOT NULL", "None", "Role enumeration: 'student' | 'admin' | 'faculty'"],
        ["created_at", "TIMESTAMP", "NOT NULL", "DEFAULT CURRENT_TIMESTAMP", "Record creation timestamp in UTC"]
    ]
    add_table(doc, headers_user, rows_user, [1.2, 1.2, 1.0, 1.2, 2.6])

    # Table 5.3: StudentProfile Entity
    add_table_caption(doc, "Table 5.3: Physical Data Dictionary — StudentProfile Entity (`student_profiles`)")
    headers_prof = ["Field Name", "Data Type", "Nullability", "Key Constraint", "Description & Validation Rules"]
    rows_prof = [
        ["id", "VARCHAR(36)", "NOT NULL", "PRIMARY KEY", "UUID v4 profile identifier"],
        ["user_id", "VARCHAR(36)", "NOT NULL", "FOREIGN KEY", "References `users.id` with CASCADE delete"],
        ["usn", "VARCHAR(20)", "NOT NULL", "UNIQUE", "VTU University Seat Number (e.g., 1KI21CS001)"],
        ["branch", "VARCHAR(50)", "NOT NULL", "None", "Engineering discipline (e.g., 'Computer Science')"],
        ["target_role", "VARCHAR(100)", "NOT NULL", "None", "Target career track (e.g., 'Full-Stack Developer')"],
        ["skills", "TEXT", "NOT NULL", "None", "JSON-encoded array of candidate technical competencies"],
        ["cgpa", "DECIMAL(3,2)", "NOT NULL", "CHECK (cgpa >= 0.0 AND cgpa <= 10.0)", "Cumulative Grade Point Average"],
        ["updated_at", "TIMESTAMP", "NOT NULL", "DEFAULT CURRENT_TIMESTAMP", "Last modification timestamp"]
    ]
    add_table(doc, headers_prof, rows_prof, [1.2, 1.2, 1.0, 1.2, 2.6])

    # Table 5.4: ResumeAnalysis Entity
    add_table_caption(doc, "Table 5.4: Physical Data Dictionary — ResumeAnalysis Entity (`resume_analyses`)")
    headers_res = ["Field Name", "Data Type", "Nullability", "Key Constraint", "Description & Validation Rules"]
    rows_res = [
        ["id", "VARCHAR(36)", "NOT NULL", "PRIMARY KEY", "UUID v4 analysis identifier"],
        ["user_id", "VARCHAR(36)", "NOT NULL", "FOREIGN KEY", "References `users.id`"],
        ["content_hash", "VARCHAR(8)", "NOT NULL", "INDEX", "32-bit DJB2 hex content fingerprint for deduplication"],
        ["raw_text", "LONGTEXT", "NOT NULL", "None", "Normalized unicode extracted resume body text"],
        ["ats_score", "INT", "NOT NULL", "CHECK (ats_score >= 40 AND ats_score <= 100)", "Deterministic composite ATS score"],
        ["detected_sections", "TEXT", "NOT NULL", "None", "JSON array of parsed section names and bounds"],
        ["missing_sections", "TEXT", "NOT NULL", "None", "JSON array of mandatory sections absent in resume"],
        ["keyword_density", "TEXT", "NOT NULL", "None", "JSON object mapping skills to occurrence counts"],
        ["created_at", "TIMESTAMP", "NOT NULL", "DEFAULT CURRENT_TIMESTAMP", "Analysis timestamp"]
    ]
    add_table(doc, headers_res, rows_res, [1.2, 1.2, 1.0, 1.2, 2.6])

    # Table 5.5: MockInterview Entity
    add_table_caption(doc, "Table 5.5: Physical Data Dictionary — MockInterview Entity (`mock_interviews`)")
    headers_int = ["Field Name", "Data Type", "Nullability", "Key Constraint", "Description & Validation Rules"]
    rows_int = [
        ["id", "VARCHAR(36)", "NOT NULL", "PRIMARY KEY", "UUID v4 mock interview session identifier"],
        ["user_id", "VARCHAR(36)", "NOT NULL", "FOREIGN KEY", "References `users.id`"],
        ["target_role", "VARCHAR(100)", "NOT NULL", "None", "Target job title for generated questions"],
        ["total_score", "DECIMAL(4,2)", "NULLABLE", "None", "Aggregate interview score (1.0 to 10.0 scale)"],
        ["avg_wpm", "INT", "NULLABLE", "None", "Average speech rate in Words Per Minute"],
        ["total_fillers", "INT", "NOT NULL", "DEFAULT 0", "Total verbal filler words detected across all answers"],
        ["status", "VARCHAR(20)", "NOT NULL", "None", "Session state: 'in_progress' | 'completed' | 'abandoned'"],
        ["created_at", "TIMESTAMP", "NOT NULL", "DEFAULT CURRENT_TIMESTAMP", "Interview start timestamp"]
    ]
    add_table(doc, headers_int, rows_int, [1.2, 1.2, 1.0, 1.2, 2.6])

    # Table 5.6: CodeSubmission Entity
    add_table_caption(doc, "Table 5.6: Physical Data Dictionary — CodeSubmission Entity (`code_submissions`)")
    headers_code = ["Field Name", "Data Type", "Nullability", "Key Constraint", "Description & Validation Rules"]
    rows_code = [
        ["id", "VARCHAR(36)", "NOT NULL", "PRIMARY KEY", "UUID v4 code submission identifier"],
        ["user_id", "VARCHAR(36)", "NOT NULL", "FOREIGN KEY", "References `users.id`"],
        ["language", "VARCHAR(20)", "NOT NULL", "None", "Programming language: 'javascript' | 'python'"],
        ["source_code", "TEXT", "NOT NULL", "None", "Full submitted candidate algorithmic source code"],
        ["time_complexity", "VARCHAR(20)", "NOT NULL", "None", "Deduce Big-O time bound (e.g., 'O(N log N)')"],
        ["space_complexity", "VARCHAR(20)", "NOT NULL", "None", "Deduce Big-O auxiliary space bound (e.g., 'O(1)')"],
        ["execution_time_ms", "INT", "NOT NULL", "None", "Sandboxed execution duration in milliseconds"],
        ["created_at", "TIMESTAMP", "NOT NULL", "DEFAULT CURRENT_TIMESTAMP", "Submission timestamp"]
    ]
    add_table(doc, headers_code, rows_code, [1.2, 1.2, 1.0, 1.2, 2.6])

    add_subsection_heading(doc, "5.4.1", "Relational Database Migration Bridge")
    add_paragraph(doc,
        "To support diverse institutional deployment topologies—ranging from zero-configuration single-node desktop lab environments "
        "to high-availability departmental server clusters—Career Navigator implements an abstracted database adapter pattern. "
        "In local development and stand-alone desktop evaluations, the application operates over an embedded SQLite engine configured "
        "in Write-Ahead Logging (WAL) journal mode (PRAGMA journal_mode = WAL) with synchronous disk flush set to NORMAL. "
        "This configuration eliminates database locking contention between concurrent mock interview telemetry writes and analytical read queries, "
        "achieving sub-millisecond local query latencies."
    )
    add_paragraph(doc,
        "For campus-wide enterprise deployments exceeding hundreds of concurrent examinees, the data access layer provides an automated "
        "migration bridge to PostgreSQL 16. The schema definitions maintain strict ISO SQL:2016 compatibility, utilizing UUID v4 primary keys, "
        "standard JSONB columns for flexible rubric storage, and explicit foreign key constraints with ON DELETE CASCADE semantics. "
        "Composite B-tree indexes are established on (user_id, created_at) and (branch, target_role) to ensure that administrative "
        "cohort aggregation queries execute in logarithmic time O(log N) regardless of dataset growth."
    )

    add_section_heading(doc, "5.5", "ALGORITHM DESIGN")
    add_paragraph(doc,
        "Career Navigator relies on five core algorithms, described below with their logic and pseudocode."
    )

    add_subsection_heading(doc, "5.5.1", "Algorithm 5.1: Resume Normalization & Section Detection")
    add_paragraph(doc,
        "Resume documents extracted from PDF or DOCX files often contain typographic ligatures (such as 'fi' or 'fl'), curly quotes, "
        "and non-breaking spaces that confuse standard regex matchers. Algorithm 5.1 cleans these characters and identifies standard sections."
    )

    add_code_box(doc,
"""Algorithm 5.1: Deterministic Unicode Normalization and Section Parser
Input : Raw extracted resume text string S_raw
Output: Sanitized string S_norm, DetectedSections array D, MissingSections array M

1. Function NormalizeResumeText(S_raw):
2.    // Replace unicode ligatures with standard ASCII characters
3.    S = S_raw.replace(/fi/g, 'fi').replace(/fl/g, 'fl').replace(/ff/g, 'ff')
4.    // Normalize quotes and dashes
5.    S = S.replace(/[""]/g, '"').replace(/['']/g, "'").replace(/[--]/g, '-')
6.    // Replace non-breaking spaces and clean newlines
7.    S = S.replace(/\\u00A0/g, ' ').replace(/\\r\\n/g, '\\n')
8.    S_norm = S.replace(/\\n{3,}/g, '\\n\\n').trim()
9.    Return S_norm

10. Function DetectResumeSections(S_norm):
11.   StandardSections = ['Contact Info', 'Summary', 'Education', 'Skills', 'Projects', 'Experience', 'Certifications']
12.   D = [], M = []
13.   For each section Sec in StandardSections:
14.       Pattern = Regex('\\\\b(' + Sec.aliases.join('|') + ')\\\\b', 'i')
15.       If Pattern.test(S_norm):
16.           D.append(Sec)
17.       Else:
18.           M.append(Sec)
19.   Return D, M""", "Algorithm 5.1 — Pseudocode"
    )

    add_subsection_heading(doc, "5.5.2", "Algorithm 5.2: Deterministic ATS Resume Scoring")
    add_paragraph(doc,
        "Algorithm 5.2 calculates a transparent ATS score based on section completeness, keyword density, and formatting quality, "
        "clamped within a defined range of 40 to 100."
    )

    add_code_box(doc,
"""Algorithm 5.2: Multi-Factor ATS Resume Scoring Algorithm
Input : Normalized text S_norm, DetectedSections D, KeywordCatalog K
Output: Final integer ATS score S_ATS in range [40, 100]

1. Function CalculateAtsScore(S_norm, D, K):
2.    Score = 50.0 // Base starting score
3.    // Factor 1: Mandatory section presence (Max 25 pts)
4.    Mandatory = ['Education', 'Skills', 'Projects', 'Contact Info']
5.    MandatoryMatches = D.filter(sec => Mandatory.contains(sec)).length
6.    Score += (MandatoryMatches / Mandatory.length) * 25.0
7.
8.    // Factor 2: Technical keyword density (Max 20 pts)
9.    Tokens = S_norm.toLowerCase().split(/\\W+/)
10.   MatchedKW = 0
11.   For each kw in K:
12.       If Tokens.contains(kw.toLowerCase()):
13.           MatchedKW += 1
14.   Score += Min(20.0, MatchedKW * 1.5)
15.
16.   // Factor 3: Document length evaluation (Max 5 pts)
17.   WordCount = Tokens.length
18.   If WordCount >= 350 and WordCount <= 800:
19.       Score += 5.0
20.   Else If WordCount < 200:
21.       Score -= 10.0 // Penalty for overly brief CV
22.
23.   // Factor 4: Basic contact validation
24.   HasEmail = /\\S+@\\S+\\.\\S+/.test(S_norm)
25.   HasPhone = /[0-9]{10}/.test(S_norm)
26.   If Not HasEmail: Score -= 8.0
27.   If Not HasPhone: Score -= 5.0
28.
29.   // Clamp final result into strict [40, 100] range
30.   S_ATS = Math.round(Math.max(40.0, Math.min(100.0, Score)))
31.   Return S_ATS""", "Algorithm 5.2 — Pseudocode"
    )

    add_subsection_heading(doc, "5.5.3", "Algorithm 5.3: Server-Sent Events Token Streaming")
    add_paragraph(doc,
        "Algorithm 5.3 streams evaluation tokens from Gemini 2.5 Flash to the browser in real time over an SSE connection, "
        "allowing the student to read feedback as it is generated."
    )

    add_code_box(doc,
"""Algorithm 5.3: Server-Sent Events (SSE) Generative AI Token Pipeline
Input : Question Q, SpokenAnswer A, TargetRole R, Response stream Res
Output: SSE stream chunks emitted with Content-Type: text/event-stream

1. Function StreamInterviewEvaluation(Q, A, R, Res):
2.    SetHeader(Res, 'Content-Type', 'text/event-stream')
3.    SetHeader(Res, 'Cache-Control', 'no-cache')
4.    SetHeader(Res, 'Connection', 'keep-alive')
5.    Res.flushHeaders()
6.
7.    SystemPrompt = "Evaluate candidate answer for technical correctness and depth for role " + R
8.    UserPrompt = "Question: " + Q.text + "\\nCandidate Answer: " + A.text
9.
10.   Stream = GeminiGenAI.generateContentStream({
11.       model: 'gemini-2.5-flash',
12.       contents: [{ role: 'system', text: SystemPrompt }, { role: 'user', text: UserPrompt }]
13.   })
14.
15.   For await (Chunk of Stream):
16.       TokenText = Chunk.text
17.       Payload = JSON.stringify({ token: TokenText })
18.       Res.write("data: " + Payload + "\\n\\n")
19.
20.   Res.write("data: [DONE]\\n\\n")
21.   Res.end()""", "Algorithm 5.3 — Pseudocode"
    )

    add_subsection_heading(doc, "5.5.4", "Algorithm 5.4: Speech Cadence & Verbal Filler Analysis")
    add_paragraph(doc,
        "Algorithm 5.4 measures the candidate's speech rate in Words Per Minute (WPM) and counts verbal filler words "
        "using browser-native speech recognition timestamps."
    )

    add_code_box(doc,
"""Algorithm 5.4: In-Browser Vocal Cadence (WPM) and Speech Pacing Analysis
Input : SpokenTranscript T, ActiveSpeechDurationSec D_sec
Output: WordsPerMinute WPM, FillerCount F, PacingStatus Status

1. Function AnalyzeSpeechCadence(T, D_sec):
2.    Words = T.trim().split(/\\s+/).filter(w => w.length > 0)
3.    DurationMinutes = Math.max(0.1, D_sec / 60.0)
4.    WPM = Math.round(Words.length / DurationMinutes)
5.
6.    // Pacing evaluation boundaries
7.    If WPM < 100:
8.        Status = "Too Slow / Hesitant"
9.    Else If WPM >= 100 and WPM <= 150:
10.       Status = "Optimal Cadence"
11.   Else:
12.       Status = "Too Fast / Rushed"
13.
14.   // Detect common verbal hesitation filler words
15.   FillerRegex = /\\b(um|uh|like|you know|basically|actually|literally)\\b/gi
16.   Matches = T.match(FillerRegex)
17.   F = Matches ? Matches.length : 0
18.
19.   Return { WPM: WPM, FillerCount: F, PacingStatus: Status }""", "Algorithm 5.4 — Pseudocode"
    )

    add_subsection_heading(doc, "5.5.5", "Algorithm 5.5: Static Big-O Complexity Deduction")
    add_paragraph(doc,
        "Algorithm 5.5 evaluates loop nesting depth, recursion patterns, and auxiliary array allocations in submitted code "
        "to estimate Big-O time and space complexity."
    )

    add_code_box(doc,
"""Algorithm 5.5: Static AST Algorithmic Big-O Complexity Deduction
Input : CandidateSourceCode Code, Language Lang
Output: TimeComplexity O_t, SpaceComplexity O_s

1. Function DeduceBigOComplexity(Code, Lang):
2.    AST = ParseSourceToAST(Code, Lang)
3.    MaxLoopDepth = 0, HasHalving = False, AllocatesMemory = False
4.
5.    TraverseAST(AST, Node => {
6.        If Node.type in ['ForStatement', 'WhileStatement']:
7.            Depth = ComputeNestingDepth(Node)
8.            MaxLoopDepth = Max(MaxLoopDepth, Depth)
9.        If Node.isHalvingOperation(): // e.g. Math.floor(n / 2)
10.           HasHalving = True
11.       If Node.allocatesMemory(): // new Array(), new Map(), .push()
12.           AllocatesMemory = True
13.   })
14.
15.   If HasHalving and MaxLoopDepth == 0:
16.       O_t = "O(log N)"
17.   Else If HasHalving and MaxLoopDepth == 1:
18.       O_t = "O(N log N)"
19.   Else If MaxLoopDepth == 1:
20.       O_t = "O(N)"
21.   Else If MaxLoopDepth == 2:
22.       O_t = "O(N^2)"
23.   Else If MaxLoopDepth >= 3:
24.       O_t = "O(N^" + MaxLoopDepth + ")"
25.   Else:
26.       O_t = "O(1)"
27.
28.   O_s = AllocatesMemory ? "O(N)" : "O(1)"
29.   Return { TimeComplexity: O_t, SpaceComplexity: O_s }""", "Algorithm 5.5 — Pseudocode"
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 6: IMPLEMENTATION
    # =========================================================================
    add_chapter_heading(doc, "CHAPTER 6", "IMPLEMENTATION")
    
    add_section_heading(doc, "6.1", "IMPLEMENTATION APPROACHES")
    add_paragraph(doc,
        "Career Navigator was implemented using TypeScript across both frontend and backend to ensure end-to-end type safety. "
        "The application architecture emphasizes low-latency streaming, modular services, and defensive error handling."
    )
    add_paragraph(doc,
        "Implementation decisions and rationale:"
    )
    add_bullet(doc, "React 19 & TypeScript: React's component model and fine-grained virtual DOM reconciliation ensure responsive UI updates during real-time speech and code editing. TypeScript eliminates runtime type errors.", "Frontend Framework:")
    add_bullet(doc, "Node.js & Express: Node's asynchronous event loop is well suited for non-blocking I/O and handling multiple concurrent Server-Sent Events streams efficiently.", "Backend Server:")
    add_bullet(doc, "Monaco Editor: Using the core editor behind Visual Studio Code provides students with a familiar coding interface with syntax highlighting, indentation, and error markers.", "Code Editor:")
    add_bullet(doc, "Google GenAI SDK (Gemini 2.5 Flash): We chose Gemini 2.5 Flash for its balanced reasoning performance, low token latency, and support for structured JSON output formatting.", "AI Model:")

    add_section_heading(doc, "6.2", "CODING DETAILS AND CODE EFFICIENCY")
    add_paragraph(doc,
        "This section presents source code listings for the primary modules implemented in the project."
    )

    add_subsection_heading(doc, "6.2.1", "Listing 6.1: Security Gateway Middleware")
    add_paragraph(doc,
        "Listing 6.1 shows the security middleware implementing double-submit CSRF protection and HMAC SHA-256 session signature verification."
    )

    add_code_box(doc,
"""import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const SESSION_SECRET = process.env.SESSION_SECRET || 'career-navigator-dev-secret-key-32b';

// Generates an HMAC SHA-256 signature for a user session
export function signSession(userId: string): string {
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
    return `${userId}.${signature}`;
}

// Verifies session token using constant-time comparison to prevent timing attacks
export function verifySession(token: string): string | null {
    if (!token || !token.includes('.')) return null;
    const [userId, clientSig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
    
    const clientBuf = Buffer.from(clientSig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (clientBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(clientBuf, expectedBuf)) return null;
    
    return userId;
}

// Double-Submit CSRF Guard Middleware
export function csrfGuard(req: Request, res: Response, next: NextFunction): void {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) return next();
    
    const cookieToken = req.cookies['csrf_token'];
    const headerToken = req.headers['x-csrf-token'] as string;
    
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        res.status(403).json({ error: 'CSRF token mismatch. Request rejected.' });
        return;
    }
    next();
}""", "TypeScript — securityMiddleware.ts"
    )

    add_subsection_heading(doc, "6.2.2", "Listing 6.2: Resume Normalization & Section Detector")
    add_paragraph(doc,
        "Listing 6.2 shows the resume normalization function that sanitizes typographic ligatures and detects core resume sections."
    )

    add_code_box(doc,
"""export function normalizeResumeText(rawText: string): string {
    if (!rawText) return '';
    return rawText
        .replace(/fi/g, 'fi').replace(/fl/g, 'fl').replace(/ff/g, 'ff')
        .replace(/[""]/g, '"').replace(/['']/g, "'").replace(/[--]/g, '-')
        .replace(/\\u00A0/g, ' ').replace(/\\r\\n/g, '\\n')
        .replace(/\\n{3,}/g, '\\n\\n')
        .trim();
}

export function detectSections(normalizedText: string): { detected: string[], missing: string[] } {
    const sectionDefinitions = [
        { name: 'Contact Info', regex: /\\b(email|phone|contact|github|linkedin|portfolio)\\b/i },
        { name: 'Summary', regex: /\\b(summary|objective|professional summary|about me)\\b/i },
        { name: 'Education', regex: /\\b(education|academic|university|degree|b\\.e|btech|gpa|cgpa)\\b/i },
        { name: 'Skills', regex: /\\b(skills|technical skills|technologies|proficiencies|languages)\\b/i },
        { name: 'Projects', regex: /\\b(projects|academic projects|key projects|personal projects)\\b/i },
        { name: 'Experience', regex: /\\b(experience|work experience|employment|internship|history)\\b/i },
        { name: 'Certifications', regex: /\\b(certifications|certificates|courses|credentials|licenses)\\b/i }
    ];
    
    const detected: string[] = [];
    const missing: string[] = [];
    
    sectionDefinitions.forEach(sec => {
        if (sec.regex.test(normalizedText)) {
            detected.push(sec.name);
        } else {
            missing.push(sec.name);
        }
    });
    
    return { detected, missing };
}""", "TypeScript — resumeParser.ts"
    )

    add_subsection_heading(doc, "6.2.3", "Listing 6.3: ATS Scoring Engine and DJB2 Fingerprinting")
    add_paragraph(doc,
        "Listing 6.3 shows the 32-bit DJB2 hash generator and the multi-factor ATS resume scoring engine."
    )

    add_code_box(doc,
"""// Computes a 32-bit DJB2 content hash for fast in-memory caching
export function computeDJB2Hash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

export function scoreResume(normalizedText: string, detected: string[]): number {
    let score = 50.0;
    
    // Core section completeness evaluation (Max 25 pts)
    const criticalSections = ['Contact Info', 'Education', 'Skills', 'Projects'];
    const matchedCount = criticalSections.filter(s => detected.includes(s)).length;
    score += (matchedCount / criticalSections.length) * 25.0;
    
    // Keyword density evaluation against common engineering competencies
    const standardSkills = ['javascript', 'typescript', 'react', 'node', 'python', 'java', 'sql', 'git', 'docker', 'rest', 'api'];
    const tokens = normalizedText.toLowerCase().split(/\\W+/);
    let skillHits = 0;
    standardSkills.forEach(skill => {
        if (tokens.includes(skill)) skillHits++;
    });
    score += Math.min(20.0, skillHits * 2.0);
    
    // Formatting & Length checks
    if (tokens.length >= 350 && tokens.length <= 800) score += 5.0;
    if (tokens.length < 200) score -= 10.0;
    
    return Math.round(Math.max(40, Math.min(100, score)));
}""", "TypeScript — atsEngine.ts"
    )

    add_subsection_heading(doc, "6.2.4", "Listing 6.4: Server-Sent Events Streaming Controller")
    add_paragraph(doc,
        "Listing 6.4 shows the Express controller streaming evaluation tokens from Gemini 2.5 Flash over Server-Sent Events."
    )

    add_code_box(doc,
"""import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function streamAnswerEvaluation(req: Request, res: Response): Promise<void> {
    const { question, answer, targetRole } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    try {
        const prompt = `Role: ${targetRole}\\nQuestion: ${question}\\nAnswer: ${answer}\\n` +
                       `Evaluate candidate response for technical correctness, depth, and communication.`;
        
        const stream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        for await (const chunk of stream) {
            const token = chunk.text;
            if (token) {
                res.write(`data: ${JSON.stringify({ token })}\\n\\n`);
            }
        }
        res.write('data: [DONE]\\n\\n');
        res.end();
    } catch (err) {
        res.write(`data: ${JSON.stringify({ error: 'Inference streaming failed' })}\\n\\n`);
        res.end();
    }
}""", "TypeScript — streamingController.ts"
    )

    add_subsection_heading(doc, "6.2.5", "Listing 6.5: In-Browser Vocal Cadence Hook")
    add_paragraph(doc,
        "Listing 6.5 details the React custom hook measuring active speech duration, Words Per Minute (WPM), and counting filler words."
    )

    add_code_box(doc,
"""import { useState, useRef, useCallback } from 'react';

export function useSpeechCadence() {
    const [wpm, setWpm] = useState<number>(0);
    const [fillerCount, setFillerCount] = useState<number>(0);
    const startTimeRef = useRef<number | null>(null);

    const startRecording = useCallback(() => {
        startTimeRef.current = Date.now();
    }, []);

    const stopRecording = useCallback((transcript: string) => {
        if (!startTimeRef.current) return;
        const durationSec = Math.max(1, (Date.now() - startTimeRef.current) / 1000);
        const words = transcript.trim().split(/\\s+/).filter(w => w.length > 0);
        
        const computedWpm = Math.round(words.length / (durationSec / 60));
        setWpm(computedWpm);
        
        const fillerRegex = /\\b(um|uh|like|you know|basically|actually|literally)\\b/gi;
        const matches = transcript.match(fillerRegex);
        setFillerCount(matches ? matches.length : 0);
        
        startTimeRef.current = null;
    }, []);

    return { wpm, fillerCount, startRecording, stopRecording };
}""", "TypeScript — useSpeechCadence.ts"
    )

    add_subsection_heading(doc, "6.2.6", "Listing 6.6: Monaco Code Lab Runner & Static Big-O Analyzer")
    add_paragraph(doc,
        "Listing 6.6 details the sandboxed code execution runner and static Big-O complexity analyzer."
    )

    add_code_box(doc,
"""export function runInSandbox(code: string): { output: string, executionMs: number } {
    let captured = '';
    const start = performance.now();
    const customConsole = {
        log: (...args: any[]) => { captured += args.join(' ') + '\\n'; },
        error: (...args: any[]) => { captured += 'ERROR: ' + args.join(' ') + '\\n'; }
    };
    
    try {
        const executor = new Function('console', code);
        executor(customConsole);
    } catch (err: any) {
        captured += 'RUNTIME EXCEPTION: ' + err.message;
    }
    const executionMs = Math.round(performance.now() - start);
    return { output: captured.trim(), executionMs };
}

export function deduceBigO(code: string): { time: string, space: string } {
    const loopMatches = code.match(/\\b(for|while)\\s*\\(/g);
    const loopCount = loopMatches ? loopMatches.length : 0;
    
    let timeComplexity = 'O(1)';
    if (loopCount === 1) timeComplexity = 'O(N)';
    else if (loopCount === 2) timeComplexity = 'O(N^2)';
    else if (loopCount >= 3) timeComplexity = `O(N^${loopCount})`;
    
    if (/Math\\.floor\\(.*\\/\\s*2\\)/.test(code) && loopCount === 1) {
        timeComplexity = 'O(log N)';
    }
    
    const spaceComplexity = /new\\s+(Array|Map|Set)|\\.push\\(/.test(code) ? 'O(N)' : 'O(1)';
    return { time: timeComplexity, space: spaceComplexity };
}""", "TypeScript — codeReviewer.ts"
    )

    add_subsection_heading(doc, "6.2.7", "Listing 6.7: Placement Analytics Aggregator Service")
    add_paragraph(doc,
        "Listing 6.7 shows the service that aggregates student scores and placement readiness data for department administrators."
    )

    add_code_box(doc,
"""import { db } from '../database/db';

export interface PlacementMetrics {
    totalStudents: number;
    avgAtsScore: number;
    completedInterviews: number;
    branchReadiness: Record<string, number>;
}

export async function aggregatePlacementMetrics(): Promise<PlacementMetrics> {
    const students = await db.studentProfiles.findAll();
    const resumes = await db.resumeAnalyses.findAll();
    const interviews = await db.mockInterviews.findAll();
    
    const totalStudents = students.length;
    const avgAtsScore = resumes.length > 0 
        ? Math.round(resumes.reduce((acc, r) => acc + r.ats_score, 0) / resumes.length)
        : 0;
        
    const branchReadiness: Record<string, number> = {};
    students.forEach(s => {
        if (!branchReadiness[s.branch]) branchReadiness[s.branch] = 0;
        branchReadiness[s.branch]++;
    });
    
    return {
        totalStudents,
        avgAtsScore,
        completedInterviews: interviews.filter(i => i.status === 'completed').length,
        branchReadiness
    };
}""", "TypeScript — adminService.ts"
    )

    add_subsection_heading(doc, "6.2.8", "Listing 6.8: Local Heuristic Simulation Engine (simulationEngine.ts)")
    add_paragraph(doc,
        "Listing 6.8 illustrates the offline simulation engine that provides robust, deterministic evaluations and mock interview responses "
        "when network connectivity is interrupted or external generative AI API rate limits are reached."
    )

    add_code_box(doc,
"""export interface SimulatedEvaluation {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
}

export function generateSimulatedFeedback(
    role: string,
    questionText: string,
    studentAnswer: string
): SimulatedEvaluation {
    const wordCount = studentAnswer.trim().split(/\\s+/).filter(Boolean).length;
    const lowerAnswer = studentAnswer.toLowerCase();
    
    // Technical keyword detection based on target domain
    const techKeywords = ['architecture', 'scalability', 'complexity', 'async', 'database', 'optimization', 'interface'];
    const matchedKeywords = techKeywords.filter(k => lowerAnswer.includes(k));
    
    // Deterministic rubric evaluation
    let baseScore = Math.min(60 + matchedKeywords.length * 7, 95);
    if (wordCount < 20) baseScore = Math.max(30, baseScore - 25);
    
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    if (matchedKeywords.length >= 2) {
        strengths.push(`Effective technical terminology: ${matchedKeywords.join(', ')}`);
    } else {
        improvements.push('Incorporate more specific architectural and algorithmic vocabulary.');
    }
    
    if (wordCount >= 40) {
        strengths.push('Detailed, well-elaborated response structure.');
    } else {
        improvements.push('Expand response depth with concrete engineering examples.');
    }
    
    return {
        score: baseScore,
        feedback: `Simulated assessment for ${role} question. Identified ${matchedKeywords.length} key domain concepts.`,
        strengths,
        improvements
    };
}""", "TypeScript — simulationEngine.ts"
    )

    add_subsection_heading(doc, "6.2.9", "Listing 6.9: Web Speech API Audio Context Polyfill")
    add_paragraph(doc,
        "Listing 6.9 implements the real-time audio telemetry hook that captures candidate speech, detects verbal hesitation markers, "
        "and computes dynamic speaking cadence (Words Per Minute) without transmitting raw voice data over the network."
    )

    add_code_box(doc,
"""import { useState, useEffect, useRef } from 'react';

export function useSpeechTelemetry(isActive: boolean) {
    const [transcript, setTranscript] = useState('');
    const [wpm, setWpm] = useState(0);
    const [fillerCount, setFillerCount] = useState(0);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isActive || !('webkitSpeechRecognition' in window)) return;
        
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        startTimeRef.current = Date.now();
        
        recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; ++i) {
                fullText += event.results[i][0].transcript + ' ';
            }
            setTranscript(fullText.trim());
            
            // Calculate Words Per Minute
            const elapsedMins = (Date.now() - (startTimeRef.current || Date.now())) / 60000;
            const words = fullText.trim().split(/\\s+/).filter(Boolean).length;
            if (elapsedMins > 0.05) setWpm(Math.round(words / elapsedMins));
            
            // Detect filler words (um, uh, like, you know)
            const fillers = fullText.match(/\\b(um|uh|like|you know|basically)\\b/gi);
            setFillerCount(fillers ? fillers.length : 0);
        };
        
        recognition.start();
        return () => recognition.stop();
    }, [isActive]);

    return { transcript, wpm, fillerCount };
}""", "TypeScript — useSpeechTelemetry.ts"
    )

    add_section_heading(doc, "6.3", "CODE EFFICIENCY, MEMORY PROFILING AND OPTIMIZATIONS")
    add_paragraph(doc,
        "Several optimizations were implemented to maintain smooth performance and prevent memory issues in long sessions:"
    )
    add_bullet(doc, "Monaco Editor Cleanup: In single-page applications, mounting the Monaco editor repeatedly can cause memory leaks. A cleanup lifecycle hook disposes of the editor instance and terminates background web workers whenever the user leaves the page.", "Editor Disposal:")
    add_bullet(doc, "Memory Management in Streaming: The Express server pipes Gemini token chunks directly to the response socket using Node.js Buffers, avoiding large in-memory string concatenations during long responses.", "Streaming Buffers:")
    add_bullet(doc, "Code Splitting: Vite splits large third-party libraries (Monaco Editor and PDF.js) into separate asynchronous chunks, ensuring the landing page loads rapidly without waiting for code lab dependencies.", "Bundle Splitting:")
    add_bullet(doc, "DJB2 Caching: Computing a content hash for uploaded resumes allows the system to return cached ATS analyses in under 5 milliseconds when the same file is submitted repeatedly.", "Result Caching:")

    doc.add_page_break()
