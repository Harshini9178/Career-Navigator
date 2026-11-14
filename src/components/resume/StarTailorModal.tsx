import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Target,
  Layers,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Plus,
  ArrowRight,
  TrendingUp,
  Brain,
  ShieldCheck,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { JdStarTailoringResult, StarBulletRewrite, ResumeContent } from '../../types.js';
import { api } from '../../lib/api.js';

interface StarTailorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeContent: ResumeContent;
  targetRole: string;
  onApplyBullet: (bullet: string, destination: 'project' | 'experience') => void;
  onApplySummary: (summary: string) => void;
}

const PRESET_JDS = [
  {
    label: 'Google SDE (Backend / Java)',
    role: 'Software Engineer (Backend)',
    company: 'Google',
    jd: `Requirements:
- 2+ years designing and implementing scalable backend microservices in Java or Go.
- Strong proficiency in relational database architecture (PostgreSQL / MySQL) and Redis caching layers.
- Experience with Docker containerization, RESTful API design, and distributed systems.
- Familiarity with CI/CD automation, unit testing (JUnit), and cloud infrastructure (GCP / AWS).`
  },
  {
    label: 'Amazon Cloud & DevOps (AWS / K8s)',
    role: 'DevOps / Cloud Engineer',
    company: 'Amazon Web Services',
    jd: `Responsibilities:
- Build and operate container orchestration infrastructure using Kubernetes and Docker on AWS.
- Automate multi-stage CI/CD deployment pipelines using GitHub Actions or Jenkins.
- Implement telemetry and alerting with Prometheus, Grafana, and AWS CloudWatch.
- Optimize infrastructure costs, secure IAM access, and guarantee 99.99% high availability.`
  },
  {
    label: 'Meta Full Stack (React / TypeScript)',
    role: 'Full Stack Engineer',
    company: 'Meta',
    jd: `Qualifications:
- Solid experience architecting responsive, accessible single-page web applications with React 19, TypeScript, and modern CSS frameworks (Tailwind).
- Backend proficiency building RESTful or GraphQL APIs with Node.js, Express, or Python.
- Proven track record optimizing web performance (Lighthouse scores, code-splitting, rendering latency).
- Experience with test-driven development (Vitest, Jest) and end-to-end testing.`
  }
];

export default function StarTailorModal({
  isOpen,
  onClose,
  resumeContent,
  targetRole: initialRole,
  onApplyBullet,
  onApplySummary
}: StarTailorModalProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [role, setRole] = useState(initialRole || 'Full Stack Engineer');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JdStarTailoringResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedBullets, setAppliedBullets] = useState<Record<string, string>>({});
  const [summaryApplied, setSummaryApplied] = useState(false);

  if (!isOpen) return null;

  const handleRunTailoring = async () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setError('Please paste at least 20 characters of a Job Description to analyze keyword gaps and formulate STAR bullets.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/api/resume/tailor-star', {
        jobDescription: jobDescription.trim(),
        resumeContent,
        targetRole: role.trim() || initialRole
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `HTTP ${response.status} returned`);
      }

      const data = await response.json();
      if (data.result) {
        setResult(data.result);
      } else {
        throw new Error('Unexpected response format from tailoring service.');
      }
    } catch (err: any) {
      console.error('STAR Tailoring failed:', err);
      setError(err.message || 'Failed to tailor resume to Job Description. Please check connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (bullet: string, id: string, dest: 'project' | 'experience') => {
    onApplyBullet(bullet, dest);
    setAppliedBullets((prev) => ({ ...prev, [id]: dest }));
  };

  const handleApplySummaryText = (sum: string) => {
    onApplySummary(sum);
    setSummaryApplied(true);
    setTimeout(() => setSummaryApplied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-extrabold text-base sm:text-lg">
                Automated Job-Specific Resume Tailoring (STAR Method)
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Analyze keyword gaps against any employer's Job Description and bridge ATS filters with high-impact STAR accomplishments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Input & Form Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase font-mono mb-1">
                  Target Job Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Backend Software Engineer"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase font-mono mb-1">
                  Target Employer (Optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Amazon, Stripe"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono block">
                Quick-Fill Target JD Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_JDS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setJobDescription(preset.jd);
                      setRole(preset.role);
                      setCompany(preset.company);
                    }}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-emerald-500/40 hover:text-emerald-400 transition"
                  >
                    ⚡ {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase font-mono">
                Paste Employer Job Description (JD) *
              </label>
              <textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job posting requirements, technical qualifications, and daily responsibilities..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 font-mono leading-relaxed resize-y"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRunTailoring}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Keyword Gaps & Formulating STAR Bullets...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Keyword Gaps & Generate STAR Rewrites</span>
                </>
              )}
            </button>
          </div>

          {/* RESULTS VIEW */}
          {result && (
            <div className="space-y-6 pt-2">
              {/* Top Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-[var(--text-muted)]">
                    Target JD Match
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {result.matchScore}%
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    {result.matchScore >= 80 ? '🎯 Exceptional Alignment' : '⚡ Strong Potential with STAR Gaps'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-emerald-400">
                    Matched JD Keywords
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-300">
                    {result.matchedKeywords.length}
                  </div>
                  <p className="text-[10px] text-emerald-300/80">Found in current resume</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-amber-400">
                    Gaps Bridged by STAR
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-300">
                    {result.missingKeywords.length}
                  </div>
                  <p className="text-[10px] text-amber-300/80">Target skills incorporated below</p>
                </div>
              </div>

              {/* Keyword Comparison Bar */}
              <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold flex items-center space-x-1.5 text-[var(--text-primary)]">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Keyword Gap Telemetry</span>
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    ATS Index Analysis
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {result.matchedKeywords.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Matched in Resume:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.matchedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.missingKeywords.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>Crucial Missing JD Skills (Targeted in STAR Bullets):</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300"
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* STAR Formula Guide Pill */}
              <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[10px] font-bold uppercase font-mono text-emerald-400">
                  STAR Formula Applied:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[var(--text-secondary)]">
                  <span className="px-2 py-0.5 bg-[var(--bg-card)] rounded border border-[var(--border)] font-bold text-[var(--primary)]">
                    [S] Situation
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 bg-[var(--bg-card)] rounded border border-[var(--border)] font-bold text-[var(--accent)]">
                    [T] Task
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 bg-[var(--bg-card)] rounded border border-[var(--border)] font-bold text-emerald-400">
                    [A] Action Verb
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 bg-[var(--bg-card)] rounded border border-[var(--border)] font-bold text-amber-400">
                    [R] Quantifiable Result
                  </span>
                </div>
              </div>

              {/* Generated STAR Bullets List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    Generated STAR-Method Accomplishments
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {result.tailoredBullets.length} Tailored Bullets
                  </span>
                </div>

                <div className="space-y-3.5">
                  {result.tailoredBullets.map((bullet) => (
                    <div
                      key={bullet.id}
                      className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] hover:border-emerald-500/40 transition space-y-3 shadow-sm"
                    >
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--primary-soft)] border border-[var(--primary)]/30 text-[var(--primary)]">
                            Verb: {bullet.actionVerb}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            Impact: {bullet.impactScore || 95}/100
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {bullet.keywordsCovered.slice(0, 3).map((kw, i) => (
                            <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)]">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Main STAR Bullet */}
                      <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                        • {bullet.starBullet}
                      </p>

                      {/* STAR Framework Breakdown Pills */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-[var(--text-secondary)] font-mono">
                        <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-0.5">
                          <span className="text-[9px] font-bold text-[var(--primary)] block uppercase">Situation & Task:</span>
                          <p className="line-clamp-2">{bullet.situation} — {bullet.task}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-0.5">
                          <span className="text-[9px] font-bold text-amber-400 block uppercase">Quantifiable Result:</span>
                          <p className="line-clamp-2 font-semibold text-emerald-300">{bullet.resultMetric}</p>
                        </div>
                      </div>

                      {/* Actions Toolbar */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-[var(--border)]/60">
                        <button
                          type="button"
                          onClick={() => handleCopy(bullet.starBullet, bullet.id)}
                          className="px-2.5 py-1 text-[11px] rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center space-x-1"
                        >
                          {copiedId === bullet.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApply(bullet.starBullet, bullet.id, 'project')}
                          className="px-3 py-1 text-[11px] font-bold rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition flex items-center space-x-1"
                        >
                          {appliedBullets[bullet.id] === 'project' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Added to Project</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>+ Add to Project</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApply(bullet.starBullet, bullet.id, 'experience')}
                          className="px-3 py-1 text-[11px] font-bold rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] transition flex items-center space-x-1"
                        >
                          {appliedBullets[bullet.id] === 'experience' ? (
                            <>
                              <Check className="w-3 h-3 text-[var(--primary)]" />
                              <span>Added to Role</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>+ Add to Role</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tailored Professional Summary Card */}
              {result.tailoredSummary && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
                      <Brain className="w-4 h-4 text-emerald-400" />
                      <span>Job-Tailored Executive Summary</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplySummaryText(result.tailoredSummary!)}
                      className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1 shadow"
                    >
                      {summaryApplied ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Applied to Summary!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Apply to Resume Summary</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] font-medium">
                    {result.tailoredSummary}
                  </p>
                </div>
              )}

              {/* ATS Insights footer */}
              {result.atsFilterInsights && (
                <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] space-y-2">
                  <span className="text-[10px] font-bold uppercase font-mono text-[var(--text-muted)] flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ATS Parser Compatibility Guidelines</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {result.atsFilterInsights.map((insight, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[10px] space-y-0.5">
                        <span className="font-bold text-emerald-400 font-mono">{insight.atsSystem} ATS:</span>
                        <p className="text-[var(--text-secondary)] leading-snug">{insight.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] flex justify-between items-center">
          <p className="text-[10px] text-[var(--text-muted)] font-mono">
            STAR Method ensures measurable verification for Workday, Greenhouse & Taleo ATS screening.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-primary)] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
