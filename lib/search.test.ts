import { searchCourses } from '@/lib/search';
import type { Course, Lesson } from '@/types/course';

const lesson = (order: number, title: string, description = '', content = ''): Lesson => ({
  id: `pambansa:${order}`,
  courseId: 'pambansa',
  title,
  description,
  order,
  durationMin: 10,
  content,
  status: 'locked',
});

const pambansa: Course = {
  id: 'pambansa',
  title: 'Ortograpiyang Pambansa',
  description: 'National orthography.',
  category: 'Wika',
  instructor: 'Komisyon sa Wikang Filipino',
  duration: '3h',
  rating: 4.8,
  difficulty: 'Beginner',
  icon: 'menu-book',
  lessons: [
    lesson(1, 'Ang Alpabetong Filipino', 'The 28 letters'),
    lesson(2, 'Ang Gitling', 'Hyphenation rules'),
    // A term ("tutuldok") that lives only in the lesson BODY, not the title/description.
    lesson(3, 'Mga Bantas', 'Punctuation', '# Mga Bantas\nAng tutuldok ay ginagamit sa harap ng listahan.'),
  ],
  progress: 0,
};

const sorsoganon: Course = {
  ...pambansa,
  id: 'sorsoganon',
  title: 'Ortograpiyang Sorsoganon',
  lessons: [lesson(1, 'Grafema', 'The Sorsoganon alphabet')],
};

const catalog = [pambansa, sorsoganon];

describe('searchCourses', () => {
  const titles = (r: { matchedLessons: { title: string }[] }) => r.matchedLessons.map((l) => l.title);

  it('returns all courses (no lesson matches) for an empty query', () => {
    const r = searchCourses(catalog, '   ');
    expect(r).toHaveLength(2);
    expect(r[0].matchedLessons).toEqual([]);
  });

  it('finds a course by a lesson topic and returns the matching lesson', () => {
    const r = searchCourses(catalog, 'gitling');
    expect(r).toHaveLength(1);
    expect(r[0].course.id).toBe('pambansa');
    expect(titles(r[0])).toEqual(['Ang Gitling']);
  });

  it('matches a lesson description too', () => {
    const r = searchCourses(catalog, 'punctuation');
    expect(r.map((x) => x.course.id)).toEqual(['pambansa']);
    expect(titles(r[0])).toEqual(['Mga Bantas']);
  });

  it('matches a course by a term found only in the lesson body/content', () => {
    const r = searchCourses(catalog, 'tutuldok');
    // The course surfaces (body is indexed), but no lesson card is shown —
    // "tutuldok" is not in any title/description.
    expect(r.map((x) => x.course.id)).toEqual(['pambansa']);
    expect(r[0].matchedLessons).toEqual([]);
  });

  it('AND-matches multiple terms within a single course (title + lesson)', () => {
    // both "ortograpiyang" (course title) and "gitling" (a lesson) live in pambansa
    expect(searchCourses(catalog, 'ortograpiyang gitling').map((x) => x.course.id)).toEqual(['pambansa']);
    // no single course contains both "gitling" and "grafema"
    expect(searchCourses(catalog, 'gitling grafema')).toEqual([]);
  });

  it('is case-insensitive and returns [] when nothing matches', () => {
    expect(searchCourses(catalog, 'GRAFEMA').map((x) => x.course.id)).toEqual(['sorsoganon']);
    expect(searchCourses(catalog, 'calculus')).toEqual([]);
  });
});
