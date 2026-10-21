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
  bullets: string;
};

export type Resume = {
  basics: Basics;
  summary: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  // Comma separated
  skills: string;
};

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
  return { id: newId(), name: "", link: "", bullets: "" };
}

export function createEmptyResume(): Resume {
  return {
    basics: { name: "", title: "", email: "", phone: "", location: "", link: "" },
    summary: "",
    experience: [newExperience()],
    education: [newEducation()],
    projects: [],
    skills: "",
  };
}

export function createSampleResume(): Resume {
  return {
  basics: {
    name: "Jordan Patel",
    title: "Frontend Developer",
    email: "jordan.patel@email.com",
    phone: "(555) 123-4567",
    location: "Austin, TX",
    link: "linkedin.com/in/jordanpatel",
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
      end: "Present",
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
      bullets: "Personal finance tracker built with Next.js and PostgreSQL, used by 300+ people",
    },
  ],
  skills: "JavaScript, TypeScript, React, Next.js, HTML, CSS, Tailwind CSS, Git, REST APIs, Figma",
  };
}

// Copies only known string fields, so a damaged or hand-edited file can't break the editor
function pickStrings<T extends Record<string, string>>(source: unknown, base: T): T {
  const src = (source && typeof source === "object" ? source : {}) as Record<string, unknown>;
  const out: Record<string, string> = { ...base };
  for (const key of Object.keys(base)) {
    if (key !== "id" && typeof src[key] === "string") out[key] = src[key] as string;
  }
  return out as T;
}

function pickList<T extends Record<string, string>>(source: unknown, create: () => T): T[] {
  return Array.isArray(source) ? source.map((item) => pickStrings(item, create())) : [];
}

// Turns saved or imported data into a valid resume, or null if it isn't one
export function normalizeResume(data: unknown): Resume | null {
  if (!data || typeof data !== "object") return null;
  const src = data as Record<string, unknown>;
  if (!src.basics || typeof src.basics !== "object") return null;

  const empty = createEmptyResume();
  return {
    basics: pickStrings(src.basics, empty.basics),
    summary: typeof src.summary === "string" ? src.summary : "",
    experience: pickList(src.experience, newExperience),
    education: pickList(src.education, newEducation),
    projects: pickList(src.projects, newProject),
    skills: typeof src.skills === "string" ? src.skills : "",
  };
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
