import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  Terminal,
  FileText,
  Video,
  Briefcase,
  Compass,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Check,
  Brain,
  Bot,
  FileEdit,
  Sparkles,
  Calculator,
  Lightbulb,
  BookOpen,
  BarChart3,
  Award
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { User as UserType } from '../types.js';
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
    role: 'Distributed Systems Round',
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
    role: 'Senior React Architecture Round',
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
    role: 'Microservices Reliability Round',
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
  onNavigateToSignIn,
  currentUser,
  onNavigateToDashboard
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState<RoleTrack>('sysdesign');

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
  const heroOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0.92]);

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
          // Ignore stop errors
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
      {/* 1. PROFESSIONAL NAVIGATION BAR */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070B14]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base sm:text-lg tracking-tight text-white font-heading">
              Career Navigator
            </span>
            <span className="hidden sm:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              AI Career Platform
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors duration-150">
              Features
            </a>
            <button
              onClick={() => handleNavigateToFeature('resume-analyzer')}
              className="hover:text-white transition-colors duration-150 cursor-pointer"
            >
              Resume Analyzer
            </button>
            <button
              onClick={() => handleNavigateToFeature('interview-prep')}
              className="hover:text-white transition-colors duration-150 cursor-pointer"
            >
              Mock Interviews
            </button>
            <button
              onClick={() => handleNavigateToFeature('aptitude')}
              className="hover:text-white transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <span>Aptitude</span>
            </button>
            <a href="#how-it-works" className="hover:text-white transition-colors duration-150">
              How It Works
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={onNavigateToDashboard}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>Dashboard ({currentUser.name})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigateToSignIn && onNavigateToSignIn('signin')}
                  className="px-4 py-2 rounded-lg border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigateToSignIn && onNavigateToSignIn('register')}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20"
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
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0B1120] px-4 pt-3 pb-6 space-y-3">
            <nav className="flex flex-col space-y-1 text-sm text-slate-300">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800/80 transition"
              >
                Features
              </a>
              <button
                onClick={() => { setMobileMenuOpen(false); handleNavigateToFeature('resume-analyzer'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-800/80 transition"
              >
                Resume Analyzer
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleNavigateToFeature('interview-prep'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-800/80 transition"
              >
                Mock Interviews
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleNavigateToFeature('aptitude'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-800/80 transition"
              >
                Aptitude Assessment
              </button>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800/80 transition"
              >
                How It Works
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {currentUser ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigateToDashboard && onNavigateToDashboard(); }}
                  className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium text-center text-sm"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigateToSignIn && onNavigateToSignIn('signin'); }}
                    className="w-full py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 font-medium text-center text-sm"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigateToSignIn && onNavigateToSignIn('register'); }}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white font-medium text-center text-sm shadow-md shadow-blue-500/20"
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
          className="pt-16 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>AI Career Preparation & Assessment Platform</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            Build Your Skills. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-sky-300">
              Prepare for Success.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Analyze your resume, strengthen your aptitude, practice technical interviews, and build the confidence to achieve your career goals.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigateToSignIn ? onNavigateToSignIn('register') : null}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Trust points */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-teal-400" /> Personalized Career Preparation
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-teal-400" /> Practical Assessments
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-teal-400" /> Interview Readiness
            </span>
          </div>
        </motion.section>

        {/* 3. PRODUCT PREVIEW: REALISTIC ATS & INTERVIEW SIMULATOR */}
        <section className="px-4 sm:px-6 max-w-5xl mx-auto mb-20">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* ATS Score Card Preview */}
            <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/90 backdrop-blur-sm shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">ATS Resume Diagnostics</span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Match Passed
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-3xl font-bold text-white">88<span className="text-sm font-normal text-slate-400">/100</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">Target: Full Stack Engineer</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-teal-400">7/7 Sections Found</div>
                  <div className="text-[11px] text-slate-400">4.8% Keyword Density</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-2.5 pt-1 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Technical Skills Match</span>
                    <span className="text-blue-400 font-mono font-medium">92%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-[92%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>ATS Section Architecture</span>
                    <span className="text-teal-400 font-mono font-medium">100%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full w-[100%]" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleNavigateToFeature('resume-analyzer')}
                className="w-full mt-2 py-2.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
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
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                        activeTrack === t
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
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
                    <span className="text-[11px] font-medium text-slate-400">AI Senior Evaluator</span>
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
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>{isRecording ? 'Listening live to speech...' : 'Sample Response Pacing'}</span>
                      <span className="text-teal-400 font-mono font-medium">{activeWpm} WPM</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      "{activeAnswer}"
                    </p>
                  </div>
                </div>

                {/* Action Strip */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 border-t border-slate-800">
                  <button
                    onClick={handleToggleLiveMic}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
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
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    [Replay audio answer]
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. FEATURE SECTION (6 Comprehensive Cards) */}
        <section id="features" className="py-20 border-t border-slate-800/80 bg-[#070B14]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold block mb-2">
                Platform Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Complete Career Preparation Stack
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
                Integrated diagnostic and assessment tools engineered to convert job applications into verified engineering offers.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1: AI Resume Analyzer */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-blue-500/40 hover:bg-[#0F172A] transition duration-200 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition duration-200">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">Resume Analyzer</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Instant ATS scoring, keyword matching against target job descriptions, and section audits.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed pt-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>PDF & DOCX parsing with text extraction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>ATS keyword density & missing skills audit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Section completeness & formatting checks</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('resume-analyzer')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Launch Analyzer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature 2: AI Career Assistant */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-indigo-500/40 hover:bg-[#0F172A] transition duration-200 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition duration-200">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">AI Career Assistant</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Conversational mentor powered by Google Gemini AI providing instant placement guidance.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed pt-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Multi-turn conversational career coaching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Role transition & learning roadmap advice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Candidate history persistence & isolation</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('career-assistant')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Chat with Assistant</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature 3: Mock Interview Studio */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-teal-500/40 hover:bg-[#0F172A] transition duration-200 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition duration-200">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">Mock Interviews</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Realistic voice and camera interview practice with speech pacing analysis and rubric evaluation.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed pt-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Automatic camera & mic lifecycle teardown</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Curated tracks: System Design, Frontend, Backend</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Speech-to-text dictation & WPM pacing metrics</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('interview-prep')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Practice Interviews</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature 4: Aptitude Assessment */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-amber-500/40 hover:bg-[#0F172A] transition duration-200 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition duration-200">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">Aptitude Assessment</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Comprehensive tests in Quantitative, Logical Reasoning, Verbal Ability, and Data Interpretation.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed pt-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>30-minute timed proctored exam experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Categorized question banks with clear instructions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Instant score calculation & solution review</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('aptitude')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Start Aptitude Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature 5: ATS-Friendly Templates */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-cyan-500/40 hover:bg-[#0F172A] transition duration-200 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition duration-200">
                    <FileEdit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">ATS-Friendly Templates</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Recruiter-approved, ATS-compliant resume builder formatted to pass automated tracking parsers.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed pt-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Parseable standard single-column layouts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Keyword-optimized experience bullet points</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Instant browser print & PDF document export</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('resume-builder')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Build Your Resume</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature 6: Placement Readiness Hub */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F172A]/70 hover:border-emerald-500/40 hover:bg-[#0F172A] transition duration-200 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition duration-200">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">Placement Readiness Hub</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Track skill competencies, assessment history, and target role qualifications in a unified dashboard.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400 leading-relaxed pt-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Unified placement readiness progress metric</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Historical interview & test performance logs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Actionable recommendations to bridge gaps</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleNavigateToFeature('student-dashboard')}
                  className="mt-6 pt-4 border-t border-slate-800 text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>View Placement Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. APTITUDE SPOTLIGHT SECTION */}
        <section className="py-16 border-t border-slate-800/80 bg-[#090E1A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-10 rounded-3xl border border-slate-800 bg-[#0F172A]/90 backdrop-blur-sm relative overflow-hidden">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Aptitude Assessment Center</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Master Campus Recruitment Aptitude Tests
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Designed to simulate standard technical hiring assessments. Practice timed, multi-category examinations with comprehensive score calculations and detailed solution breakdowns.
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                      <Calculator className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-medium text-slate-200">Quantitative Aptitude</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-slate-200">Logical Reasoning</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-slate-200">Verbal Ability</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium text-slate-200">Data Interpretation</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleNavigateToFeature('aptitude')}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Take Aptitude Assessment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-3 p-5 rounded-2xl border border-slate-800/80 bg-slate-900/80 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-semibold text-slate-200">Aptitude Exam Features</span>
                    <span className="text-teal-400 font-mono text-[11px]">Proctored Mode</span>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>30-minute countdown timer with automatic submission</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Multiple-choice selection with easy question navigation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Real-time score percentage, accuracy, and percentile metrics</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>In-depth step-by-step explanations for each question</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-[#070B14]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold block mb-2">
                Execution Workflow
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight">How It Works</h2>
              <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
                Four streamlined steps to placement readiness and career success.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 relative">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/80 relative space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-sm font-semibold text-white">Create Your Profile</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Set up your candidate account, specify your target engineering role, and declare your core technical skill stack.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/80 relative space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500 text-white font-mono font-bold text-sm flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-sm font-semibold text-white">Optimize Your Resume</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Run an instant ATS diagnostic on your resume or use our ATS-friendly templates to guarantee parser pass rates.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/80 relative space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center">
                    3
                  </div>
                  <h3 className="text-sm font-semibold text-white">Assess & Practice</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Test your aptitude in quantitative and logical sections, then simulate voice mock interviews with AI evaluation.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A]/80 relative space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-mono font-bold text-sm flex items-center justify-center">
                    4
                  </div>
                  <h3 className="text-sm font-semibold text-white">Achieve Readiness</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Review actionable reports, close discovered knowledge gaps, and attend placement drives with total confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. TRUST & CONVERSION CTA */}
        <section className="py-20 border-t border-slate-800/80 bg-gradient-to-b from-[#070B14] to-[#0A0F1D] text-center px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Build Your Skills. Prepare for Success.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mx-auto">
              Join students and job seekers using Career Navigator to optimize ATS scores, prepare for high-stakes interviews, and achieve their career goals.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onNavigateToSignIn ? onNavigateToSignIn('register') : null}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold text-sm transition shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigateToSignIn ? onNavigateToSignIn('signin') : null}
                className="px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm transition cursor-pointer"
              >
                <span>Log In to Account</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 8. CONCISE SAAS FOOTER */}
      <footer className="border-t border-slate-800 bg-[#070B14] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-semibold text-white font-heading text-sm">Career Navigator</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-powered career development, ATS diagnostics, mock interviews, and aptitude assessment.
            </p>
          </div>

          {/* Tools Col */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-200 text-xs block mb-3 uppercase tracking-wider font-mono">Platform Tools</span>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleNavigateToFeature('resume-analyzer')} className="hover:text-white transition cursor-pointer">
                  Resume Analyzer
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToFeature('interview-prep')} className="hover:text-white transition cursor-pointer">
                  Mock Interviews
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToFeature('aptitude')} className="hover:text-white transition cursor-pointer">
                  Aptitude Assessment
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToFeature('career-assistant')} className="hover:text-white transition cursor-pointer">
                  AI Career Assistant
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToFeature('resume-builder')} className="hover:text-white transition cursor-pointer">
                  Resume Builder
                </button>
              </li>
            </ul>
          </div>

          {/* Practice Tracks Col */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-200 text-xs block mb-3 uppercase tracking-wider font-mono">Assessment Areas</span>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleNavigateToFeature('aptitude')} className="hover:text-white transition cursor-pointer">
                  Quantitative Aptitude
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToFeature('aptitude')} className="hover:text-white transition cursor-pointer">
                  Logical Reasoning
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToFeature('aptitude')} className="hover:text-white transition cursor-pointer">
                  Verbal Ability
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToFeature('aptitude')} className="hover:text-white transition cursor-pointer">
                  Data Interpretation
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigateToFeature('interview-prep')} className="hover:text-white transition cursor-pointer">
                  System Design & APIs
                </button>
              </li>
            </ul>
          </div>

          {/* Account Col */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-200 text-xs block mb-3 uppercase tracking-wider font-mono">Account & Info</span>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-white transition">Features Overview</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToSignIn && onNavigateToSignIn('signin')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Candidate Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToSignIn && onNavigateToSignIn('register')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Create Free Account
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Career Navigator. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Verified ATS Diagnostics</span>
            <span>•</span>
            <span>Proctored Assessments</span>
            <span>•</span>
            <span>Gemini AI Mentor</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
