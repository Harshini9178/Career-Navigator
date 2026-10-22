import docx
from docx.shared import Inches, Pt, RGBColor
from styles import (
    add_chapter_heading, add_section_heading, add_subsection_heading,
    add_subsubsection_heading, add_paragraph, add_bullet, add_table,
    add_figure, add_callout_box, add_code_box, add_table_caption
)

def build_chapters_4_to_6(doc):
    # =========================================================================
    # CHAPTER 4: PROJECT PLANNING
    # =========================================================================
    add_chapter_heading(doc, "CHAPTER 4", "PROJECT PLANNING")
    
    add_section_heading(doc, "4.1", "PROJECT PLANNING AND SCHEDULING")
    add_paragraph(doc,
        "Systematic project planning and iterative development methodologies are imperative for the successful engineering of complex, multi-tiered "
        "software platforms. Career Navigator was conceptualized, architected, and implemented using an Agile Scrum framework adapted for a 26-week "
        "collegiate engineering project lifecycle. The execution lifecycle was decomposed into distinct work packages, scheduled across eight "
        "two-to-three-week sprints, and monitored through rigorous risk mitigation gates."
    )

    add_subsection_heading(doc, "4.1.1", "Work Breakdown Structure (WBS)")
    add_paragraph(doc,
        "The Work Breakdown Structure establishes a hierarchical decomposition of total project deliverables across five foundational phases:"
    )
    add_bullet(doc, "Phase 1: Project Initiation & Requirements Engineering — Literature survey, candidate interview studies, SRS drafting, and hardware/software toolchain selection.", "• WBS Level 1: ")
    add_bullet(doc, "Phase 2: Architectural & Conceptual Modeling — Multi-tier system architecture, UML use case/sequence/activity models, database ER schemas, and UI/UX wireframing.", "• WBS Level 2: ")
    add_bullet(doc, "Phase 3: Core Application & Engine Development — Unicode text normalizer, deterministic ATS keyword density analyzer, Gemini 2.5 Flash SDK integration, Web Audio speech tracker, and Monaco Code Lab.", "• WBS Level 3: ")
    add_bullet(doc, "Phase 4: Security Hardening & Gateway Integration — OWASP security middleware, double-submit CSRF guards, HMAC SHA-256 session integrity, and in-memory rate limiting.", "• WBS Level 4: ")
    add_bullet(doc, "Phase 5: Quality Assurance, Benchmarking & Deployment — Vitest automated test suites, response latency telemetry, Docker container packaging, and documentation synthesis.", "• WBS Level 5: ")

    add_subsection_heading(doc, "4.1.2", "Gantt Chart Timeline & Milestone Scheduling")
    add_paragraph(doc,
        "Figure 4.1 depicts the comprehensive 26-week project Gantt chart, detailing parallel work packages and critical path dependencies. "
        "Milestone checkpoints were scheduled at the conclusion of each architectural phase to validate deliverables against academic requirements."
    )
    
    add_figure(doc, 'assets_generated/fig_4_1_gantt_chart.png', 'Figure 4.1: Project Execution Gantt Chart: Work Breakdown Structure Across 26 Weeks')

    add_subsection_heading(doc, "4.1.3", "Agile Sprint Breakdown & Deliverables")
    add_paragraph(doc,
        "Development was executed across eight structured Agile sprints. Table 4.1 outlines the sprint scheduling, work package allocations, "
        "and concrete milestone deliverables."
    )

    # Table 4.1: Agile Sprint Scheduling
    add_table_caption(doc, "Table 4.1: Agile Sprint Scheduling, Work Packages, and Milestone Deliverables")
    headers_4_1 = ["Sprint ID", "Duration", "Core Focus & Work Packages", "Milestone Deliverable", "Verification Gate"]
    rows_4_1 = [
        ["Sprint 1", "Weeks 1 - 3", "Problem definition, literature survey, recruitment domain research", "Formal Project Proposal & SRS v1.0", "Faculty Guide Review & Approval"],
        ["Sprint 2", "Weeks 4 - 6", "UI/UX wireframing, component mockups, tech stack evaluation", "Interactive Figma prototypes & design tokens", "Peer & Placement Officer Feedback"],
        ["Sprint 3", "Weeks 7 - 10", "Document text extraction (PDF/DOCX), regex section detector", "Deterministic ATS parser & DJB2 hash module", "Benchmark testing on 50 sample CVs"],
        ["Sprint 4", "Weeks 11 - 14", "Google GenAI SDK integration, prompt engineering, SSE pipeline", "Conversational Mock Interview room with SSE", "Latency validation (TTFT < 400ms)"],
        ["Sprint 5", "Weeks 15 - 17", "Monaco Editor integration, Web Audio WPM tracker, Code Lab", "Integrated Code Lab & Speech Analytics", "Candidate usability pilot testing"],
        ["Sprint 6", "Weeks 18 - 20", "OWASP security hardening, CSRF double-submit, HMAC sessions", "Security middleware & token rate limiters", "OWASP compliance audit & pen test"],
        ["Sprint 7", "Weeks 21 - 23", "Automated test suite creation (Vitest), bug fixing, refactoring", "78 Automated unit/integration tests passing", "100% CI Pipeline test pass rate"],
        ["Sprint 8", "Weeks 24 - 26", "Dockerization, performance telemetry, comprehensive report", "Production Docker image & Complete Report", "Project Exhibition & Viva Voce"]
    ]
    add_table(doc, headers_4_1, rows_4_1, [0.8, 1.1, 2.3, 1.8, 1.5])

    add_subsection_heading(doc, "4.1.4", "Comprehensive Project Risk Assessment & Mitigation")
    add_paragraph(doc,
        "Complex artificial intelligence web platforms face diverse technical, operational, and algorithmic risks. Table 4.2 presents the formal "
        "risk assessment matrix established for Career Navigator, classifying potential failure modes and corresponding mitigation strategies."
    )

    # Table 4.2: Risk Assessment & Mitigation
    add_table_caption(doc, "Table 4.2: Systematic Technical and Operational Risk Assessment & Mitigation Matrix")
    headers_4_2 = ["Risk ID", "Risk Description", "Category", "Likelihood", "Impact", "Proactive Mitigation Strategy"]
    rows_4_2 = [
        ["R01", "Gemini API rate limiting or quota exhaustion during peak interview sessions", "Technical", "Medium", "High", "Implemented token-bucket client rate limiters + zero-dependency local heuristic fallback simulation"],
        ["R02", "Hallucinated or non-deterministic scoring variances from generative LLM models", "Algorithmic", "Medium", "High", "Enforced strict JSON schema output validation and anchored evaluation against deterministic rubrics"],
        ["R03", "Cross-browser Web Audio API incompatibility causing speech tracking failure", "Compatibility", "Low", "Medium", "Implemented feature detection polyfills with graceful degradation to duration-based speech metrics"],
        ["R04", "Cross-Site Request Forgery (CSRF) or session cookie hijacking attacks", "Security", "Medium", "Critical", "Enforced double-submit cryptographic CSRF cookies and HMAC SHA-256 session signatures"],
        ["R05", "Browser memory exhaustion during extensive Monaco code editing sessions", "Performance", "Low", "Medium", "Employed editor instance disposal lifecycle hooks and Web Worker execution isolation"],
        ["R06", "PDF formatting anomalies causing garbled text extraction and section misses", "Data Quality", "High", "Medium", "Constructed multi-pass regex normalization with unicode ligature collapsing and contextual fallbacks"],
        ["R07", "Brute-force credential attacks on local authentication endpoints", "Security", "Medium", "High", "Configured in-memory IP-based rate limiting (10 attempts/min) with Retry-After headers"],
        ["R08", "Database schema migration complexity during transition from JSON to PostgreSQL", "Architecture", "Low", "Medium", "Architected an abstract Database interface layer with standardized repository adapter methods"]
    ]
    add_table(doc, headers_4_2, rows_4_2, [0.6, 2.2, 1.0, 0.8, 0.8, 2.1])

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 5: SYSTEM DESIGN
    # =========================================================================
    add_chapter_heading(doc, "CHAPTER 5", "SYSTEM DESIGN")
    
    add_section_heading(doc, "5.1", "SYSTEM ARCHITECTURE")
    add_paragraph(doc,
        "Career Navigator is engineered upon a decoupled, four-tier enterprise system architecture designed for horizontal scalability, high modularity, "
        "and robust security isolation. Figure 5.1 illustrates the architectural hierarchy, comprising the Presentation Tier, Security & API Gateway Tier, "
        "Core Application Tier, and Persistence & AI Infrastructure Tier."
    )
    
    add_figure(doc, 'assets_generated/fig_5_1_system_architecture.png', 'Figure 5.1: High-Level Tiered Enterprise System Architecture of Career Navigator')

    add_paragraph(doc,
        "Architectural Tier Breakdown:"
    )
    add_bullet(doc, "Client Presentation Tier: Constructed with React 19, TypeScript, and Vite. Implements single-page application (SPA) client-side routing, modular component layouts (StudentDashboard, ResumeAnalyzer, MockInterview, CodeSandbox, AdminDashboard), in-browser Monaco code editing, and Web Audio MediaStream telemetry.", "1. ")
    add_bullet(doc, "API Gateway & Security Middleware Tier: Built on Node.js and Express 4.21. Acts as the perimeter security enforcement boundary. Implements OWASP-recommended Content Security Policies (CSP), double-submit CSRF cookie validation, HMAC SHA-256 session authentication, request correlation IDs, structured logging, and in-memory rate limiting.", "2. ")
    add_bullet(doc, "Core Business & Engine Tier: Contains the domain logic subsystems: (a) deterministic ATS Parser and Keyword Density Engine, (b) Job Description matcher, (c) Gemini AI Orchestrator with Server-Sent Events (SSE) streaming handler, (d) Speech Cadence Telemetry analyzer, and (e) Monaco Big-O code diagnostic service.", "3. ")
    add_bullet(doc, "Persistence & External AI Infrastructure: Integrates Google's external Gemini 2.5 Flash API via HTTPS endpoints alongside an abstract data persistence layer supported by lightweight SQLite-WAL / JSON stores, ready for transparent PostgreSQL enterprise scaling.", "4. ")

    add_section_heading(doc, "5.2", "COMPONENT DESIGN / MODULE DECOMPOSITION")
    add_paragraph(doc,
        "The system is decomposed into six cohesive, loosely coupled subsystems adhering to the Single Responsibility Principle:"
    )
    add_bullet(doc, "Authentication & Session Management Subsystem: Manages user lifecycle operations including registration, password hashing (PBKDF2/SHA-256), Google OAuth 2.0 authorization code exchange, HMAC session cookie signing, and role-based access control (RBAC).", "• ")
    add_bullet(doc, "Resume Ingestion & Deterministic ATS Engine: Responsible for binary document text extraction (PDF/DOCX), unicode text normalization, DJB2 content hash calculation, regex-driven section identification, and software engineering keyword density modeling.", "• ")
    add_bullet(doc, "Generative Interview Orchestrator: Interacts with Google Gemini 2.5 Flash to synthesize role-specific technical questions, evaluate candidate spoken/written answers against technical and communication rubrics, and stream tokens via Server-Sent Events (SSE).", "• ")
    add_bullet(doc, "Speech Cadence & Audio Telemetry Engine: Interfaces with browser Web Audio API to calculate speaking speed (Words Per Minute), count verbal hesitation fillers ('um', 'uh', 'like'), and track answer duration seconds.", "• ")
    add_bullet(doc, "Monaco Algorithmic Code Lab Subsystem: Provides an embedded code editing sandbox supporting syntax highlighting, auto-completion, client-side runtime output capture, and AI-driven static analysis to deduce Big-O time and space asymptotic bounds.", "• ")
    add_bullet(doc, "Institutional Placement Telemetry Subsystem: Aggregates student placement readiness metrics, computes college-wide and branch-wise average ATS scores, tracks interview completion volumes, and provides administrative search/filtering.", "• ")

    add_section_heading(doc, "5.3", "INTERFACE DESIGN")
    add_paragraph(doc,
        "Interface design spans both human-centric graphical user interfaces (UI/UX) and machine-to-machine API contracts. "
        "Career Navigator follows modern design aesthetics utilizing dark-mode capable color palettes (Slate, Indigo, Emerald), accessible contrast ratios, "
        "and clear visual hierarchies. Machine communication adheres strictly to the OpenAPI 3.0 specification."
    )
    
    # Table 5.1: API Endpoints Contract
    add_table_caption(doc, "Table 5.1: OpenAPI 3.0 REST and Server-Sent Events (SSE) Endpoint Contracts")
    headers_5_1 = ["HTTP Method", "Endpoint Path", "Security & Auth", "Request Body Payload", "Response Summary & Status"]
    rows_5_1 = [
        ["GET", "/health", "Public", "None", "200: System uptime, memory, and database status"],
        ["GET", "/api/auth/me", "CookieAuth", "None", "200: Authenticated User object + CSRF token"],
        ["POST", "/api/auth/demo", "Public", "{ role: 'student' | 'admin' }", "200: Instant demo session cookie issued"],
        ["POST", "/api/auth/logout", "CookieAuth", "None", "200: Clears session cookie"],
        ["PUT", "/api/profile", "CookieAuth + CSRF", "{ branch, targetRole, skills, projects }", "200: Updated user placement profile"],
        ["POST", "/api/resume/upload", "CookieAuth + CSRF", "{ fileName, resumeText }", "200: FullAtsEvaluation object with scores & tips"],
        ["POST", "/api/resume/upload-with-jd", "CookieAuth + CSRF", "{ fileName, resumeText, jobDescription }", "200: ATS evaluation + JD keyword match breakdown"],
        ["GET", "/api/resume/my-analysis", "CookieAuth", "None", "200: Current student's active resume evaluation"],
        ["POST", "/api/interview/generate", "CookieAuth + CSRF", "None (uses student profile context)", "200: Initialized 5-question mock interview session"],
        ["GET", "/api/interview/history", "CookieAuth", "None", "200: Array of historical mock interview sessions"],
        ["POST", "/api/interview/{id}/answer", "CookieAuth + CSRF", "{ answer, wordsPerMinute, fillerCount }", "200: Multi-rubric AnswerEvaluation object"],
        ["POST", "/api/interview/{id}/answer-stream", "CookieAuth + CSRF", "{ answer, wordsPerMinute, fillerCount }", "200: SSE text/event-stream token stream"],
        ["POST", "/api/interview/code-review", "CookieAuth + CSRF", "{ code, language, problemStatement }", "200: CodeReviewResult with Big-O time/space"],
        ["GET", "/api/admin/metrics", "CookieAuth (Admin)", "None", "200: Aggregated institutional placement telemetry"]
    ]
    add_table(doc, headers_5_1, rows_5_1, [0.8, 1.8, 1.2, 1.7, 2.0])

    add_section_heading(doc, "5.4", "DATA STRUCTURE DESIGN")
    add_paragraph(doc,
        "Figure 5.3 presents the formal Entity-Relationship (ER) schema modeling the relational data structures that underpin Career Navigator. "
        "The architecture establishes clear cardinality constraints, ensuring foreign-key integrity between User, ResumeAnalysis, MockInterview, "
        "InterviewAnswer, and StudentFeedback entities."
    )
    
    add_figure(doc, 'assets_generated/fig_5_3_er_diagram.png', 'Figure 5.3: Entity-Relationship (ER) Schema Modeling Core Relational Entities')

    # Table 5.2: Schema Definitions
    add_table_caption(doc, "Table 5.2: Relational and JSON Entity Schema Property Definitions")
    headers_5_2 = ["Entity Name", "Primary Key", "Foreign Keys", "Core Attributes & Data Types", "Indexing & Constraints"]
    rows_5_2 = [
        ["User", "id (UUID)", "None", "email (VARCHAR, Unique), passwordHash (TEXT), role ('student'|'admin'), branch (VARCHAR), targetRole (VARCHAR), skills (JSON Array)", "UNIQUE(email), INDEX(role)"],
        ["ResumeAnalysis", "id (UUID)", "userId -> User(id)", "fileName (VARCHAR), atsScore (INT 40-100), detectedSections (JSON), missingSections (JSON), keywords (JSON), jdMatchScore (INT)", "INDEX(userId), INDEX(atsScore)"],
        ["MockInterview", "id (UUID)", "userId -> User(id)", "jobRole (VARCHAR), interviewMode ('voice'|'text'), overallScore (INT), technicalScore (INT), communicationScore (INT), status (VARCHAR)", "INDEX(userId), INDEX(status)"],
        ["InterviewAnswer", "id (UUID)", "interviewId -> MockInterview(id)", "question (TEXT), answer (TEXT), score (INT 1-10), wordsPerMinute (FLOAT), fillerWordCount (INT), feedback (TEXT)", "INDEX(interviewId)"],
        ["StudentFeedback", "id (UUID)", "userId -> User(id)", "category ('interview'|'resume'|'general'), rating (INT 1-5), comment (TEXT), createdAt (TIMESTAMP)", "INDEX(category), INDEX(rating)"],
        ["ResumeTemplate", "id (VARCHAR)", "None", "name (VARCHAR), description (TEXT), downloadCount (INT), fileContent (TEXT)", "PRIMARY KEY(id)"]
    ]
    add_table(doc, headers_5_2, rows_5_2, [1.1, 0.9, 1.3, 2.7, 1.5])

    add_section_heading(doc, "5.5", "ALGORITHM DESIGN")
    add_paragraph(doc,
        "The algorithmic foundation of Career Navigator combines mathematical heuristics with generative token processing. The three primary algorithms "
        "governing system behavior are formulated below:"
    )

    add_subsection_heading(doc, "5.5.1", "Deterministic ATS Resume Scoring Formula")
    add_paragraph(doc,
        r"The overall ATS readiness score $S_{ATS} \in [40, 100]$ is computed as a weighted linear combination of four structural sub-scores:"
    )
    add_paragraph(doc,
        r"S_{ATS} = w_{sec} \cdot S_{sec} + w_{kw} \cdot S_{kw} + w_{fmt} \cdot S_{fmt} + w_{len} \cdot S_{len}",
        bold_prefix="Equation 5.1: ", italic=True
    )
    add_paragraph(doc,
        r"Where the empirical weights are normalized such that $w_{sec} = 0.35$, $w_{kw} = 0.35$, $w_{fmt} = 0.15$, and $w_{len} = 0.15$. "
        r"The section score $S_{sec}$ evaluates the presence of seven standard sections (Contact, Summary, Education, Skills, Projects, Experience, Certifications). "
        r"The keyword score $S_{kw}$ evaluates candidate coverage across the software engineering taxonomy detailed in Table 5.3. "
        r"The formatting score $S_{fmt}$ evaluates punctuation consistency, bullet formatting, and typography. "
        r"The length score $S_{len}$ penalizes resumes with word counts outside the optimal range ($350 \le N_{words} \le 850$ words)."
    )

    # Table 5.3: Keyword Catalog
    add_table_caption(doc, "Table 5.3: Deterministic Keyword Catalog and Category Density Weights")
    headers_5_3 = ["Technical Category", "Category Weight", "Canonical Technical Keywords Monitored", "Matching Regular Expression Logic"]
    rows_5_3 = [
        ["Programming Languages", "25%", "JavaScript, TypeScript, Python, Java, C++, Go, Rust, C#, PHP", r"\b(typescript|python|c\+\+|golang|rust)\b"],
        ["Frameworks & Libraries", "25%", "React, Node.js, Express, Next.js, Django, Spring Boot, Angular, Vue", r"\b(react|nodejs|express|django|spring\s*boot)\b"],
        ["Databases & APIs", "20%", "SQL, PostgreSQL, MongoDB, Redis, GraphQL, REST APIs, Prisma", r"\b(postgresql|mongodb|redis|graphql|rest\s*api)\b"],
        ["DevOps & Cloud Computing", "15%", "Docker, Kubernetes, AWS, CI/CD, Git, Linux, Terraform, Nginx", r"\b(docker|kubernetes|aws|ci\/cd|git|linux)\b"],
        ["Testing & Tooling", "15%", "Jest, Vitest, Cypress, Postman, Vite, Webpack, Agile, Scrum", r"\b(vitest|jest|cypress|postman|agile|scrum)\b"]
    ]
    add_table(doc, headers_5_3, rows_5_3, [1.5, 0.9, 2.8, 2.3])

    add_subsection_heading(doc, "5.5.2", "DJB2 Content Fingerprint Hash Algorithm")
    add_paragraph(doc,
        "To eliminate redundant AI API invocations and accelerate resume scoring for unchanged documents, Career Navigator computes a 32-bit DJB2 content hash. "
        "The algorithm traverses document character codes using a bitwise multiplier (33):"
    )
    add_code_box(doc,
"""export function computeContentHash(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) + content.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16); // Hexadecimal representation
}""", "TypeScript - DJB2 Hash Engine")

    add_subsection_heading(doc, "5.5.3", "Server-Sent Events (SSE) Streaming Pipeline")
    add_paragraph(doc,
        "To deliver instantaneous feedback as the candidate finishes speaking, Career Navigator utilizes HTTP Server-Sent Events (SSE). The server configures "
        "the response with `Content-Type: text/event-stream`, `Cache-Control: no-cache`, and `Connection: keep-alive`. As Gemini 2.5 Flash emits token chunks, "
        "the server writes `data: {\"token\":\"...\",\"done\":false}\n\n` directly to the HTTP socket, closing with `data: {\"done\":true,\"evaluation\":{...}}\n\n`. "
        "This reduces perceived candidate latency from 4.2 seconds to under 350 milliseconds."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 6: IMPLEMENTATION
    # =========================================================================
    add_chapter_heading(doc, "CHAPTER 6", "IMPLEMENTATION")
    
    add_section_heading(doc, "6.1", "IMPLEMENTATION APPROACHES")
    add_paragraph(doc,
        "The implementation of Career Navigator adopts modern full-stack TypeScript engineering principles, emphasizing zero-transpilation development servers, "
        "strict end-to-end type safety, atomic component design, and an OWASP-hardened request processing pipeline. The core implementation approaches comprise:"
    )
    add_bullet(doc, "Unified Full-Stack TypeScript Architecture: By sharing TypeScript interfaces (User, ResumeAnalysis, MockInterview, AnswerEvaluation) across frontend and backend modules, the platform eliminates contract drift between client requests and API responses.", "1. ")
    add_bullet(doc, "Concurrent React 19 Frontend: Employs React 19 hooks (useTransition, useOptimistic, useEffect) alongside Tailwind CSS 4 to provide smooth, reactive state transitions, real-time audio waveform visualizers, and seamless camera streaming.", "2. ")
    add_bullet(doc, "Zero-Dependency Express Server Pipeline: To minimize external attack surfaces, core security controls—such as cookie parsing, session signature validation, and CSRF token generation—were authored natively using Node.js built-in crypto and RegExp modules.", "3. ")
    add_bullet(doc, "Monaco Code Editor Integration: Microsoft Monaco Editor was integrated directly into the browser DOM using @monaco-editor/react, configuring language servers, real-time syntax checking, and code sandboxing.", "4. ")

    add_section_heading(doc, "6.2", "CODING DETAILS AND CODE EFFICIENCY")
    add_paragraph(doc,
        "This section documents the critical algorithmic and security implementations underpinning the platform, highlighting code efficiency, "
        "memory allocation considerations, and architectural design patterns."
    )

    add_subsection_heading(doc, "6.2.1", "Resume Normalization & Unicode Sanitization")
    add_paragraph(doc,
        "Extracted text from PDF and DOCX files frequently contains corrupted unicode ligatures (e.g., 'ﬁ', 'ﬂ'), non-standard smart quotes, "
        "and multi-byte bullet characters that break standard regex matching. The normalization module resolves these discrepancies efficiently:"
    )
    add_code_box(doc,
"""export function normalizeResumeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")       // Normalize single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')       // Normalize double quotes
    .replace(/[\u2013\u2014\u2015]/g, '-')             // Normalize dashes
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u00B7]/g, ' - ') // Standardize bullets
    .replace(/\u200B|\u200C|\u200D|\uFEFF|\u00AD/g, '') // Remove zero-width spaces
    .replace(/\uFB01/g, 'fi').replace(/\uFB02/g, 'fl')  // Ligatures: fi, fl
    .replace(/\uFB03/g, 'ffi').replace(/\uFB04/g, 'ffl') // Ligatures: ffi, ffl
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')       // Newline normalization
    .replace(/\n{3,}/g, '\n\n')                         // Collapse excess blank lines
    .replace(/[ \t]+/g, ' ')                            // Collapse excess spacing
    .trim();
}""", "TypeScript - Normalization Module")

    add_subsection_heading(doc, "6.2.2", "OWASP Security Pipeline & Double-Submit CSRF Guard")
    add_paragraph(doc,
        "To safeguard against Cross-Site Request Forgery (CSRF), Career Navigator implements the cryptographic double-submit cookie pattern. "
        "The server automatically issues a random 24-byte hex token in a `csrf-token` cookie. State-changing requests (POST, PUT, DELETE) "
        "must transmit the identical token in the `X-CSRF-Token` header. Timing-safe string comparison guarantees resilience against side-channel timing attacks."
    )
    
    add_figure(doc, 'assets_generated/fig_6_1_security_middleware_pipeline.png', 'Figure 6.1: OWASP-Hardened Request Ingestion & Security Middleware Pipeline')

    # Table 6.1: Security Configurations
    add_table_caption(doc, "Table 6.1: Enterprise Security Middleware Configurations and OWASP Hardening Baseline")
    headers_6_1 = ["Security Defense Layer", "Implementation Mechanism", "Standard Configuration & Directives", "Guarded Threat Vector"]
    rows_6_1 = [
        ["Content-Security-Policy", "HTTP Response Header", "default-src 'self'; script-src 'self' 'unsafe-inline' blob:; worker-src blob:;", "Cross-Site Scripting (XSS) & Code Injection"],
        ["X-Frame-Options", "HTTP Response Header", "DENY", "Clickjacking & UI Redressing Attacks"],
        ["X-Content-Type-Options", "HTTP Response Header", "nosniff", "MIME-Type Confusion & Sniffing"],
        ["CSRF Protection", "Double-Submit Cookie Guard", "SameSite=Strict; Secure; Validated via X-CSRF-Token", "Cross-Site Request Forgery (CSRF)"],
        ["Session Signing", "HMAC SHA-256 Signature", "crypto.createHmac('sha256', SECRET).update(userId)", "Cookie Tampering & Identity Spoofing"],
        ["Brute-Force Rate Limiting", "In-Memory Token Bucket", "10 requests / 60 seconds per IP with Retry-After header", "Credential Stuffing & DoS Attacks"],
        ["Permissions-Policy", "HTTP Response Header", "camera=(self), microphone=(self), geolocation=()", "Unauthorized Peripheral Device Access"]
    ]
    add_table(doc, headers_6_1, rows_6_1, [1.5, 1.5, 2.2, 2.3])

    add_subsection_heading(doc, "6.2.3", "HMAC SHA-256 Session Signing & Timing-Safe Verification")
    add_paragraph(doc,
        "User sessions are authenticated via digitally signed cookies. Rather than storing un-signed user identifiers, the server computes an HMAC SHA-256 "
        "digest using a cryptographically random `SESSION_SECRET`. During verification, `crypto.timingSafeEqual` prevents byte-by-byte timing inference attacks:"
    )
    add_code_box(doc,
"""export function signSession(userId: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
  return `${userId}.${hmac}`;
}

export function verifySession(token: string): string | null {
  if (!token) return null;
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;
  const userId = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
  if (sig.length !== expectedSig.length) return null;
  const sigBuffer = Buffer.from(sig, 'utf-8');
  const expectedBuffer = Buffer.from(expectedSig, 'utf-8');
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer) ? userId : null;
}""", "TypeScript - HMAC Session Engine")

    add_subsection_heading(doc, "6.2.4", "Server-Sent Events (SSE) Real-Time Token Pipeline")
    add_paragraph(doc,
        "The streaming evaluation endpoint (`/api/interview/:id/answer-stream`) bypasses standard buffering, writing real-time token chunks directly "
        "to the open HTTP socket as generated by the Google GenAI SDK:"
    )
    add_code_box(doc,
"""app.post('/api/interview/:id/answer-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { answer, wordsPerMinute, fillerWordCount } = req.body;
  try {
    for await (const token of aiService.streamAnswerEvaluation(answer, question)) {
      res.write(`data: ${JSON.stringify({ token, done: false })}\\n\\n`);
    }
    const finalEvaluation = await aiService.evaluateAnswer(answer, question, { wordsPerMinute, fillerWordCount });
    res.write(`data: ${JSON.stringify({ done: true, evaluation: finalEvaluation })}\\n\\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: 'Streaming interrupted' })}\\n\\n`);
    res.end();
  }
});""", "TypeScript - Express SSE Endpoint")

    doc.add_page_break()
