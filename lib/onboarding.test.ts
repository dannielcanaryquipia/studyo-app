/**
 * lib/onboarding.test.ts — §6.2 pure-logic suite for lib/onboarding.ts.
 * Interests gate boundaries (2/3/4) and goal → minutes mapping with fallbacks.
 */
import { canContinueInterests, GOAL_MINUTES, goalToMinutes } from '@/lib/onboarding';

describe('canContinueInterests', () => {
  it('blocks fewer than 3 distinct selections', () => {
    expect(canContinueInterests([])).toBe(false);
    expect(canContinueInterests(['alpabeto'])).toBe(false);
    expect(canContinueInterests(['alpabeto', 'patinig'])).toBe(false);
  });

  it('allows exactly 3 distinct selections', () => {
    expect(canContinueInterests(['alpabeto', 'patinig', 'katinig'])).toBe(true);
  });

  it('allows 4+ selections', () => {
    expect(canContinueInterests(['alpabeto', 'patinig', 'katinig', 'diptonggo'])).toBe(true);
  });

  it('collapses duplicates and ignores empty strings', () => {
    expect(canContinueInterests(['alpabeto', 'alpabeto', 'patinig', ''])).toBe(false);
    expect(canContinueInterests(['alpabeto', 'patinig', 'katinig', 'katinig'])).toBe(true);
  });
});

describe('goalToMinutes', () => {
  it('maps each goal pace to the §3.4 minutes', () => {
    expect(goalToMinutes('casual')).toBe(GOAL_MINUTES.casual);
    expect(goalToMinutes('regular')).toBe(GOAL_MINUTES.regular);
    expect(goalToMinutes('intensive')).toBe(GOAL_MINUTES.intensive);
  });

  it('falls back to the casual default for null/undefined', () => {
    expect(goalToMinutes(null)).toBe(15);
    expect(goalToMinutes(undefined)).toBe(15);
  });
});