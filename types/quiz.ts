/** Quiz data model — SOURCE_OF_TRUTH.md §3.4 (quiz.ts). Authored from transcriptions in Phase 0. */
export type Option = { letter: 'A' | 'B' | 'C' | 'D'; text: string };
export type Question = {
  text: string;
  options: Option[];
  correctIndex: number;
  explanation: string;
  /** Optional (SOF §4.3.4): links a question to a specific lesson; resolves at registry-time. */
  lessonId?: string;
};
export type Quiz = { courseId: string; questions: Question[] };
/** A quiz scoped to a single lesson — the per-lesson assessment shown in course detail. */
export type LessonQuiz = { courseId: string; lessonId: string; questions: Question[] };
export type QuizResult = { score: number; total: number; percent: number; answers: number[] };