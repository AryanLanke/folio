// "Optimize": one click that tidies the whole resume. Formatting fixes and the page layout are
// worked out in the browser; the wording is rewritten by AI in one request, under the same
// rules as Enhance. Anything in the AI's answer that could add a fact is thrown away here.
// Shared by the server route and the builder.

import { BANNED_WORDS, INVOLVEMENT_RULE, MAX_INPUT_LENGTH, cleanLine } from "@/lib/enhance";
import { PRESENT, type Resume, type ResumeStyle, TEMPLATES, hasExperience, hasProject, toLines } from "@/lib/resume";
import { plainResume, plainText } from "@/lib/rich";

// One job or project: its bullets, and enough context for the AI to word them well
export type OptimizeItem = { id: string; context: string; current: boolean; bullets: string[] };
export type OptimizeRequest = { title: string; summary: string; items: OptimizeItem[]; focus: string[] };
export type OptimizeResult = { summary: string; items: { id: string; bullets: string[] }[] };

const MAX_ITEMS = 20;
const MAX_BULLETS = 12;
const MAX_LINE = 400;
// About four full pages of text; a real resume is well under this
const MAX_TOTAL = 16_000;

export function optimizeRequest(resume: Resume): OptimizeRequest {
  // AI gets the words only; applyOptimize keeps the formatting of lines it leaves alone
  const plain = plainResume(resume);
  const jobs = plain.experience.filter(hasExperience).map((job) => ({
    id: job.id,
    context: [job.role, job.company].filter(Boolean).join(" at "),
    current: job.end.trim().toLowerCase() === PRESENT.toLowerCase(),
    bullets: toLines(job.bullets),
  }));
  const projects = plain.projects.filter(hasProject).map((project) => ({
    id: project.id,
    context: `Project: ${project.name}`,
    current: false,
    bullets: toLines(project.bullets),
  }));
  return {
    title: plain.basics.title,
    summary: plain.summary.trim(),
    items: [...jobs, ...projects].filter((item) => item.bullets.length > 0),
    focus: resume.target.keywords,
  };
}

export function validateOptimize(body: unknown): OptimizeRequest | null {
  if (!body || typeof body !== "object") return null;
  const src = body as Record<string, unknown>;
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

  const items = (Array.isArray(src.items) ? src.items : []).slice(0, MAX_ITEMS).flatMap((raw): OptimizeItem[] => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const bullets = (Array.isArray(item.bullets) ? item.bullets : [])
      .filter((line): line is string => typeof line === "string" && line.trim() !== "")
      .slice(0, MAX_BULLETS)
      .map((line) => line.trim().slice(0, MAX_LINE));
    const id = text(item.id, 40);
    return id && bullets.length > 0 ? [{ id, context: text(item.context, 200), current: item.current === true, bullets }] : [];
  });
  const summary = text(src.summary, MAX_INPUT_LENGTH);
  if (!summary && items.length === 0) return null;

  const focus = Array.isArray(src.focus)
    ? src.focus.filter((k): k is string => typeof k === "string" && k.trim() !== "").map((k) => k.slice(0, 60)).slice(0, 25)
    : [];
  const request = { title: text(src.title, 200), summary, items, focus };
  return JSON.stringify(request).length > MAX_TOTAL ? null : request;
}

export function buildOptimizeMessages(request: OptimizeRequest) {
  const system = [
    "You edit a whole resume so it reads well to recruiters and to applicant tracking systems. The person wrote it themselves; make it read as if a skilled human editor improved it.",
    "",
    "Rules:",
    "- Keep every fact exactly as given. Never add, remove or change numbers, dates, names, companies, tools, skills or achievements. Never invent metrics.",
    `- ${INVOLVEMENT_RULE}`,
    "- Rewrite each bullet in place. Return exactly as many bullets for every item as you were given, in the same order. Never merge, split, drop or add bullets.",
    '- Each bullet starts with a strong, ordinary action verb: present tense when the item is "current", past tense otherwise. About 10 to 25 words. No first person (I, my, we). No bullet symbols. No period at the end.',
    "- If a bullet is already strong, return it unchanged.",
    '- The summary is 2 to 3 sentences, about 25 to 60 words, in implied first person (no "I"), plain and specific. If the summary is empty, return an empty string.',
    "- Fix grammar, spelling and punctuation.",
    `- Write naturally and plainly. Never use these words: ${BANNED_WORDS.join(", ")}.`,
    ...(request.focus.length
      ? [
          `- This resume is for a job that looks for: ${request.focus.join(", ")}. Where the text already shows one of these, use the job's exact wording for it. Never add a skill, tool or experience that is not already in the text.`,
        ]
      : []),
    "",
    'Respond with JSON only, in exactly this shape: {"summary": "...", "items": [{"id": "...", "bullets": ["..."]}]}',
  ].join("\n");

  const resume = {
    title: request.title,
    summary: request.summary,
    items: request.items.map(({ id, context, current, bullets }) => ({ id, about: context, current, bullets })),
  };
  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Resume to edit:\n${JSON.stringify(resume, null, 1)}` },
  ];
}

const numbers = (text: string) => text.match(/\d+(?:[.,]\d+)*/g) ?? [];

// A rewrite may only use numbers the original already has, so "Cut load time" can't become
// "Cut load time by 40%"
export function keepsFacts(original: string, rewritten: string) {
  const known = new Set(numbers(original));
  return numbers(rewritten).every((n) => known.has(n));
}

// Takes the AI's answer apart. Bullets only replace the originals when the count matches and
// no new numbers appear; otherwise that bullet (or item) keeps the person's own words.
export function parseOptimize(raw: unknown, request: OptimizeRequest): OptimizeResult | null {
  if (typeof raw !== "string") return null;
  let data: unknown;
  try {
    data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const src = data as Record<string, unknown>;

  const returned = new Map<string, string[]>();
  for (const item of Array.isArray(src.items) ? src.items : []) {
    if (item && typeof item.id === "string" && Array.isArray(item.bullets)) {
      returned.set(item.id, item.bullets.filter((line: unknown): line is string => typeof line === "string"));
    }
  }

  const items = request.items.map((item) => {
    const lines = (returned.get(item.id) ?? []).map(cleanLine).filter(Boolean);
    const bullets =
      lines.length === item.bullets.length
        ? item.bullets.map((original, i) => (keepsFacts(original, lines[i]) ? lines[i] : original))
        : item.bullets;
    return { id: item.id, bullets };
  });

  const summary = typeof src.summary === "string" ? cleanLine(src.summary) : "";
  return {
    summary: request.summary && summary && keepsFacts(request.summary, summary) ? summary : request.summary,
    items,
  };
}

// Puts the rewritten wording back into the resume. Bullets that came back unchanged keep the
// person's own line breaks and formatting.
export function applyOptimize(resume: Resume, result: OptimizeResult): Resume {
  const rewritten = new Map(result.items.map((item) => [item.id, item.bullets]));
  const reword = <T extends { id: string; bullets: string }>(item: T): T => {
    const lines = rewritten.get(item.id);
    const originals = toLines(item.bullets);
    if (!lines) return item;
    const next = (lines.length === originals.length
      ? lines.map((line, i) => (line === plainText(originals[i]) ? originals[i] : line))
      : lines
    ).join("\n");
    return next !== originals.join("\n") ? { ...item, bullets: next } : item;
  };
  const summary = result.summary.trim();
  return {
    ...resume,
    summary: summary && summary !== plainText(resume.summary).trim() ? result.summary : resume.summary,
    experience: resume.experience.map(reword),
    projects: resume.projects.map(reword),
  };
}

// Layout: the most readable text size and spacing that still need the fewest pages. Templates
// are a matter of taste, so Compact is only chosen when nothing else saves a page.

const FONT_RANK = { small: 0, medium: 1, large: 2 } as const;
const SPACING_RANK = { compact: 0, normal: 1, relaxed: 2 } as const;
const LAYOUT_STEPS: [ResumeStyle["fontSize"], ResumeStyle["spacing"]][] = [
  ["medium", "relaxed"],
  ["medium", "normal"],
  ["medium", "compact"],
  ["small", "normal"],
  ["small", "compact"],
];

// The current layout comes first, so it wins ties and nothing changes without a reason
export function layoutCandidates(style: ResumeStyle): ResumeStyle[] {
  const steps = LAYOUT_STEPS.map(([fontSize, spacing]) => ({ ...style, fontSize, spacing }));
  const compact: ResumeStyle[] =
    style.template === "compact" ? [] : [{ ...style, template: "compact", fontSize: "small", spacing: "compact" }];
  return [style, ...steps, ...compact];
}

export function bestLayout(current: ResumeStyle, candidates: ResumeStyle[], pages: number[]): ResumeStyle {
  const readability = (style: ResumeStyle) =>
    (style.template === current.template ? 0 : -100) + FONT_RANK[style.fontSize] * 3 + SPACING_RANK[style.spacing];
  const fewest = Math.min(...pages);
  let best = -1;
  candidates.forEach((style, i) => {
    if (pages[i] === fewest && (best < 0 || readability(style) > readability(candidates[best]))) best = i;
  });
  return candidates[best];
}

// What Optimize changed, one entry per piece the person can put back on its own

export type OptimizeChange = { key: string; label: string; before: string[]; after: string[] };

const FONT_LABEL = { small: "S", medium: "M", large: "L" } as const;
const SPACING_LABEL = { compact: "Tight", normal: "Normal", relaxed: "Airy" } as const;
const describeLayout = (style: ResumeStyle) =>
  `${TEMPLATES[style.template].label}, text ${FONT_LABEL[style.fontSize]}, ${SPACING_LABEL[style.spacing]} spacing`;

export function listChanges(before: Resume, after: Resume): OptimizeChange[] {
  const changes: OptimizeChange[] = [];
  if (before.summary.trim() !== after.summary.trim()) {
    changes.push({ key: "summary", label: "Summary", before: [before.summary.trim()], after: [after.summary.trim()] });
  }
  const bullets = (key: string, label: string, was: string, now: string) => {
    if (toLines(was).join("\n") !== toLines(now).join("\n")) changes.push({ key, label, before: toLines(was), after: toLines(now) });
  };
  for (const job of after.experience) {
    const old = before.experience.find((item) => item.id === job.id);
    if (old) bullets(`experience:${job.id}`, [job.role, job.company].filter(Boolean).join(" at ") || "A job", old.bullets, job.bullets);
  }
  for (const project of after.projects) {
    const old = before.projects.find((item) => item.id === project.id);
    if (old) bullets(`projects:${project.id}`, project.name || "A project", old.bullets, project.bullets);
  }
  for (const extra of after.extras) {
    for (const item of extra.items) {
      const old = before.extras.find((e) => e.id === extra.id)?.items.find((i) => i.id === item.id);
      if (old) bullets(`extras:${extra.id}:${item.id}`, item.title || extra.title, old.bullets, item.bullets);
    }
  }
  const was = describeLayout(before.style);
  const now = describeLayout(after.style);
  if (was !== now) changes.push({ key: "layout", label: "Layout", before: [was], after: [now] });
  return changes;
}

// Which lines Optimize changed, for highlighting them on the page: for each piece (by change
// key), the changed line numbers and what each said before. Bullets that were split or joined
// have no single old line, so they're marked with an empty "before".
export type ChangedLines = Record<string, Record<number, string>>;

export function changedLines(changes: OptimizeChange[]): ChangedLines {
  const marked: ChangedLines = {};
  for (const change of changes) {
    if (change.key === "layout") continue;
    const lines: Record<number, string> = {};
    change.after.forEach((line, i) => {
      if (change.before.length !== change.after.length) lines[i] = "";
      else if (line !== change.before[i]) lines[i] = change.before[i];
    });
    marked[change.key] = lines;
  }
  return marked;
}

// Puts one piece back the way it was before Optimize, keeping every other change
export function revertChange(current: Resume, before: Resume, key: string): Resume {
  const [kind, id, itemId] = key.split(":");
  const restore = <T extends { id: string; bullets: string }>(list: T[], old: T[]) =>
    list.map((item) => (item.id === id ? { ...item, bullets: old.find((o) => o.id === id)?.bullets ?? item.bullets } : item));

  if (kind === "summary") return { ...current, summary: before.summary };
  if (kind === "layout") {
    const { template, fontSize, spacing } = before.style;
    return { ...current, style: { ...current.style, template, fontSize, spacing } };
  }
  if (kind === "experience") return { ...current, experience: restore(current.experience, before.experience) };
  if (kind === "projects") return { ...current, projects: restore(current.projects, before.projects) };
  if (kind === "extras") {
    const old = before.extras.find((extra) => extra.id === id)?.items.find((item) => item.id === itemId);
    if (!old) return current;
    return {
      ...current,
      extras: current.extras.map((extra) =>
        extra.id === id
          ? { ...extra, items: extra.items.map((item) => (item.id === itemId ? { ...item, bullets: old.bullets } : item)) }
          : extra,
      ),
    };
  }
  return current;
}
