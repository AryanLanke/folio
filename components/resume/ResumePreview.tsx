import Editable from "@/components/resume/Editable";
import Contact from "@/components/resume/page/Contact";
import CoreContent from "@/components/resume/page/CoreContent";
import ExtraContent from "@/components/resume/page/ExtraContent";
import Section from "@/components/resume/page/Section";
import { ColorDot } from "@/components/ui/ColorPicker";
import type { ChangedLines } from "@/lib/optimize";
import { PAGE_MARGIN, PAPER, type PaperSize, type Resume, renameSection, swapSections, visibleSections } from "@/lib/resume";
import { HTML_FONT, TEMPLATE_SPECS, layoutFor } from "@/lib/templates";

// The resume as a web page. Its look comes from lib/templates.ts, shared with the PDF and Word
// exports. Every template is single-column plain text with standard headings (ATS-readable).
// Given onChange, every piece of text on the page can be clicked and edited in place. Its parts
// (sections, bullets, the contact line, each kind of entry) are in ./page.

export default function ResumePreview({
  resume,
  paper,
  onChange,
  changed,
}: {
  resume: Resume;
  paper: PaperSize;
  // When given, the page can be edited in place
  onChange?: (next: Resume) => void;
  // Lines Optimize just changed, highlighted until the person moves on
  changed?: ChangedLines;
}) {
  const { basics } = resume;
  const size = PAPER[paper];
  const { spec, fontSize, gap, lineHeight } = layoutFor(resume.style);
  const set = onChange && ((change: Partial<Resume>) => onChange({ ...resume, ...change }));
  const setBasics = set && ((change: Partial<Resume["basics"]>) => set({ basics: { ...basics, ...change } }));
  const sections = visibleSections(resume);

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
        <Editable
          as="h1"
          className="leading-tight text-neutral-950"
          style={{
            fontSize: `${spec.name.scale}em`,
            fontWeight: spec.name.bold ? 700 : 400,
            letterSpacing: `${spec.name.letterSpacing}em`,
            textTransform: spec.name.uppercase ? "uppercase" : "none",
            fontFamily: spec.displaySerif ? HTML_FONT.serif : undefined,
          }}
          value={basics.name || "Your Name"}
          label="Full name"
          onCommit={setBasics && ((name) => setBasics({ name }))}
        />
        {basics.title && (
          <Editable
            as="p"
            className="mt-0.5"
            style={{
              fontSize: "1.12em",
              color: spec.title.color,
              fontWeight: spec.title.bold ? 600 : 400,
              fontStyle: spec.title.italic ? "italic" : "normal",
            }}
            value={basics.title}
            label="Job title"
            onCommit={setBasics && ((title) => setBasics({ title }))}
          />
        )}
        <Contact resume={resume} set={setBasics} />
      </header>

      {sections.map((section, i) => (
        <Section
          key={section.key}
          title={{
            value: section.title,
            label: "Section title",
            onCommit: onChange && ((next) => onChange(renameSection(resume, section.key, next))),
          }}
          gap={gap}
          spec={spec}
          move={
            onChange && {
              up: i > 0 ? () => onChange(swapSections(resume, section.key, sections[i - 1].key)) : undefined,
              down: i < sections.length - 1 ? () => onChange(swapSections(resume, section.key, sections[i + 1].key)) : undefined,
            }
          }
          colorPicker={
            set && (
              <ColorDot
                color={spec.heading.color}
                value={resume.style.accent}
                fallback={TEMPLATE_SPECS[resume.style.template].heading.color}
                onChange={(accent) => set({ style: { ...resume.style, accent } })}
              />
            )
          }
        >
          {section.extra ? (
            <ExtraContent
              section={section.extra}
              setSection={
                set &&
                ((next) => set({ extras: resume.extras.map((extra) => (extra.id === next.id ? next : extra)) }))
              }
              changed={changed}
            />
          ) : (
            <CoreContent resume={resume} sectionKey={section.key} set={set} changed={changed} />
          )}
        </Section>
      ))}
    </article>
  );
}
