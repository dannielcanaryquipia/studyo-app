/**
 * src/repositories/content-registry.test.ts — Phase B §6.2 required unit test.
 * hydrateCourse golden path + §4.3.4 integrity invariants, fixture-driven.
 */
import { buildRegistry, groupQuizByLesson, hydrateCourse, validateRegistry } from './content-registry';
import type { CourseSeed } from './content-registry';

const baseSeed: CourseSeed = {
  id: 'ortograpiyang-pambansa',
  title: 'Ortograpiyang Pambansa',
  description: 'National orthography.',
  category: 'Wika',
  instructor: 'Komisyon sa Wikang Filipino',
  duration: '3h',
  rating: 4.8,
  difficulty: 'Beginner',
  icon: 'spellcheck',
  topics: ['ortograpiyang-pambansa'],
  lessons: [
    { id: '01', title: 'Ang Alpabeto', description: 'Letters', order: 1, durationMin: 15, body: '# Ang Alpabeto\nLesson body.' },
    { id: '02', title: 'Mga Tunog', description: 'Sounds', order: 2, durationMin: 20, body: '# Mga Tunog\nLesson body.' },
  ],
  quiz: {
    courseId: 'ortograpiyang-pambansa',
    questions: [
      {
        text: 'How many vowels?',
        options: [
          { letter: 'A', text: 'Five' },
          { letter: 'B', text: 'Four' },
        ],
        correctIndex: 0,
        explanation: 'Classic vowels: a, e, i, o, u.',
      },
    ],
  },
};

describe('hydrateCourse', () => {
  it('maps a seed to Course shape with derived lesson ids and locked status', () => {
    const course = hydrateCourse(baseSeed);
    expect(course.id).toBe('ortograpiyang-pambansa');
    expect(course.progress).toBe(0);
    expect(course.lessons).toHaveLength(2);
    expect(course.lessons[0]).toMatchObject({
      id: 'ortograpiyang-pambansa:1',
      courseId: 'ortograpiyang-pambansa',
      status: 'locked',
      content: '# Ang Alpabeto\nLesson body.',
    });
  });
});

describe('validateRegistry', () => {
  it('passes a well-formed registry (incl. refs resolving, no orphans)', () => {
    const issues = validateRegistry({
      seeds: [baseSeed],
      availableLessonFiles: ['ortograpiyang-pambansa/01', 'ortograpiyang-pambansa/02'],
    });
    expect(issues).toEqual([]);
  });

  it('flags course invariants: no lessons, empty title/content, duplicate order', () => {
    const seed = {
      ...baseSeed,
      lessons: [
        { id: '01', title: '', description: '', order: 1, durationMin: 15, body: '  ' },
        { id: '02', title: 'B', description: '', order: 1, durationMin: 15, body: 'ok' },
      ],
    };
    const issues = validateRegistry({ seeds: [seed] });
    const codes = issues.map((i) => i.code);
    expect(codes).toContain('course');
    expect(issues.some((i) => i.courseId === seed.id)).toBe(true);
  });

  it('flags quiz invariants: <2 options and out-of-range correctIndex', () => {
    const seed: CourseSeed = {
      ...baseSeed,
      quiz: {
        courseId: baseSeed.id,
        questions: [
          { text: 'q', options: [{ letter: 'A', text: 'only' }], correctIndex: 3, explanation: '' },
        ],
      },
    };
    const issues = validateRegistry({ seeds: [seed] });
    expect(issues.filter((i) => i.code === 'quiz')).toHaveLength(2);
  });

  it('flags quiz lessonId that does not resolve', () => {
    const seed: CourseSeed = {
      ...baseSeed,
      quiz: {
        courseId: baseSeed.id,
        questions: [
          {
            text: 'q', options: [{ letter: 'A', text: 'x' }, { letter: 'B', text: 'y' }],
            correctIndex: 0, explanation: '', lessonId: '99',
          },
        ],
      },
    };
    const issues = validateRegistry({ seeds: [seed] });
    expect(issues.some((i) => i.code === 'quiz' && i.detail.includes('99'))).toBe(true);
  });

  it('flags manifest: duplicate course id and unresolved lesson ref', () => {
    const issues = validateRegistry({
      seeds: [baseSeed, { ...baseSeed, id: baseSeed.id }],
      // Only /01 is bundled → lesson ref "ortograpiyang-pambansa/02" is unresolved.
      availableLessonFiles: ['ortograpiyang-pambansa/01'],
    });
    expect(issues.some((i) => i.code === 'manifest' && i.detail.includes('duplicate course id'))).toBe(true);
    expect(issues.some((i) => i.code === 'manifest' && i.detail.includes('02'))).toBe(true);
  });

  it('flags orphan: bundled .md with no referencing lesson', () => {
    const issues = validateRegistry({
      seeds: [baseSeed],
      availableLessonFiles: ['ortograpiyang-pambansa/01', 'orphan-file'],
    });
    expect(issues.some((i) => i.code === 'orphan' && i.detail.includes('orphan-file'))).toBe(true);
  });

  it('flags topic mismatch when topics.json ids differ from course.json ids', () => {
    const seed = { ...baseSeed, topics: ['other-course'] };
    const issues = validateRegistry({ seeds: [seed] });
    expect(issues.some((i) => i.code === 'topic')).toBe(true);
  });
});

describe('buildRegistry', () => {
  it('returns hydrated courses and quizzes', () => {
    const { courses, quizzes } = buildRegistry({ seeds: [baseSeed] });
    expect(courses).toHaveLength(1);
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].courseId).toBe(baseSeed.id);
  });

  it('omits quiz when a course has none', () => {
    const { quizzes } = buildRegistry({ seeds: [{ ...baseSeed, quiz: undefined }] });
    expect(quizzes).toEqual([]);
  });
});

describe('groupQuizByLesson', () => {
  const opt = [{ letter: 'A' as const, text: 'x' }, { letter: 'B' as const, text: 'y' }];

  it('groups questions per lesson (canonical/stem/order) in lesson order, dropping unresolvable', () => {
    const seed: CourseSeed = {
      ...baseSeed,
      quiz: {
        courseId: baseSeed.id,
        questions: [
          { text: 'q2a', options: opt, correctIndex: 0, explanation: '', lessonId: '02' }, // stem
          { text: 'q1', options: opt, correctIndex: 0, explanation: '', lessonId: 'ortograpiyang-pambansa:1' }, // canonical
          { text: 'q2b', options: opt, correctIndex: 0, explanation: '', lessonId: '2' }, // bare order
          { text: 'orphan', options: opt, correctIndex: 0, explanation: '', lessonId: '99' }, // unresolved → dropped
        ],
      },
    };
    const grouped = groupQuizByLesson(seed);
    expect(grouped.map((g) => g.lessonId)).toEqual(['ortograpiyang-pambansa:1', 'ortograpiyang-pambansa:2']);
    expect(grouped[0].questions.map((q) => q.text)).toEqual(['q1']);
    expect(grouped[1].questions.map((q) => q.text)).toEqual(['q2a', 'q2b']);
  });

  it('returns [] when the seed has no quiz', () => {
    expect(groupQuizByLesson({ ...baseSeed, quiz: undefined })).toEqual([]);
  });
});