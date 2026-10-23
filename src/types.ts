export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: 'student' | 'admin';
  branch?: string;
  skills?: string[];
  projects?: string[];
  targetRole?: string;
  experienceLevel?: string;
  completedProfile?: boolean;
  phone?: string;
  password?: string;
  passwordHash?: string;
}

export interface SectionAnalysisResult {
  sectionName: string;
  detected: boolean;
  evidence?: string;
  confidence: number;
}

export interface ScoreCategoryBreakdown {
  category?: string;
  name?: string;
  score: number;
  maxScore: number;
  weight: number;
  reason?: string;
}

export interface ResumeAnalysis {
  id: string;
  userId: string;
  fileName: string;
  uploadedAt: string;
  atsScore: number;
  targetRole?: string;
  skills: string[];
  missingSections: string[];
  detectedSections?: string[];
  sectionDetails?: SectionAnalysisResult[];
  categoryBreakdown?: ScoreCategoryBreakdown[];
  suggestions: string[];
  grammarIssues: string[];
  keywords: { keyword: string; match: boolean; count?: number; density?: number; relevance?: string; evidence?: string }[];
  improvementsToAdd: string[];
  improvementsToRemove: string[];
  jdMatchScore?: number;
  jobDescription?: string;
  missingJDKeywords?: string[];
  matchedJDKeywords?: string[];
  contentHash?: string;
  wordCount?: number;
}

export interface StructuredQuestion {
  id: string;
  category: 'technical' | 'coding' | 'resume' | 'behavioral' | 'aptitude';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  roles: string[];
  question: string;
  expectedAnswerPoints: string[];
  evaluationCriteria: string[];
  codeTemplate?: string;
  defaultLanguage?: string;
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  grammar: string;
  clarity: string;
  strengths?: string[];
  missingConcepts?: string[];
  improvementSuggestions?: string[];
  modelAnswerPoints?: string[];
  wordsPerMinute?: number;
  fillerWordCount?: number;
  answerDurationSeconds?: number;
  evaluationSource?: 'ai' | 'rubric';
}

export interface InterviewAnswer {
  question: string;
  questionId?: string;
  category?: 'technical' | 'coding' | 'resume' | 'behavioral' | 'aptitude';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  answer: string;
  code?: string;
  language?: string;
  skipped?: boolean;
  skipTimestamp?: string;
  evaluation?: AnswerEvaluation;
  expectedAnswerPoints?: string[];
  evaluationCriteria?: string[];
}

export interface MockInterview {
  id: string;
  userId: string;
  jobRole: string;
  branch: string;
  skills: string[];
  experienceLevel: string;
  status: 'started' | 'completed';
  interviewMode?: 'voice' | 'text' | 'video_audio';
  questions: string[];
  structuredQuestions?: StructuredQuestion[];
  followUpQuestions?: string[];
  currentQuestionIndex: number;
  answers: InterviewAnswer[];
  overallScore?: number;
  averageAnsweredScore?: number;
  averageScoreOutOf10?: number;
  totalPointsEarned?: number;
  maxPossiblePoints?: number;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  categoryScores?: Record<string, number>;
  questionsAnswered?: number;
  questionsSkipped?: number;
  questionsPending?: number;
  strongestAreas?: string[];
  topicsToImprove?: string[];
  suggestedPracticeQuestions?: string[];
  recommendedLearningTopics?: string[];
  durationMinutes?: number;
  prepTimerSeconds?: number;
  selectedResumeId?: string;
  selectedResumeName?: string;
  feedbackText?: string;
  suggestions?: string[];
  createdAt: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  downloadCount: number;
  fileContent: string;
}

export interface StudentFeedback {
  id: string;
  userId: string;
  userName: string;
  category: 'interview' | 'resume' | 'general';
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  totalInterviews: number;
  avgATSScore: number;
  avgInterviewScore: number;
  recentActivity: {
    id: string;
    type: 'resume_upload' | 'interview_completed' | 'profile_updated';
    userName: string;
    detail: string;
    timestamp: string;
  }[];
  branchDistribution: { branch: string; count: number }[];
  weeklyInterviews: { name: string; count: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  error?: boolean;
  learningMode?: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  learningMode?: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  learningMode?: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  careerContext?: Record<string, any>;
}

export interface AptitudeCategoryMeta {
  name: string;
  description: string;
  icon: string;
  totalInBank: number;
  questionsPerTest: number;
}

export interface AptitudeQuestionClient {
  id: string;
  questionText: string;
  category: string;
  topic: string;
  difficulty: string;
  options: string[];
}

export interface CategoryScore {
  category: string;
  score: number;
  total: number;
  percentage: number;
}

export interface AptitudeAttempt {
  id: string;
  userId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'VIOLATION_TERMINATED';
  startedAt: string;
  deadline: string;
  remainingSeconds: number;
  totalQuestions: number;
  answeredCount: number;
  markedCount: number;
  violationsCount: number;
  questions: AptitudeQuestionClient[];
  answers: Record<string, number>;
  markedForReview: string[];
}

export interface QuestionReview {
  id: string;
  questionText: string;
  category: string;
  topic: string;
  difficulty: string;
  options: string[];
  selectedOption: number | null;
  correctAnswerIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export interface AptitudeResult {
  id: string;
  userId: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  durationSeconds: number;
  status: string;
  startedAt: string;
  completedAt: string;
  violationsCount: number;
  forcedSubmissionReason?: string;
  categoryScores: CategoryScore[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  questionReviews: QuestionReview[];
}

export interface AptitudeHistoryItem {
  id: string;
  startedAt: string;
  completedAt: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  durationSeconds: number;
  status: string;
  violationsCount: number;
  forcedSubmissionReason?: string;
  categoryScores: Record<string, number>;
}
