import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Save,
  Download,
  Printer,
  Sparkles,
  Layout,
  Plus,
  Trash2,
  Copy,
  FolderOpen,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Brain,
  Wand2,
  FileCheck2,
  HelpCircle,
  Eye,
  ListPlus,
  Briefcase,
  X
} from 'lucide-react';
import {
  User,
  ResumeDocument,
  ResumeContent,
  ResumeEducation,
  ResumeWorkExperience,
  ResumeProject,
  ResumeCertification,
  AtsCheckReport
} from '../types.js';
import { api } from '../lib/api.js';
import { ATS_TEMPLATES, ResumePreviewRenderer } from '../components/resume/ResumeTemplates.js';
import TemplateGalleryModal from '../components/resume/TemplateGalleryModal.js';
import MyResumesModal from '../components/resume/MyResumesModal.js';
import AtsCompatibilityPanel from '../components/resume/AtsCompatibilityPanel.js';
import AiSummaryHelperModal from '../components/resume/AiSummaryHelperModal.js';
import { generateResumeFilename, exportLiveResumeToPdf } from '../lib/pdfExporter.js';

interface ResumeBuilderProps {
  user: User;
  onNavigate: (view: string, id?: string) => void;
}

const DEFAULT_CONTENT: ResumeContent = {
  personalInfo: {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    cityCountry: '',
    linkedIn: '',
    github: '',
    portfolioWebsite: ''
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

const ACTION_VERB_SUGGESTIONS = [
  'Spearheaded', 'Architected', 'Engineered', 'Optimized',
  'Accelerated', 'Reduced', 'Delivered', 'Automated',
  'Streamlined', 'Scaled', 'Refactored', 'Deployed'
];

export default function ResumeBuilder({ user, onNavigate }: ResumeBuilderProps) {
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeDocument | null>(null);
  const [title, setTitle] = useState('Professional Resume');
  const [targetRole, setTargetRole] = useState(user.targetRole || 'Full Stack Engineer');
  const [templateId, setTemplateId] = useState('classic-ats');
  const [content, setContent] = useState<ResumeContent>(DEFAULT_CONTENT);

  // UI state
  const [activeSection, setActiveSection] = useState<
    'personal' | 'summary' | 'experience' | 'projects' | 'skills' | 'education' | 'certifications' | 'additional'
  >('personal');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [loading, setLoading] = useState(true);
  const [atsReport, setAtsReport] = useState<AtsCheckReport | null>(null);

  // Modals
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showMyResumesModal, setShowMyResumesModal] = useState(false);
  const [showAtsPanel, setShowAtsPanel] = useState(false);
  const [showSummaryAiModal, setShowSummaryAiModal] = useState(false);
  const [showImportProfileModal, setShowImportProfileModal] = useState(false);

  // PDF Export Feedback State
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportStatusMessage, setExportStatusMessage] = useState('');
  const [exportToast, setExportToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Skills input temp state
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({
    languages: '',
    frameworks: '',
    databases: '',
    tools: '',
    core: ''
  });

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const autosaveTimeoutRef = useRef<any>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // 1. Fetch resumes list on mount
  const loadResumes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/resumes');
      if (res.ok) {
        const data = await res.json();
        const list: ResumeDocument[] = data.resumes || [];
        setResumes(list);

        if (list.length > 0) {
          // Select most recently updated resume
          const first = list[0];
          setActiveResume(first);
          setTitle(first.title);
          setTargetRole(first.targetRole || 'Full Stack Engineer');
          setTemplateId(first.templateId || 'classic-ats');
          setContent(first.content || DEFAULT_CONTENT);
          runAtsCheck(first.content, first.targetRole);
        } else {
          // Create an initial default resume for this user
          await handleCreateNewResume();
        }
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
      isInitialLoadRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  // Run ATS Check
  const runAtsCheck = async (currentContent: ResumeContent, role: string) => {
    try {
      const res = await api.post('/api/resumes/ats-check-preview', {
        targetRole: role,
        content: currentContent
      });
      if (res.ok) {
        const data = await res.json();
        if (data.atsCheck) {
          setAtsReport(data.atsCheck);
        }
      }
    } catch (e) {
      console.warn('ATS check failed:', e);
    }
  };

  // 2. Debounced Autosave
  const triggerAutosave = useCallback(
    (newContent: ResumeContent, newTitle: string, newRole: string, newTemplate: string) => {
      setSaveStatus('unsaved');
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

      autosaveTimeoutRef.current = setTimeout(async () => {
        if (!activeResume) return;
        setSaveStatus('saving');
        try {
          const res = await api.put(`/api/resumes/${activeResume.id}`, {
            title: newTitle,
            targetRole: newRole,
            templateId: newTemplate,
            content: newContent
          });
          if (res.ok) {
            const data = await res.json();
            setActiveResume(data.resume);
            setSaveStatus('saved');
            // update in resumes list
            setResumes((prev) =>
              prev.map((r) => (r.id === activeResume.id ? data.resume : r))
            );
          } else {
            setSaveStatus('unsaved');
          }
        } catch (e) {
          console.error('Autosave error:', e);
          setSaveStatus('unsaved');
        }
      }, 1800);
    },
    [activeResume]
  );

  // Content change dispatcher
  const updateContent = (updater: (prev: ResumeContent) => ResumeContent) => {
    setContent((prev) => {
      const next = updater(prev);
      if (!isInitialLoadRef.current) {
        triggerAutosave(next, title, targetRole, templateId);
        runAtsCheck(next, targetRole);
      }
      return next;
    });
  };

  // Explicit Save
  const handleManualSave = async () => {
    if (!activeResume) return;
    setSaveStatus('saving');
    try {
      const res = await api.put(`/api/resumes/${activeResume.id}`, {
        title,
        targetRole,
        templateId,
        content
      });
      if (res.ok) {
        const data = await res.json();
        setActiveResume(data.resume);
        setSaveStatus('saved');
        runAtsCheck(content, targetRole);
      } else {
        setSaveStatus('unsaved');
      }
    } catch (e) {
      console.error('Manual save failed:', e);
      setSaveStatus('unsaved');
    }
  };

  // Create New Resume
  const handleCreateNewResume = async () => {
    try {
      setLoading(true);
      const res = await api.post('/api/resumes', {
        title: `${user.name || 'Candidate'} - ${targetRole} Resume`,
        targetRole,
        templateId: 'classic-ats'
      });
      if (res.ok) {
        const data = await res.json();
        const newDoc: ResumeDocument = data.resume;
        setResumes((prev) => [newDoc, ...prev]);
        setActiveResume(newDoc);
        setTitle(newDoc.title);
        setTargetRole(newDoc.targetRole);
        setTemplateId(newDoc.templateId);
        setContent(newDoc.content);
        setSaveStatus('saved');
        runAtsCheck(newDoc.content, newDoc.targetRole);
      }
    } catch (e) {
      console.error('Create resume failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // Select Resume from My Resumes
  const handleSelectResume = (id: string) => {
    const found = resumes.find((r) => r.id === id);
    if (found) {
      setActiveResume(found);
      setTitle(found.title);
      setTargetRole(found.targetRole || 'Full Stack Engineer');
      setTemplateId(found.templateId || 'classic-ats');
      setContent(found.content);
      setSaveStatus('saved');
      runAtsCheck(found.content, found.targetRole);
    }
  };

  // Duplicate Resume
  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.post(`/api/resumes/${id}/duplicate`, {});
      if (res.ok) {
        const data = await res.json();
        setResumes((prev) => [data.resume, ...prev]);
        handleSelectResume(data.resume.id);
      }
    } catch (e) {
      console.error('Duplicate failed:', e);
    }
  };

  // Rename Resume
  const handleRename = async (id: string, newTitle: string) => {
    try {
      const res = await api.put(`/api/resumes/${id}`, {
        title: newTitle
      });
      if (res.ok) {
        const data = await res.json();
        setResumes((prev) => prev.map((r) => (r.id === id ? data.resume : r)));
        if (activeResume?.id === id) {
          setTitle(newTitle);
        }
      }
    } catch (e) {
      console.error('Rename failed:', e);
    }
  };

  // Delete Resume
  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/api/resumes/${id}`);
      if (res.ok) {
        const filtered = resumes.filter((r) => r.id !== id);
        setResumes(filtered);
        if (activeResume?.id === id && filtered.length > 0) {
          handleSelectResume(filtered[0].id);
        }
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  // Export High-Fidelity A4 PDF
  const handleDownloadPdf = async () => {
    if (exportingPdf) return; // Prevent duplicate rapid clicks

    setExportingPdf(true);
    setExportToast(null);
    setExportStatusMessage('Saving current resume state...');

    try {
      let currentDoc = activeResume;

      // 1. Ensure resume is saved to database
      if (currentDoc) {
        await api.put(`/api/resumes/${currentDoc.id}`, {
          title,
          targetRole,
          templateId,
          content
        });
      } else {
        const createRes = await api.post('/api/resumes', {
          title: title || 'Professional Resume',
          targetRole: targetRole || 'Full Stack Engineer',
          templateId: templateId || 'classic-ats',
          content
        });
        if (createRes.ok) {
          const createData = await createRes.json();
          currentDoc = createData.resume;
          setActiveResume(currentDoc);
        }
      }

      // 2. Generate clean, sanitized filename (e.g. "Harshini_RB_Resume.pdf")
      const filename = generateResumeFilename(content.personalInfo?.fullName, title);

      // 3. Target the live A4 preview DOM container
      const previewElem = document.getElementById('live-resume-document') || document.querySelector('.resume-sheet');

      if (previewElem) {
        // Export the live styled A4 preview with html2canvas + jsPDF
        await exportLiveResumeToPdf(previewElem as HTMLElement, {
          filename,
          onProgress: (step) => setExportStatusMessage(step)
        });

        setExportToast({
          type: 'success',
          message: `Resume successfully downloaded as "${filename}".`
        });
      } else if (currentDoc) {
        // Fallback: Download high-speed compiled vector PDF from server
        setExportStatusMessage('Downloading compiled PDF from server...');
        const response = await fetch(`/api/resumes/${currentDoc.id}/export/pdf`, {
          method: 'GET',
          headers: { 'Accept': 'application/pdf' }
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportToast({
          type: 'success',
          message: `Resume successfully downloaded as "${filename}".`
        });
      } else {
        throw new Error('Resume preview element was not found in the DOM.');
      }
    } catch (e) {
      console.error('PDF download error:', e);
      const errMsg = e instanceof Error ? e.message : 'Unknown generation error';
      setExportToast({
        type: 'error',
        message: `Failed to download PDF: ${errMsg}. You can also use the Print button to save as PDF.`
      });
    } finally {
      setExportingPdf(false);
      setExportStatusMessage('');
      // Auto-clear success toast after 5 seconds
      setTimeout(() => {
        setExportToast((prev) => (prev?.type === 'success' ? null : prev));
      }, 5000);
    }
  };

  // Print Resume
  const handlePrint = () => {
    window.print();
  };

  // Import saved details from Career Navigator Profile
  const handleImportProfileDetails = () => {
    try {
      // 1. Personal Details
      const newPersonalInfo = {
        fullName: user.name || content.personalInfo.fullName,
        headline: user.targetRole || content.personalInfo.headline || 'Full Stack Engineer',
        email: user.email || content.personalInfo.email,
        phone: user.phone || content.personalInfo.phone,
        cityCountry: user.cityState || content.personalInfo.cityCountry,
        linkedIn: user.linkedIn || content.personalInfo.linkedIn,
        github: user.github || content.personalInfo.github,
        portfolioWebsite: user.portfolioWebsite || content.personalInfo.portfolioWebsite
      };

      // 2. Education
      let newEducation = [...content.education];
      if (user.educationDataJson) {
        try {
          const parsedEdu = JSON.parse(user.educationDataJson);
          if (Array.isArray(parsedEdu) && parsedEdu.length > 0) {
            newEducation = parsedEdu.map((e: any, idx: number) => ({
              id: e.id || `imported-edu-${idx}`,
              institution: e.institution || '',
              degree: e.degree || '',
              fieldOfStudy: e.specialization || '',
              graduationDate: e.graduationYear || '',
              gpa: e.score || '',
              current: e.status === 'Pursuing'
            }));
          }
        } catch {}
      }

      // 3. Technical Skills
      let newSkills = { ...content.skills };
      if (user.skillsDataJson) {
        try {
          const parsedSkills = JSON.parse(user.skillsDataJson);
          if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
            const prog = parsedSkills.filter((s: any) => s.category === 'Programming Languages').map((s: any) => s.name);
            const fram = parsedSkills.filter((s: any) => s.category === 'Frameworks').map((s: any) => s.name);
            const db = parsedSkills.filter((s: any) => s.category === 'Databases').map((s: any) => s.name);
            const tools = parsedSkills.filter((s: any) => s.category === 'Developer Tools' || s.category === 'Cloud').map((s: any) => s.name);
            const core = parsedSkills.filter((s: any) => s.category === 'Other').map((s: any) => s.name);

            if (prog.length > 0) newSkills.programmingLanguages = Array.from(new Set([...newSkills.programmingLanguages, ...prog]));
            if (fram.length > 0) newSkills.frameworks = Array.from(new Set([...newSkills.frameworks, ...fram]));
            if (db.length > 0) newSkills.databases = Array.from(new Set([...newSkills.databases, ...db]));
            if (tools.length > 0) newSkills.toolsPlatforms = Array.from(new Set([...newSkills.toolsPlatforms, ...tools]));
            if (core.length > 0) newSkills.coreConcepts = Array.from(new Set([...newSkills.coreConcepts, ...core]));
          }
        } catch {}
      } else if (user.skills && user.skills.length > 0) {
        newSkills.programmingLanguages = Array.from(new Set([...newSkills.programmingLanguages, ...user.skills]));
      }

      // 4. Projects
      let newProjects = [...content.projects];
      if (user.projectsDataJson) {
        try {
          const parsedProjects = JSON.parse(user.projectsDataJson);
          if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            newProjects = parsedProjects.map((p: any, idx: number) => ({
              id: p.id || `imported-proj-${idx}`,
              title: p.title || '',
              description: p.description || '',
              technologies: p.technologies || [],
              githubUrl: p.githubUrl || '',
              liveUrl: p.liveUrl || '',
              resultsImpact: Array.isArray(p.accomplishments) ? p.accomplishments.join('; ') : ''
            }));
          }
        } catch {}
      }

      // 5. Certifications
      let newCertifications = [...content.certifications];
      if (user.certificationsDataJson) {
        try {
          const parsedCerts = JSON.parse(user.certificationsDataJson);
          if (Array.isArray(parsedCerts) && parsedCerts.length > 0) {
            newCertifications = parsedCerts.map((c: any, idx: number) => ({
              id: c.id || `imported-cert-${idx}`,
              name: c.title || '',
              issuer: c.issuer || '',
              issueDate: c.issueDate || ''
            }));
          }
        } catch {}
      }

      // 6. Experience
      let newExperience = [...content.experience];
      if (user.experienceDataJson) {
        try {
          const parsedExp = JSON.parse(user.experienceDataJson);
          if (Array.isArray(parsedExp) && parsedExp.length > 0) {
            newExperience = parsedExp.map((exp: any, idx: number) => ({
              id: exp.id || `imported-exp-${idx}`,
              company: exp.company || '',
              jobTitle: exp.role || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              current: exp.current || false,
              bullets: exp.description ? [exp.description] : []
            }));
          }
        } catch {}
      }

      const mergedContent: ResumeContent = {
        ...content,
        personalInfo: newPersonalInfo,
        education: newEducation,
        skills: newSkills,
        projects: newProjects,
        certifications: newCertifications,
        experience: newExperience
      };

      const newTargetRole = user.targetRole || targetRole;
      setContent(mergedContent);
      if (user.targetRole) setTargetRole(user.targetRole);
      triggerAutosave(mergedContent, title, newTargetRole, templateId);
      runAtsCheck(mergedContent, newTargetRole);
      setShowImportProfileModal(false);
    } catch (e) {
      console.error('Failed to import profile data:', e);
    }
  };

  // Send to Resume Analyzer
  const handleSendToAnalyzer = () => {
    try {
      // Format plain text representation for the analyzer
      const pi = content.personalInfo;
      const text = [
        pi.fullName,
        pi.headline,
        pi.email,
        pi.phone,
        pi.cityCountry,
        pi.linkedIn,
        pi.github,
        '\nSUMMARY',
        content.summary,
        '\nSKILLS',
        content.skills.programmingLanguages.join(', '),
        content.skills.frameworks.join(', '),
        content.skills.databases.join(', '),
        content.skills.toolsPlatforms.join(', '),
        content.skills.coreConcepts.join(', '),
        '\nEXPERIENCE',
        ...content.experience.map(
          (e) => `${e.jobTitle} - ${e.company} (${e.startDate} - ${e.endDate})\n${e.bullets.join('\n')}`
        ),
        '\nPROJECTS',
        ...content.projects.map((p) => `${p.title} [${p.technologies.join(', ')}]\n${p.description}\n${p.resultsImpact}`),
        '\nEDUCATION',
        ...content.education.map((edu) => `${edu.degree} in ${edu.fieldOfStudy} - ${edu.institution} (${edu.graduationDate})`)
      ].join('\n');

      sessionStorage.setItem(
        'analyzer_prefill_resume',
        JSON.stringify({
          resumeText: text,
          targetRole,
          resumeTitle: title,
          resumeId: activeResume?.id
        })
      );
      onNavigate('resume-analyzer');
    } catch (e) {
      console.error('Failed to prefill analyzer:', e);
    }
  };

  // Active Template Object
  const currentTemplateObj = ATS_TEMPLATES.find((t) => t.id === templateId) || ATS_TEMPLATES[0];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col pb-12">
      {/* 1. Header Toolbar (no-print) */}
      <div className="no-print sticky top-0 z-30 bg-[var(--bg-card)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 py-3 shadow-sm">
        {/* Status Toast Banner */}
        {exportToast && (
          <div className="max-w-7xl mx-auto w-full mb-3">
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                exportToast.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {exportToast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="font-medium">{exportToast.message}</span>
              </div>
              <button
                onClick={() => setExportToast(null)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                aria-label="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        {exportingPdf && exportStatusMessage && (
          <div className="max-w-7xl mx-auto w-full mb-3">
            <div className="p-2.5 rounded-xl border bg-cyan-950/60 border-cyan-500/40 text-cyan-200 flex items-center space-x-2 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
              <span className="font-medium">{exportStatusMessage}</span>
            </div>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Title & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    triggerAutosave(content, e.target.value, targetRole, templateId);
                  }}
                  className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-base)] focus:bg-[var(--bg-base)] px-1.5 py-0.5 rounded border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition max-w-[260px] sm:max-w-[340px]"
                />
                {/* Autosave Status Pill */}
                <span className="text-[10px] font-mono flex items-center space-x-1 text-[var(--text-muted)]">
                  {saveStatus === 'saved' && (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Saved</span>
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="text-amber-400 flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </span>
                  )}
                  {saveStatus === 'unsaved' && (
                    <span className="text-slate-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Unsaved</span>
                    </span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate max-w-md hidden sm:block">
                Build a professional, ATS-friendly resume tailored to your next opportunity.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Target Role Selector */}
            <select
              value={targetRole}
              onChange={(e) => {
                setTargetRole(e.target.value);
                triggerAutosave(content, title, e.target.value, templateId);
                runAtsCheck(content, e.target.value);
              }}
              className="bg-[var(--bg-base)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="Full Stack Engineer">Full Stack Engineer</option>
              <option value="Backend Java Engineer">Backend Java Engineer</option>
              <option value="Frontend React Engineer">Frontend React Engineer</option>
              <option value="Cloud DevOps Engineer">Cloud DevOps Engineer</option>
              <option value="Data Analyst">Data Analyst</option>
              <option value="Software Development Engineer (Fresher)">SDE (Fresher / Graduate)</option>
            </select>

            {/* Template Selector Button */}
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-[var(--bg-base)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center space-x-1.5 text-[var(--text-primary)]"
            >
              <Layout className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Template: <strong className="text-[var(--primary)]">{currentTemplateObj.name}</strong></span>
            </button>

            {/* My Resumes Drawer Button */}
            <button
              onClick={() => setShowMyResumesModal(true)}
              className="bg-[var(--bg-base)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center space-x-1.5 text-[var(--text-secondary)]"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>My Resumes ({resumes.length})</span>
            </button>

            {/* Import Profile Details */}
            <button
              onClick={() => setShowImportProfileModal(true)}
              className="bg-[var(--bg-base)] hover:bg-[var(--bg-card-hover)] border border-cyan-500/30 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center space-x-1.5 text-cyan-400"
              title="Import saved profile information into this resume"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Import Profile</span>
            </button>

            {/* Explicit Save */}
            <button
              onClick={handleManualSave}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className={`text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-sm ${
                exportingPdf
                  ? 'bg-emerald-700/60 cursor-not-allowed opacity-80'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              title="Download High-Fidelity A4 PDF containing user resume"
            >
              {exportingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </>
              )}
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title="Print Resume (A4 vector print)"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Send to Analyzer */}
            <button
              onClick={handleSendToAnalyzer}
              className="border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center space-x-1"
              title="Audit this resume in Resume Analyzer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Audit ATS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Studio Split-Screen Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: Section Navigation & Form Editor (no-print) */}
        <div className="no-print lg:col-span-6 space-y-6">
          {/* Section Navigation Tabs */}
          <div className="flex items-center space-x-1.5 bg-[var(--bg-card)] p-1.5 rounded-xl border border-[var(--border)] overflow-x-auto">
            {[
              { id: 'personal', label: 'Contact' },
              { id: 'summary', label: 'Summary' },
              { id: 'skills', label: 'Skills' },
              { id: 'experience', label: 'Experience' },
              { id: 'projects', label: 'Projects' },
              { id: 'education', label: 'Education' },
              { id: 'certifications', label: 'Credentials' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSection(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SECTION FORMS */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-6">
            {/* A. Personal Information */}
            {activeSection === 'personal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                      Personal Information & Recruiter Contact
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Accurate contact details are essential for recruiter callbacks and ATS parsing.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={content.personalInfo.fullName}
                      onChange={(e) =>
                        updateContent((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                        }))
                      }
                      placeholder="e.g. Johnathan Doe"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Professional Headline *
                    </label>
                    <input
                      type="text"
                      value={content.personalInfo.headline}
                      onChange={(e) =>
                        updateContent((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, headline: e.target.value }
                        }))
                      }
                      placeholder="e.g. Full Stack Engineer | Distributed Cloud Systems"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={content.personalInfo.email}
                      onChange={(e) =>
                        updateContent((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))
                      }
                      placeholder="john.doe@example.com"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={content.personalInfo.phone}
                      onChange={(e) =>
                        updateContent((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))
                      }
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      City, Country (Location)
                    </label>
                    <input
                      type="text"
                      value={content.personalInfo.cityCountry}
                      onChange={(e) =>
                        updateContent((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, cityCountry: e.target.value }
                        }))
                      }
                      placeholder="Seattle, WA, USA"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="text"
                      value={content.personalInfo.linkedIn}
                      onChange={(e) =>
                        updateContent((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, linkedIn: e.target.value }
                        }))
                      }
                      placeholder="linkedin.com/in/johndoe"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      GitHub Profile URL
                    </label>
                    <input
                      type="text"
                      value={content.personalInfo.github}
                      onChange={(e) =>
                        updateContent((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, github: e.target.value }
                        }))
                      }
                      placeholder="github.com/johndoe"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Portfolio / Personal Website
                    </label>
                    <input
                      type="text"
                      value={content.personalInfo.portfolioWebsite}
                      onChange={(e) =>
                        updateContent((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, portfolioWebsite: e.target.value }
                        }))
                      }
                      placeholder="johndoe.dev"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* B. Professional Summary */}
            {activeSection === 'summary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                      Professional Summary
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      A concise 2-4 sentence executive statement summarizing your expertise and core tech stack.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSummaryAiModal(true)}
                    className="border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI / Role Suggestions</span>
                  </button>
                </div>

                <div>
                  <textarea
                    rows={6}
                    value={content.summary}
                    onChange={(e) =>
                      updateContent((prev) => ({
                        ...prev,
                        summary: e.target.value
                      }))
                    }
                    placeholder="Results-driven Software Engineer with demonstrated experience in modern web architecture, scalable distributed backend systems, and automated test-driven development..."
                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] leading-relaxed resize-y"
                  />
                  <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono mt-1.5">
                    <span>Target: 30 - 90 words for optimal ATS parsing</span>
                    <span>
                      {content.summary.split(/\s+/).filter(Boolean).length} words • {content.summary.length} chars
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* C. Categorized Skills */}
            {activeSection === 'skills' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                      Categorized Skills Matrix
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Grouped technical competencies enable ATS semantic scanners to match specialized requirements.
                    </p>
                  </div>
                </div>

                {[
                  { key: 'programmingLanguages', label: 'Programming Languages', placeholder: 'Java, TypeScript, Python, C++, Go' },
                  { key: 'frameworks', label: 'Frameworks & Libraries', placeholder: 'Spring Boot, React, Node.js, Next.js, Express' },
                  { key: 'databases', label: 'Databases & Storage', placeholder: 'PostgreSQL, MongoDB, Redis, MySQL, DynamoDB' },
                  { key: 'toolsPlatforms', label: 'Tools, DevOps & Cloud', placeholder: 'Docker, AWS, Kubernetes, Git, GitHub Actions, Linux' },
                  { key: 'coreConcepts', label: 'Core Engineering Competencies', placeholder: 'REST APIs, Microservices, System Design, Data Structures' }
                ].map((group) => {
                  const currentSkills: string[] = (content.skills as any)[group.key] || [];

                  const addSkill = (val: string) => {
                    const trimmed = val.trim();
                    if (!trimmed || currentSkills.includes(trimmed)) return;
                    updateContent((prev) => ({
                      ...prev,
                      skills: {
                        ...prev.skills,
                        [group.key]: [...currentSkills, trimmed]
                      }
                    }));
                  };

                  const removeSkill = (index: number) => {
                    updateContent((prev) => ({
                      ...prev,
                      skills: {
                        ...prev.skills,
                        [group.key]: currentSkills.filter((_, i) => i !== index)
                      }
                    }));
                  };

                  return (
                    <div key={group.key} className="space-y-2 p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border)]">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[var(--text-primary)]">
                          {group.label}
                        </label>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {currentSkills.length} added
                        </span>
                      </div>

                      {/* Chips */}
                      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                        {currentSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20 px-2.5 py-0.5 rounded-md text-xs font-medium flex items-center space-x-1"
                          >
                            <span>{skill}</span>
                            <button
                              onClick={() => removeSkill(idx)}
                              className="hover:text-rose-400 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Input */}
                      <div className="flex space-x-2 pt-1">
                        <input
                          type="text"
                          placeholder={group.placeholder}
                          value={skillInputs[group.key] || ''}
                          onChange={(e) =>
                            setSkillInputs((prev) => ({ ...prev, [group.key]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill(skillInputs[group.key] || '');
                              setSkillInputs((prev) => ({ ...prev, [group.key]: '' }));
                            }
                          }}
                          className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                        />
                        <button
                          onClick={() => {
                            addSkill(skillInputs[group.key] || '');
                            setSkillInputs((prev) => ({ ...prev, [group.key]: '' }));
                          }}
                          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* D. Work Experience & Internships */}
            {activeSection === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                      Work Experience & Internships
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Start bullet points with active verbs and quantify outcomes with measurable metrics.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newExp: ResumeWorkExperience = {
                        id: Math.random().toString(),
                        jobTitle: '',
                        company: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        currentRole: false,
                        responsibilities: '',
                        achievements: '',
                        impact: '',
                        bullets: ['Spearheaded...']
                      };
                      updateContent((prev) => ({
                        ...prev,
                        experience: [newExp, ...prev.experience]
                      }));
                    }}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Role</span>
                  </button>
                </div>

                {/* List of Experience Cards */}
                <div className="space-y-4">
                  {content.experience.map((exp, expIdx) => (
                    <div
                      key={exp.id || expIdx}
                      className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          Position 0{expIdx + 1}
                        </span>
                        <button
                          onClick={() =>
                            updateContent((prev) => ({
                              ...prev,
                              experience: prev.experience.filter((_, i) => i !== expIdx)
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Job Title *
                          </label>
                          <input
                            type="text"
                            value={exp.jobTitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item, i) =>
                                  i === expIdx ? { ...item, jobTitle: val } : item
                                )
                              }));
                            }}
                            placeholder="e.g. Software Engineering Intern"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Company Name *
                          </label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item, i) =>
                                  i === expIdx ? { ...item, company: val } : item
                                )
                              }));
                            }}
                            placeholder="e.g. CloudScale Tech"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={exp.location}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item, i) =>
                                  i === expIdx ? { ...item, location: val } : item
                                )
                              }));
                            }}
                            placeholder="e.g. Remote / San Francisco, CA"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                              Start Date
                            </label>
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateContent((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((item, i) =>
                                    i === expIdx ? { ...item, startDate: val } : item
                                  )
                                }));
                              }}
                              placeholder="e.g. Jun 2024"
                              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                            />
                          </div>

                          <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                              End Date
                            </label>
                            <input
                              type="text"
                              disabled={exp.currentRole}
                              value={exp.currentRole ? 'Present' : exp.endDate}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateContent((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((item, i) =>
                                    i === expIdx ? { ...item, endDate: val } : item
                                  )
                                }));
                              }}
                              placeholder="e.g. Aug 2024"
                              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Current Role Toggle */}
                      <label className="flex items-center space-x-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exp.currentRole}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateContent((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item, i) =>
                                i === expIdx ? { ...item, currentRole: val } : item
                              )
                            }));
                          }}
                          className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-0"
                        />
                        <span>I currently work in this role</span>
                      </label>

                      {/* Bullet points */}
                      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                            Achievement Bullets
                          </label>
                          <button
                            onClick={() => {
                              updateContent((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item, i) =>
                                  i === expIdx ? { ...item, bullets: [...item.bullets, ''] } : item
                                )
                              }));
                            }}
                            className="text-[11px] text-[var(--primary)] font-semibold hover:underline flex items-center space-x-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Bullet</span>
                          </button>
                        </div>

                        {/* Action Verb Helper Chips */}
                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <span>Action Verbs:</span>
                          {ACTION_VERB_SUGGESTIONS.slice(0, 6).map((verb) => (
                            <button
                              key={verb}
                              type="button"
                              onClick={() => {
                                updateContent((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((item, i) => {
                                    if (i !== expIdx) return item;
                                    const currentBullets = [...item.bullets];
                                    if (currentBullets.length === 0) currentBullets.push('');
                                    const lastIdx = currentBullets.length - 1;
                                    currentBullets[lastIdx] = `${verb} ${currentBullets[lastIdx]}`.trim();
                                    return { ...item, bullets: currentBullets };
                                  })
                                }));
                              }}
                              className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] border border-[var(--border)] transition"
                            >
                              +{verb}
                            </button>
                          ))}
                        </div>

                        {exp.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start space-x-2">
                            <span className="text-[var(--text-muted)] text-xs mt-1.5">•</span>
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateContent((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((item, i) => {
                                    if (i !== expIdx) return item;
                                    const newBullets = [...item.bullets];
                                    newBullets[bIdx] = val;
                                    return { ...item, bullets: newBullets };
                                  })
                                }));
                              }}
                              placeholder="e.g. Architected REST microservices in Spring Boot, handling 15,000+ daily events."
                              className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                            />
                            {exp.bullets.length > 1 && (
                              <button
                                onClick={() => {
                                  updateContent((prev) => ({
                                    ...prev,
                                    experience: prev.experience.map((item, i) => {
                                      if (i !== expIdx) return item;
                                      return { ...item, bullets: item.bullets.filter((_, idx) => idx !== bIdx) };
                                    })
                                  }));
                                }}
                                className="text-slate-400 hover:text-rose-400 p-1"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* E. Projects */}
            {activeSection === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                      Technical Projects & Engineering Proof
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Showcase hands-on applications with technologies used, source code links, and measurable impact.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newProj: ResumeProject = {
                        id: Math.random().toString(),
                        title: '',
                        description: '',
                        technologies: [],
                        keyContributions: '',
                        resultsImpact: '',
                        githubUrl: '',
                        liveUrl: ''
                      };
                      updateContent((prev) => ({
                        ...prev,
                        projects: [newProj, ...prev.projects]
                      }));
                    }}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {content.projects.map((proj, pIdx) => (
                    <div
                      key={proj.id || pIdx}
                      className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          Project 0{pIdx + 1}
                        </span>
                        <button
                          onClick={() =>
                            updateContent((prev) => ({
                              ...prev,
                              projects: prev.projects.filter((_, i) => i !== pIdx)
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Project Title *
                          </label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                projects: prev.projects.map((p, i) => (i === pIdx ? { ...p, title: val } : p))
                              }));
                            }}
                            placeholder="e.g. Distributed Task Orchestrator"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Technologies (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={proj.technologies?.join(', ') || ''}
                            onChange={(e) => {
                              const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                              updateContent((prev) => ({
                                ...prev,
                                projects: prev.projects.map((p, i) => (i === pIdx ? { ...p, technologies: arr } : p))
                              }));
                            }}
                            placeholder="Java, Spring Boot, Redis, React, Docker"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            GitHub Repository URL
                          </label>
                          <input
                            type="text"
                            value={proj.githubUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                projects: prev.projects.map((p, i) => (i === pIdx ? { ...p, githubUrl: val } : p))
                              }));
                            }}
                            placeholder="https://github.com/..."
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Measurable Impact / Result
                          </label>
                          <input
                            type="text"
                            value={proj.resultsImpact}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                projects: prev.projects.map((p, i) => (i === pIdx ? { ...p, resultsImpact: val } : p))
                              }));
                            }}
                            placeholder="e.g. Achieved 99.9% uptime across 50,000 synthetic test events"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                          Project Description & Architecture
                        </label>
                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateContent((prev) => ({
                              ...prev,
                              projects: prev.projects.map((p, i) => (i === pIdx ? { ...p, description: val } : p))
                            }));
                          }}
                          placeholder="Real-time distributed job queuing system with worker pool and fault tolerance."
                          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-y"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* F. Education */}
            {activeSection === 'education' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                      Academic Background & Credentials
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Accredited degrees, college/university name, graduation years, and relevant coursework.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newEdu: ResumeEducation = {
                        id: Math.random().toString(),
                        institution: '',
                        degree: 'Bachelor of Technology',
                        fieldOfStudy: 'Computer Science',
                        startDate: '2021',
                        graduationDate: '2025',
                        gradeCgpa: '',
                        coursework: ''
                      };
                      updateContent((prev) => ({
                        ...prev,
                        education: [newEdu, ...prev.education]
                      }));
                    }}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Degree</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {content.education.map((edu, eIdx) => (
                    <div
                      key={edu.id || eIdx}
                      className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          Academic Entry 0{eIdx + 1}
                        </span>
                        <button
                          onClick={() =>
                            updateContent((prev) => ({
                              ...prev,
                              education: prev.education.filter((_, i) => i !== eIdx)
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Institution / University *
                          </label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                education: prev.education.map((item, i) => (i === eIdx ? { ...item, institution: val } : item))
                              }));
                            }}
                            placeholder="e.g. University Institute of Technology"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Degree *
                          </label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                education: prev.education.map((item, i) => (i === eIdx ? { ...item, degree: val } : item))
                              }));
                            }}
                            placeholder="e.g. Bachelor of Technology"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Field of Study / Major *
                          </label>
                          <input
                            type="text"
                            value={edu.fieldOfStudy}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                education: prev.education.map((item, i) => (i === eIdx ? { ...item, fieldOfStudy: val } : item))
                              }));
                            }}
                            placeholder="e.g. Computer Science & Engineering"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Grade / CGPA / Percentage
                          </label>
                          <input
                            type="text"
                            value={edu.gradeCgpa}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                education: prev.education.map((item, i) => (i === eIdx ? { ...item, gradeCgpa: val } : item))
                              }));
                            }}
                            placeholder="e.g. 3.85 / 4.0 or 88%"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Start Date
                          </label>
                          <input
                            type="text"
                            value={edu.startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                education: prev.education.map((item, i) => (i === eIdx ? { ...item, startDate: val } : item))
                              }));
                            }}
                            placeholder="2021"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Graduation Date *
                          </label>
                          <input
                            type="text"
                            value={edu.graduationDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                education: prev.education.map((item, i) => (i === eIdx ? { ...item, graduationDate: val } : item))
                              }));
                            }}
                            placeholder="2025"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                          Relevant Coursework
                        </label>
                        <input
                          type="text"
                          value={edu.coursework}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateContent((prev) => ({
                              ...prev,
                              education: prev.education.map((item, i) => (i === eIdx ? { ...item, coursework: val } : item))
                            }));
                          }}
                          placeholder="Data Structures, Distributed Systems, Database Management Systems, Cloud Computing"
                          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* G. Certifications & Honors */}
            {activeSection === 'certifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                      Certifications, Awards & Hackathons
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Third-party credentials and academic honors enhance qualification verification.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newCert: ResumeCertification = {
                        id: Math.random().toString(),
                        name: '',
                        issuingOrganization: '',
                        issueDate: '2024',
                        credentialUrl: '',
                        type: 'certification'
                      };
                      updateContent((prev) => ({
                        ...prev,
                        certifications: [newCert, ...prev.certifications]
                      }));
                    }}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Credential</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {content.certifications.map((c, cIdx) => (
                    <div
                      key={c.id || cIdx}
                      className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          Credential 0{cIdx + 1}
                        </span>
                        <button
                          onClick={() =>
                            updateContent((prev) => ({
                              ...prev,
                              certifications: prev.certifications.filter((_, i) => i !== cIdx)
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Certification or Award Name *
                          </label>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                certifications: prev.certifications.map((item, i) => (i === cIdx ? { ...item, name: val } : item))
                              }));
                            }}
                            placeholder="e.g. AWS Certified Solutions Architect"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Issuing Organization
                          </label>
                          <input
                            type="text"
                            value={c.issuingOrganization}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) => ({
                                ...prev,
                                certifications: prev.certifications.map((item, i) => (i === cIdx ? { ...item, issuingOrganization: val } : item))
                              }));
                            }}
                            placeholder="e.g. Amazon Web Services"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Live A4 Resume Preview */}
        <div className="lg:col-span-6 sticky top-20 space-y-3">
          {/* Preview Controls Bar (no-print) */}
          <div className="no-print bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-[var(--text-secondary)] shadow-sm">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-[var(--primary)]" />
              <span className="font-semibold text-[var(--text-primary)]">
                Live A4 Preview
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                ({currentTemplateObj.name})
              </span>
            </div>

            {/* Zoom Controls & Quick Export */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="p-1 px-2.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 transition font-medium text-[11px]"
                title="Download High-Fidelity A4 PDF"
              >
                {exportingPdf ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                ) : (
                  <Download className="w-3 h-3 text-emerald-400" />
                )}
                <span>PDF</span>
              </button>
              <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-1 rounded hover:bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] font-bold text-[var(--text-primary)] w-10 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="p-1 rounded hover:bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 rounded hover:bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition ml-1"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

          {/* Scaled A4 Document Viewport */}
          <div
            ref={previewContainerRef}
            className="w-full overflow-x-auto overflow-y-auto max-h-[82vh] p-4 bg-slate-950/40 rounded-2xl border border-[var(--border)] flex justify-center shadow-inner"
          >
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                width: '100%',
                maxWidth: '210mm'
              }}
              className="transition-transform duration-100 ease-out"
            >
              <div
                id="live-resume-document"
                className="relative shadow-2xl rounded-sm overflow-hidden bg-white resume-sheet"
              >
                {/* 1-Page Indicator Guide Line (297mm height boundary) */}
                <div
                  style={{ top: '297mm' }}
                  className="no-print absolute left-0 right-0 border-t-2 border-dashed border-rose-500/80 pointer-events-none z-10 flex items-center justify-end pr-2"
                >
                  <span className="bg-rose-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded -translate-y-1/2">
                    End of Page 1 (297mm A4 limit)
                  </span>
                </div>

                {/* Render Selected ATS Template */}
                <ResumePreviewRenderer
                  templateId={templateId}
                  content={content}
                  targetRole={targetRole}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Slide-out Panels */}
      <TemplateGalleryModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        activeTemplateId={templateId}
        onSelectTemplate={(newId) => {
          setTemplateId(newId);
          triggerAutosave(content, title, targetRole, newId);
        }}
      />

      <MyResumesModal
        isOpen={showMyResumesModal}
        onClose={() => setShowMyResumesModal(false)}
        resumes={resumes}
        activeResumeId={activeResume?.id || null}
        onSelectResume={handleSelectResume}
        onCreateNew={handleCreateNewResume}
        onDuplicate={handleDuplicate}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      <AtsCompatibilityPanel
        isOpen={showAtsPanel}
        onClose={() => setShowAtsPanel(false)}
        atsReport={atsReport}
        targetRole={targetRole}
        content={content}
        onApplyKeyword={(kw) => {
          // Add to programming languages or tools
          updateContent((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              toolsPlatforms: [...prev.skills.toolsPlatforms, kw]
            }
          }));
        }}
      />

      <AiSummaryHelperModal
        isOpen={showSummaryAiModal}
        onClose={() => setShowSummaryAiModal(false)}
        targetRole={targetRole}
        content={content}
        onApplySummary={(sug) => {
          updateContent((prev) => ({
            ...prev,
            summary: sug
          }));
        }}
      />

      {/* Import Profile Confirmation Modal */}
      {showImportProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-heading text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Import Career Profile Information</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImportProfileModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Importing your saved Career Navigator profile details will populate the following sections in this resume:
            </p>

            <ul className="text-xs text-slate-300 space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Personal Details:</strong> Name, Email, Phone, Location, LinkedIn, GitHub, Portfolio</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Education:</strong> Academic degrees, colleges, graduation years & scores</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Technical Skills:</strong> Categorized tools, languages, and frameworks</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Projects:</strong> Titles, descriptions, live demo links & accomplishments</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Certifications & Experience:</strong> Industry credentials and work records</span>
              </li>
            </ul>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300">
              <strong>Note:</strong> You can review and edit every single imported detail in the editor before saving or downloading your PDF. Existing content will be merged.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportProfileModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportProfileDetails}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Confirm Import</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
