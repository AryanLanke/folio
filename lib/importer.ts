// Import: AI sorts the text of an existing resume into Folio's fields. It copies, it doesn't
// rewrite: polishing is a separate, optional step the user chooses afterwards.

import { plainCharacters } from "@/lib/enhance";
import { continuesLine } from "@/lib/ats";
import { linkKey, repoName, splitLinks } from "@/lib/links";
import {
  CORE_SECTIONS,
  type ExtraKind,
  type ExtraSection,
  PRESENT,
  type Resume,
  createEmptyResume,
  newEducation,
  newExperience,
  newExtraItem,
  newId,
  newProject,
} from "@/lib/resume";

export const MAX_IMPORT_LENGTH = 15000;
// Largest file the import accepts; Vercel turns away request bodies over 4.5 MB before they arrive
export const MAX_IMPORT_FILE_BYTES = 4 * 1024 * 1024;

export function buildImportMessages(text: string) {
  const system = [
    "You convert the text of a resume into structured JSON. The text was extracted from a PDF or pasted, so line breaks and spacing may be messy.",
    "",
    "Rules:",
    "- Copy the person's wording exactly. Do not rewrite, improve, summarize or translate anything.",
    "- Never invent information. Use an empty string or empty list for anything not in the text.",
    `- For a current job, set "end" to "${PRESENT}".`,
    "- Put each bullet point or achievement as its own item in \"bullets\", without bullet symbols. If one bullet's sentence carries on to the next line of the text, it's still one bullet: join it.",
    "- Split skills into individual items.",
    '- Put only the person\'s own profile links in basics "link", separated by commas: LinkedIn, their GitHub profile (github.com/username), portfolio, LeetCode and similar.',
    '- A link to one repository, demo or project (like github.com/username/project-name) goes in that project\'s "link", never in basics. Separate several with commas.',
    "- List each link only once.",
    "- Ignore page numbers, headers and footers.",
    "",
    "Respond with JSON only, in exactly this shape:",
    JSON.stringify({
      basics: { name: "", title: "", email: "", phone: "", location: "", link: "" },
      summary: "",
      experience: [{ role: "", company: "", location: "", start: "", end: "", bullets: [""] }],
      education: [{ school: "", degree: "", location: "", start: "", end: "", details: "" }],
      projects: [{ name: "", link: "", bullets: [""] }],
      skills: [""],
      certifications: [{ name: "", issuer: "", date: "" }],
      awards: [{ name: "", issuer: "", date: "" }],
      volunteering: [{ role: "", organization: "", dates: "", bullets: [""] }],
      languages: [{ language: "", level: "" }],
    }),
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Resume text:\n<<<\n${text}\n>>>` },
  ];
}

// Every value goes through plainCharacters: models write look-alike hyphens and spaces
const str = (value: unknown) => (typeof value === "string" ? plainCharacters(value).trim() : "");

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
      date: dateKey ? str(item[dateKey]) : "",
      bullets: bulletsKey ? lines(item[bulletsKey]) : "",
    }))
    .filter((item) => item.title || item.subtitle);
  return parsed.length > 0 ? ({ id: newId(), kind, title, items: parsed } satisfies ExtraSection) : null;
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

const uniqueLinks = (links: string[]) => {
  const seen = new Set<string>();
  return links.filter((link) => {
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

  resume.experience = list(data.experience)
    .map((job) => ({
      ...newExperience(),
      role: str(job.role),
      company: str(job.company),
      location: str(job.location),
      start: str(job.start),
      end: /^(present|current|now|till date|to date)$/i.test(str(job.end)) ? PRESENT : str(job.end),
      bullets: lines(job.bullets),
    }))
    .filter((job) => job.role || job.company || job.bullets)
    // "2019 – 2019" reads better as "2019"
    .map((job) => (job.end && job.end === job.start ? { ...job, end: "" } : job));

  resume.education = list(data.education)
    .map((school) => ({
      ...newEducation(),
      school: str(school.school),
      degree: str(school.degree),
      location: str(school.location),
      start: str(school.start),
      end: str(school.end),
      details: str(school.details),
    }))
    .filter((school) => school.school || school.degree);

  resume.projects = list(data.projects)
    .map((project) => ({ ...newProject(), name: str(project.name), link: str(project.link), bullets: lines(project.bullets) }))
    .filter((project) => project.name || project.bullets);

  const skills = Array.isArray(data.skills) ? data.skills : typeof data.skills === "string" ? data.skills.split(",") : [];
  resume.skills = skills
    .filter((s): s is string => typeof s === "string")
    .map((s) => str(s))
    .filter(Boolean)
    .join(", ");

  resume.extras = [
    extraSection("certifications", "Certifications", list(data.certifications), ["name", "issuer", "date"]),
    extraSection("awards", "Awards", list(data.awards), ["name", "issuer", "date"]),
    extraSection("volunteering", "Volunteering", list(data.volunteering), ["role", "organization", "dates", "bullets"]),
    extraSection("languages", "Languages", list(data.languages), ["language", "level", ""]),
  ].filter((section): section is ExtraSection => section !== null);
  resume.order = [...CORE_SECTIONS, ...resume.extras.map((section) => section.id)];

  // Keep at least one empty job and school so the editor has fields to fill in
  if (resume.experience.length === 0) resume.experience = [newExperience()];
  if (resume.education.length === 0) resume.education = [newEducation()];

  const found = resume.basics.name || resume.summary || resume.experience.some((job) => job.role || job.company);
  return found ? sortLinks(resume) : null;
}
