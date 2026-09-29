import { splitLessonSections } from './lesson-sections';

describe('splitLessonSections', () => {
  it('splits at "## " headings, keeping the title + intro as the first section', () => {
    const md = '# Title\n\nIntro para.\n\n## First\n\nA body.\n\n## Second\n\nB body.';
    const s = splitLessonSections(md);
    expect(s).toHaveLength(3);
    expect(s[0]).toContain('# Title');
    expect(s[0]).toContain('Intro para.');
    expect(s[1].startsWith('## First')).toBe(true);
    expect(s[2].startsWith('## Second')).toBe(true);
  });

  it('keeps "### " subheadings within their parent section', () => {
    const md = '## A\n\ntext\n\n### sub\n\nmore';
    const s = splitLessonSections(md);
    expect(s).toHaveLength(1);
    expect(s[0]).toContain('### sub');
  });

  it('ignores "## " that appears inside a fenced code block', () => {
    const md = '## Real\n\n```\n## not a heading\n```\n\ntail';
    const s = splitLessonSections(md);
    expect(s).toHaveLength(1);
  });

  it('returns a single section when there are no "## " headings', () => {
    expect(splitLessonSections('# Only\n\nbody')).toHaveLength(1);
  });

  it('returns [] for empty content', () => {
    expect(splitLessonSections('')).toEqual([]);
  });
});
