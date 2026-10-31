// Which entries and sections appear on the page, in what order and under what name.

import {
  CORE_TITLES,
  type CoreSection,
  EXTRA_KINDS,
  type Education,
  type Experience,
  type ExtraItem,
  type ExtraSection,
  type Project,
  type Resume,
} from "@/lib/resume/types";
import { skillList } from "@/lib/resume/text";

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

// A core section's name on the page: the person's own, or the standard one
export function sectionTitle(resume: Resume, key: CoreSection) {
  return resume.titles[key]?.trim() || CORE_TITLES[key];
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
      return filled[key as CoreSection] ? [{ key, title: sectionTitle(resume, key as CoreSection) }] : [];
    }
    const extra = resume.extras.find((e) => e.id === key);
    return extra && extra.items.some(hasExtraItem) ? [{ key, title: extra.title, extra }] : [];
  });
}

// Nothing written yet: no name, no summary and no jobs. The look (template, colours) doesn't count.
export function isBlankResume(resume: Resume) {
  return !resume.basics.name && !resume.summary && !resume.experience.some(hasExperience);
}

// Two sections swap places in the saved order, which also holds the ones not on the page yet
export function swapSections(resume: Resume, a: string, b: string): Resume {
  const order = [...resume.order];
  const i = order.indexOf(a);
  const j = order.indexOf(b);
  if (i < 0 || j < 0) return resume;
  [order[i], order[j]] = [order[j], order[i]];
  return { ...resume, order };
}

// Gives a section a new heading. Clearing it puts the standard name back.
export function renameSection(resume: Resume, key: string, title: string): Resume {
  if (key in CORE_TITLES) {
    const titles = { ...resume.titles, [key]: title };
    if (!title || title === CORE_TITLES[key as CoreSection]) delete titles[key as CoreSection];
    return { ...resume, titles };
  }
  return {
    ...resume,
    extras: resume.extras.map((extra) =>
      extra.id === key ? { ...extra, title: title || EXTRA_KINDS[extra.kind].title } : extra,
    ),
  };
}
