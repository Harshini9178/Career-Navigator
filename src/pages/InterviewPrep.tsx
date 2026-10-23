import { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Play,
  Calendar,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Check,
  Settings2,
  Sliders,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
  X
} from 'lucide-react';
import { User, MockInterview, StructuredQuestion } from '../types.js';
import { api } from '../lib/api.js';
import {
  BUILT_IN_QUESTION_BANK,
  QUESTION_CATEGORIES,
  INTERVIEW_ROLES,
  getBalancedQuestions
} from '../lib/questionBank.js';

interface InterviewPrepProps {
  user: User;
  onNavigate: (view: string, targetId?: string) => void;
}

interface SavedResumeOption {
  id: string;
  fileName: string;
  targetRole?: string;
  skills: string[];
  uploadedAt: string;
}

export default function InterviewPrep({ user, onNavigate }: InterviewPrepProps) {
  const [history, setHistory] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup Modal State
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(
    user.targetRole || (INTERVIEW_ROLES as readonly string[])[0]
  );
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'technical',
    'coding',
    'resume',
    'behavioral',
    'aptitude'
  ]);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [prepTimerSeconds, setPrepTimerSeconds] = useState<number>(0); // 0 = off, 30s, 60s
  const [interviewMode, setInterviewMode] = useState<'video_audio' | 'text'>('video_audio');

  // Resume Selection State
  const [availableResumes, setAvailableResumes] = useState<SavedResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('profile');

  // Device Check State
  const [deviceCheckStep, setDeviceCheckStep] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Load History
  const loadHistory = () => {
    api.get('/api/interview/history')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.history)
          ? data.history
          : Array.isArray(data.interviews)
          ? data.interviews
          : [];

        // Also merge local storage history if available
        let localItems: MockInterview[] = [];
        try {
          const localSaved = localStorage.getItem(`mock_history_${user.id}`);
          if (localSaved) localItems = JSON.parse(localSaved);
        } catch (_e) {
          // ignore localStorage parsing errors
        }

        const mergedMap = new Map<string, MockInterview>();
        for (const item of list) {
          mergedMap.set(item.id, {
            ...item,
            questions: Array.isArray(item.questions) ? item.questions : [],
            answers: Array.isArray(item.answers) ? item.answers : [],
            createdAt: item.createdAt || item.date || new Date().toISOString(),
            overallScore: typeof item.overallScore === 'number' ? item.overallScore : (item.score ?? 0)
          });
        }
        for (const item of localItems) {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        }

        setHistory(Array.from(mergedMap.values()));
      })
      .catch((err) => {
        console.warn('Failed to load server interview history, checking local store:', err);
        try {
          const localSaved = localStorage.getItem(`mock_history_${user.id}`);
          if (localSaved) {
            setHistory(JSON.parse(localSaved));
          }
        } catch (_e) {
          // ignore
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, [user.id]);

  // 2. Load uploaded candidate resumes for personalization
  useEffect(() => {
    api.get('/api/resume/my-analysis')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const resumes = Array.isArray(data) ? data : data.analyses ? data.analyses : [data];
        const validResumes: SavedResumeOption[] = resumes
          .filter((r: any) => r && r.id && (r.fileName || r.skills))
          .map((r: any) => ({
            id: r.id,
            fileName: r.fileName || 'Uploaded Resume',
            targetRole: r.targetRole,
            skills: Array.isArray(r.skills) ? r.skills : [],
            uploadedAt: r.uploadedAt || new Date().toISOString()
          }));
        setAvailableResumes(validResumes);
        if (validResumes.length > 0 && selectedResumeId === 'profile') {
          // default to latest uploaded resume
          setSelectedResumeId(validResumes[0].id);
        }
      })
      .catch(() => {
        // Fall back quietly to user profile skills
      });
  }, []);

  // 3. Audio & Camera Cleanups
  const stopMediaTracks = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
      setCameraStream(null);
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setMicVolume(0);
    setCameraPermission('idle');
  };

  useEffect(() => {
    return () => {
      stopMediaTracks();
    };
  }, []);

  // 4. Request Real Camera & Microphone Permissions with Volume Meter
  const handleEnableDevices = async () => {
    setDeviceError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setDeviceError('MediaDevices API is not supported in this browser or environment.');
      setCameraPermission('denied');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });

      setCameraStream(stream);
      setCameraPermission('granted');

      // Bind Video Stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      // Initialize Web Audio API Analyser for real-time mic levels
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalize to 0-100%
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setMicVolume(normalized);

          animFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (audioErr) {
        console.warn('Web Audio API analyser failed, audio recording will still function:', audioErr);
      }
    } catch (err: any) {
      console.warn('Camera/Mic permission failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setDeviceError('Camera or microphone permission was denied. Please allow access in browser settings or choose Text-Only mode.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setDeviceError('No camera or microphone hardware found on your device. You can proceed seamlessly in Text-Only mode.');
      } else {
        setDeviceError(`Device initialization error: ${err.message || 'Unknown device error'}.`);
      }
      setCameraPermission('denied');
    }
  };

  const handleToggleCamera = () => {
    if (!cameraStream) return;
    const videoTracks = cameraStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOn(!isCameraOn);
  };

  const handleToggleMic = () => {
    if (!cameraStream) return;
    const audioTracks = cameraStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMicMuted(!isMicMuted);
  };

  // Toggle category in setup
  const handleToggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) return; // keep at least 1 category
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  // 5. Start Interview Execution with Transparent Fallback
  const handleLaunchInterview = async () => {
    setStarting(true);
    setError(null);

    const effectiveRole = isCustomRole ? customRole.trim() || 'Software Engineer' : selectedRole;

    // Resolve candidate project and skills from selected resume or profile
    let activeSkills = user.skills || [];
    let activeProjects = user.projects || [];
    let selectedResumeName = 'Placement Profile';

    if (selectedResumeId !== 'profile') {
      const foundResume = availableResumes.find((r) => r.id === selectedResumeId);
      if (foundResume) {
        selectedResumeName = foundResume.fileName;
        if (foundResume.skills && foundResume.skills.length > 0) {
          activeSkills = foundResume.skills;
        }
      }
    }

    // Select category-balanced questions
    const balancedQuestions: StructuredQuestion[] = getBalancedQuestions({
      targetRole: effectiveRole,
      difficulty,
      targetCount: questionCount,
      categories: selectedCategories as any,
      userSkills: activeSkills,
      userProjects: activeProjects
    });

    const payload = {
      targetRole: effectiveRole,
      branch: user.branch || 'Engineering',
      experienceLevel: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
      skills: activeSkills.length > 0 ? activeSkills : ['Full Stack', 'Software Engineering'],
      projects: activeProjects.length > 0 ? activeProjects : ['Engineering Project'],
      questionCount,
      categories: selectedCategories,
      durationMinutes,
      prepTimerSeconds,
      selectedResumeId,
      selectedResumeName,
      structuredQuestions: balancedQuestions.map((q) => ({
        id: q.id,
        category: q.category,
        difficulty: q.difficulty,
        question: q.question,
        expectedAnswerPoints: q.expectedAnswerPoints,
        evaluationCriteria: q.evaluationCriteria,
        codeTemplate: q.codeTemplate,
        defaultLanguage: q.defaultLanguage
      }))
    };

    try {
      const response = await api.post('/api/interview/generate', payload);

      if (response.ok) {
        const data = await response.json();
        const targetInterview = data.interview || (data.id ? data : null);
        if (targetInterview && targetInterview.id) {
          stopMediaTracks();
          setShowSetupModal(false);
          onNavigate('mock-interview', targetInterview.id);
          return;
        }
      }
      throw new Error('Server returned unparseable interview response, engaging instant local session.');
    } catch (apiErr) {
      console.warn('API question compilation failed, falling back to built-in verified question bank:', apiErr);

      // Create guaranteed local fallback session
      const fallbackId = `int-local-${Date.now()}`;
      const localSession: MockInterview = {
        id: fallbackId,
        userId: user.id,
        jobRole: effectiveRole,
        branch: user.branch || 'Engineering',
        skills: activeSkills,
        experienceLevel: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        status: 'started',
        interviewMode: interviewMode === 'video_audio' ? 'video_audio' : 'text',
        questions: balancedQuestions.map((q) => q.question),
        structuredQuestions: balancedQuestions,
        currentQuestionIndex: 0,
        answers: [],
        createdAt: new Date().toISOString(),
        durationMinutes,
        prepTimerSeconds,
        selectedResumeId,
        selectedResumeName
      };

      try {
        localStorage.setItem(`mock_interview_${fallbackId}`, JSON.stringify(localSession));
        const savedHistory = localStorage.getItem(`mock_history_${user.id}`);
        const parsedHistory = savedHistory ? JSON.parse(savedHistory) : [];
        parsedHistory.unshift(localSession);
        localStorage.setItem(`mock_history_${user.id}`, JSON.stringify(parsedHistory));
      } catch (_e) {
        // ignore localStorage errors
      }

      stopMediaTracks();
      setShowSetupModal(false);
      onNavigate('mock-interview', fallbackId);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[var(--bg-base)]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] text-xs font-semibold font-mono">Loading interview modules & history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-[var(--text-primary)]">
      {/* Banner / Header */}
      <div className="grid md:grid-cols-12 gap-8 items-center glass-panel bg-[var(--bg-card)] border border-[var(--border)] p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--primary)]/10 via-[var(--accent)]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="md:col-span-8 space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-1.5 bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold px-3 py-1 rounded-full uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />
            <span>AI Technical & HR Placement Sandbox</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight font-display">
            Interactive AI Mock Interviews
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            Simulate realistic placement rounds with customized technical theory, coding editors, 
            resume deep-dives, and behavioral situational questions. Practice under live video telemetry or text-only mode.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] text-xs flex items-center space-x-2 max-w-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowSetupModal(true);
                setDeviceCheckStep(false);
              }}
              disabled={starting}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs px-6 py-3.5 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-[var(--primary)]/20 active:scale-95"
            >
              <Play className="w-4 h-4 text-white fill-white" />
              <span>Configure & Start Interview</span>
            </button>

            <button
              onClick={() => {
                // Quick launch default
                setShowSetupModal(true);
                setDeviceCheckStep(true);
              }}
              className="bg-transparent hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs px-4 py-3.5 rounded-xl transition flex items-center space-x-2"
            >
              <Video className="w-4 h-4 text-[var(--accent)]" />
              <span>Device Check & Audio Test</span>
            </button>
          </div>
        </div>

        {/* Composition Summary Card */}
        <div className="hidden md:block md:col-span-4 bg-[var(--bg-base)] p-5 rounded-2xl border border-[var(--border)] space-y-3 text-xs relative z-10">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <span className="font-bold text-[var(--text-primary)] font-display">Supported Categories:</span>
            <span className="text-[10px] font-mono text-[var(--primary)] font-bold">5 Domains</span>
          </div>

          <div className="space-y-2 text-[11px] text-[var(--text-secondary)]">
            <div className="flex items-center justify-between">
              <span>1. Technical Core (Java/Stack)</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">Theory & OOP</span>
            </div>
            <div className="flex items-center justify-between">
              <span>2. Programming & Coding</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">Live Editor</span>
            </div>
            <div className="flex items-center justify-between">
              <span>3. Project & Resume-Based</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">Your Projects</span>
            </div>
            <div className="flex items-center justify-between">
              <span>4. Behavioral & Situational</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">STAR Method</span>
            </div>
            <div className="flex items-center justify-between">
              <span>5. Aptitude & Analytical</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">Reasoning</span>
            </div>
          </div>
        </div>
      </div>

      {/* History log block */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="font-bold text-[var(--text-primary)] text-sm font-display">Past Performance Logs</h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">
            Completed Sessions ({history.length})
          </span>
        </div>

        {history.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((interview) => {
              const answersCount = (interview.answers || []).length;
              const totalQ = (interview.questions || []).length || 5;
              const isDone = interview.status === 'completed' || (interview.overallScore && interview.overallScore > 0);

              return (
                <div
                  key={interview.id}
                  className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-[var(--primary)]/50 transition group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[var(--text-primary)] text-sm leading-tight font-display group-hover:text-[var(--primary)] transition">
                          {interview.jobRole}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            Level: {interview.experienceLevel || 'Intermediate'}
                          </span>
                          <span className="text-[var(--border)]">•</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {answersCount}/{totalQ} Answered
                          </span>
                        </div>
                      </div>

                      {isDone ? (
                        <span className="text-xs font-bold font-mono px-2.5 py-1 bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] rounded-lg">
                          {interview.overallScore}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                      {interview.feedbackText ||
                        'Assessment completed. Review technical accuracy, code solutions, and model answers in your detailed performance report.'}
                    </p>
                  </div>

                  <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span className="flex items-center space-x-1.5 font-mono text-[10px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(interview.createdAt || Date.now()).toLocaleDateString()}</span>
                    </span>

                    <button
                      onClick={() => onNavigate('mock-interview', interview.id)}
                      className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center space-x-1 transition"
                    >
                      <span>{isDone ? 'Review Report' : 'Resume Mock'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 bg-[var(--bg-base)] text-[var(--text-muted)] flex items-center justify-center rounded-full mx-auto border border-[var(--border)]">
              <Video className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-[var(--text-primary)]">No Assessment History</h3>
              <p className="text-[11px] text-[var(--text-muted)] max-w-md mx-auto">
                You have not completed any AI Mock Interviews yet. Click "Configure & Start Interview" above to launch your first round.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SETUP & DEVICE CHECK MODAL */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative text-[var(--text-primary)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
                  {deviceCheckStep ? 'Pre-Interview Device Check' : 'Configure Mock Interview'}
                </h3>
              </div>
              <button
                onClick={() => {
                  stopMediaTracks();
                  setShowSetupModal(false);
                }}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!deviceCheckStep ? (
              /* Step 1: Configuration Form */
              <div className="space-y-5 text-xs">
                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="font-bold text-[var(--text-primary)] block">Target Role</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {INTERVIEW_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role);
                          setIsCustomRole(false);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition font-semibold ${
                          !isCustomRole && selectedRole === role
                            ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-sm'
                            : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsCustomRole(true)}
                      className={`p-2.5 rounded-xl border text-left transition font-semibold ${
                        isCustomRole
                          ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
                          : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Custom Role...
                    </button>
                  </div>
                  {isCustomRole && (
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="e.g. DevOps Engineer, Machine Learning Engineer"
                      className="w-full mt-2 p-2.5 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-sans"
                    />
                  )}
                </div>

                {/* Difficulty & Question Count */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-[var(--text-primary)] block">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setDifficulty(lvl)}
                          className={`p-2 rounded-xl border capitalize text-center font-semibold transition ${
                            difficulty === lvl
                              ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
                              : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-[var(--text-primary)] block">Number of Questions</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([5, 10, 15] as const).map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setQuestionCount(count)}
                          className={`p-2 rounded-xl border text-center font-semibold transition ${
                            questionCount === count
                              ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
                              : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {count} Questions
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-[var(--text-primary)] block">Included Categories</label>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {selectedCategories.length} selected
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {QUESTION_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => handleToggleCategory(cat.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                            isSelected
                              ? 'bg-[var(--bg-card)] border-[var(--primary)]/60 text-[var(--text-primary)]'
                              : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)] opacity-60'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition ${
                              isSelected
                                ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                                : 'border-[var(--border)] bg-[var(--bg-base)]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold block text-xs">{cat.label}</span>
                            <span className="text-[10px] text-[var(--text-muted)] block leading-tight">
                              {cat.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Duration & Prep Timer */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-[var(--text-primary)] block">Interview Duration</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDurationMinutes(mins)}
                          className={`p-2 rounded-xl border text-center font-semibold transition ${
                            durationMinutes === mins
                              ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
                              : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-[var(--text-primary)] block">Prep Timer Per Question</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { sec: 0, label: 'Off' },
                        { sec: 30, label: '30s' },
                        { sec: 60, label: '60s' }
                      ].map((item) => (
                        <button
                          key={item.sec}
                          type="button"
                          onClick={() => setPrepTimerSeconds(item.sec)}
                          className={`p-2 rounded-xl border text-center font-semibold transition ${
                            prepTimerSeconds === item.sec
                              ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
                              : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Resume Source */}
                <div className="space-y-2">
                  <label className="font-bold text-[var(--text-primary)] block">
                    Resume Context for Project Questions
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-sans"
                  >
                    <option value="profile">
                      Use Profile Skills ({user.skills?.join(', ') || 'General Engineering'})
                    </option>
                    {availableResumes.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.fileName} (Uploaded {new Date(res.uploadedAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interview Mode Choice */}
                <div className="space-y-2">
                  <label className="font-bold text-[var(--text-primary)] block">Interview Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInterviewMode('video_audio')}
                      className={`p-3 rounded-xl border text-left transition flex items-center space-x-3 ${
                        interviewMode === 'video_audio'
                          ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
                          : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Video className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <span className="font-bold block">Video & Audio Mode</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">Webcam + microphone speech</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInterviewMode('text')}
                      className={`p-3 rounded-xl border text-left transition flex items-center space-x-3 ${
                        interviewMode === 'text'
                          ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
                          : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <FileText className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <span className="font-bold block">Text-Only Mode</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">No camera or mic required</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Next Step / Launch Action */}
                <div className="pt-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      stopMediaTracks();
                      setShowSetupModal(false);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition"
                  >
                    Cancel
                  </button>

                  {interviewMode === 'video_audio' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeviceCheckStep(true);
                        handleEnableDevices();
                      }}
                      className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl transition flex items-center space-x-2"
                    >
                      <span>Proceed to Device Check</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLaunchInterview}
                      disabled={starting}
                      className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl transition flex items-center space-x-2"
                    >
                      {starting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Compiling Questions...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Start Text-Only Interview</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Device Check Screen */
              <div className="space-y-5 text-xs">
                <div className="p-3.5 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] space-y-2 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  <div className="flex items-center space-x-2 text-[var(--text-primary)] font-bold">
                    <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                    <span>Informed Consent & Device Privacy</span>
                  </div>
                  <p>
                    Camera and microphone access is requested strictly to simulate a live video placement interview and measure verbal pacing. 
                    Your video and audio streams are processed locally in your browser and are <strong>never recorded, uploaded, or stored</strong>. 
                    Camera access requires browser permission and a secure context (HTTPS or localhost).
                  </p>
                </div>

                {/* Video Preview and Mic Meter */}
                <div className="grid sm:grid-cols-12 gap-4">
                  {/* Camera Window */}
                  <div className="sm:col-span-8 space-y-2">
                    <div className="relative aspect-video bg-[var(--bg-base)] rounded-2xl overflow-hidden border border-[var(--border)] flex items-center justify-center">
                      <video
                        ref={videoPreviewRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform scale-x-[-1] ${
                          cameraPermission === 'granted' && isCameraOn ? 'block' : 'hidden'
                        }`}
                      />

                      {(cameraPermission !== 'granted' || !isCameraOn) && (
                        <div className="text-center p-6 space-y-2">
                          <VideoOff className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
                          <p className="text-xs text-[var(--text-muted)] font-mono">
                            {cameraPermission === 'denied'
                              ? 'Camera permission denied or device not found'
                              : !isCameraOn
                              ? 'Camera feed paused'
                              : 'Camera standby'}
                          </p>
                        </div>
                      )}

                      {/* HUD corners */}
                      {cameraPermission === 'granted' && isCameraOn && (
                        <>
                          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[var(--primary)] pointer-events-none" />
                          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[var(--primary)] pointer-events-none" />
                          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[var(--primary)] pointer-events-none" />
                          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[var(--primary)] pointer-events-none" />
                        </>
                      )}
                    </div>

                    {/* Camera and Mic Control Buttons */}
                    {cameraPermission === 'granted' && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleToggleCamera}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center space-x-1.5 transition"
                        >
                          {isCameraOn ? <Video className="w-3.5 h-3.5 text-[var(--primary)]" /> : <VideoOff className="w-3.5 h-3.5" />}
                          <span>{isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleMic}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center space-x-1.5 transition"
                        >
                          {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-[var(--danger)]" /> : <Mic className="w-3.5 h-3.5 text-[var(--primary)]" />}
                          <span>{isMicMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Audio Status Column */}
                  <div className="sm:col-span-4 bg-[var(--bg-base)] p-4 rounded-2xl border border-[var(--border)] space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <span className="font-bold text-[var(--text-primary)] block font-display">Audio Telemetry</span>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                          <span>Live Input Level</span>
                          <span className="font-bold text-[var(--primary)]">{micVolume}%</span>
                        </div>
                        {/* Working Microphone Level Meter */}
                        <div className="w-full bg-[var(--border)] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] h-full transition-all duration-75"
                            style={{ width: `${isMicMuted ? 0 : micVolume}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-[10px] font-mono space-y-1 text-[var(--text-muted)]">
                        <div className="flex justify-between">
                          <span>Mic Status:</span>
                          <span className={cameraPermission === 'granted' && !isMicMuted ? 'text-[var(--primary)] font-bold' : 'text-[var(--warning)]'}>
                            {cameraPermission === 'granted' ? (isMicMuted ? 'MUTED' : 'ONLINE') : 'STANDBY'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Speech Engine:</span>
                          <span className="text-[var(--text-secondary)]">Web Audio API</span>
                        </div>
                      </div>
                    </div>

                    {cameraPermission !== 'granted' && (
                      <button
                        type="button"
                        onClick={handleEnableDevices}
                        className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl transition flex items-center justify-center space-x-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>Enable Camera & Mic</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Device Error Notification */}
                {deviceError && (
                  <div className="p-3 rounded-xl bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{deviceError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInterviewMode('text')}
                      className="underline font-bold text-[10px] ml-2 flex-shrink-0"
                    >
                      Switch to Text-Only
                    </button>
                  </div>
                )}

                {/* Modal Footer Controls */}
                <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setDeviceCheckStep(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition"
                  >
                    Back to Config
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInterviewMode('text');
                        handleLaunchInterview();
                      }}
                      className="px-3.5 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-semibold"
                    >
                      Skip to Text Mode
                    </button>

                    <button
                      type="button"
                      onClick={handleLaunchInterview}
                      disabled={starting}
                      className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl transition flex items-center space-x-2 shadow-lg shadow-[var(--primary)]/20"
                    >
                      {starting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Initializing Interview...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Start Live Interview</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
