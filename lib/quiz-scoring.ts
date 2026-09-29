/**
 * lib/quiz-scoring.ts — pure quiz scoring math, unit-tested per SOURCE_OF_TRUTH.md §6.2.
 * The quiz screen ([courseId]) assembles the submitted answers, this grades them and
 * tracks best-score retention. Deterministic, no storage/UI/threading.
 */
export type QuizGrade = {
  score: number;
  total: number;
  percent: number;
};

const clampPercent = (percent: number) => Math.max(0, Math.min(100, percent));

/**
 * Grade a full attempt. `answers[i]` is the submitted 0-based option index for
 * question i (null = unanswered); `questions` is the quiz's questions (only
 * `correctIndex` matters here so the math stays pure). percent is rounded and
 * clamped to 0–100; an empty quiz grades to a 0/0 no-op.
 */
export function gradeQuiz(
  answers: readonly (number | null)[],
  questions: readonly { correctIndex: number }[],
): QuizGrade {
  const total = questions.length;
  let score = 0;
  for (let i = 0; i < total; i += 1) {
    const answer = answers[i];
    if (answer !== null && answer === questions[i].correctIndex) {
      score += 1;
    }
  }
  const percent = total === 0 ? 0 : clampPercent(Math.round((score / total) * 100));
  return { score, total, percent };
}

/** Best-percent retention across attempts (never regresses). */
export function recordBestScore(prev: number, candidate: number): number {
  return Math.max(prev, candidate);
}

/** Mean of the given quiz scores, rounded to a whole percent (0 when none taken). */
export function averageScore(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((total, score) => total + score, 0);
  return Math.round(sum / scores.length);
}