import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Brain,
  Timer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Flag,
  ShieldAlert,
  Sparkles,
  Calculator,
  Lightbulb,
  BookOpen,
  Cpu,
  BarChart3,
  RotateCcw,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Award,
  Layers,
  History,
  Info
} from 'lucide-react';
import {
  User,
  AptitudeAttempt,
  AptitudeResult,
  AptitudeHistoryItem,
  AptitudeCategoryMeta
} from '../types.js';
import { api, formatApiError } from '../lib/api.js';
import { sound } from '../lib/sound.js';

interface AptitudeAssessmentProps {
  user: User;
  onNavigate?: (view: string) => void;
}

type Phase = 'lobby' | 'exam' | 'result';

export default function AptitudeAssessment({ user, onNavigate }: AptitudeAssessmentProps) {
  // Global phase state
  const [phase, setPhase] = useState<Phase>('lobby');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lobby state
  const [categories, setCategories] = useState<AptitudeCategoryMeta[]>([]);
  const [history, setHistory] = useState<AptitudeHistoryItem[]>([]);

  // Exam state
  const [attempt, setAttempt] = useState<AptitudeAttempt | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1800);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [violationsCount, setViolationsCount] = useState<number>(0);
  const [showViolationModal, setShowViolationModal] = useState<boolean>(false);
  const [lastViolationMsg, setLastViolationMsg] = useState<string>('');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Result state
  const [result, setResult] = useState<AptitudeResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState<string>('all');

  const examContainerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<any>(null);

  // ==========================================
  // Category Icons & Helpers
  // ==========================================
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Quantitative Aptitude':
        return <Calculator className="w-5 h-5 text-blue-400" />;
      case 'Logical Reasoning':
        return <Lightbulb className="w-5 h-5 text-amber-400" />;
      case 'Verbal Ability':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'Technical Aptitude':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'Data Interpretation & Analytical Reasoning':
        return <BarChart3 className="w-5 h-5 text-purple-400" />;
      default:
        return <Brain className="w-5 h-5 text-indigo-400" />;
    }
  };

  // ==========================================
  // Lobby Data Fetching
  // ==========================================
  const fetchLobbyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, histRes] = await Promise.all([
        api.get('/api/aptitude/categories'),
        api.get('/api/aptitude/history')
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.history || []);
      }
    } catch (err: any) {
      console.error('Failed to load aptitude lobby data:', err);
      setError(formatApiError(err, 'Failed to connect to the Aptitude Assessment service.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLobbyData();
  }, [fetchLobbyData]);

  // ==========================================
  // Fullscreen Management
  // ==========================================
  const enterFullscreen = async () => {
    try {
      const elem = examContainerRef.current || document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn('Fullscreen entry declined or unsupported:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Fullscreen exit failed:', err);
    }
  };

  // ==========================================
  // Attempt Lifecycle: Start / Resume / Submit
  // ==========================================
  const handleStartAssessment = async (isNew: boolean = false) => {
    sound.playClick(800);
    setLoading(true);
    setError(null);
    try {
      const endpoint = isNew ? '/api/aptitude/attempts/new' : '/api/aptitude/attempts';
      const res = await api.post(endpoint);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize assessment');
      }

      const activeAttempt: AptitudeAttempt = data.attempt;
      setAttempt(activeAttempt);
      setRemainingSeconds(activeAttempt.remainingSeconds > 0 ? activeAttempt.remainingSeconds : 1800);
      setViolationsCount(activeAttempt.violationsCount || 0);
      setCurrentIdx(0);
      setPhase('exam');

      // Attempt entering fullscreen automatically
      setTimeout(() => {
        enterFullscreen();
      }, 300);
    } catch (err: any) {
      console.error('Error starting assessment:', err);
      setError(formatApiError(err, 'Unable to initiate test session.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFinishAndSubmit = async (forcedReason?: string) => {
    if (!attempt) return;
    setIsSubmitting(true);
    sound.playChime();

    try {
      const res = await api.post(`/api/aptitude/attempts/${attempt.id}/submit`, {
        forcedReason: forcedReason || null
      });
      const data = await res.json();

      if (res.ok && data.result) {
        setResult(data.result);
        setPhase('result');
        setShowSubmitModal(false);
        exitFullscreen();
        fetchLobbyData(); // refresh history
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err: any) {
      console.error('Failed to submit attempt:', err);
      alert('Error submitting assessment: ' + formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPastResult = async (attemptId: string) => {
    sound.playClick(900);
    setLoading(true);
    try {
      const res = await api.get(`/api/aptitude/attempts/${attemptId}/result`);
      const data = await res.json();
      if (res.ok && data.result) {
        setResult(data.result);
        setPhase('result');
      } else {
        alert(data.error || 'Failed to fetch test results');
      }
    } catch (err) {
      alert('Error loading past results');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Answers & Palette Actions
  // ==========================================
  const handleSelectOption = async (optionIndex: number) => {
    if (!attempt) return;
    const currentQ = attempt.questions[currentIdx];
    if (!currentQ) return;

    sound.playClick(1000);

    // Optimistic UI update
    const updatedAnswers = { ...attempt.answers, [currentQ.id]: optionIndex };
    setAttempt({
      ...attempt,
      answers: updatedAnswers,
      answeredCount: Object.keys(updatedAnswers).length
    });

    try {
      const isMarked = attempt.markedForReview.includes(currentQ.id);
      await api.put(`/api/aptitude/attempts/${attempt.id}/answers/${currentQ.id}`, {
        selectedOption: optionIndex,
        markedForReview: isMarked
      });
    } catch (err) {
      console.error('Failed to sync answer:', err);
    }
  };

  const handleClearOption = async () => {
    if (!attempt) return;
    const currentQ = attempt.questions[currentIdx];
    if (!currentQ) return;

    sound.playClick(700);

    const updatedAnswers = { ...attempt.answers };
    delete updatedAnswers[currentQ.id];

    setAttempt({
      ...attempt,
      answers: updatedAnswers,
      answeredCount: Object.keys(updatedAnswers).length
    });

    try {
      const isMarked = attempt.markedForReview.includes(currentQ.id);
      await api.put(`/api/aptitude/attempts/${attempt.id}/answers/${currentQ.id}`, {
        selectedOption: null,
        markedForReview: isMarked
      });
    } catch (err) {
      console.error('Failed to clear answer:', err);
    }
  };

  const handleToggleMarkForReview = async () => {
    if (!attempt) return;
    const currentQ = attempt.questions[currentIdx];
    if (!currentQ) return;

    sound.playClick(900);

    const isMarked = attempt.markedForReview.includes(currentQ.id);
    let updatedMarked: string[];

    if (isMarked) {
      updatedMarked = attempt.markedForReview.filter((id) => id !== currentQ.id);
    } else {
      updatedMarked = [...attempt.markedForReview, currentQ.id];
    }

    setAttempt({
      ...attempt,
      markedForReview: updatedMarked,
      markedCount: updatedMarked.length
    });

    try {
      const selected = attempt.answers[currentQ.id] !== undefined ? attempt.answers[currentQ.id] : null;
      await api.put(`/api/aptitude/attempts/${attempt.id}/answers/${currentQ.id}`, {
        selectedOption: selected,
        markedForReview: !isMarked
      });
    } catch (err) {
      console.error('Failed to toggle mark for review:', err);
    }
  };

  // ==========================================
  // Timer & Deadline Sync
  // ==========================================
  useEffect(() => {
    if (phase !== 'exam' || !attempt) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleFinishAndSubmit('Time limit expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase, attempt]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // Anti-Cheating & Proctoring Integrity Handlers
  // ==========================================
  const handleSecurityViolation = useCallback(
    async (eventType: string) => {
      if (phase !== 'exam' || !attempt) return;

      sound.playWarning();
      const newCount = violationsCount + 1;
      setViolationsCount(newCount);
      setLastViolationMsg(
        eventType === 'TAB_SWITCH'
          ? 'Window blur or browser tab switch detected.'
          : 'Fullscreen mode was exited.'
      );
      setShowViolationModal(true);

      try {
        const res = await api.post(`/api/aptitude/attempts/${attempt.id}/violations`, {
          eventType
        });
        const data = await res.json();

        if (data.terminated) {
          setShowViolationModal(false);
          alert('Security Alert: Test terminated due to exceeding proctoring violation limit (3 violations).');
          handleFinishAndSubmit('Proctoring violation limit reached (3 departures)');
        }
      } catch (err) {
        console.error('Failed to log violation:', err);
      }
    },
    [phase, attempt, violationsCount]
  );

  useEffect(() => {
    if (phase !== 'exam') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSecurityViolation('TAB_SWITCH');
      }
    };

    const handleWindowBlur = () => {
      // Window lost focus
      handleSecurityViolation('TAB_SWITCH');
    };

    const handleFullscreenChange = () => {
      const fsElem =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement;
      setIsFullscreen(!!fsElem);
      if (!fsElem && phase === 'exam') {
        handleSecurityViolation('EXIT_FULLSCREEN');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [phase, handleSecurityViolation]);

  // ==========================================
  // Keyboard Navigation (1-4 or A-D, Arrows)
  // ==========================================
  useEffect(() => {
    if (phase !== 'exam' || !attempt) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowRight' && currentIdx < attempt.questions.length - 1) {
        setCurrentIdx((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
        setCurrentIdx((i) => i - 1);
      } else if (['a', 'A', '1'].includes(e.key)) {
        handleSelectOption(0);
      } else if (['b', 'B', '2'].includes(e.key)) {
        handleSelectOption(1);
      } else if (['c', 'C', '3'].includes(e.key)) {
        handleSelectOption(2);
      } else if (['d', 'D', '4'].includes(e.key)) {
        handleSelectOption(3);
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMarkForReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, attempt, currentIdx]);

  // ==========================================
  // RENDER: Loading Spinner
  // ==========================================
  if (loading && !attempt && !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-slate-100">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-400 font-mono">
          Loading Aptitude Assessment Center...
        </p>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: LOBBY & INSTRUCTIONS
  // ==========================================
  if (phase === 'lobby') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 font-sans">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0F172A] via-[#0B1120] to-[#070B14] p-8 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold tracking-wide">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Standardized Technical & Reasoning Assessment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Aptitude Assessment Center
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Benchmark your logical, mathematical, verbal, technical, and data interpretation competencies under
              rigorous, full-screen, server-timed examination conditions.
            </p>
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleStartAssessment(false)}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition transform active:scale-95 cursor-pointer"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleStartAssessment(true)}
                className="px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>New Question Set</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Exam Specifications & Rules Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/70 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono uppercase">Structure</span>
              <h4 className="text-base font-bold text-white mt-0.5">30 Questions</h4>
              <p className="text-[11px] text-slate-400 mt-1">6 questions across 5 core competency sections.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/70 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono uppercase">Duration</span>
              <h4 className="text-base font-bold text-white mt-0.5">30 Minutes</h4>
              <p className="text-[11px] text-slate-400 mt-1">1 minute per question average pacing target.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/70 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono uppercase">Integrity</span>
              <h4 className="text-base font-bold text-white mt-0.5">Proctored Mode</h4>
              <p className="text-[11px] text-slate-400 mt-1">Fullscreen lock; max 3 departures/tab switches.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/70 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono uppercase">Scoring</span>
              <h4 className="text-base font-bold text-white mt-0.5">Full Solutions</h4>
              <p className="text-[11px] text-slate-400 mt-1">Detailed mathematical explanations post-submission.</p>
            </div>
          </div>
        </div>

        {/* 5 Core Assessment Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span>Assessment Domain Breakdown</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Total Bank: 75 Verified Problems</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/80 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {getCategoryIcon(cat.name)}
                    </div>
                    <span className="text-sm font-bold text-white">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    6 Qs / test
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{cat.description}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Pool: {cat.totalInBank} questions</span>
                  <span>Weight: 20%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Assessment Attempts History */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <span>Your Assessment History</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{history.length} Completed Attempts</span>
          </div>

          {history.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-800/80 bg-[#0F172A]/50 text-center space-y-3">
              <Brain className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                You haven't taken an aptitude assessment yet. Launch your first session above!
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 bg-[#0F172A]/90 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B1120] text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                      <th className="py-3.5 px-4 font-semibold">Score / 30</th>
                      <th className="py-3.5 px-4 font-semibold">Percentage</th>
                      <th className="py-3.5 px-4 font-semibold">Time Spent</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {history.map((h) => {
                      const isPassing = h.percentage >= 60;
                      return (
                        <tr key={h.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {new Date(h.startedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {h.score} / {h.totalQuestions || 30}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                                isPassing
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {h.percentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono">
                            {Math.floor(h.durationSeconds / 60)}m {h.durationSeconds % 60}s
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-mono text-slate-300">
                              {h.status === 'COMPLETED'
                                ? 'Completed'
                                : h.status === 'VIOLATION_TERMINATED'
                                ? 'Terminated (Proctoring)'
                                : 'Timed Out'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleViewPastResult(h.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>Solutions</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE PROCTORED EXAM ARENA
  // ==========================================
  if (phase === 'exam' && attempt) {
    const questions = attempt.questions || [];
    const currentQ = questions[currentIdx];
    const totalQ = questions.length;
    const selectedOpt = currentQ ? attempt.answers[currentQ.id] : undefined;
    const isMarked = currentQ ? attempt.markedForReview.includes(currentQ.id) : false;

    const isUrgent = remainingSeconds <= 300; // < 5 mins
    const isCritical = remainingSeconds <= 120; // < 2 mins

    return (
      <div
        ref={examContainerRef}
        className="fixed inset-0 z-50 bg-[#070B14] text-slate-100 flex flex-col font-sans overflow-hidden select-none"
      >
        {/* Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-[#0B1120] flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Aptitude Assessment
              </span>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:block">
                Candidate: {user.name} ({user.email})
              </span>
            </div>
          </div>

          {/* Center: Live Server Countdown Timer */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 sm:px-4 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs sm:text-sm font-bold transition shadow-sm ${
                isCritical
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                  : isUrgent
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <Timer className={`w-4 h-4 ${isCritical ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-indigo-400'}`} />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          </div>

          {/* Right: Security Integrity & Finish Button */}
          <div className="flex items-center gap-3">
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono ${
                violationsCount > 0
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Violations: {violationsCount}/3</span>
            </div>

            <button
              onClick={() => (isFullscreen ? exitFullscreen() : enterFullscreen())}
              className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Finish Test</span>
            </button>
          </div>
        </header>

        {/* Exam Split Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Question Panel (Left / Center) */}
          <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 lg:p-10 space-y-6">
            {currentQ ? (
              <div className="max-w-4xl mx-auto w-full space-y-6">
                {/* Question Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold">
                      Question {currentIdx + 1} of {totalQ}
                    </span>
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      {getCategoryIcon(currentQ.category)}
                      <span>{currentQ.category}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-300 font-mono">{currentQ.topic}</span>
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      currentQ.difficulty === 'Easy'
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                        : currentQ.difficulty === 'Medium'
                        ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                        : 'border-purple-500/30 text-purple-400 bg-purple-500/10'
                    }`}
                  >
                    {currentQ.difficulty}
                  </span>
                </div>

                {/* Question Statement */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 shadow-lg">
                  <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                    {currentQ.questionText}
                  </p>
                </div>

                {/* 4 Option Selection Cards */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider block">
                    Choose one correct answer:
                  </span>

                  <div className="grid gap-3">
                    {currentQ.options.map((optionText, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      const optionLabel = String.fromCharCode(65 + optIdx); // A, B, C, D

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/10'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 flex-1 pr-4">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-800 border border-slate-700 text-slate-300 group-hover:border-slate-600'
                              }`}
                            >
                              {optionLabel}
                            </div>
                            <span
                              className={`text-xs sm:text-sm leading-normal transition ${
                                isSelected ? 'text-white font-medium' : 'text-slate-300'
                              }`}
                            >
                              {optionText}
                            </span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition flex-shrink-0 ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-500 text-white'
                                : 'border-slate-700 bg-slate-800'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Navigation Toolbar */}
                <div className="pt-6 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleMarkForReview}
                      className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        isMarked
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Flag className={`w-3.5 h-3.5 ${isMarked ? 'fill-purple-400' : ''}`} />
                      <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                    </button>

                    {selectedOpt !== undefined && (
                      <button
                        onClick={handleClearOption}
                        className="px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                      className="px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <button
                      disabled={currentIdx === totalQ - 1}
                      onClick={() => setCurrentIdx((i) => Math.min(totalQ - 1, i + 1))}
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1 transition shadow cursor-pointer"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </main>

          {/* Right Sidebar: 30-Question Palette & Overview */}
          <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#0B1120] p-5 flex flex-col space-y-5 overflow-y-auto flex-shrink-0">
            {/* Palette Legend */}
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider block">
                Question Palette Status
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/60 text-emerald-400 flex items-center justify-center font-bold text-[9px]">
                    ✓
                  </div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-purple-500/20 border border-purple-500/60 text-purple-400 flex items-center justify-center font-bold text-[9px]">
                    ⚑
                  </div>
                  <span>Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center text-[9px]">
                    •
                  </div>
                  <span>Unvisited</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded border border-indigo-400 ring-2 ring-indigo-400/30 text-white flex items-center justify-center text-[9px] font-bold">
                    Q
                  </div>
                  <span>Current</span>
                </div>
              </div>
            </div>

            {/* Interactive 30-Question Grid */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Jump to Question</span>
                <span className="font-mono text-indigo-400 font-semibold">
                  {Object.keys(attempt.answers).length} / {totalQ} Answered
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = attempt.answers[q.id] !== undefined;
                  const isMarkedReview = attempt.markedForReview.includes(q.id);
                  const isCurrent = idx === currentIdx;

                  let styleClass =
                    'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500';
                  if (isCurrent) {
                    styleClass =
                      'bg-indigo-600 text-white border-white ring-2 ring-indigo-400/50 font-bold';
                  } else if (isAnswered && isMarkedReview) {
                    styleClass =
                      'bg-purple-600/30 border-purple-400 text-purple-200 font-bold ring-1 ring-emerald-400/40';
                  } else if (isAnswered) {
                    styleClass =
                      'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 font-semibold';
                  } else if (isMarkedReview) {
                    styleClass =
                      'bg-purple-500/20 border-purple-500/60 text-purple-300 font-semibold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        sound.playClick(1000);
                        setCurrentIdx(idx);
                      }}
                      className={`h-9 rounded-lg border text-xs font-mono transition flex items-center justify-center relative cursor-pointer ${styleClass}`}
                    >
                      <span>{idx + 1}</span>
                      {isMarkedReview && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Section Jump List */}
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block">
                Category Sections (6 Qs each)
              </span>
              <div className="space-y-1">
                {['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Technical Aptitude', 'Data Interpretation & Analytical Reasoning'].map(
                  (cat, cIdx) => {
                    const firstIdxInCat = questions.findIndex((q) => q.category === cat);
                    if (firstIdxInCat === -1) return null;
                    const isCatActive = currentQ && currentQ.category === cat;

                    return (
                      <button
                        key={cIdx}
                        onClick={() => {
                          sound.playClick(900);
                          setCurrentIdx(firstIdxInCat);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between transition cursor-pointer ${
                          isCatActive
                            ? 'bg-slate-800 text-white border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="truncate max-w-[170px]">{cat}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          #{firstIdxInCat + 1}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Security / Proctoring Violation Modal */}
        {showViolationModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-2xl border border-rose-500/40 bg-[#0F172A] shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white">
                  Security Warning: Violation #{violationsCount} / 3
                </h3>
                <p className="text-xs text-rose-300 font-medium">{lastViolationMsg}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                  Please stay focused on the assessment screen in fullscreen mode. If you trigger{' '}
                  <span className="text-white font-bold">3 violations</span>, your assessment will be
                  terminated and submitted automatically.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowViolationModal(false);
                  enterFullscreen();
                }}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                Return to Assessment in Fullscreen
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-2xl border border-slate-800 bg-[#0F172A] shadow-2xl space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Submit Assessment</h3>
                  <span className="text-xs text-slate-400 font-mono">Verify your progress</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Answered</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {Object.keys(attempt.answers).length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Unanswered</span>
                  <span className="text-lg font-bold text-rose-400 font-mono">
                    {totalQ - Object.keys(attempt.answers).length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Review Flag</span>
                  <span className="text-lg font-bold text-purple-400 font-mono">
                    {attempt.markedForReview.length}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Are you ready to submit your test? Once confirmed, you will immediately see your score,
                detailed category breakdown, and verified explanations.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Continue Test
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleFinishAndSubmit()}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? 'Evaluating...' : 'Yes, Submit Now'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: RESULTS & SOLUTIONS REVIEW
  // ==========================================
  if (phase === 'result' && result) {
    const isPassing = result.percentage >= 60;
    const durationMinutes = Math.floor(result.durationSeconds / 60);
    const durationSecondsPart = result.durationSeconds % 60;

    // Filter review questions
    const filteredReviews = (result.questionReviews || []).filter((q) => {
      if (reviewCategoryFilter !== 'all' && q.category !== reviewCategoryFilter) return false;
      if (reviewFilter === 'correct') return q.isCorrect;
      if (reviewFilter === 'incorrect') return q.selectedOption !== null && !q.isCorrect;
      if (reviewFilter === 'unanswered') return q.selectedOption === null;
      return true;
    });

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 font-sans">
        {/* Hero Scorecard */}
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0F172A] via-[#0B1120] to-[#070B14] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Assessment Completed Successfully</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your Assessment Performance
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Time spent:{' '}
                <span className="text-white font-mono font-semibold">
                  {durationMinutes}m {durationSecondsPart}s
                </span>{' '}
                • Violations:{' '}
                <span className="text-white font-mono font-semibold">
                  {result.violationsCount} / 3
                </span>
                {result.forcedSubmissionReason && (
                  <span className="text-rose-400 block pt-1">
                    Note: {result.forcedSubmissionReason}
                  </span>
                )}
              </p>
            </div>

            {/* Circular / Badge Score Indicator */}
            <div className="flex items-center gap-6">
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] text-center shadow-xl min-w-[150px]">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
                  Final Score
                </span>
                <div className="text-4xl font-extrabold text-white font-mono mt-1">
                  {result.score}{' '}
                  <span className="text-lg text-slate-500 font-normal">/ {result.totalQuestions}</span>
                </div>
                <div
                  className={`mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-mono font-bold ${
                    isPassing
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {result.percentage}% Accuracy
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Tally Strip */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Correct</span>
              <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                {result.correctCount}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Incorrect</span>
              <span className="text-xl font-bold text-rose-400 font-mono mt-0.5 block">
                {result.incorrectCount}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Unanswered</span>
              <span className="text-xl font-bold text-slate-400 font-mono mt-0.5 block">
                {result.unansweredCount}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown & Insights Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: 5 Categories Performance */}
          <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Domain Mastery Breakdown</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">6 Questions Per Category</span>
            </div>

            <div className="space-y-4">
              {result.categoryScores.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      {getCategoryIcon(cat.category)}
                      <span>{cat.category}</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      <span className="text-white font-bold">{cat.score}</span> / {cat.total} (
                      {cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.percentage >= 70
                          ? 'bg-emerald-500'
                          : cat.percentage >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Strengths & Targeted Recommendations */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/80 space-y-5">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Assessment Analysis & Next Steps</span>
            </h3>

            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                Observed Strengths
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                Targeted Action Plan
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-3">
              <button
                onClick={() => setPhase('lobby')}
                className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Back to Assessment Center
              </button>
              <button
                onClick={() => handleStartAssessment(true)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Solutions & Question-by-Question Review */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span>Question Review & Explanations</span>
              </h3>
              <p className="text-xs text-slate-400">
                Examine your answers against verified solutions and mathematical rationale.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  reviewFilter === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({result.totalQuestions})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  reviewFilter === 'correct'
                    ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Correct ({result.correctCount})
              </button>
              <button
                onClick={() => setReviewFilter('incorrect')}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  reviewFilter === 'incorrect'
                    ? 'bg-rose-600 text-white border-rose-500 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Incorrect ({result.incorrectCount})
              </button>
              <button
                onClick={() => setReviewFilter('unanswered')}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  reviewFilter === 'unanswered'
                    ? 'bg-slate-700 text-white border-slate-600 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Unanswered ({result.unansweredCount})
              </button>
            </div>
          </div>

          {/* Solutions List */}
          <div className="space-y-4">
            {filteredReviews.map((rev, idx) => {
              const selectedOptText =
                rev.selectedOption !== null && rev.options[rev.selectedOption] !== undefined
                  ? rev.options[rev.selectedOption]
                  : null;
              const correctOptText = rev.options[rev.correctAnswerIndex];

              return (
                <div
                  key={rev.id || idx}
                  className={`p-6 rounded-2xl border transition ${
                    rev.isCorrect
                      ? 'border-emerald-500/30 bg-[#0F172A]/70'
                      : rev.selectedOption === null
                      ? 'border-slate-800 bg-[#0F172A]/50'
                      : 'border-rose-500/30 bg-[#0F172A]/70'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        Q#{idx + 1}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        {getCategoryIcon(rev.category)}
                        <span>{rev.category}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300 font-mono">{rev.topic}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {rev.isCorrect ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </span>
                      ) : rev.selectedOption === null ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
                          Unanswered
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm text-slate-100 font-medium leading-relaxed whitespace-pre-line mb-4">
                    {rev.questionText}
                  </p>

                  {/* Options State Display */}
                  <div className="grid gap-2 mb-4">
                    {rev.options.map((opt, oIdx) => {
                      const isUserPick = rev.selectedOption === oIdx;
                      const isCorrectAnswer = rev.correctAnswerIndex === oIdx;

                      let optClass = 'bg-slate-900/50 border-slate-800 text-slate-400';
                      if (isCorrectAnswer) {
                        optClass =
                          'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold ring-1 ring-emerald-500/30';
                      } else if (isUserPick && !rev.isCorrect) {
                        optClass =
                          'bg-rose-500/10 border-rose-500/50 text-rose-300 font-medium ring-1 ring-rose-500/30';
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-[11px] text-slate-300">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-mono">
                            {isCorrectAnswer && (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                            {isUserPick && !isCorrectAnswer && (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                <span>Your Answer</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Card */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Solution Rationale & Concept</span>
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {rev.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
