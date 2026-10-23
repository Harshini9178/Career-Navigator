import { describe, it, expect } from 'vitest';
import { ATS_TEMPLATES } from '../src/components/resume/ResumeTemplates';
import type { ResumeContent, ResumeDocument } from '../src/types';

const SAMPLE_CONTENT: ResumeContent = {
  personalInfo: {
    fullName: 'Harshini R.',
    headline: 'Full Stack Java & React Engineer',
    email: 'harshini@example.com',
    phone: '+91 98765 43210',
    cityCountry: 'Bengaluru, India',
    linkedIn: 'https://linkedin.com/in/harshini',
    github: 'https://github.com/harshini',
    portfolioWebsite: 'https://harshini.dev'
  },
  summary: 'Results-driven software engineer with expertise in Java, Spring Boot, React, and cloud architectures. Proven track record of optimizing system throughput by 35%.',
  education: [
    {
      id: 'edu-1',
      institution: 'National Institute of Technology',
      degree: 'B.Tech in Computer Science and Engineering',
      fieldOfStudy: 'Computer Science',
      startDate: '2021',
      graduationDate: '2025',
      gradeCgpa: '8.9 CGPA',
      coursework: 'Data Structures, Distributed Systems, Database Management Systems'
    }
  ],
  skills: {
    programmingLanguages: ['Java', 'TypeScript', 'SQL', 'Python'],
    frameworks: ['Spring Boot', 'React', 'Node.js', 'Tailwind CSS'],
    databases: ['PostgreSQL', 'MySQL', 'MongoDB'],
    toolsPlatforms: ['Git', 'Docker', 'AWS', 'Linux'],
    coreConcepts: ['Object-Oriented Programming', 'REST APIs', 'System Design'],
    communicationLeadership: ['Agile Collaboration', 'Technical Mentorship']
  },
  experience: [
    {
      id: 'exp-1',
      jobTitle: 'Full Stack Engineering Intern',
      company: 'TechCorp Solutions',
      location: 'Bengaluru, India',
      startDate: 'Jan 2024',
      endDate: 'Jul 2024',
      currentRole: false,
      responsibilities: 'Engineered responsive React dashboards with TypeScript and Tailwind CSS',
      achievements: 'Decreased API response latency by 28% using database indexing and caching',
      impact: 'Served 10,000+ daily active candidate sessions with zero downtime',
      bullets: [
        'Engineered responsive React dashboards with TypeScript and Tailwind CSS',
        'Built secure REST APIs in Spring Boot with JWT authentication'
      ]
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Career Navigator Platform',
      description: 'AI-assisted placement readiness and automated ATS evaluation suite',
      technologies: ['React', 'Spring Boot', 'PostgreSQL', 'Tailwind CSS'],
      keyContributions: 'Architected split-screen ATS Resume Builder Studio with real-time vector PDF preview',
      resultsImpact: 'Achieved 95+ ATS pass rate across major applicant tracking systems',
      githubUrl: 'https://github.com/mockgenius/career-navigator',
      liveUrl: 'https://career-navigator.dev'
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Cloud Practitioner',
      issuingOrganization: 'Amazon Web Services',
      issueDate: '2024',
      credentialUrl: 'https://aws.amazon.com/verify',
      type: 'certification'
    }
  ],
  additionalSections: {
    publications: [],
    volunteerExperience: [],
    leadership: ['College Coding Club Lead (2023 - 2024)'],
    languages: ['English (Professional)', 'Hindi (Native)'],
    interests: ['Distributed Systems', 'UI/UX Design'],
    customSections: []
  }
};

describe('Resume Builder Studio — Templates and Structures', () => {
  it('defines all 8 ATS templates required by specification', () => {
    expect(ATS_TEMPLATES).toHaveLength(8);
    const templateIds = ATS_TEMPLATES.map(t => t.id);
    expect(templateIds).toContain('classic-ats');
    expect(templateIds).toContain('modern-pro');
    expect(templateIds).toContain('software-engineer');
    expect(templateIds).toContain('fresher-grad');
    expect(templateIds).toContain('experienced-pro');
    expect(templateIds).toContain('data-analyst');
    expect(templateIds).toContain('minimalist');
    expect(templateIds).toContain('executive');
  });

  it('each template has ATS rating, category, description, and recommended target roles', () => {
    ATS_TEMPLATES.forEach(tpl => {
      expect(tpl.name).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.category).toBeTruthy();
      expect(['100% ATS Safe', 'High Compatibility', 'Optimized']).toContain(tpl.atsScoreRating);
      expect(tpl.recommendedFor.length).toBeGreaterThan(0);
    });
  });

  it('provides rich sample content with all core sections populated', () => {
    expect(SAMPLE_CONTENT.personalInfo.fullName).toBe('Harshini R.');
    expect(SAMPLE_CONTENT.personalInfo.email).toBeTruthy();
    expect(SAMPLE_CONTENT.personalInfo.phone).toBeTruthy();
    expect(SAMPLE_CONTENT.personalInfo.linkedIn).toContain('linkedin.com');
    expect(SAMPLE_CONTENT.personalInfo.github).toContain('github.com');
    
    expect(SAMPLE_CONTENT.education.length).toBeGreaterThan(0);
    expect(SAMPLE_CONTENT.education[0].institution).toBeTruthy();
    expect(SAMPLE_CONTENT.education[0].degree).toBeTruthy();

    expect(SAMPLE_CONTENT.skills.programmingLanguages.length).toBeGreaterThan(0);
    expect(SAMPLE_CONTENT.skills.frameworks.length).toBeGreaterThan(0);
    expect(SAMPLE_CONTENT.skills.toolsPlatforms.length).toBeGreaterThan(0);

    expect(SAMPLE_CONTENT.experience.length).toBeGreaterThan(0);
    expect(SAMPLE_CONTENT.experience[0].company).toBeTruthy();
    expect(SAMPLE_CONTENT.experience[0].responsibilities.length).toBeGreaterThan(0);

    expect(SAMPLE_CONTENT.projects.length).toBeGreaterThan(0);
    expect(SAMPLE_CONTENT.projects[0].title).toBeTruthy();
    expect(SAMPLE_CONTENT.projects[0].technologies.length).toBeGreaterThan(0);

    expect(SAMPLE_CONTENT.certifications.length).toBeGreaterThan(0);
  });

  it('validates document structure conforms to ResumeDocument type', () => {
    const doc: ResumeDocument = {
      id: 'res-test-123',
      userId: 'user-456',
      title: 'Software Engineer Resume',
      targetRole: 'Full Stack Engineer',
      templateId: 'software-engineer',
      atsScore: 92,
      content: SAMPLE_CONTENT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(doc.id).toBe('res-test-123');
    expect(doc.templateId).toBe('software-engineer');
    expect(doc.content.skills.frameworks).toContain('Spring Boot');
    expect(doc.content.skills.frameworks).toContain('React');
  });
});
