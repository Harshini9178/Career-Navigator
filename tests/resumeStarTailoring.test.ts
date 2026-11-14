import { describe, it, expect } from 'vitest';
import { aiService, extractTextFromResumeContent } from '../src/lib/gemini.js';
import { ResumeContent } from '../src/types.js';

describe('Automated Job-Specific Resume Tailoring (STAR Method)', () => {
  const sampleResumeText = `
    Harshini SDE - Full Stack Developer
    Email: harshini@example.com | Phone: +1-555-0199 | Location: San Francisco, CA
    Summary: Enthusiastic developer experienced with React, Node.js, and MongoDB.
    Experience:
    Software Developer at TechCorp (2022 - Present)
    - Built responsive web interfaces using React and Tailwind CSS.
    - Wrote REST APIs with Node.js and Express.
    - Maintained MongoDB databases and optimized basic queries.
    Skills: React, JavaScript, Node.js, Express, MongoDB, Git.
  `;

  const sampleJobDescription = `
    Senior Full-Stack Cloud & DevOps Engineer
    Requirements:
    - 3+ years experience with React, TypeScript, Node.js, and Docker.
    - Proven track record with AWS (ECS, Lambda, S3) and Kubernetes orchestration.
    - Deep knowledge of PostgreSQL, Redis caching, and CI/CD pipelines (GitHub Actions).
    - Strong understanding of microservices architecture and API latency optimization.
  `;

  it('should analyze keyword gaps and generate STAR method bullet rewrites with quantifiable metrics', () => {
    const result = aiService.simulateStarRewrites(
      sampleResumeText,
      sampleJobDescription,
      'Senior Cloud & Full Stack Engineer',
      'Acme Global'
    );

    // Verify overall analysis structure
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
    expect(result.missingKeywords.length).toBeGreaterThan(0);

    // Matched skills should recognize React and Node.js
    const matchedLower = result.matchedKeywords.map((k) => k.toLowerCase());
    expect(matchedLower.some((k) => k.includes('react'))).toBe(true);
    expect(matchedLower.some((k) => k.includes('node'))).toBe(true);

    // Missing skills should identify Docker, AWS, Kubernetes, Redis, or PostgreSQL
    const missingLower = result.missingKeywords.map((k) => k.toLowerCase());
    expect(
      missingLower.some((k) =>
        ['docker', 'aws', 'kubernetes', 'redis', 'postgresql', 'ci/cd'].includes(k)
      )
    ).toBe(true);

    // Verify STAR bullet rewrites
    expect(result.tailoredBullets.length).toBeGreaterThanOrEqual(3);

    result.tailoredBullets.forEach((bullet) => {
      // 1. Situation: Must provide business or technical background
      expect(bullet.situation).toBeDefined();
      expect(bullet.situation.trim().length).toBeGreaterThan(10);

      // 2. Task: Must provide explicit mission/task
      expect(bullet.task).toBeDefined();
      expect(bullet.task.trim().length).toBeGreaterThan(10);

      // 3. Action: Must state concrete technical actions taken
      expect(bullet.action).toBeDefined();
      expect(bullet.action.trim().length).toBeGreaterThan(10);

      // 4. Result: Must contain quantifiable metrics (e.g. %, ms, X-factor, reduction, increase)
      expect(bullet.resultMetric).toBeDefined();
      expect(bullet.resultMetric.trim().length).toBeGreaterThan(5);
      const hasQuantifiableMetric = /\d+%|\d+x|\d+ms|\d+\+|\$[\d,]+|p99/i.test(bullet.resultMetric);
      expect(hasQuantifiableMetric).toBe(true);

      // Complete bullet text
      expect(bullet.starBullet.length).toBeGreaterThan(30);

      // Action Verb & Impact score
      expect(bullet.actionVerb).toBeDefined();
      expect(bullet.actionVerb.length).toBeGreaterThan(2);
      expect(bullet.impactScore).toBeGreaterThanOrEqual(80);
      expect(bullet.impactScore).toBeLessThanOrEqual(100);

      // Keywords covered
      expect(bullet.keywordsCovered).toBeDefined();
      expect(bullet.keywordsCovered.length).toBeGreaterThan(0);
    });

    // Verify executive summary
    expect(result.tailoredSummary).toBeDefined();
    expect(result.tailoredSummary.length).toBeGreaterThan(50);
  });

  it('should serialize structured ResumeContent into clean text for STAR extraction', () => {
    const resumeContent: ResumeContent = {
      personalInfo: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1 555-0100',
        location: 'Seattle, WA',
        website: 'https://janedoe.dev',
        linkedin: 'https://linkedin.com/in/janedoe',
        github: 'https://github.com/janedoe'
      },
      summary: 'Passionate software engineer building resilient distributed cloud systems.',
      experience: [
        {
          id: 'exp-1',
          company: 'CloudScale Inc',
          position: 'Backend Engineer',
          location: 'Seattle, WA',
          startDate: '2022-01',
          endDate: 'Present',
          current: true,
          description: 'Engineered event-driven microservices handling 25M daily transactions.'
        }
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'University of Washington',
          degree: 'B.S.',
          field: 'Computer Science',
          location: 'Seattle, WA',
          startDate: '2018-09',
          endDate: '2022-05',
          gpa: '3.85'
        }
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'Distributed Rate Limiter',
          description: 'High-throughput Redis token bucket rate limiter with sliding window metrics.',
          technologies: ['Go', 'Redis', 'Docker'],
          link: 'https://github.com/janedoe/rate-limiter'
        }
      ],
      skills: ['Go', 'Redis', 'Docker', 'Kubernetes', 'PostgreSQL', 'gRPC', 'Distributed Systems'],
      certifications: ['AWS Certified Solutions Architect']
    };

    const serialized = extractTextFromResumeContent(resumeContent);

    expect(serialized).toContain('Jane Doe');
    expect(serialized).toContain('Passionate software engineer');
    expect(serialized).toContain('CloudScale Inc');
    expect(serialized).toContain('Distributed Rate Limiter');
    expect(serialized).toContain('Go, Redis, Docker, Kubernetes');
    expect(serialized).toContain('University of Washington');
  });

  it('should automatically attach STAR bullet rewrites when analyzing a resume with a Job Description', () => {
    const resumeText = 'Developer experienced with Python, Django, PostgreSQL, and AWS basics.';
    const jobDescription = 'Looking for an engineer skilled in Python, Django, Docker, Kubernetes, AWS, and Redis caching.';

    const analysis = aiService.simulateResumeWithJD(resumeText, jobDescription, 'resume.pdf');

    expect(analysis.starBulletRewrites).toBeDefined();
    expect(Array.isArray(analysis.starBulletRewrites)).toBe(true);
    expect(analysis.starBulletRewrites!.length).toBeGreaterThan(0);

    const firstBullet = analysis.starBulletRewrites![0];
    expect(firstBullet.actionVerb).toBeDefined();
    expect(firstBullet.situation).toBeDefined();
    expect(firstBullet.task).toBeDefined();
    expect(firstBullet.action).toBeDefined();
    expect(firstBullet.resultMetric).toBeDefined();
  });
});
