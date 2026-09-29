/** Achievement data model — SOURCE_OF_TRUTH.md §3.4 (achievement.ts). Computed, never stored. */
import type { MaterialIconName } from './course';

export type Achievement = {
  id: string;
  icon: MaterialIconName;
  name: string;
  description: string;
  requirements: string;
  /** Derived: 0–1 progress toward earned, from useProgressStore stats. */
  progress: number;
  earned: boolean;
  earnedDate?: string;
};