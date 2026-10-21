import {
  EXTRA_KINDS,
  type ExtraSection,
  PAGE_MARGIN,
  PAPER,
  type PaperSize,
  type Resume,
  type ResumeStyle,
  type TemplateName,
  hasEducation,
  hasExperience,
  hasExtraItem,
  hasProject,
  toLines,
  toList,
  visibleSections,
} from "@/lib/resume";

// Every template is single-column plain text with standard headings, so all of them stay
// ATS-readable. They differ only in typeface, alignment and heading style.

const FONT_SIZE: Record<ResumeStyle["fontSize"], number> = { small: 11.5, medium: 12.5, large: 13.5 };
const SPACING: Record<ResumeStyle["spacing"], { gap: number; lineHeight: number }> = {
  compact: { gap: 0.7, lineHeight: 1.35 },
  normal: { gap: 1, lineHeight: 1.45 },
  relaxed: { gap: 1.3, lineHeight: 1.55 },
};

const TEMPLATE_STYLES: Record<
  TemplateName,
  { font: string; header: string; name: string; title: string; heading: string }
> = {
  classic: {
    font: "Arial, Helvetica, sans-serif",
    header: "text-center",
    name: "text-[2.08em] font-bold",
    title: "text-neutral-700",
    heading: "border-b border-neutral-300 pb-1 text-[0.88em] font-bold uppercase tracking-[0.12em] text-neutral-900",
  },
  modern: {
    font: "Arial, Helvetica, sans-serif",
    header: "text-left",
    name: "text-[2.3em] font-bold tracking-tight",
    title: "font-semibold text-[#1d6b45]",
    heading: "border-b-2 border-[#1d6b45] pb-1 text-[0.9em] font-bold uppercase tracking-[0.08em] text-[#1d6b45]",
  },
  serif: {
    font: "Georgia, 'Times New Roman', serif",
    header: "text-center",
    name: "text-[2.1em] font-normal tracking-wide",
    title: "italic text-neutral-700",
    heading: "border-b border-neutral-400 pb-0.5 text-[1.08em] font-bold tracking-[0.06em] text-neutral-900 [font-variant:small-caps]",
  },
};

function Section({
  title,
  gap,
  headingClass,
  children,
}: {
  title: string;
  gap: number;
  headingClass: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 20 * gap }}>
      <h2 className={`break-after-avoid ${headingClass}`}>{title}</h2>
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

export default function ResumePreview({
  resume,
  paper,
  mode = "screen",
}: {
  resume: Resume;
  paper: PaperSize;
  // "print" drops the page box, since the printed page's own margins take over
  mode?: "screen" | "print";
}) {
  const { basics, style } = resume;
  const size = PAPER[paper];
  const template = TEMPLATE_STYLES[style.template];
  const { gap, lineHeight } = SPACING[style.spacing];

  const pageStyle =
    mode === "screen" ? { width: size.width, minHeight: size.height, padding: PAGE_MARGIN } : {};

  return (
    <article
      style={{ fontFamily: template.font, fontSize: FONT_SIZE[style.fontSize], lineHeight, ...pageStyle }}
      className="bg-white text-neutral-800"
    >
      <header className={template.header}>
        <h1 className={`leading-tight text-neutral-950 ${template.name}`}>{basics.name || "Your Name"}</h1>
        {basics.title && <p className={`mt-0.5 text-[1.12em] ${template.title}`}>{basics.title}</p>}
        <Contact basics={basics} />
      </header>

      {visibleSections(resume).map((section) => (
        <Section key={section.key} title={section.title} gap={gap} headingClass={template.heading}>
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
