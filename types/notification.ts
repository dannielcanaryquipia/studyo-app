/** In-app notification model — SOURCE_OF_TRUTH.md §3.4 (notification.ts). Seeded, screen-owned. */
import type { MaterialIconName } from './course';

export type NotificationType = 'course' | 'achievement' | 'system';

export type AppNotification = {
  id: string;
  type: NotificationType;
  icon: MaterialIconName;
  title: string;
  description: string;
  /** Display string (e.g. "Today", "2d ago"); seeded data owns formatting. */
  time: string;
  read: boolean;
};