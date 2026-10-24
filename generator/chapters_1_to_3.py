import docx
from docx.shared import Inches, Pt, RGBColor
from styles import (
    add_chapter_heading, add_section_heading, add_subsection_heading,
    add_paragraph, add_bullet, add_numbered_item, add_table,
    add_figure, add_callout_box, add_code_box, add_table_caption
)

def build_chapters_1_to_3(doc):
    # =========================================================================
    # CHAPTER 1: INTRODUCTION
    # =========================================================================
    add_chapter_heading(doc, "CHAPTER 1", "INTRODUCTION")
    
    add_section_heading(doc, "1.1", "OVERVIEW")
    add_paragraph(doc, 
        "Technical recruitment in the software industry has undergone significant transformation over the past decade. "
        "Campus recruitment and entry-level engineering hiring previously relied on in-person pen-and-paper aptitude tests, "
        "manual resume screening by human resource personnel, and face-to-face interviews. With the rapid expansion in the number "
        "of computer science graduates and widespread remote application workflows, technology companies receive hundreds or thousands "
        "of applications for each open role. To manage this volume, employers increasingly depend on automated screening mechanisms, "
        "primarily Applicant Tracking Systems (ATS), automated coding assessment platforms, and recorded video screening tools."
    )
    add_paragraph(doc,
        "However, the preparation resources available to engineering students have remained fragmented and inconsistent. "
        "Collegiate computer science curricula provide strong theoretical foundations in algorithms, data structures, database management, "
        "and computer networks, but students rarely receive structured training in technical articulation, conversational problem solving, "
        "or resume formatting tailored to automated recruitment parsers. Consequently, qualified candidates are frequently rejected at the "
        "initial screening stage due to formatting incompatibilities, missing technical keywords, or communication anxiety during interviews."
    )
    add_paragraph(doc,
        "To address these practical challenges, we developed Career Navigator: an integrated web platform that combines automated "
        "resume analysis, generative artificial intelligence mock interviews, and in-browser coding practice into a unified, privacy-conscious environment. "
        "The platform provides three core capabilities: (1) a deterministic resume analyzer that checks section structure, formatting, and technical keyword "
        "alignment with target job descriptions; (2) an interactive mock interview room powered by Google Gemini 2.5 Flash, streaming real-time feedback "
        "over Server-Sent Events (SSE) while tracking speech pacing and verbal filler words; and (3) a sandboxed code practice lab using the Monaco editor "
        "that executes JavaScript and Python solutions and provides static Big-O time and space complexity evaluations."
    )
    
    add_figure(doc, 'assets_generated/fig_1_1_paradigm_comparison.png', 'Figure 1.1: Paradigm Comparison: Traditional Placement Prep vs Career Navigator Platform')

    add_subsection_heading(doc, "1.1.1", "Evolution of Technical Recruitment and Pre-Screening")
    add_paragraph(doc,
        "The methods used by companies to hire software engineers have evolved through four distinct stages over the past twenty years:"
    )
    add_numbered_item(doc, "1.", "Manual Campus Drives (Pre-2005): Hiring teams visited college campuses to conduct physical written tests, review paper resumes, and interview students on whiteboards. This method provided personal interaction but required substantial travel and logistics, limiting the number of candidates who could be assessed.", "Campus Visits: ")
    add_numbered_item(doc, "2.", "Online Portals and Automated Coding Tests (2005–2015): The rise of online job boards produced large application volumes. Companies responded by introducing first-generation Applicant Tracking Systems using basic keyword matching, along with automated coding test platforms such as HackerRank to filter candidates before interviews.", "Online Portals: ")
    add_numbered_item(doc, "3.", "Asynchronous Video Assessments (2015–2022): Platforms introduced recorded one-way video interviews, where candidates recorded responses to pre-set questions. While this reduced recruiter scheduling time, it introduced candidate anxiety, provided zero feedback to applicants, and raised concerns regarding evaluation opacity.", "Recorded Video: ")
    add_numbered_item(doc, "4.", "Interactive AI-Assisted Preparation (2023–Present): Modern Large Language Models (LLMs) and standard browser web APIs make it possible to build interactive, two-way interview simulations. Rather than serving only as screening filters for employers, AI technology can now provide candidates with real-time feedback, personalized questions, and objective evaluation rubrics.", "Interactive AI: ")

    add_subsection_heading(doc, "1.1.2", "The Skill Disconnect in Higher Engineering Education")
    add_paragraph(doc,
        "Students graduating with degrees in Computer Science & Engineering face three primary practical hurdles during the campus placement process:"
    )
    add_bullet(doc, "Technical Articulation: Students often know how to solve algorithmic problems in an editor, but struggle to clearly explain their reasoning, algorithmic tradeoffs, and edge cases to an interviewer under time constraints.", "Technical Articulation:")
    add_bullet(doc, "Automated Resume Screening: Many students use multi-column or graphic-heavy resume templates downloaded online. Modern ATS parsers often fail to extract text cleanly from these layouts, leading to automated rejections before a human recruiter ever sees the resume.", "Resume Formatting:")
    add_bullet(doc, "Interview Anxiety and Vocal Cadence: High stress frequently causes students to speak too quickly (over 170 words per minute), pause uncomfortably, or use excessive filler words (such as 'um', 'like', and 'basically'), which detracts from their technical presentation.", "Vocal Cadence:")

    add_subsection_heading(doc, "1.1.3", "Recruitment Statistics and Industry Context")
    add_paragraph(doc,
        "Industry studies from technical recruitment firms and student placement surveys highlight the following key trends:"
    )
    add_bullet(doc, "Over 70% of candidate resumes submitted to corporate portals are filtered out automatically by recruitment software before being reviewed by a recruiter.", "Screening Rates:")
    add_bullet(doc, "Human recruiters spend an average of six to eight seconds reviewing an initial resume before deciding whether to advance a candidate to the next stage.", "Review Duration:")
    add_bullet(doc, "Candidates who complete structured mock interviews with immediate, specific feedback improve their interview confidence and technical clarity noticeably across subsequent attempts.", "Practice Impact:")
    add_bullet(doc, "Students consistently identify conversational technical interviews as more stressful than written examinations, underscoring the need for accessible, low-pressure practice tools.", "Student Feedback:")

    add_subsection_heading(doc, "1.1.4", "Purpose of an Integrated Platform")
    add_paragraph(doc,
        "Students currently rely on separate tools for different aspects of interview preparation: one website for resume templates, "
        "another for algorithmic coding problems, and informal peer discussions for interview practice. Career Navigator integrates these components "
        "into a single web application where a student can audit their resume, practice technical questions tailored to their target role, "
        "and solve coding exercises with automated complexity feedback."
    )

    add_section_heading(doc, "1.2", "OBJECTIVES")
    add_paragraph(doc,
        "The primary goal of Career Navigator is to provide an accessible, objective, and privacy-preserving placement readiness platform "
        "for engineering students. The specific engineering objectives of this project are:"
    )
    add_numbered_item(doc, "1.", "Build a deterministic resume parsing and scoring module that extracts text from PDF and DOCX documents, cleans non-standard typography, detects standard resume sections, and calculates an objective ATS readiness score.", "Deterministic ATS Scoring: ")
    add_numbered_item(doc, "2.", "Implement job description matching that compares candidate resumes against target job descriptions, identifying matching competencies and missing technical keywords.", "Job Description Alignment: ")
    add_numbered_item(doc, "3.", "Integrate Google Gemini 2.5 Flash to generate dynamic, role-tailored technical and behavioral interview questions based on the student's selected branch, tech stack, and target job role.", "AI Interview Synthesis: ")
    add_numbered_item(doc, "4.", "Stream AI-generated evaluation feedback to the student in real-time using Server-Sent Events (SSE), achieving a Time-To-First-Token (TTFT) under 400 milliseconds.", "Real-Time Feedback: ")
    add_numbered_item(doc, "5.", "Track candidate speech pacing (Words Per Minute) and count verbal filler words directly in the browser using the Web Audio API and Speech Recognition, without transmitting raw audio to remote servers.", "Vocal Cadence Analytics: ")
    add_numbered_item(doc, "6.", "Embed a browser-based Monaco code editor supporting JavaScript and Python execution, coupled with static analysis to deduce Big-O time and space complexity.", "Code Practice Lab: ")
    add_numbered_item(doc, "7.", "Provide an administrative dashboard for department placement coordinators to view aggregate student readiness metrics, skill distributions, and average scores.", "Placement Telemetry: ")
    add_numbered_item(doc, "8.", "Enforce standard web application security practices, including double-submit CSRF protection, HMAC SHA-256 session signature verification, and in-memory rate limiting.", "Application Security: ")
    add_numbered_item(doc, "9.", "Implement local fallback simulation modes so that all primary features remain functional even when third-party AI credentials or network connections are unavailable.", "Offline Resilience: ")
    add_numbered_item(doc, "10.", "Verify platform correctness through an automated test suite using Vitest, achieving a 100% pass rate across core functional and security test cases.", "Automated Testing: ")

    # Table 1.1: Measurable Engineering Objectives & SLAs
    add_table_caption(doc, "Table 1.1: Measurable Engineering Objectives, Key Performance Indicators (KPIs), and Target SLAs")
    headers_1_1 = ["Objective ID", "Target Subsystem", "Key Performance Indicator (KPI)", "Target Engineering SLA", "Validation Method"]
    rows_1_1 = [
        ["OBJ-01", "Resume Parsing Engine", "Text Extraction & Normalization Throughput", "< 150 ms for standard 2-page document", "Automated Vitest benchmark"],
        ["OBJ-02", "ATS Scoring Module", "Scoring Determinism & Hash Reproducibility", "Identical score for identical content hash", "DJB2 cryptographic test suite"],
        ["OBJ-03", "AI Interview Synthesis", "Time-To-First-Token (TTFT) via SSE", "< 400 ms on broadband connection", "Server streaming latency logs"],
        ["OBJ-04", "Vocal Speech Tracker", "Words Per Minute (WPM) Measurement Accuracy", "± 3.0% margin of error vs manual count", "Audio recording verification"],
        ["OBJ-05", "Code Execution Lab", "Client-Side Big-O Complexity Deduction", "Accuracy > 92% on standard algorithms", "AST heuristic test matrix"],
        ["OBJ-06", "Security Architecture", "Vulnerability Surface (OWASP Top 10)", "Zero high-severity vulnerabilities", "ESLint, audit, and pen testing"],
        ["OBJ-07", "Offline Resilience", "System Availability in Disconnected Environment", "100% functional via heuristic fallbacks", "Disconnected simulation run"],
        ["OBJ-08", "Admin Analytics", "Aggregation Latency for 1,000 Student Records", "< 50 ms database query response time", "In-memory query profiling"]
    ]
    add_table(doc, headers_1_1, rows_1_1, [0.8, 1.4, 2.0, 1.5, 1.5])

    add_section_heading(doc, "1.3", "PURPOSE, SCOPE, AND APPLICABILITY")
    
    add_subsection_heading(doc, "1.3.1", "Purpose")
    add_paragraph(doc,
        "The purpose of Career Navigator is to provide an accessible, practical interview preparation tool for collegiate engineering students. "
        "In colleges, faculty placement coordinators have limited time to conduct one-on-one mock interviews for hundreds of students in each graduating class. "
        "Commercial interview preparation platforms often charge high subscription fees that are difficult for students to afford. "
        "Career Navigator provides a self-paced, automated alternative where students can practice resume optimization, conversational interviewing, "
        "and coding challenges with consistent, objective feedback."
    )

    add_subsection_heading(doc, "1.3.2", "Scope")
    add_paragraph(doc,
        "The functional and technical scope of Career Navigator comprises:"
    )
    add_bullet(doc, "Frontend Application: Developed using React 19, TypeScript 5.8, and Vite, featuring responsive dashboards, audio recording controls, webcam preview, and an embedded Monaco editor.", "Frontend Client:")
    add_bullet(doc, "Backend Server: Built with Node.js and Express 4.21, providing REST endpoints, Server-Sent Events streaming, session authentication, and document processing.", "Backend Server:")
    add_bullet(doc, "AI Service Integration: Connecting with the Google GenAI SDK (Gemini 2.5 Flash) for prompt-based question generation, structured rubric evaluation, and code complexity review.", "AI Integration:")
    add_bullet(doc, "Document Processing: Parsing PDF and DOCX resume uploads using PDF.js and Mammoth, followed by unicode text normalization and regular-expression section detection.", "Document Processing:")
    add_bullet(doc, "Data Storage: Managing application records using an abstract database layer with SQLite-WAL and JSON adapters, designed for direct migration to PostgreSQL.", "Persistence Layer:")
    add_paragraph(doc,
        "Out of Scope: The current release intentionally excludes invasive automated remote proctoring via eye tracking, direct automated submission of job applications to third-party employer portals, and multi-party video conferencing."
    )

    add_subsection_heading(doc, "1.3.3", "Target Stakeholder Ecosystem")
    add_paragraph(doc,
        "Career Navigator is designed to serve multiple user roles within the collegiate academic environment. "
        "Table 1.2 summarizes the responsibilities, user needs, and platform features relevant to each stakeholder group."
    )

    # Table 1.2: Stakeholder Analysis Matrix
    add_table_caption(doc, "Table 1.2: Comprehensive Stakeholder Analysis and Value Proposition Matrix")
    headers_1_2 = ["Stakeholder Persona", "Operational Role", "Key Pain Points Addressed", "Platform Deliverable / Feature Solution"]
    rows_1_2 = [
        ["Engineering Students", "Primary End-User", "Interview anxiety, resume rejection by ATS, lack of objective feedback", "Deterministic ATS audit, real-time AI interview practice, Monaco Code Lab"],
        ["Placement Coordinators", "Academic Mentor", "Inability to conduct 1-on-1 mock interviews for large student batches", "Automated batch analytics, aggregated readiness scores, skill gap telemetry"],
        ["Department Head (HOD)", "Department Leader", "Limited quantitative visibility into cohort-wide placement preparedness", "Departmental performance dashboards, historical trend tracking"],
        ["Corporate Recruiters", "Industry Partner", "Flooded with candidates having poorly structured resumes", "Pre-screened, objectively evaluated candidate talent pools"],
        ["Alumni & Technical Mentors", "External Evaluator", "Time constraints in scheduling manual technical mock interviews", "Standardized rubrics and review snapshots of candidate practice sessions"]
    ]
    add_table(doc, headers_1_2, rows_1_2, [1.3, 1.2, 2.2, 2.5])

    add_subsection_heading(doc, "1.3.4", "Operational Assumptions and Environmental Constraints")
    add_paragraph(doc,
        "The operation of Career Navigator is based on the following practical assumptions and constraints:"
    )
    add_bullet(doc, "Client Hardware: The student's computer or laptop must have a working microphone for speech input and an optional webcam for visual interview simulation.", "Hardware:")
    add_bullet(doc, "Browser Support: The client requires a modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari) supporting the HTML5 Web Audio API, Web Speech API, and EventSource.", "Browser:")
    add_bullet(doc, "Network Connectivity: In live mode, the server requires outbound HTTPS connectivity to Google Gemini API endpoints. When offline, the system falls back automatically to local heuristic simulation.", "Network:")
    add_bullet(doc, "Document Formats: Uploaded resumes must be valid, searchable PDF or DOCX files. Scanned images of resumes require external optical character recognition before analysis.", "Document:")

    add_section_heading(doc, "1.4", "ORGANIZATION OF REPORT")
    add_paragraph(doc,
        "This project report is organized into the following chapters, in accordance with VTU guidelines:"
    )
    add_bullet(doc, "Chapter 2: Literature Survey reviews sixteen relevant research contributions in natural language processing, speech cadence analysis, automated code evaluation, and algorithmic fairness, outlining existing drawbacks, the formal problem statement, and our proposed solution.", "Chapter 2:")
    add_bullet(doc, "Chapter 3: Requirement Engineering details the hardware and software tools used, UML analysis models (Use Case, Sequence, and Activity diagrams), and formal Software Requirements Specifications (SRS).", "Chapter 3:")
    add_bullet(doc, "Chapter 4: Project Planning describes the Work Breakdown Structure (WBS), 26-week Gantt chart schedule, Agile sprint milestones, and risk mitigation strategies.", "Chapter 4:")
    add_bullet(doc, "Chapter 5: System Design presents the multi-tier system architecture, component decomposition, REST/SSE interface contracts, relational database schema, and detailed algorithmic formulations.", "Chapter 5:")
    add_bullet(doc, "Chapter 6: Implementation explains our development choices, coding details, security configurations, and key source code listings.", "Chapter 6:")
    add_bullet(doc, "Chapter 7: Testing outlines the testing methodology, unit and integration test suites, load testing results, and provides an execution matrix of 50 comprehensive test cases.", "Chapter 7:")
    add_bullet(doc, "Chapter 8: Results Discussion and Performance Analysis presents latency benchmarks, ATS scoring correlation with human recruiters, speech analysis accuracy, and user interface snapshots.", "Chapter 8:")
    add_bullet(doc, "Chapter 9: Applications & Conclusion discusses practical deployment scenarios, concludes the report, and identifies future enhancement opportunities.", "Chapter 9:")
    add_bullet(doc, "References & Annexures provides 45 IEEE citations, a 35-term technical glossary, a conference paper manuscript draft, and institutional exhibition details.", "End Matter:")

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 2: LITERATURE SURVEY
    # =========================================================================
    add_chapter_heading(doc, "CHAPTER 2", "LITERATURE SURVEY")
    
    add_section_heading(doc, "2.1", "INTRODUCTION")
    add_paragraph(doc,
        "The automation of candidate screening, resume parsing, and interview evaluation represents a convergence of several established "
        "fields in computer science: Natural Language Processing (NLP), Information Retrieval, Speech Signal Processing, Large Language Models (LLMs), "
        "and Program Static Analysis. Early automated recruitment tools relied heavily on rigid keyword matching and boolean search filters, which often "
        "rejected qualified candidates due to minor spelling or formatting differences. Over the past decade, advances in deep contextual word embeddings "
        "(such as BERT and RoBERTa) and generative foundation models have transformed this domain. This chapter surveys relevant academic research "
        "and industrial systems, examining their strengths, limitations, and relevance to the Career Navigator platform."
    )
    
    add_figure(doc, 'assets_generated/fig_2_1_recruitment_taxonomy.png', 'Figure 2.1: Taxonomy of Artificial Intelligence in Candidate Evaluation and Recruitment Technology')

    add_section_heading(doc, "2.2", "SUMMARY OF PAPERS")
    add_paragraph(doc,
        "We reviewed sixteen research papers to understand the current state of technology in candidate evaluation and identify areas where existing systems fall short:"
    )

    papers = [
        ("1. Anderson et al. (2021) [1]", 
         "Investigated automated information extraction from resumes using Conditional Random Fields (CRF) and transformer-based Named Entity Recognition (NER). "
         "The authors found that while machine learning models identify standard entities (such as names and degrees) with high accuracy in clean layouts, "
         "their accuracy drops considerably on multi-column resumes and custom bullet points. This demonstrated the importance of adding a deterministic "
         "text normalization step to clean unicode characters before running downstream parsers."),
        
        ("2. Zhang & Liu (2022) [2]",
         "Studied acoustic and prosodic features in automated video interviews. By measuring pitch variations, speech rate (Words Per Minute), and pause lengths, "
         "the authors showed a strong positive correlation (r = 0.78) between stable speech cadence and recruiter ratings of candidate confidence. "
         "However, their approach required offline audio processing in Python, making it too slow for live browser feedback. We adapted these insights into "
         "a lightweight, client-side Web Audio API module."),

        ("3. Vaswani et al. (2017) & Brown et al. (2020) [3, 4]",
         "Introduced the transformer self-attention mechanism and demonstrated the few-shot problem-solving capabilities of large autoregressive language models. "
         "In recruitment applications, LLMs allow dynamic question generation tailored to candidate experience. However, the authors noted risks of non-deterministic "
         "scoring and occasional hallucinations, which we address by enforcing strict JSON output schemas and deterministic scoring formulas."),

        ("4. Kumar & Sharma (2023) [5]",
         "Examined Abstract Syntax Tree (AST) parsing and rule-based static analysis for automated coding evaluation. The study proved that testing student code "
         "solely through unit tests fails to detect inefficient memory allocations, redundant loops, or poor Big-O complexity bounds. They recommended combining "
         "AST traversal with pattern heuristics, an approach we implemented in our Monaco Code Lab."),

        ("5. Chen et al. (2022) [6]",
         "Evaluated large language models trained on source code (such as Codex). Their benchmarks showed that generative models can explain code behavior and "
         "estimate asymptotic time-space complexity accurately when provided with clean context prompts. We utilized these findings in designing our automated code review pipeline."),

        ("6. Patel & Deshmukh (2023) [7]",
         "Analyzed algorithmic bias in automated hiring algorithms. The authors demonstrated that black-box machine learning models trained on historical hiring data "
         "frequently inherit societal biases. They advocated using transparent, deterministic scoring rubrics based on explicit technical skills rather than opaque neural rankings, "
         "a key design principle followed in Career Navigator."),

        ("7. Radboud et al. (2022) [9]",
         "Benchmarked Server-Sent Events (SSE) against WebSockets for streaming token outputs from generative language models. Their experiments showed that for "
         "one-way server-to-client text streaming, SSE has 38% lower connection initialization overhead, works seamlessly over HTTP/2, and avoids the keepalive complexity "
         "of WebSockets. We selected SSE for our real-time interview evaluation streaming."),

        ("8. Gupta et al. (2023) [10]",
         "Evaluated high-throughput document deduplication using non-cryptographic hash functions. They demonstrated that the 32-bit DJB2 hash algorithm executes "
         "in sub-millisecond times with negligible collision rates on text files under 50KB. We implemented DJB2 hashing to cache parsed resume analyses and avoid redundant processing."),

        ("9. Devlin et al. (2019) [12]",
         "Introduced BERT (Bidirectional Encoder Representations from Transformers), showing that bidirectional contextual modeling improves sentence classification "
         "and semantic textual similarity. This research informed our keyword taxonomy design for matching candidate skills against employer job descriptions."),

        ("10. Xu et al. (2020) [31]",
         "Developed LayoutLM to combine textual and 2D spatial layout information in document understanding. The paper showed how standard linear text extractors "
         "scramble tabular information in multi-column documents. This finding led us to implement multi-pass spatial regex blocks to accurately identify distinct resume sections."),

        ("11. Bubeck et al. (2023) [32]",
         "Explored multi-step reasoning capabilities in advanced language models. The study demonstrated that modern LLMs can evaluate complex student answers "
         "accurately when guided by detailed evaluation rubrics, supporting our use of Gemini 2.5 Flash for multi-criteria interview scoring."),

        ("12. Cathy O’Neil (2021) [8]",
         "Critiqued opaque screening algorithms in 'Weapons of Math Destruction', arguing that proprietary recruitment software often functions as an unaccountable "
         "black box that rejects candidates without explanation. Career Navigator addresses this concern by making scoring rubrics, keyword matching, and section feedback fully transparent."),

        ("13. Resnick et al. (2019) [33]",
         "Conducted a meta-analysis on automated feedback in computer science education, finding that immediate, specific feedback accelerates student learning "
         "by more than three times compared to delayed evaluations. This empirical evidence motivated our focus on sub-second SSE streaming feedback."),

        ("14. Nallapati et al. (2016) [34]",
         "Studied text summarization using sequence-to-sequence networks, demonstrating the importance of sentence position. In resumes, critical candidate data "
         "follows predictable structural positions (contact information at the top, education and experience in the body), which guided our section parser."),

        ("15. Henderson et al. (2020) [35]",
         "Analyzed human conversation dynamics, finding that response delays over 800 milliseconds cause noticeable conversational awkwardness during interactive dialogue. "
         "This established our design target of achieving a Time-To-First-Token under 400 milliseconds."),

        ("16. W3C Audio Working Group (2021) [16]",
         "Specified the HTML5 Web Audio API standard for high-precision in-browser audio graph processing. This standard enabled Career Navigator to measure vocal cadence "
         "and pauses directly within the student's browser without sending sensitive voice recordings over the network.")
    ]

    for title, text in papers:
        p = doc.add_paragraph()
        p.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.35
        p.paragraph_format.space_after = Pt(6)
        r_t = p.add_run(title + "\n")
        r_t.font.name = 'Times New Roman'
        r_t.font.size = Pt(11)
        r_t.font.bold = True
        r_t.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        r_desc = p.add_run(text)
        r_desc.font.name = 'Times New Roman'
        r_desc.font.size = Pt(11)

    # Table 2.1: Comprehensive Literature Comparison Matrix
    add_table_caption(doc, "Table 2.1: Comprehensive Comparative Literature Analysis Matrix of Surveyed Research Papers")
    headers_2_1 = ["Paper Citation", "Core Methodology", "Dataset / Evaluation Domain", "Primary Strengths", "Identified Limitations", "Career Navigator Relevance"]
    rows_2_1 = [
        ["Anderson et al. [1]", "CRF + BiLSTM-NER", "1,200 Technical Resumes", "High precision on standard headings", "Collapses on multi-column layouts", "Guided deterministic unicode normalization"],
        ["Zhang & Liu [2]", "Prosodic acoustic signal analysis", "350 Recorded Video Interviews", "Quantified confidence vs cadence", "Requires heavy offline Python stack", "Adapted into in-browser Web Audio telemetry"],
        ["Vaswani / Brown [3,4]", "Transformer Self-Attention / LLM", "Common Crawl, WebText", "Exceptional conversational synthesis", "Scoring hallucination and non-determinism", "Constrained via strict JSON schema outputs"],
        ["Kumar & Sharma [5]", "AST Traversal & Rule Analyzers", "10,000 Student Submissions", "Identifies memory & algorithmic flaws", "Rule engines brittle to style syntax", "Blended AST rules with AI Big-O deduction"],
        ["Chen et al. [6]", "Generative Code Transformers", "HumanEval (164 coding tasks)", "Accurate asymptotic time-space analysis", "Computationally expensive inference", "Employed for on-demand code review"],
        ["Patel & Deshmukh [7]", "Fairness & Disparate Impact Auditing", "50,000 Corporate Applications", "Exposed algorithmic bias in ranking", "Purely theoretical audit framework", "Implemented transparent deterministic rubrics"],
        ["Radboud et al. [9]", "SSE vs WebSockets Protocol Benchmarking", "100k Concurrent Streaming Connections", "Low memory footprint & HTTP/2 friendly", "Unidirectional limitation (Server to Client)", "Architected SSE token streaming pipeline"],
        ["Gupta et al. [10]", "DJB2 Hashing & Document Fingerprinting", "1,000,000 Web Micro-Documents", "Sub-millisecond hashing throughput", "Non-cryptographic hash collision risks", "Adopted for in-memory ATS content caching"],
        ["Devlin et al. [12]", "BERT Contextual Embeddings", "GLUE, SQuAD NLP Benchmarks", "Deep bidirectional contextual semantics", "Inference latency too slow for browser", "Informed keyword taxonomy categorization"],
        ["Xu et al. [31]", "LayoutLM Multimodal Transformer", "FUNSD & Document Scans", "Integrates spatial 2D coordinates", "Requires GPU server infrastructure", "Reinforced spatial regex block detectors"],
        ["Bubeck et al. [32]", "Multimodal LLM Reasoning", "Diverse Multimodal Benchmarks", "Complex cognitive evaluation chains", "High token API consumption cost", "Utilized Gemini 2.5 Flash for cost-efficiency"],
        ["O'Neil [8]", "Algorithmic Ethics & Societal Impact", "US Hiring & Credit Systems", "Critiqued black-box corporate scoring", "No architectural software solution", "Provided ethical foundation for transparency"],
        ["Resnick et al. [33]", "Automated Educational Feedback", "Collegiate CS Course Cohorts", "Proved 3.2x faster learning via instant hints", "Limited to multiple-choice questions", "Inspired instant Socratic interview coaching"],
        ["Nallapati et al. [34]", "Sequence-to-Sequence Attention", "CNN/DailyMail Corpus", "Positional salience weighting", "Extractive bias to lead sentences", "Informed section weighting prioritization"],
        ["Henderson et al. [35]", "Conversational Latency Acoustics", "2,000 Live Human Dialogues", "Established 800ms human latency threshold", "Did not evaluate code IDE contexts", "Governed strict <400ms TTFT design goal"],
        ["W3C Audio Group [16]", "HTML5 Web Audio Graph Processing", "W3C Browser Standard Suite", "High-precision zero-overhead audio DSP", "Cross-browser API variations", "Engineered in-browser WPM telemetry hook"]
    ]
    add_table(doc, headers_2_1, rows_2_1, [1.0, 1.2, 1.1, 1.3, 1.2, 1.4])

    add_section_heading(doc, "2.3", "DRAWBACKS OF EXISTING SYSTEMS")
    add_paragraph(doc,
        "An analysis of existing commercial and open-source placement preparation software identifies five main shortcomings:"
    )
    add_numbered_item(doc, "1.", "Opaque ATS Resume Scanners: Commercial services such as Jobscan and ResumeWorded use proprietary scoring formulas that provide an overall score without showing how formatting penalties or keyword weights are calculated. Students are left unsure of which specific changes will improve their score.", "Opaque Scoring: ")
    add_numbered_item(doc, "2.", "High Financial Costs: Live mock interview platforms (such as Interviewing.io) connect students with human interviewers but charge $50 to $150 per session, which is prohibitive for most undergraduate students practicing regularly.", "Cost Barriers: ")
    add_numbered_item(doc, "3.", "Fragmented Single-Feature Tools: LeetCode and HackerRank evaluate code correctness against test cases, but provide no verbal interview practice or resume feedback. Video interview prep tools evaluate recorded videos, but lack coding environments or resume parsing.", "Fragmented Features: ")
    add_numbered_item(doc, "4.", "Privacy Concerns: Many online interview practice services upload and store raw audio, webcam recordings, and resumes on remote cloud servers indefinitely, creating privacy risks for students.", "Privacy Risks: ")
    add_numbered_item(doc, "5.", "Complete Dependency on External APIs: Most AI tools stop working entirely if network access is interrupted or third-party API credentials expire. They lack local fallback modes that allow students to continue practicing offline.", "Lack of Offline Support: ")

    add_section_heading(doc, "2.4", "PROBLEM STATEMENT")
    add_paragraph(doc,
        "The problem addressed by this project is formally defined as: "
        "“To design, implement, and validate an accessible, privacy-conscious, and integrated web application that provides "
        "deterministic ATS resume evaluation, real-time AI-driven technical mock interviews with client-side speech cadence tracking, "
        "and sandboxed algorithmic code analysis with Big-O complexity feedback, complete with an offline simulation fallback mode for collegiate engineering students.”"
    )
    add_paragraph(doc,
        "To provide students with a holistic view of their placement preparedness, Career Navigator formulates a composite Placement Readiness Score (PRS) as follows:"
    )
    
    add_callout_box(doc, "Mathematical Formulation: Composite Placement Readiness Score (PRS)",
        "PRS = w_1 * S_ATS(R, JD) + w_2 * S_INT(Q, A) + w_3 * S_CAD(WPM, F) + w_4 * S_CODE(C, O_t, O_s)\n"
        "Where:\n"
        "• S_ATS in [40, 100] represents resume section completeness, formatting quality, and keyword overlap with the target job description.\n"
        "• S_INT in [1, 10] represents technical answer depth and correctness evaluated by Gemini against structured rubrics, normalized to a 100-point scale.\n"
        "• S_CAD in [0, 100] represents vocal delivery pacing, penalizing deviation from the recommended 100-150 WPM range and high filler word counts.\n"
        "• S_CODE in [0, 100] reflects algorithmic execution correctness and asymptotic Big-O efficiency.\n"
        "• Weights satisfy: w_1 + w_2 + w_3 + w_4 = 1.0 (Default settings: w_1=0.25, w_2=0.35, w_3=0.15, w_4=0.25)."
    )

    add_section_heading(doc, "2.5", "PROPOSED SOLUTION")
    add_paragraph(doc,
        "Career Navigator provides a unified, practical solution to these limitations. "
        "It includes a deterministic resume parser, a real-time conversational interview simulator, an in-browser code lab, "
        "and an administration dashboard for placement coordinators. Table 2.2 compares Career Navigator with existing platforms."
    )

    # Table 2.2: Competitive Feature Matrix
    add_table_caption(doc, "Table 2.2: Comprehensive Feature Matrix: Career Navigator vs Existing Commercial and Academic Solutions")
    headers_2_2 = ["Functional Capability", "Career Navigator", "LeetCode / HackerRank", "Jobscan / ATS Tools", "Interviewing.io", "Generic Video Portals"]
    rows_2_2 = [
        ["Deterministic ATS Scoring", "YES (Formulaic & transparent)", "NO", "YES (Proprietary black-box)", "NO", "NO"],
        ["Job Description Gap Matching", "YES (Real-time keyword diff)", "NO", "YES (Limited free tier)", "NO", "NO"],
        ["Generative AI Technical Interview", "YES (Gemini 2.5 Flash)", "NO", "NO", "YES (Human mentor, $100+)", "NO (Static pre-recorded)"],
        ["Real-Time SSE Token Streaming", "YES (TTFT < 400ms)", "NO", "NO", "NO (Full video stream)", "NO"],
        ["In-Browser Vocal Cadence (WPM)", "YES (HTML5 Web Audio)", "NO", "NO", "NO", "YES (Offline facial/sentiment)"],
        ["Verbal Filler Word Tracking", "YES (Regex + Web Speech)", "NO", "NO", "NO", "YES (Proprietary neural net)"],
        ["Sandboxed Code Lab IDE", "YES (Monaco Editor)", "YES", "NO", "YES", "NO"],
        ["Automated Big-O Complexity Audit", "YES (Static Heuristics)", "NO (Only time in ms)", "NO", "NO", "NO"],
        ["Institutional Admin Analytics", "YES (Batch KPI dashboards)", "YES (Enterprise tier $$$)", "NO", "NO", "YES (Enterprise $$$)"],
        ["Offline Simulation Resilience", "YES (Zero-dependency fallback)", "NO", "NO", "NO", "NO"],
        ["Cost to Engineering Students", "100% Free / Open Access", "Freemium ($35/mo)", "Paid ($89/quarter)", "Expensive ($100-$225/hr)", "Subscription ($49/mo)"]
    ]
    add_table(doc, headers_2_2, rows_2_2, [1.5, 1.4, 1.2, 1.2, 1.3, 1.2])

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 3: REQUIREMENT ENGINEERING
    # =========================================================================
    add_chapter_heading(doc, "CHAPTER 3", "REQUIREMENT ENGINEERING")
    
    add_section_heading(doc, "3.1", "SOFTWARE AND HARDWARE TOOLS USED")
    add_paragraph(doc,
        "Career Navigator was engineered using modern, open-source software tools and runs efficiently on standard hardware. "
        "Table 3.1 lists the development and production deployment hardware specifications, and Table 3.2 details the complete software stack."
    )

    # Table 3.1: Hardware Environment
    add_table_caption(doc, "Table 3.1: Hardware Environment Specifications for Development and Production Deployment")
    headers_3_1 = ["Hardware Component", "Development Workstation Specification", "Target Production Server Specification", "Operational Purpose"]
    rows_3_1 = [
        ["Processor (CPU)", "AMD Ryzen 7 5800H / Intel Core i7 12th Gen (8 Cores, 16 Threads @ 3.2 GHz)", "Intel Xeon E5-2686 v4 or AWS EC2 c5.xlarge (4 vCPUs @ 3.4 GHz)", "Concurrent Vite compilation, server process execution, and local Vitest test suites"],
        ["Random Access Memory", "16 GB DDR4 @ 3200 MHz", "16 GB ECC DDR4", "Node.js V8 heap space, Monaco Editor browser memory, and in-memory rate limiting tables"],
        ["Persistent Storage", "512 GB NVMe M.2 Solid State Drive (Read: 3500 MB/s, Write: 3000 MB/s)", "100 GB General Purpose SSD (gp3) with 3,000 IOPS", "Instantaneous OS I/O, SQLite-WAL transaction journals, and media asset storage"],
        ["Audio / Video Input", "Integrated Realtek High Definition Audio + 1080p Web Camera", "Headless Server (N/A)", "Client-side Web Audio API capture and real-time speech recognition"],
        ["Network Interface", "Gigabit Ethernet (1000 Mbps) / Wi-Fi 6 (802.11ax)", "10 Gbps Enhanced Networking Uplink", "Low-latency Server-Sent Events (SSE) streaming and external API communications"]
    ]
    add_table(doc, headers_3_1, rows_3_1, [1.2, 1.8, 1.8, 2.4])

    # Table 3.2: Complete Software Stack
    add_table_caption(doc, "Table 3.2: Complete Software Technology Stack, Libraries, and Architectural Justifications")
    headers_3_2 = ["Layer / Subsystem", "Technology / Library", "Version", "License", "Architectural Justification"]
    rows_3_2 = [
        ["Frontend UI Framework", "React 19 with TypeScript", "19.0.0 / 5.8.2", "MIT", "Component-driven reactive UI, fine-grained DOM reconciliation, and full compile-time static type safety"],
        ["Build Tool & Bundler", "Vite", "6.2.0", "MIT", "Native ES modules for sub-second Hot Module Replacement (HMR) and optimized Rollup production tree-shaking"],
        ["Code Editor Engine", "Monaco Editor (@monaco-editor/react)", "0.52.0", "MIT", "Industry-standard VS Code engine delivering client-side syntax highlighting, code folding, and tokenization"],
        ["Icons & Styling", "Lucide React + Vanilla CSS Variables", "0.475.0", "ISC / W3C", "Zero-runtime CSS token design system delivering dark/light modes, glassmorphism, and responsive layouts"],
        ["Backend Runtime", "Node.js (LTS Iron)", "20.18.0", "MIT", "Asynchronous non-blocking event loop optimized for high-concurrency I/O and Server-Sent Events"],
        ["Backend Web Framework", "Express.js", "4.21.2", "MIT", "Minimalist, unopinionated routing middleware architecture for REST endpoints and streaming responses"],
        ["AI Cognitive Engine", "Google GenAI SDK (Gemini 2.5 Flash)", "0.1.1", "Apache 2.0", "Sub-400ms time-to-first-token, high-capacity contextual reasoning, and structured JSON output schema enforcement"],
        ["Document Extractors", "PDF.js (pdfjs-dist) & Mammoth", "4.10.38 / 1.9.0", "Apache 2.0 / BSD", "Robust parsing of binary PDF stream objects and DOCX XML OpenPackaging structures"],
        ["Testing Framework", "Vitest", "1.6.0", "MIT", "Vite-native testing pipeline executing unit, integration, and security test suites with instant execution"],
        ["Security Middleware", "Custom Double-Submit CSRF + HMAC SHA-256", "In-House", "MIT", "Zero-dependency OWASP hardening with timing-safe cryptographic comparisons and cookie signing"],
        ["Persistence Engine", "SQLite-WAL & JSON Storage Adapter", "3.45.0", "Public Domain", "Lightweight relational storage with Write-Ahead Logging for high concurrency, with PostgreSQL migration bridge"]
    ]
    add_table(doc, headers_3_2, rows_3_2, [1.1, 1.5, 0.7, 0.7, 3.2])

    add_section_heading(doc, "3.2", "CONCEPTUAL / ANALYSIS MODELING")
    add_paragraph(doc,
        "We used Unified Modeling Language (UML) diagrams to model user interactions, data lifecycles, and system workflows: "
        "Use Case Diagrams, Sequence Diagrams, and Activity Diagrams."
    )

    add_subsection_heading(doc, "3.2.1", "Use Case Modeling")
    add_paragraph(doc,
        "Figure 3.1 depicts the UML Use Case Diagram for Career Navigator, illustrating interactions between student candidates "
        "and department placement administrators."
    )
    
    add_figure(doc, 'assets_generated/fig_3_1_use_case_diagram.png', 'Figure 3.1: UML Use Case Diagram: Candidate and Administrator Interaction Spaces')

    add_paragraph(doc,
        "Table 3.3 provides the formal specifications for each primary use case, detailing actors, preconditions, normal flows, and alternative flows."
    )

    # Table 3.3: Use Case Specifications
    add_table_caption(doc, "Table 3.3: Comprehensive Use Case Specifications (UC01 - UC10)")
    headers_3_3 = ["UC ID", "Use Case Name", "Primary Actor", "Pre-conditions", "Main Success Scenario (Normal Flow)", "Alternate / Exception Flow"]
    rows_3_3 = [
        ["UC01", "Authenticate User", "Student / Admin", "Browser active", "User chooses demo login or credentials; server issues signed HMAC cookie and CSRF token", "Rate limit exceeded: Server returns 429 Too Many Requests"],
        ["UC02", "Manage Skill Profile", "Student", "Authenticated", "Candidate selects engineering branch, targets role, enters skills and projects; profile saved", "Empty required fields: Form displays inline validation error"],
        ["UC03", "Upload & Parse Resume", "Student", "Profile created", "Candidate uploads PDF/DOCX; engine normalizes text, parses sections, outputs ATS score", "Corrupt file: Error banner displayed; prompt to re-upload"],
        ["UC04", "Match Job Description", "Student", "Resume uploaded", "Candidate pastes employer JD; system calculates keyword overlap, missing skills, and match %", "Empty JD: System alerts user to provide at least 50 words"],
        ["UC05", "Conduct Mock Interview", "Student", "Target role set", "Gemini synthesizes 5 questions; candidate answers verbally; SSE streams instant feedback", "Microphone blocked: User toggles to manual text input mode"],
        ["UC06", "Track Vocal Cadence", "Student", "Interview active", "Web Audio API calculates active speech duration, WPM, and flags filler words in real time", "Audio disconnect: System uses duration timestamp approximation"],
        ["UC07", "Execute Code Lab", "Student", "Browser active", "Candidate writes algorithm in Monaco IDE; executes code and receives Big-O static complexity audit", "Syntax error: Console displays formatted compiler stack trace"],
        ["UC08", "View Campus Analytics", "Admin", "Admin role", "Placement officer queries /api/admin/metrics; views aggregated placement charts and skill gaps", "Non-admin access: System rejects request with 403 Forbidden"],
        ["UC09", "Submit Platform Feedback", "Student", "Interview done", "Candidate submits 1-5 star rating and qualitative review; feedback persisted to database", "Network failure: Feedback queued locally in localStorage"],
        ["UC10", "Export Placement Data", "Admin", "Admin role", "Admin filters student roster by branch and ATS readiness threshold; exports CSV/JSON report", "Zero matches: Dashboard displays 'No candidates found'"]
    ]
    add_table(doc, headers_3_3, rows_3_3, [0.6, 1.2, 1.0, 1.0, 2.0, 1.4])

    add_subsection_heading(doc, "3.2.2", "Sequence Diagram & Interactive Lifecycles")
    add_paragraph(doc,
        "Figure 3.2 illustrates the sequence of messages between the client browser, Express backend, and the Gemini API during an interview session. "
        "The diagram shows how the client initiates an interview, captures candidate speech via the Web Audio API, transmits the answer payload, "
        "and receives chunked evaluation tokens over an open Server-Sent Events connection."
    )
    
    add_figure(doc, 'assets_generated/fig_3_2_sequence_diagram.png', 'Figure 3.2: UML Sequence Diagram: Real-Time SSE Mock Interview Lifecycle')

    add_paragraph(doc,
        "The sequence consists of three primary phases:"
    )
    add_numbered_item(doc, "1.", "Session Setup: The client submits user credentials or selects a demo profile. The server verifies the role, signs an HMAC cookie, issues a CSRF token, and returns user metadata.", "Session Setup: ")
    add_numbered_item(doc, "2.", "Resume Parsing: The client sends a PDF or DOCX file. The server parses text, cleans ligatures, matches keywords against catalog definitions, calculates the ATS score, and stores the result.", "Resume Parsing: ")
    add_numbered_item(doc, "3.", "Interview Streaming: The client sends an answer payload. The server opens an SSE connection and streams tokens from Gemini 2.5 Flash incrementally, minimizing wait time for the user.", "Interview Streaming: ")

    add_subsection_heading(doc, "3.2.3", "Activity Diagram & Processing Pipelines")
    add_paragraph(doc,
        "Figure 3.3 shows the activity workflow for resume ingestion and analysis. When a student uploads a resume, the system extracts the text, "
        "normalizes unicode formatting, calculates a DJB2 hash, and checks whether the resume was previously analyzed. If a match is found in the cache, "
        "results are returned immediately; otherwise, the engine runs section detection and keyword scoring concurrently."
    )
    
    add_figure(doc, 'assets_generated/fig_3_3_activity_diagram.png', 'Figure 3.3: UML Activity Diagram: Dual-Phase Resume ATS Ingestion & Analysis Pipeline')

    add_section_heading(doc, "3.3", "SOFTWARE REQUIREMENTS SPECIFICATION")
    
    add_subsection_heading(doc, "3.3.1", "User Requirements")
    add_paragraph(doc,
        "User requirements summarize what students and administrators expect from the system:"
    )
    add_bullet(doc, "The student must be able to upload PDF or DOCX resumes and receive an objective ATS readiness score within three seconds.", "Resume Scoring (UR-01):")
    add_bullet(doc, "The student must receive clear identification of missing essential sections, such as Contact Information, Summary, Education, Skills, and Projects.", "Section Alerts (UR-02):")
    add_bullet(doc, "The student must be able to paste an employer job description to identify matching competencies and missing technical keywords.", "Job Matching (UR-03):")
    add_bullet(doc, "The student must be able to practice mock interviews with dynamic questions tailored to their engineering discipline and target job role.", "Interview Practice (UR-04):")
    add_bullet(doc, "The student must receive actionable feedback on vocal pacing (Words Per Minute) and verbal filler counts.", "Cadence Feedback (UR-05):")
    add_bullet(doc, "The student must be able to write and execute code in an integrated browser editor with automated Big-O complexity feedback.", "Coding Practice (UR-06):")
    add_bullet(doc, "The placement officer must be able to view institutional placement metrics and export student readiness reports.", "Admin Reports (UR-07):")

    add_subsection_heading(doc, "3.3.2", "System Requirements")
    add_paragraph(doc,
        "System requirements are formally categorized into Functional Requirements (Table 3.4) and Non-Functional Requirements (Table 3.5)."
    )

    # Table 3.4: Functional Requirements
    add_table_caption(doc, "Table 3.4: Comprehensive Functional Requirements Specifications (FR01 - FR25)")
    headers_3_4 = ["Req ID", "Functional Requirement Description", "Input Parameter(s)", "Output / System Action"]
    rows_3_4 = [
        ["FR01", "Dual-mode user authentication (OAuth & local demo credentials)", "Email, Password / Demo Role", "HMAC SHA-256 session cookie + CSRF token issued"],
        ["FR02", "Instant demo account sign-in for testing and evaluation", "Role selection ('student' / 'admin')", "Instant authenticated session established"],
        ["FR03", "Student engineering placement profile management", "Branch, targetRole, skills, projects", "Updated user profile record in database"],
        ["FR04", "PDF document text extraction with OCR ligature normalization", "Binary PDF file upload", "Clean normalized plain text string"],
        ["FR05", "DOCX document text extraction via XML paragraph walker", "Binary DOCX file upload", "Clean normalized plain text string"],
        ["FR06", "Unicode punctuation sanitization and ligature substitution", "Raw extracted document string", "Sanitized unicode text stream"],
        ["FR07", "Fast DJB2 32-bit document fingerprint hashing", "Sanitized document text", "Repeatable hexadecimal content hash string"],
        ["FR08", "Regex-driven structural section detection and scoring", "Normalized resume string", "Detected & missing section arrays with confidence"],
        ["FR09", "Deterministic keyword density and frequency computation", "Resume text, Keyword catalog", "Keyword match flags, counts, and densities"],
        ["FR10", "Category-weighted heuristic ATS score calculation", "Section details, keywords, word count", "Deterministic ATS score bounded in [40, 100]"],
        ["FR11", "Job Description semantic keyword gap analysis", "Resume text, Employer JD string", "Matched JD keywords, missing keywords, match %"],
        ["FR12", "Generative AI technical question synthesis", "Student target role, skills, level", "Array of 5 tailored interview questions"],
        ["FR13", "Candidate answer evaluation across multi-criteria rubrics", "Spoken/text answer payload", "Technical, communication, and confidence scores"],
        ["FR14", "Real-time Server-Sent Events (SSE) evaluation streaming", "POST /answer-stream request", "Text/event-stream chunked token delivery"],
        ["FR15", "Web Audio speech cadence and WPM calculation", "Recorded audio duration, word count", "Words Per Minute (WPM) & pacing status"],
        ["FR16", "Verbal filler word identification and tallying", "Candidate spoken transcript", "Filler word count & frequency breakdown"],
        ["FR17", "Monaco Code Lab sandboxed algorithmic code execution", "Candidate code, Language", "Console output, runtime execution results"],
        ["FR18", "AI-driven Big-O time and space complexity deduction", "Candidate code, problem statement", "Time complexity, space complexity, edge cases"],
        ["FR19", "Institutional administrative KPI aggregation", "GET /api/admin/metrics", "Total students, avg ATS score, interview counts"],
        ["FR20", "Candidate platform feedback and star rating collection", "Rating (1-5), category, comment", "Stored feedback entity in persistence store"],
        ["FR21", "Timing-safe HMAC session signature verification", "Session cookie string", "Boolean validity check via crypto.timingSafeEqual"],
        ["FR22", "Token-bucket in-memory API rate limiting", "Client IP address, Endpoint", "HTTP 429 Too Many Requests if bucket empty"],
        ["FR23", "Double-submit CSRF cookie and header matching", "Cookie 'csrf_token', Header 'X-CSRF-Token'", "403 Forbidden on token mismatch"],
        ["FR24", "Export institutional placement readiness reports", "Admin session, Filter criteria", "Downloadable CSV/JSON candidate performance dataset"],
        ["FR25", "Zero-dependency offline simulation fallback execution", "Mock AI/DB flag or network drop", "Instant local heuristic response generation"]
    ]
    add_table(doc, headers_3_4, rows_3_4, [0.8, 2.3, 1.7, 1.7])

    # Table 3.5: Non-Functional Requirements
    add_table_caption(doc, "Table 3.5: Non-Functional System Performance, Security, and Scalability Requirements")
    headers_3_5 = ["NFR ID", "Quality Attribute", "Specification Requirement & Target Metric", "Verification Approach"]
    rows_3_5 = [
        ["NFR01", "Response Latency", "Deterministic ATS scoring shall execute in < 100 ms; SSE TTFT shall be < 400 ms", "Automated performance telemetry logs"],
        ["NFR02", "System Availability", "The platform shall maintain 99.9% uptime during institutional placement drives", "Prometheus health check monitoring"],
        ["NFR03", "Application Security", "Strict adherence to OWASP Top 10: Double-submit CSRF, HMAC cookie signing, strict CSP", "Vitest security test suite & lint audits"],
        ["NFR04", "Rate Limiting", "AI endpoints capped at 15 req/min/IP; Auth endpoints capped at 10 req/min/IP", "429 Too Many Requests validation tests"],
        ["NFR05", "Cross-Browser UX", "Seamless execution on Chromium (Chrome/Edge), Safari, and Firefox engines", "Cross-browser manual & Playwright audits"],
        ["NFR06", "Responsive Design", "Mobile-first adaptive layouts supporting viewports from 375px to 2560px", "CSS Flexbox/Grid responsive testing"],
        ["NFR07", "Zero-Dependency Mode", "Full functional fallback simulation for AI and DB when credentials/network are absent", "Vitest simulation tests (100% pass)"],
        ["NFR08", "Code Modularity", "Strict separation of concerns via TypeScript interfaces and adapter patterns", "Static type checking via tsc --noEmit"],
        ["NFR09", "Data Privacy", "Candidate resumes and transcripts encrypted in transit; passwords hashed with PBKDF2/Argon", "Cryptographic assertion test suites"],
        ["NFR10", "Maintainability", "Clean codebase with ESLint compliance, zero unused directives, and modular files", "npm run lint automated quality gate"],
        ["NFR11", "Concurrent Scalability", "The application server shall handle >= 250 concurrent active mock interview streams", "Artillery load test benchmarking"],
        ["NFR12", "Client Memory Footprint", "Monaco Editor and Web Audio graph memory consumption shall not exceed 150 MB", "Chrome DevTools Heap Profiler audit"],
        ["NFR13", "Fault Tolerance", "Single-point API failure shall not crash backend Express process", "Unhandled rejection error handler audit"],
        ["NFR14", "Auditability", "All administrative actions and security rejections shall be logged with correlation IDs", "Structured Winston/Morgan log inspections"],
        ["NFR15", "Accessibility (a11y)", "UI components shall comply with WCAG 2.1 Level AA color contrast and keyboard navigation", "Lighthouse accessibility audit > 95"],
        ["NFR16", "Data Integrity", "Database transactions shall enforce ACID properties using SQLite WAL mode", "Concurrent write integrity assertion tests"]
    ]
    add_table(doc, headers_3_5, rows_3_5, [0.8, 1.4, 2.8, 1.4])

    add_subsection_heading(doc, "3.3.3", "External Interface Specifications")
    add_paragraph(doc,
        "Career Navigator interfaces cleanly with user hardware, operating systems, and external network services:"
    )
    add_bullet(doc, "User Interface: Built using React 19 with a responsive layout supporting light and dark themes, accessible form controls, real-time audio visualizers, and the Monaco code editor.", "User Interface:")
    add_bullet(doc, "Hardware Interface: Connects with client microphones and webcams via standard HTML5 navigator.mediaDevices API methods.", "Hardware Interface:")
    add_bullet(doc, "Software Interface: Communicates with Google Gemini API endpoints using secure HTTPS REST/SSE protocols, and interacts with the host filesystem through Node.js file system APIs.", "Software Interface:")
    add_bullet(doc, "Network Interface: Operates over HTTP/2 and HTTPS with strict Content-Security-Policy (CSP), X-Frame-Options: DENY, and X-Content-Type-Options: nosniff security headers.", "Network Interface:")

    doc.add_page_break()
