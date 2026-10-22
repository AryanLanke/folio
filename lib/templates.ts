// How each template looks, described once and used by the on-screen preview, the PDF and the
// Word file, so all three match. Sizes are multiples of the base font size.
// Every template stays single-column plain text, so all of them remain ATS-readable.

import type { ResumeStyle, TemplateName } from "@/lib/resume";

export type TemplateSpec = {
  serif: boolean;
  align: "center" | "left";
  name: { scale: number; bold: boolean; letterSpacing: number };
  title: { color: string; bold: boolean; italic: boolean };
  heading: {
    scale: number;
    uppercase: boolean;
    smallCaps: boolean;
    letterSpacing: number;
    color: string;
    rule: number;
    ruleColor: string;
  };
  // A line under the whole header (name, title and contact)
  headerRule: { width: number; color: string } | null;
  // Extra tightening on top of the user's spacing choice
  density: number;
};

const INK = "#171717";
const GREEN = "#1d6b45";
const NAVY = "#1e3a5f";

export const TEMPLATE_SPECS: Record<TemplateName, TemplateSpec> = {
  classic: {
    serif: false,
    align: "center",
    name: { scale: 2.08, bold: true, letterSpacing: 0 },
    title: { color: "#404040", bold: false, italic: false },
    heading: { scale: 0.88, uppercase: true, smallCaps: false, letterSpacing: 0.04, color: INK, rule: 1, ruleColor: "#d4d4d4" },
    headerRule: null,
    density: 1,
  },
  modern: {
    serif: false,
    align: "left",
    name: { scale: 2.3, bold: true, letterSpacing: -0.01 },
    title: { color: GREEN, bold: true, italic: false },
    heading: { scale: 0.9, uppercase: true, smallCaps: false, letterSpacing: 0.04, color: GREEN, rule: 2, ruleColor: GREEN },
    headerRule: null,
    density: 1,
  },
  executive: {
    serif: false,
    align: "left",
    name: { scale: 2.4, bold: true, letterSpacing: 0 },
    title: { color: NAVY, bold: false, italic: false },
    heading: { scale: 1, uppercase: false, smallCaps: false, letterSpacing: 0.02, color: NAVY, rule: 0, ruleColor: NAVY },
    headerRule: { width: 3, color: NAVY },
    density: 1,
  },
  compact: {
    serif: false,
    align: "left",
    name: { scale: 1.75, bold: true, letterSpacing: 0 },
    title: { color: "#404040", bold: false, italic: false },
    heading: { scale: 0.82, uppercase: true, smallCaps: false, letterSpacing: 0.04, color: INK, rule: 0.75, ruleColor: "#a3a3a3" },
    headerRule: null,
    density: 0.8,
  },
  serif: {
    serif: true,
    align: "center",
    name: { scale: 2.1, bold: false, letterSpacing: 0.03 },
    title: { color: "#404040", bold: false, italic: true },
    heading: { scale: 1.05, uppercase: false, smallCaps: true, letterSpacing: 0.03, color: INK, rule: 1, ruleColor: "#a3a3a3" },
    headerRule: null,
    density: 1,
  },
};

// Base font size in CSS pixels; the PDF uses points (1px = 0.75pt)
export const FONT_SIZE: Record<ResumeStyle["fontSize"], number> = { small: 11.5, medium: 12.5, large: 13.5 };

export const SPACING: Record<ResumeStyle["spacing"], { gap: number; lineHeight: number }> = {
  compact: { gap: 0.7, lineHeight: 1.35 },
  normal: { gap: 1, lineHeight: 1.45 },
  relaxed: { gap: 1.3, lineHeight: 1.55 },
};

// The person's own colour takes the place of the template's: wherever the template uses its
// heading colour (headings, and in some templates their lines and the title under the name)
export function withAccent(spec: TemplateSpec, accent: string | null): TemplateSpec {
  if (!accent) return spec;
  const recolor = (color: string) => (color === spec.heading.color ? accent : color);
  return {
    ...spec,
    title: { ...spec.title, color: recolor(spec.title.color) },
    heading: { ...spec.heading, color: accent, ruleColor: recolor(spec.heading.ruleColor) },
    headerRule: spec.headerRule && { ...spec.headerRule, color: recolor(spec.headerRule.color) },
  };
}

export function layoutFor(style: ResumeStyle) {
  const spec = withAccent(TEMPLATE_SPECS[style.template], style.accent);
  const { gap, lineHeight } = SPACING[style.spacing];
  return { spec, fontSize: FONT_SIZE[style.fontSize], gap: gap * spec.density, lineHeight };
}

// Colours offered for headings: dark enough to read and to print well. null is the template's own.
export const ACCENT_COLORS: { value: string | null; label: string }[] = [
  { value: null, label: "Template colour" },
  { value: "#171717", label: "Black" },
  { value: "#1e3a5f", label: "Navy" },
  { value: "#1f4e8c", label: "Blue" },
  { value: "#0f766e", label: "Teal" },
  { value: "#1d6b45", label: "Green" },
  { value: "#8b1e3f", label: "Burgundy" },
  { value: "#5b2a86", label: "Plum" },
  { value: "#475569", label: "Slate" },
];

// Light colours fade on white paper and when printed in grayscale. True below about 4.5:1
// contrast with white, the usual line for readable text.
export function tooLight(color: string) {
  const channel = (i: number) => {
    const c = parseInt(color.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  return 1.05 / (luminance + 0.05) < 4.5;
}

export const HTML_FONT = {
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};
