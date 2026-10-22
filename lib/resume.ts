// The single source of truth for a resume. Every feature (editor, preview,
// PDF export, AI, job match) reads and writes this shape.

export type Basics = {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  link: string;
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  // One bullet per line
  bullets: string;
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  details: string;
};

export type Project = {
  id: string;
  name: string;
  link: string;
  // The tools or technologies it's built with, shown under the name ("React, Node.js, MongoDB")
  tech: string;
  // When it was done: "2025" or "Feb 2024 – May 2024"
  date: string;
  bullets: string;
};

// Optional sections the user can add (certifications, awards, ...)
export type ExtraKind = "certifications" | "awards" | "volunteering" | "languages" | "custom";

export type ExtraItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  bullets: string;
};

export type ExtraSection = {
  id: string;
  kind: ExtraKind;
  title: string;
  items: ExtraItem[];
};

// Field labels for each kind of extra section; null hides that field
export const EXTRA_KINDS: Record<
  ExtraKind,
  { title: string; item: string; subtitle: string; date: string | null; bullets: boolean }
> = {
  certifications: { title: "Certifications", item: "Certification", subtitle: "Issued by", date: "Date", bullets: false },
  awards: { title: "Awards", item: "Award", subtitle: "Given by", date: "Date", bullets: false },
  volunteering: { title: "Volunteering", item: "Role", subtitle: "Organization", date: "Dates", bullets: true },
  languages: { title: "Languages", item: "Language", subtitle: "Level", date: null, bullets: false },
  custom: { title: "Custom section", item: "Title", subtitle: "Subtitle", date: "Date", bullets: true },
};

export type CoreSection = "summary" | "experience" | "projects" | "education" | "skills";

export const CORE_SECTIONS: CoreSection[] = ["summary", "experience", "projects", "education", "skills"];

export const CORE_TITLES: Record<CoreSection, string> = {
  summary: "Summary",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
};

// All templates are single-column plain text, so every one of them stays ATS-readable
export const TEMPLATES = {
  classic: { label: "Classic" },
  modern: { label: "Modern" },
  executive: { label: "Executive" },
  compact: { label: "Compact" },
  serif: { label: "Serif" },
} as const;

export type TemplateName = keyof typeof TEMPLATES;

export type ResumeStyle = {
  template: TemplateName;
  fontSize: "small" | "medium" | "large";
  spacing: "compact" | "normal" | "relaxed";
  // Links as short clickable labels ("LinkedIn") or as full addresses
  links: "label" | "url";
};

export const DEFAULT_STYLE: ResumeStyle = { template: "classic", fontSize: "medium", spacing: "normal", links: "label" };

// The job this resume is aimed at, used by job match and cover letters
export type JobTarget = {
  description: string;
  title: string;
  company: string;
  // Skills and terms the posting asks for, extracted once by AI
  keywords: string[];
};

export function emptyTarget(): JobTarget {
  return { description: "", title: "", company: "", keywords: [] };
}

export type Resume = {
  basics: Basics;
  summary: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  // Comma separated
  skills: string;
  extras: ExtraSection[];
  // Section order on the page: core section names and extra section ids
  order: string[];
  style: ResumeStyle;
  target: JobTarget;
  coverLetter: string;
};

export const PRESENT = "Present";

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function newExperience(): Experience {
  return { id: newId(), role: "", company: "", location: "", start: "", end: "", bullets: "" };
}

export function newEducation(): Education {
  return { id: newId(), school: "", degree: "", location: "", start: "", end: "", details: "" };
}

export function newProject(): Project {
  return { id: newId(), name: "", link: "", tech: "", date: "", bullets: "" };
}

export function newExtraItem(): ExtraItem {
  return { id: newId(), title: "", subtitle: "", date: "", bullets: "" };
}

export function newExtraSection(kind: ExtraKind): ExtraSection {
  return { id: newId(), kind, title: EXTRA_KINDS[kind].title, items: [newExtraItem()] };
}

export function createEmptyResume(): Resume {
  return {
    basics: { name: "", title: "", email: "", phone: "", location: "", link: "" },
    summary: "",
    experience: [newExperience()],
    education: [newEducation()],
    projects: [],
    skills: "",
    extras: [],
    order: [...CORE_SECTIONS],
    style: { ...DEFAULT_STYLE },
    target: emptyTarget(),
    coverLetter: "",
  };
}

export function createSampleResume(): Resume {
  const certifications: ExtraSection = {
    id: newId(),
    kind: "certifications",
    title: "Certifications",
    items: [
      { id: newId(), title: "AWS Certified Cloud Practitioner", subtitle: "Amazon Web Services", date: "2024", bullets: "" },
    ],
  };

  return {
    basics: {
      name: "Jordan Patel",
      title: "Frontend Developer",
      email: "jordan.patel@email.com",
      phone: "(555) 123-4567",
      location: "Austin, TX",
      link: "linkedin.com/in/jordanpatel, github.com/jordanpatel",
    },
    summary:
      "Frontend developer with 3 years of experience building fast, accessible web apps in React and TypeScript. Comfortable owning features end to end, from design handoff to production.",
    experience: [
      {
        id: newId(),
        role: "Frontend Developer",
        company: "Brightpath Software",
        location: "Austin, TX",
        start: "Jun 2023",
        end: PRESENT,
        bullets:
          "Rebuilt the customer dashboard in React and TypeScript, cutting page load time from 4.1s to 1.6s\nCreated a shared component library used by 4 product teams\nMentored 2 junior developers through code reviews and pairing",
      },
      {
        id: newId(),
        role: "Web Developer Intern",
        company: "Northline Media",
        location: "Remote",
        start: "Jan 2022",
        end: "May 2023",
        bullets:
          "Built landing pages for marketing campaigns reaching 200k+ visitors\nFixed accessibility issues across the main site to meet WCAG AA",
      },
    ],
    education: [
      {
        id: newId(),
        school: "University of Texas at Austin",
        degree: "B.S. Computer Science",
        location: "Austin, TX",
        start: "2019",
        end: "2023",
        details: "GPA 3.7",
      },
    ],
    projects: [
      {
        id: newId(),
        name: "Budget Buddy",
        link: "github.com/jordanpatel/budget-buddy",
        tech: "Next.js, PostgreSQL",
        date: "2024",
        bullets: "Personal finance tracker built with Next.js and PostgreSQL, used by 300+ people",
      },
    ],
    skills: "JavaScript, TypeScript, React, Next.js, HTML, CSS, Tailwind CSS, Git, REST APIs, Figma",
    extras: [certifications],
    order: [...CORE_SECTIONS, certifications.id],
    style: { ...DEFAULT_STYLE },
    // A sample job, so the example also shows Job match working
    target: {
      description:
        "Frontend Engineer at Northwind. You'll build fast, accessible interfaces with React and TypeScript, own features end to end, and help grow our shared component library. Experience with Next.js, GraphQL, Jest and accessibility (WCAG) is a strong plus.",
      title: "Frontend Engineer",
      company: "Northwind",
      keywords: ["React", "TypeScript", "Next.js", "component library", "accessibility", "WCAG", "GraphQL", "Jest"],
    },
    coverLetter: "",
  };
}

// Copies only known string fields, so a damaged or hand-edited file can't break the editor
function pickStrings<T extends Record<string, string>>(source: unknown, base: T): T {
  const src = (source && typeof source === "object" ? source : {}) as Record<string, unknown>;
  const out: Record<string, string> = { ...base };
  for (const key of Object.keys(base)) {
    // Saved ids are kept, unless missing or empty, in which case the fresh one from base stays
    if (typeof src[key] === "string" && (key !== "id" || src[key] !== "")) out[key] = src[key] as string;
  }
  return out as T;
}

function pickList<T extends Record<string, string>>(source: unknown, create: () => T): T[] {
  return Array.isArray(source) ? source.map((item) => pickStrings(item, create())) : [];
}

function pickOne<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeExtras(source: unknown): ExtraSection[] {
  if (!Array.isArray(source)) return [];
  return source
    .filter((item) => item && typeof item === "object")
    .map((item: Record<string, unknown>) => {
      const kind = pickOne(item.kind, Object.keys(EXTRA_KINDS) as ExtraKind[], "custom");
      return {
        // Keep the id, since the section order refers to it
        id: typeof item.id === "string" && item.id ? item.id : newId(),
        kind,
        title: typeof item.title === "string" ? item.title : EXTRA_KINDS[kind].title,
        items: pickList(item.items, newExtraItem),
      };
    });
}

// Keeps known sections in the saved order, then appends any that are missing
function normalizeOrder(source: unknown, extras: ExtraSection[]): string[] {
  const valid = [...CORE_SECTIONS, ...extras.map((e) => e.id)];
  const saved = Array.isArray(source) ? source.filter((key) => valid.includes(key)) : [];
  const order = [...new Set<string>(saved)];
  for (const key of valid) if (!order.includes(key)) order.push(key);
  return order;
}

// Turns saved or imported data into a valid resume, or null if it isn't one
export function normalizeResume(data: unknown): Resume | null {
  if (!data || typeof data !== "object") return null;
  const src = data as Record<string, unknown>;
  if (!src.basics || typeof src.basics !== "object") return null;

  const empty = createEmptyResume();
  const extras = normalizeExtras(src.extras);
  const style = (src.style && typeof src.style === "object" ? src.style : {}) as Record<string, unknown>;
  const target = (src.target && typeof src.target === "object" ? src.target : {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" ? value : "");

  return {
    basics: pickStrings(src.basics, empty.basics),
    summary: typeof src.summary === "string" ? src.summary : "",
    experience: pickList(src.experience, newExperience),
    education: pickList(src.education, newEducation),
    projects: pickList(src.projects, newProject),
    skills: typeof src.skills === "string" ? src.skills : "",
    extras,
    order: normalizeOrder(src.order, extras),
    style: {
      template: pickOne(style.template, Object.keys(TEMPLATES) as TemplateName[], DEFAULT_STYLE.template),
      fontSize: pickOne(style.fontSize, ["small", "medium", "large"], DEFAULT_STYLE.fontSize),
      spacing: pickOne(style.spacing, ["compact", "normal", "relaxed"], DEFAULT_STYLE.spacing),
      links: pickOne(style.links, ["label", "url"], DEFAULT_STYLE.links),
    },
    target: {
      description: text(target.description),
      title: text(target.title),
      company: text(target.company),
      keywords: Array.isArray(target.keywords)
        ? target.keywords.filter((k): k is string => typeof k === "string" && k.trim() !== "")
        : [],
    },
    coverLetter: text(src.coverLetter),
  };
}

// Which entries count as filled in; empty ones are left off the resume
export function hasExperience(item: Experience) {
  return Boolean(item.role || item.company || item.bullets.trim());
}

export function hasEducation(item: Education) {
  return Boolean(item.school || item.degree);
}

export function hasProject(item: Project) {
  return Boolean(item.name || item.bullets.trim());
}

export function hasExtraItem(item: ExtraItem) {
  return Boolean(item.title || item.subtitle || item.bullets.trim());
}

// The sections that will actually appear on the page, in order
export function visibleSections(resume: Resume): { key: string; title: string; extra?: ExtraSection }[] {
  const filled: Record<CoreSection, boolean> = {
    summary: resume.summary.trim() !== "",
    experience: resume.experience.some(hasExperience),
    projects: resume.projects.some(hasProject),
    education: resume.education.some(hasEducation),
    skills: skillList(resume.skills).length > 0,
  };

  return resume.order.flatMap((key) => {
    if (key in CORE_TITLES) {
      return filled[key as CoreSection] ? [{ key, title: CORE_TITLES[key as CoreSection] }] : [];
    }
    const extra = resume.extras.find((e) => e.id === key);
    return extra && extra.items.some(hasExtraItem) ? [{ key, title: extra.title, extra }] : [];
  });
}

// Page sizes in CSS pixels (96 per inch)
export const PAPER = {
  letter: { label: "Letter", css: "letter", width: 816, height: 1056 },
  a4: { label: "A4", css: "A4", width: 794, height: 1123 },
} as const;

export type PaperSize = keyof typeof PAPER;

// Half an inch, used both on screen and as the printed page margin
export const PAGE_MARGIN = 48;

// Splits a multiline field into bullets, dropping blank lines
export function toLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function toList(text: string) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// Skills can be one list ("Python, SQL, Excel") or grouped, one group per line
// ("Languages: Python, SQL" then "Tools: Git, Docker"). A line without a label is its own group.
export type SkillGroup = { label: string; items: string[] };

const splitSkills = (text: string) =>
  text
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean);

export function skillGroups(text: string): SkillGroup[] {
  return toLines(text)
    .map((line) => {
      // "Languages: Python, SQL", and also "Skills- Python | SQL" from some templates. A dash only
      // counts when a space follows it, so "CI-CD, Docker" stays a plain list.
      const labelled = line.match(/^([^,:|]{1,40}?)\s*(?::|-\s)\s*(.*)$/);
      return labelled
        ? { label: labelled[1].trim(), items: splitSkills(labelled[2]) }
        : { label: "", items: splitSkills(line) };
    })
    .filter((group) => group.items.length > 0);
}

// How grouped skills are written back into the skills field, one group per line
export function skillsText(groups: SkillGroup[]) {
  return groups.map((group) => (group.label ? `${group.label}: ` : "") + group.items.join(", ")).join("\n");
}

// Every skill, whether or not they're grouped. "|" separates skills as well as commas.
export function skillList(text: string) {
  return skillGroups(text).flatMap((group) => group.items);
}
