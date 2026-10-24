import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db as jsonDb } from '../db/database.js';
import {
  AptitudeCategoryMeta,
  AptitudeQuestionClient,
  AptitudeAttempt,
  AptitudeResult,
  AptitudeHistoryItem,
  CategoryScore,
  QuestionReview
} from '../types.js';

interface RawQuestion {
  id: string;
  questionText: string;
  category: string;
  topic: string;
  difficulty: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export const ALL_CATEGORIES = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Technical Aptitude',
  'Data Interpretation & Analytical Reasoning'
] as const;

let cachedQuestions: RawQuestion[] = [];

export function loadQuestionBank(): RawQuestion[] {
  if (cachedQuestions.length >= 75) {
    return cachedQuestions;
  }
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'aptitudeBank.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        cachedQuestions = data;
        return cachedQuestions;
      }
    }
  } catch (err) {
    console.error('Failed to load aptitudeBank.json:', err);
  }
  return cachedQuestions;
}

export function getCategoriesMeta(): AptitudeCategoryMeta[] {
  const bank = loadQuestionBank();
  return ALL_CATEGORIES.map((cat) => {
    const totalInBank = bank.filter((q) => q.category === cat).length;
    let description = 'General Competency Domain';
    let icon = 'Brain';

    switch (cat) {
      case 'Quantitative Aptitude':
        description = 'Work & Time, Speed & Distance, Profit & Loss, Percentages, Probability, Mensuration, Number Systems';
        icon = 'Calculator';
        break;
      case 'Logical Reasoning':
        description = 'Syllogisms, Blood Relations, Coding-Decoding, Seating Arrangements, Critical Reasoning';
        icon = 'Lightbulb';
        break;
      case 'Verbal Ability':
        description = 'Grammar, Synonyms, Antonyms, Sentence Correction, Para Jumbles, Tone & Reading';
        icon = 'BookOpen';
        break;
      case 'Technical Aptitude':
        description = 'Java Core, OOP, Spring Boot, Data Structures & Algorithms, SQL, System Design, Concurrency';
        icon = 'Cpu';
        break;
      case 'Data Interpretation & Analytical Reasoning':
        description = 'Tabular Analysis, Pie Charts, Trend Growth, Data Sufficiency, Caselets, Demographics';
        icon = 'BarChart3';
        break;
    }

    return {
      name: cat,
      description,
      icon,
      totalInBank: totalInBank || 15,
      questionsPerTest: 6
    };
  });
}

function calculateRemainingSeconds(deadlineIso: string): number {
  try {
    const deadlineMs = new Date(deadlineIso).getTime();
    return Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

function toClientQuestion(q: RawQuestion): AptitudeQuestionClient {
  return {
    id: q.id,
    questionText: q.questionText,
    category: q.category,
    topic: q.topic,
    difficulty: q.difficulty,
    options: [...q.options]
  };
}

function formatClientAttempt(attempt: any, bank: RawQuestion[], remainingSeconds: number): AptitudeAttempt {
  const qMap = new Map(bank.map((q) => [q.id, q]));
  const questionIds: string[] = Array.isArray(attempt.questionsJson)
    ? attempt.questionsJson
    : typeof attempt.questionsJson === 'string'
    ? JSON.parse(attempt.questionsJson || '[]')
    : [];

  const clientQuestions: AptitudeQuestionClient[] = [];
  for (const qId of questionIds) {
    const q = qMap.get(qId);
    if (q) {
      clientQuestions.push(toClientQuestion(q));
    }
  }

  const answers = typeof attempt.answers === 'object' && attempt.answers !== null
    ? attempt.answers
    : typeof attempt.answersJson === 'string'
    ? JSON.parse(attempt.answersJson || '{}')
    : {};

  const markedForReview = Array.isArray(attempt.markedForReview)
    ? attempt.markedForReview
    : typeof attempt.markedForReviewJson === 'string'
    ? JSON.parse(attempt.markedForReviewJson || '[]')
    : [];

  return {
    id: attempt.id,
    userId: attempt.userId,
    status: attempt.status,
    startedAt: attempt.startedAt,
    deadline: attempt.deadline,
    remainingSeconds,
    totalQuestions: clientQuestions.length || attempt.totalQuestions || 30,
    answeredCount: Object.keys(answers).length,
    markedCount: markedForReview.length,
    violationsCount: attempt.violationsCount || 0,
    questions: clientQuestions,
    answers,
    markedForReview
  };
}

export function startOrResumeAttempt(userId: string): AptitudeAttempt {
  const bank = loadQuestionBank();
  const userAttempts = jsonDb.getAptitudeAttemptsByUserId(userId);
  const active = userAttempts.find((a: any) => a.status === 'IN_PROGRESS');

  if (active) {
    const remaining = calculateRemainingSeconds(active.deadline);
    if (remaining > 0 && (active.violationsCount || 0) < 3) {
      return formatClientAttempt(active, bank, remaining);
    } else {
      // Finalize timed out or violation-terminated attempt
      finalizeAttempt(active, remaining <= 0 ? 'TIMED_OUT' : 'VIOLATION_TERMINATED', 'Time limit expired');
    }
  }

  return createNewAttempt(userId);
}

export function createNewAttempt(userId: string): AptitudeAttempt {
  const bank = loadQuestionBank();
  const previousAttempts = jsonDb.getAptitudeAttemptsByUserId(userId);
  const seenIds = new Set<string>();

  for (const prev of previousAttempts) {
    const ids: string[] = Array.isArray(prev.questionsJson)
      ? prev.questionsJson
      : typeof prev.questionsJson === 'string'
      ? JSON.parse(prev.questionsJson || '[]')
      : [];
    ids.forEach((id) => seenIds.add(id));
  }

  const selectedQuestions: RawQuestion[] = [];

  for (const cat of ALL_CATEGORIES) {
    const allInCat = bank.filter((q) => q.category === cat);
    const unseen = allInCat.filter((q) => !seenIds.has(q.id));
    const seen = allInCat.filter((q) => seenIds.has(q.id));

    // Shuffle arrays
    unseen.sort(() => Math.random() - 0.5);
    seen.sort(() => Math.random() - 0.5);

    const catSelection: RawQuestion[] = [];
    for (const q of unseen) {
      if (catSelection.length < 6) catSelection.push(q);
    }
    if (catSelection.length < 6) {
      for (const q of seen) {
        if (catSelection.length < 6) catSelection.push(q);
      }
    }
    selectedQuestions.push(...catSelection);
  }

  // Fallback to ensure exactly 30 questions
  if (selectedQuestions.length < 30) {
    const alreadyPicked = new Set(selectedQuestions.map((q) => q.id));
    for (const q of bank) {
      if (selectedQuestions.length >= 30) break;
      if (!alreadyPicked.has(q.id)) {
        selectedQuestions.push(q);
        alreadyPicked.add(q.id);
      }
    }
  }

  // Interleave and shuffle
  selectedQuestions.sort(() => Math.random() - 0.5);

  const questionIds = selectedQuestions.map((q) => q.id);
  const now = new Date();
  const startedAt = now.toISOString();
  const deadline = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

  const attemptRecord = {
    id: crypto.randomUUID(),
    userId,
    status: 'IN_PROGRESS',
    startedAt,
    deadline,
    durationSeconds: 0,
    score: 0,
    percentage: 0,
    totalQuestions: selectedQuestions.length,
    violationsCount: 0,
    questionsJson: questionIds,
    answers: {},
    markedForReview: [],
    categoryScores: {}
  };

  jsonDb.saveAptitudeAttempt(attemptRecord);
  return formatClientAttempt(attemptRecord, bank, 1800);
}

export function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOption: number | null,
  markedForReview: boolean | undefined,
  userId: string
): AptitudeAttempt {
  const bank = loadQuestionBank();
  const attempt = jsonDb.getAptitudeAttemptById(attemptId);

  if (!attempt) {
    throw new Error(`Attempt ${attemptId} not found`);
  }
  if (attempt.userId !== userId) {
    throw new Error('Unauthorized access to attempt');
  }
  if (attempt.status !== 'IN_PROGRESS') {
    throw new Error(`Assessment is not in progress. Current status: ${attempt.status}`);
  }

  const remaining = calculateRemainingSeconds(attempt.deadline);
  if (remaining <= 0) {
    const finalized = finalizeAttempt(attempt, 'TIMED_OUT', 'Time limit expired');
    return formatClientAttempt(finalized, bank, 0);
  }

  const answers = typeof attempt.answers === 'object' && attempt.answers !== null
    ? { ...attempt.answers }
    : {};

  let marked: string[] = Array.isArray(attempt.markedForReview)
    ? [...attempt.markedForReview]
    : [];

  if (selectedOption !== null && selectedOption !== undefined && selectedOption >= 0 && selectedOption <= 3) {
    answers[questionId] = selectedOption;
  } else if (selectedOption === null) {
    delete answers[questionId];
  }

  if (markedForReview === true) {
    if (!marked.includes(questionId)) marked.push(questionId);
  } else if (markedForReview === false) {
    marked = marked.filter((id) => id !== questionId);
  }

  const startedMs = new Date(attempt.startedAt).getTime();
  const spentSec = Math.min(1800, Math.max(0, Math.floor((Date.now() - startedMs) / 1000)));

  attempt.answers = answers;
  attempt.markedForReview = marked;
  attempt.durationSeconds = spentSec;

  const saved = jsonDb.saveAptitudeAttempt(attempt);
  return formatClientAttempt(saved, bank, remaining);
}

export function recordViolation(
  attemptId: string,
  eventType: string,
  userId: string
): { attempt: AptitudeAttempt; terminated: boolean; violationsCount: number } {
  const bank = loadQuestionBank();
  const attempt = jsonDb.getAptitudeAttemptById(attemptId);

  if (!attempt) throw new Error(`Attempt ${attemptId} not found`);
  if (attempt.userId !== userId) throw new Error('Unauthorized access to attempt');

  if (attempt.status !== 'IN_PROGRESS') {
    return {
      attempt: formatClientAttempt(attempt, bank, 0),
      terminated: attempt.status === 'VIOLATION_TERMINATED',
      violationsCount: attempt.violationsCount || 0
    };
  }

  const count = (attempt.violationsCount || 0) + 1;
  attempt.violationsCount = count;

  if (count >= 3) {
    const finalized = finalizeAttempt(
      attempt,
      'VIOLATION_TERMINATED',
      'Terminated due to multiple integrity violations (3 tab-switches or fullscreen exits detected).'
    );
    return {
      attempt: formatClientAttempt(finalized, bank, 0),
      terminated: true,
      violationsCount: count
    };
  }

  const saved = jsonDb.saveAptitudeAttempt(attempt);
  const remaining = calculateRemainingSeconds(saved.deadline);
  return {
    attempt: formatClientAttempt(saved, bank, remaining),
    terminated: false,
    violationsCount: count
  };
}

export function finalizeAttempt(attempt: any, status: string, reason?: string | null): any {
  const bank = loadQuestionBank();
  const qMap = new Map(bank.map((q) => [q.id, q]));

  const questionIds: string[] = Array.isArray(attempt.questionsJson)
    ? attempt.questionsJson
    : typeof attempt.questionsJson === 'string'
    ? JSON.parse(attempt.questionsJson || '[]')
    : [];

  const answers: Record<string, number> = typeof attempt.answers === 'object' && attempt.answers !== null
    ? attempt.answers
    : typeof attempt.answersJson === 'string'
    ? JSON.parse(attempt.answersJson || '{}')
    : {};

  let totalScore = 0;
  const categoryTally: Record<string, { correct: number; total: number }> = {};
  for (const cat of ALL_CATEGORIES) {
    categoryTally[cat] = { correct: 0, total: 0 };
  }

  for (const qId of questionIds) {
    const q = qMap.get(qId);
    if (!q) continue;

    const cat = q.category;
    if (!categoryTally[cat]) {
      categoryTally[cat] = { correct: 0, total: 0 };
    }
    categoryTally[cat].total += 1;

    const selected = answers[qId];
    if (selected !== undefined && selected === q.correctAnswerIndex) {
      totalScore += 1;
      categoryTally[cat].correct += 1;
    }
  }

  const total = questionIds.length || attempt.totalQuestions || 30;
  const percentage = Math.round((totalScore * 100.0 / total) * 10) / 10;
  const now = new Date();
  const startedMs = new Date(attempt.startedAt).getTime();
  const durationSeconds = Math.min(1800, Math.max(0, Math.floor((now.getTime() - startedMs) / 1000)));

  const categoryScores: Record<string, CategoryScore> = {};
  for (const cat of ALL_CATEGORIES) {
    const tally = categoryTally[cat] || { correct: 0, total: 6 };
    const tot = tally.total > 0 ? tally.total : 6;
    const pct = Math.round((tally.correct * 100.0 / tot) * 10) / 10;
    categoryScores[cat] = {
      category: cat,
      score: tally.correct,
      total: tot,
      percentage: pct
    };
  }

  attempt.status = status;
  attempt.completedAt = now.toISOString();
  attempt.durationSeconds = durationSeconds;
  attempt.score = totalScore;
  attempt.percentage = percentage;
  attempt.totalQuestions = total;
  attempt.forcedSubmissionReason = reason || null;
  attempt.categoryScores = categoryScores;

  return jsonDb.saveAptitudeAttempt(attempt);
}

export function submitAttempt(attemptId: string, forcedReason: string | null | undefined, userId: string): AptitudeResult {
  const attempt = jsonDb.getAptitudeAttemptById(attemptId);
  if (!attempt) throw new Error(`Attempt ${attemptId} not found`);
  if (attempt.userId !== userId) throw new Error('Unauthorized access to attempt');

  if (attempt.status === 'IN_PROGRESS') {
    const remaining = calculateRemainingSeconds(attempt.deadline);
    const finalStatus = remaining <= 0 ? 'TIMED_OUT' : 'COMPLETED';
    const reason = forcedReason || (remaining <= 0 ? 'Time limit expired' : null);
    finalizeAttempt(attempt, finalStatus, reason);
  }

  return getAttemptResult(attemptId, userId);
}

export function getAttemptResult(attemptId: string, userId: string): AptitudeResult {
  const bank = loadQuestionBank();
  const qMap = new Map(bank.map((q) => [q.id, q]));
  const attempt = jsonDb.getAptitudeAttemptById(attemptId);

  if (!attempt) throw new Error(`Attempt ${attemptId} not found`);
  if (attempt.userId !== userId) throw new Error('Unauthorized access to attempt');

  if (attempt.status === 'IN_PROGRESS') {
    const remaining = calculateRemainingSeconds(attempt.deadline);
    if (remaining <= 0) {
      finalizeAttempt(attempt, 'TIMED_OUT', 'Time limit expired');
    }
  }

  const questionIds: string[] = Array.isArray(attempt.questionsJson)
    ? attempt.questionsJson
    : typeof attempt.questionsJson === 'string'
    ? JSON.parse(attempt.questionsJson || '[]')
    : [];

  const answers: Record<string, number> = typeof attempt.answers === 'object' && attempt.answers !== null
    ? attempt.answers
    : typeof attempt.answersJson === 'string'
    ? JSON.parse(attempt.answersJson || '{}')
    : {};

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const reviews: QuestionReview[] = [];
  const categoryTally: Record<string, { correct: number; total: number }> = {};
  for (const cat of ALL_CATEGORIES) {
    categoryTally[cat] = { correct: 0, total: 0 };
  }

  for (const qId of questionIds) {
    const q = qMap.get(qId);
    if (!q) continue;

    const cat = q.category;
    if (!categoryTally[cat]) categoryTally[cat] = { correct: 0, total: 0 };
    categoryTally[cat].total += 1;

    const selected = answers[qId];
    let isCorrect = false;

    if (selected === undefined || selected === null) {
      unansweredCount += 1;
    } else if (selected === q.correctAnswerIndex) {
      correctCount += 1;
      categoryTally[cat].correct += 1;
      isCorrect = true;
    } else {
      incorrectCount += 1;
    }

    reviews.push({
      id: q.id,
      questionText: q.questionText,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      options: [...q.options],
      selectedOption: selected !== undefined ? selected : null,
      correctAnswerIndex: q.correctAnswerIndex,
      isCorrect,
      explanation: q.explanation
    });
  }

  const categoryScores: CategoryScore[] = ALL_CATEGORIES.map((cat) => {
    const tally = categoryTally[cat] || { correct: 0, total: 6 };
    const tot = tally.total > 0 ? tally.total : 6;
    const pct = Math.round((tally.correct * 100.0 / tot) * 10) / 10;
    return {
      category: cat,
      score: tally.correct,
      total: tot,
      percentage: pct
    };
  });

  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  for (const cs of categoryScores) {
    if (cs.percentage >= 66.7) {
      strengths.push(`${cs.category} (${Math.round(cs.percentage)}% accuracy - solid conceptual grasp)`);
    } else if (cs.percentage < 50.0) {
      improvements.push(`${cs.category} (${Math.round(cs.percentage)}% accuracy - needs revision & practice)`);
    }
  }

  if (strengths.length === 0) {
    strengths.push('Foundational problem solving and test endurance across standard assessment conditions.');
  }
  if (improvements.length === 0) {
    improvements.push('Fine-tune speed and time management to target a 95%+ top-percentile ranking.');
  }

  const techScore = categoryTally['Technical Aptitude']?.correct ?? 0;
  if (techScore < 4) {
    recommendations.push('Revisit Java concurrency fundamentals, Spring Boot bean lifecycle, and SQL JOIN mechanics.');
  }
  const quantScore = categoryTally['Quantitative Aptitude']?.correct ?? 0;
  if (quantScore < 4) {
    recommendations.push('Practice short-cut formulas for Time & Work, Speed-Distance, and Compound Interest calculations.');
  }
  const dataScore = categoryTally['Data Interpretation & Analytical Reasoning']?.correct ?? 0;
  if (dataScore < 4) {
    recommendations.push('Enhance tabular and percentage approximation techniques to evaluate Data Interpretation sets under 60 seconds.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Maintain consistency by taking timed mock assessments weekly and reviewing edge-case reasoning questions.');
  }

  return {
    id: attempt.id,
    userId: attempt.userId,
    score: attempt.score ?? correctCount,
    percentage: attempt.percentage ?? (Math.round((correctCount * 100 / reviews.length) * 10) / 10),
    totalQuestions: reviews.length,
    correctCount,
    incorrectCount,
    unansweredCount,
    durationSeconds: attempt.durationSeconds ?? 0,
    status: attempt.status,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    violationsCount: attempt.violationsCount || 0,
    forcedSubmissionReason: attempt.forcedSubmissionReason,
    categoryScores,
    strengths,
    improvements,
    recommendations,
    questionReviews: reviews
  };
}

export function getUserHistory(userId: string): AptitudeHistoryItem[] {
  const attempts = jsonDb.getAptitudeAttemptsByUserId(userId);
  return attempts.map((att: any) => {
    const catScoresObj: Record<string, number> = {};
    if (att.categoryScores && typeof att.categoryScores === 'object') {
      Object.entries(att.categoryScores).forEach(([k, v]: [string, any]) => {
        catScoresObj[k] = typeof v === 'object' && v !== null ? v.score : Number(v) || 0;
      });
    }
    return {
      id: att.id,
      startedAt: att.startedAt,
      completedAt: att.completedAt,
      score: att.score || 0,
      percentage: att.percentage || 0,
      totalQuestions: att.totalQuestions || 30,
      durationSeconds: att.durationSeconds || 0,
      status: att.status,
      violationsCount: att.violationsCount || 0,
      forcedSubmissionReason: att.forcedSubmissionReason,
      categoryScores: catScoresObj
    };
  });
}
