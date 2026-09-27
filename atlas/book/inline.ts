/** A small, non-HTML parser for the link syntax present in the imported case narratives. */
export function linkSegments(text: string): { text: string; href?: string }[] {
  const result: { text: string; href?: string }[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null,
    last = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) result.push({ text: text.slice(last, match.index) });
    let safe = false;
    try {
      const u = new URL(match[2] ?? "");
      safe = u.protocol === "https:" && !u.username && !u.password;
    } catch {}
    result.push(safe ? { text: match[1] ?? "", href: match[2] ?? "" } : { text: match[0] });
    last = pattern.lastIndex;
  }
  if (last < text.length) result.push({ text: text.slice(last) });
  return result.length ? result : [{ text }];
}
