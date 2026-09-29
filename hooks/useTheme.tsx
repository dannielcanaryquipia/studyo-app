/**
 * useTheme — single theme source (SOURCE_OF_TRUTH.md §3.1 "Theme resolution").
 *   pref ('system'|'light'|'dark') persisted to STORAGE_KEYS.theme;
 *   effective isDark = pref === 'system' ? device scheme : pref === 'dark';
 *   setPref writes storage and flips state → the single `.dark` class on the
 *   root View (app/_layout.tsx) re-themes every token in the tree.
 * Hydration: start synchronously from device scheme (no flash), then reconcile
 * the stored pref once AsyncStorage resolves.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { mark, STEPS } from '@/lib/diagnostics';
import { getItem, setItem } from '@/hooks/useStorage';
import type { ThemePref } from '@/types/user';

export type ThemeContextValue = {
  pref: ThemePref;
  isDark: boolean;
  setPref: (pref: ThemePref) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  mark(STEPS.THEME_PROVIDER_RENDER);
  const deviceScheme = useColorScheme(); // 'light' | 'dark' | null
  const [pref, setPrefState] = useState<ThemePref>('system');

  useEffect(() => {
    getItem<ThemePref>(STORAGE_KEYS.theme).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPrefState(stored);
      }
    });
  }, []);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    // Fire-and-forget: persistence failure must never break theme switching.
    void setItem(STORAGE_KEYS.theme, next);
  }, []);

  const isDark = pref === 'system' ? deviceScheme === 'dark' : pref === 'dark';

  return (
    <ThemeContext.Provider value={{ pref, isDark, setPref }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}