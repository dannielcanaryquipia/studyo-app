import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getItem, setItem } from '@/hooks/useStorage';
import { SEED_NOTIFICATIONS } from '@/src/data/notifications';
import type { AppNotification } from '@/types/notification';

export type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  // notification preferences
  pushEnabled: boolean;
  emailEnabled: boolean;
  quietHoursEnabled: boolean;
  togglePush: () => void;
  toggleEmail: () => void;
  toggleQuietHours: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);

  useEffect(() => {
    Promise.all([
      getItem<string[]>(STORAGE_KEYS.notificationsRead).then((v) => Array.isArray(v) && setReadIds(v)),
      getItem<boolean>('studyo.notif.push').then((v) => v != null && setPushEnabled(v)),
      getItem<boolean>('studyo.notif.email').then((v) => v != null && setEmailEnabled(v)),
      getItem<boolean>('studyo.notif.quiet').then((v) => v != null && setQuietHoursEnabled(v)),
    ]);
  }, []);

  const notifications = useMemo(
    () => SEED_NOTIFICATIONS.map((n) => ({ ...n, read: n.read || readIds.includes(n.id) })),
    [readIds],
  );
  const unreadCount = notifications.reduce((n, item) => (item.read ? n : n + 1), 0);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      void setItem(STORAGE_KEYS.notificationsRead, next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    const next = SEED_NOTIFICATIONS.map((n) => n.id);
    setReadIds(next);
    void setItem(STORAGE_KEYS.notificationsRead, next);
  }, []);

  const togglePush = useCallback(() => setPushEnabled((v) => { const next = !v; void setItem('studyo.notif.push', next); return next; }), []);
  const toggleEmail = useCallback(() => setEmailEnabled((v) => { const next = !v; void setItem('studyo.notif.email', next); return next; }), []);
  const toggleQuietHours = useCallback(() => setQuietHoursEnabled((v) => { const next = !v; void setItem('studyo.notif.quiet', next); return next; }), []);

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, markRead, markAllRead,
      pushEnabled, emailEnabled, quietHoursEnabled,
      togglePush, toggleEmail, toggleQuietHours,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within <NotificationsProvider>');
  return ctx;
}
