import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Award,
  ChevronRight,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Mic,
  MicOff,
  ArrowLeft,
  AlertCircle,
  Clock,
  Activity,
  Gauge,
  RotateCcw,
  Radio
} from 'lucide-react';
import { MockInterview as InterviewType, AnswerEvaluation } from '../types.js';
import { api } from '../lib/api.js';
import { sound } from '../lib/sound.js';

interface MockInterviewProps {
  interviewId: string;
  onNavigate: (view: string) => void;
}

// Regex for common verbal filler words and phrases
const FILLER_WORD_REGEX = /\b(um|uh|like|you know|basically|actually|literally|so yeah|sort of|kind of|i mean)\b/gi;

function countFillerWords(text: string): number {
  if (!text) return 0;
  const matches = text.match(FILLER_WORD_REGEX);
  return matches ? matches.length : 0;
}

function calculateWPM(text: string, durationSeconds: number): number {
  if (!text || durationSeconds < 3) return 0;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = durationSeconds / 60;
  return Math.round(wordCount / minutes);
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function AudioSpectrumVisualizer({ isActive, isAi = false }: { isActive: boolean; isAi?: boolean }) {
  return (
    <div className="flex items-center gap-1 bg-[var(--bg-base)]/90 px-3 py-1.5 rounded-full border border-[var(--border)]">
      <span className={`w-1 rounded-full ${isActive ? (isAi ? 'bg-[var(--primary)] animate-wave-1' : 'bg-[var(--danger)] animate-wave-1') : 'bg-[var(--border)]'} h-3`} />
      <span className={`w-1 rounded-full ${isActive ? (isAi ? 'bg-[var(--accent)] animate-wave-2' : 'bg-[var(--warning)] animate-wave-2') : 'bg-[var(--border)]'} h-4`} />
      <span className={`w-1 rounded-full ${isActive ? (isAi ? 'bg-[var(--primary)] animate-wave-3' : 'bg-[var(--danger)] animate-wave-3') : 'bg-[var(--border)]'} h-3`} />
      <span className={`w-1 rounded-full ${isActive ? (isAi ? 'bg-[var(--accent)] animate-wave-4' : 'bg-[var(--warning)] animate-wave-4') : 'bg-[var(--border)]'} h-5`} />
      <span className={`w-1 rounded-full ${isActive ? (isAi ? 'bg-[var(--primary)] animate-wave-5' : 'bg-[var(--danger)] animate-wave-5') : 'bg-[var(--border)]'} h-2`} />
      <span className="text-[10px] font-mono text-[var(--text-secondary)] ml-1.5 font-medium">
        {isActive ? (isAi ? 'AI Speaking' : 'Voice Input Active') : 'Audio Standby'}
      </span>
    </div>
  );
}

export default function MockInterview({ interviewId, onNavigate }: MockInterviewProps) {
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingFeedback, setStreamingFeedback] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Voice recording & Web Speech API states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // AI Interviewer Text-to-Speech (TTS)
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Candidate Webcam
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // References for Web Speech API continuous session
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const baseAnswerRef = useRef('');

  // 1. Initial Load of interview
  useEffect(() => {
    api.get(`/api/interview/${interviewId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.interview) {
          setInterview(data.interview);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [interviewId]);

  // 2. Check Web Speech API support
  useEffect(() => {
    const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setSpeechSupported(supported);
  }, []);

  // 3. Question Elapsed Timer (resets on index change)
  useEffect(() => {
    if (!interview || interview.status === 'completed') return;
    setQuestionSeconds(0);
    const interval = setInterval(() => {
      setQuestionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [interview?.currentQuestionIndex, interview?.status]);

  // 4. Recording Timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // 5. Text-To-Speech: Speak question when active question changes
  const activeQuestion = interview && interview.status !== 'completed' ? interview.questions[interview.currentQuestionIndex] : '';

  useEffect(() => {
    if (!activeQuestion || !ttsEnabled) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeQuestion);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick high-quality English voice if present
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))
      ) || voices.find((v) => v.lang.startsWith('en'));
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [activeQuestion, ttsEnabled]);

  // Replay question audio helper
  const handleReplayQuestionAudio = () => {
    if (!activeQuestion || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeQuestion);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // 6. Candidate Webcam Preview Handling
  useEffect(() => {
    let isMounted = true;

    if (isCameraOn && interview && interview.status !== 'completed') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false
          })
          .then((stream) => {
            if (!isMounted) {
              stream.getTracks().forEach((track) => track.stop());
              return;
            }
            streamRef.current = stream;
            setCameraError(null);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn('Camera stream error:', err);
            if (isMounted) {
              setCameraError('Camera access not granted or unavailable.');
              setIsCameraOn(false);
            }
          });
      } else {
        setCameraError('Webcam API is not supported in this browser.');
        setIsCameraOn(false);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraOn, interview?.status]);

  // 7. Toggle Real Speech Recognition
  const handleToggleRecording = () => {
    setSpeechError(null);

    if (isRecording) {
      // STOP recording
      sound.playClick(800);
      isRecordingRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore already stopped
        }
      }
      return;
    }

    // START recording with Web Speech API
    sound.playMicStart();
    if (!speechSupported) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome/Edge or type directly.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      baseAnswerRef.current = currentAnswer;

      recognition.onstart = () => {
        isRecordingRef.current = true;
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + ' ';
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }

        const base = baseAnswerRef.current ? baseAnswerRef.current.trim() + ' ' : '';
        const updated = (base + finalChunk + interimChunk).trimStart();
        setCurrentAnswer(updated);

        if (finalChunk) {
          baseAnswerRef.current = (base + finalChunk).trim();
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
          setIsRecording(false);
          isRecordingRef.current = false;
        } else if (event.error === 'no-speech') {
          // Keep listening or gently report
        } else {
          setSpeechError(`Speech recognition: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          // Auto-restart if user hasn't explicitly stopped it
          try {
            recognition.start();
          } catch (e) {
            setIsRecording(false);
            isRecordingRef.current = false;
          }
        } else {
          setIsRecording(false);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setSpeechError('Failed to initialize speech recognition: ' + err.message);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  // Fallback simulated voice response helper (for offline or simulation testing)
  const handleInsertSimulatedSpeech = () => {
    const currentQ = activeQuestion;
    let simulatedSpeech = '';

    if (currentQ.toLowerCase().includes('scaling')) {
      simulatedSpeech = "To scale database queries, we generally distinguish between vertical scaling, which is upgrading resources on a single node, and horizontal scaling, which involves adding shards or read replicas. PostgreSQL can be vertically scaled easily, but horizontal scaling typically requires tools like PgBouncer for connection pooling or Citus for distributed tables.";
    } else if (currentQ.toLowerCase().includes('project')) {
      simulatedSpeech = "In my portfolio project, I architected a modular component hierarchy using React and Vite. To maintain predictable state transitions, I centralized authentication tokens and active session contexts. I also designed Express API controllers with validated schema boundaries to securely handle data operations.";
    } else if (currentQ.toLowerCase().includes('conflict')) {
      simulatedSpeech = "When technical disagreements arise, I ground discussions in concrete engineering trade-offs and benchmark data. I organize a short collaborative sync to weigh maintainability against execution speed, build quick proof-of-concept benchmarks if necessary, and seek consensus aligned with project milestones.";
    } else {
      simulatedSpeech = "In my engineering coursework and projects, I prioritize modularity, defensive error boundaries, and predictable latency. I ensure API endpoints return standardized JSON envelopes, sanitize all client inputs, and apply automated unit tests to verify critical logic paths.";
    }

    setCurrentAnswer((prev) => (prev ? prev.trim() + ' ' + simulatedSpeech : simulatedSpeech));
  };

  // AbortController cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Calculate live speech metrics
  const fillerCount = countFillerWords(currentAnswer);
  const effectiveSeconds = recordingSeconds > 0 ? recordingSeconds : questionSeconds;
  const liveWPM = calculateWPM(currentAnswer, effectiveSeconds);

  // 8. Submit Answer via Real-Time SSE Streaming
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    setSubmitting(true);
    setIsStreaming(true);
    setStreamingFeedback('');

    // Stop recording if running
    if (isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_e) {
          // speech recognition stopped or unavailable
        }
      }
    }

    // Cancel TTS if speaking
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await api.post(
        `/api/interview/${interviewId}/answer-stream`,
        {
          answer: currentAnswer,
          wordsPerMinute: liveWPM,
          fillerWordCount: fillerCount,
          answerDurationSeconds: questionSeconds
        },
        { signal: abortController.signal }
      );

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to post answer evaluation.`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser or response body is missing.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamOpen = true;

      while (streamOpen) {
        const { done, value } = await reader.read();
        if (done) {
          streamOpen = false;
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const match = block.trim().match(/^data:\s*(.+)$/m);
          if (!match) continue;
          try {
            const payload = JSON.parse(match[1]);
            if (payload.token) {
              setStreamingFeedback((prev) => prev + payload.token);
            }
            if (payload.done) {
              sound.playChime();
              if (payload.interview) {
                setInterview(payload.interview);
                setLastEvaluation(payload.currentEvaluation || null);
                setCurrentAnswer('');
                baseAnswerRef.current = '';
                setQuestionSeconds(0);
                setRecordingSeconds(0);
              }
            }
            if (payload.error) {
              console.warn('Stream notice:', payload.error);
            }
          } catch (parseErr) {
            console.warn('Failed to parse SSE payload:', parseErr);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Answer streaming error:', err);
      alert('Error evaluating answer, please try again.');
    } finally {
      setSubmitting(false);
      setIsStreaming(false);
      setStreamingFeedback('');
    }
  };

  // Keyboard shortcut listener: Cmd/Ctrl + Enter to submit answer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && currentAnswer.trim() && !submitting) {
        e.preventDefault();
        handleSubmitAnswer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentAnswer, submitting, liveWPM, fillerCount, questionSeconds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[var(--bg-base)]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] text-xs font-semibold font-mono">Loading placement simulation session...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 bg-[var(--bg-base)] text-[var(--text-primary)]">
        <AlertCircle className="w-12 h-12 text-[var(--danger)] mx-auto" />
        <h4 className="font-bold text-[var(--text-primary)] font-display">Interview Session Not Found</h4>
        <button
          onClick={() => onNavigate('interview-prep')}
          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs px-4 py-2 rounded-lg transition"
        >
          Return to Preparation Home
        </button>
      </div>
    );
  }

  const isCompleted = interview.status === 'completed';
  const qCount = interview.questions.length;
  const currentIdx = interview.currentQuestionIndex;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-[var(--text-primary)]">
      {/* Top Header / Exit Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            onNavigate('interview-prep');
          }}
          className="inline-flex items-center space-x-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Interview Session</span>
        </button>
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-bold text-[var(--text-muted)] font-mono uppercase">
            ROLE: <span className="text-[var(--primary)]">{interview.jobRole}</span>
          </span>
          <span className="text-[var(--border)]">|</span>
          <span className="text-[10px] font-bold text-[var(--text-muted)] font-mono uppercase">
            SESSION: {interviewId.slice(0, 10).toUpperCase()}
          </span>
        </div>
      </div>

      {!isCompleted ? (
        /* ACTIVE INTERVIEW LAYOUT */
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main Interview Q&A Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Progress & Live Timer bar */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold font-mono text-[var(--text-muted)] uppercase">Question Progress</span>
                  <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                    {currentIdx + 1} of {qCount}
                  </span>
                </div>

                {/* Per-Question Elapsed Timer */}
                <div className="flex items-center space-x-1.5 bg-[var(--bg-base)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
                    {formatTime(questionSeconds)}
                  </span>
                </div>
              </div>

              <div className="w-full bg-[var(--bg-base)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[image:var(--gradient-brand)] h-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / qCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Screen Card */}
            <div className="double-bezel-shell">
              <div className="double-bezel-core bg-[var(--bg-card)] border border-[var(--border)] p-6 sm:p-8 space-y-6 relative overflow-hidden">
                {/* Subtle AI Ambient Glow */}
                {isSpeaking && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] animate-pulse" />
                )}

                {/* Question Header with AI Voice controls */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {interview.followUpQuestions?.includes(activeQuestion) ? (
                      <div className="inline-flex items-center space-x-1.5 bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono shadow-sm">
                        <Sparkles className="w-3 h-3 text-[var(--warning)] animate-spin" />
                        <span>Follow-Up Question</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1.5 bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono">
                        <Radio className="w-3 h-3 text-[var(--primary)] animate-pulse" />
                        <span>Core Assessment Prompt</span>
                      </div>
                    )}

                    {/* Audio Spectrum Indicator */}
                    <AudioSpectrumVisualizer isActive={isSpeaking || isRecording} isAi={isSpeaking} />
                  </div>

                  {/* AI Audio Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleReplayQuestionAudio}
                      aria-label="Replay question audio"
                      title="Replay AI voice question"
                      className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] transition shadow-sm"
                    >
                      <Volume2 className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
                    </button>

                    <button
                      onClick={() => {
                        if (ttsEnabled) {
                          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                          }
                          setIsSpeaking(false);
                        }
                        setTtsEnabled(!ttsEnabled);
                      }}
                      aria-label={ttsEnabled ? 'Mute AI voice readout' : 'Unmute AI voice readout'}
                      title={ttsEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
                      className={`p-1.5 rounded-lg border transition ${
                        ttsEnabled
                          ? 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          : 'bg-[var(--danger-soft)] border-[var(--danger)]/30 text-[var(--danger)]'
                      }`}
                    >
                      {ttsEnabled ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Spoken Question Text */}
                <h3 className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] leading-relaxed font-heading tracking-[-0.02em]">
                  "{activeQuestion}"
                </h3>

              {/* Text / Speech Input Block */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-medium">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                    Your Response
                  </span>
                  {isRecording && (
                    <span className="text-[var(--danger)] font-mono text-xs flex items-center space-x-1.5 bg-[var(--danger-soft)] border border-[var(--danger)]/30 px-2 py-0.5 rounded-md">
                      <span className="w-2 h-2 rounded-full bg-[var(--danger)] animate-ping" />
                      <span>Recording: {formatTime(recordingSeconds)}</span>
                    </span>
                  )}
                </div>

                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Speak into your microphone or type your response here. Articulate your reasoning, technical architecture, and real project trade-offs..."
                  className="w-full h-44 p-4 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary)] leading-relaxed bg-[var(--bg-base)] text-[var(--text-primary)] resize-none font-sans placeholder-[var(--text-muted)] transition"
                />

                {/* Speech Error Banner if any */}
                {speechError && (
                  <div className="p-2.5 rounded-lg bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-[var(--warning)]" />
                    <span>{speechError}</span>
                  </div>
                )}

                {/* Live Speech Analytics Badges */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Words Count & WPM */}
                  <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center space-x-1 text-[10px] text-[var(--text-muted)] font-mono">
                      <Gauge className="w-3 h-3 text-[var(--primary)]" />
                      <span>Pacing / WPM</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">
                      {liveWPM > 0 ? (
                        <span>
                          {liveWPM} <span className="text-[10px] font-normal text-[var(--text-muted)]">WPM</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">--</span>
                      )}
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] block">
                      {liveWPM === 0
                        ? 'Speak/type to measure'
                        : liveWPM >= 120 && liveWPM <= 160
                        ? '✅ Optimal Pace'
                        : liveWPM < 120
                        ? '🐢 Deliberate'
                        : '⚡ Fast'}
                    </span>
                  </div>

                  {/* Filler Words */}
                  <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center space-x-1 text-[10px] text-[var(--text-muted)] font-mono">
                      <Activity className="w-3 h-3 text-[var(--accent)]" />
                      <span>Filler Words</span>
                    </div>
                    <div className="text-sm font-bold font-mono mt-0.5">
                      <span className={fillerCount > 3 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}>
                        {fillerCount}
                      </span>
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] block">
                      {fillerCount === 0 ? '✨ Crisp & Clean' : fillerCount <= 3 ? 'Acceptable' : 'High frequency'}
                    </span>
                  </div>

                  {/* Word Count */}
                  <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center space-x-1 text-[10px] text-[var(--text-muted)] font-mono">
                      <MessageSquare className="w-3 h-3 text-[var(--accent)]" />
                      <span>Word Count</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">
                      {currentAnswer.trim().split(/\s+/).filter(Boolean).length}
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] block">
                      Target: 40-150 words
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center space-x-2">
                    {/* Primary Voice Input Toggle */}
                    <button
                      onClick={handleToggleRecording}
                      aria-label={isRecording ? 'Stop voice input recording' : 'Start voice input dictation'}
                      className={`inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm ${
                        isRecording
                          ? 'bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] animate-pulse'
                          : 'bg-transparent hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 text-[var(--danger)]" aria-hidden="true" />
                          <span>Stop Voice Input</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
                          <span>Start Voice Dictation</span>
                        </>
                      )}
                    </button>

                    {/* Fallback Sample Voice Helper */}
                    <button
                      onClick={handleInsertSimulatedSpeech}
                      aria-label="Insert sample answer template"
                      title="Quickly fill a realistic answer template"
                      className="inline-flex items-center space-x-1 text-[11px] font-medium px-3 py-2 rounded-xl bg-transparent hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden="true" />
                      <span>Sample Answer</span>
                    </button>
                  </div>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !currentAnswer.trim()}
                    className="inline-flex items-center space-x-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-2.5 rounded-xl transition active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isStreaming ? 'Streaming Evaluation...' : 'Evaluating Answer...'}</span>
                      </>
                    ) : (
                      <>
                        <span>Submit & Next Question</span>
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/20 font-mono text-[9px] text-white/90">⌘+↵</kbd>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Webcam Preview + Last Question Feedback */}
        <div className="lg:col-span-4 space-y-6">
            {/* Live Candidate Webcam Tile (Sci-Fi HUD) */}
            <div className="spotlight-card bg-[var(--bg-card)] border border-[var(--border)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Candidate Telemetry Feed
                  </span>
                </div>
                <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded transition"
                  aria-label={isCameraOn ? 'Turn off camera feed' : 'Turn on camera feed'}
                  title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isCameraOn ? <Video className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" /> : <VideoOff className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />}
                </button>
              </div>

              {/* Video Element Window with Reticles */}
              <div className="relative aspect-video bg-[var(--bg-base)] rounded-xl overflow-hidden border border-[var(--border)] flex items-center justify-center">
                {/* HUD Corner Reticles */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[var(--primary)]/70 pointer-events-none z-10" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[var(--primary)]/70 pointer-events-none z-10" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[var(--primary)]/70 pointer-events-none z-10" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[var(--primary)]/70 pointer-events-none z-10" />

                {isCameraOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <VideoOff className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">Camera feed is paused</p>
                  </div>
                )}

                {/* Live Telemetry Overlays */}
                {isCameraOn && (
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                    <div className="bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono text-[var(--accent)] flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                      <span>48kHz • LIVE HUD</span>
                    </div>
                    <div className="bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono text-[var(--text-secondary)]">
                      {isRecording ? 'MIC: ACTIVE' : 'MIC: READY'}
                    </div>
                  </div>
                )}
              </div>

              {cameraError && (
                <p className="text-[10px] text-[var(--warning)] font-mono leading-tight">
                  ⚠️ {cameraError}
                </p>
              )}
            </div>

            {/* Last Question Feedback Sidebar */}
            <div className="glass-panel bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] rounded-2xl p-5 space-y-4" aria-live="polite" aria-atomic="true">
              <h5 className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
                {isStreaming ? 'Live AI Evaluation' : 'Last Question Evaluation'}
              </h5>

              {isStreaming ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center space-x-2 text-[var(--primary)] font-mono text-[11px] pb-2 border-b border-[var(--border)]">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                    <span className="font-bold">AI Assessor Thinking...</span>
                  </div>
                  {streamingFeedback ? (
                    <div className="space-y-2">
                      <span className="text-[var(--text-secondary)] font-bold block text-[11px]">Real-Time Feedback:</span>
                      <div className="bg-[var(--bg-base)] p-3.5 rounded-xl border border-[var(--primary)]/30 text-[var(--text-primary)] leading-relaxed font-sans text-xs">
                        <span>{streamingFeedback}</span>
                        <span className="inline-block w-1.5 h-3.5 bg-[var(--primary)] ml-1 animate-pulse align-middle" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 py-3">
                      <div className="h-3 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent)]/20 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10 rounded animate-pulse w-full" />
                      <div className="h-3 bg-gradient-to-r from-[var(--primary)]/15 to-[var(--accent)]/15 rounded animate-pulse w-5/6" />
                      <p className="text-[10px] text-[var(--text-muted)] font-mono italic pt-2">
                        Analyzing technical accuracy, delivery structure & clarity...
                      </p>
                    </div>
                  )}
                </div>
              ) : lastEvaluation ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <span className="text-[var(--text-secondary)]">Score Earned:</span>
                    <span className="font-mono font-bold text-[var(--primary)] text-sm">
                      {lastEvaluation.score} / 10
                    </span>
                  </div>

                  {/* Speech Metrics Pills */}
                  {(lastEvaluation.wordsPerMinute !== undefined || lastEvaluation.fillerWordCount !== undefined) && (
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                      {lastEvaluation.wordsPerMinute !== undefined && (
                        <span className="bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] px-2 py-0.5 rounded-md">
                          {lastEvaluation.wordsPerMinute} WPM
                        </span>
                      )}
                      {lastEvaluation.fillerWordCount !== undefined && (
                        <span className="bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] px-2 py-0.5 rounded-md">
                          {lastEvaluation.fillerWordCount} Fillers
                        </span>
                      )}
                      {lastEvaluation.answerDurationSeconds !== undefined && (
                        <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md">
                          {formatTime(lastEvaluation.answerDurationSeconds)}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[var(--text-secondary)] font-bold block">Assessor Review:</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-base)] p-3 rounded-xl border border-[var(--border)]">
                      {lastEvaluation.feedback}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-[var(--bg-base)] p-2 rounded-xl border border-[var(--border)] text-center">
                      <span className="block text-[10px] text-[var(--text-muted)]">Tech Score</span>
                      <span className="font-bold font-mono text-[var(--text-primary)] text-xs">{lastEvaluation.technicalScore}/10</span>
                    </div>
                    <div className="bg-[var(--bg-base)] p-2 rounded-xl border border-[var(--border)] text-center">
                      <span className="block text-[10px] text-[var(--text-muted)]">Comm Score</span>
                      <span className="font-bold font-mono text-[var(--text-primary)] text-xs">{lastEvaluation.communicationScore}/10</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-[var(--text-muted)] space-y-2">
                  <Video className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                  <p className="text-[10px]">Submit your first answer to unlock immediate AI scoring breakdowns.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* COMPLETED PLACEMENT READINESS REPORT CARD */
        <div className="space-y-8">
          {/* Header overall congratulations card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[var(--primary)]/10 via-[var(--accent)]/5 to-transparent rounded-full blur-3xl -mr-24 -mt-24" />

            <div className="relative max-w-3xl space-y-4">
              <div className="inline-flex items-center space-x-1.5 bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                <span>Placement Readiness Assessment Compiled</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-[var(--text-primary)]">
                AI Placement Evaluation Report
              </h3>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm leading-relaxed">
                {interview.feedbackText}
              </p>
            </div>
          </div>

          {/* 4 Score dials row */}
          <div className="grid sm:grid-cols-4 gap-6">
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl text-center space-y-3">
              <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono tracking-wider">Overall Placement Ready</span>
              <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-[image:var(--gradient-brand)] font-mono block">{interview.overallScore}%</span>
              <span className="block text-[9px] text-[var(--text-muted)]">Combined percentile metric</span>
            </div>

            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl text-center space-y-3">
              <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono tracking-wider">Technical Accuracy</span>
              <span className="text-4xl font-extrabold text-[var(--primary)] font-mono block">{interview.technicalScore}%</span>
              <span className="block text-[9px] text-[var(--text-muted)]">Core software theory matches</span>
            </div>

            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl text-center space-y-3">
              <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono tracking-wider">Communication Structure</span>
              <span className="text-4xl font-extrabold text-[var(--accent)] font-mono block">{interview.communicationScore}%</span>
              <span className="block text-[9px] text-[var(--text-muted)]">Wording and articulation index</span>
            </div>

            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl text-center space-y-3">
              <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono tracking-wider">Confidence & Clarity</span>
              <span className="text-4xl font-extrabold text-[var(--primary)] font-mono block">{interview.confidenceScore}%</span>
              <span className="block text-[9px] text-[var(--text-muted)]">Composure and delivery metrics</span>
            </div>
          </div>

          {/* Suggestions and Full Q&A details */}
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6 h-fit">
              <div className="border-b border-[var(--border)] pb-3">
                <h4 className="font-bold text-[var(--text-primary)] text-sm font-display">Critical Placement Improvements</h4>
              </div>
              <div className="space-y-3">
                {interview.suggestions && interview.suggestions.map((item, i) => (
                  <div key={i} className="flex items-start space-x-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-2 flex-shrink-0" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual logs with evaluations & speech metrics */}
            <div className="lg:col-span-7 glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
              <div className="border-b border-[var(--border)] pb-3 flex justify-between items-center">
                <h4 className="font-bold text-[var(--text-primary)] text-sm font-display">Individual Assessment Logs</h4>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Question Breakdown</span>
              </div>

              <div className="space-y-6">
                {interview.answers.map((item, idx) => (
                  <div key={idx} className="space-y-3 bg-[var(--bg-base)] p-4 border border-[var(--border)] rounded-xl">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 max-w-[80%]">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-[var(--text-primary)] leading-tight font-display">
                            Q{idx + 1}: "{item.question}"
                          </span>
                          {interview.followUpQuestions?.includes(item.question) && (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] flex-shrink-0">
                              <Sparkles className="w-2.5 h-2.5 text-[var(--warning)]" />
                              <span>Follow-Up</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {item.evaluation && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] rounded-md">
                          {item.evaluation.score}/10
                        </span>
                      )}
                    </div>

                    {/* Speech Analytics badges for this answer if recorded */}
                    {item.evaluation && (item.evaluation.wordsPerMinute !== undefined || item.evaluation.fillerWordCount !== undefined) && (
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono pt-0.5">
                        {item.evaluation.wordsPerMinute !== undefined && (
                          <span className="bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] px-2 py-0.5 rounded-md">
                            🗣️ {item.evaluation.wordsPerMinute} WPM
                          </span>
                        )}
                        {item.evaluation.fillerWordCount !== undefined && (
                          <span className="bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] px-2 py-0.5 rounded-md">
                            ⚠️ {item.evaluation.fillerWordCount} filler words
                          </span>
                        )}
                        {item.evaluation.answerDurationSeconds !== undefined && (
                          <span className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] px-2 py-0.5 rounded-md">
                            ⏱️ {formatTime(item.evaluation.answerDurationSeconds)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block font-mono">Your Answer:</span>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans italic bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border)]">
                        "{item.answer}"
                      </p>
                    </div>

                    {item.evaluation && (
                      <div className="space-y-2 pt-1 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
                        <span className="font-bold text-[var(--text-primary)] block">Assessor Review:</span>
                        <p className="leading-relaxed">{item.evaluation.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
