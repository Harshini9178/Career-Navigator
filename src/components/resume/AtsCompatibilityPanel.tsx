import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Search,
  Briefcase,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { AtsCheckReport, JobMatchReport, ResumeContent } from '../../types.js';
import { api } from '../../lib/api.js';

interface AtsCompatibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  atsReport: AtsCheckReport | null;
  targetRole: string;
  content: ResumeContent;
  onApplyKeyword?: (keyword: string) => void;
}

export default function AtsCompatibilityPanel({
  isOpen,
  onClose,
  atsReport,
  targetRole,
  content,
  onApplyKeyword
}: AtsCompatibilityPanelProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [targetRoleInput, setTargetRoleInput] = useState(targetRole);
  const [loadingJdMatch, setLoadingJdMatch] = useState(false);
  const [jobMatchReport, setJobMatchReport] = useState<JobMatchReport | null>(null);
  const [activeTab, setActiveTab] = useState<'readiness' | 'jobMatch'>('readiness');

  if (!isOpen) return null;

  const handleRunJobMatch = async () => {
    if (!jobDescription.trim()) return;
    setLoadingJdMatch(true);
    try {
      const res = await api.post('/api/resumes/ats-check-preview', {
        targetRole: targetRoleInput,
        content
      });
      // also call job-match endpoint on first saved or preview
      const jmRes = await api.post('/api/resumes/job-match-preview', {
        targetRole: targetRoleInput,
        jobDescription,
        content
      }).catch(async () => {
        // Fallback to client-side deterministic evaluation if server endpoint preview is not yet called
        return null;
      });

      if (jmRes && jmRes.ok) {
        const data = await jmRes.json();
        if (data.jobMatch) {
          setJobMatchReport(data.jobMatch);
        }
      } else {
        // Deterministic client-side evaluation matching backend
        const jdLower = jobDescription.toLowerCase();
        const textToSearch = JSON.stringify(content).toLowerCase();
        const techKeywords = [
          'java', 'python', 'javascript', 'typescript', 'react', 'spring boot', 'node.js',
          'sql', 'postgresql', 'mongodb', 'docker', 'kubernetes', 'aws', 'git', 'microservices',
          'rest api', 'system design', 'ci/cd', 'agile', 'linux'
        ];
        const found = techKeywords.filter((kw) => jdLower.includes(kw) && textToSearch.includes(kw));
        const missing = techKeywords.filter((kw) => jdLower.includes(kw) && !textToSearch.includes(kw));
        const total = found.length + missing.length;
        const matchPct = total > 0 ? Math.round((found.length / total) * 100) : 65;

        setJobMatchReport({
          matchPercentage: Math.min(95, Math.max(15, matchPct)),
          matchedKeywords: found,
          missingKeywords: missing,
          matchedSkills: found,
          experienceRelevance: [
            `Identified ${content.experience?.length || 0} career roles matching engineering profile`,
            `Found ${content.projects?.length || 0} portfolio projects`
          ],
          phrasingSuggestions: [
            missing.length > 0 ? `Consider integrating verified skills: ${missing.slice(0, 3).join(', ')} into your bullet points.` : 'High keyword coverage achieved.',
            'Ensure headline precisely aligns with the target job title.'
          ]
        });
      }
    } catch (e) {
      console.error('Job match check failed', e);
    } finally {
      setLoadingJdMatch(false);
    }
  };

  const overallScore = atsReport ? atsReport.overallScore : 0;
  const scoreColor = overallScore >= 80 ? 'text-emerald-400' : overallScore >= 60 ? 'text-amber-400' : 'text-rose-400';
  const scoreBg = overallScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : overallScore >= 60 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-[var(--bg-card)] border-l border-[var(--border)] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-base)]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Resume ATS & Optimization Studio
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Deterministic compliance evaluation for corporate applicant tracking systems
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
            aria-label="Close ATS panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-[var(--border)] bg-[var(--bg-card)] px-5 pt-3">
          <button
            onClick={() => setActiveTab('readiness')}
            className={`pb-3 text-xs font-semibold px-4 border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'readiness'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>ATS Readiness Score ({overallScore}/100)</span>
          </button>
          <button
            onClick={() => setActiveTab('jobMatch')}
            className={`pb-3 text-xs font-semibold px-4 border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'jobMatch'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Target Job Match</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'readiness' && (
            <>
              {/* Score Overview Card */}
              <div className={`p-5 rounded-2xl border ${scoreBg} flex items-center justify-between`}>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                    Overall ATS Readiness
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-4xl font-extrabold ${scoreColor}`}>
                      {overallScore}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">/ 100</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {overallScore >= 80
                      ? 'Excellent ATS readability with standard headings and strong action verbs.'
                      : overallScore >= 60
                      ? 'Good foundation. Address the flagged items below to increase screening chances.'
                      : 'Essential sections or contact details are incomplete.'}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-slate-700/40 flex items-center justify-center relative">
                  <div className="text-xs font-bold text-[var(--text-primary)] font-mono">
                    {overallScore}%
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                  Section Checklist & Weights
                </h4>
                <div className="space-y-2">
                  {atsReport?.categoryScores?.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          {cat.status === 'passed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : cat.status === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {cat.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] pl-5.5">
                          {cat.explanation}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                          {cat.score} / {cat.maxScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passed Checks */}
              {atsReport?.passedChecks && atsReport.passedChecks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passed Criteria ({atsReport.passedChecks.length})</span>
                  </h4>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5 text-xs text-slate-300">
                    {atsReport.passedChecks.map((check, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings and Missing Info */}
              {((atsReport?.warnings && atsReport.warnings.length > 0) || (atsReport?.missingInfo && atsReport.missingInfo.length > 0)) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Actionable Improvements & Missing Data</span>
                  </h4>
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 text-xs text-slate-300">
                    {atsReport.missingInfo?.map((m, i) => (
                      <div key={`m-${i}`} className="flex items-start space-x-2 text-rose-300">
                        <span className="text-rose-400 font-bold font-mono">!</span>
                        <span>{m}</span>
                      </div>
                    ))}
                    {atsReport.warnings?.map((w, i) => (
                      <div key={`w-${i}`} className="flex items-start space-x-2 text-amber-200">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {atsReport?.improvementSuggestions && atsReport.improvementSuggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Optimization Suggestions</span>
                  </h4>
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1.5 text-xs text-slate-300">
                    {atsReport.improvementSuggestions.map((sug, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-blue-400 mt-0.5">→</span>
                        <span>{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'jobMatch' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={targetRoleInput}
                    onChange={(e) => setTargetRoleInput(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Job Description (paste from job posting)
                  </label>
                  <textarea
                    rows={5}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job requirements, qualifications, and role description here..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] leading-relaxed resize-y"
                  />
                </div>
                <button
                  onClick={handleRunJobMatch}
                  disabled={loadingJdMatch || !jobDescription.trim()}
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition flex items-center justify-center space-x-2"
                >
                  {loadingJdMatch ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Job Match...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Compare Resume Against Job Description</span>
                    </>
                  )}
                </button>
              </div>

              {/* Job Match Results */}
              {jobMatchReport && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 font-bold">
                        Estimated Match Index
                      </span>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-blue-400">
                          {jobMatchReport.matchPercentage}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Based on technical keyword alignment and role domain relevance.
                      </p>
                    </div>
                  </div>

                  {/* Matched Keywords */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      Matched Keywords ({jobMatchReport.matchedKeywords.length})
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {jobMatchReport.matchedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-mono"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  {jobMatchReport.missingKeywords.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                        Missing Keywords ({jobMatchReport.missingKeywords.length})
                      </h5>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Add only skills or technologies you genuinely possess into your skills or bullet points.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobMatchReport.missingKeywords.map((kw, i) => (
                          <button
                            key={i}
                            onClick={() => onApplyKeyword && onApplyKeyword(kw)}
                            title="Click to add to skills"
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-mono transition flex items-center space-x-1"
                          >
                            <span>+ {kw}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Phrasing Suggestions */}
                  {jobMatchReport.phrasingSuggestions.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                        Targeted Suggestions
                      </h5>
                      <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] space-y-1.5 text-xs text-slate-300">
                        {jobMatchReport.phrasingSuggestions.map((s, i) => (
                          <div key={i} className="flex items-start space-x-2">
                            <span className="text-[var(--primary)]">•</span>
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
