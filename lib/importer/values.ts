// Reading the values in the model's JSON: text, dates, bullets that a PDF split in pieces,
// skills, and "other" sections that belong somewhere else.

import { plainCharacters } from "@/lib/enhance";
import { continuesLine } from "@/lib/ats";
import {
  EXTRA_KINDS,
  type Education,
  type Experience,
  type ExtraKind,
  type ExtraSection,
  PRESENT,
  type Project,
  newEducation,
  newExperience,
  newExtraItem,
  newId,
  newProject,
  skillsText,
} from "@/lib/resume";

// Every value goes through plainCharacters: models write look-alike hyphens and spaces
export const str = (value: unknown) => (typeof value === "string" ? plainCharacters(value).trim() : "");

// "Apr'25" and "July’24" are common but ATS software can't read them: write the year out
// ("Apr 2025"). Years more than ten ahead of now are taken as the 1900s ("Jun'98" → "Jun 1998").
export function fullYears(text: string) {
  const soon = (new Date().getFullYear() % 100) + 10;
  return text.replace(/\b([A-Za-z]{3,9})\.?\s*['’‘`]\s*(\d{2})\b/g, (_, month: string, year: string) =>
    `${month} ${Number(year) > soon ? "19" : "20"}${year}`,
  );
}

export const date = (value: unknown) => fullYears(str(value));

export const list = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object") : [];

// PDFs break lines where the page ran out, so a bullet can arrive in pieces. A piece that
// starts in lowercase, or follows a line ending mid-phrase ("... compliance platform using"),
// belongs to the bullet before it.
export function joinSplitLines(items: string[]) {
  const joined: string[] = [];
  for (const line of items) {
    const previous = joined.at(-1);
    if (previous !== undefined && (continuesLine(previous) || /^[a-z]+\b/.test(line))) {
      joined[joined.length - 1] = `${previous} ${line}`;
    } else {
      joined.push(line);
    }
  }
  return joined;
}

export const lines = (value: unknown) =>
  joinSplitLines(
    (Array.isArray(value) ? value : typeof value === "string" ? value.split("\n") : [])
      .filter((line): line is string => typeof line === "string")
      // Every typed bullet symbol, so "• • Built" doesn't keep one
      .map((line) => plainCharacters(line).trim().replace(/^([•\-*–—▪●◦‣·]\s*)+/, ""))
      .filter(Boolean),
  ).join("\n");

export function extraSection(kind: ExtraKind, title: string, items: Record<string, unknown>[], fields: [string, string, string, string?]) {
  const [titleKey, subtitleKey, dateKey, bulletsKey] = fields;
  const parsed = items
    .map((item) => ({
      ...newExtraItem(),
      title: str(item[titleKey]),
      subtitle: str(item[subtitleKey]),
      date: dateKey ? date(item[dateKey]) : "",
      bullets: bulletsKey ? lines(item[bulletsKey]) : "",
    }))
    .filter((item) => item.title || item.subtitle || item.bullets);
  return parsed.length > 0 ? ({ id: newId(), kind, title, items: parsed } satisfies ExtraSection) : null;
}

// "OPEN SOURCE & ACHIEVEMENTS" reads better as "Open Source & Achievements"; templates that use
// capital headings still show it in capitals
const titleCase = (text: string) =>
  text === text.toUpperCase() ? text.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : text;

// "May 2024 – July 2024" as a start and an end
function dateRange(value: unknown) {
  const [start = "", end = ""] = date(value).split(/\s+(?:–|-|to)\s+/i);
  return { start, end: /^(present|current|now)$/i.test(end) ? PRESENT : end };
}

// Where an "other" section really belongs, going by its heading. The model sometimes files a
// job under "other" with the heading "Work Experience"; this puts it back with the jobs.
const BELONGS: [RegExp, "experience" | "projects" | "education" | ExtraKind][] = [
  [/experience|employment|work|internship|career/i, "experience"],
  [/project/i, "projects"],
  [/education|academic|qualification/i, "education"],
  [/certif/i, "certifications"],
  [/award|honou?r/i, "awards"],
  [/volunteer/i, "volunteering"],
];

// Sections that fit nowhere else ("Open Source & Achievements") become custom sections that
// keep their own heading, so nothing on the resume is lost. Ones that do fit somewhere are
// moved there instead.
export function otherSections(value: unknown) {
  const moved = { experience: [] as Experience[], projects: [] as Project[], education: [] as Education[] };
  const extras: ExtraSection[] = [];
  for (const section of list(value)) {
    const title = titleCase(str(section.title));
    const items = list(section.items);
    const home = BELONGS.find(([pattern]) => pattern.test(title))?.[1];
    if (home === "experience") {
      moved.experience.push(
        ...items.map((item) => ({ ...newExperience(), role: str(item.name), company: str(item.detail), ...dateRange(item.date), bullets: lines(item.bullets) })),
      );
    } else if (home === "projects") {
      moved.projects.push(...items.map((item) => ({ ...newProject(), name: str(item.name), date: date(item.date), bullets: lines(item.bullets) })));
    } else if (home === "education") {
      moved.education.push(
        ...items.map((item) => ({ ...newEducation(), degree: str(item.name), school: str(item.detail), ...dateRange(item.date) })),
      );
    } else {
      const kind = home ?? "custom";
      const section = extraSection(kind, kind === "custom" ? title || EXTRA_KINDS.custom.title : EXTRA_KINDS[kind].title, items, [
        "name",
        "detail",
        "date",
        "bullets",
      ]);
      if (section) extras.push(section);
    }
  }
  return { moved, extras };
}

// Skills as groups ([{group, items}]) or a plain list of strings, written as Folio's skills text
export function parseSkills(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  const plain = value.filter((s): s is string => typeof s === "string").map(str).filter(Boolean);
  const groups = list(value).map((group) => ({
    label: str(group.group).replace(/[:\-–\s]+$/, ""),
    items: (Array.isArray(group.items) ? group.items : []).map(str).filter(Boolean),
  }));
  return skillsText([...(plain.length > 0 ? [{ label: "", items: plain }] : []), ...groups].filter((g) => g.items.length > 0));
}
