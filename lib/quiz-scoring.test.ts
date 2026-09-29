/**
 * lib/quiz-scoring.test.ts — §6.2 pure-logic suite for lib/quiz-scoring.ts.
 * gradeQuiz boundaries (all-right / all-wrong / partial / empty) + best-score retention.
 */
import { averageScore, gradeQuiz, recordBestScore } from '@/lib/quiz-scoring';

const QS = [{ correctIndex: 0 }, { correctIndex: 2 }, { correctIndex: 1 }];

describe('gradeQuiz', () => {
  it('scores a perfect attempt at 100%', () => {
    expect(gradeQuiz([0, 2, 1], QS)).toEqual({ score: 3, total: 3, percent: 100 });
  });

  it('scores an all-wrong attempt at 0%', () => {
    expect(gradeQuiz([1, 0, 2], QS)).toEqual({ score: 0, total: 3, percent: 0 });
  });

  it('scores partial attempts with rounding', () => {
    // [0,0,0]: Q0 correct (0=0), Q1 wrong (0≠2), Q2 wrong (0≠1) → 1/3 = 33%
    expect(gradeQuiz([0, 0, 0], QS)).toEqual({ score: 1, total: 3, percent: 33 });
  });

  it('treats unanswered (null) options as wrong', () => {
    expect(gradeQuiz([null, 2, null], QS)).toEqual({ score: 1, total: 3, percent: 33 });
  });

  it('rounds partial attempts down', () => {
    // Math.round(1/3 * 100) = Math.round(33.33) = 33, not 34
    expect(gradeQuiz([0, 0, 0], QS).percent).toBe(33);
    // Math.round(2/3 * 100) = Math.round(66.67) = 67, not 66
    expect(gradeQuiz([0, 2, 0], QS).percent).toBe(67);
  });

  it('grades an empty quiz to a 0/0 no-op', () => {
    expect(gradeQuiz([], [])).toEqual({ score: 0, total: 0, percent: 0 });
  });
});

describe('recordBestScore', () => {
  it('never regresses a stored best', () => {
    expect(recordBestScore(80, 90)).toBe(90);
    expect(recordBestScore(90, 80)).toBe(90);
    expect(recordBestScore(0, 0)).toBe(0);
  });
});

describe('averageScore', () => {
  it('returns 0 when no quizzes have been taken', () => {
    expect(averageScore([])).toBe(0);
  });

  it('averages and rounds to a whole percent', () => {
    expect(averageScore([100, 90, 80])).toBe(90);
    expect(averageScore([100, 0])).toBe(50);
    expect(averageScore([33, 33, 34])).toBe(33); // 33.33 → 33
  });
});