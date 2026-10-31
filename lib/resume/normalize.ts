// Turning saved, imported or hand-edited data into a valid resume.

import {
  CORE_SECTIONS,
  DEFAULT_STYLE,
  EXTRA_KINDS,
  type ExtraKind,
  type ExtraSection,
  type Resume,
  TEMPLATES,
  type TemplateName,
} from "@/lib/resume/types";
import { createEmptyResume, newEducation, newExperience, newExtraItem, newId, newProject } from "@/lib/resume/create";

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

// Only names for real sections, trimmed; an empty name means the standard one
function normalizeTitles(source: unknown): Resume["titles"] {
  const src = (source && typeof source === "object" ? source : {}) as Record<string, unknown>;
  const titles: Resume["titles"] = {};
  for (const key of CORE_SECTIONS) {
    const value = src[key];
    if (typeof value === "string" && value.trim()) titles[key] = value.trim().slice(0, 60);
  }
  return titles;
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
    titles: normalizeTitles(src.titles),
    style: {
      template: pickOne(style.template, Object.keys(TEMPLATES) as TemplateName[], DEFAULT_STYLE.template),
      fontSize: pickOne(style.fontSize, ["small", "medium", "large"], DEFAULT_STYLE.fontSize),
      spacing: pickOne(style.spacing, ["compact", "normal", "relaxed"], DEFAULT_STYLE.spacing),
      links: pickOne(style.links, ["label", "url"], DEFAULT_STYLE.links),
      accent: typeof style.accent === "string" && /^#[0-9a-f]{6}$/i.test(style.accent) ? style.accent.toLowerCase() : null,
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
