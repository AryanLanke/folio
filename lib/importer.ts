// Import: AI sorts the text of an existing resume into Folio's fields. It copies, it doesn't
// rewrite: polishing is a separate, optional step the user chooses afterwards.

import { plainCharacters } from "@/lib/enhance";
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

export function buildImportMessages(text: string) {
  const system = [
    "You convert the text of a resume into structured JSON. The text was extracted from a PDF or pasted, so line breaks and spacing may be messy.",
    "",
    "Rules:",
    "- Copy the person's wording exactly. Do not rewrite, improve, summarize or translate anything.",
    "- Never invent information. Use an empty string or empty list for anything not in the text.",
    `- For a current job, set "end" to "${PRESENT}".`,
    "- Put each bullet point or achievement as its own item in \"bullets\", without bullet symbols.",
    "- Split skills into individual items.",
    '- Put every profile link (LinkedIn, GitHub, portfolio, and so on) in basics "link", separated by commas. Put each project\'s links in its "link", separated by commas.',
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

const lines = (value: unknown) =>
  (Array.isArray(value) ? value : typeof value === "string" ? value.split("\n") : [])
    .filter((line): line is string => typeof line === "string")
    .map((line) => plainCharacters(line).trim().replace(/^[•\-*–▪●◦]\s*/, ""))
    .filter(Boolean)
    .join("\n");

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
  return found ? resume : null;
}
