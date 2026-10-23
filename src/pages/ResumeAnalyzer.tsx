import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Target,
  Briefcase,
  Layers,
  Award,
  ListFilter,
  Edit3
} from 'lucide-react';
import { ResumeAnalysis } from '../types.js';
import { api } from '../lib/api.js';
import { extractPdfTextFromArrayBuffer } from '../lib/pdfExtractor.js';
import { extractDocxTextFromArrayBuffer } from '../lib/docxExtractor.js';

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return extractPdfTextFromArrayBuffer(arrayBuffer);
}

export default function ResumeAnalyzer() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack Engineer');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [showDiagnosticText, setShowDiagnosticText] = useState(false);
  const analysisRequestIdRef = useRef<number>(0);

  const normalizeResumeAnalysis = (data: any): ResumeAnalysis => {
    let breakdownList: any[] = [];
    if (Array.isArray(data.categoryBreakdown)) {
      breakdownList = data.categoryBreakdown.map((item: any) => ({
        category: item.name || item.category || 'Category',
        name: item.name || item.category || 'Category',
        score: typeof item.score === 'number' ? Math.round(item.score * 10) / 10 : 0,
        maxScore: typeof item.maxScore === 'number' ? item.maxScore : (item.weight || 20),
        weight: typeof item.weight === 'number' ? item.weight : 20,
        reason: item.reason || ''
      }));
    } else if (data.categoryBreakdown && typeof data.categoryBreakdown === 'object') {
      const cb = data.categoryBreakdown;
      breakdownList = [
        { category: 'Technical Skills & Role Alignment', name: 'Technical Skills & Role Alignment', score: cb.skillsDensity ?? 0, maxScore: 25, weight: 25, reason: 'Evaluates required & preferred role skills.' },
        { category: 'Section Completeness', name: 'Section Completeness', score: cb.sectionCompleteness ?? 0, maxScore: 20, weight: 20, reason: 'Checks presence of essential resume sections.' },
        { category: 'Experience & Project Depth', name: 'Experience & Project Depth', score: cb.experienceDepth ?? 0, maxScore: 20, weight: 20, reason: 'Analyzes work history and technical project depth.' },
        { category: 'Quantified Impact & Metrics', name: 'Quantified Impact & Metrics', score: cb.quantifiedImpact ?? 0, maxScore: 15, weight: 15, reason: 'Assesses quantifiable metrics and measurable outcomes.' },
        { category: 'Contact Information', name: 'Contact Information', score: cb.contactInfo ?? 0, maxScore: 10, weight: 10, reason: 'Checks email, phone, and professional profile links.' },
        { category: 'Formatting & Readability', name: 'Formatting & Readability', score: cb.formattingReadability ?? 0, maxScore: 10, weight: 10, reason: 'Validates structure and optimal length.' }
      ];
    }

    return {
      ...data,
      skills: Array.isArray(data.skills) ? data.skills : [],
      missingSections: Array.isArray(data.missingSections) ? data.missingSections : [],
      detectedSections: Array.isArray(data.detectedSections) ? data.detectedSections : [],
      sectionDetails: Array.isArray(data.sectionDetails) ? data.sectionDetails : [],
      grammarIssues: Array.isArray(data.grammarIssues) ? data.grammarIssues : [],
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      matchedJDKeywords: Array.isArray(data.matchedJDKeywords) ? data.matchedJDKeywords : [],
      missingJDKeywords: Array.isArray(data.missingJDKeywords) ? data.missingJDKeywords : [],
      improvementsToAdd: Array.isArray(data.improvementsToAdd) ? data.improvementsToAdd : [],
      improvementsToRemove: Array.isArray(data.improvementsToRemove) ? data.improvementsToRemove : [],
      atsScore: typeof data.atsScore === 'number' ? data.atsScore : 0,
      categoryBreakdown: breakdownList
    };
  };

  useEffect(() => {
    // Fetch active resume evaluation on load
    api.get('/api/resume/my-analysis')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const raw = data.analysis !== undefined ? data.analysis : (data.atsScore !== undefined ? data : null);
        if (raw) {
          const normalized = normalizeResumeAnalysis(raw);
          setAnalysis(normalized);
          if (normalized.jobDescription) {
            setJobDescription(normalized.jobDescription);
          }
          if (normalized.targetRole) {
            setTargetRole(normalized.targetRole);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setAnalysis(null); // Clear previous analysis immediately

    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      // Read plain text directly
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setResumeText(text.trim());
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read file. Please paste your resume text manually.');
      };
      reader.readAsText(selectedFile);
    } else if (fileName.endsWith('.pdf')) {
      // Real PDF text extraction with local worker and stream fallback
      setExtractingPdf(true);
      try {
        const text = await extractPdfText(selectedFile);
        if (!text || text.trim().length < 25) {
          throw new Error('This PDF appears to be an image scan or empty. Please copy and paste your resume text below.');
        }
        setResumeText(text.trim());
        setError(null);
      } catch (err: any) {
        console.error('PDF extraction error:', err);
        setResumeText('');
        setError(err.message || 'Could not extract text from this PDF. Please copy and paste your resume text manually below.');
      } finally {
        setExtractingPdf(false);
      }
    } else if (fileName.endsWith('.docx')) {
      // DOCX OpenXML text extraction
      setExtractingPdf(true);
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const text = await extractDocxTextFromArrayBuffer(arrayBuffer);
        if (!text || text.trim().length < 25) {
          throw new Error('This DOCX document appears to be empty. Please copy and paste your resume text below.');
        }
        setResumeText(text.trim());
        setError(null);
      } catch (err: any) {
        console.error('DOCX extraction error:', err);
        setResumeText('');
        setError(err.message || 'Could not extract text from this DOCX file. Please copy and paste your resume text manually below.');
      } finally {
        setExtractingPdf(false);
      }
    } else {
      setError('Unsupported file format. Please upload a PDF, DOCX, TXT, or MD file.');
    }
  };

  const handleSubmitAnalysis = async () => {
    const cleaned = resumeText.trim();
    if (!cleaned || cleaned.length < 30 || cleaned.startsWith('[Could not extract') || cleaned.startsWith('[PDF contained')) {
      setError('Please upload a readable resume file or paste your resume text (minimum 30 characters) to analyze.');
      return;
    }

    const currentReqId = ++analysisRequestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const endpoint = jobDescription.trim() ? '/api/resume/upload-with-jd' : '/api/resume/upload';
      const payload: any = {
        fileName: file ? file.name : 'Pasted_Resume_Text.pdf',
        resumeText,
        targetRole: targetRole.trim() || undefined
      };
      if (jobDescription.trim()) {
        payload.jobDescription = jobDescription.trim();
      }

      const response = await api.post(endpoint, payload);

      if (currentReqId !== analysisRequestIdRef.current) {
        // Discard stale response
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to parse and evaluate resume.');
      }

      const data = await response.json();
      const raw = data.analysis !== undefined ? data.analysis : (data.atsScore !== undefined ? data : null);
      if (raw) {
        setAnalysis(normalizeResumeAnalysis(raw));
      } else {
        throw new Error('Analysis payload error.');
      }
    } catch (err: any) {
      if (currentReqId === analysisRequestIdRef.current) {
        console.error(err);
        setError(err.message || 'An error occurred during resume evaluation.');
      }
    } finally {
      if (currentReqId === analysisRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setResumeText('');
    setJobDescription('');
    setTargetRole('Full Stack Engineer');
    setAnalysis(null);
    setShowDiagnosticText(false);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-[var(--text-primary)]">
      {/* Introduction banner */}
      <div className="glass-panel bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-[var(--text-primary)] text-sm font-display">ATS Optimizer & Job Description Matcher</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Scan keyword density, compare against target job descriptions, detect layout inconsistencies, and generate actionable engineering improvements.
          </p>
        </div>
        <div className="flex space-x-2">
          {analysis && (
            <>
              <button
                type="button"
                onClick={() => setAnalysis(null)}
                className="text-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Resume & Re-Audit</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDiagnosticText(!showDiagnosticText)}
                className="text-xs border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold px-3 py-2 rounded-xl transition flex items-center space-x-1.5"
              >
                <FileText className="w-4 h-4 text-[var(--primary)]" />
                <span>{showDiagnosticText ? 'Hide Text' : 'View Extracted Text'}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scan New Resume</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Optional Extracted Text Diagnostic Drawer */}
      {analysis && showDiagnosticText && (
        <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--primary)]" />
              <span>Extracted Resume Content Preview ({analysis.wordCount || resumeText.split(/\s+/).length} words)</span>
            </span>
            {analysis.contentHash && (
              <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-base)] px-2 py-1 rounded border border-[var(--border)]">
                Content Hash: {analysis.contentHash}
              </span>
            )}
          </div>
          <pre className="p-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-[11px] font-mono text-[var(--text-secondary)] max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {resumeText || '[Text stored in database analysis]'}
          </pre>
        </div>
      )}

      {!analysis ? (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Upload Widget */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">1. Upload Document</h4>

              {/* Drag and Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                  dragActive ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                }`}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center space-y-2.5">
                  <div className="w-10 h-10 bg-[var(--bg-base)] text-[var(--text-muted)] flex items-center justify-center rounded-xl border border-[var(--border)]">
                    <Upload className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[var(--text-primary)] block">
                      {extractingPdf ? 'Extracting document text...' : file ? file.name : 'Select or drag & drop resume file'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
                      Supports PDF, DOCX, TXT, or MD formats (local zero-cloud extraction)
                    </span>
                  </div>
                </div>
              </div>

              {/* Text Area for manual text pasting */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">Resume Content</label>
                    {resumeText.trim().length > 30 && (
                      <span className="text-[10px] text-[var(--success)] font-mono font-semibold flex items-center gap-1 bg-[var(--success-soft)] px-2 py-0.5 rounded-full border border-[var(--success)]/20">
                        <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
                        <span>{resumeText.trim().split(/\s+/).length} words ready</span>
                      </span>
                    )}
                  </div>
                  {file && (
                    <button
                      onClick={() => { setFile(null); setResumeText(''); setError(null); }}
                      className="text-[10px] text-[var(--danger)] hover:underline font-bold cursor-pointer"
                    >
                      Clear File
                    </button>
                  )}
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste raw skills, projects, and work history here..."
                  className="w-full h-36 p-3 border border-[var(--border)] rounded-xl text-xs font-mono focus:outline-none focus:border-[var(--primary)] leading-relaxed bg-[var(--bg-base)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                />
              </div>

              {/* Target Engineering Role Selection */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>2. Target Engineering Role</span>
                  </label>
                  <span className="text-[9px] font-mono font-bold bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.5 rounded">
                    Role-Based Scoring
                  </span>
                </div>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs font-mono focus:outline-none focus:border-[var(--primary)] bg-[var(--bg-base)] text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="Full Stack Engineer">Full Stack Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Java Developer">Java Developer</option>
                  <option value="Python Developer">Python Developer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                  <option value="Data Scientist / AI/ML Engineer">Data Scientist / AI/ML Engineer</option>
                  <option value="Mobile App Developer">Mobile App Developer</option>
                  <option value="Cybersecurity Engineer">Cybersecurity Engineer</option>
                  <option value="Embedded Systems Engineer">Embedded Systems Engineer</option>
                  <option value="General Software Engineer">General Software Engineer</option>
                </select>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                  ATS score and keyword recommendations are dynamically calculated against this target engineering role.
                </p>
              </div>

              {/* Target Job Description Section (JD Matcher) */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center space-x-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>3. Target Job Description (Optional — Direct JD Matcher)</span>
                  </label>
                  <span className="text-[9px] font-mono font-bold bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.5 rounded">
                    JD Matcher
                  </span>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste requirements and responsibilities from a real job posting (e.g. Google, Amazon, Startup) to compute a direct match percentage and identify missing keywords..."
                  className="w-full h-32 p-3 border border-[var(--border)] rounded-xl text-xs font-mono focus:outline-none focus:border-[var(--primary)] leading-relaxed bg-[var(--bg-base)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                />
              </div>

              {error && (
                <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/30 rounded-lg text-[var(--danger)] text-xs flex items-center space-x-1.5 font-medium">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                id="run-ats-audit-btn"
                onClick={handleSubmitAnalysis}
                disabled={loading || extractingPdf}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Resume with Spring Boot ATS Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{jobDescription.trim() ? 'Run ATS & JD Match Audit' : 'Run General ATS Audit'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Guidelines Right Panel */}
          <div className="lg:col-span-5 glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
            <h4 className="font-bold text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">ATS & JD Placement Guidelines</h4>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[var(--text-primary)]">Target Job Keyword Alignment</h5>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Recruiting screeners prioritize candidates whose resume matches the specific tech stack in the job description.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[var(--text-primary)]">Avoid Over-Designed Layouts</h5>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Complex multi-column designs and icons frequently corrupt ATS parsers. Stick to clean, single-column semantic sections.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[var(--text-primary)]">Action Verbs & Quantitative Metrics</h5>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Start bullets with verbs (Engineered, Architected, Refactored) and back claims with measurable outcomes (e.g., 20% latency reduction).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ANALYSIS RESULTS RENDERING */
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Top Score Callout Left */}
          <div className="lg:col-span-4 space-y-6">
            {/* General ATS Score card */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 text-center space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-transparent -z-10" />

              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono tracking-wider">General ATS Score</span>
                {(analysis.targetRole || targetRole) && (
                  <span className="text-[10px] font-mono font-bold text-[var(--primary)] bg-[var(--primary-soft)] border border-[var(--primary)]/20 px-2.5 py-0.5 rounded-full">
                    Target: {analysis.targetRole || targetRole}
                  </span>
                )}
              </div>

              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id="atsScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#14B8A6" />
                    </linearGradient>
                  </defs>
                  <circle cx="72" cy="72" r="62" stroke="#1E293B" strokeWidth="8" fill="none" />
                  <circle
                    cx="72"
                    cy="72"
                    r="62"
                    stroke="url(#atsScoreGrad)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="390"
                    strokeDashoffset={390 - (390 * analysis.atsScore) / 100}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                </svg>
                <div className="text-center">
                  <span className="text-4xl font-extrabold text-[var(--text-primary)] font-mono block">{analysis.atsScore}</span>
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest block mt-0.5">ATS Index</span>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-[var(--text-primary)]">
                  {analysis.atsScore >= 85 ? 'Highly Optimistic Profile' : analysis.atsScore >= 70 ? 'Good – Needs Refinement' : 'Needs Optimization'}
                </h4>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {analysis.atsScore >= 85
                    ? 'Your resume is well-optimized for ATS systems. Minor tweaks can push it to perfection.'
                    : 'Follow the recommendations below to improve your ATS compatibility and reach 85+ ranking thresholds.'}
                </p>
              </div>

              {/* Category Breakdown (Deterministic weighted dimensions totaling 100%) */}
              {Array.isArray(analysis.categoryBreakdown) && analysis.categoryBreakdown.length > 0 && (
                <div className="pt-4 border-t border-[var(--border)] text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                      Category Breakdown (100% Weight)
                    </span>
                    <span className="text-[10px] font-mono text-[var(--primary)] font-bold">
                      {analysis.atsScore}/100
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {analysis.categoryBreakdown.map((cat: any, idx: number) => {
                      const catName = cat.name || cat.category || 'Category';
                      const max = cat.maxScore || cat.weight || 20;
                      const score = Math.round(cat.score ?? 0);
                      const pct = max > 0 ? Math.min(100, Math.max(0, (score / max) * 100)) : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-[var(--text-secondary)]">
                              {catName} ({cat.weight || max}%)
                            </span>
                            <span className="font-bold text-[var(--text-primary)]">
                              {score}/{max}
                            </span>
                          </div>
                          <div className="w-full bg-[var(--bg-base)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[var(--primary)] h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {cat.reason && (
                            <p className="text-[9px] text-[var(--text-muted)] italic font-mono leading-tight">
                              {cat.reason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Job Description Match Card (if analyzed with JD) */}
            {analysis.jdMatchScore !== undefined && (
              <div className="glass-card bg-[var(--bg-card)] rounded-3xl p-6 space-y-4 border border-[var(--border)] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--text-primary)] font-display">Target JD Match</span>
                  </div>
                  <span className="text-xl font-mono font-extrabold text-[var(--accent)]">
                    {analysis.jdMatchScore}%
                  </span>
                </div>

                <div className="w-full bg-[var(--bg-base)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[image:var(--gradient-brand)] h-full transition-all duration-500"
                    style={{ width: `${analysis.jdMatchScore}%` }}
                  />
                </div>

                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                  {analysis.jdMatchScore >= 80
                    ? '🎯 Outstanding fit! Your tech stack and experience align tightly with the target job posting.'
                    : analysis.jdMatchScore >= 60
                    ? 'Moderate match. Adding the missing keywords below will dramatically improve your screening chances.'
                    : 'Significant mismatch. Tailor your resume to incorporate the key competencies requested by this employer.'}
                </p>
              </div>
            )}

            {/* Section Detection Audit */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Resume Section Audit
                </h4>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  analysis.missingSections.length === 0
                    ? 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/30'
                    : 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30'
                }`}>
                  {analysis.missingSections.length === 0 ? '7/7 Present' : `${7 - analysis.missingSections.length}/7 Present`}
                </span>
              </div>

              {analysis.missingSections.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[var(--danger)] block">Missing Sections</span>
                  {analysis.missingSections.map((section, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-[var(--danger-soft)] p-2.5 rounded-xl border border-[var(--danger)]/30 text-xs text-[var(--danger)]">
                      <XCircle className="w-4 h-4 text-[var(--danger)] flex-shrink-0" />
                      <span>{section}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-[var(--success-soft)] p-2.5 rounded-xl border border-[var(--success)]/30 text-xs text-[var(--success)] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                  <span>All core sections detected</span>
                </div>
              )}

              {analysis.detectedSections && analysis.detectedSections.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] block">Detected Sections:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.detectedSections.map((sec, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-[var(--success-soft)] border border-[var(--success)]/30 text-[var(--success)] text-[10px] font-mono px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
                        <span>{sec}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Grammar warning */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">Layout & Grammar Audits</h4>
              {analysis.grammarIssues.length > 0 ? (
                <div className="space-y-3">
                  {analysis.grammarIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 bg-[var(--warning-soft)] p-2.5 rounded-xl border border-[var(--warning)]/30 text-xs text-[var(--warning)] leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-[var(--success-soft)] text-[var(--success)] text-xs p-3 rounded-xl border border-[var(--success)]/30">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No grammar or style errors detected!</span>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions & Keywords Right */}
          <div className="lg:col-span-8 space-y-6">
            {/* Target JD Keywords Comparison Panel */}
            {analysis.jdMatchScore !== undefined && (
              <div className="glass-card bg-[var(--bg-card)] rounded-2xl p-6 space-y-5 border border-[var(--border)]">
                <div className="border-b border-[var(--border)] pb-3 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-[var(--primary)]" />
                    <h4 className="font-bold text-[var(--text-primary)] text-sm font-display">Target Job Keyword Gap Analysis</h4>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--primary)] font-bold">JD Keyword Audit</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Matched JD Keywords */}
                  <div className="bg-[var(--success-soft)] border border-[var(--success)]/30 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--success)] flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                        <span>Matched in Resume</span>
                      </span>
                      <span className="text-[10px] font-mono text-[var(--success)] font-bold">
                        {analysis.matchedJDKeywords?.length || 0} Found
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.matchedJDKeywords && analysis.matchedJDKeywords.length > 0 ? (
                        analysis.matchedJDKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="bg-[var(--success)]/15 border border-[var(--success)]/30 text-[var(--success)] text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold"
                          >
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs italic">None detected</span>
                      )}
                    </div>
                  </div>

                  {/* Missing JD Keywords */}
                  <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/30 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--danger)] flex items-center space-x-1.5">
                        <XCircle className="w-3.5 h-3.5 text-[var(--danger)]" />
                        <span>Missing from Resume</span>
                      </span>
                      <span className="text-[10px] font-mono text-[var(--danger)] font-bold">
                        {analysis.missingJDKeywords?.length || 0} Missing
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missingJDKeywords && analysis.missingJDKeywords.length > 0 ? (
                        analysis.missingJDKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)] text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold"
                          >
                            + {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--success)] text-xs italic">All key JD skills matched!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actionable Suggestions */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
              <div className="border-b border-[var(--border)] pb-3 flex justify-between items-center">
                <h4 className="font-bold text-[var(--text-primary)] text-sm font-display">Actionable Placement Suggestions</h4>
                <span className="text-[10px] font-mono font-bold text-[var(--primary)] bg-[var(--primary-soft)] border border-[var(--primary)]/30 px-2 py-0.5 rounded-full">
                  AI Checklist
                </span>
              </div>

              <div className="space-y-3">
                {analysis.suggestions.map((sug, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs text-[var(--text-secondary)]">
                    <div className="w-5 h-5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center font-bold flex-shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="leading-relaxed">{sug}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword screening matches */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
              <div className="border-b border-[var(--border)] pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-[var(--text-primary)] text-sm font-display">Key Software Engineering Term Density</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    Token-boundary occurrence counts and density % based on normalized resume text.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-[var(--primary)] bg-[var(--primary-soft)] border border-[var(--primary)]/30 px-2.5 py-0.5 rounded-full">
                  {analysis.keywords.filter((k) => k.match || (k.count || 0) > 0).length} / {analysis.keywords.length} Found
                </span>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {analysis.keywords.map((kw, i) => {
                  const isMatched = kw.match || (kw.count && kw.count > 0);
                  const count = kw.count || (isMatched ? 1 : 0);
                  const density = kw.density !== undefined ? kw.density.toFixed(1) : undefined;

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition ${
                        isMatched
                          ? 'bg-[var(--success-soft)]/40 border-[var(--success)]/30'
                          : 'bg-[var(--bg-base)] border-[var(--border)] opacity-60'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-[var(--text-primary)]">{kw.keyword}</span>
                        {kw.relevance && (
                          <span className="text-[9px] text-[var(--text-muted)]">{kw.relevance}</span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isMatched
                            ? 'bg-[var(--success-soft)] border border-[var(--success)]/40 text-[var(--success)]'
                            : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                      >
                        {isMatched ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-[var(--success)] mr-1 inline" />
                            <span>{count}x {density !== undefined ? `(${density}%)` : ''}</span>
                          </>
                        ) : (
                          <span>Missing</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add / Remove categories */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-[var(--success-soft)] border border-[var(--success)]/30 rounded-2xl p-6 space-y-4">
                <h5 className="font-bold text-xs text-[var(--success)] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                  <span>Recommend to Include</span>
                </h5>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  {analysis.improvementsToAdd.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-[var(--success)] font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-2xl p-6 space-y-4">
                <h5 className="font-bold text-xs text-[var(--warning)] flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-[var(--warning)]" />
                  <span>Outdated/Remove Suggestions</span>
                </h5>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  {analysis.improvementsToRemove.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-[var(--warning)] font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
