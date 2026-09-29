/**
 * src/data/categories.ts — onboarding interest topics, DERIVED from the lessons
 * we actually ship. One selectable topic per lesson (id = lesson id), so the
 * onboarding interests always reflect the real curriculum instead of a static,
 * hand-maintained list. Labels are shortened from the lesson title; the icon is
 * inherited from the owning course. Pure — screens pass `courses` in.
 */
import type { Course, MaterialIconName } from '@/types/course';

export type InterestCategory = {
  id: string;
  label: string;
  icon: MaterialIconName;
};

/** Shorten a lesson title to a chip-sized topic label (drop the ": subtitle" tail). */
export function shortTopicLabel(title: string): string {
  const head = title.split(/[:—–]/)[0].trim();
  return head.length >= 3 ? head : title.trim();
}

/** Build the interest topics from every lesson across the given courses. */
export function buildInterestTopics(courses: readonly Course[]): InterestCategory[] {
  const topics: InterestCategory[] = [];
  for (const course of courses) {
    for (const lesson of course.lessons) {
      topics.push({ id: lesson.id, label: shortTopicLabel(lesson.title), icon: course.icon });
    }
  }
  return topics;
}
