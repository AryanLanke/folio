import { Document, Link, Page, Text, View, pdf } from "@react-pdf/renderer";
import { pdfSafe } from "@/lib/export/text";
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

// A real text PDF, drawn from the same template description as the on-screen preview.
// Standard PDF fonts keep the text selectable and readable by ATS software.

const PX = 0.75; // CSS pixels to PDF points
const MARGIN = 36; // half an inch, matching the preview
const PAGE_SIZE: Record<PaperSize, "LETTER" | "A4"> = { letter: "LETTER", a4: "A4" };
const MUTED = "#525252";
// Links stay clickable but look like the text around them, which prints better
const LINK = { color: MUTED, textDecoration: "none" } as const;

type Layout = ReturnType<typeof layoutFor> & { size: number; family: string };

// Text with the bold, italic and underline made on the page
function Rich({ text }: { text: string }) {
  return parseRich(text).map((span, i) => (
    <Text
      key={i}
      style={{
        fontWeight: span.bold ? "bold" : undefined,
        fontStyle: span.italic ? "italic" : undefined,
        textDecoration: span.underline ? "underline" : undefined,
      }}
    >
      {pdfSafe(span.text)}
    </Text>
  ));
}

function layout(resume: Resume): Layout {
  const base = layoutFor(resume.style);
  return { ...base, size: base.fontSize * PX, family: base.spec.serif ? "Times-Roman" : "Helvetica" };
}

function Heading({ title, spec, size }: { title: string; spec: TemplateSpec; size: number }) {
  const { heading } = spec;
  // PDF fonts have no small caps, so those headings become slightly smaller capitals
  const caps = heading.uppercase || heading.smallCaps;
  const scale = heading.smallCaps ? heading.scale * 0.85 : heading.scale;
  return (
    <View
      minPresenceAhead={40}
      style={{
        borderBottomWidth: heading.rule * PX,
        borderBottomColor: heading.ruleColor,
        paddingBottom: heading.rule ? 2 : 0,
      }}
    >
      <Text
        style={{
          fontSize: size * scale,
          fontWeight: "bold",
          color: heading.color,
          letterSpacing: size * scale * heading.letterSpacing,
        }}
      >
        {caps ? pdfSafe(plainText(title)).toUpperCase() : pdfSafe(plainText(title))}
      </Text>
    </View>
  );
}

function Bullets({ text }: { text: string }) {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  return (
    <View style={{ marginTop: 2 }}>
      {lines.map((line, i) => (
        <View key={i} style={{ flexDirection: "row", marginTop: i === 0 ? 0 : 1.5 }}>
          <Text style={{ width: 10 }}>•</Text>
          <Text style={{ flex: 1 }}>
            <Rich text={line} />
          </Text>
        </View>
      ))}
    </View>
  );
}

function EntryLine({ bold, rest, start, end }: { bold: string; rest: string[]; start: string; end: string }) {
  const tail = rest.filter(Boolean);
  const dates = [start, end].filter(Boolean).join(" – ");
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontWeight: "bold", color: "#0a0a0a" }}>
          <Rich text={bold} />
        </Text>
        {bold && tail.length > 0 ? ", " : ""}
        <Rich text={tail.join(" — ")} />
      </Text>
      {dates && (
        <Text style={{ color: MUTED }}>
          <Rich text={dates} />
        </Text>
      )}
    </View>
  );
}

function Extra({ section }: { section: ExtraSection }) {
  const items = section.items.filter(hasExtraItem);
  if (section.kind === "languages") {
    return (
      <Text>
        <Rich text={items.map((i) => (i.subtitle ? `${i.title} (${i.subtitle})` : i.title)).join(", ")} />
      </Text>
    );
  }
  const fields = EXTRA_KINDS[section.kind];
  return items.map((item) => (
    <View key={item.id}>
      <EntryLine bold={item.title} rest={[item.subtitle]} start={fields.date ? item.date : ""} end="" />
      {fields.bullets && <Bullets text={item.bullets} />}
    </View>
  ));
}

function Core({ resume, sectionKey }: { resume: Resume; sectionKey: string }) {
  switch (sectionKey) {
    case "summary":
      return (
        <Text>
          <Rich text={resume.summary} />
        </Text>
      );
    case "experience":
      return resume.experience.filter(hasExperience).map((job) => (
        <View key={job.id}>
          <View wrap={false}>
            <EntryLine bold={job.role} rest={[job.company, job.location]} start={job.start} end={job.end} />
          </View>
          <Bullets text={job.bullets} />
        </View>
      ));
    case "projects":
      return resume.projects.filter(hasProject).map((project) => (
        <View key={project.id}>
          {/* Name and links, with the date on the right; what it's built with below */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: "bold", color: "#0a0a0a" }}>
                <Rich text={project.name} />
              </Text>
              {project.link ? " — " : ""}
              {resumeLinks(project.link, resume.style.links).map((link, i) => (
                <Text key={i}>
                  {i > 0 ? ", " : ""}
                  <Link src={link.href} style={LINK}>
                    {pdfSafe(link.text)}
                  </Link>
                </Text>
              ))}
            </Text>
            {project.date ? (
              <Text style={{ color: MUTED }}>
                <Rich text={project.date} />
              </Text>
            ) : null}
          </View>
          {project.tech ? (
            <Text style={{ color: MUTED }}>
              <Rich text={project.tech} />
            </Text>
          ) : null}
          <Bullets text={project.bullets} />
        </View>
      ));
    case "education":
      // The degree in bold with the dates, then the school (and place) on the line below
      return resume.education.filter(hasEducation).map((school) => {
        const second = [school.degree ? school.school : "", school.location].filter(Boolean).join(" — ");
        return (
          <View key={school.id} wrap={false}>
            <EntryLine bold={school.degree || school.school} rest={[]} start={school.start} end={school.end} />
            {second ? (
              <Text>
                <Rich text={second} />
              </Text>
            ) : null}
            {school.details ? (
              <Text style={{ marginTop: 1 }}>
                <Rich text={school.details} />
              </Text>
            ) : null}
          </View>
        );
      });
    case "skills":
      // One line per group, its label in bold; a plain list is a single line
      return skillGroups(resume.skills).map((group, i) => (
        <Text key={i}>
          {group.label ? (
            <Text style={{ fontWeight: "bold", color: "#0a0a0a" }}>
              <Rich text={`${group.label}: `} />
            </Text>
          ) : null}
          <Rich text={group.items.join(", ")} />
        </Text>
      ));
    default:
      return null;
  }
}

// Email, phone, city and links on one line; links stay clickable in the PDF
function ContactLine({ resume, style }: { resume: Resume; style: { marginTop: number } }) {
  const items = contactItems(resume.basics, resume.style.links);
  if (items.length === 0) return null;
  return (
    <Text style={{ ...style, color: MUTED }}>
      {items.map((item, i) => (
        <Text key={i}>
          {i > 0 ? "   |   " : ""}
          {item.href ? (
            <Link src={item.href} style={LINK}>
              {pdfSafe(plainText(item.text))}
            </Link>
          ) : (
            <Rich text={item.text} />
          )}
        </Text>
      ))}
    </Text>
  );
}

function Header({ resume, l }: { resume: Resume; l: Layout }) {
  const { basics } = resume;
  const { spec, size } = l;

  return (
    <View
      style={{
        textAlign: spec.align,
        borderBottomWidth: spec.headerRule ? spec.headerRule.width * PX : 0,
        borderBottomColor: spec.headerRule?.color ?? "#000",
        paddingBottom: spec.headerRule ? 8 : 0,
      }}
    >
      <Text
        style={{
          fontSize: size * spec.name.scale,
          fontWeight: spec.name.bold ? "bold" : "normal",
          letterSpacing: size * spec.name.scale * spec.name.letterSpacing,
          color: "#0a0a0a",
          lineHeight: 1.2,
        }}
      >
        <Rich text={basics.name || "Your Name"} />
      </Text>
      {basics.title ? (
        <Text
          style={{
            marginTop: 2,
            fontSize: size * 1.12,
            color: spec.title.color,
            fontWeight: spec.title.bold ? "bold" : "normal",
            fontStyle: spec.title.italic ? "italic" : "normal",
          }}
        >
          <Rich text={basics.title} />
        </Text>
      ) : null}
      <ContactLine resume={resume} style={{ marginTop: 4 }} />
    </View>
  );
}

export function ResumeDocument({ resume, paper }: { resume: Resume; paper: PaperSize }) {
  const l = layout(resume);
  const { spec, size, gap, lineHeight, family } = l;
  return (
    <Document title={`${plainText(resume.basics.name) || "Resume"} - Resume`} author={plainText(resume.basics.name)} creator="Folio">
      <Page
        size={PAGE_SIZE[paper]}
        style={{ padding: MARGIN, fontFamily: family, fontSize: size, lineHeight, color: "#262626" }}
      >
        <Header resume={resume} l={l} />
        {visibleSections(resume).map((section) => (
          <View key={section.key} style={{ marginTop: 20 * gap * PX }}>
            <Heading title={section.title} spec={spec} size={size} />
            <View style={{ marginTop: 6 * gap * PX, gap: 12 * gap * PX }}>
              {section.extra ? <Extra section={section.extra} /> : <Core resume={resume} sectionKey={section.key} />}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export function CoverLetterDocument({ resume, paper }: { resume: Resume; paper: PaperSize }) {
  const l = layout(resume);
  const { basics } = resume;
  const paragraphs = resume.coverLetter.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const rule = l.spec.headerRule ?? { width: 1, color: "#d4d4d4" };
  return (
    <Document title={`${plainText(basics.name) || "Cover letter"} - Cover letter`} author={plainText(basics.name)} creator="Folio">
      <Page
        size={PAGE_SIZE[paper]}
        style={{ padding: MARGIN * 1.25, fontFamily: l.family, fontSize: l.size + 0.5, lineHeight: 1.55, color: "#262626" }}
      >
        <View style={{ textAlign: l.spec.align, borderBottomWidth: rule.width * PX, borderBottomColor: rule.color, paddingBottom: 9 }}>
          <Text style={{ fontSize: l.size * 1.9, fontWeight: l.spec.name.bold ? "bold" : "normal", color: "#0a0a0a", lineHeight: 1.2 }}>
            {pdfSafe(plainText(basics.name) || "Your Name")}
          </Text>
          <ContactLine resume={resume} style={{ marginTop: 3 }} />
        </View>
        <View style={{ marginTop: 24, gap: 10 }}>
          {paragraphs.map((paragraph, i) => (
            <Text key={i}>{pdfSafe(paragraph)}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export function resumePdfBlob(resume: Resume, paper: PaperSize) {
  return pdf(<ResumeDocument resume={resume} paper={paper} />).toBlob();
}

export function coverLetterPdfBlob(resume: Resume, paper: PaperSize) {
  return pdf(<CoverLetterDocument resume={resume} paper={paper} />).toBlob();
}
