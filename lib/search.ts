/**
 * lib/search.ts — course catalog search, indexed over the LESSONS we actually have.
 * A course matches when every whitespace-separated term appears somewhere in its
 * searchable text: the course title/category/instructor OR any lesson's full
 * data — title, description, and markdown body (plus the Bikol variant when a
 * lesson has one). Multi-term queries are AND-matched (all terms must hit).
 * `lessonMatches` lists the titles of lessons that individually match the whole
 * query, so the UI can show *why* a course surfaced. Pure + unit-tested.
 */
import type { Course, Lesson } from '@/types/course';

export type CourseSearchResult = { course: Course; matchedLessons: Lesson[] };

const norm = (s: string) => s.toLowerCase();

/** Full lesson text (incl. body + Bikol variant) — used to decide if a course matches. */
function lessonHaystack(lesson: Lesson): string {
  const bicol = lesson.bicol ? ` ${lesson.bicol.title} ${lesson.bicol.description} ${lesson.bicol.content}` : '';
  return norm(`${lesson.title} ${lesson.description} ${lesson.content}${bicol}`);
}

/** Title + description only — used for the clean "Matches:" lesson hints. */
function lessonLabel(lesson: Lesson): string {
  const bicol = lesson.bicol ? ` ${lesson.bicol.title} ${lesson.bicol.description}` : '';
  return norm(`${lesson.title} ${lesson.description}${bicol}`);
}

function terms(query: string): string[] {
  return norm(query)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function searchCourses(courses: readonly Course[], query: string): CourseSearchResult[] {
  const ts = terms(query);
  if (ts.length === 0) return courses.map((course) => ({ course, matchedLessons: [] }));

  const results: CourseSearchResult[] = [];
  for (const course of courses) {
    const haystack = `${norm(course.title)} ${norm(course.category)} ${norm(course.instructor)} ${course.lessons.map(lessonHaystack).join(' ')}`;
    if (!ts.every((term) => haystack.includes(term))) continue;

    // Lessons whose title/description match the whole query — shown as their own cards.
    const matchedLessons = course.lessons.filter((l) => ts.every((term) => lessonLabel(l).includes(term)));
    results.push({ course, matchedLessons });
  }
  return results;
}
