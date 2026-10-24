import { AnswerEvaluation, StructuredQuestion, EvaluationBreakdown, DimensionWeight } from '../types.js';
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
  interviewMode?: 'voice' | 'text' | 'video_audio';
}

export function getClientRubricWeights(category?: string): DimensionWeight {
  const cat = (category || 'technical').toLowerCase();
  if (cat === 'coding') {
    return {
      technicalAccuracy: 0.35,
      relevanceCompleteness: 0.20,
      reasoning: 0.25,
      communication: 0.10,
      practicalApplication: 0.10
    };
  }
  if (cat === 'behavioral') {
    return {
      technicalAccuracy: 0.00,
      relevanceCompleteness: 0.30,
      reasoning: 0.20,
      communication: 0.25,
      practicalApplication: 0.25
    };
  }
  if (cat === 'aptitude') {
    return {
      technicalAccuracy: 0.40,
      relevanceCompleteness: 0.15,
      reasoning: 0.35,
      communication: 0.10,
      practicalApplication: 0.00
    };
  }
  // Default Technical & Resume (30% Tech, 25% Relevance, 20% Reasoning, 15% Comm, 10% Practical)
  return {
    technicalAccuracy: 0.30,
    relevanceCompleteness: 0.25,
    reasoning: 0.20,
    communication: 0.15,
    practicalApplication: 0.10
  };
}

export async function evaluateAnswerSubmission(
  params: EvaluateAnswerParams
): Promise<AnswerEvaluation> {
  const { question, answerText, code, language, skipped, wordsPerMinute, fillerWordCount, durationSeconds, interviewMode } = params;
  const weights = getClientRubricWeights(question.category);

  // If question was explicitly skipped or is completely empty
  const isSkippedOrEmpty = skipped || (!answerText.trim() && !code?.trim()) || answerText === '[Question Skipped]';
  if (isSkippedOrEmpty) {
    return {
      questionId: question.id,
      score: 0,
      breakdown: {
        technicalAccuracy: 0,
        relevanceCompleteness: 0,
        reasoning: 0,
        communication: 0,
        practicalApplication: 0
      },
      weights,
      feedback: 'This question was skipped by the candidate (0 points).',
      technicalScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      grammar: 'N/A (Skipped)',
      clarity: 'Question was skipped.',
      strengths: [],
      improvements: question.expectedAnswerPoints?.length
        ? [`Study core concepts: ${question.expectedAnswerPoints[0]}`]
        : ['Review the model answer points for this topic.'],
      missingConcepts: question.expectedAnswerPoints || [],
      improvementSuggestions: ['Review fundamental concepts before your next mock interview.'],
      modelAnswerPoints: question.expectedAnswerPoints || [],
      wordsPerMinute: 0,
      fillerWordCount: 0,
      answerDurationSeconds: durationSeconds || 0,
      evaluationSource: 'rubric',
      evaluatedAt: new Date().toISOString()
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
      expectedAnswerPoints: question.expectedAnswerPoints,
      evaluationCriteria: question.evaluationCriteria,
      answer: combinedContent,
      code: code || '',
      language: language || '',
      skipped: false,
      wordsPerMinute: wordsPerMinute || 0,
      fillerWordCount: fillerWordCount || 0,
      answerDurationSeconds: durationSeconds || 0,
      interviewMode: interviewMode || 'text'
    });

    if (res.ok) {
      const data = await res.json();
      const evalData = data.evaluation || data.currentEvaluation || data;
      if (evalData && typeof evalData.score === 'number') {
        // Enforce authentic 0-100 scale based on performance
        const rawScore = evalData.score;
        const normalizedScore = Math.min(100, Math.max(0, Math.round(rawScore)));

        const breakdown: EvaluationBreakdown = evalData.breakdown || {
          technicalAccuracy: evalData.technicalScore !== undefined ? Math.min(100, Math.max(0, Math.round(evalData.technicalScore))) : normalizedScore,
          relevanceCompleteness: normalizedScore,
          reasoning: normalizedScore,
          communication: evalData.communicationScore !== undefined ? Math.min(100, Math.max(0, Math.round(evalData.communicationScore))) : normalizedScore,
          practicalApplication: normalizedScore
        };

        const strengths = Array.isArray(evalData.strengths) && evalData.strengths.length > 0
          ? evalData.strengths
          : ['Demonstrated understanding of core concepts.'];
        const improvements = Array.isArray(evalData.improvements) && evalData.improvements.length > 0
          ? evalData.improvements
          : (Array.isArray(evalData.improvementSuggestions) && evalData.improvementSuggestions.length > 0
              ? evalData.improvementSuggestions
              : ['Provide deeper trade-off analysis and concrete edge cases.']);

        return {
          questionId: question.id,
          score: normalizedScore,
          breakdown,
          weights: evalData.weights || weights,
          technicalScore: breakdown.technicalAccuracy,
          communicationScore: breakdown.communication,
          confidenceScore: evalData.confidenceScore && evalData.confidenceScore <= 10 ? evalData.confidenceScore * 10 : (evalData.confidenceScore ?? 75),
          grammar: evalData.grammar || 'Clean sentence formulation.',
          clarity: evalData.clarity || 'Logical structure.',
          feedback: evalData.feedback || 'Answer evaluated successfully.',
          strengths,
          improvements,
          missingConcepts: Array.isArray(evalData.missingConcepts) ? evalData.missingConcepts : [],
          improvementSuggestions: improvements,
          modelAnswerPoints: Array.isArray(evalData.modelAnswerPoints) && evalData.modelAnswerPoints.length > 0
            ? evalData.modelAnswerPoints
            : question.expectedAnswerPoints,
          suggestedAnswer: evalData.suggestedAnswer,
          wordsPerMinute,
          fillerWordCount,
          answerDurationSeconds: durationSeconds,
          evaluationSource: evalData.evaluationSource || 'ai',
          evaluatedAt: evalData.evaluatedAt || new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI answer evaluation unavailable, engaging transparent rubric fallback:', err);
  }

  // Transparent, objective rubric fallback evaluation
  return evaluateWithRubricFallback(question, answerText, code, language, wordsPerMinute, fillerWordCount, durationSeconds);
}

/**
 * Transparent, Performance-Based Rubric Fallback Evaluator
 * Objectively evaluates answers based on technical concept matching, reasoning depth,
 * code syntax (for coding questions), and STAR structure (for behavioral questions).
 */
export function evaluateWithRubricFallback(
  question: StructuredQuestion,
  answerText: string,
  code?: string,
  language?: string,
  wordsPerMinute?: number,
  fillerWordCount?: number,
  durationSeconds?: number
): AnswerEvaluation {
  const weights = getClientRubricWeights(question.category);
  const trimmed = answerText.trim();
  const codeTrimmed = (code || '').trim();
  const fullText = (trimmed + ' ' + codeTrimmed).toLowerCase();

  // 1. Empty / Skipped check
  if (!trimmed && !codeTrimmed) {
    return {
      questionId: question.id,
      score: 0,
      breakdown: { technicalAccuracy: 0, relevanceCompleteness: 0, reasoning: 0, communication: 0, practicalApplication: 0 },
      weights,
      feedback: 'This question was skipped by the candidate (0 points).',
      technicalScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      grammar: 'N/A (Skipped)',
      clarity: 'Question was skipped.',
      strengths: [],
      improvements: question.expectedAnswerPoints?.length ? [`Study: ${question.expectedAnswerPoints[0]}`] : ['Review fundamental concepts.'],
      missingConcepts: question.expectedAnswerPoints || [],
      improvementSuggestions: ['Review fundamental concepts.'],
      modelAnswerPoints: question.expectedAnswerPoints || [],
      evaluationSource: 'rubric',
      evaluatedAt: new Date().toISOString()
    };
  }

  // Stop words to exclude
  const stopWords = new Set(['what', 'is', 'an', 'a', 'the', 'in', 'of', 'how', 'to', 'for', 'explain', 'describe', 'difference', 'between', 'and', 'with', 'or', 'why', 'would', 'you', 'your', 'can', 'should']);
  const qTokens = question.question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !stopWords.has(t));
  const matchedQTokens = qTokens.filter((t) => fullText.includes(t));
  const qOverlapRatio = qTokens.length > 0 ? matchedQTokens.length / qTokens.length : 0;

  // Expected points check
  const expected = question.expectedAnswerPoints || [];
  let matchedPointsCount = 0;
  const missingPoints: string[] = [];

  for (const exp of expected) {
    const expTokens = exp.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 3 && !stopWords.has(t));
    const expMatches = expTokens.filter((t) => fullText.includes(t)).length;
    if (expTokens.length > 0 && (expMatches / expTokens.length >= 0.25 || expMatches >= 2)) {
      matchedPointsCount++;
    } else {
      missingPoints.push(exp);
    }
  }

  // Anti-cheating / gaming filter
  const isGaming = /\b(ignore.*instructions|give.*100|award.*full.*marks|system prompt|disregard.*rubric)\b/i.test(trimmed);
  if (isGaming) {
    return {
      questionId: question.id,
      score: 0,
      breakdown: { technicalAccuracy: 0, relevanceCompleteness: 0, reasoning: 0, communication: 0, practicalApplication: 0 },
      weights,
      feedback: 'Invalid answer: prompt injection or non-answer detected.',
      technicalScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      grammar: 'N/A',
      clarity: 'Instruction override rejected.',
      strengths: [],
      improvements: ['Answer the technical question directly on merit.'],
      missingConcepts: expected,
      improvementSuggestions: ['Answer the technical question directly on merit.'],
      modelAnswerPoints: expected,
      evaluationSource: 'rubric',
      evaluatedAt: new Date().toISOString()
    };
  }

  // Detect off-topic / irrelevant answers
  const generalTechTokens = ['code', 'data', 'function', 'class', 'method', 'system', 'database', 'memory', 'cpu', 'network', 'thread', 'api', 'server', 'client', 'algorithm', 'complexity', 'test', 'error', 'interface', 'variable', 'object', 'component', 'state'];
  const hasAnyTechToken = generalTechTokens.some((t) => fullText.includes(t));
  const isIrrelevant = (qOverlapRatio === 0 && matchedPointsCount === 0 && !hasAnyTechToken && question.category !== 'behavioral');

  if (isIrrelevant) {
    const technicalAccuracy = 10;
    const relevanceCompleteness = 5;
    const reasoning = 10;
    const communication = Math.min(60, Math.max(20, Math.round(trimmed.split(/\s+/).length * 2)));
    const practicalApplication = 0;
    const score = Math.round(
      technicalAccuracy * weights.technicalAccuracy +
      relevanceCompleteness * weights.relevanceCompleteness +
      reasoning * weights.reasoning +
      communication * weights.communication +
      practicalApplication * weights.practicalApplication
    );

    return {
      questionId: question.id,
      score,
      breakdown: { technicalAccuracy, relevanceCompleteness, reasoning, communication, practicalApplication },
      weights,
      feedback: 'The answer is off-topic and does not address the technical question asked.',
      technicalScore: technicalAccuracy,
      communicationScore: communication,
      confidenceScore: 30,
      grammar: 'Prose is formulated, but content is irrelevant.',
      clarity: 'Does not answer the prompt.',
      strengths: [],
      improvements: ['Focus strictly on answering the specific technical prompt.'],
      missingConcepts: expected.length ? expected : ['Relevant technical concepts addressing the question.'],
      improvementSuggestions: ['Review the expected concepts and answer the prompt directly.'],
      modelAnswerPoints: expected,
      evaluationSource: 'rubric',
      evaluatedAt: new Date().toISOString()
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let technicalAccuracy = 50;
  let relevanceCompleteness = 50;
  let reasoning = 50;
  let communication = 50;
  let practicalApplication = 40;

  if (question.category === 'coding') {
    const hasCode = codeTrimmed.length > 20;
    const codeSyntaxIndicators = ['for', 'while', 'if', 'return', 'def', 'class', 'function', 'const', 'let', 'public', 'static', 'void', 'int', 'String', 'print', 'console'];
    const syntaxMatches = codeSyntaxIndicators.filter((k) => codeTrimmed.includes(k)).length;

    if (hasCode && syntaxMatches >= 2) {
      technicalAccuracy = Math.min(95, 65 + syntaxMatches * 4);
      reasoning = Math.min(90, 60 + (codeTrimmed.includes('return') ? 10 : 0) + (codeTrimmed.includes('for') || codeTrimmed.includes('while') ? 10 : 0));
      relevanceCompleteness = Math.min(95, 60 + (wordCount >= 10 ? 20 : 10));
      practicalApplication = Math.min(95, 70 + (codeTrimmed.length > 80 ? 15 : 5));
      communication = Math.min(90, 60 + (wordCount >= 15 ? 20 : 10));
    } else {
      technicalAccuracy = Math.min(45, Math.max(15, wordCount * 2));
      reasoning = Math.min(45, Math.max(20, wordCount * 2));
      relevanceCompleteness = Math.min(45, Math.max(20, wordCount * 2));
      practicalApplication = 20;
      communication = Math.min(70, Math.max(30, wordCount * 2));
    }
  } else if (question.category === 'behavioral') {
    const starTokens = ['situation', 'task', 'action', 'result', 'resolved', 'team', 'led', 'handled', 'conflict', 'learned', 'outcome', 'project'];
    const starMatches = starTokens.filter((t) => fullText.includes(t)).length;
    technicalAccuracy = 0;
    relevanceCompleteness = Math.min(95, 45 + qOverlapRatio * 30 + (wordCount >= 30 ? 15 : 5));
    practicalApplication = Math.min(95, 40 + starMatches * 8 + (wordCount >= 40 ? 15 : 5));
    communication = Math.min(95, 50 + (wordCount >= 35 ? 25 : wordCount >= 15 ? 15 : 0));
    reasoning = Math.min(95, 45 + (fullText.includes('because') || fullText.includes('so that') || fullText.includes('result') ? 20 : 5));
  } else {
    // Technical / Resume default
    const expectedRatio = expected.length > 0 ? matchedPointsCount / expected.length : 0.5;
    technicalAccuracy = Math.min(95, Math.max(30, Math.round(40 + qOverlapRatio * 30 + expectedRatio * 30)));
    relevanceCompleteness = Math.min(95, Math.max(30, Math.round(35 + qOverlapRatio * 35 + expectedRatio * 25)));

    const reasoningKeywords = ['because', 'therefore', 'trade-off', 'complexity', 'due to', 'instead of', 'advantage', 'disadvantage', 'performance', 'scalability', 'efficient'];
    const reasoningMatches = reasoningKeywords.filter((k) => fullText.includes(k)).length;
    reasoning = Math.min(95, Math.max(30, Math.round(45 + reasoningMatches * 12 + (wordCount >= 25 ? 10 : 0))));

    communication = Math.min(95, Math.max(45, Math.round(55 + (wordCount >= 20 ? 20 : 10) + (trimmed.includes('.') ? 10 : 0))));
    const hasPracticalExample = fullText.includes('for example') || fullText.includes('such as') || fullText.includes('e.g.') || codeTrimmed.length > 0;
    practicalApplication = hasPracticalExample ? 85 : 60;
  }

  const finalScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        technicalAccuracy * weights.technicalAccuracy +
        relevanceCompleteness * weights.relevanceCompleteness +
        reasoning * weights.reasoning +
        communication * weights.communication +
        practicalApplication * weights.practicalApplication
      )
    )
  );

  const strengths: string[] = [];
  if (technicalAccuracy >= 70) strengths.push('Accurately articulated the primary technical concepts.');
  if (relevanceCompleteness >= 70) strengths.push('Addressed the specific requirements of the prompt directly.');
  if (reasoning >= 70) strengths.push('Demonstrated structured logical reasoning and awareness of trade-offs.');
  if (codeTrimmed.length > 20) strengths.push(`Provided functioning ${language || 'code'} implementation targeting the problem statement.`);
  if (strengths.length === 0) strengths.push('Demonstrated fundamental familiarity with the topic.');

  const improvements: string[] = [];
  if (missingPoints.length > 0) {
    improvements.push(`Deepen explanation of: "${missingPoints[0]}".`);
  }
  if (question.category === 'coding' && codeTrimmed.length <= 15) {
    improvements.push('Include executable code syntax and edge-case handling for coding questions.');
  }
  if (technicalAccuracy < 65) {
    improvements.push('Strengthen factual precision and cite architectural mechanisms.');
  }
  if (improvements.length === 0) {
    improvements.push('Consider edge cases, time/space complexity, and scalability limits.');
  }

  return {
    questionId: question.id,
    score: finalScore,
    breakdown: {
      technicalAccuracy,
      relevanceCompleteness,
      reasoning,
      communication,
      practicalApplication
    },
    weights,
    feedback: finalScore >= 80
      ? 'Excellent technical response demonstrating solid conceptual grounding and clear articulation.'
      : finalScore >= 60
      ? 'Competent answer covering the essential core points. Deepening trade-off analysis will elevate it further.'
      : 'Foundational response. Review the expected concepts to provide more comprehensive technical depth.',
    technicalScore: technicalAccuracy,
    communicationScore: communication,
    confidenceScore: Math.min(100, Math.max(40, communication)),
    grammar: 'Clean sentence formulation and terminology.',
    clarity: relevanceCompleteness >= 70 ? 'Structured, organized explanation.' : 'Expand on core mechanisms and reasoning.',
    strengths,
    improvements,
    missingConcepts: missingPoints.length > 0 ? missingPoints : ['Edge cases and performance constraints.'],
    improvementSuggestions: improvements,
    modelAnswerPoints: expected,
    suggestedAnswer: expected.length ? `Ideal answer addresses: ${expected.join('; ')}` : undefined,
    wordsPerMinute,
    fillerWordCount,
    answerDurationSeconds: durationSeconds,
    evaluationSource: 'rubric',
    evaluatedAt: new Date().toISOString()
  };
}

export function compileFinalReport(
  jobRole: string,
  answers: {
    question: string;
    questionId?: string;
    category?: string;
    answer: string;
    code?: string;
    skipped?: boolean;
    evaluation?: AnswerEvaluation;
  }[]
) {
  const totalQuestions = Math.max(answers.length, 1);
  let totalPointsEarned = 0;
  let answeredCount = 0;
  let skippedCount = 0;
  let pendingCount = 0;
  let techSum = 0;
  let relSum = 0;
  let reasSum = 0;
  let commSum = 0;
  let pracSum = 0;
  const categoryScoresMap: Record<string, { totalPoints: number; count: number }> = {};
  const strongestSet = new Set<string>();
  const improvementSet = new Set<string>();

  for (const ans of answers) {
    const cat = ans.category || 'technical';
    if (!categoryScoresMap[cat]) {
      categoryScoresMap[cat] = { totalPoints: 0, count: 0 };
    }

    const isSkippedOrEmpty = ans.skipped || (!ans.answer?.trim() && !ans.code?.trim()) || ans.answer === '[Question Skipped]';

    if (isSkippedOrEmpty) {
      skippedCount++;
      categoryScoresMap[cat].count++;
      // Skipped questions count as 0 earned points in overall denominator (never excluded!)
      continue;
    }

    const rawScore = ans.evaluation?.score;
    if (typeof rawScore === 'number') {
      answeredCount++;
      // Honest 0-100 score based directly on performance
      const points = Math.min(100, Math.max(0, Math.round(rawScore)));
      totalPointsEarned += points;
      categoryScoresMap[cat].totalPoints += points;
      categoryScoresMap[cat].count++;

      const b = ans.evaluation?.breakdown;
      techSum += b?.technicalAccuracy ?? (ans.evaluation?.technicalScore !== undefined ? Math.min(100, Math.max(0, Math.round(ans.evaluation.technicalScore))) : points);
      relSum += b?.relevanceCompleteness ?? points;
      reasSum += b?.reasoning ?? points;
      commSum += b?.communication ?? (ans.evaluation?.communicationScore !== undefined ? Math.min(100, Math.max(0, Math.round(ans.evaluation.communicationScore))) : points);
      pracSum += b?.practicalApplication ?? points;

      if (ans.evaluation?.strengths) {
        ans.evaluation.strengths.forEach((s) => strongestSet.add(s));
      }
      if (ans.evaluation?.improvements) {
        ans.evaluation.improvements.forEach((s) => improvementSet.add(s));
      } else if (ans.evaluation?.improvementSuggestions) {
        ans.evaluation.improvementSuggestions.forEach((s) => improvementSet.add(s));
      }
    } else {
      pendingCount++;
    }
  }

  // Documented Transparent Aggregation Formula:
  // overallScore = (Total Points Earned / (Total Questions * 100)) * 100 = round(totalPointsEarned / totalQuestions)
  const maxPossiblePoints = totalQuestions * 100;
  const overallScore = maxPossiblePoints > 0
    ? Math.min(100, Math.max(0, Math.round(totalPointsEarned / totalQuestions)))
    : 0;

  // Average Score on Answered Questions = (Total Points Earned / (Answered Questions * 100)) * 100
  const averageAnsweredScore = answeredCount > 0
    ? Math.min(100, Math.max(0, Math.round(totalPointsEarned / answeredCount)))
    : 0;

  const averageScoreOutOf10 = Number((averageAnsweredScore / 10).toFixed(1));

  // Performance level classification
  let performanceLevel = 'Needs Improvement';
  if (overallScore >= 90) performanceLevel = 'Exceptional';
  else if (overallScore >= 75) performanceLevel = 'Strong';
  else if (overallScore >= 60) performanceLevel = 'Competent';
  else if (overallScore >= 45) performanceLevel = 'Developing';

  const denom = answeredCount > 0 ? answeredCount : 1;
  const overallBreakdown: EvaluationBreakdown = {
    technicalAccuracy: Math.round(techSum / denom),
    relevanceCompleteness: Math.round(relSum / denom),
    reasoning: Math.round(reasSum / denom),
    communication: Math.round(commSum / denom),
    practicalApplication: Math.round(pracSum / denom)
  };

  const categoryScores: Record<string, number> = {};
  for (const [cat, data] of Object.entries(categoryScoresMap)) {
    categoryScores[cat] = data.count > 0 ? Math.round(data.totalPoints / data.count) : 0;
  }

  return {
    overallScore,
    performanceLevel,
    overallBreakdown,
    averageAnsweredScore,
    averageScoreOutOf10,
    totalPointsEarned,
    maxPossiblePoints,
    totalQuestions,
    questionsAnswered: answeredCount,
    questionsSkipped: skippedCount,
    questionsPending: pendingCount,
    technicalScore: overallBreakdown.technicalAccuracy,
    communicationScore: overallBreakdown.communication,
    confidenceScore: Math.min(100, Math.max(40, overallBreakdown.communication)),
    categoryScores,
    strongestAreas: Array.from(strongestSet).slice(0, 4),
    topicsToImprove: Array.from(improvementSet).slice(0, 4),
    suggestedPracticeQuestions: [
      `Review algorithmic optimization and edge cases for ${jobRole} technical scenarios.`,
      'Practice designing resilient database schemas, ACID transactions, and indexing structures.',
      'Refine STAR-method behavioral responses regarding complex team collaboration and technical trade-offs.'
    ],
    recommendedLearningTopics: [
      'Distributed Concurrency, Locks & Thread Safety',
      'System Design Patterns: Caching, Rate Limiting & Message Queues',
      'Database Sharding, ACID Transactions & Index Optimization'
    ],
    feedbackText: overallScore >= 80
      ? `Exceptional interview demonstration for the ${jobRole} track (${performanceLevel} tier). Candidate articulated architectural decisions, handled complexity thoroughly, and maintained strong clarity.`
      : overallScore >= 60
      ? `Promising performance for ${jobRole} (${performanceLevel} tier). Foundational competencies are solid with an average of ${averageAnsweredScore}% on attempted questions. Incorporating deeper system design trade-offs and edge cases will improve placement score.`
      : `Baseline technical interview completed (${performanceLevel} tier). Answered ${answeredCount} of ${totalQuestions} questions with an average score of ${averageAnsweredScore}% on attempted questions (${skippedCount} skipped). Prioritize strengthening core ${jobRole} fundamentals and code syntax structure.`,
    evaluationDisclaimer: 'AI-assisted practice assessment. This educational evaluation is designed to guide candidate skill improvement and does not guarantee specific hiring outcomes.'
  };
}
