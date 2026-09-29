/**
 * lib/onboarding.ts — pure onboarding logic, unit-tested per SOURCE_OF_TRUTH.md §6.2.
 * Interests gate: ≥3 selections enable Continue. Goal mapping: pace → minutes/day.
 * Screens wire persistence (useStorage) around these; no storage/UI here.
 */
import type { Goal } from '@/types/user';

/** A selection counts when it is a non-empty id; duplicates collapse. */
export function canContinueInterests(selected: readonly string[]): boolean {
  return new Set(selected.filter((s) => s.length > 0)).size >= 3;
}

/** Minutes-per-day for each goal pace (§3.4: casual 15 · regular 30 · intensive 60). */
export const GOAL_MINUTES: Record<Goal, number> = {
  casual: 15,
  regular: 30,
  intensive: 60,
};

const DEFAULT_MINUTES = GOAL_MINUTES.casual;

/** Resolve a goal to minutes; unknown/unset degrades to the casual default. */
export function goalToMinutes(goal: Goal | null | undefined): number {
  return (goal && GOAL_MINUTES[goal]) || DEFAULT_MINUTES;
}