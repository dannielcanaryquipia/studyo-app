/**
 * src/data/notifications.ts — seeded in-app notifications (no remote push yet).
 * The provider (hooks/useNotifications) overlays persisted read state on top.
 */
import type { AppNotification } from '@/types/notification';

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'system',
    icon: 'info',
    title: 'Welcome to Studyo!',
    description: 'Start your first lesson to begin tracking your progress.',
    time: 'Today',
    read: false,
  },
  {
    id: 'n2',
    type: 'course',
    icon: 'school',
    title: 'New course available',
    description: 'Bikol–Sorsogon Orthography has been added to your catalog.',
    time: '1d ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'achievement',
    icon: 'emoji-events',
    title: 'Achievement unlocked',
    description: 'Complete your first lesson to earn the First Step badge.',
    time: '2d ago',
    read: true,
  },
];
