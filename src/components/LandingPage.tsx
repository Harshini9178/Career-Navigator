import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  Play,
  Terminal,
  Code2,
  Activity,
  Sparkles,
  CheckCircle2,
  FileText,
  Video,
  Code,
  Briefcase,
  Compass,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Check,
  Brain
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { User as UserType } from '../types.js';
import { api } from '../lib/api.js';
import { sound } from '../lib/sound.js';

interface LandingPageProps {
  onLoginSuccess: (user: UserType) => void;
  onNavigateToSignIn?: (mode?: 'signin' | 'register', targetView?: string) => void;
  currentUser?: UserType | null;
  onNavigateToDashboard?: () => void;
}

type RoleTrack = 'sysdesign' | 'frontend' | 'backend' | 'behavioral';

interface QuestionScenario {
  id: RoleTrack;
  label: string;
  role: string;
  question: string;
  sampleAnswer: string;
  wpm: number;
  score: number;
  goodPoint: string;
  improvePoint: string;
}

const SCENARIOS: Record<RoleTrack, QuestionScenario> = {
  sysdesign: {
    id: 'sysdesign',
    label: 'System Design',
    role: 'Staff Infrastructure Round',
    question: 'How would you handle cache invalidation across 50 distributed edge nodes when high-frequency database writes occur?',
    sampleAnswer: 'I would use a Cache-Aside pattern combined with Change Data Capture (CDC) via Kafka. On database commit, an async event broadcasts to edge nodes with a small TTL buffer, avoiding synchronous write blocking while bounding eventual consistency to under 80ms.',
    wpm: 138,
    score: 94,
    goodPoint: 'Immediately addressed asynchronous CDC decoupling instead of naive dual-writes.',
    improvePoint: 'Consider quantifying what happens if Kafka partition consumer lag spikes.'
  },
  frontend: {
    id: 'frontend',
    label: 'Frontend & UI',
    role: 'Senior React Architect Round',
    question: 'How do you prevent UI layout jank and frame drops when rendering an infinite feed of 100,000 mixed-height media cards?',
    sampleAnswer: 'I would implement a dynamic windowing list using intersection observers, estimating item heights with a resize observer cache. By unmounting offscreen DOM nodes and keeping paint operations within 16ms animation frames, memory and reflow costs remain constant regardless of list depth.',
    wpm: 144,
    score: 96,
    goodPoint: 'Focused on constant DOM memory footprint and RAF paint budgets.',
    improvePoint: 'Mention keyboard accessibility and scroll restoration strategies.'
  },
  backend: {
    id: 'backend',
    label: 'Backend & APIs',
    role: 'Distributed Services Round',
    question: 'A critical downstream payment gateway is experiencing intermittent 504 timeouts. How do you prevent cascade failure in your API tier?',
    sampleAnswer: 'I would deploy a circuit breaker pattern with exponential backoff and jitter. Once error rates breach 15%, the circuit trips to immediately fail-fast or route to an async retry queue, preventing database connection pool exhaustion in our upstream web tier.',
    wpm: 132,
    score: 92,
    goodPoint: 'Used jittered backoff to prevent thundering herd retry storms.',
    improvePoint: 'Detail whether idempotent request tokens are enforced on retries.'
  },
  behavioral: {
    id: 'behavioral',
    label: 'Leadership',
    role: 'Engineering Culture Round',
    question: 'Tell me about a disagreement with a product manager over shipping a feature with known architectural debt.',
    sampleAnswer: 'We had a hard deadline for Q3 launch, but shipping without schema versioning risked data migration locks later. I sat down with the PM, mapped the rollback cost in dollar terms, and proposed an MVP compromise: ship the core flow now with an automated migration guardrail, scheduling the full refactor in the very next sprint.',
    wpm: 136,
    score: 95,
    goodPoint: 'Translated technical risk into business and revenue impacts without being defensive.',
    improvePoint: 'Share how you followed up post-launch to ensure the refactor happened.'
  }
};

export default function LandingPage({
  onLoginSuccess,
  onNavigateToSignIn,
  currentUser,
  onNavigateToDashboard
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState<RoleTrack>('sysdesign');
  const [viewMode, setViewMode] = useState<'dialogue' | 'feedback'>('dialogue');

  // Interactive Voice Simulator state
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [computedWpm, setComputedWpm] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Motion animation transforms
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroScale = useTransform(smoothProgress, [0, 0.25], [1, 0.98]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0.9]);

  // Spotlight mouse tracker
  const previewRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    previewRef.current.style.setProperty('--mouse-x', `${x}px`);
    previewRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  // Recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Speech Recognition Handling
  const handleToggleLiveMic = () => {
    sound.playClick(isRecording ? 800 : 1200);

    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore stop errors if recognition wasn't active
        }
      }
      sound.playChime();
      const words = liveTranscript.trim().split(/\s+/).filter(Boolean).length;
      const mins = Math.max(recordingSeconds, 2) / 60;
      setComputedWpm(Math.round(words / mins));
      return;
    }

    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      handleSimulateVoice();
      return;
    }

    try {
      const recognition = new SpeechAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setLiveTranscript('');
      setRecordingSeconds(0);
      setComputedWpm(null);
      setIsRecording(true);
      sound.playMicStart();

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(transcript);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      handleSimulateVoice();
    }
  };

  const handleSimulateVoice = () => {
    setIsRecording(true);
    setLiveTranscript('');
    setRecordingSeconds(0);
    setComputedWpm(null);
    sound.playMicStart();

    const text = SCENARIOS[activeTrack].sampleAnswer;
    const words = text.split(' ');
    let currentIdx = 0;

    const interval = setInterval(() => {
      currentIdx += 4;
      if (currentIdx >= words.length) {
        clearInterval(interval);
        setLiveTranscript(text);
        setIsRecording(false);
        setComputedWpm(SCENARIOS[activeTrack].wpm);
        sound.playChime();
      } else {
        setLiveTranscript(words.slice(0, currentIdx).join(' '));
      }
    }, 200);
  };

  const handleSelectTrack = (track: RoleTrack) => {
    sound.playClick(1000);
    setActiveTrack(track);
    setLiveTranscript('');
    setComputedWpm(null);
  };

  const handleNavigateToFeature = (targetView: string) => {
    sound.playClick(1000);
    if (currentUser && onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (onNavigateToSignIn) {
      onNavigateToSignIn('signin', targetView);
    }
  };

  const currentScenario = SCENARIOS[activeTrack];
  const activeAnswer = liveTranscript || currentScenario.sampleAnswer;
  const activeWpm = computedWpm || currentScenario.wpm;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
      {/* 1. PROFESSIONAL SAAS NAVIGATION BAR */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070B14]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white font-heading">
              Career Navigator
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              AI Platform
            </span>
          </div>

          {/* Desktop Public Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <button
              onClick={() => handleNavigateToFeature('resume-analyzer')}
              className="hover:text-white transition cursor-pointer"
            >
              Resume Analyzer
            </button>
            <button
              onClick={() => handleNavigateToFeature('interview-prep')}
              className="hover:text-white transition cursor-pointer"
            >
              Mock Interviews
            </button>
            <button
              onClick={() => handleNavigateToFeature('code-sandbox')}
              className="hover:text-white transition cursor-pointer"
            >
              CodeLab
            </button>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={onNavigateToDashboard}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                <span>Dashboard ({currentUser.name})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigateToSignIn && onNavigateToSignIn('signin')}
                  className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs transition cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigateToSignIn && onNavigateToSignIn('register')}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0B1120] px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
            <nav className="flex flex-col space-y-2 text-sm text-slate-300">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800 transition"
              >
                Features
              </a>
              <button
                onClick={() => { setMobileMenuOpen(false); handleNavigateToFeature('resume-analyzer'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition"
              >
                Resume Analyzer
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleNavigateToFeature('interview-prep'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition"
              >
                Mock Interviews
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleNavigateToFeature('code-sandbox'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition"
              >
                CodeLab
              </button>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800 transition"
              >
                How It Works
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {currentUser ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigateToDashboard && onNavigateToDashboard(); }}
                  className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-center text-xs"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigateToSignIn && onNavigateToSignIn('signin'); }}
                    className="w-full py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 font-semibold text-center text-xs"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigateToSignIn && onNavigateToSignIn('register'); }}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold text-center text-xs"
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <main className="flex-1">
        <motion.section
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-mono mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>AI Career Preparation & ATS Diagnostics</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Build Your Career. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-300">
              Master Every Interview.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Analyze your resume, identify skill gaps, practice realistic technical interviews, and prepare for your next opportunity with Career Navigator.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigateToSignIn ? onNavigateToSignIn('register') : null}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-sm transition shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm transition flex items-center gap-2"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Trust points */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-teal-400" /> Free Candidate Account
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-teal-400" /> Zero Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-teal-400" /> Verified ATS Scoring Engine
            </span>
          </div>
        </motion.section>

        {/* PRODUCT PREVIEW: REALISTIC ATS & INTERVIEW SIMULATOR */}
        <section className="px-4 sm:px-6 max-w-5xl mx-auto mb-20">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* ATS Score Card Preview */}
            <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/90 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">ATS Resume Diagnostics</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold">
                  Match Passed
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-3xl font-extrabold text-white">88<span className="text-sm font-normal text-slate-400">/100</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">Target: Full Stack Engineer</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-teal-400">7/7 Sections Found</div>
                  <div className="text-[11px] text-slate-400">4.8% Keyword Density</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-2 pt-1 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Technical Skills Match</span>
                    <span className="text-blue-400 font-mono">92%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-[92%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>ATS Section Architecture</span>
                    <span className="text-teal-400 font-mono">100%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full w-[100%]" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleNavigateToFeature('resume-analyzer')}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Upload & Analyze Your Resume</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Mock Interview Sandbox Preview */}
            <div className="lg:col-span-7 border border-slate-800 bg-[#0F172A]/90 rounded-2xl overflow-hidden shadow-xl" ref={previewRef} onMouseMove={handleMouseMove}>
              {/* Header */}
              <div className="px-5 py-3 border-b border-slate-800 bg-[#0B1120] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span className="ml-2 text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    Mock Studio: {currentScenario.role}
                  </span>
                </div>

                {/* Role Switcher */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(Object.keys(SCENARIOS) as RoleTrack[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleSelectTrack(t)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                        activeTrack === t
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {SCENARIOS[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Spoken Question */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">AI Senior Evaluator</span>
                    <p className="text-xs sm:text-sm font-medium text-slate-100 mt-0.5">
                      "{currentScenario.question}"
                    </p>
                  </div>
                </div>

                {/* Candidate Response */}
                <div className="flex gap-3 pl-3 sm:pl-5 border-l-2 border-slate-800">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                    isRecording ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' : 'bg-teal-500/10 border border-teal-500/30 text-teal-400'
                  }`}>
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>{isRecording ? 'Listening live to speech...' : 'Sample Response Pacing'}</span>
                      <span className="text-teal-400 font-bold">{activeWpm} WPM</span>
                    </div>
                    <p className="text-xs font-mono text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      "{activeAnswer}"
                    </p>
                  </div>
                </div>

                {/* Action Strip */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-slate-400 border-t border-slate-800">
                  <button
                    onClick={handleToggleLiveMic}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-teal-400" />}
                    <span>{isRecording ? `Stop (${recordingSeconds}s)` : 'Test Mic Out Loud'}</span>
                  </button>

                  <button
                    onClick={handleSimulateVoice}
                    className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    [Replay audio answer]
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. FEATURE SECTION (4 Cards as requested) */}
        <section id="features" className="py-20 border-t border-slate-800/80 bg-[#070B14]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold block mb-2">
                Platform Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Complete Career Preparation Stack
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Four purpose-built tools designed to convert job applications into verified software engineering offers.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1: AI Resume Analyzer */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-blue-500/40 hover:bg-[#0F172A] transition flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">AI Resume Analyzer</h3>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>PDF & DOCX resume parsing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>ATS compatibility insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Required section detection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Keyword and skill gap analysis</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('resume-analyzer')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Launch Analyzer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature 2: Mock Interview Studio */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-teal-500/40 hover:bg-[#0F172A] transition flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition">
                    <Video className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">Mock Interview Studio</h3>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Technical interview practice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Curated category tracks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Answer feedback & rubrics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Words-per-minute pacing metrics</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('interview-prep')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Start Practice Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature 3: Aptitude Assessment */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-indigo-500/40 hover:bg-[#0F172A] transition flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">Aptitude Assessment</h3>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>30-minute timed proctored exam</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Quant, Logic, Verbal, Tech & DI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Anti-cheating integrity monitoring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>In-depth explanations & score review</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('aptitude')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Launch Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature 4: Career Preparation */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-purple-500/40 hover:bg-[#0F172A] transition flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">Career Preparation</h3>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>ATS-compliant resume templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Skill development suggestions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Candidate progress tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Placement readiness dashboard</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('resume-builder')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Launch Resume Builder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-[#0A0F1D]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold block mb-2">
                Execution Workflow
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">How It Works</h2>
              <p className="mt-2 text-sm text-slate-400">Three streamlined steps to placement readiness.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] relative space-y-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center">
                  1
                </div>
                <h3 className="text-base font-bold text-white">Create your account</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign up in seconds, configure your target engineering role, and declare your core technical skill stack.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] relative space-y-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500 text-white font-mono font-bold text-sm flex items-center justify-center">
                  2
                </div>
                <h3 className="text-base font-bold text-white">Upload resume or choose track</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Run an instant ATS keyword audit on your PDF resume or select an interview track (System Design, Frontend, Backend).
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A] relative space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center">
                  3
                </div>
                <h3 className="text-base font-bold text-white">Analyze, practice, and improve</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Review actionable keyword additions, speak out loud to conversational rubrics, and solve algorithmic challenges.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. TRUST & CONVERSION CTA */}
        <section className="py-20 border-t border-slate-800/80 bg-gradient-to-b from-[#070B14] to-[#0A0F1D] text-center px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to elevate your engineering career?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              Join candidates using Career Navigator to optimize ATS scores, prepare for high-stakes interviews, and land software roles.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onNavigateToSignIn ? onNavigateToSignIn('register') : null}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-sm transition shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigateToSignIn ? onNavigateToSignIn('signin') : null}
                className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm transition cursor-pointer"
              >
                <span>Log In to Account</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 6. CONCISE SAAS FOOTER */}
      <footer className="border-t border-slate-800 bg-[#070B14] py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white font-heading">Career Navigator</span>
            <span className="text-slate-500">•</span>
            <span>AI Career Preparation Platform</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs">
            <a href="#features" className="hover:text-white transition">Features</a>
            <button onClick={() => handleNavigateToFeature('resume-analyzer')} className="hover:text-white transition cursor-pointer">
              Resume Analyzer
            </button>
            <button onClick={() => handleNavigateToFeature('interview-prep')} className="hover:text-white transition cursor-pointer">
              Mock Interviews
            </button>
            <button onClick={() => handleNavigateToFeature('code-sandbox')} className="hover:text-white transition cursor-pointer">
              CodeLab
            </button>
            <button
              onClick={() => onNavigateToSignIn && onNavigateToSignIn('signin')}
              className="hover:text-white transition cursor-pointer"
            >
              Log In
            </button>
          </div>

          <div className="text-slate-500 text-[11px]">
            &copy; {new Date().getFullYear()} Career Navigator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
