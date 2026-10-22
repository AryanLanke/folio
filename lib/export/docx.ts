import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  type ParagraphChild,
  TabStopType,
  TextRun,
} from "docx";
import { contactItems, resumeLinks } from "@/lib/links";
import {
  EXTRA_KINDS,
  type ExtraSection,
  type PaperSize,
  type Resume,
  hasEducation,
  hasExperience,
  hasExtraItem,
  hasProject,
  toLines,
  skillGroups,
  visibleSections,
} from "@/lib/resume";
import { parseRich, plainText } from "@/lib/rich";
import { type TemplateSpec, layoutFor } from "@/lib/templates";

// A Word version of the resume, for job portals that ask for .docx. It follows the same
// template description as the preview and PDF, using fonts every computer has.

const PAGE: Record<PaperSize, { width: number; height: number }> = {
  letter: { width: 12240, height: 15840 },
  a4: { width: 11906, height: 16838 },
};
const MARGIN = 720; // half an inch, in twips
const MUTED = "525252";

const hex = (color: string) => color.replace("#", "");

type Ctx = { spec: TemplateSpec; half: number; gap: number; font: string; tabAt: number };

type RunStyle = { bold?: boolean; italic?: boolean; color?: string; size?: number; font?: string; allCaps?: boolean };

// Text with the bold, italic and underline made on the page, as Word runs
function runs(text: string, ctx: Ctx, style: RunStyle = {}): TextRun[] {
  return parseRich(text).map(
    (span) =>
      new TextRun({
        text: span.text,
        font: style.font ?? ctx.font,
        allCaps: style.allCaps,
        size: style.size ?? ctx.half,
        color: style.color,
        bold: style.bold || span.bold,
        italics: style.italic || span.italic,
        underline: span.underline ? {} : undefined,
      }),
  );
}

const tab = (ctx: Ctx) => new TextRun({ text: "\t", font: ctx.font, size: ctx.half });

// The face for the name and headings, which some templates set in serif over a sans body
const displayFont = (ctx: Ctx) => (ctx.spec.displaySerif ? "Georgia" : ctx.font);

function heading(title: string, ctx: Ctx) {
  const { heading: h } = ctx.spec;
  const caps = h.uppercase || h.smallCaps;
  return new Paragraph({
    keepNext: true,
    spacing: { before: Math.round(ctx.gap * 300), after: Math.round(ctx.gap * 90) },
    border: h.rule ? { bottom: { style: BorderStyle.SINGLE, size: Math.max(4, h.rule * 6), color: hex(h.ruleColor), space: 1 } } : undefined,
    children: [
      new TextRun({
        text: caps && !h.smallCaps ? plainText(title).toUpperCase() : plainText(title),
        smallCaps: h.smallCaps,
        bold: true,
        color: hex(h.color),
        size: Math.round(ctx.half * h.scale),
        font: displayFont(ctx),
      }),
    ],
  });
}

// Title on the left, dates aligned to the right edge with a tab
function entryLine(bold: string, rest: string[], dates: string, ctx: Ctx, first: boolean) {
  const tail = rest.filter(Boolean).join(" — ");
  const children: ParagraphChild[] = runs(bold, ctx, { bold: true });
  if (bold && tail) children.push(new TextRun({ text: ", ", font: ctx.font, size: ctx.half }));
  if (tail) children.push(...runs(tail, ctx));
  if (dates) children.push(tab(ctx), ...runs(dates, ctx, { color: MUTED }));
  return new Paragraph({
    keepNext: true,
    tabStops: [{ type: TabStopType.RIGHT, position: ctx.tabAt }],
    spacing: { before: first ? 0 : Math.round(ctx.gap * 160) },
    children,
  });
}

function bullets(text: string, ctx: Ctx) {
  return toLines(text).map(
    (line) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 20 },
        children: runs(line, ctx),
      }),
  );
}

function plain(text: string, ctx: Ctx) {
  return new Paragraph({ children: runs(text, ctx) });
}

function link(text: string, ctx: Ctx, href: string) {
  return new ExternalHyperlink({
    link: href,
    // Clickable, but styled like the surrounding text so it prints cleanly
    children: [new TextRun({ text: plainText(text), font: ctx.font, size: ctx.half, color: MUTED })],
  });
}

function extra(section: ExtraSection, ctx: Ctx): Paragraph[] {
  const items = section.items.filter(hasExtraItem);
  if (section.kind === "languages") {
    return [plain(items.map((i) => (i.subtitle ? `${i.title} (${i.subtitle})` : i.title)).join(", "), ctx)];
  }
  const fields = EXTRA_KINDS[section.kind];
  return items.flatMap((item, i) => [
    entryLine(item.title, [item.subtitle], fields.date ? item.date : "", ctx, i === 0),
    ...(fields.bullets ? bullets(item.bullets, ctx) : []),
  ]);
}

function core(resume: Resume, key: string, ctx: Ctx): Paragraph[] {
  const dates = (start: string, end: string) => [start, end].filter(Boolean).join(" – ");
  switch (key) {
    case "summary":
      return [plain(resume.summary, ctx)];
    case "experience":
      return resume.experience.filter(hasExperience).flatMap((job, i) => [
        entryLine(job.role, [job.company, job.location], dates(job.start, job.end), ctx, i === 0),
        ...bullets(job.bullets, ctx),
      ]);
    case "projects":
      return resume.projects.filter(hasProject).flatMap((project, i) => [
        // Name and links, with the date at the right edge; what it's built with below
        new Paragraph({
          keepNext: true,
          tabStops: [{ type: TabStopType.RIGHT, position: ctx.tabAt }],
          spacing: { before: i === 0 ? 0 : Math.round(ctx.gap * 160) },
          children: [
            ...runs(project.name, ctx, { bold: true }),
            ...(project.link ? [new TextRun({ text: " — ", font: ctx.font, size: ctx.half })] : []),
            ...resumeLinks(project.link, resume.style.links).flatMap((item, j) => [
              ...(j > 0 ? [new TextRun({ text: ", ", font: ctx.font, size: ctx.half })] : []),
              link(item.text, ctx, item.href),
            ]),
            ...(project.date ? [tab(ctx), ...runs(project.date, ctx, { color: MUTED })] : []),
          ],
        }),
        ...(project.tech
          ? [new Paragraph({ keepNext: true, children: runs(project.tech, ctx, { color: MUTED }) })]
          : []),
        ...bullets(project.bullets, ctx),
      ]);
    case "education":
      // The degree in bold with the dates, then the school (and place) on the line below
      return resume.education.filter(hasEducation).flatMap((school, i) => {
        const second = [school.degree ? school.school : "", school.location].filter(Boolean).join(" — ");
        return [
          entryLine(school.degree || school.school, [], dates(school.start, school.end), ctx, i === 0),
          ...(second ? [plain(second, ctx)] : []),
          ...(school.details ? [plain(school.details, ctx)] : []),
        ];
      });
    case "skills":
      // One paragraph per group, its label in bold; a plain list is a single paragraph
      return skillGroups(resume.skills).map(
        (group) =>
          new Paragraph({
            children: [
              ...(group.label ? runs(`${group.label}: `, ctx, { bold: true }) : []),
              ...runs(group.items.join(", "), ctx),
            ],
          }),
      );
    default:
      return [];
  }
}

function context(resume: Resume, paper: PaperSize): Ctx {
  const { spec, fontSize, gap } = layoutFor(resume.style);
  return {
    spec,
    // Word sizes are in half-points; 1px = 0.75pt
    half: Math.round(fontSize * 1.5),
    gap,
    font: spec.serif ? "Georgia" : "Arial",
    tabAt: PAGE[paper].width - MARGIN * 2,
  };
}

function header(resume: Resume, ctx: Ctx, nameScale = ctx.spec.name.scale): Paragraph[] {
  const { basics } = resume;
  const { spec } = ctx;
  const align = spec.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;
  const contact: ParagraphChild[] = [];
  const add = (child: ParagraphChild) => {
    if (contact.length > 0) contact.push(new TextRun({ text: "  |  ", color: MUTED, font: ctx.font, size: ctx.half }));
    contact.push(child);
  };
  for (const item of contactItems(basics, resume.style.links)) {
    add(item.href ? link(item.text, ctx, item.href) : new TextRun({ text: plainText(item.text), color: MUTED, font: ctx.font, size: ctx.half }));
  }

  const rule = spec.headerRule;
  return [
    new Paragraph({
      alignment: align,
      children: runs(basics.name || "Your Name", ctx, {
        bold: spec.name.bold,
        size: Math.round(ctx.half * nameScale),
        font: displayFont(ctx),
        allCaps: spec.name.uppercase,
      }),
    }),
    ...(basics.title
      ? [
          new Paragraph({
            alignment: align,
            children: runs(basics.title, ctx, {
              color: hex(spec.title.color),
              bold: spec.title.bold,
              italic: spec.title.italic,
              size: Math.round(ctx.half * 1.12),
            }),
          }),
        ]
      : []),
    new Paragraph({
      alignment: align,
      spacing: { before: 60 },
      border: rule ? { bottom: { style: BorderStyle.SINGLE, size: rule.width * 6, color: hex(rule.color), space: 6 } } : undefined,
      children: contact,
    }),
  ];
}

function pageProperties(paper: PaperSize) {
  return {
    page: {
      size: PAGE[paper],
      margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
    },
  };
}

export function resumeDocx(resume: Resume, paper: PaperSize) {
  const ctx = context(resume, paper);
  const body = visibleSections(resume).flatMap((section) => [
    heading(section.title, ctx),
    ...(section.extra ? extra(section.extra, ctx) : core(resume, section.key, ctx)),
  ]);
  return new Document({
    creator: "Folio",
    title: `${plainText(resume.basics.name) || "Resume"} - Resume`,
    sections: [{ properties: pageProperties(paper), children: [...header(resume, ctx), ...body] }],
  });
}

export function coverLetterDocx(resume: Resume, paper: PaperSize) {
  const ctx = context(resume, paper);
  const paragraphs = resume.coverLetter
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p, i) =>
        new Paragraph({
          spacing: { before: i === 0 ? 400 : 200, line: 300 },
          children: p.split("\n").map((line, j) => new TextRun({ text: line, break: j > 0 ? 1 : 0, font: ctx.font, size: ctx.half + 1 })),
        }),
    );
  return new Document({
    creator: "Folio",
    title: `${plainText(resume.basics.name) || "Cover letter"} - Cover letter`,
    sections: [{ properties: pageProperties(paper), children: [...header(resume, ctx, 1.9), ...paragraphs] }],
  });
}

export function toBlob(document: Document) {
  return Packer.toBlob(document);
}
