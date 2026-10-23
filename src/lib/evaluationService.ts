import { AnswerEvaluation, StructuredQuestion } from '../types.js';
import { api } from './api.js';

export interface EvaluateAnswerParams {
  interviewId: string;
  question: StructuredQuestion;
  answerText: string;
  code?: string;
  language?: string;
  skipped?: boolean;
  wordsPerMinute?: number;
  fillerWordCount?: number;
  durationSeconds?: number;
}

export async function evaluateAnswerSubmission(
  params: EvaluateAnswerParams
): Promise<AnswerEvaluation> {
  const { question, answerText, code, language, skipped, wordsPerMinute, fillerWordCount, durationSeconds } = params;

  // If question was explicitly skipped
  if (skipped) {
    return {
      score: 0,
      technicalScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      grammar: 'N/A (Skipped)',
      clarity: 'Question was skipped by candidate.',
      feedback: 'This question was skipped. Review the expected answer points to reinforce your preparation on this topic.',
      strengths: [],
      missingConcepts: question.expectedAnswerPoints,
      improvementSuggestions: [
        `Review fundamental concepts in ${question.category} under difficulty level "${question.difficulty}".`,
        'Practice articulating key bullet points aloud before moving to code.'
      ],
      modelAnswerPoints: question.expectedAnswerPoints,
      wordsPerMinute: 0,
      fillerWordCount: 0,
      answerDurationSeconds: durationSeconds || 0,
      evaluationSource: 'rubric'
    };
  }

  const combinedContent = [
    answerText.trim(),
    code && code.trim() ? `[Code Submission in ${language || 'text'}]:\n${code.trim()}` : ''
  ].filter(Boolean).join('\n\n');

  // Try backend AI evaluation first
  try {
    const res = await api.post(`/api/interview/${params.interviewId}/answer`, {
      question: question.question,
      questionId: question.id,
      category: question.category,
      difficulty: question.difficulty,
      answer: combinedContent,
      code: code || '',
      language: language || '',
      wordsPerMinute: wordsPerMinute || 0,
      fillerWordCount: fillerWordCount || 0,
      answerDurationSeconds: durationSeconds || 0
    });

    if (res.ok) {
      const data = await res.json();
      const evalData = data.evaluation || data;
      if (evalData && typeof evalData.score === 'number') {
        return {
          score: Math.min(10, Math.max(0, evalData.score)),
          technicalScore: evalData.technicalScore ?? evalData.score,
          communicationScore: evalData.communicationScore ?? evalData.score,
          confidenceScore: evalData.confidenceScore ?? 7,
          grammar: evalData.grammar || 'Clean sentence formulation.',
          clarity: evalData.clarity || 'Logical structure.',
          feedback: evalData.feedback || 'Answer evaluated successfully.',
          strengths: Array.isArray(evalData.strengths) && evalData.strengths.length > 0
            ? evalData.strengths
            : ['Demonstrated understanding of core concepts.'],
          missingConcepts: Array.isArray(evalData.missingConcepts)
            ? evalData.missingConcepts
            : (evalData.score < 8 ? [question.expectedAnswerPoints[0] || 'Deeper architectural detail'] : []),
          improvementSuggestions: Array.isArray(evalData.improvementSuggestions) && evalData.improvementSuggestions.length > 0
            ? evalData.improvementSuggestions
            : ['Provide concrete examples or edge-case handling.'],
          modelAnswerPoints: Array.isArray(evalData.modelAnswerPoints) && evalData.modelAnswerPoints.length > 0
            ? evalData.modelAnswerPoints
            : question.expectedAnswerPoints,
          wordsPerMinute,
          fillerWordCount,
          answerDurationSeconds: durationSeconds,
          evaluationSource: 'ai'
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI answer evaluation unavailable, employing rubric fallback:', err);
  }

  // Transparent, objective rubric fallback evaluation
  return evaluateWithRubricFallback(question, answerText, code, language, wordsPerMinute, fillerWordCount, durationSeconds);
}

/**
 * Transparent Rubric-based Fallback Evaluator
 * Assesses answer completeness against expected points and evaluation criteria.
 */
function evaluateWithRubricFallback(
  question: StructuredQuestion,
  answerText: string,
  code?: string,
  language?: string,
  wordsPerMinute?: number,
  fillerWordCount?: number,
  durationSeconds?: number
): AnswerEvaluation {
  const textWords = answerText.trim().split(/\s+/).filter(Boolean);
  const wordCount = textWords.length;
  const hasCode = !!(code && code.trim().length > 15);
  const lowerAnswer = (answerText + ' ' + (code || '')).toLowerCase();

  // Match keyword concepts against expected answer points
  const matchedPoints: string[] = [];
  const missingPoints: string[] = [];

  for (const point of question.expectedAnswerPoints) {
    // Extract key tokens (3+ chars)
    const tokens = point.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 3);
    const matchCount = tokens.filter((t) => lowerAnswer.includes(t)).length;
    const matchRatio = tokens.length > 0 ? matchCount / tokens.length : 0;

    if (matchRatio >= 0.25 || tokens.some((t) => lowerAnswer.includes(t) && t.length >= 6)) {
      matchedPoints.push(point);
    } else {
      missingPoints.push(point);
    }
  }

  let baseScore = 3;
  if (question.category === 'coding') {
    if (hasCode) {
      baseScore = 6;
      if (code && (code.includes('for') || code.includes('while') || code.includes('return') || code.includes('def') || code.includes('function') || code.includes('public'))) {
        baseScore += 2;
      }
      if (wordCount >= 15) {
        baseScore += 1;
      }
    } else {
      baseScore = Math.min(4, Math.floor(wordCount / 10));
    }
  } else {
    // Normal text answers
    if (wordCount >= 60) baseScore += 3;
    else if (wordCount >= 35) baseScore += 2;
    else if (wordCount >= 15) baseScore += 1;

    // Bonus for matching key points
    baseScore += Math.min(3, matchedPoints.length);
  }

  // Adjust for excessive filler words
  if (fillerWordCount && fillerWordCount > 5) {
    baseScore = Math.max(1, baseScore - 1);
  }

  const finalScore = Math.min(10, Math.max(2, baseScore));
  const technicalScore = question.category === 'coding' && !hasCode ? Math.min(4, finalScore) : finalScore;
  const communicationScore = wordCount >= 30 ? Math.min(10, finalScore + 1) : Math.max(3, finalScore - 1);
  const confidenceScore = fillerWordCount && fillerWordCount > 4 ? 6 : 8;

  const strengths: string[] = [];
  if (matchedPoints.length > 0) {
    strengths.push(`Addressed key concepts: ${matchedPoints.slice(0, 2).map((p) => p.slice(0, 50) + '...').join('; ')}`);
  }
  if (hasCode) {
    strengths.push(`Provided structured ${language || 'code'} implementation targeting the problem statement.`);
  }
  if (wordCount >= 35) {
    strengths.push('Provided a comprehensive and structured technical explanation.');
  }
  if (strengths.length === 0) {
    strengths.push('Provided a relevant baseline response to the question prompt.');
  }

  const improvementSuggestions: string[] = [];
  if (missingPoints.length > 0) {
    improvementSuggestions.push(`Deepen coverage of: "${missingPoints[0]}"`);
  }
  if (question.category === 'coding' && !hasCode) {
    improvementSuggestions.push('Always submit working code syntax along with your conceptual explanation for coding questions.');
  }
  if (wordCount < 30 && question.category !== 'coding') {
    improvementSuggestions.push('Expand your answer with real-world architectural trade-offs and concrete engineering examples.');
  }
  if (improvementSuggestions.length === 0) {
    improvementSuggestions.push('Consider edge cases, time/space complexity analysis, and defensive boundary validations.');
  }

  return {
    score: finalScore,
    technicalScore,
    communicationScore,
    confidenceScore,
    grammar: 'Well-formed sentences and vocabulary.',
    clarity: wordCount >= 30 ? 'Structured, organized explanation.' : 'Concise response; expand on core mechanisms.',
    feedback: finalScore >= 8
      ? 'Strong technical response aligning closely with engineering benchmarks.'
      : finalScore >= 6
      ? 'Solid foundational response. Expanding on edge cases and concrete examples will elevate it further.'
      : 'Adequate preliminary attempt. Review the model points to build a more comprehensive response.',
    strengths,
    missingConcepts: missingPoints.length > 0 ? missingPoints : ['Advanced optimization techniques and boundary constraints.'],
    improvementSuggestions,
    modelAnswerPoints: question.expectedAnswerPoints,
    wordsPerMinute,
    fillerWordCount,
    answerDurationSeconds: durationSeconds,
    evaluationSource: 'rubric'
  };
}

export function compileFinalReport(
  jobRole: string,
  answers: { question: string; category?: string; answer: string; code?: string; skipped?: boolean; evaluation?: AnswerEvaluation }[]
) {
  let totalScore = 0;
  let evaluatedCount = 0;
  let skippedCount = 0;
  const categoryScoresMap: Record<string, { total: number; count: number }> = {};
  const strongestSet = new Set<string>();
  const improvementSet = new Set<string>();

  for (const ans of answers) {
    const cat = ans.category || 'technical';
    if (!categoryScoresMap[cat]) {
      categoryScoresMap[cat] = { total: 0, count: 0 };
    }

    if (ans.skipped) {
      skippedCount++;
      categoryScoresMap[cat].total += 0;
      categoryScoresMap[cat].count++;
      continue;
    }

    evaluatedCount++;
    const score = ans.evaluation?.score ?? 7;
    totalScore += score * 10; // scale 0-10 to 0-100
    categoryScoresMap[cat].total += score * 10;
    categoryScoresMap[cat].count++;

    if (ans.evaluation?.strengths) {
      ans.evaluation.strengths.forEach((s) => strongestSet.add(s));
    }
    if (ans.evaluation?.improvementSuggestions) {
      ans.evaluation.improvementSuggestions.forEach((s) => improvementSet.add(s));
    }
  }

  const overallScore = evaluatedCount > 0 ? Math.round(totalScore / (evaluatedCount + skippedCount)) : 0;
  const technicalScore = Math.min(100, Math.round(overallScore * 1.05));
  const communicationScore = Math.min(100, Math.max(50, overallScore));
  const confidenceScore = Math.min(100, Math.max(60, overallScore + 2));

  const categoryScores: Record<string, number> = {};
  for (const [cat, data] of Object.entries(categoryScoresMap)) {
    categoryScores[cat] = data.count > 0 ? Math.round(data.total / data.count) : 0;
  }

  return {
    overallScore,
    technicalScore,
    communicationScore,
    confidenceScore,
    categoryScores,
    questionsAnswered: evaluatedCount,
    questionsSkipped: skippedCount,
    strongestAreas: Array.from(strongestSet).slice(0, 4),
    topicsToImprove: Array.from(improvementSet).slice(0, 4),
    suggestedPracticeQuestions: [
      `Review algorithmic optimization for ${jobRole} technical scenarios.`,
      'Practice designing resilient database schemas and indexing structures.',
      'Refine STAR-method behavioral responses regarding technical challenges.'
    ],
    recommendedLearningTopics: [
      'Asynchronous Concurrency and Thread Safety',
      'System Design Patterns: Caching, Rate Limiting & Message Queues',
      'Database Sharding, ACID Transactions & Index Optimization'
    ],
    feedbackText: overallScore >= 80
      ? `Exceptional interview demonstration for the ${jobRole} track. Candidate articulated architectural decisions, handled complexity thoroughly, and maintained strong clarity.`
      : overallScore >= 60
      ? `Promising performance for ${jobRole}. Foundational fundamentals are solid; incorporating deeper system design trade-offs and edge cases will improve placement score.`
      : `Baseline technical interview completed. Prioritize strengthening core ${jobRole} fundamentals and code syntax structure.`
  };
}
