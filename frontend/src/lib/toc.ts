export type TocItem = { level: 2 | 3; text: string; slug: string };

export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const out: TocItem[] = [];
  let inFence = false;
  for (const raw of lines) {
    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = raw.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    const text = m[2].trim();
    if (!text) continue;
    out.push({ level, text, slug: slugifyHeading(text) });
  }
  return out;
}

function slugifyHeading(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
