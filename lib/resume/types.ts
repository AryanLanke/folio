// The single source of truth for a resume. Every feature (editor, preview, PDF export, AI, job
// match) reads and writes this shape. Also the page sizes everything is laid out on.

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
  academic: { label: "Academic" },
  minimal: { label: "Minimal" },
  bold: { label: "Bold" },
  elegant: { label: "Elegant" },
} as const;

export type TemplateName = keyof typeof TEMPLATES;

export type ResumeStyle = {
  template: TemplateName;
  fontSize: "small" | "medium" | "large";
  spacing: "compact" | "normal" | "relaxed";
  // Links as short clickable labels ("LinkedIn") or as full addresses
  links: "label" | "url";
  // The person's own colour for headings and lines ("#1e3a5f"); null keeps the template's
  accent: string | null;
};

export const DEFAULT_STYLE: ResumeStyle = {
  template: "classic",
  fontSize: "medium",
  spacing: "normal",
  links: "label",
  accent: null,
};

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
  // The person's own names for core sections ("Profile" instead of "Summary")
  titles: Partial<Record<CoreSection, string>>;
  style: ResumeStyle;
  target: JobTarget;
  coverLetter: string;
};

export const PRESENT = "Present";

// Page sizes in CSS pixels (96 per inch)
export const PAPER = {
  letter: { label: "Letter", css: "letter", width: 816, height: 1056 },
  a4: { label: "A4", css: "A4", width: 794, height: 1123 },
} as const;

export type PaperSize = keyof typeof PAPER;

// Half an inch, used both on screen and as the printed page margin
export const PAGE_MARGIN = 48;
