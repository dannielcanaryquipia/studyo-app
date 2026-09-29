/**
 * lib/frontmatter.test.ts — Phase B §6.2 required unit test.
 * YAML-head parser: §3.5 keys (title/order/minutes/description), coercion, passthrough.
 */
import { parseFrontmatter } from './frontmatter';

describe('parseFrontmatter', () => {
  it('parses all §3.5 keys with numeric + string coercion', () => {
    const md = [
      '---',
      'title: "Ang Alpabeto"',
      'order: 1',
      'minutes: 15',
      'description: Introduction to the letters.',
      '---',
      '# Body',
      'Lesson content here.',
    ].join('\n');

    const { meta, body } = parseFrontmatter(md);
    expect(meta).toEqual({
      title: 'Ang Alpabeto',
      order: 1,
      minutes: 15,
      description: 'Introduction to the letters.',
    });
    // The parser consumes the single newline after the closing ---, so the
    // body starts directly at the content (no leading blank line).
    expect(body).toBe('# Body\nLesson content here.');
  });

  it('coerces booleans and single-quoted scalars', () => {
    const md = '---\nenabled: true\nnotes: \'keep it\'\n---\nbody';
    const { meta } = parseFrontmatter(md);
    expect(meta.enabled).toBe(true);
    expect(meta.notes).toBe('keep it');
  });

  it('passes through markdown without a frontmatter head', () => {
    const input = '# No head\njust text';
    expect(parseFrontmatter(input)).toEqual({ meta: {}, body: input });
  });

  it('degrades a malformed head to passthrough', () => {
    const input = '---broken\nno closing marker';
    expect(parseFrontmatter(input)).toEqual({ meta: {}, body: input });
  });

  it('skips keyless or blank lines inside the head', () => {
    const md = '---\n\norder: 2\n---\nbody';
    const { meta } = parseFrontmatter(md);
    expect(meta).toEqual({ order: 2 });
  });
});