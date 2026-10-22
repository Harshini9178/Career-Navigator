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
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  reason: string;
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
  keywords: { keyword: string; match: boolean; count?: number; density?: number }[];
  improvementsToAdd: string[];
  improvementsToRemove: string[];
  jdMatchScore?: number;
  jobDescription?: string;
  missingJDKeywords?: string[];
  matchedJDKeywords?: string[];
  contentHash?: string;
  wordCount?: number;
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  grammar: string;
  clarity: string;
  wordsPerMinute?: number;
  fillerWordCount?: number;
  answerDurationSeconds?: number;
}

export interface InterviewAnswer {
  question: string;
  answer: string;
  evaluation?: AnswerEvaluation;
}

export interface MockInterview {
  id: string;
  userId: string;
  jobRole: string;
  branch: string;
  skills: string[];
  experienceLevel: string;
  status: 'started' | 'completed';
  interviewMode?: 'voice' | 'text';
  questions: string[];
  followUpQuestions?: string[];
  currentQuestionIndex: number;
  answers: InterviewAnswer[];
  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
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
