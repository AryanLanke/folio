import {
  EXTRA_KINDS,
  type ExtraSection,
  PAGE_MARGIN,
  PAPER,
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
import { HTML_FONT, type TemplateSpec, layoutFor } from "@/lib/templates";

// The resume as a web page. Its look comes from lib/templates.ts, shared with the PDF and Word
// exports. Every template is single-column plain text with standard headings (ATS-readable).

function Section({
  title,
  gap,
  spec,
  children,
}: {
  title: string;
  gap: number;
  spec: TemplateSpec;
  children: React.ReactNode;
}) {
  const { heading } = spec;
  return (
    <section style={{ marginTop: 20 * gap }}>
      <h2
        className="break-after-avoid font-bold"
        style={{
          fontSize: `${heading.scale}em`,
          letterSpacing: `${heading.letterSpacing}em`,
          textTransform: heading.uppercase ? "uppercase" : "none",
          fontVariant: heading.smallCaps ? "small-caps" : "normal",
          color: heading.color,
          borderBottom: heading.rule ? `${heading.rule}px solid ${heading.ruleColor}` : "none",
          paddingBottom: heading.rule ? 3 : 0,
        }}
      >
        {title}
      </h2>
      <div className="flex flex-col" style={{ marginTop: 8 * gap, gap: 12 * gap }}>
        {children}
      </div>
    </section>
  );
}

function Dates({ start, end }: { start: string; end: string }) {
  if (!start && !end) return null;
  return (
    <span className="shrink-0 text-neutral-600">
      {start}
      {start && end ? " – " : ""}
      {end}
    </span>
  );
}

function Bullets({ text }: { text: string }) {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-4">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}

// Links stay clickable in the downloaded PDF
function WebLink({ text }: { text: string }) {
  const href = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  return <a href={href}>{text}</a>;
}

function Contact({ basics }: { basics: Resume["basics"] }) {
  const items = [
    basics.email && <a key="email" href={`mailto:${basics.email}`}>{basics.email}</a>,
    basics.phone && <span key="phone">{basics.phone}</span>,
    basics.location && <span key="location">{basics.location}</span>,
    basics.link && <WebLink key="link" text={basics.link} />,
  ].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <p className="mt-1.5 text-neutral-600">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="px-2 text-neutral-400">|</span>}
          {item}
        </span>
      ))}
    </p>
  );
}

// Title on the left, dates on the right: the standard resume entry line
function EntryLine({ bold, rest, start, end }: { bold: string; rest: string[]; start: string; end: string }) {
  const tail = rest.filter(Boolean);
  return (
    <div className="flex items-baseline justify-between gap-4">
      <p>
        <span className="font-bold text-neutral-950">{bold}</span>
        {bold && tail.length > 0 ? ", " : ""}
        {tail.join(" — ")}
      </p>
      <Dates start={start} end={end} />
    </div>
  );
}

function ExtraContent({ section }: { section: ExtraSection }) {
  const items = section.items.filter(hasExtraItem);
  if (section.kind === "languages") {
    const text = items.map((item) => (item.subtitle ? `${item.title} (${item.subtitle})` : item.title));
    return <p>{text.join(", ")}</p>;
  }
  const fields = EXTRA_KINDS[section.kind];
  return items.map((item) => (
    <div key={item.id} className="break-inside-avoid">
      <EntryLine bold={item.title} rest={[item.subtitle]} start={fields.date ? item.date : ""} end="" />
      {fields.bullets && <Bullets text={item.bullets} />}
    </div>
  ));
}

function CoreContent({ resume, sectionKey }: { resume: Resume; sectionKey: string }) {
  switch (sectionKey) {
    case "summary":
      return <p>{resume.summary}</p>;
    case "experience":
      return resume.experience.filter(hasExperience).map((item) => (
        <div key={item.id} className="break-inside-avoid">
          <EntryLine bold={item.role} rest={[item.company, item.location]} start={item.start} end={item.end} />
          <Bullets text={item.bullets} />
        </div>
      ));
    case "projects":
      return resume.projects.filter(hasProject).map((item) => (
        <div key={item.id} className="break-inside-avoid">
          <p>
            <span className="font-bold text-neutral-950">{item.name}</span>
            {item.link && (
              <>
                {" — "}
                <WebLink text={item.link} />
              </>
            )}
          </p>
          <Bullets text={item.bullets} />
        </div>
      ));
    case "education":
      return resume.education.filter(hasEducation).map((item) => (
        <div key={item.id} className="break-inside-avoid">
          <EntryLine bold={item.degree} rest={[item.school, item.location]} start={item.start} end={item.end} />
          {item.details && <p className="mt-0.5">{item.details}</p>}
        </div>
      ));
    case "skills":
      return <p>{toList(resume.skills).join(", ")}</p>;
    default:
      return null;
  }
}

export default function ResumePreview({ resume, paper }: { resume: Resume; paper: PaperSize }) {
  const { basics } = resume;
  const size = PAPER[paper];
  const { spec, fontSize, gap, lineHeight } = layoutFor(resume.style);

  return (
    <article
      style={{
        fontFamily: spec.serif ? HTML_FONT.serif : HTML_FONT.sans,
        fontSize,
        lineHeight,
        width: size.width,
        minHeight: size.height,
        padding: PAGE_MARGIN,
      }}
      className="bg-white text-neutral-800"
    >
      <header
        style={{
          textAlign: spec.align,
          borderBottom: spec.headerRule ? `${spec.headerRule.width}px solid ${spec.headerRule.color}` : "none",
          paddingBottom: spec.headerRule ? 10 : 0,
        }}
      >
        <h1
          className="leading-tight text-neutral-950"
          style={{
            fontSize: `${spec.name.scale}em`,
            fontWeight: spec.name.bold ? 700 : 400,
            letterSpacing: `${spec.name.letterSpacing}em`,
          }}
        >
          {basics.name || "Your Name"}
        </h1>
        {basics.title && (
          <p
            className="mt-0.5"
            style={{
              fontSize: "1.12em",
              color: spec.title.color,
              fontWeight: spec.title.bold ? 600 : 400,
              fontStyle: spec.title.italic ? "italic" : "normal",
            }}
          >
            {basics.title}
          </p>
        )}
        <Contact basics={basics} />
      </header>

      {visibleSections(resume).map((section) => (
        <Section key={section.key} title={section.title} gap={gap} spec={spec}>
          {section.extra ? (
            <ExtraContent section={section.extra} />
          ) : (
            <CoreContent resume={resume} sectionKey={section.key} />
          )}
        </Section>
      ))}
    </article>
  );
}
