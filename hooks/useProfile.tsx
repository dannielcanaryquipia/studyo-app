/**
 * useProfile — editable learner profile (display name + tagline), persisted to
 * STORAGE_KEYS.profile. Mirrors the useTheme/useContentLang provider pattern:
 * start from defaults, reconcile stored values once AsyncStorage resolves, and
 * write-through on every edit (fire-and-forget). Consumed by the Profile tab,
 * Account settings, and the Home greeting so edits sync live across the app.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getItem, setItem } from '@/hooks/useStorage';

export type Profile = { name: string; tagline: string; avatarUri?: string };

const DEFAULT_PROFILE: Profile = { name: 'Learner', tagline: 'Studyo Student' };

export type ProfileContextValue = Profile & {
  setProfile: (patch: Partial<Profile>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    getItem<Partial<Profile>>(STORAGE_KEYS.profile).then((stored) => {
      if (stored && typeof stored === 'object') {
        setProfileState((prev) => ({ ...prev, ...stored }));
      }
    });
  }, []);

  const setProfile = useCallback((patch: Partial<Profile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...patch };
      void setItem(STORAGE_KEYS.profile, next);
      return next;
    });
  }, []);

  return <ProfileContext.Provider value={{ ...profile, setProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within <ProfileProvider>');
  return ctx;
}

/** Up-to-two-letter initials from a display name (for the avatar). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** First name for casual greetings ("Hello, Ana!"). */
export function firstName(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? 'there';
}
