import { describe, it, expect } from 'vitest';
import * as aptitudeEngine from '../src/lib/aptitudeEngine.js';
import { safeJson, parseApiResponse } from '../src/lib/api.js';

describe('Aptitude Assessment Engine & Safe API Tests', () => {
  it('safeJson and parseApiResponse safely handle empty response bodies without crashing', async () => {
    // Simulate 204 No Content
    const response204 = new Response(null, { status: 204, statusText: 'No Content' });
    const parsed204 = await parseApiResponse(response204);
    expect(parsed204.ok).toBe(true);
    expect(parsed204.status).toBe(204);
    expect(parsed204.data).toEqual({});

    // Simulate empty 500 error (such as an empty proxy error)
    const empty500 = new Response('', { status: 500, statusText: 'Internal Server Error' });
    const parsed500 = await parseApiResponse(empty500);
    expect(parsed500.ok).toBe(false);
    expect(parsed500.data.error).toBe('Internal Server Error');

    // Verify safeJson does not throw 'Unexpected end of JSON input'
    const safeResult = await safeJson(empty500);
    expect(safeResult.error).toBe('Internal Server Error');

    // Simulate HTML/plain text error page
    const htmlErr = new Response('<html><body>Gateway Timeout</body></html>', {
      status: 504,
      headers: { 'content-type': 'text/html' }
    });
    const parsedHtml = await safeJson(htmlErr);
    expect(parsedHtml.message).toContain('Gateway Timeout');
  });

  it('generates 30 questions with 6 questions per category across all 5 domains', () => {
    const categories = aptitudeEngine.getCategoriesMeta();
    expect(categories.length).toBe(5);

    const attempt = aptitudeEngine.createNewAttempt('test-student-1');
    expect(attempt.questions.length).toBe(30);
    expect(attempt.remainingSeconds).toBe(1800);
    expect(attempt.status).toBe('IN_PROGRESS');

    const counts: Record<string, number> = {};
    for (const q of attempt.questions) {
      counts[q.category] = (counts[q.category] || 0) + 1;
      // CRITICAL SECURITY: Ensure correct answer is NOT exposed to candidate
      expect((q as any).correctAnswerIndex).toBeUndefined();
      expect((q as any).explanation).toBeUndefined();
      expect(q.options.length).toBe(4);
    }

    expect(counts['Quantitative Aptitude']).toBe(6);
    expect(counts['Logical Reasoning']).toBe(6);
    expect(counts['Verbal Ability']).toBe(6);
    expect(counts['Technical Aptitude']).toBe(6);
    expect(counts['Data Interpretation & Analytical Reasoning']).toBe(6);
  });

  it('supports answering, review marking, and answer updates', () => {
    const attempt = aptitudeEngine.createNewAttempt('test-student-2');
    const firstQ = attempt.questions[0];

    const updated = aptitudeEngine.saveAnswer(attempt.id, firstQ.id, 2, true, 'test-student-2');
    expect(updated).not.toBeNull();
    expect(updated.answers[firstQ.id]).toBe(2);
    expect(updated.markedForReview).toContain(firstQ.id);
    expect(updated.answeredCount).toBe(1);
    expect(updated.markedCount).toBe(1);
  });

  it('tracks security violations and flags termination on 3rd departure', () => {
    const attempt = aptitudeEngine.createNewAttempt('test-student-3');

    const v1 = aptitudeEngine.recordViolation(attempt.id, 'TAB_SWITCH', 'test-student-3');
    expect(v1.violationsCount).toBe(1);
    expect(v1.terminated).toBe(false);

    const v2 = aptitudeEngine.recordViolation(attempt.id, 'EXIT_FULLSCREEN', 'test-student-3');
    expect(v2.violationsCount).toBe(2);
    expect(v2.terminated).toBe(false);

    const v3 = aptitudeEngine.recordViolation(attempt.id, 'TAB_SWITCH', 'test-student-3');
    expect(v3.violationsCount).toBe(3);
    expect(v3.terminated).toBe(true);
    expect(v3.attempt.status).toBe('VIOLATION_TERMINATED');
  });

  it('calculates accurate scores, domain breakdowns, and solutions upon submission', () => {
    const attempt = aptitudeEngine.createNewAttempt('test-student-4');
    const bank = aptitudeEngine.loadQuestionBank();
    for (let i = 0; i < 5; i++) {
      const q = attempt.questions[i];
      const correctIdx = bank.find((b) => b.id === q.id)?.correctAnswerIndex ?? 0;
      aptitudeEngine.saveAnswer(attempt.id, q.id, correctIdx, false, 'test-student-4');
    }

    const result = aptitudeEngine.submitAttempt(attempt.id, 'Manual completion', 'test-student-4');
    expect(result).not.toBeNull();
    expect(result.totalQuestions).toBe(30);
    expect(result.score).toBe(5);
    expect(result.correctCount).toBe(5);
    expect(result.incorrectCount).toBe(0);
    expect(result.unansweredCount).toBe(25);
    expect(result.questionReviews.length).toBe(30);

    // After submission, verified solutions & explanations are available
    for (const rev of result.questionReviews) {
      expect(rev.correctAnswerIndex).toBeDefined();
      expect(rev.explanation).toBeTruthy();
    }
  });

  it('rotates questions when creating a new question set to avoid repeats', () => {
    const attempt1 = aptitudeEngine.createNewAttempt('test-student-rotation');
    const attempt2 = aptitudeEngine.createNewAttempt('test-student-rotation');

    const ids1 = new Set(attempt1.questions.map((q) => q.id));
    const ids2 = new Set(attempt2.questions.map((q) => q.id));

    // Both attempts must have 30 questions
    expect(ids1.size).toBe(30);
    expect(ids2.size).toBe(30);

    let overlap = 0;
    for (const id of ids2) {
      if (ids1.has(id)) overlap++;
    }
    expect(overlap).toBeLessThan(30);
  });
});
