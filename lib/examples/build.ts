import {
  CORE_SECTIONS,
  DEFAULT_STYLE,
  type Education,
  type Experience,
  type ExtraKind,
  type ExtraSection,
  type Project,
  type Resume,
  type TemplateName,
  emptyTarget,
} from "@/lib/resume";

// The shape of an example resume, and build(), which turns its content into a full resume

export type ResumeExample = {
  slug: string;
  // As it reads in a sentence: "Nurse resume example"
  role: string;
  // One line for the examples list and search results
  blurb: string;
  tips: string[];
  keywords: string[];
  resume: () => Resume;
};

export type Draft = {
  template: TemplateName;
  basics: Resume["basics"];
  summary: string;
  experience: Omit<Experience, "id">[];
  education: Omit<Education, "id">[];
  projects?: Omit<Project, "id">[];
  skills: string;
  extras?: { kind: ExtraKind; title: string; items: { title: string; subtitle: string; date: string }[] }[];
};

// Fills in ids, section order and the look, so each example only lists its content
export function build(draft: Draft): Resume {
  const extras: ExtraSection[] = (draft.extras ?? []).map((extra, i) => ({
    id: `extra${i}`,
    kind: extra.kind,
    title: extra.title,
    items: extra.items.map((item, j) => ({ id: `extra${i}-${j}`, bullets: "", ...item })),
  }));
  return {
    basics: draft.basics,
    summary: draft.summary,
    experience: draft.experience.map((job, i) => ({ id: `job${i}`, ...job })),
    education: draft.education.map((school, i) => ({ id: `school${i}`, ...school })),
    projects: (draft.projects ?? []).map((project, i) => ({ id: `project${i}`, ...project })),
    skills: draft.skills,
    extras,
    order: [...CORE_SECTIONS, ...extras.map((extra) => extra.id)],
    titles: {},
    style: { ...DEFAULT_STYLE, template: draft.template },
    target: emptyTarget(),
    coverLetter: "",
  };
}
