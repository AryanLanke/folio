// New, empty entries and resumes, and the sample resume.

import {
  CORE_SECTIONS,
  DEFAULT_STYLE,
  EXTRA_KINDS,
  type Education,
  type Experience,
  type ExtraItem,
  type ExtraKind,
  type ExtraSection,
  PRESENT,
  type Project,
  type Resume,
  emptyTarget,
} from "@/lib/resume/types";

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
    titles: {},
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
      name: "Emily Carter",
      title: "Frontend Developer",
      email: "emily.carter@example.com",
      phone: "(512) 555-0142",
      location: "Austin, TX",
      link: "linkedin.com/in/emily-carter-example, github.com/emily-carter-example",
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
        link: "github.com/emily-carter-example/budget-buddy",
        tech: "Next.js, PostgreSQL",
        date: "2024",
        bullets: "Personal finance tracker built with Next.js and PostgreSQL, used by 300+ people",
      },
    ],
    skills: "JavaScript, TypeScript, React, Next.js, HTML, CSS, Tailwind CSS, Git, REST APIs, Figma",
    extras: [certifications],
    order: [...CORE_SECTIONS, certifications.id],
    titles: {},
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
