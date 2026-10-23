import React from 'react';
import {
  ResumeContent,
  ResumeEducation,
  ResumeWorkExperience,
  ResumeProject,
  ResumeCertification
} from '../../types.js';

export interface TemplateDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: 'ATS Universal' | 'Engineering' | 'Career Level' | 'Domain';
  atsScoreRating: '100% ATS Safe' | 'High Compatibility' | 'Optimized';
  atsBadgeColor: string;
  recommendedFor: string;
}

export const ATS_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'classic-ats',
    name: 'Classic ATS',
    subtitle: 'Single-Column Standard',
    description: 'Traditional, single-column layout with standard headings and universal ATS parser readability.',
    category: 'ATS Universal',
    atsScoreRating: '100% ATS Safe',
    atsBadgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    recommendedFor: 'Large Enterprise ATS (Workday, Taleo, Greenhouse, iCIMS)'
  },
  {
    id: 'modern-pro',
    name: 'Modern Professional',
    subtitle: 'Contemporary Clean',
    description: 'Clean typography, refined section rules, and balanced spacing for modern tech companies.',
    category: 'ATS Universal',
    atsScoreRating: 'High Compatibility',
    atsBadgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    recommendedFor: 'Mid-sized tech companies, startups, and consulting agencies'
  },
  {
    id: 'software-engineer',
    name: 'Software Engineer',
    subtitle: 'Skills & Systems First',
    description: 'Highlights technical skill categorization and engineering projects with tech stack chips and GitHub links.',
    category: 'Engineering',
    atsScoreRating: '100% ATS Safe',
    atsBadgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    recommendedFor: 'Full Stack, Backend, Frontend, and Cloud DevOps Engineers'
  },
  {
    id: 'fresher-grad',
    name: 'Fresher / Graduate',
    subtitle: 'Education & Academic Impact',
    description: 'Positions Education, CGPA, capstone projects, and internships upfront for campus placements.',
    category: 'Career Level',
    atsScoreRating: '100% ATS Safe',
    atsBadgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    recommendedFor: 'Graduating students, college placement drives, and entry-level roles'
  },
  {
    id: 'experienced-pro',
    name: 'Experienced Professional',
    subtitle: 'Career Progression & Scale',
    description: 'Prioritizes employment tenure, role promotions, and high-impact measurable business achievements.',
    category: 'Career Level',
    atsScoreRating: 'High Compatibility',
    atsBadgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    recommendedFor: 'Candidates with 3+ years of professional engineering or product experience'
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    subtitle: 'Analytics & Quantified Impact',
    description: 'Emphasizes SQL, Python, BI tools, ETL pipelines, and measurable statistical/business outcomes.',
    category: 'Domain',
    atsScoreRating: '100% ATS Safe',
    atsBadgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    recommendedFor: 'Data Analysts, BI Engineers, Data Scientists, and Analytics Specialists'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    subtitle: 'Pure Monochrome Precision',
    description: 'Zero background distractions, stark black-and-white typography, and ultra-crisp print rendering.',
    category: 'ATS Universal',
    atsScoreRating: '100% ATS Safe',
    atsBadgeColor: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30',
    recommendedFor: 'Candidates seeking maximum clarity with zero decorative overhead'
  },
  {
    id: 'executive',
    name: 'Executive',
    subtitle: 'Leadership & Competency Matrix',
    description: 'Features a Core Competencies grid, executive overview, leadership milestones, and governance.',
    category: 'Career Level',
    atsScoreRating: 'High Compatibility',
    atsBadgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    recommendedFor: 'Team Leads, Engineering Managers, Architects, and Tech Directors'
  }
];

interface TemplateProps {
  content: ResumeContent;
  targetRole?: string;
}

// -------------------------------------------------------------
// 1. Classic ATS Template
// -------------------------------------------------------------
export function ClassicAtsTemplate({ content }: TemplateProps) {
  const { personalInfo, summary, skills, experience, projects, education, certifications, additionalSections } = content;

  return (
    <div className="resume-sheet classic-ats-sheet font-serif text-slate-900 bg-white p-8 sm:p-10 leading-relaxed text-xs">
      {/* Header */}
      <header className="text-center border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-950 font-serif">
          {personalInfo.fullName || 'Candidate Name'}
        </h1>
        {personalInfo.headline && (
          <p className="text-sm font-semibold text-slate-700 mt-1 uppercase tracking-wide">
            {personalInfo.headline}
          </p>
        )}
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[11px] text-slate-700 mt-2 font-sans">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.cityCountry && <span>• {personalInfo.cityCountry}</span>}
          {personalInfo.linkedIn && <span>• {personalInfo.linkedIn}</span>}
          {personalInfo.github && <span>• {personalInfo.github}</span>}
          {personalInfo.portfolioWebsite && <span>• {personalInfo.portfolioWebsite}</span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-1.5 text-slate-950">
            Professional Summary
          </h2>
          <p className="text-slate-800 text-[11px] leading-relaxed text-justify">
            {summary}
          </p>
        </section>
      )}

      {/* Skills */}
      {skills && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-1.5 text-slate-950">
            Technical & Professional Skills
          </h2>
          <div className="space-y-1 text-[11px] text-slate-800">
            {skills.programmingLanguages?.length > 0 && (
              <p><strong className="text-slate-950 font-sans">Programming Languages:</strong> {skills.programmingLanguages.join(', ')}</p>
            )}
            {skills.frameworks?.length > 0 && (
              <p><strong className="text-slate-950 font-sans">Frameworks & Libraries:</strong> {skills.frameworks.join(', ')}</p>
            )}
            {skills.databases?.length > 0 && (
              <p><strong className="text-slate-950 font-sans">Databases:</strong> {skills.databases.join(', ')}</p>
            )}
            {skills.toolsPlatforms?.length > 0 && (
              <p><strong className="text-slate-950 font-sans">Tools & Cloud Platforms:</strong> {skills.toolsPlatforms.join(', ')}</p>
            )}
            {skills.coreConcepts?.length > 0 && (
              <p><strong className="text-slate-950 font-sans">Core Competencies:</strong> {skills.coreConcepts.join(', ')}</p>
            )}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-1.5 text-slate-950">
            Work Experience & Internships
          </h2>
          <div className="space-y-3">
            {experience.map((item: ResumeWorkExperience) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-baseline font-sans">
                  <div>
                    <span className="font-bold text-slate-950 text-xs">{item.jobTitle}</span>
                    <span className="text-slate-700">, {item.company}</span>
                    {item.location && <span className="text-slate-600 text-[11px]"> — {item.location}</span>}
                  </div>
                  <span className="text-slate-600 font-medium text-[11px] whitespace-nowrap">
                    {item.startDate} {item.currentRole ? '– Present' : (item.endDate ? `– ${item.endDate}` : '')}
                  </span>
                </div>
                {item.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-800">
                    {item.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-1.5 text-slate-950">
            Key Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj: ResumeProject) => (
              <div key={proj.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-sans">
                  <span className="font-bold text-slate-950 text-xs">
                    {proj.title}
                    {proj.technologies?.length > 0 && (
                      <span className="font-normal text-slate-600 text-[11px]"> ({proj.technologies.join(', ')})</span>
                    )}
                  </span>
                  {proj.githubUrl && (
                    <span className="text-slate-600 text-[10px] font-mono">{proj.githubUrl}</span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-[11px] text-slate-800">{proj.description}</p>
                )}
                {proj.resultsImpact && (
                  <p className="text-[11px] text-slate-800 font-sans italic">Impact: {proj.resultsImpact}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-1.5 text-slate-950">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu: ResumeEducation) => (
              <div key={edu.id} className="flex justify-between items-baseline font-sans">
                <div>
                  <span className="font-bold text-slate-950 text-xs">{edu.degree}</span>
                  {edu.fieldOfStudy && <span> in {edu.fieldOfStudy}</span>}
                  <div className="text-slate-700 text-[11px]">
                    {edu.institution}
                    {edu.gradeCgpa && <span> • CGPA / Grade: {edu.gradeCgpa}</span>}
                  </div>
                  {edu.coursework && (
                    <p className="text-[10px] text-slate-600 mt-0.5 font-serif">Relevant Coursework: {edu.coursework}</p>
                  )}
                </div>
                <span className="text-slate-600 text-[11px] whitespace-nowrap">
                  {edu.startDate ? `${edu.startDate} – ` : ''}{edu.graduationDate}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications & Achievements */}
      {certifications?.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-1.5 text-slate-950">
            Certifications & Honors
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-800">
            {certifications.map((cert: ResumeCertification) => (
              <li key={cert.id}>
                <strong>{cert.name}</strong> — {cert.issuingOrganization} ({cert.issueDate})
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Additional sections */}
      {additionalSections?.languages?.length > 0 && (
        <section className="mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-400 pb-0.5 mb-1 text-slate-950">
            Languages
          </h2>
          <p className="text-[11px] text-slate-800">{additionalSections.languages.join('  •  ')}</p>
        </section>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 2. Modern Professional Template
// -------------------------------------------------------------
export function ModernProfessionalTemplate({ content }: TemplateProps) {
  const { personalInfo, summary, skills, experience, projects, education, certifications } = content;

  return (
    <div className="resume-sheet modern-pro-sheet font-sans text-slate-800 bg-white p-8 sm:p-10 leading-normal text-xs">
      {/* Top Banner Accent */}
      <header className="border-l-4 border-blue-600 pl-4 py-1 mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
          {personalInfo.fullName || 'Candidate Name'}
        </h1>
        {personalInfo.headline && (
          <p className="text-sm font-semibold text-blue-600 mt-0.5">
            {personalInfo.headline}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-2 font-mono">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.cityCountry && <span>{personalInfo.cityCountry}</span>}
          {personalInfo.linkedIn && <span>{personalInfo.linkedIn}</span>}
          {personalInfo.github && <span>{personalInfo.github}</span>}
        </div>
      </header>

      {summary && (
        <section className="mb-4">
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Summary</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed pl-3.5 border-l border-slate-200">
            {summary}
          </p>
        </section>
      )}

      {/* Skills */}
      {skills && (
        <section className="mb-4">
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Key Competencies</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pl-3.5">
            {skills.programmingLanguages?.length > 0 && (
              <div><strong className="text-slate-900">Languages:</strong> {skills.programmingLanguages.join(', ')}</div>
            )}
            {skills.frameworks?.length > 0 && (
              <div><strong className="text-slate-900">Frameworks:</strong> {skills.frameworks.join(', ')}</div>
            )}
            {skills.databases?.length > 0 && (
              <div><strong className="text-slate-900">Databases:</strong> {skills.databases.join(', ')}</div>
            )}
            {skills.toolsPlatforms?.length > 0 && (
              <div><strong className="text-slate-900">Tools / Cloud:</strong> {skills.toolsPlatforms.join(', ')}</div>
            )}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Experience</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="space-y-3 pl-3.5">
            {experience.map((item: ResumeWorkExperience) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{item.jobTitle}</span>
                    <span className="text-blue-700 font-medium"> @ {item.company}</span>
                    {item.location && <span className="text-slate-500 text-[10px]"> ({item.location})</span>}
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">
                    {item.startDate} {item.currentRole ? '– Present' : (item.endDate ? `– ${item.endDate}` : '')}
                  </span>
                </div>
                {item.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700">
                    {item.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Engineering Projects</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="space-y-2 pl-3.5">
            {projects.map((proj: ResumeProject) => (
              <div key={proj.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-xs">
                    {proj.title}
                    {proj.technologies?.length > 0 && (
                      <span className="text-blue-600 font-normal text-[10px] ml-2 font-mono">
                        [{proj.technologies.join(', ')}]
                      </span>
                    )}
                  </span>
                  {proj.githubUrl && <span className="text-slate-500 font-mono text-[10px]">{proj.githubUrl}</span>}
                </div>
                {proj.description && <p className="text-[11px] text-slate-700">{proj.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <section className="mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Education</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="space-y-1.5 pl-3.5">
            {education.map((edu: ResumeEducation) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</span>
                  <div className="text-slate-600 text-[11px]">{edu.institution} {edu.gradeCgpa && `• CGPA: ${edu.gradeCgpa}`}</div>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">{edu.graduationDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications?.length > 0 && (
        <section className="mb-2">
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Certifications</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="flex flex-wrap gap-2 pl-3.5 text-[11px]">
            {certifications.map((c: ResumeCertification) => (
              <span key={c.id} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                {c.name} ({c.issuingOrganization})
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. Software Engineer Template
// -------------------------------------------------------------
export function SoftwareEngineerTemplate({ content }: TemplateProps) {
  const { personalInfo, summary, skills, projects, experience, education, certifications } = content;

  return (
    <div className="resume-sheet software-eng-sheet font-sans text-slate-900 bg-white p-8 sm:p-10 leading-normal text-xs">
      {/* Dev Header */}
      <header className="border-b border-slate-800 pb-3 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2">
          <div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight font-mono">
              {personalInfo.fullName || 'Engineer Name'}
            </h1>
            <p className="text-xs font-bold text-cyan-800 font-mono mt-0.5">
              &lt;{personalInfo.headline || 'Full Stack Software Engineer'} /&gt;
            </p>
          </div>
          <div className="text-right text-[10px] font-mono text-slate-600 space-y-0.5">
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone} • {personalInfo.cityCountry}</div>}
            {personalInfo.github && <div className="text-cyan-800 font-bold">{personalInfo.github}</div>}
            {personalInfo.linkedIn && <div>{personalInfo.linkedIn}</div>}
          </div>
        </div>
      </header>

      {/* Tech Stack First! */}
      {skills && (
        <section className="mb-4 bg-slate-50 p-2.5 rounded border border-slate-200">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-900 mb-1.5 font-mono">
            // TECHNICAL_STACK & TOOLING
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
            {skills.programmingLanguages?.length > 0 && (
              <p><span className="font-bold text-slate-950 font-mono">LANGUAGES:</span> {skills.programmingLanguages.join(', ')}</p>
            )}
            {skills.frameworks?.length > 0 && (
              <p><span className="font-bold text-slate-950 font-mono">FRAMEWORKS:</span> {skills.frameworks.join(', ')}</p>
            )}
            {skills.databases?.length > 0 && (
              <p><span className="font-bold text-slate-950 font-mono">DATABASES:</span> {skills.databases.join(', ')}</p>
            )}
            {skills.toolsPlatforms?.length > 0 && (
              <p><span className="font-bold text-slate-950 font-mono">CLOUD_DEVOPS:</span> {skills.toolsPlatforms.join(', ')}</p>
            )}
            {skills.coreConcepts?.length > 0 && (
              <p className="sm:col-span-2"><span className="font-bold text-slate-950 font-mono">CORE_CONCEPTS:</span> {skills.coreConcepts.join(', ')}</p>
            )}
          </div>
        </section>
      )}

      {/* Summary */}
      {summary && (
        <section className="mb-4">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1 font-mono">
            // ARCHITECTURAL_PROFILE
          </h2>
          <p className="text-[11px] text-slate-800 leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Engineering Projects (Elevated) */}
      {projects?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 font-mono">
            // KEY_PROJECTS & CODE_REPOSITORIES
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj: ResumeProject) => (
              <div key={proj.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-mono">
                  <span className="font-bold text-slate-950 text-xs">
                    {proj.title}
                  </span>
                  {proj.githubUrl && (
                    <span className="text-cyan-800 text-[10px] underline">{proj.githubUrl}</span>
                  )}
                </div>
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 my-1">
                    {proj.technologies.map((t, idx) => (
                      <span key={idx} className="bg-slate-200 text-slate-800 text-[9px] px-1.5 py-0.2 rounded font-mono font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {proj.description && <p className="text-[11px] text-slate-700">{proj.description}</p>}
                {proj.resultsImpact && <p className="text-[11px] text-slate-800 font-medium">⚡ Impact: {proj.resultsImpact}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 font-mono">
            // EXPERIENCE
          </h2>
          <div className="space-y-3">
            {experience.map((item: ResumeWorkExperience) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-baseline font-mono">
                  <span className="font-bold text-slate-950 text-xs">
                    {item.jobTitle} <span className="font-normal text-slate-700">@ {item.company}</span>
                  </span>
                  <span className="text-slate-600 text-[10px]">
                    {item.startDate} {item.currentRole ? '– Present' : (item.endDate ? `– ${item.endDate}` : '')}
                  </span>
                </div>
                {item.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-800">
                    {item.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education & Certs in Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {education?.length > 0 && (
          <section>
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 font-mono">
              // EDUCATION
            </h2>
            {education.map((edu: ResumeEducation) => (
              <div key={edu.id} className="text-[11px]">
                <div className="font-bold text-slate-900">{edu.degree} - {edu.fieldOfStudy}</div>
                <div className="text-slate-600">{edu.institution} ({edu.graduationDate})</div>
                {edu.gradeCgpa && <div className="text-slate-700 font-mono text-[10px]">CGPA: {edu.gradeCgpa}</div>}
              </div>
            ))}
          </section>
        )}

        {certifications?.length > 0 && (
          <section>
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 font-mono">
              // CERTIFICATIONS
            </h2>
            <ul className="space-y-1 text-[11px] text-slate-800">
              {certifications.map((c: ResumeCertification) => (
                <li key={c.id}>
                  <strong>{c.name}</strong> <span className="text-slate-600 text-[10px]">({c.issuingOrganization})</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. Fresher / Graduate Template
// -------------------------------------------------------------
export function FresherGradTemplate({ content }: TemplateProps) {
  const { personalInfo, summary, education, projects, skills, experience, certifications } = content;

  return (
    <div className="resume-sheet fresher-grad-sheet font-sans text-slate-800 bg-white p-8 sm:p-10 leading-normal text-xs">
      <header className="border-b-2 border-purple-800 pb-3 mb-4 text-center">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
          {personalInfo.fullName || 'Graduate Candidate'}
        </h1>
        <p className="text-xs font-bold text-purple-700 mt-0.5">
          {personalInfo.headline || 'Computer Science Graduate | Aspiring Software Engineer'}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2 font-mono">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.cityCountry && <span>• {personalInfo.cityCountry}</span>}
          {personalInfo.linkedIn && <span>• {personalInfo.linkedIn}</span>}
          {personalInfo.github && <span>• {personalInfo.github}</span>}
        </div>
      </header>

      {summary && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2 py-0.5 border-l-2 border-purple-700 mb-1.5">
            Objective / Profile
          </h2>
          <p className="text-[11px] text-slate-700 leading-relaxed px-2">{summary}</p>
        </section>
      )}

      {/* Education First for Freshers */}
      {education?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2 py-0.5 border-l-2 border-purple-700 mb-2">
            Academic Background
          </h2>
          <div className="space-y-2 px-2">
            {education.map((edu: ResumeEducation) => (
              <div key={edu.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-xs">
                    {edu.degree} in {edu.fieldOfStudy}
                  </span>
                  <span className="text-slate-600 font-mono text-[10px]">
                    {edu.startDate ? `${edu.startDate} – ` : ''}{edu.graduationDate}
                  </span>
                </div>
                <div className="text-slate-700 text-[11px] flex justify-between">
                  <span>{edu.institution}</span>
                  {edu.gradeCgpa && <span className="font-bold text-purple-800">CGPA / Grade: {edu.gradeCgpa}</span>}
                </div>
                {edu.coursework && (
                  <p className="text-[10px] text-slate-600 italic">Relevant Coursework: {edu.coursework}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2 py-0.5 border-l-2 border-purple-700 mb-2">
            Academic & Capstone Projects
          </h2>
          <div className="space-y-2.5 px-2">
            {projects.map((proj: ResumeProject) => (
              <div key={proj.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-xs">{proj.title}</span>
                  {proj.githubUrl && <span className="text-purple-700 font-mono text-[10px]">{proj.githubUrl}</span>}
                </div>
                {proj.technologies?.length > 0 && (
                  <p className="text-[10px] text-purple-800 font-medium">Stack: {proj.technologies.join(', ')}</p>
                )}
                {proj.description && <p className="text-[11px] text-slate-700">{proj.description}</p>}
                {proj.resultsImpact && <p className="text-[10px] text-slate-600 font-medium">Outcome: {proj.resultsImpact}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2 py-0.5 border-l-2 border-purple-700 mb-1.5">
            Technical Proficiencies
          </h2>
          <div className="space-y-1 px-2 text-[11px]">
            {skills.programmingLanguages?.length > 0 && (
              <p><strong>Languages:</strong> {skills.programmingLanguages.join(', ')}</p>
            )}
            {skills.frameworks?.length > 0 && (
              <p><strong>Frameworks & Tools:</strong> {skills.frameworks.concat(skills.toolsPlatforms || []).join(', ')}</p>
            )}
            {skills.databases?.length > 0 && (
              <p><strong>Databases & Storage:</strong> {skills.databases.join(', ')}</p>
            )}
            {skills.coreConcepts?.length > 0 && (
              <p><strong>Core Computer Science:</strong> {skills.coreConcepts.join(', ')}</p>
            )}
          </div>
        </section>
      )}

      {/* Experience / Internships */}
      {experience?.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2 py-0.5 border-l-2 border-purple-700 mb-2">
            Internships & Experience
          </h2>
          <div className="space-y-2.5 px-2">
            {experience.map((item: ResumeWorkExperience) => (
              <div key={item.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-xs">{item.jobTitle} - {item.company}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{item.startDate} – {item.endDate || 'Present'}</span>
                </div>
                {item.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700">
                    {item.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications?.length > 0 && (
        <section className="mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2 py-0.5 border-l-2 border-purple-700 mb-1">
            Certifications & Co-Curriculars
          </h2>
          <ul className="list-disc list-outside pl-6 space-y-0.5 text-[11px] text-slate-700">
            {certifications.map((c: ResumeCertification) => (
              <li key={c.id}>
                <strong>{c.name}</strong> ({c.issuingOrganization}, {c.issueDate})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 5. Experienced Professional Template
// -------------------------------------------------------------
export function ExperiencedProTemplate({ content }: TemplateProps) {
  const { personalInfo, summary, experience, skills, projects, education, certifications } = content;

  return (
    <div className="resume-sheet experienced-pro-sheet font-sans text-slate-900 bg-white p-8 sm:p-10 leading-normal text-xs">
      {/* Header */}
      <header className="border-b-2 border-amber-800 pb-3 mb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tight font-heading">
              {personalInfo.fullName || 'Candidate Name'}
            </h1>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mt-0.5">
              {personalInfo.headline || 'Senior Software Engineer | System Architect'}
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-600 font-mono space-y-0.5">
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone} • {personalInfo.cityCountry}</div>}
            {personalInfo.linkedIn && <div>{personalInfo.linkedIn}</div>}
          </div>
        </div>
      </header>

      {summary && (
        <section className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            Executive Career Overview
          </h2>
          <p className="text-[11px] text-slate-800 leading-relaxed text-justify">{summary}</p>
        </section>
      )}

      {/* Experience First */}
      {experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">
            Professional Experience & Career History
          </h2>
          <div className="space-y-3.5">
            {experience.map((item: ResumeWorkExperience) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-950 text-xs">{item.jobTitle}</span>
                    <span className="text-amber-800 font-semibold"> | {item.company}</span>
                    {item.location && <span className="text-slate-500 text-[10px]"> ({item.location})</span>}
                  </div>
                  <span className="text-slate-600 font-mono text-[10px] font-semibold">
                    {item.startDate} {item.currentRole ? '– Present' : (item.endDate ? `– ${item.endDate}` : '')}
                  </span>
                </div>
                {item.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-800">
                    {item.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Core Competencies */}
      {skills && (
        <section className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            Technical & Domain Competencies
          </h2>
          <div className="space-y-1 text-[11px]">
            {skills.programmingLanguages?.length > 0 && (
              <p><strong>Languages & Runtimes:</strong> {skills.programmingLanguages.join(', ')}</p>
            )}
            {skills.frameworks?.length > 0 && (
              <p><strong>Architecture & Frameworks:</strong> {skills.frameworks.join(', ')}</p>
            )}
            {skills.databases?.length > 0 && (
              <p><strong>Data Stores & Caching:</strong> {skills.databases.join(', ')}</p>
            )}
            {skills.toolsPlatforms?.length > 0 && (
              <p><strong>Cloud, DevOps & Tooling:</strong> {skills.toolsPlatforms.join(', ')}</p>
            )}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            Key Architecture Projects
          </h2>
          <div className="space-y-2">
            {projects.map((proj: ResumeProject) => (
              <div key={proj.id} className="space-y-0.5">
                <span className="font-bold text-slate-950 text-xs">{proj.title}</span>
                {proj.description && <p className="text-[11px] text-slate-700">{proj.description}</p>}
                {proj.resultsImpact && <p className="text-[10px] text-amber-900 font-medium">Impact: {proj.resultsImpact}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education & Certifications */}
      <div className="grid grid-cols-2 gap-4">
        {education?.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
              Education
            </h2>
            {education.map((edu: ResumeEducation) => (
              <div key={edu.id} className="text-[11px]">
                <div className="font-bold text-slate-950">{edu.degree}</div>
                <div className="text-slate-600">{edu.institution}</div>
              </div>
            ))}
          </section>
        )}
        {certifications?.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
              Credentials
            </h2>
            <ul className="text-[11px] text-slate-800 space-y-0.5">
              {certifications.map((c: ResumeCertification) => (
                <li key={c.id}><strong>{c.name}</strong></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. Data Analyst Template
// -------------------------------------------------------------
export function DataAnalystTemplate({ content }: TemplateProps) {
  const { personalInfo, summary, skills, experience, projects, education, certifications } = content;

  return (
    <div className="resume-sheet data-analyst-sheet font-sans text-slate-900 bg-white p-8 sm:p-10 leading-normal text-xs">
      <header className="border-b-2 border-teal-700 pb-3 mb-4">
        <h1 className="text-2xl font-black text-slate-950 tracking-tight font-heading">
          {personalInfo.fullName || 'Data Analyst Name'}
        </h1>
        <p className="text-xs font-bold text-teal-800 uppercase tracking-wider mt-0.5 font-mono">
          {personalInfo.headline || 'Data Analyst | Business Intelligence & SQL Specialist'}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2 font-mono">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.cityCountry && <span>• {personalInfo.cityCountry}</span>}
          {personalInfo.linkedIn && <span>• {personalInfo.linkedIn}</span>}
          {personalInfo.github && <span>• {personalInfo.github}</span>}
        </div>
      </header>

      {summary && (
        <section className="mb-4 bg-teal-50/50 p-2.5 rounded border border-teal-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-1">
            Data Science & Analytics Summary
          </h2>
          <p className="text-[11px] text-slate-800 leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Analytical Toolkit */}
      {skills && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 border-b border-teal-600 pb-0.5 mb-1.5">
            Analytics Stack & Quantitative Tools
          </h2>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {skills.programmingLanguages?.length > 0 && (
              <p><strong>Querying & Scripting:</strong> {skills.programmingLanguages.join(', ')}</p>
            )}
            {skills.databases?.length > 0 && (
              <p><strong>Data Warehouses & SQL:</strong> {skills.databases.join(', ')}</p>
            )}
            {skills.frameworks?.length > 0 && (
              <p><strong>Analysis Libraries:</strong> {skills.frameworks.join(', ')}</p>
            )}
            {skills.toolsPlatforms?.length > 0 && (
              <p><strong>BI, ETL & Cloud Platforms:</strong> {skills.toolsPlatforms.join(', ')}</p>
            )}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 border-b border-teal-600 pb-0.5 mb-2">
            Analytical Experience & Business Impact
          </h2>
          <div className="space-y-3">
            {experience.map((item: ResumeWorkExperience) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-950 text-xs">
                    {item.jobTitle} <span className="font-normal text-teal-800">@ {item.company}</span>
                  </span>
                  <span className="text-slate-600 font-mono text-[10px]">
                    {item.startDate} – {item.currentRole ? 'Present' : item.endDate}
                  </span>
                </div>
                {item.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-800">
                    {item.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Data Projects */}
      {projects?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 border-b border-teal-600 pb-0.5 mb-2">
            Analytics & Modeling Projects
          </h2>
          <div className="space-y-2">
            {projects.map((proj: ResumeProject) => (
              <div key={proj.id} className="space-y-0.5">
                <span className="font-bold text-slate-950 text-xs">{proj.title}</span>
                {proj.technologies?.length > 0 && (
                  <span className="text-teal-700 text-[10px] ml-2 font-mono">[{proj.technologies.join(', ')}]</span>
                )}
                {proj.description && <p className="text-[11px] text-slate-700">{proj.description}</p>}
                {proj.resultsImpact && <p className="text-[10px] text-teal-900 font-semibold">📈 Measurable Impact: {proj.resultsImpact}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education & Certs */}
      <div className="grid grid-cols-2 gap-4">
        {education?.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 border-b border-teal-600 pb-0.5 mb-1">
              Education
            </h2>
            {education.map((edu: ResumeEducation) => (
              <div key={edu.id} className="text-[11px]">
                <div className="font-bold text-slate-950">{edu.degree} - {edu.fieldOfStudy}</div>
                <div className="text-slate-600">{edu.institution} ({edu.graduationDate})</div>
              </div>
            ))}
          </section>
        )}
        {certifications?.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-950 border-b border-teal-600 pb-0.5 mb-1">
              Certifications
            </h2>
            <ul className="text-[11px] text-slate-800 space-y-0.5">
              {certifications.map((c: ResumeCertification) => (
                <li key={c.id}><strong>{c.name}</strong></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. Minimalist Template
// -------------------------------------------------------------
export function MinimalistTemplate({ content }: TemplateProps) {
  const { personalInfo, summary, skills, experience, projects, education, certifications } = content;

  return (
    <div className="resume-sheet minimalist-sheet font-sans text-black bg-white p-8 sm:p-10 leading-normal text-xs">
      {/* Stark Minimalist Header */}
      <header className="pb-3 mb-4 border-b border-black">
        <h1 className="text-2xl font-light tracking-tight text-black uppercase font-mono">
          {personalInfo.fullName || 'Candidate Name'}
        </h1>
        {personalInfo.headline && (
          <p className="text-xs text-zinc-700 tracking-widest uppercase mt-0.5 font-mono">
            {personalInfo.headline}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-600 mt-2 font-mono">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.cityCountry && <span>{personalInfo.cityCountry}</span>}
          {personalInfo.github && <span>{personalInfo.github}</span>}
          {personalInfo.linkedIn && <span>{personalInfo.linkedIn}</span>}
        </div>
      </header>

      {summary && (
        <section className="mb-4">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
            01 / SUMMARY
          </h2>
          <p className="text-[11px] text-zinc-900 leading-relaxed">{summary}</p>
        </section>
      )}

      {skills && (
        <section className="mb-4">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
            02 / SKILLS
          </h2>
          <div className="text-[11px] space-y-0.5 font-mono">
            {skills.programmingLanguages?.length > 0 && (
              <p><span className="text-zinc-500">LANG:</span> {skills.programmingLanguages.join(', ')}</p>
            )}
            {skills.frameworks?.length > 0 && (
              <p><span className="text-zinc-500">FRAMEWORKS:</span> {skills.frameworks.join(', ')}</p>
            )}
            {skills.databases?.length > 0 && (
              <p><span className="text-zinc-500">DATA:</span> {skills.databases.join(', ')}</p>
            )}
            {skills.toolsPlatforms?.length > 0 && (
              <p><span className="text-zinc-500">TOOLS:</span> {skills.toolsPlatforms.join(', ')}</p>
            )}
          </div>
        </section>
      )}

      {experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">
            03 / EXPERIENCE
          </h2>
          <div className="space-y-3">
            {experience.map((item: ResumeWorkExperience) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-baseline font-mono">
                  <span className="font-semibold text-black text-xs">
                    {item.jobTitle} — {item.company}
                  </span>
                  <span className="text-zinc-500 text-[10px]">
                    {item.startDate} {item.currentRole ? '– NOW' : (item.endDate ? `– ${item.endDate}` : '')}
                  </span>
                </div>
                {item.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-zinc-800">
                    {item.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">
            04 / PROJECTS
          </h2>
          <div className="space-y-2">
            {projects.map((proj: ResumeProject) => (
              <div key={proj.id} className="space-y-0.5">
                <div className="flex justify-between font-mono">
                  <span className="font-semibold text-black">{proj.title}</span>
                  {proj.githubUrl && <span className="text-zinc-500 text-[10px]">{proj.githubUrl}</span>}
                </div>
                {proj.description && <p className="text-[11px] text-zinc-800">{proj.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {education?.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
            05 / EDUCATION
          </h2>
          {education.map((edu: ResumeEducation) => (
            <div key={edu.id} className="flex justify-between font-mono text-[11px]">
              <span>{edu.degree} — {edu.institution}</span>
              <span className="text-zinc-500">{edu.graduationDate}</span>
            </div>
          ))}
        </section>
      )}

      {certifications?.length > 0 && (
        <section className="mb-2">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
            06 / CERTIFICATIONS
          </h2>
          <ul className="font-mono text-[11px] space-y-0.5 text-zinc-800">
            {certifications.map((c: ResumeCertification) => (
              <li key={c.id}>• {c.name} ({c.issuingOrganization})</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 8. Executive Template
// -------------------------------------------------------------
export function ExecutiveTemplate({ content }: TemplateProps) {
  const { personalInfo, summary, skills, experience, projects, education, certifications } = content;

  return (
    <div className="resume-sheet executive-sheet font-serif text-slate-900 bg-white p-8 sm:p-10 leading-normal text-xs">
      {/* Executive Header Box */}
      <header className="border-b-2 border-slate-900 pb-4 mb-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-serif">
            {personalInfo.fullName || 'Executive Candidate'}
          </h1>
          {personalInfo.headline && (
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest mt-1 font-sans">
              {personalInfo.headline}
            </p>
          )}
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-2 font-sans">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.cityCountry && <span>• {personalInfo.cityCountry}</span>}
            {personalInfo.linkedIn && <span>• {personalInfo.linkedIn}</span>}
          </div>
        </div>
      </header>

      {summary && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-0.5 mb-1.5 font-sans">
            Executive Summary
          </h2>
          <p className="text-[11px] text-slate-800 leading-relaxed text-justify">{summary}</p>
        </section>
      )}

      {/* Core Leadership & Competency Grid */}
      {skills && (
        <section className="mb-4 bg-slate-50 p-2.5 rounded border border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-1.5 font-sans">
            Core Competency Matrix
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-sans">
            {skills.coreConcepts?.concat(skills.communicationLeadership || []).slice(0, 6).map((c, idx) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <span className="font-semibold text-slate-900">{c}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Senior Leadership Experience */}
      {experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-0.5 mb-2 font-sans">
            Professional Experience & Strategic Leadership
          </h2>
          <div className="space-y-3">
            {experience.map((item: ResumeWorkExperience) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-baseline font-sans">
                  <div>
                    <span className="font-bold text-slate-950 text-xs">{item.jobTitle}</span>
                    <span className="text-slate-800 font-semibold">, {item.company}</span>
                  </div>
                  <span className="text-slate-600 text-[11px]">
                    {item.startDate} {item.currentRole ? '– Present' : (item.endDate ? `– ${item.endDate}` : '')}
                  </span>
                </div>
                {item.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-800">
                    {item.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education & Credentials */}
      <div className="grid grid-cols-2 gap-4">
        {education?.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-0.5 mb-1 font-sans">
              Academic Credentials
            </h2>
            {education.map((edu: ResumeEducation) => (
              <div key={edu.id} className="text-[11px] font-sans">
                <div className="font-bold text-slate-950">{edu.degree}</div>
                <div className="text-slate-700">{edu.institution}</div>
              </div>
            ))}
          </section>
        )}
        {certifications?.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-0.5 mb-1 font-sans">
              Governance & Certifications
            </h2>
            <ul className="text-[11px] text-slate-800 space-y-0.5 font-sans">
              {certifications.map((c: ResumeCertification) => (
                <li key={c.id}><strong>{c.name}</strong></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Master Template Switcher
// -------------------------------------------------------------
export function ResumePreviewRenderer({ templateId, content, targetRole }: { templateId: string; content: ResumeContent; targetRole?: string }) {
  switch (templateId) {
    case 'modern-pro':
      return <ModernProfessionalTemplate content={content} targetRole={targetRole} />;
    case 'software-engineer':
      return <SoftwareEngineerTemplate content={content} targetRole={targetRole} />;
    case 'fresher-grad':
      return <FresherGradTemplate content={content} targetRole={targetRole} />;
    case 'experienced-pro':
      return <ExperiencedProTemplate content={content} targetRole={targetRole} />;
    case 'data-analyst':
      return <DataAnalystTemplate content={content} targetRole={targetRole} />;
    case 'minimalist':
      return <MinimalistTemplate content={content} targetRole={targetRole} />;
    case 'executive':
      return <ExecutiveTemplate content={content} targetRole={targetRole} />;
    case 'classic-ats':
    default:
      return <ClassicAtsTemplate content={content} targetRole={targetRole} />;
  }
}
