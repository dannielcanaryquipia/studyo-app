/**
 * content-registry — pure load/validate over Phase-0 authored seeds.
 * SOURCE_OF_TRUTH.md §3.5 pipeline, §4.3.4 integrity invariants (unit-tested).
 * Real `content/` files hydrate through `src/data/courses.ts` once Phase 0 authors
 * them; this layer stays offline-deterministic (no async, no web).
 */
import type { Course, CourseCategory, CourseI18n, Difficulty, Lesson, LessonI18n, MaterialIconName } from '@/types/course';
import type { LessonQuiz, Quiz } from '@/types/quiz';

/** One unbundled lesson slot — `id` is the manifest ref (`.md` file stem). */
export type RawLesson = {
  id: string;
  title: string;
  description: string;
  order: number;
  durationMin: number;
  body: string;
  /** Optional Bikol (Sorsoganon) variant sourced from the Left folios. */
  bicol?: { title: string; description: string; body: string };
};

/** Bundle-level seed that the content pipeline flattens from course.json + lessons/*.md. */
export type CourseSeed = {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  instructor: string;
  duration: string;
  rating: number;
  difficulty: Difficulty;
  icon: MaterialIconName;
  /** topic ids from topics.json — must match the manifest course-id set (§4.3.4). */
  topics?: string[];
  lessons: RawLesson[];
  quiz?: Quiz;
  /** Optional Bikol (Sorsoganon) variant of the course display text. */
  bicol?: CourseI18n;
};

/** Optionally pass lesson file stems actually bundled (no orphan, refs resolve). */
export type RegistryValidationInput = {
  seeds: CourseSeed[];
  availableLessonFiles?: string[];
};

export type IssueCode = 'course' | 'quiz' | 'manifest' | 'orphan' | 'topic';
export type RegistryIssue = { code: IssueCode; courseId?: string; detail: string };

const hasText = (s: string) => s.trim().length > 0;

/** Flatten a seed to the app Course shape. Status/progress are useProgressStore territory. */
export function hydrateCourse(seed: CourseSeed): Course {
  const lessons: Lesson[] = seed.lessons.map((l) => {
    const bicol: LessonI18n | undefined = l.bicol
      ? { title: l.bicol.title, description: l.bicol.description, content: l.bicol.body }
      : undefined;
    return {
      id: `${seed.id}:${l.order}`,
      courseId: seed.id,
      title: l.title,
      description: l.description,
      order: l.order,
      durationMin: l.durationMin,
      content: l.body,
      status: 'locked',
      ...(bicol ? { bicol } : {}),
    };
  });
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    category: seed.category,
    instructor: seed.instructor,
    duration: seed.duration,
    rating: seed.rating,
    difficulty: seed.difficulty,
    icon: seed.icon,
    lessons,
    progress: 0,
    ...(seed.bicol ? { bicol: seed.bicol } : {}),
  };
}

export function validateRegistry({ seeds, availableLessonFiles }: RegistryValidationInput): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const courseIds = new Set<string>();

  for (const seed of seeds) {
    const scope = { courseId: seed.id };

    if (courseIds.has(seed.id)) {
      issues.push({ ...scope, code: 'manifest', detail: `duplicate course id "${seed.id}"` });
    }
    courseIds.add(seed.id);

    // course invariants
    if (seed.lessons.length === 0) {
      issues.push({ ...scope, code: 'course', detail: 'course has no lessons' });
    }
    const orders = new Set<number>();
    const lessonIds = new Set<string>();
    for (const lesson of seed.lessons) {
      if (!hasText(lesson.title)) issues.push({ ...scope, code: 'course', detail: `lesson "${lesson.id}" title empty` });
      if (!hasText(lesson.body)) issues.push({ ...scope, code: 'course', detail: `lesson "${lesson.id}" content empty` });
      if (!Number.isInteger(lesson.order) || lesson.order < 0) {
        issues.push({ ...scope, code: 'course', detail: `lesson "${lesson.id}" order ${lesson.order} not a non-negative int` });
      } else if (orders.has(lesson.order)) {
        issues.push({ ...scope, code: 'course', detail: `duplicate lesson order ${lesson.order}` });
      }
      orders.add(lesson.order);
      if (lessonIds.has(lesson.id)) {
        issues.push({ ...scope, code: 'manifest', detail: `duplicate lesson id "${lesson.id}"` });
      }
      lessonIds.add(lesson.id);
    }

    // quiz invariants
    const quiz = seed.quiz;
    if (quiz) {
      if (quiz.questions.length === 0) {
        issues.push({ ...scope, code: 'quiz', detail: 'quiz has no questions' });
      }
      for (const question of quiz.questions) {
        if (question.options.length < 2) {
          issues.push({ ...scope, code: 'quiz', detail: 'question has <2 options' });
        }
        if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
          issues.push({ ...scope, code: 'quiz', detail: `correctIndex ${question.correctIndex} out of range` });
        }
        const lessonId = question.lessonId;
        if (lessonId !== undefined && !lessonIds.has(lessonId) && !lessonIds.has(`${seed.id}:${lessonId}`)) {
          issues.push({ ...scope, code: 'quiz', detail: `question lessonId "${lessonId}" does not resolve` });
        }
      }
    }
  }

  // orphan + unresolved refs (only checkable when bundled file stems are known).
  // File stems carry the course prefix ("course/lesson"), so refs are compared
  // qualified and orphan leaves are resolved back to a lesson id.
  if (availableLessonFiles) {
    const files = new Set(availableLessonFiles);
    for (const seed of seeds) {
      for (const lesson of seed.lessons) {
        const qualified = `${seed.id}/${lesson.id}`;
        if (!files.has(qualified)) {
          issues.push({ courseId: seed.id, code: 'manifest', detail: `lesson ref "${qualified}" resolves to no bundled .md` });
        }
      }
    }
    for (const file of availableLessonFiles) {
      const sep = file.indexOf('/');
      const courseId = sep === -1 ? file : file.slice(0, sep);
      const leaf = sep === -1 ? file : file.slice(sep + 1);
      const inCourse = seeds.find((s) => s.id === courseId);
      const referenced = inCourse && inCourse.lessons.some((l) => l.id === leaf);
      if (!referenced) {
        issues.push({ code: 'orphan', courseId, detail: `bundled .md "${file}" is referenced by no lesson` });
      }
    }
  }

  // topics.json ids match course.json ids
  const topicList = seeds.flatMap((s) => s.topics ?? []);
  if (topicList.length > 0) {
    const sortedTopics = [...topicList].sort();
    const sortedCourses = [...courseIds].sort();
    if (sortedTopics.length !== sortedCourses.length || sortedTopics.some((t, i) => t !== sortedCourses[i])) {
      issues.push({ code: 'topic', detail: 'topics.json ids do not match course.json ids' });
    }
  }

  return issues;
}

/**
 * Resolve a question's `lessonId` to the canonical `${courseId}:${order}` id.
 * Accepts the canonical id, a bare order ("2"), or a lesson file stem ("02-alpabeto").
 * Returns null when nothing resolves (question is then dropped from per-lesson grouping).
 */
function resolveLessonId(seed: CourseSeed, rawLessonId: string | undefined): string | null {
  if (!rawLessonId) return null;
  for (const l of seed.lessons) {
    const canonical = `${seed.id}:${l.order}`;
    if (rawLessonId === canonical || rawLessonId === l.id || rawLessonId === String(l.order) || rawLessonId === `${seed.id}:${l.id}`) {
      return canonical;
    }
  }
  return null;
}

/**
 * Split a course's quiz into per-lesson quizzes, one per lesson (in lesson order)
 * that has at least one resolvable question. Powers the course-detail assessment.
 */
export function groupQuizByLesson(seed: CourseSeed): LessonQuiz[] {
  if (!seed.quiz) return [];
  const byLesson = new Map<string, Quiz['questions']>();
  for (const question of seed.quiz.questions) {
    const lessonId = resolveLessonId(seed, question.lessonId);
    if (!lessonId) continue;
    const bucket = byLesson.get(lessonId) ?? [];
    bucket.push(question);
    byLesson.set(lessonId, bucket);
  }
  return seed.lessons
    .map((l) => `${seed.id}:${l.order}`)
    .filter((lessonId) => byLesson.has(lessonId))
    .map((lessonId) => ({ courseId: seed.id, lessonId, questions: byLesson.get(lessonId)! }));
}

export function buildRegistry({ seeds }: RegistryValidationInput): {
  courses: Course[];
  quizzes: Quiz[];
  lessonQuizzes: LessonQuiz[];
} {
  return {
    courses: seeds.map(hydrateCourse),
    quizzes: seeds.flatMap((s) => (s.quiz ? [{ ...s.quiz, courseId: s.id }] : [])),
    lessonQuizzes: seeds.flatMap(groupQuizByLesson),
  };
}