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

export function layoutFor(style: ResumeStyle) {
  const spec = TEMPLATE_SPECS[style.template];
  const { gap, lineHeight } = SPACING[style.spacing];
  return { spec, fontSize: FONT_SIZE[style.fontSize], gap: gap * spec.density, lineHeight };
}

export const HTML_FONT = {
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};
