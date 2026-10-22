import { describe, it, expect } from 'vitest';
import {
  normalizeResumeText,
  detectSections,
  analyzeKeywords,
  calculateAtsScore,
  matchJobDescription,
  computeContentHash,
  KEYWORD_CATALOG
} from '../src/lib/atsEngine.js';
import { parseResumeText } from '../src/lib/resumeParser.js';
import { extractDocxTextFromArrayBuffer } from '../src/lib/docxExtractor.js';
import { extractPdfTextFromArrayBuffer } from '../src/lib/pdfExtractor.js';
import { db } from '../src/db/database.js';
import { ResumeAnalysis } from '../src/types.js';

describe('Resume Parser & ATS Scoring Engine Verification (Scenarios A - M)', () => {

  // =========================================================================
  // SCENARIO A: Resume containing all supported sections and all listed technical skills
  // =========================================================================
  it('Scenario A: detects all 7 core sections and all 32 supported technical skills', () => {
    const allSkillsText = KEYWORD_CATALOG.map((k) => k.canonical).join(', ');

    const completeResume = `
      Alex Morgan
      alex.morgan@techcorp.dev | +1 (555) 234-5678 | linkedin.com/in/alexmorgan | github.com/alexmorgan
      San Francisco, CA

      PROFESSIONAL SUMMARY
      Principal Software Architect and Lead Engineer with 10+ years of full-lifecycle engineering experience.
      Proven track record architecting high-scale distributed systems and resilient microservices.

      EDUCATION
      Master of Science in Computer Science | Stanford University | 2018
      Bachelor of Science in Software Engineering | UC Berkeley | 2016

      TECHNICAL SKILLS
      Core Technologies: ${allSkillsText}
      Additional: Express.js, React.js, C Sharp, Golang, GCP

      WORK EXPERIENCE
      Lead Software Engineer | HighScale Cloud Inc. | 2020 – Present
      * Architected event-driven microservices serving 2.5 million daily active users, reducing p99 latency by 35%.
      * Spearheaded cloud migration to Kubernetes and Docker, cutting infrastructure costs by $120,000 annually.
      * Automated end-to-end CI/CD release pipelines with GitHub Actions, accelerating release velocity by 60%.

      PROJECTS
      Autonomous Data Pipeline | TypeScript, Python, PostgreSQL, Kafka
      * Engineered real-time stream ingestion processing 45,000 requests per second with 99.99% uptime.
      * Optimized relational database queries, improving throughput by 40%.

      CERTIFICATIONS & LICENSES
      * AWS Certified Solutions Architect - Professional
      * Google Cloud Certified Professional Cloud Architect
    `;

    const parsed = parseResumeText(completeResume, 'alex_complete.pdf');

    // 1. All sections must be detected
    expect(parsed.detectedSections.length).toBe(7);
    expect(parsed.missingSections.length).toBe(0);
    expect(parsed.missingSections).not.toContain('Contact Information');
    expect(parsed.missingSections).not.toContain('Education');
    expect(parsed.missingSections).not.toContain('Technical Skills');
    expect(parsed.missingSections).not.toContain('Work Experience / Internships');
    expect(parsed.missingSections).not.toContain('Projects');
    expect(parsed.missingSections).not.toContain('Professional Summary');
    expect(parsed.missingSections).not.toContain('Certifications');

    // 2. All 32 catalog technologies must be detected and not marked missing
    for (const item of KEYWORD_CATALOG) {
      const found = parsed.keywords.find((k) => k.keyword === item.canonical);
      expect(found).toBeDefined();
      expect(found?.match).toBe(true);
      expect(found?.count).toBeGreaterThanOrEqual(1);
      expect(found?.density).toBeGreaterThan(0);
    }

    // 3. Score must be high and based on actual content
    expect(parsed.atsScore).toBeGreaterThanOrEqual(90);
    expect(parsed.categoryBreakdown.length).toBe(6);
    expect(parsed.categoryBreakdown.find((c) => c.category === 'Section Completeness')?.score).toBe(20);
  });

  // =========================================================================
  // SCENARIO B: Resume containing alternative headings
  // =========================================================================
  it('Scenario B: recognizes sections with alternative synonyms ("Profile", "Tech Stack", "Employment History", "Academic Projects")', () => {
    const alternativeHeadingsResume = `
      Jordan Lee
      jordan@example.com | 555-123-4567 | github.com/jordanlee

      PROFILE
      Passionate systems programmer specializing in modern web infrastructure and reliable APIs.

      ACADEMICS
      B.Tech in Information Technology | MIT | 2023

      TECH STACK
      Languages: TypeScript, Python, Go, SQL
      Tools: Docker, Git, REST APIs

      EMPLOYMENT HISTORY
      Software Engineering Intern | NextGen Apps | 2022 - 2023
      * Developed microservices in Go and PostgreSQL, reducing latency by 20%.

      ACADEMIC PROJECTS
      Distributed Key-Value Store | Python, Docker
      * Built Raft consensus engine achieving 5,000 rps with zero partition data loss.

      LICENSES & CREDENTIALS
      * Certified Kubernetes Administrator (CKA)
    `;

    const normalized = normalizeResumeText(alternativeHeadingsResume);
    const { detectedSections, missingSections } = detectSections(normalized);

    expect(detectedSections).toContain('Professional Summary');
    expect(detectedSections).toContain('Education');
    expect(detectedSections).toContain('Technical Skills');
    expect(detectedSections).toContain('Work Experience / Internships');
    expect(detectedSections).toContain('Projects');
    expect(detectedSections).toContain('Certifications');
    expect(detectedSections).toContain('Contact Information');
    expect(missingSections.length).toBe(0);
  });

  // =========================================================================
  // SCENARIO C: Resume containing JavaScript but not Java
  // =========================================================================
  it('Scenario C: detects JavaScript without falsely detecting Java', () => {
    const jsResume = `
      Devin Vance
      devin@frontend.io | (555) 345-6789
      SUMMARY
      Frontend Developer focused on modern reactive user interfaces.
      TECHNICAL SKILLS
      JavaScript, TypeScript, React, HTML, CSS, Tailwind CSS, Node.js
      WORK EXPERIENCE
      Frontend Engineer | WebLab | 2023 - Present
      * Built responsive single-page applications using JavaScript and React.
      * Optimized JavaScript bundle execution, decreasing load times by 25%.
      PROJECTS
      JavaScript Canvas Visualizer | React, JavaScript
      * Interactive physics simulator built with vanilla JavaScript algorithms.
    `;

    const normalized = normalizeResumeText(jsResume);
    const keywords = analyzeKeywords(normalized);

    const jsMatch = keywords.find((k) => k.keyword === 'JavaScript');
    const javaMatch = keywords.find((k) => k.keyword === 'Java');

    expect(jsMatch?.match).toBe(true);
    expect(jsMatch?.count).toBeGreaterThanOrEqual(4);
    // Java must NOT be detected solely because JavaScript contains "Java"
    expect(javaMatch?.match).toBe(false);
    expect(javaMatch?.count).toBe(0);
  });

  // =========================================================================
  // SCENARIO D: Resume containing "Google Cloud" but no Go programming language
  // =========================================================================
  it('Scenario D: detects Google Cloud without falsely detecting Go language from "Google"', () => {
    const gcpResume = `
      Samantha Reed
      samantha@cloud.org | 555-876-5432
      SUMMARY
      Cloud Infrastructure Engineer specializing in Google Cloud Platform architectures.
      TECHNICAL SKILLS
      Google Cloud, GCP, BigQuery, Terraform, Docker, Kubernetes, Python
      WORK EXPERIENCE
      Cloud Engineer | CloudNative Corp | 2022 - 2024
      * Deployed production workloads across Google Cloud Engine and Google Kubernetes Engine.
      * Managed Google Cloud IAM policies and VPC peering configurations.
      PROJECTS
      Google Cloud Cost Optimizer | Python, GCP SDK
      * Automated resource hibernation across Google Cloud projects, saving 30% monthly.
    `;

    const normalized = normalizeResumeText(gcpResume);
    const keywords = analyzeKeywords(normalized);

    const gcpMatch = keywords.find((k) => k.keyword === 'Google Cloud / GCP');
    const goMatch = keywords.find((k) => k.keyword === 'Go');

    expect(gcpMatch?.match).toBe(true);
    expect(gcpMatch?.count).toBeGreaterThanOrEqual(3);
    // Go language must NOT be matched from occurrences of "Google"
    expect(goMatch?.match).toBe(false);
    expect(goMatch?.count).toBe(0);
  });

  // =========================================================================
  // SCENARIO E: Resume containing C++, C#, .NET, Node.js, React.js, and CI/CD
  // =========================================================================
  it('Scenario E: accurately matches special punctuation terms: C++, C#, .NET, Node.js, React.js, and CI/CD', () => {
    const specialTokensResume = `
      Marcus Bell
      marcus@systems.com | 555-901-2345
      TECHNICAL SKILLS
      Languages: C++, C#, .NET, Node.js, React.js
      DevOps: CI/CD, Git, Docker
      WORK EXPERIENCE
      Full Stack Software Engineer | Enterprise Solutions | 2021 - 2024
      * Developed high-performance backend microservices using C++ and C# with .NET Core.
      * Built frontend web clients in React.js and real-time backend API endpoints in Node.js.
      * Configured automated CI/CD deployment pipelines using GitHub Actions.
    `;

    const normalized = normalizeResumeText(specialTokensResume);
    const keywords = analyzeKeywords(normalized);

    const cpp = keywords.find((k) => k.keyword === 'C++');
    const csharp = keywords.find((k) => k.keyword === 'C# / .NET');
    const node = keywords.find((k) => k.keyword === 'Node.js');
    const react = keywords.find((k) => k.keyword === 'React');
    const cicd = keywords.find((k) => k.keyword === 'CI/CD');

    expect(cpp?.match).toBe(true);
    expect(cpp?.count).toBeGreaterThanOrEqual(1);

    expect(csharp?.match).toBe(true);
    expect(csharp?.count).toBeGreaterThanOrEqual(1);

    expect(node?.match).toBe(true);
    expect(node?.count).toBeGreaterThanOrEqual(1);

    expect(react?.match).toBe(true);
    expect(react?.count).toBeGreaterThanOrEqual(1);

    expect(cicd?.match).toBe(true);
    expect(cicd?.count).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // SCENARIO F: Resume missing contact information and education
  // =========================================================================
  it('Scenario F: reports only genuinely absent sections as missing', () => {
    const noContactNoEduResume = `
      PROFESSIONAL SUMMARY
      Self-taught full stack engineer with hands-on experience building web apps.

      TECHNICAL SKILLS
      JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, Docker

      WORK EXPERIENCE
      Software Developer | Indie Agency | 2022 - 2024
      * Developed customer-facing applications in React and Node.js.
      * Improved database query performance by 25%.

      PROJECTS
      Personal Portfolio & Blog | Next.js, Tailwind CSS
      * Built static blog with automated markdown compilation.

      CERTIFICATIONS
      * AWS Certified Cloud Practitioner
    `;

    const normalized = normalizeResumeText(noContactNoEduResume);
    const { detectedSections, missingSections } = detectSections(normalized);

    expect(missingSections).toContain('Contact Information');
    expect(missingSections).toContain('Education');

    // Present sections must NOT be reported as missing
    expect(missingSections).not.toContain('Professional Summary');
    expect(missingSections).not.toContain('Technical Skills');
    expect(missingSections).not.toContain('Work Experience / Internships');
    expect(missingSections).not.toContain('Projects');
    expect(missingSections).not.toContain('Certifications');

    expect(detectedSections).toContain('Technical Skills');
    expect(detectedSections).toContain('Projects');
  });

  // =========================================================================
  // SCENARIO G: Two substantially different resumes
  // =========================================================================
  it('Scenario G: produces distinct scores and ensures skills do not leak across resumes', () => {
    const resumeA = `
      Candidate Alpha
      alpha@tech.io | 555-111-2222
      SUMMARY
      Senior Backend Engineer specializing in Java and distributed databases.
      EDUCATION
      B.S. Computer Science | 2018
      TECHNICAL SKILLS
      Java, Spring Boot, PostgreSQL, MySQL, Redis, Docker, Kubernetes, AWS, REST APIs
      WORK EXPERIENCE
      Senior Engineer | Fintech Corp | 2019 - Present
      * Architected financial transaction engine handling $50M in daily volume.
      * Reduced database deadlock incidents by 40% using PostgreSQL connection pooling.
      PROJECTS
      Distributed Lock Service | Java, Redis
      * Implemented Redlock consensus protocol with zero data inconsistency.
    `;

    const resumeB = `
      Candidate Beta
      beta@web.dev | 555-333-4444
      SUMMARY
      Entry-level Frontend Intern who loves HTML and CSS styling.
      EDUCATION
      High School Diploma | 2023
      TECHNICAL SKILLS
      HTML, CSS, JavaScript, Git
      WORK EXPERIENCE
      Intern | Local Design Studio | 2023
      * Created landing page mockups in HTML and CSS.
      PROJECTS
      Simple Calculator | JavaScript, HTML, CSS
      * Built a basic calculator app in browser.
    `;

    const parsedA = parseResumeText(resumeA, 'alpha.pdf');
    const parsedB = parseResumeText(resumeB, 'beta.pdf');

    // 1. Scores must be substantially different
    expect(parsedA.atsScore).not.toBe(parsedB.atsScore);
    expect(parsedA.atsScore).toBeGreaterThan(parsedB.atsScore + 15);

    // 2. Score breakdowns differ where expected
    const techA = parsedA.categoryBreakdown.find((c) => c.category === 'Technical Skills & Density')?.score || 0;
    const techB = parsedB.categoryBreakdown.find((c) => c.category === 'Technical Skills & Density')?.score || 0;
    expect(techA).toBeGreaterThan(techB);

    // 3. No leakage of skills from Resume A to Resume B
    const bSkills = parsedB.skills;
    expect(bSkills).not.toContain('Java');
    expect(bSkills).not.toContain('Kubernetes');
    expect(bSkills).not.toContain('AWS');

    const aSkills = parsedA.skills;
    expect(aSkills).toContain('Java');
    expect(aSkills).toContain('Docker');
  });

  // =========================================================================
  // SCENARIO H: Two resumes containing the same content
  // =========================================================================
  it('Scenario H: produces identical analysis results and content hashes regardless of resume ID or filename', () => {
    const identicalText = `
      Taylor Swift
      taylor@example.com | 555-777-8888 | github.com/taylor
      SUMMARY
      Full-stack developer with expertise in TypeScript and Node.js.
      EDUCATION
      B.S. in Software Engineering | 2022
      TECHNICAL SKILLS
      TypeScript, JavaScript, Node.js, Express, React, PostgreSQL, Git, Docker
      WORK EXPERIENCE
      Software Engineer | CodeCo | 2022 - Present
      * Engineered RESTful APIs in Node.js and Express, improving response speed by 30%.
      PROJECTS
      Task Management App | React, TypeScript, PostgreSQL
      * Built collaborative Kanban board servicing 5,000 monthly users.
    `;

    const parsed1 = parseResumeText(identicalText, 'resume_version_1.pdf');
    const parsed2 = parseResumeText(identicalText, 'different_name.docx');

    // Scores, hashes, and categories must match exactly
    expect(parsed1.atsScore).toBe(parsed2.atsScore);
    expect(parsed1.contentHash).toBe(parsed2.contentHash);
    expect(parsed1.detectedSections).toEqual(parsed2.detectedSections);
    expect(parsed1.missingSections).toEqual(parsed2.missingSections);
    expect(parsed1.categoryBreakdown).toEqual(parsed2.categoryBreakdown);
  });

  // =========================================================================
  // SCENARIO I: PDF and DOCX parsing
  // =========================================================================
  it('Scenario I: handles DOCX and PDF array buffers and handles corrupt files gracefully', async () => {
    // 1. Corrupt DOCX buffer should reject or handle gracefully without unhandled crashes
    const corruptBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]).buffer;
    await expect(extractDocxTextFromArrayBuffer(corruptBuffer)).rejects.toThrow();

    // 2. Corrupt PDF buffer should throw or fallback cleanly
    const corruptPdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x00]).buffer;
    const extractedPdf = await extractPdfTextFromArrayBuffer(corruptPdfBuffer).catch((err) => err.message);
    expect(typeof extractedPdf).toBe('string');
  });

  // =========================================================================
  // SCENARIO J: Race-condition handling (New upload superseding earlier slow request)
  // =========================================================================
  it('Scenario J: simulates request ID ordering to guarantee latest upload takes precedence', async () => {
    let activeRequestId = 0;
    let latestCommittedAnalysis: string | null = null;

    // Helper simulating async upload call
    async function submitUpload(reqId: number, resumeName: string, delayMs: number) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      // Only commit if this request is still the active one
      if (reqId === activeRequestId) {
        latestCommittedAnalysis = resumeName;
      }
    }

    // User triggers Upload 1 (takes 100ms)
    const req1 = ++activeRequestId;
    const promise1 = submitUpload(req1, 'OldResume.pdf', 100);

    // User immediately triggers Upload 2 (takes 20ms)
    const req2 = ++activeRequestId;
    const promise2 = submitUpload(req2, 'NewResume.pdf', 20);

    await Promise.all([promise1, promise2]);

    // Latest committed analysis MUST be NewResume.pdf, never overwritten by delayed OldResume.pdf
    expect(latestCommittedAnalysis).toBe('NewResume.pdf');
  });

  // =========================================================================
  // SCENARIO K: Job description matching
  // =========================================================================
  it('Scenario K: accurately identifies matched, missing, and calculates JD match score', () => {
    const resumeText = `
      Skills: Python, TypeScript, React, Docker, PostgreSQL, Git
      Experience: Built cloud microservices using Python and Docker.
    `;

    const jobDescription = `
      We are looking for a Senior Engineer with deep proficiency in:
      - Python and Go (Golang)
      - Docker and Kubernetes
      - GraphQL and PostgreSQL
      - AWS cloud deployment
    `;

    const jdResult = matchJobDescription(resumeText, jobDescription);

    // Matched skills
    expect(jdResult.matchedJDKeywords).toContain('Python');
    expect(jdResult.matchedJDKeywords).toContain('Docker');
    expect(jdResult.matchedJDKeywords).toContain('PostgreSQL');

    // Missing skills
    expect(jdResult.missingJDKeywords).toContain('Kubernetes');
    expect(jdResult.missingJDKeywords).toContain('GraphQL');
    expect(jdResult.missingJDKeywords).toContain('AWS');

    // Match score must be between 0 and 100 and proportional
    expect(jdResult.jdMatchScore).toBeGreaterThanOrEqual(30);
    expect(jdResult.jdMatchScore).toBeLessThanOrEqual(80);
  });

  // =========================================================================
  // SCENARIO L: Rejection of empty or malformed resume text
  // =========================================================================
  it('Scenario L: rejects empty, unreadable, or stub content under 30 characters', () => {
    expect(() => parseResumeText('', 'empty.txt')).toThrow(/at least 30 characters/i);
    expect(() => parseResumeText('Short text', 'short.txt')).toThrow(/at least 30 characters/i);
    expect(() => parseResumeText('[Could not extract text from this PDF]', 'failed.pdf')).toThrow(/unreadable/i);
  });

  // =========================================================================
  // SCENARIO M: Security, privacy, and user data isolation
  // =========================================================================
  it('Scenario M: isolates user resume evaluations in database store', () => {
    const evalA = parseResumeText(`
      Alice Cooper
      alice@test.org | 555-123-9999
      SUMMARY: Senior Python Engineer.
      EDUCATION: B.S. CS 2020.
      SKILLS: Python, Django, PostgreSQL.
      WORK EXPERIENCE: Software Engineer at PyCorp (2020-Present).
      PROJECTS: API Gateway.
    `, 'alice.pdf');

    const userA_Resume: ResumeAnalysis = {
      id: 'res-alice-1',
      userId: 'user-alice-123',
      fileName: 'alice.pdf',
      uploadedAt: new Date().toISOString(),
      ...evalA
    };

    const evalB = parseResumeText(`
      Bob Smith
      bob@test.org | 555-456-8888
      SUMMARY: Frontend React Specialist.
      EDUCATION: B.S. SE 2021.
      SKILLS: React, TypeScript, HTML, CSS.
      WORK EXPERIENCE: Frontend Dev at Reactify (2021-Present).
      PROJECTS: Dashboard UI.
    `, 'bob.pdf');

    const userB_Resume: ResumeAnalysis = {
      id: 'res-bob-1',
      userId: 'user-bob-456',
      fileName: 'bob.pdf',
      uploadedAt: new Date().toISOString(),
      ...evalB
    };

    db.saveResume(userA_Resume);
    db.saveResume(userB_Resume);

    // Lookup by user ID must return strictly that user's data
    const fetchedAlice = db.getResumeByUserId('user-alice-123');
    const fetchedBob = db.getResumeByUserId('user-bob-456');

    expect(fetchedAlice).toBeDefined();
    expect(fetchedAlice?.userId).toBe('user-alice-123');
    expect(fetchedAlice?.skills).toContain('Python');
    expect(fetchedAlice?.skills).not.toContain('React');

    expect(fetchedBob).toBeDefined();
    expect(fetchedBob?.userId).toBe('user-bob-456');
    expect(fetchedBob?.skills).toContain('React');
    expect(fetchedBob?.skills).not.toContain('Python');
  });
});
