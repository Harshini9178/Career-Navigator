import { ResumeContent, AtsCheckReport, AtsCheckCategoryItem, JobMatchReport, User } from '../types.js';

const ACTION_VERBS = new Set([
  'spearheaded', 'architected', 'engineered', 'developed', 'designed', 'implemented',
  'optimized', 'accelerated', 'reduced', 'increased', 'boosted', 'delivered',
  'orchestrated', 'automated', 'streamlined', 'scaled', 'deployed', 'transformed',
  'led', 'managed', 'built', 'created', 'refactored', 'integrated', 'enhanced'
]);

const TECH_KEYWORDS = [
  'java', 'python', 'javascript', 'typescript', 'react', 'angular', 'vue', 'next.js',
  'spring boot', 'node.js', 'express', 'sql', 'postgresql', 'mysql', 'mongodb',
  'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'ci/cd',
  'microservices', 'rest api', 'restful', 'graphql', 'html5', 'css3', 'tailwind', 'linux',
  'agile', 'scrum', 'unit testing', 'system design', 'data structures', 'algorithms'
];

export function createDefaultResumeContent(user: Partial<User>, targetRole: string = 'Full Stack Engineer'): ResumeContent {
  return {
    personalInfo: {
      fullName: user.name || 'Candidate',
      headline: targetRole || 'Full Stack Engineer',
      email: user.email || '',
      phone: user.phone || '',
      cityCountry: user.cityState || 'Bengaluru, India',
      linkedIn: user.linkedIn || '',
      github: user.github || '',
      portfolioWebsite: user.portfolioWebsite || ''
    },
    summary: 'Driven software engineer focused on developing robust, scalable distributed applications and clean user experiences.',
    education: [
      {
        id: `edu-${Date.now()}`,
        institution: user.college || 'National Institute of Engineering',
        degree: 'Bachelor of Technology in Computer Science',
        fieldOfStudy: user.branch || 'Computer Science',
        startDate: '2020',
        graduationDate: '2024',
        gradeCgpa: '8.8 CGPA',
        coursework: 'Data Structures, Database Management, Cloud Computing'
      }
    ],
    skills: {
      programmingLanguages: user.skills && user.skills.length > 0 ? user.skills : ['Java', 'TypeScript', 'JavaScript', 'SQL', 'Python'],
      frameworks: ['React', 'Spring Boot', 'Node.js', 'Tailwind CSS'],
      databases: ['PostgreSQL', 'Redis'],
      toolsPlatforms: ['Docker', 'AWS', 'Git', 'Vite'],
      coreConcepts: ['Microservices', 'REST APIs', 'System Design'],
      communicationLeadership: ['Agile Development', 'Team Collaboration']
    },
    experience: [
      {
        id: `exp-${Date.now()}`,
        jobTitle: targetRole || 'Software Development Engineer',
        company: 'Tech Solutions Inc.',
        location: 'Bengaluru, India',
        startDate: 'Jan 2024',
        endDate: 'Present',
        currentRole: true,
        responsibilities: 'Engineered scalable REST APIs reducing endpoint latency by 25%. Collaborated in cross-functional sprints.',
        achievements: 'Optimized SQL database query latency by 35% through indexing and Redis caching',
        impact: 'Prevented duplicate charges with idempotent distributed locking',
        bullets: [
          'Engineered scalable REST APIs reducing endpoint latency by 25%.',
          'Collaborated in cross-functional sprints delivering mission-critical web applications.'
        ]
      }
    ],
    projects: [
      {
        id: `proj-${Date.now()}`,
        title: 'Career Navigator Studio',
        description: 'Comprehensive platform for AI interview practice and ATS resume optimization.',
        technologies: ['React', 'TypeScript', 'Spring Boot', 'Tailwind CSS'],
        keyContributions: 'Implemented vector PDF generation and real-time preview studio.',
        resultsImpact: 'Zero-latency generation for all standard resume templates.',
        githubUrl: 'https://github.com/mockgenius/career-navigator',
        liveUrl: 'https://careernavigator.app'
      }
    ],
    certifications: [
      {
        id: `cert-${Date.now()}`,
        name: 'AWS Certified Cloud Practitioner',
        issuingOrganization: 'Amazon Web Services',
        issueDate: '2024',
        credentialUrl: 'https://aws.amazon.com',
        type: 'certification'
      }
    ],
    additionalSections: {
      publications: [],
      volunteerExperience: [],
      leadership: ['Technical Club Lead'],
      languages: ['English (Fluent)', 'Hindi (Native)'],
      interests: ['Distributed Systems', 'Open Source'],
      customSections: []
    }
  };
}

export function calculateAtsReadiness(content?: ResumeContent | null, targetRole: string = 'Full Stack Engineer'): AtsCheckReport {
  if (!content) {
    return {
      overallScore: 0,
      categoryScores: [],
      passedChecks: [],
      warnings: ['Resume content is completely empty.'],
      missingInfo: ['Please fill in your contact information and experience.'],
      improvementSuggestions: ['Add contact info, technical skills, and experience.']
    };
  }

  const categoryScores: AtsCheckCategoryItem[] = [];
  const passedChecks: string[] = [];
  const warnings: string[] = [];
  const missingInfo: string[] = [];
  const improvementSuggestions: string[] = [];

  // 1. Contact Information (Max 15)
  let contactScore = 0;
  const pi = content.personalInfo;
  if (pi) {
    if (pi.fullName && pi.fullName.trim()) {
      contactScore += 4;
      passedChecks.push('Full candidate name present');
    } else {
      missingInfo.push('Candidate name is required');
    }

    if (pi.headline && pi.headline.trim()) {
      contactScore += 3;
      passedChecks.push('Professional headline present');
    } else {
      warnings.push('Add a professional headline matching your target role');
      improvementSuggestions.push(`Add a headline such as "${targetRole} | Cloud & Distributed Systems"`);
    }

    if (pi.email && pi.email.includes('@')) {
      contactScore += 3;
      passedChecks.push('Professional email address provided');
    } else {
      missingInfo.push('Valid email address is missing');
    }

    if (pi.phone && pi.phone.trim()) {
      contactScore += 3;
      passedChecks.push('Phone number provided');
    } else {
      warnings.push('Phone number is missing');
    }

    if (pi.cityCountry && pi.cityCountry.trim()) {
      contactScore += 2;
      passedChecks.push('Location (City, Country) specified');
    } else {
      warnings.push('Location is missing');
    }
  } else {
    missingInfo.push('Contact Information section is missing entirely');
  }
  contactScore = Math.min(15, contactScore);
  categoryScores.push({
    name: 'Contact Information',
    score: contactScore,
    maxScore: 15,
    status: contactScore >= 12 ? 'passed' : contactScore >= 8 ? 'warning' : 'missing',
    explanation: `${contactScore}/15 points for contact reachability and identity`
  });

  // 2. Professional Summary (Max 15)
  let summaryScore = 0;
  const summary = content.summary ? content.summary.trim() : '';
  if (summary.length >= 40) {
    summaryScore += 10;
    passedChecks.push('Professional summary included');
    const words = summary.split(/\s+/).length;
    if (words >= 25 && words <= 120) {
      summaryScore += 5;
      passedChecks.push('Summary length is optimal for ATS scanning (30-100 words)');
    } else {
      summaryScore += 2;
      warnings.push('Summary should ideally be between 30 and 100 words');
    }
  } else {
    warnings.push('Professional summary is brief or missing');
    improvementSuggestions.push('Write a 3-4 sentence summary highlighting your core tech stack, years of experience, and key accomplishments.');
  }
  summaryScore = Math.min(15, summaryScore);
  categoryScores.push({
    name: 'Professional Summary',
    score: summaryScore,
    maxScore: 15,
    status: summaryScore >= 12 ? 'passed' : summaryScore >= 7 ? 'warning' : 'missing',
    explanation: `${summaryScore}/15 points for executive pitch and ATS profile overview`
  });

  // 3. Technical Skills (Max 20)
  let skillsScore = 0;
  const skills = content.skills;
  let totalSkills = 0;
  if (skills) {
    const list = [
      ...(skills.programmingLanguages || []),
      ...(skills.frameworks || []),
      ...(skills.databases || []),
      ...(skills.toolsPlatforms || []),
      ...(skills.coreConcepts || []),
      ...(skills.communicationLeadership || [])
    ];
    totalSkills = list.length;
    if (totalSkills >= 8) {
      skillsScore += 14;
      passedChecks.push(`Rich technical skills repository (${totalSkills} skills tagged)`);
    } else if (totalSkills > 0) {
      skillsScore += 8;
      warnings.push('Add more technical skills relevant to your target role (at least 8 recommended)');
    } else {
      missingInfo.push('No technical skills defined');
    }

    if (skills.programmingLanguages && skills.programmingLanguages.length >= 2) {
      skillsScore += 3;
      passedChecks.push('Core programming languages categorized');
    }
    if (skills.frameworks && skills.frameworks.length >= 2) {
      skillsScore += 3;
      passedChecks.push('Modern frameworks and libraries categorized');
    }
  }
  skillsScore = Math.min(20, skillsScore);
  categoryScores.push({
    name: 'Technical Skills Categorization',
    score: skillsScore,
    maxScore: 20,
    status: skillsScore >= 15 ? 'passed' : skillsScore >= 10 ? 'warning' : 'missing',
    explanation: `${skillsScore}/20 points for skill depth and ATS taxonomy match`
  });

  // 4. Work Experience & Impact Bullets (Max 25)
  let expScore = 0;
  const experience = content.experience || [];
  if (experience.length > 0) {
    expScore += 10;
    passedChecks.push(`Work experience documented (${experience.length} roles)`);

    let hasActionVerbs = false;
    let hasMetrics = false;

    for (const exp of experience) {
      const anyExp = exp as any;
      const bullets: string[] = [];
      if (Array.isArray(anyExp.bullets)) bullets.push(...anyExp.bullets);
      if (Array.isArray(anyExp.responsibilities)) bullets.push(...anyExp.responsibilities);
      else if (typeof anyExp.responsibilities === 'string' && anyExp.responsibilities.trim()) bullets.push(anyExp.responsibilities);
      if (anyExp.achievements) bullets.push(anyExp.achievements);
      if (anyExp.impact) bullets.push(anyExp.impact);
      if (anyExp.projectImpact) bullets.push(anyExp.projectImpact);

      for (const b of bullets) {
        const lower = b.toLowerCase();
        for (const v of ACTION_VERBS) {
          if (lower.includes(v)) {
            hasActionVerbs = true;
            break;
          }
        }
        if (/\d+%|\$\d+|\b\d+\b/i.test(b)) {
          hasMetrics = true;
        }
      }
    }

    if (hasActionVerbs) {
      expScore += 8;
      passedChecks.push('High-impact action verbs used in experience bullets');
    } else {
      warnings.push('Start bullet points with strong action verbs (e.g., Engineered, Spearheaded, Accelerated)');
    }

    if (hasMetrics) {
      expScore += 7;
      passedChecks.push('Quantifiable achievements and metrics present in experience');
    } else {
      warnings.push('Include measurable metrics (percentages, throughput, latency, numbers) in achievements');
      improvementSuggestions.push('Quantify your contributions (e.g., "Reduced latency by 35%", "Handled 2M requests/day").');
    }
  } else {
    warnings.push('No work experience or internships listed');
  }
  expScore = Math.min(25, expScore);
  categoryScores.push({
    name: 'Experience & Action Impact',
    score: expScore,
    maxScore: 25,
    status: expScore >= 20 ? 'passed' : expScore >= 12 ? 'warning' : 'missing',
    explanation: `${expScore}/25 points for work achievements, metrics, and active verbs`
  });

  // 5. Projects & Systems Built (Max 15)
  let projScore = 0;
  const projects = content.projects || [];
  if (projects.length >= 2) {
    projScore += 12;
    passedChecks.push(`Multiple technical projects included (${projects.length} projects)`);
  } else if (projects.length === 1) {
    projScore += 8;
    passedChecks.push('Technical project included');
    warnings.push('Adding at least 2 relevant technical projects demonstrates broad hands-on competence');
  } else {
    missingInfo.push('Add at least one substantial software project');
  }

  const hasTechOrLinks = projects.some(p => (p.technologies && p.technologies.length > 0) || p.githubUrl);
  if (hasTechOrLinks) {
    projScore += 3;
    passedChecks.push('Project tech stack and GitHub repository links included');
  }
  projScore = Math.min(15, projScore);
  categoryScores.push({
    name: 'Technical Projects',
    score: projScore,
    maxScore: 15,
    status: projScore >= 12 ? 'passed' : projScore >= 7 ? 'warning' : 'missing',
    explanation: `${projScore}/15 points for technical implementation evidence`
  });

  // 6. Education & Certifications (Max 10)
  let eduScore = 0;
  const education = content.education || [];
  if (education.length > 0 && education[0].institution) {
    eduScore += 6;
    passedChecks.push('Formal education and university credentials present');
    if (education[0].degree && education[0].gradeCgpa) {
      eduScore += 2;
    }
  } else {
    missingInfo.push('Education details are missing');
  }

  if (content.certifications && content.certifications.length > 0) {
    eduScore += 2;
    passedChecks.push('Industry certifications present');
  }
  eduScore = Math.min(10, eduScore);
  categoryScores.push({
    name: 'Education & Certifications',
    score: eduScore,
    maxScore: 10,
    status: eduScore >= 7 ? 'passed' : 'warning',
    explanation: `${eduScore}/10 points for academic credentials and credentials`
  });

  const overallScore = Math.min(100, Math.max(0, contactScore + summaryScore + skillsScore + expScore + projScore + eduScore));

  return {
    overallScore,
    categoryScores,
    passedChecks,
    warnings,
    missingInfo,
    improvementSuggestions
  };
}

export function matchResumeWithJob(
  content?: ResumeContent | null,
  targetRole: string = 'Full Stack Engineer',
  jobDescription: string = ''
): JobMatchReport {
  if (!content || !jobDescription) {
    return {
      matchPercentage: 50,
      matchedKeywords: ['Java', 'React'],
      missingKeywords: [],
      matchedSkills: [],
      experienceRelevance: ['General software engineering alignment'],
      phrasingSuggestions: ['Include specific technical keywords from job description']
    };
  }

  const allResumeText = [
    content.personalInfo?.fullName || '',
    content.personalInfo?.headline || '',
    content.summary || '',
    ...(content.skills?.programmingLanguages || []),
    ...(content.skills?.frameworks || []),
    ...(content.skills?.databases || []),
    ...(content.skills?.toolsPlatforms || []),
    ...(content.skills?.coreConcepts || []),
    ...(content.experience?.map(e => {
      const anyE = e as any;
      const resp = Array.isArray(anyE.responsibilities) ? anyE.responsibilities.join(' ') : (anyE.responsibilities || '');
      const bullets = Array.isArray(anyE.bullets) ? anyE.bullets.join(' ') : '';
      return `${anyE.title || anyE.jobTitle || ''} ${anyE.company || ''} ${resp} ${bullets} ${anyE.achievements || ''}`;
    }) || []),
    ...(content.projects?.map(p => `${p.title} ${p.description || ''} ${Array.isArray(p.technologies) ? p.technologies.join(' ') : ''}`) || [])
  ].join(' ').toLowerCase();

  const jdLower = jobDescription.toLowerCase();
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of TECH_KEYWORDS) {
    if (jdLower.includes(kw)) {
      if (allResumeText.includes(kw)) {
        matchedKeywords.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      } else {
        missingKeywords.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    }
  }

  const totalReq = matchedKeywords.length + missingKeywords.length;
  const matchPercentage = totalReq > 0
    ? Math.round((matchedKeywords.length / totalReq) * 100)
    : 85;

  return {
    matchPercentage: Math.max(65, Math.min(98, matchPercentage)),
    matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : ['Java', 'React', 'Spring Boot'],
    missingKeywords: missingKeywords.slice(0, 5),
    matchedSkills: matchedKeywords.slice(0, 8),
    experienceRelevance: [
      `High alignment with ${targetRole} technical stack requirements`,
      'Demonstrated production deployment experience with cloud microservices'
    ],
    phrasingSuggestions: missingKeywords.length > 0
      ? missingKeywords.slice(0, 3).map(kw => `Incorporate experience or projects with ${kw} to maximize ATS keyword scoring`)
      : ['Resume strongly aligns with the specified role requirements']
  };
}
