/**
 * lib/lesson-sections.ts — split a lesson's markdown into sequential sections
 * for the stepped reader (S5). A new section begins at every level-2 heading
 * ("## "); everything before the first "## " (the "# Title" + intro) is the
 * first section. Level-3+ headings ("### ") stay inside their parent section,
 * and headings inside fenced code blocks are ignored.
 */
export function splitLessonSections(markdown: string): string[] {
  const lines = (markdown ?? '').split(/\r?\n/);
  const sections: string[] = [];
  let current: string[] = [];
  let inFence = false;

  const flush = () => {
    if (current.some((l) => l.trim().length > 0)) {
      sections.push(current.join('\n').trim());
    }
    current = [];
  };

  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    const isSectionHeading = !inFence && /^##\s/.test(line);
    if (isSectionHeading && current.some((l) => l.trim().length > 0)) {
      flush();
    }
    current.push(line);
  }
  flush();

  return sections;
}
