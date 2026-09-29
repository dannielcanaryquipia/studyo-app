/**
 * lib/onboarding-state.ts — the single owner of "has this user onboarded?".
 *
 * Two places need this answer and they must agree: /splash picks the launch
 * destination from it, and Log Out has to reverse exactly that decision.
 *
 * They used to be two independent readings of three keys, and they disagreed.
 * Log Out cleared only `onboarded`, while /splash also routed to /(tabs) when
 * `interests` and `goal` were both present — which they always are after a
 * completed onboarding. So logging out resolved straight back to the home
 * screen and the reset silently did nothing.
 *
 * Both the read and the reset now come from here, over the same key list.
 */
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getItem, removeItem } from '@/hooks/useStorage';
import type { Goal } from '@/types/user';

/** The keys that together represent a completed onboarding. */
export const ONBOARDING_KEYS = [
  STORAGE_KEYS.onboarded,
  STORAGE_KEYS.interests,
  STORAGE_KEYS.goal,
] as const;

export type OnboardingState = {
  onboarded: boolean | null;
  interests: string[] | null;
  goal: Goal | null;
};

export type LaunchDestination = '/(tabs)' | '/onboarding/welcome';

/** Read all three onboarding keys. Individual failures degrade to null. */
export function readOnboardingState(): Promise<OnboardingState> {
  return Promise.all([
    getItem<boolean>(STORAGE_KEYS.onboarded),
    getItem<string[]>(STORAGE_KEYS.interests),
    getItem<Goal>(STORAGE_KEYS.goal),
  ]).then(([onboarded, interests, goal]) => ({ onboarded, interests, goal }));
}

/**
 * Where a cold start lands. Either signal counts: the explicit flag, or the
 * presence of both onboarding answers (so a partial write still counts as
 * onboarded rather than trapping the user in onboarding).
 */
export function resolveLaunchDestination(state: OnboardingState): LaunchDestination {
  const hasOnboardingData = state.interests != null && state.goal != null;
  return state.onboarded === true || hasOnboardingData ? '/(tabs)' : '/onboarding/welcome';
}

/** Clear every onboarding key, so the next cold start lands in onboarding. */
export async function resetOnboarding(): Promise<void> {
  await Promise.all(ONBOARDING_KEYS.map((key) => removeItem(key)));
}
