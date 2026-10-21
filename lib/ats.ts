// What applicant tracking systems (Workday, Greenhouse, Taleo, ...) get out of the PDF:
// plain text in reading order. Also a checklist of what they need to parse it well.

import {
  EXTRA_KINDS,
  type Resume,
  hasEducation,
  hasExperience,
  hasExtraItem,
  hasProject,
  toLines,
  toList,
  visibleSections,
} from "@/lib/resume";
import { checkDate, checkEmail, checkPhone } from "@/lib/validate";
import { contactItems, resumeLinks, splitLinks } from "@/lib/links";

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

export function resumeToPlainText(resume: Resume): string {
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
          lines.push(joinParts([project.name, ...resumeLinks(project.link, resume.style.links).map((link) => link.text)]));
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
        lines.push(toList(resume.skills).join(", "));
        break;
    }
  }

  return lines.join("\n").trim();
}

export type AtsCheck = { label: string; ok: boolean; detail: string };

export function atsChecks(resume: Resume): AtsCheck[] {
  const { basics } = resume;
  const jobs = resume.experience.filter(hasExperience);
  const schools = resume.education.filter(hasEducation);
  const projects = resume.projects.filter(hasProject);

  const dates = [
    ...jobs.flatMap((job) => [job.start, job.end]),
    ...schools.flatMap((school) => [school.start, school.end]),
  ];
  const badDates = dates.filter((date) => checkDate(date) !== null);
  const incompleteJobs = jobs.filter((job) => !job.role.trim() || !job.company.trim() || !job.start.trim());
  const skillCount = toList(resume.skills).length;
  const untitled = resume.extras.filter((e) => e.items.some(hasExtraItem) && !e.title.trim());

  return [
    {
      label: "Name",
      ok: basics.name.trim() !== "",
      detail: basics.name.trim() ? "Found at the top." : "Add your full name. The ATS uses it to create your profile.",
    },
    {
      label: "Email",
      ok: basics.email.trim() !== "" && checkEmail(basics.email) === null,
      detail: !basics.email.trim()
        ? "Add an email so recruiters can contact you."
        : (checkEmail(basics.email) ?? "Found and readable."),
    },
    {
      label: "Phone",
      ok: basics.phone.trim() !== "" && checkPhone(basics.phone) === null,
      detail: !basics.phone.trim()
        ? "Add a phone number. Many ATS forms require one."
        : (checkPhone(basics.phone) ?? "Found and readable."),
    },
    {
      label: "Work history",
      ok: jobs.length > 0 || projects.length > 0,
      detail:
        jobs.length > 0 || projects.length > 0
          ? `${jobs.length} job${jobs.length === 1 ? "" : "s"} and ${projects.length} project${projects.length === 1 ? "" : "s"} found.`
          : "Add at least one job or project.",
    },
    {
      label: "Job details",
      ok: incompleteJobs.length === 0,
      detail:
        incompleteJobs.length === 0
          ? "Every job has a title, company and start date."
          : "Some jobs are missing a title, company or start date. The ATS uses these to build your timeline.",
    },
    {
      label: "Dates",
      ok: badDates.length === 0,
      detail:
        badDates.length === 0
          ? "All dates are in a format the ATS can read."
          : `Can't read: ${badDates.map((d) => `"${d}"`).join(", ")}. Use a format like "Jun 2023".`,
    },
    {
      label: "Skills",
      ok: skillCount >= 3,
      detail:
        skillCount >= 3
          ? `${skillCount} skills listed. Recruiters search the ATS for these keywords.`
          : "List at least a few skills. Recruiters search the ATS for these keywords.",
    },
    {
      label: "Section titles",
      ok: untitled.length === 0,
      detail: untitled.length === 0 ? "Every section has a title." : "Give every section a title so the ATS knows what it is.",
    },
  ];
}
