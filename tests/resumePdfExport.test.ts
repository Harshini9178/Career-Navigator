import { describe, it, expect } from 'vitest';
import { generateResumeFilename } from '../src/lib/pdfExporter.js';
import {
  calculateAtsReadiness,
  calculateJobMatch,
  generateBackendPdf,
  createDefaultContent
} from '../src/lib/resumeEngine.js';
import type { ResumeContent, ResumeDocument } from '../src/types.js';

const MOCK_RESUME_CONTENT: ResumeContent = {
  personalInfo: {
    fullName: 'Harshini RB',
    headline: 'Senior Full Stack Engineer',
    email: 'harshini.rb@example.com',
    phone: '+91 98765 43210',
    cityCountry: 'Bengaluru, Karnataka, India',
    linkedIn: 'https://linkedin.com/in/harshinirb',
    github: 'https://github.com/harshinirb',
    portfolioWebsite: 'https://harshinirb.dev'
  },
  summary: 'Dedicated full-stack software engineer with 4+ years of hands-on experience designing robust microservices in Java Spring Boot and responsive single-page web applications with React and TypeScript.',
  education: [
    {
      id: 'edu-1',
      institution: 'Visvesvaraya Technological University',
      degree: 'Bachelor of Engineering in Information Science',
      fieldOfStudy: 'Information Science',
      startDate: '2020',
      graduationDate: '2024',
      gradeCgpa: '9.2 CGPA',
      coursework: 'Data Structures, Algorithms, Cloud Computing, Database Systems'
    }
  ],
  skills: {
    programmingLanguages: ['Java', 'TypeScript', 'JavaScript', 'Python', 'SQL'],
    frameworks: ['Spring Boot', 'React', 'Node.js', 'Express', 'Tailwind CSS'],
    databases: ['PostgreSQL', 'MongoDB', 'Redis'],
    toolsPlatforms: ['Docker', 'Kubernetes', 'Git', 'AWS', 'Linux'],
    coreConcepts: ['Microservices', 'RESTful APIs', 'System Design', 'CI/CD Pipelines'],
    communicationLeadership: ['Technical Leadership', 'Cross-functional Collaboration']
  },
  experience: [
    {
      id: 'exp-1',
      jobTitle: 'Software Engineer',
      company: 'Tech Innovators Inc.',
      location: 'Bengaluru, India',
      startDate: 'Aug 2024',
      endDate: 'Present',
      currentRole: true,
      responsibilities: 'Developing high-throughput cloud microservices and candidate assessment workflows.',
      achievements: 'Optimized PDF export and caching pipelines, cutting latency by 42%.',
      impact: 'Scaled user engagement to 50,000+ monthly active learners with 99.9% uptime.',
      bullets: [
        'Architected real-time client and server PDF export pipeline with multi-page A4 canvas pagination',
        'Implemented comprehensive ATS evaluation algorithms scoring keyword density and section parsing',
        'Integrated automated JWT-based session security and role-based access controls'
      ]
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Career Navigator Suite',
      description: 'End-to-end AI career acceleration, ATS resume builder, and aptitude evaluation platform.',
      technologies: ['React', 'TypeScript', 'Spring Boot', 'PostgreSQL', 'Tailwind CSS'],
      keyContributions: 'Designed live split-screen A4 canvas preview with one-click PDF download and live ATS validation.',
      resultsImpact: 'Empowered 12,000+ university students to land placements with verified 95+ ATS pass rates.',
      githubUrl: 'https://github.com/Harshini9178/Career-Navigator',
      liveUrl: 'https://careernavigator.app'
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuingOrganization: 'Amazon Web Services',
      issueDate: '2024',
      credentialUrl: 'https://aws.amazon.com/verification/123456',
      type: 'certification'
    }
  ],
  additionalSections: {
    publications: [],
    volunteerExperience: ['Tech Community Mentor'],
    leadership: ['Lead Organizer, Campus Placement Hackathon 2024'],
    languages: ['English (Fluent)', 'Kannada (Native)', 'Hindi (Conversational)'],
    interests: ['Distributed Systems', 'Open Source Software', 'Aviation'],
    customSections: []
  }
};

describe('Resume PDF Export & Filename Sanitization', () => {
  it('generates sanitized filename from candidate full name', () => {
    expect(generateResumeFilename('Harshini RB', 'Software Engineer')).toBe('Harshini_RB_Resume.pdf');
    expect(generateResumeFilename('  Harshini   R.B.  ', 'Resume')).toBe('Harshini_RB_Resume.pdf');
    expect(generateResumeFilename('Candidate Alpha 123')).toBe('Candidate_Alpha_123_Resume.pdf');
  });

  it('falls back to resume title when candidate name is missing', () => {
    expect(generateResumeFilename('', 'Full Stack Engineer Resume')).toBe('Full_Stack_Engineer_Resume.pdf');
    expect(generateResumeFilename(undefined, 'Backend_Architect')).toBe('Backend_Architect.pdf');
    expect(generateResumeFilename(undefined, 'Harshini_RB_Resume.pdf')).toBe('Harshini_RB_Resume.pdf');
  });

  it('falls back to default filename when both name and title are absent', () => {
    expect(generateResumeFilename('', '')).toBe('Career_Navigator_Resume.pdf');
    expect(generateResumeFilename(undefined, undefined)).toBe('Career_Navigator_Resume.pdf');
  });
});

describe('Resume ATS & Job Match Engine', () => {
  it('calculates comprehensive ATS score with all categories passing', () => {
    const atsReport = calculateAtsReadiness(MOCK_RESUME_CONTENT, 'Full Stack Engineer');
    expect(atsReport.overallScore).toBeGreaterThanOrEqual(90);
    expect(atsReport.categoryScores.length).toBe(7);
    expect(atsReport.passedChecks.length).toBeGreaterThan(5);
    expect(atsReport.warnings.length).toBeLessThan(3);
  });

  it('flags missing sections and low content appropriately', () => {
    const emptyContent = createDefaultContent();
    const atsReport = calculateAtsReadiness(emptyContent, 'Software Engineer');
    expect(atsReport.overallScore).toBeLessThan(40);
    expect(atsReport.missingInfo.length).toBeGreaterThan(0);
  });

  it('calculates job keyword matching against job requirements', () => {
    const jobDescription = 'Looking for a Senior Java and React Software Engineer experienced in Spring Boot, Docker, and PostgreSQL.';
    const match = calculateJobMatch(MOCK_RESUME_CONTENT, jobDescription);
    expect(match.matchPercentage).toBeGreaterThanOrEqual(60);
    expect(match.matchedKeywords).toContain('java');
    expect(match.matchedKeywords).toContain('react');
    expect(match.matchedKeywords).toContain('spring boot');
    expect(match.matchedKeywords).toContain('docker');
    expect(match.matchedKeywords).toContain('postgresql');
  });
});

describe('Backend PDF Generation', () => {
  it('generates a valid binary PDF document with correct magic bytes and trailer', () => {
    const doc: ResumeDocument = {
      id: 'res-pdf-test-1',
      userId: 'user-test-1',
      title: 'Harshini RB Resume',
      targetRole: 'Senior Full Stack Engineer',
      templateId: 'classic-ats',
      atsScore: 96,
      content: MOCK_RESUME_CONTENT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pdfBuffer = generateBackendPdf(doc);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(2000);

    // Verify PDF Magic Bytes (%PDF-)
    const header = pdfBuffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');

    // Verify PDF EOF trailer
    const trailer = pdfBuffer.subarray(pdfBuffer.length - 100).toString('ascii');
    expect(trailer).toContain('%%EOF');
  });
});
