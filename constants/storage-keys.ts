/**
 * AsyncStorage keys — SOURCE_OF_TRUTH.md §3.4 (Persistence).
 * Every key degrades gracefully to defaults; no versioned migration in v1.
 */
export const STORAGE_KEYS = {
  theme: 'studyo.theme',
  onboarded: 'studyo.onboarded',
  goal: 'studyo.goal',
  interests: 'studyo.interests',
  completions: 'studyo.completions',
  completionTimes: 'studyo.completionTimes',
  quizAttempts: 'studyo.quiz.attempts',
  contentLang: 'studyo.contentLang',
  profile: 'studyo.profile',
  notificationsRead: 'studyo.notifications.read',
  /** TEMPORARY diagnostics: last fatal JS error, shown by CrashOverlay. */
  lastCrash: 'studyo.diagnostics.lastCrash',
  /** TEMPORARY diagnostics: launch breadcrumb trail, see lib/diagnostics.ts. */
  launchTrail: 'studyo.diagnostics.launchTrail',
  schemaVersion: 'studyo.schemaVersion', // reserved
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];