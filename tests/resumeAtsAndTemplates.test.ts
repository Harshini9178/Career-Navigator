import { describe, it, expect } from 'vitest';
import { aiService } from '../src/lib/gemini.js';
import { db } from '../src/db/database.js';

describe('Resume ATS Dynamic Scoring & Template Enhancements', () => {
  it('should generate distinct ATS scores for different resumes (avoiding static 95 score clamp)', () => {
    const briefStubResume = `
      John Doe
      I am a beginner programmer looking for a job.
      I know some Python.
    `;

    const polishedEngineerResume = `
      Alex Mercer
      alex.mercer@gmail.com | +1 555-019-2834 | linkedin.com/in/alexmercer | github.com/alexmercer

      SUMMARY
      Full-Stack Software Engineer with 3 years of experience architecting resilient cloud services and reactive web applications.

      EDUCATION
      B.S. in Computer Science | University of California, Berkeley | GPA: 3.8/4.0 | 2024

      TECHNICAL SKILLS
      Languages: TypeScript, JavaScript, Python, SQL, C++, HTML, CSS
      Frameworks: React, Next.js, Node.js, Express, Tailwind CSS, PyTorch
      Cloud & DevOps: Docker, Kubernetes, AWS, PostgreSQL, Redis, CI/CD, Git

      WORK EXPERIENCE
      Software Engineer Intern | CloudScale Systems | 2023 - 2024
      * Architected and deployed microservice APIs in Node.js and PostgreSQL, reducing p99 API response latency by 34%.
      * Engineered dynamic dashboard in React and Tailwind CSS servicing 120,000+ daily active users.
      * Automated CI/CD pipelines utilizing GitHub Actions and Docker, reducing build failure rates by 45%.

      PROJECTS
      Distributed Cache Engine | Go, Redis, Docker
      * Designed an in-memory distributed cache cluster with consistent hashing, achieving 18,000 requests per second.

      CERTIFICATIONS
      * AWS Certified Solutions Architect - Associate
    `;

    const stubResult = aiService.simulateResumeAnalysis(briefStubResume, 'stub.txt');
    const polishedResult = aiService.simulateResumeAnalysis(polishedEngineerResume, 'alex_resume.pdf');

    // The two resumes MUST have distinct, non-identical scores
    expect(stubResult.atsScore).not.toBe(polishedResult.atsScore);

    // Stub resume should have a lower score due to missing sections and metrics
    expect(stubResult.atsScore).toBeLessThan(60);

    // Polished resume should achieve a high score
    expect(polishedResult.atsScore).toBeGreaterThan(80);

    // Missing sections should be detected accurately
    expect(stubResult.missingSections).toContain('Education');
    expect(stubResult.missingSections).toContain('Projects');
    expect(polishedResult.missingSections.length).toBeLessThan(stubResult.missingSections.length);

    // Skills extracted should be specific to each resume
    expect(stubResult.skills).toContain('Python');
    expect(polishedResult.skills).toContain('TypeScript');
    expect(polishedResult.skills).toContain('React');
    expect(polishedResult.skills).toContain('Docker & Containers');
  });

  it('should dynamically calculate scores and tailored advice based on target job role', () => {
    const webDeveloperResume = `
      Sarah Connor
      sarah.connor@gmail.com | github.com/sarahconnor | linkedin.com/in/sarahconnor
      SUMMARY
      Frontend Developer with 2 years of experience building high-performance web applications in React and TypeScript.
      EDUCATION
      B.S. in Computer Science | 2024
      TECHNICAL SKILLS
      React, Next.js, TypeScript, JavaScript, HTML, CSS, Tailwind CSS, Redux, Vite, UI/UX, Responsive Design, Jest
      WORK EXPERIENCE
      Frontend Engineer | WebTech
      * Engineered responsive interfaces using React, TypeScript and Tailwind CSS for 50k+ active users.
      * Optimized Lighthouse core web vitals score from 62 to 94, reducing FID by 40%.
      PROJECTS
      Analytics Dashboard | React, TypeScript, Chart.js
      * Built real-time charting dashboard servicing 15,000 queries per day.
      CERTIFICATIONS
      * Meta Frontend Developer Professional Certificate
    `;

    const frontendResult = aiService.simulateResumeAnalysis(webDeveloperResume, 'sarah_resume.pdf', 'Frontend Developer');
    const embeddedResult = aiService.simulateResumeAnalysis(webDeveloperResume, 'sarah_resume.pdf', 'Embedded Systems Engineer');

    // Frontend role score should be significantly higher than Embedded role score for a frontend resume
    expect(frontendResult.atsScore).toBeGreaterThan(embeddedResult.atsScore);
    expect(frontendResult.atsScore).toBeGreaterThanOrEqual(80);
    expect(embeddedResult.atsScore).toBeLessThan(frontendResult.atsScore - 15);

    // Target roles should be captured
    expect(frontendResult.targetRole).toBe('Frontend Developer');
    expect(embeddedResult.targetRole).toBe('Embedded Systems Engineer');

    // Suggestions should be tailored to the specific role
    expect(embeddedResult.suggestions.some(s => s.toLowerCase().includes('embedded') || s.toLowerCase().includes('rtos') || s.toLowerCase().includes('c++'))).toBe(true);
  });

  it('should expose AI status configuration and support quick ask queries', async () => {
    const status = aiService.getStatus();
    expect(status).toHaveProperty('configured');
    expect(status).toHaveProperty('model');
    expect(status).toHaveProperty('status');
    expect(status.features.length).toBeGreaterThan(0);

    const quickAskResult = await aiService.quickAsk('Explain the CAP theorem');
    expect(quickAskResult.answer).toBeDefined();
    expect(quickAskResult.answer.toLowerCase()).toContain('consistency');
  });

  it('should offer expanded domain templates and support custom template imports', () => {
    const templates = db.getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(8);

    const customTemplate = {
      id: `custom-test-${Date.now()}`,
      name: 'FinTech Quantitative Developer ATS Format',
      description: 'Specialized layout for high-frequency trading and financial risk models.',
      downloadCount: 0,
      fileContent: '# Quantitative Developer Resume\n## SKILLS\nC++, Python, CUDA, TimescaleDB'
    };

    const saved = db.addTemplate(customTemplate);
    expect(saved.id).toBe(customTemplate.id);

    const updatedTemplates = db.getTemplates();
    const found = updatedTemplates.find((t) => t.id === customTemplate.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('FinTech Quantitative Developer ATS Format');
  });
});
