/**
 * Minimal YAML frontmatter parser for lesson `.md` files — SOURCE_OF_TRUTH.md §3.5.
 * Handles the deterministic subset Phase 0 authors: `key: value` / `key: "quoted"`
 * keyed at column 0, `---` delimiters. No yaml dependency. Malformed/missing head
 * degrades to `{ meta: {}, body: input }` so lessons always render.
 */
export type FrontmatterMeta = Record<string, string | number | boolean>;

export type ParsedLesson = { meta: FrontmatterMeta; body: string };

const HEAD_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function coerce(raw: string): string | number | boolean {
  const trimmed = raw.trim();
  // Strip surrounding single/double quotes (both open+close, any order).
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return trimmed;
}

export function parseFrontmatter(markdown: string): ParsedLesson {
  const match = HEAD_RE.exec(markdown);
  if (!match) return { meta: {}, body: markdown };

  const meta: FrontmatterMeta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon <= 0) continue; // blank or keyless line
    const key = line.slice(0, colon).trim();
    if (key === '') continue;
    meta[key] = coerce(line.slice(colon + 1));
  }

  return { meta, body: markdown.slice(match[0].length) };
}