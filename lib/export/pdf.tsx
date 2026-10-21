import { Document, Link, Page, Text, View, pdf } from "@react-pdf/renderer";
import { pdfSafe, webHref } from "@/lib/export/text";
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

// A real text PDF, drawn from the same template description as the on-screen preview.
// Standard PDF fonts keep the text selectable and readable by ATS software.

const PX = 0.75; // CSS pixels to PDF points
const MARGIN = 36; // half an inch, matching the preview
const PAGE_SIZE: Record<PaperSize, "LETTER" | "A4"> = { letter: "LETTER", a4: "A4" };
const MUTED = "#525252";
// Links stay clickable but look like the text around them, which prints better
const LINK = { color: MUTED, textDecoration: "none" } as const;

type Layout = ReturnType<typeof layoutFor> & { size: number; family: string };

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
        {caps ? pdfSafe(title).toUpperCase() : pdfSafe(title)}
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
          <Text style={{ flex: 1 }}>{pdfSafe(line)}</Text>
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
        <Text style={{ fontWeight: "bold", color: "#0a0a0a" }}>{pdfSafe(bold)}</Text>
        {bold && tail.length > 0 ? ", " : ""}
        {pdfSafe(tail.join(" — "))}
      </Text>
      {dates && <Text style={{ color: MUTED }}>{pdfSafe(dates)}</Text>}
    </View>
  );
}

function Extra({ section }: { section: ExtraSection }) {
  const items = section.items.filter(hasExtraItem);
  if (section.kind === "languages") {
    return <Text>{pdfSafe(items.map((i) => (i.subtitle ? `${i.title} (${i.subtitle})` : i.title)).join(", "))}</Text>;
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
      return <Text>{pdfSafe(resume.summary)}</Text>;
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
          <Text>
            <Text style={{ fontWeight: "bold", color: "#0a0a0a" }}>{pdfSafe(project.name)}</Text>
            {project.link ? " — " : ""}
            {project.link ? (
              <Link src={webHref(project.link)} style={LINK}>
                {pdfSafe(project.link)}
              </Link>
            ) : null}
          </Text>
          <Bullets text={project.bullets} />
        </View>
      ));
    case "education":
      return resume.education.filter(hasEducation).map((school) => (
        <View key={school.id} wrap={false}>
          <EntryLine bold={school.degree} rest={[school.school, school.location]} start={school.start} end={school.end} />
          {school.details ? <Text style={{ marginTop: 1 }}>{pdfSafe(school.details)}</Text> : null}
        </View>
      ));
    case "skills":
      return <Text>{pdfSafe(toList(resume.skills).join(", "))}</Text>;
    default:
      return null;
  }
}

function Header({ resume, l }: { resume: Resume; l: Layout }) {
  const { basics } = resume;
  const { spec, size } = l;
  const contact = [
    basics.email && { text: basics.email, href: `mailto:${basics.email}` },
    basics.phone && { text: basics.phone },
    basics.location && { text: basics.location },
    basics.link && { text: basics.link, href: webHref(basics.link) },
  ].filter((item): item is { text: string; href?: string } => Boolean(item));

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
        {pdfSafe(basics.name || "Your Name")}
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
          {pdfSafe(basics.title)}
        </Text>
      ) : null}
      {contact.length > 0 && (
        <Text style={{ marginTop: 4, color: MUTED }}>
          {contact.map((item, i) => (
            <Text key={i}>
              {i > 0 ? "   |   " : ""}
              {item.href ? (
                <Link src={item.href} style={LINK}>
                  {pdfSafe(item.text)}
                </Link>
              ) : (
                pdfSafe(item.text)
              )}
            </Text>
          ))}
        </Text>
      )}
    </View>
  );
}

export function ResumeDocument({ resume, paper }: { resume: Resume; paper: PaperSize }) {
  const l = layout(resume);
  const { spec, size, gap, lineHeight, family } = l;
  return (
    <Document title={`${resume.basics.name || "Resume"} - Resume`} author={resume.basics.name} creator="Folio">
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
  const contact = [basics.email, basics.phone, basics.location, basics.link].filter(Boolean).join("   |   ");
  const paragraphs = resume.coverLetter.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const rule = l.spec.headerRule ?? { width: 1, color: "#d4d4d4" };
  return (
    <Document title={`${basics.name || "Cover letter"} - Cover letter`} author={basics.name} creator="Folio">
      <Page
        size={PAGE_SIZE[paper]}
        style={{ padding: MARGIN * 1.25, fontFamily: l.family, fontSize: l.size + 0.5, lineHeight: 1.55, color: "#262626" }}
      >
        <View style={{ textAlign: l.spec.align, borderBottomWidth: rule.width * PX, borderBottomColor: rule.color, paddingBottom: 9 }}>
          <Text style={{ fontSize: l.size * 1.9, fontWeight: l.spec.name.bold ? "bold" : "normal", color: "#0a0a0a", lineHeight: 1.2 }}>
            {pdfSafe(basics.name || "Your Name")}
          </Text>
          {contact ? <Text style={{ marginTop: 3, color: MUTED }}>{pdfSafe(contact)}</Text> : null}
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
