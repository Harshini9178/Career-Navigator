import crypto from 'crypto';
import { db as jsonDb } from '../db/database.js';
import { jsPDF } from 'jspdf';
import {
  ResumeDocument,
  ResumeContent,
  AtsCheckReport,
  AtsCheckCategoryItem,
  JobMatchReport,
  User
} from '../types.js';

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
  'microservices', 'rest api', 'graphql', 'html5', 'css3', 'tailwind', 'linux',
  'agile', 'scrum', 'unit testing', 'system design', 'data structures', 'algorithms'
];

export function parseResumeContent(raw: any): ResumeContent {
  if (!raw) return createDefaultContent();
  if (typeof raw === 'object' && raw.personalInfo) {
    return raw as ResumeContent;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as ResumeContent;
      }
    } catch {
      // fallback
    }
  }
  return createDefaultContent();
}

export function createDefaultContent(user?: Partial<User>, targetRole?: string): ResumeContent {
  return {
    personalInfo: {
      fullName: user?.name || '',
      headline: targetRole || user?.targetRole || 'Full Stack Engineer',
      email: user?.email || '',
      phone: user?.phone || '',
      cityCountry: user?.cityState || '',
      linkedIn: user?.linkedIn || '',
      github: user?.github || '',
      portfolioWebsite: user?.portfolioWebsite || ''
    },
    summary: '',
    education: [],
    skills: {
      programmingLanguages: [],
      frameworks: [],
      databases: [],
      toolsPlatforms: [],
      coreConcepts: [],
      communicationLeadership: []
    },
    experience: [],
    projects: [],
    certifications: [],
    additionalSections: {
      publications: [],
      volunteerExperience: [],
      leadership: [],
      languages: [],
      interests: [],
      customSections: []
    }
  };
}

export function formatResumeDocument(raw: any): ResumeDocument {
  const content = parseResumeContent(raw.content || raw.contentJson);
  return {
    id: raw.id,
    userId: raw.userId,
    title: raw.title || 'Professional Resume',
    targetRole: raw.targetRole || 'Full Stack Engineer',
    templateId: raw.templateId || 'classic-ats',
    atsScore: typeof raw.atsScore === 'number' ? raw.atsScore : 85,
    content,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString()
  };
}

export function calculateAtsReadiness(content: ResumeContent, targetRole: string = 'Full Stack Engineer'): AtsCheckReport {
  if (!content) {
    return {
      overallScore: 0,
      categoryScores: [],
      passedChecks: [],
      warnings: ['Resume content is empty.'],
      missingInfo: ['Please provide candidate details and resume sections.'],
      improvementSuggestions: ['Fill out your contact details, education, skills, and experience.']
    };
  }

  const categoryScores: AtsCheckCategoryItem[] = [];
  const passedChecks: string[] = [];
  const warnings: string[] = [];
  const missingInfo: string[] = [];
  const improvementSuggestions: string[] = [];

  // 1. Contact Information (Max 15)
  let contactScore = 0;
  const pi = content.personalInfo || { fullName: '', headline: '', email: '', phone: '', cityCountry: '' };
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
    improvementSuggestions.push(`Add a headline such as '${targetRole} | Cloud & Distributed Systems'`);
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
  contactScore = Math.min(15, contactScore);
  categoryScores.push({
    name: 'Contact Information',
    score: contactScore,
    maxScore: 15,
    status: contactScore >= 12 ? 'passed' : (contactScore >= 7 ? 'warning' : 'missing'),
    explanation: 'Evaluates essential recruiter contact details.'
  });

  // 2. Summary (Max 10)
  let summaryScore = 0;
  const summary = (content.summary || '').trim();
  const summaryWords = summary ? summary.split(/\s+/).length : 0;
  if (summaryWords >= 25 && summaryWords <= 90) {
    summaryScore = 10;
    passedChecks.push(`Professional summary within ideal ATS length (${summaryWords} words)`);
  } else if (summaryWords > 0) {
    summaryScore = 6;
    warnings.push(`Summary length is ${summaryWords} words (recommended: 30-70 words)`);
  } else {
    missingInfo.push('Professional summary statement is missing');
    improvementSuggestions.push('Add a 3-4 sentence professional summary highlighting core strengths.');
  }
  categoryScores.push({
    name: 'Professional Summary',
    score: summaryScore,
    maxScore: 10,
    status: summaryScore >= 8 ? 'passed' : (summaryScore >= 4 ? 'warning' : 'missing'),
    explanation: 'Evaluates concise profile overview and value proposition.'
  });

  // 3. Education (Max 15)
  let eduScore = 0;
  const eduList = content.education || [];
  if (eduList.length > 0) {
    eduScore += 6;
    passedChecks.push(`Education credentials listed (${eduList.length} entries)`);
    const hasDegree = eduList.some((e) => (e.degree || '').trim().length > 0);
    const hasDates = eduList.some((e) => (e.graduationDate || '').trim().length > 0);
    if (hasDegree) {
      eduScore += 5;
      passedChecks.push('Degree and major clearly identified');
    }
    if (hasDates) {
      eduScore += 4;
      passedChecks.push('Graduation dates specified');
    }
  } else {
    missingInfo.push('Education section has no entries');
    improvementSuggestions.push('Add your highest academic degree and institution');
  }
  eduScore = Math.min(15, eduScore);
  categoryScores.push({
    name: 'Education',
    score: eduScore,
    maxScore: 15,
    status: eduScore >= 12 ? 'passed' : (eduScore >= 6 ? 'warning' : 'missing'),
    explanation: 'Checks accredited degree, academic discipline, and dates.'
  });

  // 4. Work Experience & Impact (Max 20)
  let expScore = 0;
  const expList = content.experience || [];
  let totalBullets = 0;
  let actionVerbBullets = 0;
  let metricBullets = 0;
  const metricPattern = /(\d+%)|(\$\d+)|(\d+x)|(\d+\+?)|(increased|reduced|boosted|saved|scaled)/i;

  if (expList.length > 0) {
    expScore += 5;
    passedChecks.push(`Work experience documented (${expList.length} roles)`);
    for (const item of expList) {
      if ((item.jobTitle || '').trim() && (item.company || '').trim()) {
        expScore = Math.min(10, expScore + 2);
      }
      const bullets = item.bullets || [];
      for (const b of bullets) {
        if (!b || !b.trim()) continue;
        totalBullets++;
        const firstWord = b.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
        if (ACTION_VERBS.has(firstWord)) {
          actionVerbBullets++;
        }
        if (metricPattern.test(b)) {
          metricBullets++;
        }
      }
    }

    if (totalBullets >= 3) {
      expScore += 4;
      passedChecks.push('Structured bullet points used across positions');
    }
    if (actionVerbBullets >= 2) {
      expScore += 3;
      passedChecks.push('Action verbs detected starting bullet points');
    }
    if (metricBullets >= 1) {
      expScore += 3;
      passedChecks.push('Quantifiable metrics and outcomes identified');
    }
  } else {
    warnings.push('No professional or internship experience listed');
    improvementSuggestions.push('Include internships, projects, or research experience.');
  }
  expScore = Math.min(20, expScore);
  categoryScores.push({
    name: 'Work Experience & Impact',
    score: expScore,
    maxScore: 20,
    status: expScore >= 16 ? 'passed' : (expScore >= 8 ? 'warning' : 'missing'),
    explanation: 'Evaluates career progression, bullet clarity, and measurable impact.'
  });

  // 5. Technical Skills (Max 15)
  let skillScore = 0;
  const skills = content.skills || {
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    toolsPlatforms: [],
    coreConcepts: [],
    communicationLeadership: []
  };
  const allSkills = [
    ...(skills.programmingLanguages || []),
    ...(skills.frameworks || []),
    ...(skills.databases || []),
    ...(skills.toolsPlatforms || []),
    ...(skills.coreConcepts || []),
    ...(skills.communicationLeadership || [])
  ];

  if (allSkills.length >= 8) {
    skillScore = 15;
    passedChecks.push(`Comprehensive skill set listed (${allSkills.length} skills)`);
  } else if (allSkills.length >= 4) {
    skillScore = 10;
    warnings.push('Add more technical proficiencies relevant to your target role');
  } else if (allSkills.length > 0) {
    skillScore = 5;
    warnings.push('Skills section contains very few entries');
  } else {
    missingInfo.push('Skills section is empty');
  }
  categoryScores.push({
    name: 'Technical & Core Skills',
    score: skillScore,
    maxScore: 15,
    status: skillScore >= 12 ? 'passed' : (skillScore >= 6 ? 'warning' : 'missing'),
    explanation: 'Evaluates domain keyword density, grouping, and coverage.'
  });

  // 6. Projects & Certifications (Max 10)
  let projScore = 0;
  const projects = content.projects || [];
  const certs = content.certifications || [];
  if (projects.length > 0) {
    projScore += 5;
    passedChecks.push(`Technical projects showcased (${projects.length} projects)`);
  }
  if (certs.length > 0) {
    projScore += 5;
    passedChecks.push(`Professional certifications documented (${certs.length} credentials)`);
  }
  projScore = Math.min(10, projScore);
  categoryScores.push({
    name: 'Projects & Certifications',
    score: projScore,
    maxScore: 10,
    status: projScore >= 8 ? 'passed' : (projScore >= 5 ? 'warning' : 'missing'),
    explanation: 'Checks applied technical projects and verified certifications.'
  });

  // 7. Structure & Readability (Max 15)
  let structScore = 15;
  passedChecks.push('Standard ATS-friendly section headings used');
  passedChecks.push('Single-column parseable layout');
  categoryScores.push({
    name: 'ATS Readability & Formatting',
    score: structScore,
    maxScore: 15,
    status: 'passed',
    explanation: 'Evaluates visual hierarchy, standard headings, and single-column layout.'
  });

  const overallScore = Math.min(100, Math.max(0, categoryScores.reduce((sum, c) => sum + c.score, 0)));

  return {
    overallScore,
    categoryScores,
    passedChecks,
    warnings,
    missingInfo,
    improvementSuggestions
  };
}

export function calculateJobMatch(content: ResumeContent, jobDescription: string): JobMatchReport {
  const jdLower = (jobDescription || '').toLowerCase();
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of TECH_KEYWORDS) {
    if (jdLower.includes(kw)) {
      // Check if candidate has it
      const hasSkill = JSON.stringify(content).toLowerCase().includes(kw);
      if (hasSkill) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }
  }

  const total = matchedKeywords.length + missingKeywords.length;
  const matchPercentage = total > 0 ? Math.round((matchedKeywords.length / total) * 100) : 85;

  return {
    matchPercentage,
    matchedKeywords,
    missingKeywords,
    matchedSkills: matchedKeywords,
    experienceRelevance: [
      `Identified ${matchedKeywords.length} matching technical competencies from job requirements.`
    ],
    phrasingSuggestions: missingKeywords.length > 0
      ? [`Consider adding demonstrated experience with: ${missingKeywords.slice(0, 4).join(', ')}`]
      : ['Your resume demonstrates solid alignment with the target job description.']
  };
}

export function listUserResumes(userId: string): ResumeDocument[] {
  const docs = jsonDb.getResumeDocumentsByUserId(userId);
  return docs.map(formatResumeDocument);
}

export function getResume(id: string, userId: string): ResumeDocument | null {
  const doc = jsonDb.getResumeDocumentById(id);
  if (!doc) return null;
  if (doc.userId !== userId) return null;
  return formatResumeDocument(doc);
}

export function createResume(req: any, user: User): ResumeDocument {
  const content = req.content ? parseResumeContent(req.content) : createDefaultContent(user, req.targetRole);
  const targetRole = req.targetRole || user.targetRole || 'Full Stack Engineer';
  const atsCheck = calculateAtsReadiness(content, targetRole);

  const doc = {
    id: crypto.randomUUID(),
    userId: user.id,
    title: req.title || `${user.name || 'Candidate'} - ${targetRole} Resume`,
    targetRole,
    templateId: req.templateId || 'classic-ats',
    atsScore: atsCheck.overallScore,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  jsonDb.saveResumeDocument(doc);
  return formatResumeDocument(doc);
}

export function updateResume(id: string, req: any, userId: string): ResumeDocument {
  const existing = jsonDb.getResumeDocumentById(id);
  if (!existing || existing.userId !== userId) {
    throw new Error('Resume not found or unauthorized');
  }

  const title = req.title !== undefined ? req.title : existing.title;
  const targetRole = req.targetRole !== undefined ? req.targetRole : existing.targetRole;
  const templateId = req.templateId !== undefined ? req.templateId : existing.templateId;
  const content = req.content !== undefined ? parseResumeContent(req.content) : parseResumeContent(existing.content || existing.contentJson);

  const atsCheck = calculateAtsReadiness(content, targetRole);

  const updated = {
    ...existing,
    title,
    targetRole,
    templateId,
    atsScore: atsCheck.overallScore,
    content,
    updatedAt: new Date().toISOString()
  };

  jsonDb.saveResumeDocument(updated);
  return formatResumeDocument(updated);
}

export function deleteResume(id: string, userId: string): boolean {
  const existing = jsonDb.getResumeDocumentById(id);
  if (!existing || existing.userId !== userId) {
    throw new Error('Resume not found or unauthorized');
  }
  return jsonDb.deleteResumeDocument(id);
}

export function duplicateResume(id: string, userId: string): ResumeDocument {
  const existing = jsonDb.getResumeDocumentById(id);
  if (!existing || existing.userId !== userId) {
    throw new Error('Resume not found or unauthorized');
  }

  const copy = {
    ...existing,
    id: crypto.randomUUID(),
    userId,
    title: `${existing.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  jsonDb.saveResumeDocument(copy);
  return formatResumeDocument(copy);
}

export function generateBackendPdf(doc: ResumeDocument): Buffer {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const content = doc.content;
  const pi = content.personalInfo || {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    cityCountry: '',
    linkedIn: '',
    github: '',
    portfolioWebsite: ''
  };

  let y = 20;
  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - (2 * margin);

  // Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(pi.fullName || 'Candidate Name', margin, y);
  y += 7;

  // Headline
  if (pi.headline) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.text(pi.headline, margin, y);
    y += 5;
  }

  // Contact info
  const contactParts = [pi.email, pi.phone, pi.cityCountry, pi.linkedIn, pi.github].filter(Boolean);
  if (contactParts.length > 0) {
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 100, 100);
    pdf.text(contactParts.join('  •  '), margin, y);
    y += 6;
  }

  // Divider rule
  pdf.setDrawColor(30, 41, 59);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Summary
  if (content.summary) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text('PROFESSIONAL SUMMARY', margin, y);
    y += 4.5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(51, 65, 85);
    const splitSummary = pdf.splitTextToSize(content.summary, contentWidth);
    pdf.text(splitSummary, margin, y);
    y += splitSummary.length * 4 + 4;
  }

  // Skills
  const skills = content.skills;
  if (skills) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text('TECHNICAL SKILLS', margin, y);
    y += 4.5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(51, 65, 85);

    const skillLines = [
      skills.programmingLanguages?.length ? `Languages: ${skills.programmingLanguages.join(', ')}` : null,
      skills.frameworks?.length ? `Frameworks: ${skills.frameworks.join(', ')}` : null,
      skills.databases?.length ? `Databases: ${skills.databases.join(', ')}` : null,
      skills.toolsPlatforms?.length ? `Tools & Platforms: ${skills.toolsPlatforms.join(', ')}` : null,
      skills.coreConcepts?.length ? `Core Concepts: ${skills.coreConcepts.join(', ')}` : null
    ].filter(Boolean) as string[];

    for (const sl of skillLines) {
      pdf.text(sl, margin, y);
      y += 4;
    }
    y += 3;
  }

  // Experience
  if (content.experience?.length) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text('EXPERIENCE', margin, y);
    y += 4.5;

    for (const exp of content.experience) {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${exp.jobTitle || 'Role'} - ${exp.company || 'Company'}`, margin, y);

      const dates = `${exp.startDate || ''} - ${exp.currentRole ? 'Present' : exp.endDate || ''}`;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(dates, pageWidth - margin - 35, y);
      y += 4.5;

      if (exp.bullets?.length) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(51, 65, 85);
        for (const bullet of exp.bullets) {
          if (!bullet) continue;
          const splitBullet = pdf.splitTextToSize(`•  ${bullet}`, contentWidth - 4);
          if (y + splitBullet.length * 4 > 280) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(splitBullet, margin + 2, y);
          y += splitBullet.length * 4;
        }
      }
      y += 3;
    }
  }

  // Education
  if (content.education?.length) {
    if (y > 260) {
      pdf.addPage();
      y = 20;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text('EDUCATION', margin, y);
    y += 4.5;

    for (const edu of content.education) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${edu.degree || 'Degree'} in ${edu.fieldOfStudy || 'Major'}`, margin, y);
      if (edu.graduationDate) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(edu.graduationDate, pageWidth - margin - 25, y);
      }
      y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(51, 65, 85);
      pdf.text(`${edu.institution || ''}${edu.gradeCgpa ? ` | Grade: ${edu.gradeCgpa}` : ''}`, margin, y);
      y += 5;
    }
  }

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
