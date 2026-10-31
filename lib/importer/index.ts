// Import: AI sorts the text of an existing resume into Folio's fields. It copies, it doesn't
// rewrite: polishing is a separate, optional step the user chooses afterwards.
//
// prompt.ts      what the AI is asked for, and the limits on what the import accepts
// values.ts      reading the values it sends back
// repo-links.ts  putting each link where it belongs

import {
  CORE_SECTIONS,
  type ExtraSection,
  PRESENT,
  type Resume,
  createEmptyResume,
  newEducation,
  newExperience,
  newProject,
} from "@/lib/resume";
import { date, extraSection, lines, list, otherSections, parseSkills, str } from "@/lib/importer/values";
import { sortLinks } from "@/lib/importer/repo-links";

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

export { MAX_IMPORT_FILE_BYTES, MAX_IMPORT_LENGTH, RESUME_SHAPE, buildImportMessages } from "@/lib/importer/prompt";
export { fullYears } from "@/lib/importer/values";
