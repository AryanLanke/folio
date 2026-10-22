// Bold, italic and underline inside resume text, made on the page like in Word. They're kept in
// the text as <b>, <i> and <u> tags: the preview, PDF and Word file draw them, and everything
// that reads the words (the ATS check, the score, job match, AI) gets the text without them.

export type Span = { text: string; bold: boolean; italic: boolean; underline: boolean };

const TAG = /<(\/?)([biu])>/g;

export const plainText = (text: string) => text.replace(TAG, "");

export const hasFormatting = (text: string) => /<\/?[biu]>/.test(text);

export function parseRich(text: string): Span[] {
  const spans: Span[] = [];
  const depth = { b: 0, i: 0, u: 0 };
  let last = 0;
  const push = (end: number) => {
    if (end > last) spans.push({ text: text.slice(last, end), bold: depth.b > 0, italic: depth.i > 0, underline: depth.u > 0 });
  };
  for (const match of text.matchAll(TAG)) {
    push(match.index);
    const key = match[2] as keyof typeof depth;
    // A stray closing tag is ignored; an unclosed one lasts to the end
    depth[key] = Math.max(0, depth[key] + (match[1] ? -1 : 1));
    last = match.index + match[0].length;
  }
  push(text.length);
  return spans;
}

const same = (a: Span, b: Span) => a.bold === b.bold && a.italic === b.italic && a.underline === b.underline;

// Spans back to text with tags, joining neighbours that look the same
export function toRich(spans: Span[]): string {
  const merged: Span[] = [];
  for (const span of spans) {
    if (!span.text) continue;
    const previous = merged.at(-1);
    if (previous && same(previous, span)) previous.text += span.text;
    else merged.push({ ...span });
  }
  return merged
    .map((s) => {
      const open = `${s.bold ? "<b>" : ""}${s.italic ? "<i>" : ""}${s.underline ? "<u>" : ""}`;
      const close = `${s.underline ? "</u>" : ""}${s.italic ? "</i>" : ""}${s.bold ? "</b>" : ""}`;
      return open + s.text + close;
    })
    .join("");
}

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// For an editable element on the page: only the three formatting tags, everything else escaped
export function richToHtml(text: string) {
  return parseRich(text)
    .map((s) => {
      let html = escapeHtml(s.text);
      if (s.underline) html = `<u>${html}</u>`;
      if (s.italic) html = `<i>${html}</i>`;
      if (s.bold) html = `<b>${html}</b>`;
      return html;
    })
    .join("");
}

// What the person typed, read back from the page. Browsers make bold with <b> or <strong>, or
// with a style; any other markup (pasted links, spans) keeps only its words. Line breaks become
// spaces, since every field is one line.
export function nodeToRich(root: Node): string {
  const spans: Span[] = [];
  const walk = (node: Node, inherited: Omit<Span, "text">) => {
    if (node.nodeType === 3) {
      spans.push({ text: node.textContent ?? "", ...inherited });
      return;
    }
    if (!(node instanceof HTMLElement)) {
      node.childNodes.forEach((child) => walk(child, inherited));
      return;
    }
    if (node.tagName === "BR") {
      spans.push({ text: " ", ...inherited });
      return;
    }
    const style = node.style;
    const weight = Number(style.fontWeight) || (style.fontWeight === "bold" ? 700 : 0);
    const flags = {
      bold: inherited.bold || ["B", "STRONG"].includes(node.tagName) || weight >= 600,
      italic: inherited.italic || ["I", "EM"].includes(node.tagName) || style.fontStyle === "italic",
      underline: inherited.underline || node.tagName === "U" || style.textDecoration.includes("underline"),
    };
    if (node.tagName === "DIV" || node.tagName === "P") spans.push({ text: " ", ...inherited });
    node.childNodes.forEach((child) => walk(child, flags));
  };
  root.childNodes.forEach((child) => walk(child, { bold: false, italic: false, underline: false }));
  // One line, single spaces, nothing at either end
  const joined = spans.map((s) => ({ ...s, text: s.text.replace(/\s+/g, " ") }));
  return toRich(joined).replace(/^((?:<[biu]>)*) +/, "$1").replace(/ +((?:<\/[biu]>)*)$/, "$1").replace(/ {2,}/g, " ");
}

// The same resume with every formatting tag taken out, for anything that reads the words
export function plainResume<T>(value: T): T {
  if (typeof value === "string") return plainText(value) as T;
  if (Array.isArray(value)) return value.map(plainResume) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, plainResume(v)])) as T;
  }
  return value;
}
