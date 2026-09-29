/**
 * hooks/useProgressStore.test.ts — Phase B §6.2 required unit test.
 * progress = completed/total; unlock-next; streak math; persistence (mocked AsyncStorage).
 */
import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { Course, Lesson } from '@/types/course';
import {
  computeStreak,
  courseProgress,
  deriveLessonStatuses,
  LESSON_UNLOCK_DELAY_MS,
  nextUnlockAt,
  ProgressProvider,
  useProgressStore,
} from './useProgressStore';

const makeLesson = (order: number): Lesson => ({
  id: `c1:${order}`,
  courseId: 'c1',
  title: `Lesson ${order}`,
  description: '',
  order,
  durationMin: 10,
  content: '',
  status: 'locked',
});
const lessons = (n: number) => Array.from({ length: n }, (_, i) => makeLesson(i + 1));

const course: Course = {
  id: 'c1',
  title: 'Course',
  description: 'd',
  category: 'Wika',
  instructor: 'i',
  duration: '1h',
  rating: 4,
  difficulty: 'Beginner',
  icon: 'book',
  lessons: lessons(3),
  progress: 0,
};

describe('deriveLessonStatuses (sequential + timed gate)', () => {
  const NOW = 1_700_000_000_000;

  it('empty → first current, rest locked', () => {
    const s = deriveLessonStatuses(lessons(3), []);
    expect(s).toEqual({ 'c1:1': 'current', 'c1:2': 'locked', 'c1:3': 'locked' });
  });

  it('completion with no timestamp (legacy) does not gate the next lesson', () => {
    const s = deriveLessonStatuses(lessons(3), ['c1:1']);
    expect(s).toEqual({ 'c1:1': 'completed', 'c1:2': 'current', 'c1:3': 'locked' });
  });

  it('completing the previous lesson within the delay locks the next', () => {
    // finished 10 minutes ago → still inside the 60-minute gate
    const s = deriveLessonStatuses(lessons(3), ['c1:1'], { 'c1:1': NOW - 10 * 60 * 1000 }, NOW);
    expect(s).toEqual({ 'c1:1': 'completed', 'c1:2': 'locked', 'c1:3': 'locked' });
  });

  it('once the delay has elapsed the next lesson unlocks', () => {
    const s = deriveLessonStatuses(lessons(3), ['c1:1'], { 'c1:1': NOW - LESSON_UNLOCK_DELAY_MS }, NOW);
    expect(s).toEqual({ 'c1:1': 'completed', 'c1:2': 'current', 'c1:3': 'locked' });
  });

  it('all completed → all completed', () => {
    const s = deriveLessonStatuses(lessons(3), ['c1:1', 'c1:2', 'c1:3']);
    expect(s).toEqual({ 'c1:1': 'completed', 'c1:2': 'completed', 'c1:3': 'completed' });
  });
});

describe('nextUnlockAt', () => {
  it('returns prev completion time + delay for the gated next lesson', () => {
    const t = 1_700_000_000_000;
    expect(nextUnlockAt(lessons(3), ['c1:1'], { 'c1:1': t }, 'c1:2')).toBe(t + LESSON_UNLOCK_DELAY_MS);
  });

  it('returns null when the lesson is not time-gated', () => {
    // first lesson, already-completed lesson, or predecessor not done
    expect(nextUnlockAt(lessons(3), [], {}, 'c1:1')).toBeNull();
    expect(nextUnlockAt(lessons(3), ['c1:1'], { 'c1:1': 1 }, 'c1:1')).toBeNull();
    expect(nextUnlockAt(lessons(3), [], {}, 'c1:3')).toBeNull();
  });
});

describe('courseProgress', () => {
  it('progress = completed/total, scoped to its own course', () => {
    const p = courseProgress('c1', 3, ['c1:1', 'c1:2', 'c2:9', 'garbage']);
    expect(p).toBeCloseTo(2 / 3);
  });

  it('zero lessons → 0 (avoids divide-by-zero)', () => {
    expect(courseProgress('c1', 0, ['c1:1'])).toBe(0);
  });
});

describe('computeStreak', () => {
  it('counts trailing consecutive days', () => {
    expect(computeStreak(['2026-09-13', '2026-09-14', '2026-09-15'])).toBe(3);
  });

  it('breaks on a gap', () => {
    expect(computeStreak(['2026-09-11', '2026-09-13', '2026-09-14'])).toBe(2);
  });

  it('dedupes and handles empty', () => {
    expect(computeStreak(['2026-09-15', '2026-09-15'])).toBe(1);
    expect(computeStreak([])).toBe(0);
  });
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProgressProvider>{children}</ProgressProvider>
);

describe('useProgressStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('toggleComplete persists to completions and updates derived progress', async () => {
    const { result } = await renderHook(() => useProgressStore(), { wrapper });

    expect(result.current.courseProgressFor(course)).toBe(0);
    await act(async () => {
      result.current.toggleComplete('c1:1');
    });
    expect(result.current.isComplete('c1:1')).toBe(true);
    expect(result.current.completeCount).toBe(1);
    expect(result.current.courseProgressFor(course)).toBeCloseTo(1 / 3);
    await expect(AsyncStorage.getItem(STORAGE_KEYS.completions)).resolves.toBe(JSON.stringify(['c1:1']));

    // toggle off → counts back down (new state object, not mutation)
    await act(async () => {
      result.current.toggleComplete('c1:1');
    });
    expect(result.current.completeCount).toBe(0);
  });

  it('recordQuizResult keeps the best score and persists it', async () => {
    const { result } = await renderHook(() => useProgressStore(), { wrapper });
    await act(async () => {
      result.current.recordQuizResult('c1', 60);
      result.current.recordQuizResult('c1', 90);
      result.current.recordQuizResult('c1', 40);
    });
    expect(result.current.bestScore('c1')).toBe(90);
    await expect(AsyncStorage.getItem(STORAGE_KEYS.quizAttempts)).resolves.toBe('{"c1":90}');
  });

  it('hydrates persisted completions on mount (roundtrip)', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.completions, JSON.stringify(['c1:1', 'c1:2']));
    const { result } = await renderHook(() => useProgressStore(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.completeCount).toBe(2);
    expect(result.current.statusFor(course.lessons, 'c1:3')).toBe('current');
  });
});