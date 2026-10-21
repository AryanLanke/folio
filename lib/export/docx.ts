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
import { webHref } from "@/lib/export/text";
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
  toList,
  visibleSections,
} from "@/lib/resume";
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

function heading(title: string, ctx: Ctx) {
  const { heading: h } = ctx.spec;
  const caps = h.uppercase || h.smallCaps;
  return new Paragraph({
    keepNext: true,
    spacing: { before: Math.round(ctx.gap * 300), after: Math.round(ctx.gap * 90) },
    border: h.rule ? { bottom: { style: BorderStyle.SINGLE, size: Math.max(4, h.rule * 6), color: hex(h.ruleColor), space: 1 } } : undefined,
    children: [
      new TextRun({
        text: caps && !h.smallCaps ? title.toUpperCase() : title,
        smallCaps: h.smallCaps,
        bold: true,
        color: hex(h.color),
        size: Math.round(ctx.half * h.scale),
        font: ctx.font,
      }),
    ],
  });
}

// Title on the left, dates aligned to the right edge with a tab
function entryLine(bold: string, rest: string[], dates: string, ctx: Ctx, first: boolean) {
  const tail = rest.filter(Boolean).join(" — ");
  const children: ParagraphChild[] = [new TextRun({ text: bold, bold: true, font: ctx.font, size: ctx.half })];
  if (bold && tail) children.push(new TextRun({ text: ", ", font: ctx.font, size: ctx.half }));
  if (tail) children.push(new TextRun({ text: tail, font: ctx.font, size: ctx.half }));
  if (dates) children.push(new TextRun({ text: `\t${dates}`, color: MUTED, font: ctx.font, size: ctx.half }));
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
        children: [new TextRun({ text: line, font: ctx.font, size: ctx.half })],
      }),
  );
}

function plain(text: string, ctx: Ctx) {
  return new Paragraph({ children: [new TextRun({ text, font: ctx.font, size: ctx.half })] });
}

function link(text: string, ctx: Ctx, href = webHref(text)) {
  return new ExternalHyperlink({
    link: href,
    // Clickable, but styled like the surrounding text so it prints cleanly
    children: [new TextRun({ text, font: ctx.font, size: ctx.half, color: MUTED })],
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
        new Paragraph({
          keepNext: true,
          spacing: { before: i === 0 ? 0 : Math.round(ctx.gap * 160) },
          children: [
            new TextRun({ text: project.name, bold: true, font: ctx.font, size: ctx.half }),
            ...(project.link ? [new TextRun({ text: " — ", font: ctx.font, size: ctx.half }), link(project.link, ctx)] : []),
          ],
        }),
        ...bullets(project.bullets, ctx),
      ]);
    case "education":
      return resume.education.filter(hasEducation).flatMap((school, i) => [
        entryLine(school.degree, [school.school, school.location], dates(school.start, school.end), ctx, i === 0),
        ...(school.details ? [plain(school.details, ctx)] : []),
      ]);
    case "skills":
      return [plain(toList(resume.skills).join(", "), ctx)];
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
  if (basics.email) add(link(basics.email, ctx, `mailto:${basics.email}`));
  if (basics.phone) add(new TextRun({ text: basics.phone, color: MUTED, font: ctx.font, size: ctx.half }));
  if (basics.location) add(new TextRun({ text: basics.location, color: MUTED, font: ctx.font, size: ctx.half }));
  if (basics.link) add(link(basics.link, ctx));

  const rule = spec.headerRule;
  return [
    new Paragraph({
      alignment: align,
      children: [
        new TextRun({
          text: basics.name || "Your Name",
          bold: spec.name.bold,
          size: Math.round(ctx.half * nameScale),
          font: ctx.font,
        }),
      ],
    }),
    ...(basics.title
      ? [
          new Paragraph({
            alignment: align,
            children: [
              new TextRun({
                text: basics.title,
                color: hex(spec.title.color),
                bold: spec.title.bold,
                italics: spec.title.italic,
                size: Math.round(ctx.half * 1.12),
                font: ctx.font,
              }),
            ],
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
    title: `${resume.basics.name || "Resume"} - Resume`,
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
    title: `${resume.basics.name || "Cover letter"} - Cover letter`,
    sections: [{ properties: pageProperties(paper), children: [...header(resume, ctx, 1.9), ...paragraphs] }],
  });
}

export function toBlob(document: Document) {
  return Packer.toBlob(document);
}
