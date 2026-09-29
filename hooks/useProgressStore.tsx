/**
 * useProgressStore — single source of lesson/course derivations (SOURCE_OF_TRUTH.md §3.4).
 *   statuses: completed ∈ completions; first uncompleted = current; rest locked.
 *   progress  = completed / total (per course and overall).
 *   streak    = trailing consecutive days (computed from day keys; dates arrive Phase C).
 *   bestScore = max percent per course, persisted to studyo.quiz.attempts.
 * Setters return NEW state objects (updater style). No component imports content/ —
 * data arrives as props; only completions/quizzes attempts persist.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getItem, setItem } from '@/hooks/useStorage';
import type { Course, Lesson, LessonStatus } from '@/types/course';

// --- Pure derivations (exported for unit tests) ------------------------------

/** Delay after completing a lesson before the next one unlocks — 60 minutes. */
export const LESSON_UNLOCK_DELAY_MS = 60 * 60 * 1000;

/**
 * Sequential + time-paced lesson gating (SOURCE_OF_TRUTH §3.4, extended).
 *   completed  — in `completions`.
 *   current    — the first uncompleted lesson, IF its predecessor was completed
 *                at least LESSON_UNLOCK_DELAY_MS ago (or it's the first lesson, or
 *                the predecessor has no recorded timestamp — legacy).
 *   locked     — everything else. A lesson whose predecessor was completed less
 *                than the delay ago stays locked → the next lesson opens only
 *                60 minutes after the previous one is finished, one at a time.
 */
export function deriveLessonStatuses(
  lessons: ReadonlyArray<Pick<Lesson, 'id'>>,
  completions: ReadonlyArray<string>,
  completionTimes: Readonly<Record<string, number>> = {},
  now: number = Date.now(),
): Record<string, LessonStatus> {
  const done = new Set(completions);
  const out: Record<string, LessonStatus> = {};
  let nextAssigned = false; // the first uncompleted lesson has been classified
  for (let i = 0; i < lessons.length; i += 1) {
    const id = lessons[i].id;
    if (done.has(id)) {
      out[id] = 'completed';
      continue;
    }
    if (nextAssigned) {
      out[id] = 'locked';
      continue;
    }
    nextAssigned = true;
    if (i === 0) {
      out[id] = 'current';
      continue;
    }
    const prevId = lessons[i - 1].id;
    if (!done.has(prevId)) {
      out[id] = 'locked'; // must finish the previous lesson first
      continue;
    }
    const prevTime = completionTimes[prevId];
    // Timed gate: unlock once the delay has elapsed since the previous lesson
    // was completed. A missing timestamp (legacy data) never gates.
    out[id] = prevTime === undefined || now - prevTime >= LESSON_UNLOCK_DELAY_MS ? 'current' : 'locked';
  }
  return out;
}

/**
 * Timestamp (ms) at which `lessonId` becomes available, or null when it isn't
 * time-gated (already completed, first lesson, predecessor not done, or no
 * recorded predecessor time). Powers the "Available in X min" hints.
 */
export function nextUnlockAt(
  lessons: ReadonlyArray<Pick<Lesson, 'id'>>,
  completions: ReadonlyArray<string>,
  completionTimes: Readonly<Record<string, number>>,
  lessonId: string,
): number | null {
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx <= 0) return null;
  const done = new Set(completions);
  if (done.has(lessonId)) return null;
  const prevId = lessons[idx - 1].id;
  if (!done.has(prevId)) return null;
  const prevTime = completionTimes[prevId];
  return prevTime === undefined ? null : prevTime + LESSON_UNLOCK_DELAY_MS;
}

export function courseProgress(
  courseId: string,
  lessonCount: number,
  completions: ReadonlyArray<string>,
): number {
  if (lessonCount === 0) return 0;
  const prefix = `${courseId}:`;
  const done = completions.reduce(
    (n, id) => (id.startsWith(prefix) ? n + 1 : n),
    0,
  );
  return done / lessonCount;
}

/** Local calendar-day key (YYYY-MM-DD) — the Daily Goal resets at local midnight. */
export function localDayKey(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Minutes studied on `now`'s local day: the summed duration of every lesson
 * whose completion timestamp falls on today. Powers the Daily Goal bar — each
 * completed lesson credits its authored `minutes` once, and the total resets at
 * local midnight. Durations arrive as a lessonId→minutes map so this stays
 * content-agnostic, like the other derivations here.
 */
export function studiedMinutesOn(
  completionTimes: Readonly<Record<string, number>>,
  durationByLessonId: Readonly<Record<string, number>>,
  now: number = Date.now(),
): number {
  const today = localDayKey(now);
  let sum = 0;
  for (const id in completionTimes) {
    if (localDayKey(completionTimes[id]) === today) sum += durationByLessonId[id] ?? 0;
  }
  return sum;
}

/** Trailing consecutive days from the most recent day key (YYYY-MM-DD or ISO slice). */
export function computeStreak(dayKeys: ReadonlyArray<string>): number {
  if (dayKeys.length === 0) return 0;
  const days = [...new Set(dayKeys)].sort().reverse();
  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    const prev = new Date(`${days[i]}T00:00:00Z`);
    prev.setUTCDate(prev.getUTCDate() - 1);
    const expected = prev.toISOString().slice(0, 10);
    if (days[i + 1] === expected) streak++;
    else break;
  }
  return streak;
}

/**
 * The user's *live* daily streak: consecutive study days ending today (or
 * yesterday, a one-day grace so a streak isn't lost until a full day is missed).
 * If the last study day is older than that, the streak is broken → 0. Study days
 * are the local calendar days on which any lesson was completed.
 */
export function currentStreak(
  completionTimes: Readonly<Record<string, number>>,
  now: number = Date.now(),
): number {
  const dayKeys = Object.values(completionTimes).map(localDayKey);
  if (dayKeys.length === 0) return 0;
  const mostRecent = [...new Set(dayKeys)].sort().reverse()[0];
  if (mostRecent !== localDayKey(now) && mostRecent !== localDayKey(now - 24 * 60 * 60 * 1000)) {
    return 0; // last studied before yesterday → streak broken
  }
  return computeStreak(dayKeys);
}

// --- Context ----------------------------------------------------------------

export type ProgressContextValue = {
  completions: string[];
  completionTimes: Record<string, number>;
  quizAttempts: Record<string, number>;
  hydrating: boolean;
  isComplete: (lessonId: string) => boolean;
  statusFor: (lessons: ReadonlyArray<Lesson>, lessonId: string) => LessonStatus;
  /** When `lessonId` unlocks (ms epoch), or null if it isn't time-gated. */
  unlockAtFor: (lessons: ReadonlyArray<Lesson>, lessonId: string) => number | null;
  courseProgressFor: (course: Course) => number;
  completeCount: number;
  /** Live daily study streak (consecutive days, ending today/yesterday). */
  streak: number;
  bestScore: (courseId: string) => number;
  toggleComplete: (lessonId: string) => void;
  recordQuizResult: (courseId: string, percent: number) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completions, setCompletions] = useState<string[]>([]);
  const [completionTimes, setCompletionTimes] = useState<Record<string, number>>({});
  const [quizAttempts, setQuizAttempts] = useState<Record<string, number>>({});
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    Promise.all([
      getItem<string[]>(STORAGE_KEYS.completions).then((v) => v && setCompletions(v)),
      getItem<Record<string, number>>(STORAGE_KEYS.completionTimes).then((v) => v && setCompletionTimes(v)),
      getItem<Record<string, number>>(STORAGE_KEYS.quizAttempts).then((v) => v && setQuizAttempts(v)),
    ]).finally(() => setHydrating(false));
  }, []);

  const toggleComplete = useCallback((lessonId: string) => {
    const wasComplete = completions.includes(lessonId);
    setCompletions((prev) => {
      const next = wasComplete ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];
      void setItem(STORAGE_KEYS.completions, next);
      return next;
    });
    // Stamp/clear the completion timestamp — powers the timed unlock gate.
    setCompletionTimes((prev) => {
      const next = { ...prev };
      if (wasComplete) delete next[lessonId];
      else next[lessonId] = Date.now();
      void setItem(STORAGE_KEYS.completionTimes, next);
      return next;
    });
  }, [completions]);

  const recordQuizResult = useCallback((courseId: string, percent: number) => {
    setQuizAttempts((prev) => {
      const next = { ...prev, [courseId]: Math.max(prev[courseId] ?? 0, percent) };
      void setItem(STORAGE_KEYS.quizAttempts, next);
      return next;
    });
  }, []);

  const value: ProgressContextValue = {
    completions,
    completionTimes,
    quizAttempts,
    hydrating,
    isComplete: (lessonId) => completions.includes(lessonId),
    statusFor: (lessons, lessonId) => deriveLessonStatuses(lessons, completions, completionTimes)[lessonId] ?? 'locked',
    unlockAtFor: (lessons, lessonId) => nextUnlockAt(lessons, completions, completionTimes, lessonId),
    courseProgressFor: (course) => courseProgress(course.id, course.lessons.length, completions),
    completeCount: completions.length,
    streak: currentStreak(completionTimes),
    bestScore: (courseId) => quizAttempts[courseId] ?? 0,
    toggleComplete,
    recordQuizResult,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgressStore(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgressStore must be used within <ProgressProvider>');
  return ctx;
}