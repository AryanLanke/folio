// What applicant tracking systems (Workday, Greenhouse, Taleo, ...) get out of the PDF: plain text
// in reading order, the way the "What the ATS reads" box shows it.

import {
  EXTRA_KINDS,
  type Resume,
  hasEducation,
  hasExperience,
  hasExtraItem,
  hasProject,
  skillGroups,
  toLines,
  visibleSections,
} from "@/lib/resume";
import { contactItems, resumeLinks, splitLinks } from "@/lib/links";
import { plainResume } from "@/lib/rich";

// True when links show as labels, so ATS software (which reads visible text) won't see the addresses
export function linksHiddenFromAts(resume: Resume) {
  if (resume.style.links !== "label") return false;
  return splitLinks(resume.basics.link).length > 0 || resume.projects.some((p) => splitLinks(p.link).length > 0);
}

function joinParts(parts: string[], separator = " | ") {
  return parts.map((part) => part.trim()).filter(Boolean).join(separator);
}

function dateRange(start: string, end: string) {
  return joinParts([start, end], " – ");
}

function bullets(text: string) {
  return toLines(text).map((line) => `• ${line}`);
}

export function resumeToPlainText(formatted: Resume): string {
  // Screening software reads words, not bold or italic
  const resume = plainResume(formatted);
  const { basics } = resume;
  const lines: string[] = [];

  if (basics.name.trim()) lines.push(basics.name.trim().toUpperCase());
  if (basics.title.trim()) lines.push(basics.title.trim());
  // The visible text only: with short link labels, ATS software sees "LinkedIn", not the address
  const contact = joinParts(contactItems(basics, resume.style.links).map((item) => item.text));
  if (contact) lines.push(contact);

  for (const section of visibleSections(resume)) {
    lines.push("", section.title.toUpperCase());

    if (section.extra) {
      const items = section.extra.items.filter(hasExtraItem);
      if (section.extra.kind === "languages") {
        lines.push(items.map((i) => (i.subtitle ? `${i.title} (${i.subtitle})` : i.title)).join(", "));
        continue;
      }
      const fields = EXTRA_KINDS[section.extra.kind];
      for (const item of items) {
        lines.push(joinParts([item.title, item.subtitle, fields.date ? item.date : ""]));
        if (fields.bullets) lines.push(...bullets(item.bullets));
      }
      continue;
    }

    switch (section.key) {
      case "summary":
        lines.push(resume.summary.trim());
        break;
      case "experience":
        for (const job of resume.experience.filter(hasExperience)) {
          lines.push(joinParts([job.role, job.company, job.location, dateRange(job.start, job.end)]));
          lines.push(...bullets(job.bullets));
        }
        break;
      case "projects":
        for (const project of resume.projects.filter(hasProject)) {
          lines.push(
            joinParts([project.name, ...resumeLinks(project.link, resume.style.links).map((link) => link.text), project.date]),
          );
          if (project.tech.trim()) lines.push(project.tech.trim());
          lines.push(...bullets(project.bullets));
        }
        break;
      case "education":
        for (const school of resume.education.filter(hasEducation)) {
          lines.push(joinParts([school.degree, school.school, school.location, dateRange(school.start, school.end)]));
          if (school.details.trim()) lines.push(school.details.trim());
        }
        break;
      case "skills":
        for (const group of skillGroups(resume.skills)) {
          lines.push((group.label ? `${group.label}: ` : "") + group.items.join(", "));
        }
        break;
    }
  }

  return lines.join("\n").trim();
}
