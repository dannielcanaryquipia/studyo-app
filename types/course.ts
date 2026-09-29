/** Course / lesson data model — SOURCE_OF_TRUTH.md §3.4 (course.ts). */
import type { ComponentProps } from 'react';
import type MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export type LessonStatus = 'completed' | 'current' | 'locked'; // DERIVED in useProgressStore

/** Content language for bilingual courses. tl = Tagalog/Filipino, bcl = Bikol (Sorsoganon). */
export type ContentLang = 'tl' | 'bcl';

/** Optional Bikol (Sorsoganon) translation of a lesson's display + body text. */
export type LessonI18n = { title: string; description: string; content: string };

/** Optional Bikol (Sorsoganon) translation of a course's display text. */
export type CourseI18n = { title: string; description: string };

export type Lesson = {
  id: string; // `${courseId}:${order}`
  courseId: string;
  title: string;
  description: string;
  order: number;
  durationMin: number;
  /** Markdown body, rendered via LessonBody — never inline strings in screens. */
  content: string;
  status: LessonStatus;
  /** Bikol (Sorsoganon) variant; absent for monolingual courses. */
  bicol?: LessonI18n;
};

export type CourseCategory = 'Wika' | 'Language';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type Course = {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  instructor: string;
  duration: string;
  rating: number;
  difficulty: Difficulty;
  icon: MaterialIconName;
  lessons: Lesson[];
  /** Derived: completed / total, from useProgressStore. */
  progress: number;
  /**
   * "What you'll learn" bullets on the course-detail Overview tab.
   * Authored per course in content/<course>/course.json so they track that
   * course's own lessons — they are not interchangeable between courses.
   */
  outcomes: string[];
  /** Bikol (Sorsoganon) variant of the outcomes; absent for monolingual courses. */
  outcomesBicol?: string[];
  /** Bikol (Sorsoganon) variant of the course display text; absent for monolingual courses. */
  bicol?: CourseI18n;
};