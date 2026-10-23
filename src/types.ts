export type SkillCategory =
  | 'Programming Languages'
  | 'Frameworks'
  | 'Databases'
  | 'Developer Tools'
  | 'Cloud'
  | 'Other';

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface ProfileSkillItem {
  id?: string;
  name: string;
  category: SkillCategory;
  proficiency: SkillProficiency;
  isPrimary?: boolean;
}

export interface ProfileProjectItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  startDate?: string;
  endDate?: string;
  githubUrl?: string;
  liveUrl?: string;
  role?: string;
  accomplishments?: string[];
}

export interface ProfileEducationItem {
  id: string;
  institution: string;
  degree: string;
  specialization: string;
  startYear: string;
  graduationYear: string;
  score?: string;
  status: 'Pursuing' | 'Completed';
}

export interface ProfileCertificationItem {
  id: string;
  title: string;
  issuer: string;
  issueDate?: string;
  credentialUrl?: string;
}

export interface ProfileExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface InterviewPreferences {
  targetRole: string;
  branch: string;
  experienceLevel: string;
  technicalCompetencies: string[];
  keyProjects: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  focus: 'Technical' | 'HR' | 'Behavioral' | 'System Design' | 'Mixed';
}

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
  createdAt?: string;

  // Enhanced Career Profile fields
  cityState?: string;
  college?: string;
  degree?: string;
  graduationYear?: string;
  currentSemester?: string;
  linkedIn?: string;
  github?: string;
  portfolioWebsite?: string;
  preferredLocation?: string;
  workPreference?: 'On-site' | 'Hybrid' | 'Remote' | string;
  expectedSalary?: string;
  employmentType?: 'Full-time' | 'Internship' | 'Contract' | 'Part-time' | string;
  targetCompanies?: string;

  // JSON serialized structured sub-sections
  skillsDataJson?: string;
  projectsDataJson?: string;
  educationDataJson?: string;
  certificationsDataJson?: string;
  experienceDataJson?: string;
  interviewPreferencesJson?: string;
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
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  categoryScores?: Record<string, number>;
  questionsAnswered?: number;
  questionsSkipped?: number;
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

// ================= Resume Builder Interfaces =================

export interface ResumePersonalInfo {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  cityCountry: string;
  linkedIn: string;
  github: string;
  portfolioWebsite: string;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  graduationDate: string;
  gradeCgpa: string;
  coursework: string;
}

export interface ResumeWorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  currentRole: boolean;
  responsibilities: string;
  achievements: string;
  impact: string;
  bullets: string[];
}

export interface ResumeSkills {
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  toolsPlatforms: string[];
  coreConcepts: string[];
  communicationLeadership: string[];
}

export interface ResumeProject {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  keyContributions: string;
  resultsImpact: string;
  githubUrl: string;
  liveUrl: string;
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  credentialUrl: string;
  type: 'certification' | 'award' | 'hackathon' | 'academic';
}

export interface ResumeCustomSection {
  id: string;
  heading: string;
  items: string[];
}

export interface ResumeAdditionalSections {
  publications: string[];
  volunteerExperience: string[];
  leadership: string[];
  languages: string[];
  interests: string[];
  customSections: ResumeCustomSection[];
}

export interface ResumeContent {
  personalInfo: ResumePersonalInfo;
  summary: string;
  education: ResumeEducation[];
  skills: ResumeSkills;
  experience: ResumeWorkExperience[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  additionalSections: ResumeAdditionalSections;
}

export interface ResumeDocument {
  id: string;
  userId: string;
  title: string;
  targetRole: string;
  templateId: string;
  atsScore: number;
  content: ResumeContent;
  createdAt: string;
  updatedAt: string;
}

export interface AtsCheckCategoryItem {
  name: string;
  score: number;
  maxScore: number;
  status: 'passed' | 'warning' | 'missing';
  explanation: string;
}

export interface AtsCheckReport {
  overallScore: number;
  categoryScores: AtsCheckCategoryItem[];
  passedChecks: string[];
  warnings: string[];
  missingInfo: string[];
  improvementSuggestions: string[];
}

export interface JobMatchReport {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  experienceRelevance: string[];
  phrasingSuggestions: string[];
}

