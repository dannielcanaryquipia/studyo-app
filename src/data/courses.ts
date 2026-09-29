/**
 * src/data/courses.ts — app-level content entry point (SOURCE_OF_TRUTH.md §3.5).
 * Loads Phase-0 .md lessons + course.json + quiz.json via buildRegistry.
 * Screens consume `courses` and `quizzes` — no direct imports of content/ allowed.
 */
import { parseFrontmatter } from '@/lib/frontmatter';
import { buildRegistry, type CourseSeed, type RawLesson } from '@/src/repositories/content-registry';
import type { Course } from '@/types/course';
import type { LessonQuiz, Quiz } from '@/types/quiz';

import courseMeta1 from '@/content/ortograpiyang-pambansa/course.json';
import quizData1 from '@/content/ortograpiyang-pambansa/quiz.json';
import op01 from '@/content/ortograpiyang-pambansa/lessons/01-introduksiyon.md';
import op02 from '@/content/ortograpiyang-pambansa/lessons/02-alpabeto.md';
import op03 from '@/content/ortograpiyang-pambansa/lessons/03-mga-tuldik.md';
import op04 from '@/content/ortograpiyang-pambansa/lessons/04-pantig.md';
import op05 from '@/content/ortograpiyang-pambansa/lessons/05-paghahati-ng-pantig.md';
import op06 from '@/content/ortograpiyang-pambansa/lessons/06-pagbaybay-pasalita-pasulat.md';
import op07 from '@/content/ortograpiyang-pambansa/lessons/07-ang-walong-bagong-titik.md';
import op08 from '@/content/ortograpiyang-pambansa/lessons/08-mga-salitang-hiram.md';
import op09 from '@/content/ortograpiyang-pambansa/lessons/09-palitang-e-i-at-o-u.md';
import op10 from '@/content/ortograpiyang-pambansa/lessons/10-pagpapalit-ng-d-sa-r.md';
import op11 from '@/content/ortograpiyang-pambansa/lessons/11-ng-at-nang.md';
import op12 from '@/content/ortograpiyang-pambansa/lessons/12-mga-bantas-bahagi-uno.md';
import op13 from '@/content/ortograpiyang-pambansa/lessons/13-mga-bantas-bahagi-dalawa.md';
import op14 from '@/content/ortograpiyang-pambansa/lessons/14-ang-gitling.md';
import op15 from '@/content/ortograpiyang-pambansa/lessons/15-mga-pangalan-at-mga-bilang.md';

import courseMeta2 from '@/content/ortograpiyang-sorsoganon/course.json';
import quizData2 from '@/content/ortograpiyang-sorsoganon/quiz.json';
import os01 from '@/content/ortograpiyang-sorsoganon/lessons/01-introduksiyon.md';
import os02 from '@/content/ortograpiyang-sorsoganon/lessons/02-grafema.md';
import os03 from '@/content/ortograpiyang-sorsoganon/lessons/03-silaba.md';
import os04 from '@/content/ortograpiyang-sorsoganon/lessons/04-pahilwas-na-pag-ispeling.md';
import os05 from '@/content/ortograpiyang-sorsoganon/lessons/05-pasurat-na-pag-ispeling.md';
import os06 from '@/content/ortograpiyang-sorsoganon/lessons/06-kambal-patinig.md';
import os07 from '@/content/ortograpiyang-sorsoganon/lessons/07-kambal-katinig-nan-digrapo.md';
import os08 from '@/content/ortograpiyang-sorsoganon/lessons/08-salyuhan-san-e-i-nan-o-u.md';
import os09 from '@/content/ortograpiyang-sorsoganon/lessons/09-mga-bantas.md';
import os10 from '@/content/ortograpiyang-sorsoganon/lessons/10-pangbuod.md';

// Bikol (Sorsoganon) variants — sourced from the Kaliwa/Left folios of the KWF book.
import osb01 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/01-introduksiyon.md';
import osb02 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/02-grafema.md';
import osb03 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/03-silaba.md';
import osb04 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/04-pahilwas-na-pag-ispeling.md';
import osb05 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/05-pasurat-na-pag-ispeling.md';
import osb06 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/06-kambal-patinig.md';
import osb07 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/07-kambal-katinig-nan-digrapo.md';
import osb08 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/08-salyuhan-san-e-i-nan-o-u.md';
import osb09 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/09-mga-bantas.md';
import osb10 from '@/content/ortograpiyang-sorsoganon/lessons-bcl/10-pangbuod.md';

const OP_RAW = [op01, op02, op03, op04, op05, op06, op07, op08, op09, op10, op11, op12, op13, op14, op15];
const OP_STEMS = [
  '01-introduksiyon', '02-alpabeto', '03-mga-tuldik', '04-pantig',
  '05-paghahati-ng-pantig', '06-pagbaybay-pasalita-pasulat',
  '07-ang-walong-bagong-titik', '08-mga-salitang-hiram',
  '09-palitang-e-i-at-o-u', '10-pagpapalit-ng-d-sa-r', '11-ng-at-nang',
  '12-mga-bantas-bahagi-uno', '13-mga-bantas-bahagi-dalawa',
  '14-ang-gitling', '15-mga-pangalan-at-mga-bilang',
] as const;

const OS_RAW = [os01, os02, os03, os04, os05, os06, os07, os08, os09, os10];
const OS_BCL_RAW = [osb01, osb02, osb03, osb04, osb05, osb06, osb07, osb08, osb09, osb10];
const OS_STEMS = [
  '01-introduksiyon', '02-grafema', '03-silaba',
  '04-pahilwas-na-pag-ispeling', '05-pasurat-na-pag-ispeling',
  '06-kambal-patinig', '07-kambal-katinig-nan-digrapo',
  '08-salyuhan-san-e-i-nan-o-u', '09-mga-bantas', '10-pangbuod',
] as const;

function parseRawLessons(raws: string[], stems: readonly string[]): RawLesson[] {
  return raws.map((raw, i) => {
    const { meta, body } = parseFrontmatter(raw);
    return {
      id: stems[i],
      title: String(meta.title ?? `Aralin ${i + 1}`),
      description: String(meta.description ?? ''),
      order: Number(meta.order ?? i + 1),
      durationMin: Number(meta.minutes ?? 10),
      body,
    };
  });
}

/** Parse a course's lessons with a parallel Bikol (Sorsoganon) variant zipped in by index. */
function parseBilingualLessons(
  raws: string[],
  bclRaws: string[],
  stems: readonly string[],
): RawLesson[] {
  return parseRawLessons(raws, stems).map((lesson, i) => {
    const { meta, body } = parseFrontmatter(bclRaws[i]);
    return {
      ...lesson,
      bicol: {
        title: String(meta.title ?? lesson.title),
        description: String(meta.description ?? lesson.description),
        body,
      },
    };
  });
}

const seed1: CourseSeed = {
  id: courseMeta1.id,
  title: courseMeta1.title,
  description: courseMeta1.description,
  category: courseMeta1.category as 'Wika' | 'Language',
  instructor: courseMeta1.instructor,
  duration: courseMeta1.duration,
  rating: courseMeta1.rating,
  difficulty: courseMeta1.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
  icon: courseMeta1.icon as CourseSeed['icon'],
  outcomes: courseMeta1.outcomes,
  lessons: parseRawLessons(OP_RAW, OP_STEMS),
  quiz: { courseId: courseMeta1.id, questions: quizData1.questions as Quiz['questions'] },
};

const seed2: CourseSeed = {
  id: courseMeta2.id,
  title: courseMeta2.title,
  description: courseMeta2.description,
  category: courseMeta2.category as 'Wika' | 'Language',
  instructor: courseMeta2.instructor,
  duration: courseMeta2.duration,
  rating: courseMeta2.rating,
  difficulty: courseMeta2.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
  icon: courseMeta2.icon as CourseSeed['icon'],
  outcomes: courseMeta2.outcomes,
  outcomesBicol: courseMeta2.bicolOutcomes,
  lessons: parseBilingualLessons(OS_RAW, OS_BCL_RAW, OS_STEMS),
  quiz: { courseId: courseMeta2.id, questions: quizData2.questions as Quiz['questions'] },
  bicol: {
    title: 'Ortograpiyang Sorsoganon',
    description:
      'An opisyal na giya sa tama na pag-ispeling san lengguwahe na Sorsoganon, base sa Ortograpiyang Sorsoganon (Bicol University / KWF, 2024). Hali sa alpabeto sagkod sa mga bantas.',
  },
};

const registry = buildRegistry({ seeds: [seed1, seed2] });

export const courses: Course[] = registry.courses;
export const quizzes: Quiz[] = registry.quizzes;
/** Per-lesson quizzes (one per lesson that has questions) — powers the course-detail assessment. */
export const lessonQuizzes: LessonQuiz[] = registry.lessonQuizzes;
