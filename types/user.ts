/** User prefs data model — SOURCE_OF_TRUTH.md §3.4 (user.ts). */
export type ThemePref = 'light' | 'dark' | 'system';
export type Goal = 'casual' | 'regular' | 'intensive'; // 15 / 30 / 60 min per day

export type UserPrefs = {
  theme: ThemePref;
  onboarded: boolean;
  goal?: Goal;
  interests: string[];
  streakDays: number;
};