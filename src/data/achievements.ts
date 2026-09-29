/**
 * src/data/achievements.ts — computed achievement definitions (SOURCE_OF_TRUTH.md §3.4).
 * Achievements are pure functions of progress stats — never stored, always derived.
 * `computeAchievements` is the single source; call it with the values from useProgressStore.
 */
import type { Achievement } from '@/types/achievement';
import type { Course } from '@/types/course';

const SEED: Omit<Achievement, 'progress' | 'earned' | 'earnedDate'>[] = [
  { id: 'first-lesson', icon: 'emoji-events', name: 'First Step', description: 'Complete your first lesson.', requirements: 'Complete 1 lesson' },
  { id: 'five-lessons', icon: 'military-tech', name: 'Getting Started', description: 'Complete 5 lessons.', requirements: 'Complete 5 lessons' },
  { id: 'ten-lessons', icon: 'workspace-premium', name: 'Committed', description: 'Complete 10 lessons.', requirements: 'Complete 10 lessons' },
  { id: 'quiz-ace', icon: 'star', name: 'Quiz Ace', description: 'Score 90% or higher on any quiz.', requirements: 'Score ≥90% on any quiz' },
  { id: 'course-complete', icon: 'school', name: 'Course Champion', description: 'Finish every lesson in a course.', requirements: 'Complete all lessons in one course' },
  { id: 'perfect-score', icon: 'emoji-events', name: 'Perfect Score', description: 'Score 100% on any quiz.', requirements: 'Score 100% on any quiz' },
];

export function computeAchievements(
  completions: readonly string[],
  quizAttempts: Readonly<Record<string, number>>,
  courses: readonly Course[],
): Achievement[] {
  const count = completions.length;
  const scores = Object.values(quizAttempts);
  const best = scores.length > 0 ? Math.max(...scores) : 0;

  return SEED.map((a): Achievement => {
    switch (a.id) {
      case 'first-lesson':
        return { ...a, progress: Math.min(1, count / 1), earned: count >= 1, earnedDate: count >= 1 ? 'Earned' : undefined };
      case 'five-lessons':
        return { ...a, progress: Math.min(1, count / 5), earned: count >= 5, earnedDate: count >= 5 ? 'Earned' : undefined };
      case 'ten-lessons':
        return { ...a, progress: Math.min(1, count / 10), earned: count >= 10, earnedDate: count >= 10 ? 'Earned' : undefined };
      case 'quiz-ace':
        return { ...a, progress: Math.min(1, best / 90), earned: best >= 90, earnedDate: best >= 90 ? 'Earned' : undefined };
      case 'course-complete': {
        const done = courses.some((c) => c.lessons.length > 0 && c.lessons.every((l) => completions.includes(l.id)));
        return { ...a, progress: done ? 1 : 0, earned: done, earnedDate: done ? 'Earned' : undefined };
      }
      case 'perfect-score':
        return { ...a, progress: Math.min(1, best / 100), earned: best >= 100, earnedDate: best >= 100 ? 'Earned' : undefined };
      default:
        return { ...a, progress: 0, earned: false };
    }
  });
}
