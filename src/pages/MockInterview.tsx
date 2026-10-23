import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Award,
  ChevronRight,
  ChevronLeft,
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
  Radio,
  Code2,
  FileText,
  Printer,
  Save,
  SkipForward,
  Check,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { MockInterview as InterviewType, AnswerEvaluation, StructuredQuestion, InterviewAnswer } from '../types.js';
import { api } from '../lib/api.js';
import { sound } from '../lib/sound.js';
import { evaluateAnswerSubmission, compileFinalReport } from '../lib/evaluationService.js';
import { BUILT_IN_QUESTION_BANK } from '../lib/questionBank.js';

interface MockInterviewProps {
  interviewId: string;
  onNavigate: (view: string, targetId?: string) => void;
}

const LANGUAGE_TEMPLATES: Record<string, string> = {
  java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  python: `def solution():\n    # Write your solution here\n    pass`,
  javascript: `function solution() {\n    // Write your solution here\n}`,
  typescript: `function solution(): void {\n    // Write your solution here\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  csharp: `using System;\n\npublic class Solution {\n    public static void Main(string[] args) {\n        // Write your solution here\n    }\n}`
};

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
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function MockInterview({ interviewId, onNavigate }: MockInterviewProps) {
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Per-question state mapping (index -> { text, code, language, evaluation, skipped })
  const [draftAnswers, setDraftAnswers] = useState<
    Record<number, { text: string; code: string; language: string; skipped?: boolean; evaluation?: AnswerEvaluation }>
  >({});

  // Question navigation & submission
  const [evaluatingCurrent, setEvaluatingCurrent] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'code'>('text');

  // Timers
  const [remainingTotalSeconds, setRemainingTotalSeconds] = useState<number>(30 * 60);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number>(0);
  const [questionSeconds, setQuestionSeconds] = useState<number>(0);

  // Voice recording & Web Speech API
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Camera & Audio Telemetry
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AI TTS
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  // 1. Initial Load of interview (Server or Local Fallback)
  useEffect(() => {
    let isMounted = true;

    // Check local storage first for instant response
    let localData: InterviewType | null = null;
    try {
      const stored = localStorage.getItem(`mock_interview_${interviewId}`);
      if (stored) localData = JSON.parse(stored);
    } catch (_e) {
      // ignore
    }

    api.get(`/api/interview/${interviewId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        const normalized = data ? (data.interview || (data.id ? data : null)) : null;
        if (normalized) {
          applyInterviewData(normalized);
        } else if (localData) {
          applyInterviewData(localData);
        } else {
          // Fallback question generation if session wasn't found anywhere
          applyFallbackInterview();
        }
      })
      .catch((err) => {
        console.warn('Could not fetch interview from backend, checking local storage:', err);
        if (localData && isMounted) {
          applyInterviewData(localData);
        } else if (isMounted) {
          applyFallbackInterview();
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      stopMediaTracks();
    };
  }, [interviewId]);

  const applyInterviewData = (data: any) => {
    // Reconstruct structured questions if only string questions exist
    let structured: StructuredQuestion[] = Array.isArray(data.structuredQuestions) && data.structuredQuestions.length > 0
      ? data.structuredQuestions
      : [];

    const stringQuestions: string[] = Array.isArray(data.questions) ? data.questions : [];

    if (structured.length === 0 && stringQuestions.length > 0) {
      structured = stringQuestions.map((qStr, idx) => {
        const foundInBank = BUILT_IN_QUESTION_BANK.find((b) => b.question.toLowerCase() === qStr.toLowerCase());
        if (foundInBank) return foundInBank;

        const isCoding = qStr.toLowerCase().includes('write a program') || qStr.toLowerCase().includes('java program') || qStr.toLowerCase().includes('reverse a string');
        const isResume = qStr.toLowerCase().includes('project') || qStr.toLowerCase().includes('bug');
        const isBehavioral = qStr.toLowerCase().includes('tell me about') || qStr.toLowerCase().includes('hire you') || qStr.toLowerCase().includes('challenge');
        const isAptitude = qStr.toLowerCase().includes('percentage') || qStr.toLowerCase().includes('sequence') || qStr.toLowerCase().includes('workers');

        return {
          id: `q-auto-${idx + 1}`,
          category: isCoding ? 'coding' : isResume ? 'resume' : isBehavioral ? 'behavioral' : isAptitude ? 'aptitude' : 'technical',
          difficulty: 'intermediate',
          roles: [data.jobRole || 'Software Engineer'],
          question: qStr,
          expectedAnswerPoints: [
            'Clear technical explanation covering core principles.',
            'Mention of time/space complexity or architectural trade-offs.',
            'Practical real-world consideration and edge-case handling.'
          ],
          evaluationCriteria: [
            'Conceptual accuracy and clarity',
            'Completeness of response'
          ],
          codeTemplate: isCoding ? LANGUAGE_TEMPLATES.java : undefined,
          defaultLanguage: isCoding ? 'java' : undefined
        };
      });
    }

    const answersList: InterviewAnswer[] = Array.isArray(data.answers) ? data.answers : [];

    // Pre-populate draft answers mapping
    const newDrafts: Record<number, { text: string; code: string; language: string; skipped?: boolean; evaluation?: AnswerEvaluation }> = {};

    structured.forEach((sq, idx) => {
      const existingAnswer = answersList.find((a) => a.question === sq.question || a.questionId === sq.id) || answersList[idx];
      newDrafts[idx] = {
        text: existingAnswer ? existingAnswer.answer : '',
        code: existingAnswer?.code || sq.codeTemplate || '',
        language: existingAnswer?.language || sq.defaultLanguage || 'java',
        skipped: existingAnswer?.skipped || false,
        evaluation: existingAnswer?.evaluation
      };
    });

    setDraftAnswers(newDrafts);

    const intvObj: InterviewType = {
      ...data,
      questions: structured.map((s) => s.question),
      structuredQuestions: structured,
      answers: answersList,
      currentQuestionIndex: data.status === 'completed' ? 0 : answersList.length < structured.length ? answersList.length : 0,
      durationMinutes: data.durationMinutes || 30,
      prepTimerSeconds: data.prepTimerSeconds || 0,
      status: data.status || (data.overallScore ? 'completed' : 'started')
    };

    setInterview(intvObj);
    setCurrentIdx(intvObj.currentQuestionIndex);
    setRemainingTotalSeconds((intvObj.durationMinutes || 30) * 60);
    setPrepSecondsLeft(intvObj.prepTimerSeconds || 0);
  };

  const applyFallbackInterview = () => {
    const fallbackQuestions = BUILT_IN_QUESTION_BANK.slice(0, 5);
    const newDrafts: Record<number, any> = {};
    fallbackQuestions.forEach((q, idx) => {
      newDrafts[idx] = {
        text: '',
        code: q.codeTemplate || '',
        language: q.defaultLanguage || 'java',
        skipped: false
      };
    });
    setDraftAnswers(newDrafts);

    const fallbackIntv: InterviewType = {
      id: interviewId,
      userId: 'local-user',
      jobRole: 'Full Stack Developer',
      branch: 'Computer Science',
      skills: ['Java', 'React', 'Spring Boot'],
      experienceLevel: 'Intermediate',
      status: 'started',
      questions: fallbackQuestions.map((q) => q.question),
      structuredQuestions: fallbackQuestions,
      currentQuestionIndex: 0,
      answers: [],
      createdAt: new Date().toISOString(),
      durationMinutes: 30,
      prepTimerSeconds: 0
    };

    setInterview(fallbackIntv);
    setRemainingTotalSeconds(30 * 60);
  };

  // 2. Check Speech Recognition Support
  useEffect(() => {
    const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setSpeechSupported(supported);
  }, []);

  // 3. Countdown Timers
  useEffect(() => {
    if (!interview || interview.status === 'completed') return;

    const timer = setInterval(() => {
      setRemainingTotalSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [interview?.status]);

  // Preparation Countdown Timer (per question)
  useEffect(() => {
    if (!interview || interview.status === 'completed' || !interview.prepTimerSeconds) return;

    setPrepSecondsLeft(interview.prepTimerSeconds);
    const prepInterval = setInterval(() => {
      setPrepSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(prepInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(prepInterval);
  }, [currentIdx, interview?.status]);

  // Question Elapsed Timer
  useEffect(() => {
    if (!interview || interview.status === 'completed') return;
    setQuestionSeconds(0);
    const interval = setInterval(() => {
      setQuestionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIdx, interview?.status]);

  // Recording timer
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

  // 4. Camera & Microphone Setup with Volume Telemetry
  useEffect(() => {
    let isMounted = true;

    if (interview && interview.status !== 'completed' && interview.interviewMode !== 'text' && isCameraOn) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: true
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

            // Web Audio API mic level meter
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
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
                animFrameRef.current = requestAnimationFrame(updateMeter);
              };
              updateMeter();
            } catch (_audioErr) {
              // ignore audio analyser error
            }
          })
          .catch((err) => {
            console.warn('Camera/mic telemetry stream error:', err);
            if (isMounted) {
              setCameraError('Camera/microphone preview not active (permission denied or device in use). Text mode is fully available.');
              setIsCameraOn(false);
            }
          });
      } else {
        setCameraError('MediaDevices API not supported in this browser.');
        setIsCameraOn(false);
      }
    }

    return () => {
      isMounted = false;
      stopMediaTracks();
    };
  }, [isCameraOn, interview?.status, interview?.interviewMode]);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
  };

  // 5. Speech-to-Text Toggle
  const handleToggleRecording = () => {
    setSpeechError(null);

    if (isRecording) {
      sound.playClick(800);
      isRecordingRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_e) {
          // ignore
        }
      }
      return;
    }

    sound.playMicStart();
    if (!speechSupported) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your answer.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

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

        setDraftAnswers((prev) => {
          const current = prev[currentIdx] || { text: '', code: '', language: 'java' };
          const base = current.text ? current.text.trim() + ' ' : '';
          return {
            ...prev,
            [currentIdx]: {
              ...current,
              text: (base + finalChunk + interimChunk).trimStart()
            }
          };
        });
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied for speech recognition.');
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (_e) {
            setIsRecording(false);
            isRecordingRef.current = false;
          }
        } else {
          setIsRecording(false);
        }
      };

      recognition.start();
    } catch (err: any) {
      setSpeechError('Failed to initialize speech recognition: ' + err.message);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  // 6. Active Question & TTS Readout
  const structuredQuestions = interview?.structuredQuestions || [];
  const currentQuestion: StructuredQuestion | undefined = structuredQuestions[currentIdx];
  const activeQuestionText = currentQuestion ? currentQuestion.question : '';

  useEffect(() => {
    if (!activeQuestionText || !ttsEnabled) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeQuestionText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

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
  }, [activeQuestionText, ttsEnabled]);

  const handleReplayQuestionAudio = () => {
    if (!activeQuestionText || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeQuestionText);
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Switch default tab if question is coding
  useEffect(() => {
    if (currentQuestion?.category === 'coding') {
      setActiveTab('code');
    } else {
      setActiveTab('text');
    }
  }, [currentIdx, currentQuestion?.category]);

  // Current draft values
  const currentDraft = draftAnswers[currentIdx] || {
    text: '',
    code: currentQuestion?.codeTemplate || '',
    language: currentQuestion?.defaultLanguage || 'java'
  };

  const handleUpdateText = (val: string) => {
    setDraftAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        ...(prev[currentIdx] || { code: '', language: 'java' }),
        text: val,
        skipped: false
      }
    }));
  };

  const handleUpdateCode = (val: string) => {
    setDraftAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        ...(prev[currentIdx] || { text: '', language: 'java' }),
        code: val,
        skipped: false
      }
    }));
  };

  const handleUpdateLanguage = (lang: string) => {
    setDraftAnswers((prev) => {
      const existing = prev[currentIdx] || { text: '', code: '' };
      // If code is empty or untouched template, swap in new language template
      const currentCode = existing.code;
      const isDefault = Object.values(LANGUAGE_TEMPLATES).some((t) => t.trim() === currentCode.trim()) || !currentCode.trim();
      return {
        ...prev,
        [currentIdx]: {
          ...existing,
          language: lang,
          code: isDefault ? (LANGUAGE_TEMPLATES[lang] || '') : currentCode
        }
      };
    });
  };

  // 7. Save Current Question & Optional In-flight Evaluation
  const handleSaveCurrentAnswer = async (advance: boolean = false) => {
    if (!currentQuestion) return;

    if (isRecording) {
      handleToggleRecording();
    }

    setEvaluatingCurrent(true);

    const fillerCount = countFillerWords(currentDraft.text);
    const liveWPM = calculateWPM(currentDraft.text, questionSeconds);

    const evalResult = await evaluateAnswerSubmission({
      interviewId,
      question: currentQuestion,
      answerText: currentDraft.text,
      code: currentDraft.code,
      language: currentDraft.language,
      skipped: false,
      wordsPerMinute: liveWPM,
      fillerWordCount: fillerCount,
      durationSeconds: questionSeconds
    });

    setDraftAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        ...prev[currentIdx],
        evaluation: evalResult,
        skipped: false
      }
    }));

    sound.playChime();
    setEvaluatingCurrent(false);

    if (advance && currentIdx < structuredQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  // 8. Skip Question
  const handleSkipQuestion = () => {
    setDraftAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        text: '[Question Skipped]',
        code: '',
        language: currentDraft.language || 'java',
        skipped: true,
        evaluation: {
          score: 0,
          technicalScore: 0,
          communicationScore: 0,
          confidenceScore: 0,
          grammar: 'N/A',
          clarity: 'Skipped',
          feedback: 'Question was skipped by candidate.',
          strengths: [],
          missingConcepts: currentQuestion ? currentQuestion.expectedAnswerPoints : [],
          improvementSuggestions: ['Revisit this topic in the question review section.'],
          modelAnswerPoints: currentQuestion ? currentQuestion.expectedAnswerPoints : [],
          evaluationSource: 'rubric'
        }
      }
    }));

    if (currentIdx < structuredQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  // 9. Auto-Submit on Timer Expiry
  const handleAutoSubmitOnExpiry = () => {
    handleFinalizeInterview();
  };

  // 10. Final Submission of Mock Interview
  const handleFinalizeInterview = async () => {
    if (!interview) return;
    setSubmittingFinal(true);
    setShowSubmitConfirm(false);
    stopMediaTracks();

    // Prepare complete answers array
    const compiledAnswers: InterviewAnswer[] = [];

    for (let i = 0; i < structuredQuestions.length; i++) {
      const sq = structuredQuestions[i];
      const draft = draftAnswers[i] || { text: '', code: '', language: 'java' };

      let evaluation = draft.evaluation;
      if (!evaluation) {
        // Evaluate now if not evaluated earlier
        evaluation = await evaluateAnswerSubmission({
          interviewId,
          question: sq,
          answerText: draft.text,
          code: draft.code,
          language: draft.language,
          skipped: draft.skipped || (!draft.text.trim() && !draft.code.trim()),
          wordsPerMinute: 0,
          fillerWordCount: countFillerWords(draft.text),
          durationSeconds: 30
        });
      }

      compiledAnswers.push({
        question: sq.question,
        questionId: sq.id,
        category: sq.category,
        difficulty: sq.difficulty,
        answer: draft.text || (draft.skipped ? '[Skipped]' : ''),
        code: draft.code,
        language: draft.language,
        skipped: draft.skipped || (!draft.text.trim() && !draft.code.trim()),
        evaluation,
        expectedAnswerPoints: sq.expectedAnswerPoints,
        evaluationCriteria: sq.evaluationCriteria
      });
    }

    // Compile comprehensive final metrics
    const reportData = compileFinalReport(interview.jobRole, compiledAnswers);

    const updatedInterview: InterviewType = {
      ...interview,
      status: 'completed',
      answers: compiledAnswers,
      overallScore: reportData.overallScore,
      technicalScore: reportData.technicalScore,
      communicationScore: reportData.communicationScore,
      confidenceScore: reportData.confidenceScore,
      categoryScores: reportData.categoryScores,
      questionsAnswered: reportData.questionsAnswered,
      questionsSkipped: reportData.questionsSkipped,
      strongestAreas: reportData.strongestAreas,
      topicsToImprove: reportData.topicsToImprove,
      suggestedPracticeQuestions: reportData.suggestedPracticeQuestions,
      recommendedLearningTopics: reportData.recommendedLearningTopics,
      feedbackText: reportData.feedbackText,
      suggestions: reportData.topicsToImprove
    };

    // Save to server
    try {
      await api.post(`/api/interview/${interviewId}/submit`, {
        ...reportData,
        answers: compiledAnswers
      });
    } catch (err) {
      console.warn('Backend interview submit error, saving to local store:', err);
    }

    // Always persist to localStorage for instant reload & Past Performance Logs
    try {
      localStorage.setItem(`mock_interview_${interviewId}`, JSON.stringify(updatedInterview));
      const userHistory = localStorage.getItem(`mock_history_${interview.userId}`);
      let list = userHistory ? JSON.parse(userHistory) : [];
      list = list.filter((item: any) => item.id !== interviewId);
      list.unshift(updatedInterview);
      localStorage.setItem(`mock_history_${interview.userId}`, JSON.stringify(list));
    } catch (_e) {
      // ignore
    }

    setInterview(updatedInterview);
    setSubmittingFinal(false);
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to Save and Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !evaluatingCurrent && interview?.status !== 'completed') {
        e.preventDefault();
        handleSaveCurrentAnswer(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, currentDraft, evaluatingCurrent, interview?.status]);

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
  const totalQuestions = structuredQuestions.length || 1;
  const answeredCount = Object.values(draftAnswers).filter(
    (d: any) => (d?.text && d.text.trim().length > 0) || (d?.code && d.code.trim().length > 0)
  ).length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-[var(--text-primary)]">
      {/* Top Header / Exit Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <button
          onClick={() => {
            stopMediaTracks();
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
            LEVEL: <span className="text-[var(--accent)]">{interview.experienceLevel}</span>
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
          {/* Main Interview Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Progress & Live Timers Bar */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold font-mono text-[var(--text-muted)] uppercase">Progress:</span>
                  <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                    Question {currentIdx + 1} of {totalQuestions}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    ({answeredCount} answered)
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Preparation Timer (if active) */}
                  {prepSecondsLeft > 0 && (
                    <div className="flex items-center space-x-1.5 bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] px-2.5 py-1 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs font-mono font-bold">Prep: {prepSecondsLeft}s</span>
                    </div>
                  )}

                  {/* Question Elapsed Timer */}
                  <div className="flex items-center space-x-1.5 bg-[var(--bg-base)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
                      {formatTime(questionSeconds)}
                    </span>
                  </div>

                  {/* Overall Session Countdown */}
                  <div className="flex items-center space-x-1.5 bg-[var(--bg-base)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                      Time Left: {formatTime(remainingTotalSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-[var(--bg-base)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] h-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Question Navigation Quick Selector */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
                {structuredQuestions.map((sq, idx) => {
                  const draft = draftAnswers[idx];
                  const hasAnswer = (draft?.text && draft.text.trim().length > 0) || (draft?.code && draft.code.trim().length > 0);
                  const isCurrent = idx === currentIdx;

                  return (
                    <button
                      key={sq.id || idx}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center border ${
                        isCurrent
                          ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-md'
                          : draft?.skipped
                          ? 'bg-[var(--warning-soft)] border-[var(--warning)]/30 text-[var(--warning)]'
                          : hasAnswer
                          ? 'bg-[var(--primary-soft)] border-[var(--primary)]/30 text-[var(--primary)]'
                          : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                      title={`Question ${idx + 1}: ${sq.category}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Screen Card */}
            <div className="double-bezel-shell">
              <div className="double-bezel-core bg-[var(--bg-card)] border border-[var(--border)] p-6 sm:p-8 space-y-6 relative overflow-hidden">
                {/* AI Audio Wave Ambient Indicator */}
                {isSpeaking && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] animate-pulse" />
                )}

                {/* Question Badges & Audio Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Category Badge */}
                    <span className="inline-flex items-center space-x-1.5 bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono">
                      <Radio className="w-3 h-3 text-[var(--primary)] animate-pulse" />
                      <span>{currentQuestion?.category || 'Technical Core'}</span>
                    </span>

                    {/* Difficulty Badge */}
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)]">
                      {currentQuestion?.difficulty || 'Intermediate'}
                    </span>
                  </div>

                  {/* AI Audio Readout Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleReplayQuestionAudio}
                      aria-label="Replay question audio"
                      title="Replay AI voice question"
                      className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] transition shadow-sm"
                    >
                      <Volume2 className="w-4 h-4 text-[var(--primary)]" />
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
                      {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Spoken Question Text */}
                <h3 className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] leading-relaxed font-heading tracking-[-0.02em]">
                  "{activeQuestionText}"
                </h3>

                {/* Question Type Tabs (Text Response vs Code Editor) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('text')}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          activeTab === 'text'
                            ? 'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Verbal / Text Explanation</span>
                      </button>

                      {currentQuestion?.category === 'coding' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('code')}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            activeTab === 'code'
                              ? 'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Code Editor</span>
                        </button>
                      )}
                    </div>

                    {/* Language selector when in coding mode */}
                    {activeTab === 'code' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">Language:</span>
                        <select
                          value={currentDraft.language}
                          onChange={(e) => handleUpdateLanguage(e.target.value)}
                          className="bg-[var(--bg-base)] border border-[var(--border)] text-xs text-[var(--text-primary)] font-mono rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--primary)]"
                        >
                          <option value="java">Java</option>
                          <option value="python">Python</option>
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="cpp">C++</option>
                          <option value="csharp">C#</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Tab 1: Normal Text Response */}
                  {activeTab === 'text' ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-medium">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                          Your Explanation & Reasoning
                        </span>
                        {isRecording && (
                          <span className="text-[var(--danger)] font-mono text-xs flex items-center space-x-1.5 bg-[var(--danger-soft)] border border-[var(--danger)]/30 px-2 py-0.5 rounded-md">
                            <span className="w-2 h-2 rounded-full bg-[var(--danger)] animate-ping" />
                            <span>Dictating: {formatTime(recordingSeconds)}</span>
                          </span>
                        )}
                      </div>

                      <textarea
                        value={currentDraft.text}
                        onChange={(e) => handleUpdateText(e.target.value)}
                        placeholder="Speak into your microphone or type your response here. Articulate your reasoning, technical architecture, and real project trade-offs..."
                        className="w-full h-44 p-4 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary)] leading-relaxed bg-[var(--bg-base)] text-[var(--text-primary)] resize-none font-sans placeholder-[var(--text-muted)] transition"
                      />

                      {speechError && (
                        <div className="p-2.5 rounded-lg bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] text-xs flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{speechError}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Tab 2: Code Editor */
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-medium">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                          Code Solution ({currentDraft.language})
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          Preserved in final report
                        </span>
                      </div>

                      <div className="relative border border-[var(--border)] rounded-xl overflow-hidden bg-[#0d1117]">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)]">
                          <span>solution.{currentDraft.language === 'python' ? 'py' : currentDraft.language === 'javascript' ? 'js' : currentDraft.language === 'typescript' ? 'ts' : currentDraft.language === 'cpp' ? 'cpp' : currentDraft.language === 'csharp' ? 'cs' : 'java'}</span>
                          <span>UTF-8</span>
                        </div>
                        <textarea
                          value={currentDraft.code}
                          onChange={(e) => handleUpdateCode(e.target.value)}
                          placeholder="// Type your code solution here..."
                          className="w-full h-56 p-4 bg-transparent text-[#e6edf3] font-mono text-xs focus:outline-none resize-none leading-relaxed selection:bg-[var(--primary)]/30"
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  )}

                  {/* Navigation and Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
                    {/* Left: Previous / Dictation */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                        disabled={currentIdx === 0}
                        className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleRecording}
                        aria-label={isRecording ? 'Stop voice dictation' : 'Start voice dictation'}
                        className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition ${
                          isRecording
                            ? 'bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] animate-pulse'
                            : 'bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {isRecording ? <MicOff className="w-4 h-4 text-[var(--danger)]" /> : <Mic className="w-4 h-4 text-[var(--primary)]" />}
                        <span>{isRecording ? 'Stop Dictation' : 'Dictate'}</span>
                      </button>
                    </div>

                    {/* Middle: Save / Skip */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSaveCurrentAnswer(false)}
                        disabled={evaluatingCurrent}
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                      >
                        {evaluatingCurrent ? <div className="w-3.5 h-3.5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4 text-[var(--primary)]" />}
                        <span>Save Draft</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSkipQuestion}
                        className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skip</span>
                      </button>
                    </div>

                    {/* Right: Next or Submit */}
                    <div className="flex items-center space-x-2">
                      {currentIdx < totalQuestions - 1 ? (
                        <button
                          type="button"
                          onClick={() => handleSaveCurrentAnswer(true)}
                          disabled={evaluatingCurrent}
                          className="inline-flex items-center space-x-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md active:scale-95"
                        >
                          <span>Save & Next</span>
                          <kbd className="hidden sm:inline-block px-1 py-0.2 rounded bg-white/20 font-mono text-[9px]">⌘+↵</kbd>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowSubmitConfirm(true)}
                          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:opacity-90 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                          <span>Submit Interview</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Camera Tile & Feedback */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Candidate Camera Preview */}
            <div className="spotlight-card bg-[var(--bg-card)] border border-[var(--border)] p-4 space-y-3 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-[var(--accent)] animate-pulse' : 'bg-[var(--text-muted)]'}`} />
                  <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Candidate Telemetry Feed
                  </span>
                </div>
                <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded transition"
                  title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isCameraOn ? <Video className="w-4 h-4 text-[var(--accent)]" /> : <VideoOff className="w-4 h-4 text-[var(--text-muted)]" />}
                </button>
              </div>

              {/* Video Window */}
              <div className="relative aspect-video bg-[var(--bg-base)] rounded-xl overflow-hidden border border-[var(--border)] flex items-center justify-center">
                {/* Reticles */}
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
                  <div className="text-center p-4 space-y-1">
                    <VideoOff className="w-6 h-6 text-[var(--text-muted)] mx-auto" />
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">Camera feed paused</p>
                  </div>
                )}

                {/* Overlays */}
                {isCameraOn && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10 text-[9px] font-mono">
                    <div className="bg-black/75 px-1.5 py-0.5 rounded text-[var(--accent)]">
                      LIVE • 30fps
                    </div>
                    <div className="bg-black/75 px-1.5 py-0.5 rounded text-[var(--text-secondary)]">
                      MIC: {isRecording ? 'RECORDING' : 'READY'}
                    </div>
                  </div>
                )}
              </div>

              {/* Working Audio Level Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>Mic Input</span>
                  <span className="font-bold text-[var(--primary)]">{micVolume}%</span>
                </div>
                <div className="w-full bg-[var(--bg-base)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]">
                  <div
                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] h-full transition-all duration-75"
                    style={{ width: `${isMicMuted ? 0 : micVolume}%` }}
                  />
                </div>
              </div>

              {cameraError && (
                <p className="text-[10px] text-[var(--warning)] font-mono leading-tight">
                  ℹ️ {cameraError}
                </p>
              )}
            </div>

            {/* Answer Feedback / Evaluation Sidebar */}
            <div className="glass-panel bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <h4 className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Current Question Assessment
                </h4>
                {currentDraft.evaluation && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)]">
                    {currentDraft.evaluation.score} / 10
                  </span>
                )}
              </div>

              {currentDraft.evaluation ? (
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block font-mono">
                      Feedback
                    </span>
                    <p className="text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-base)] p-3 rounded-xl border border-[var(--border)]">
                      {currentDraft.evaluation.feedback}
                    </p>
                  </div>

                  {currentDraft.evaluation.strengths && currentDraft.evaluation.strengths.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[var(--primary)] uppercase block font-mono">
                        Strengths
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[var(--text-secondary)]">
                        {currentDraft.evaluation.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentDraft.evaluation.improvementSuggestions && currentDraft.evaluation.improvementSuggestions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[var(--warning)] uppercase block font-mono">
                        Improvement Points
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[var(--text-secondary)]">
                        {currentDraft.evaluation.improvementSuggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-[var(--text-muted)] space-y-2">
                  <HelpCircle className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                  <p className="text-[11px] max-w-xs mx-auto">
                    Click "Save Draft" or "Save & Next" to trigger instant scoring and criteria analysis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* COMPLETED FINAL INTERVIEW REPORT */
        <div className="space-y-8">
          {/* Header Report Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--primary)]/15 via-[var(--accent)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-4xl space-y-4">
              <div className="inline-flex items-center space-x-1.5 bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                <span>Placement Assessment Complete</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-[var(--text-primary)]">
                AI Placement Evaluation Report
              </h2>

              <p className="text-[var(--text-secondary)] text-xs sm:text-sm leading-relaxed">
                {interview.feedbackText ||
                  `Candidate completed mock interview for ${interview.jobRole} (${interview.experienceLevel} level). Review detailed category scores and submitted code below.`}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[var(--text-muted)] font-mono">
                <span>Completed: {new Date(interview.createdAt || Date.now()).toLocaleDateString()}</span>
                <span>•</span>
                <span>Questions: {interview.questionsAnswered ?? (interview.answers || []).length} Answered, {interview.questionsSkipped ?? 0} Skipped</span>
                <span>•</span>
                <span>Role Track: {interview.jobRole}</span>
              </div>
            </div>
          </div>

          {/* 4 Score Dials */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl text-center space-y-2">
              <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono tracking-wider">
                Overall Placement Score
              </span>
              <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-[image:var(--gradient-brand)] font-mono block">
                {interview.overallScore}%
              </span>
              <span className="block text-[10px] text-[var(--text-muted)]">Benchmark readiness</span>
            </div>

            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl text-center space-y-2">
              <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono tracking-wider">
                Technical Accuracy
              </span>
              <span className="text-4xl font-extrabold text-[var(--primary)] font-mono block">
                {interview.technicalScore}%
              </span>
              <span className="block text-[10px] text-[var(--text-muted)]">Domain theory match</span>
            </div>

            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl text-center space-y-2">
              <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono tracking-wider">
                Communication Articulation
              </span>
              <span className="text-4xl font-extrabold text-[var(--accent)] font-mono block">
                {interview.communicationScore}%
              </span>
              <span className="block text-[10px] text-[var(--text-muted)]">Clarity and structure</span>
            </div>

            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl text-center space-y-2">
              <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase font-mono tracking-wider">
                Confidence & Pacing
              </span>
              <span className="text-4xl font-extrabold text-[var(--primary)] font-mono block">
                {interview.confidenceScore}%
              </span>
              <span className="block text-[10px] text-[var(--text-muted)]">Composure index</span>
            </div>
          </div>

          {/* Category-Wise Scores Breakdown Bar */}
          {interview.categoryScores && Object.keys(interview.categoryScores).length > 0 && (
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                <h4 className="font-bold text-sm font-display text-[var(--text-primary)]">
                  Category-Wise Performance Breakdown
                </h4>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                  {Object.keys(interview.categoryScores).length} {Object.keys(interview.categoryScores).length === 1 ? 'Domain' : 'Domains'} Evaluated
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(interview.categoryScores).map(([cat, score]) => (
                  <div key={cat} className="bg-[var(--bg-base)] p-3.5 rounded-xl border border-[var(--border)] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold capitalize text-[var(--text-secondary)]">{cat}</span>
                      <span className="font-mono font-bold text-[var(--primary)]">{score}%</span>
                    </div>
                    <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] h-full rounded-full"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strongest Areas & Topics to Improve */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strongest Areas */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-2">
                <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                <h4 className="font-bold text-sm font-display text-[var(--text-primary)]">
                  Strongest Demonstrated Areas
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                {(interview.strongestAreas && interview.strongestAreas.length > 0
                  ? interview.strongestAreas
                  : [
                      'Strong grasp of object-oriented architecture and code structuring.',
                      'Consistent articulation of engineering constraints and trade-offs.',
                      'Systematic problem-solving workflow and clear verbal pacing.'
                    ]
                ).map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Topics That Need Improvement */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-2">
                <BrainCircuit className="w-4 h-4 text-[var(--warning)]" />
                <h4 className="font-bold text-sm font-display text-[var(--text-primary)]">
                  Topics to Reinforce & Improve
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                {(interview.topicsToImprove && interview.topicsToImprove.length > 0
                  ? interview.topicsToImprove
                  : [
                      'Deepen edge-case handling for boundary conditions in coding questions.',
                      'Incorporate more concrete metrics (e.g. latency reductions, scale) in resume answers.',
                      'Practice STAR method framing for behavioral collaboration scenarios.'
                    ]
                ).map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-[var(--warning)] mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Practice & Learning */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-sm font-display text-[var(--text-primary)]">
                Suggested Practice Questions
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--text-secondary)]">
                {(interview.suggestedPracticeQuestions || [
                  `Practice concurrency and thread-safety algorithms for ${interview.jobRole}.`,
                  'Solve array and string reversal edge cases without extra memory overhead.',
                  'Explain microservice decoupling patterns and caching layers.'
                ]).map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>

            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-sm font-display text-[var(--text-primary)]">
                Recommended Learning Topics
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--text-secondary)]">
                {(interview.recommendedLearningTopics || [
                  'Asynchronous Event-Driven Architectures',
                  'Database Sharding, ACID Transactions & Index Optimization',
                  'RESTful API Versioning, JWT Authentication & OAuth2'
                ]).map((topic, idx) => (
                  <li key={idx}>{topic}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Individual Question Review with Code Solutions & Model Answers */}
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
            <div className="border-b border-[var(--border)] pb-3 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm font-display text-[var(--text-primary)]">
                  Individual Question Review & Submitted Answers
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Includes submitted code, model answer key points, and individual scores.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                {interview.answers.length} Questions
              </span>
            </div>

            <div className="space-y-6">
              {interview.answers.map((item, idx) => {
                const sq = structuredQuestions.find((q) => q.question === item.question) || structuredQuestions[idx];

                return (
                  <div
                    key={idx}
                    className="space-y-4 bg-[var(--bg-base)] p-5 border border-[var(--border)] rounded-xl"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)]">
                            Q{idx + 1} • {item.category || sq?.category || 'Technical'}
                          </span>
                          {item.skipped && (
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)]">
                              Skipped
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] leading-snug font-display pt-1">
                          "{item.question}"
                        </h5>
                      </div>

                      {item.evaluation && (
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] rounded-lg">
                            Score: {item.evaluation.score}/10
                          </span>
                          <span className="block text-[9px] text-[var(--text-muted)] mt-0.5 font-mono">
                            Source: {item.evaluation.evaluationSource === 'ai' ? 'AI Assessment' : 'Verified Rubric'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Candidate's Text Answer */}
                    {item.answer && !item.skipped && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block font-mono">
                          Your Explanation:
                        </span>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border)]">
                          {item.answer}
                        </p>
                      </div>
                    )}

                    {/* Candidate's Submitted Code */}
                    {item.code && item.code.trim().length > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-muted)]">
                          <span className="font-bold uppercase">Submitted Code ({item.language || 'Code'}):</span>
                          <span>(Preserved code submission)</span>
                        </div>
                        <pre className="p-3.5 bg-[#0d1117] text-[#e6edf3] font-mono text-xs rounded-xl overflow-x-auto border border-[var(--border)] leading-relaxed">
                          <code>{item.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Evaluation Details */}
                    {item.evaluation && (
                      <div className="space-y-2 pt-2 border-t border-[var(--border)] text-xs">
                        <span className="font-bold text-[var(--text-primary)] block">Assessor Review:</span>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          {item.evaluation.feedback}
                        </p>
                      </div>
                    )}

                    {/* Model Answer / Expected Points (Revealed only in report) */}
                    {(item.expectedAnswerPoints || sq?.expectedAnswerPoints) && (
                      <div className="space-y-2 pt-2 border-t border-[var(--border)] text-xs bg-[var(--bg-card)] p-3.5 rounded-xl border border-[var(--border)]">
                        <span className="font-bold text-[var(--primary)] block font-mono text-[11px]">
                          Key Expected Points:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-[var(--text-secondary)]">
                          {(item.expectedAnswerPoints || sq?.expectedAnswerPoints || []).map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border)] print:hidden">
            <button
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs transition flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Download / Print Report PDF</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // Retake current interview
                  if (!interview) return;
                  const resetDrafts: Record<number, any> = {};
                  structuredQuestions.forEach((sq, idx) => {
                    resetDrafts[idx] = {
                      text: '',
                      code: sq.codeTemplate || '',
                      language: sq.defaultLanguage || 'java',
                      skipped: false
                    };
                  });
                  setDraftAnswers(resetDrafts);
                  setInterview({
                    ...interview,
                    status: 'started',
                    answers: [],
                    currentQuestionIndex: 0,
                    overallScore: undefined
                  });
                  setCurrentIdx(0);
                  setRemainingTotalSeconds((interview.durationMinutes || 30) * 60);
                }}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Interview</span>
              </button>

              <button
                onClick={() => onNavigate('interview-prep')}
                className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-md"
              >
                <span>Start New Interview</span>
              </button>

              <button
                onClick={() => onNavigate('student-dashboard')}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs transition"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-panel bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl w-full max-w-md p-6 space-y-5 text-[var(--text-primary)] shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold font-display text-sm">Submit Mock Interview?</h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  You have completed {answeredCount} of {totalQuestions} questions.
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Submitting will compile your technical and communication metrics into your permanent performance log and unlock model answer explanations.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition"
              >
                Continue Answering
              </button>

              <button
                type="button"
                onClick={handleFinalizeInterview}
                disabled={submittingFinal}
                className="px-5 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:opacity-90 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-md"
              >
                {submittingFinal ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <span>Confirm & Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
