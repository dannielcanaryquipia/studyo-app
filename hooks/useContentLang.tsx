/**
 * useContentLang — single source for the course-content language toggle.
 *   pref ('tl' | 'bcl') persisted to STORAGE_KEYS.contentLang; drives which
 *   variant bilingual courses (e.g. Ortograpiyang Sorsoganon) render — Tagalog
 *   or Bikol (Sorsoganon). Monolingual courses ignore it and fall back to `tl`.
 * Hydration mirrors useTheme: start at the default, reconcile the stored pref
 * once AsyncStorage resolves. Persistence is fire-and-forget (never blocks UI).
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getItem, setItem } from '@/hooks/useStorage';
import type { ContentLang } from '@/types/course';

export type ContentLangContextValue = {
  lang: ContentLang;
  setLang: (lang: ContentLang) => void;
};

const ContentLangContext = createContext<ContentLangContextValue | null>(null);

export function ContentLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<ContentLang>('tl');

  useEffect(() => {
    getItem<ContentLang>(STORAGE_KEYS.contentLang).then((stored) => {
      if (stored === 'tl' || stored === 'bcl') setLangState(stored);
    });
  }, []);

  const setLang = useCallback((next: ContentLang) => {
    setLangState(next);
    void setItem(STORAGE_KEYS.contentLang, next);
  }, []);

  return (
    <ContentLangContext.Provider value={{ lang, setLang }}>{children}</ContentLangContext.Provider>
  );
}

export function useContentLang(): ContentLangContextValue {
  const ctx = useContext(ContentLangContext);
  if (!ctx) throw new Error('useContentLang must be used within <ContentLangProvider>');
  return ctx;
}

/** Resolve the display fields for a course in the active language (falls back to Tagalog). */
export function courseText(
  course: { title: string; description: string; bicol?: { title: string; description: string } },
  lang: ContentLang,
): { title: string; description: string } {
  return lang === 'bcl' && course.bicol ? course.bicol : { title: course.title, description: course.description };
}

/** Resolve the display + body fields for a lesson in the active language (falls back to Tagalog). */
export function lessonText(
  lesson: { title: string; description: string; content: string; bicol?: { title: string; description: string; content: string } },
  lang: ContentLang,
): { title: string; description: string; content: string } {
  return lang === 'bcl' && lesson.bicol
    ? lesson.bicol
    : { title: lesson.title, description: lesson.description, content: lesson.content };
}

/**
 * Resolve the "What you'll learn" bullets in the active language.
 *
 * Sits alongside courseText/lessonText so the course-detail screen has one
 * rule for picking a language variant. Falls back to the authored outcomes when
 * a course has no Bikol variants, so a monolingual course (or a bilingual one
 * missing outcomesBicol) still reads correctly in both toggles.
 */
export function courseOutcomes(
  course: { outcomes: string[]; outcomesBicol?: string[] },
  lang: ContentLang,
): string[] {
  return lang === 'bcl' && course.outcomesBicol ? course.outcomesBicol : course.outcomes;
}
