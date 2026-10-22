// Import: AI sorts the text of an existing resume into Folio's fields. It copies, it doesn't
// rewrite: polishing is a separate, optional step the user chooses afterwards.

import { plainCharacters } from "@/lib/enhance";
import { continuesLine } from "@/lib/ats";
import { linkKey, repoName, splitLinks, withoutTracking } from "@/lib/links";
import {
  CORE_SECTIONS,
  EXTRA_KINDS,
  type Education,
  type Experience,
  type ExtraKind,
  type ExtraSection,
  PRESENT,
  type Project,
  type Resume,
  createEmptyResume,
  newEducation,
  newExperience,
  newExtraItem,
  newId,
  newProject,
  skillsText,
} from "@/lib/resume";

export const MAX_IMPORT_LENGTH = 15000;
// Largest file the import accepts; Vercel turns away request bodies over 4.5 MB before they arrive
export const MAX_IMPORT_FILE_BYTES = 4 * 1024 * 1024;

// The JSON the model fills in, shared with "Build with AI" so one parser reads both
export const RESUME_SHAPE = JSON.stringify({
  basics: { name: "", title: "", email: "", phone: "", location: "", link: "" },
  summary: "",
  experience: [{ role: "", company: "", location: "", start: "", end: "", bullets: [""] }],
  education: [{ school: "", degree: "", location: "", start: "", end: "", details: "" }],
  projects: [{ name: "", link: "", tech: "", date: "", bullets: [""] }],
  skills: [{ group: "", items: [""] }],
  certifications: [{ name: "", issuer: "", date: "" }],
  awards: [{ name: "", issuer: "", date: "" }],
  volunteering: [{ role: "", organization: "", dates: "", bullets: [""] }],
  languages: [{ language: "", level: "" }],
  other: [{ title: "", items: [{ name: "", detail: "", date: "", bullets: [""] }] }],
});

export function buildImportMessages(text: string) {
  const system = [
    "You convert the text of a resume into structured JSON. The text was extracted from a PDF or pasted, so line breaks and spacing may be messy.",
    "",
    "Rules:",
    "- Copy the person's wording exactly. Do not rewrite, improve, summarize or translate anything.",
    "- Never invent information. Use an empty string or empty list for anything not in the text.",
    "- Include every entry of every section; never skip one. That includes school-level education (Class X, Class XII, HSC, SSC, high school) even when no school name is given.",
    `- For a current job, set "end" to "${PRESENT}".`,
    "- Put each bullet point or achievement as its own item in \"bullets\", without bullet symbols. If one bullet's sentence carries on to the next line of the text, it's still one bullet: join it.",
    '- Split skills into individual items. If the resume groups its skills under labels (like "Languages:" or "Tools-"), keep each group with its label in "group"; otherwise use one group with an empty "group".',
    '- For each project, put the line of tools or technologies it was built with in "tech", and its date or date range in "date".',
    '- Every section of the resume must end up somewhere. A section that fits none of the others (for example achievements, open source, publications, extracurricular activities) goes in "other", with its heading as "title". An entry with a name goes in "name" (details in "detail" and "bullets"); a single line with no name of its own goes in "name" by itself. Jobs, internships, projects, education, skills and certifications always go in their own lists, never in "other".',
    '- Put only the person\'s own profile links in basics "link", separated by commas: LinkedIn, their GitHub profile (github.com/username), portfolio, LeetCode and similar.',
    '- A link to one repository, demo or project (like github.com/username/project-name) goes in that project\'s "link", never in basics. Separate several with commas.',
    "- List each link only once.",
    "- Ignore page numbers, headers and footers.",
    "",
    "Respond with JSON only, in exactly this shape:",
    RESUME_SHAPE,
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Resume text:\n<<<\n${text}\n>>>` },
  ];
}

// Every value goes through plainCharacters: models write look-alike hyphens and spaces
const str = (value: unknown) => (typeof value === "string" ? plainCharacters(value).trim() : "");

// "Apr'25" and "July’24" are common but ATS software can't read them: write the year out
// ("Apr 2025"). Years more than ten ahead of now are taken as the 1900s ("Jun'98" → "Jun 1998").
export function fullYears(text: string) {
  const soon = (new Date().getFullYear() % 100) + 10;
  return text.replace(/\b([A-Za-z]{3,9})\.?\s*['’‘`]\s*(\d{2})\b/g, (_, month: string, year: string) =>
    `${month} ${Number(year) > soon ? "19" : "20"}${year}`,
  );
}

const date = (value: unknown) => fullYears(str(value));

const list = (value: unknown): Record<string, unknown>[] =>
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

const lines = (value: unknown) =>
  joinSplitLines(
    (Array.isArray(value) ? value : typeof value === "string" ? value.split("\n") : [])
      .filter((line): line is string => typeof line === "string")
      // Every typed bullet symbol, so "• • Built" doesn't keep one
      .map((line) => plainCharacters(line).trim().replace(/^([•\-*–—▪●◦‣·]\s*)+/, ""))
      .filter(Boolean),
  ).join("\n");

function extraSection(kind: ExtraKind, title: string, items: Record<string, unknown>[], fields: [string, string, string, string?]) {
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
function otherSections(value: unknown) {
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
function parseSkills(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  const plain = value.filter((s): s is string => typeof s === "string").map(str).filter(Boolean);
  const groups = list(value).map((group) => ({
    label: str(group.group).replace(/[:\-–\s]+$/, ""),
    items: (Array.isArray(group.items) ? group.items : []).map(str).filter(Boolean),
  }));
  return skillsText([...(plain.length > 0 ? [{ label: "", items: plain }] : []), ...groups].filter((g) => g.items.length > 0));
}

// Words too common in project and repository names to show they're the same project
const GENERIC_WORDS = new Set([
  "app", "application", "project", "projects", "web", "website", "site", "system", "api", "backend",
  "frontend", "the", "and", "for", "with", "using", "tool", "platform", "based", "management", "my",
]);

const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
const nameWords = (text: string) =>
  text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length >= 3 && !GENERIC_WORDS.has(word));

// How well a repository name fits a project name: "budget-buddy" fits "Budget Buddy" exactly,
// "fastapi-compliance-platform" fits "Compliance Platform" by a shared word. 0 means no fit.
function fit(repo: string, project: string) {
  const a = squash(repo);
  const b = squash(project);
  if (!a || !b) return 0;
  if (a === b) return 100;
  const shared = new Set(nameWords(project));
  const words = nameWords(repo).filter((word) => shared.has(word)).length;
  const contains = Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a)) ? 10 : 0;
  return contains + words;
}

// Each link once, without share-tracking tails ("?utm_source=share_via...")
const uniqueLinks = (links: string[]) => {
  const seen = new Set<string>();
  return links.map(withoutTracking).filter((link) => {
    const key = linkKey(link);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// A PDF lists every link in the file, and the model tends to put them all in the header, so
// the header ends up with "GitHub" five times. The header keeps personal links (LinkedIn, the
// GitHub profile, portfolio, LeetCode); a link to one repository moves to the project it
// belongs to; and each link appears once.
export function sortLinks(resume: Resume): Resume {
  const projects = resume.projects.map((project) => ({ project, links: uniqueLinks(splitLinks(project.link)) }));
  const onProjects = new Set(projects.flatMap((p) => p.links.map(linkKey)));
  const header: string[] = [];
  const unplaced: string[] = [];

  for (const link of uniqueLinks(splitLinks(resume.basics.link))) {
    const repo = repoName(link);
    if (!repo) {
      header.push(link);
      continue;
    }
    // Already on its project, so it only needs to leave the header
    if (onProjects.has(linkKey(link))) continue;
    const scores = projects.map((p) => fit(repo, p.project.name));
    const best = Math.max(0, ...scores);
    const target = best > 0 && scores.filter((s) => s === best).length === 1 ? projects[scores.indexOf(best)] : null;
    if (target) target.links.push(link);
    else unplaced.push(link);
  }

  // Links come in the order they appear in the file, so when the leftover repository links and
  // the projects still without a link are the same number, they pair up in order. Otherwise
  // they stay in the header, where the person can see them, rather than being lost.
  const linkless = projects.filter((p) => p.links.length === 0);
  if (unplaced.length > 0 && unplaced.length === linkless.length) linkless.forEach((p, i) => p.links.push(unplaced[i]));
  else header.push(...unplaced);

  return {
    ...resume,
    basics: { ...resume.basics, link: header.join(", ") },
    projects: projects.map((p) => ({ ...p.project, link: p.links.join(", ") })),
  };
}

// Two "Certifications" sections (one from the list, one filed under "other") become one.
// Custom sections stay separate: each has its own heading.
function mergeSameKind(sections: ExtraSection[]) {
  const merged: ExtraSection[] = [];
  for (const section of sections) {
    const same = section.kind === "custom" ? undefined : merged.find((s) => s.kind === section.kind);
    if (same) same.items.push(...section.items);
    else merged.push(section);
  }
  return merged;
}

// Turns the model's JSON into a Folio resume, or null if nothing useful came back
export function parseImport(raw: unknown): Resume | null {
  if (typeof raw !== "string") return null;
  let data: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
    if (!parsed || typeof parsed !== "object") return null;
    data = parsed;
  } catch {
    return null;
  }

  const resume = createEmptyResume();
  const basics = (data.basics && typeof data.basics === "object" ? data.basics : {}) as Record<string, unknown>;
  const name = str(basics.name);
  resume.basics = {
    // "PRIYA SHAH" in a resume header reads better as "Priya Shah"
    name: name === name.toUpperCase() ? name.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : name,
    title: str(basics.title),
    email: str(basics.email),
    phone: str(basics.phone),
    location: str(basics.location),
    link: str(basics.link),
  };
  resume.summary = str(data.summary);
  const other = otherSections(data.other);

  resume.experience = list(data.experience)
    .map((job) => ({
      ...newExperience(),
      role: str(job.role),
      company: str(job.company),
      location: str(job.location),
      start: date(job.start),
      end: /^(present|current|now|till date|to date)$/i.test(str(job.end)) ? PRESENT : date(job.end),
      bullets: lines(job.bullets),
    }))
    .concat(other.moved.experience)
    .filter((job) => job.role || job.company || job.bullets)
    // "2019 – 2019" reads better as "2019"
    .map((job) => (job.end && job.end === job.start ? { ...job, end: "" } : job));

  resume.education = list(data.education)
    .map((school) => ({
      ...newEducation(),
      school: str(school.school),
      degree: str(school.degree),
      location: str(school.location),
      start: date(school.start),
      end: date(school.end),
      details: str(school.details),
    }))
    .concat(other.moved.education)
    .filter((school) => school.school || school.degree);

  resume.projects = list(data.projects)
    .map((project) => ({
      ...newProject(),
      name: str(project.name),
      link: str(project.link),
      tech: str(project.tech),
      date: date(project.date),
      bullets: lines(project.bullets),
    }))
    .concat(other.moved.projects)
    .filter((project) => project.name || project.bullets);

  resume.skills = parseSkills(data.skills);

  resume.extras = mergeSameKind(
    [
      extraSection("certifications", "Certifications", list(data.certifications), ["name", "issuer", "date"]),
      extraSection("awards", "Awards", list(data.awards), ["name", "issuer", "date"]),
      extraSection("volunteering", "Volunteering", list(data.volunteering), ["role", "organization", "dates", "bullets"]),
      extraSection("languages", "Languages", list(data.languages), ["language", "level", ""]),
      ...other.extras,
    ].filter((section): section is ExtraSection => section !== null),
  );
  resume.order = [...CORE_SECTIONS, ...resume.extras.map((section) => section.id)];

  // Keep at least one empty job and school so the editor has fields to fill in
  if (resume.experience.length === 0) resume.experience = [newExperience()];
  if (resume.education.length === 0) resume.education = [newEducation()];

  const found = resume.basics.name || resume.summary || resume.experience.some((job) => job.role || job.company);
  return found ? sortLinks(resume) : null;
}
