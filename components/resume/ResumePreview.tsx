import { useLayoutEffect, useRef, useState } from "react";
import Editable, { type LineKeys, placeCaret } from "@/components/resume/Editable";
import { ColorDot } from "@/components/ui/ColorPicker";
import {
  CORE_TITLES,
  type CoreSection,
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
  skillGroups,
  skillList,
  skillsText,
  toLines,
  visibleSections,
} from "@/lib/resume";
import { type LinkMode, resumeLinks } from "@/lib/links";
import type { ChangedLines } from "@/lib/optimize";
import { plainText } from "@/lib/rich";
import { HTML_FONT, TEMPLATE_SPECS, type TemplateSpec, layoutFor } from "@/lib/templates";

// The resume as a web page. Its look comes from lib/templates.ts, shared with the PDF and Word
// exports. Every template is single-column plain text with standard headings (ATS-readable).
// Given onChange, every piece of text on the page can be clicked and edited in place.

// One piece of text and, when the page is editable, how to save a new version of it
type Field = { value: string; label: string; onCommit?: (next: string) => void };

const text = (field: Field, className?: string) => (
  <Editable value={field.value} label={field.label} onCommit={field.onCommit} className={className} />
);

// Replaces the fields of one item in a list (a job, a school, ...), found by its id
function patch<T extends { id: string }>(list: T[], id: string, change: Partial<T>) {
  return list.map((item) => (item.id === id ? { ...item, ...change } : item));
}

function Section({
  title,
  gap,
  spec,
  colorPicker,
  move,
  children,
}: {
  // The heading, and how to rename it when the page is editable
  title: Field;
  gap: number;
  spec: TemplateSpec;
  // The round colour dot at the end of the heading, when the page is editable
  colorPicker?: React.ReactNode;
  // Moves the whole section up or down the page; missing at the top or bottom
  move?: { up?: () => void; down?: () => void };
  children: React.ReactNode;
}) {
  const { heading } = spec;
  return (
    <section style={{ marginTop: 20 * gap }} className="group/section">
      <div className="relative">
        {move && (
          <div className="absolute -left-9 inset-y-0 flex items-center gap-0.5 pb-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/section:opacity-100">
            <MoveButton label={`Move ${plainText(title.value)} up`} onClick={move.up} direction="up" />
            <MoveButton label={`Move ${plainText(title.value)} down`} onClick={move.down} direction="down" />
          </div>
        )}
        <h2
          className="break-after-avoid font-bold"
          style={{
            fontSize: `${heading.scale}em`,
            letterSpacing: `${heading.letterSpacing}em`,
            textTransform: heading.uppercase ? "uppercase" : "none",
            fontVariant: heading.smallCaps ? "small-caps" : "normal",
            fontFamily: spec.displaySerif ? HTML_FONT.serif : undefined,
            color: heading.color,
            borderBottom: heading.rule ? `${heading.rule}px solid ${heading.ruleColor}` : "none",
            paddingBottom: heading.rule ? 3 : 0,
            paddingRight: colorPicker ? 28 : 0,
          }}
        >
          {text(title)}
        </h2>
        {colorPicker && (
          <div className="absolute inset-y-0 right-0 flex items-center pb-1">
            {colorPicker}
          </div>
        )}
      </div>
      <div className="flex flex-col" style={{ marginTop: 8 * gap, gap: 12 * gap }}>
        {children}
      </div>
    </section>
  );
}

// A small arrow in the page margin, for moving a section
function MoveButton({ label, onClick, direction }: { label: string; onClick?: () => void; direction: "up" | "down" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      title={label}
      className="grid size-4 place-items-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:invisible"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={direction === "up" ? "M3.5 10 8 5.5l4.5 4.5" : "M3.5 6 8 10.5 12.5 6"} />
      </svg>
    </button>
  );
}

function Dates({ start, end }: { start: Field; end: Field }) {
  if (!start.value && !end.value) return null;
  return (
    <span className="shrink-0 text-neutral-600">
      {start.value && text(start)}
      {start.value && end.value ? " – " : ""}
      {end.value && text(end)}
    </span>
  );
}

// A line Optimize changed: highlighted, with what it said before in its tooltip
function markProps(before: string | undefined) {
  if (before === undefined) return {};
  return {
    className: "optimize-mark",
    hint: before ? `Before Optimize: ${plainText(before)}` : "Changed by Optimize",
  };
}

// One bullet per line, edited like a list in Word: Enter splits a bullet (or starts a new one),
// Backspace at the start joins it to the one above, Alt+Up and Alt+Down move it. Editing a
// bullet to nothing removes it.
function Bullets({
  value,
  onCommit,
  marked,
}: {
  value: string;
  onCommit?: (next: string) => void;
  // Lines Optimize changed (by line number), with what each said before
  marked?: Record<number, string>;
}) {
  const lines = toLines(value);
  const listRef = useRef<HTMLUListElement>(null);
  // A new empty bullet from Enter: it only becomes part of the resume once something is typed
  const [pending, setPending] = useState<number | null>(null);
  // Where the cursor goes once the list has re-rendered
  const focusNext = useRef<{ index: number; offset: number | "end" } | null>(null);

  useLayoutEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    const element = listRef.current?.querySelectorAll<HTMLElement>("[role=textbox]")[target.index];
    if (element) placeCaret(element, target.offset);
  });

  if (lines.length === 0) return null;
  const shown = pending !== null && pending <= lines.length ? [...lines.slice(0, pending), "", ...lines.slice(pending)] : lines;
  // Saves the list as shown; an empty line left in it stays on screen as the new bullet
  const save = (next: string[], empty: number | null = null) => {
    setPending(empty);
    const filled = next.filter((line) => plainText(line).trim());
    if (filled.join("\n") !== lines.join("\n")) onCommit?.(filled.join("\n"));
  };

  const commitLine = (i: number) =>
    onCommit &&
    ((next: string) => {
      const copy = [...shown];
      copy[i] = next;
      save(copy);
    });

  const keys = (i: number): LineKeys => ({
    onSplit: (before, after) => {
      const empty = (text: string) => !plainText(text).trim();
      if (empty(before) && empty(after)) {
        // Enter on an empty bullet ends the list, like in Word
        setPending(null);
        return false;
      }
      const copy = [...shown];
      copy.splice(i, 1, before, after);
      focusNext.current = { index: i + 1, offset: 0 };
      save(copy, empty(after) ? i + 1 : empty(before) ? i : null);
      return true;
    },
    onMergeUp: (current) => {
      if (i === 0) return false;
      const copy = [...shown];
      const previous = copy[i - 1];
      const space = plainText(previous).trim() && plainText(current).trim() ? " " : "";
      copy.splice(i - 1, 2, previous + space + current);
      focusNext.current = { index: i - 1, offset: plainText(previous).length + space.length };
      save(copy);
      return true;
    },
    onMove: (direction, current) => {
      const to = i + direction;
      if (to < 0 || to >= shown.length) return false;
      const copy = [...shown];
      copy[i] = copy[to];
      copy[to] = current;
      focusNext.current = { index: to, offset: "end" };
      save(copy, pending === i ? to : pending === to ? i : pending);
      return true;
    },
  });

  return (
    <ul ref={listRef} className="mt-1 list-disc space-y-0.5 pl-4">
      {shown.map((line, i) => (
        <li key={i}>
          <Editable
            value={line}
            label="Bullet point"
            onCommit={commitLine(i)}
            lineKeys={onCommit && keys(i)}
            {...markProps(marked?.[i])}
          />
        </li>
      ))}
    </ul>
  );
}

// Links show as short labels ("LinkedIn") or full addresses, and always open the full address.
// They're edited in the form, since the label isn't the address.
function WebLinks({ field, mode }: { field: string; mode: LinkMode }) {
  return resumeLinks(field, mode).map((link, i) => (
    <span key={link.href + i}>
      {i > 0 && ", "}
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
        {link.text}
      </a>
    </span>
  ));
}

function Contact({ resume, set }: { resume: Resume; set?: (change: Partial<Resume["basics"]>) => void }) {
  const { basics } = resume;
  const field = (key: "email" | "phone" | "location", label: string): Field => ({
    value: basics[key],
    label,
    onCommit: set && ((next) => set({ [key]: next })),
  });
  const items = [
    // An email address you can edit isn't also a link, so clicking it edits instead of opening mail
    basics.email &&
      (set ? (
        <span key="email">{text(field("email", "Email"))}</span>
      ) : (
        <a key="email" href={`mailto:${basics.email}`}>
          {basics.email}
        </a>
      )),
    basics.phone && <span key="phone">{text(field("phone", "Phone"))}</span>,
    basics.location && <span key="location">{text(field("location", "Location"))}</span>,
    ...resumeLinks(basics.link, resume.style.links).map((link) => (
      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
        {link.text}
      </a>
    )),
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
function EntryLine({ bold, rest, start, end }: { bold: Field; rest: Field[]; start: Field; end: Field }) {
  const tail = rest.filter((field) => field.value);
  return (
    <div className="flex items-baseline justify-between gap-4">
      <p>
        {bold.value && text(bold, "font-bold text-neutral-950")}
        {bold.value && tail.length > 0 ? ", " : ""}
        {tail.map((field, i) => (
          <span key={field.label}>
            {i > 0 && " — "}
            {text(field)}
          </span>
        ))}
      </p>
      <Dates start={start} end={end} />
    </div>
  );
}

const none: Field = { value: "", label: "" };

function ExtraContent({
  section,
  setSection,
  changed,
}: {
  section: ExtraSection;
  setSection?: (next: ExtraSection) => void;
  changed?: ChangedLines;
}) {
  const items = section.items.filter(hasExtraItem);
  if (section.kind === "languages") {
    const line = items.map((item) => (item.subtitle ? `${item.title} (${item.subtitle})` : item.title));
    return <p>{line.join(", ")}</p>;
  }
  const fields = EXTRA_KINDS[section.kind];
  const save = (id: string, key: "title" | "subtitle" | "date" | "bullets") =>
    setSection && ((next: string) => setSection({ ...section, items: patch(section.items, id, { [key]: next }) }));
  return items.map((item) => (
    <div key={item.id} className="break-inside-avoid">
      <EntryLine
        bold={{ value: item.title, label: fields.item, onCommit: save(item.id, "title") }}
        rest={[{ value: item.subtitle, label: fields.subtitle, onCommit: save(item.id, "subtitle") }]}
        start={fields.date ? { value: item.date, label: fields.date, onCommit: save(item.id, "date") } : none}
        end={none}
      />
      {fields.bullets && (
        <Bullets value={item.bullets} onCommit={save(item.id, "bullets")} marked={changed?.[`extras:${section.id}:${item.id}`]} />
      )}
    </div>
  ));
}

function CoreContent({
  resume,
  sectionKey,
  set,
  changed,
}: {
  resume: Resume;
  sectionKey: string;
  set?: (change: Partial<Resume>) => void;
  changed?: ChangedLines;
}) {
  switch (sectionKey) {
    case "summary":
      return (
        <Editable
          as="p"
          value={resume.summary}
          label="Summary"
          onCommit={set && ((summary) => set({ summary }))}
          {...markProps(changed?.summary?.[0])}
        />
      );
    case "experience": {
      const save = (id: string, key: "role" | "company" | "location" | "start" | "end" | "bullets") =>
        set && ((next: string) => set({ experience: patch(resume.experience, id, { [key]: next }) }));
      return resume.experience.filter(hasExperience).map((item) => (
        <div key={item.id} className="break-inside-avoid">
          <EntryLine
            bold={{ value: item.role, label: "Job title", onCommit: save(item.id, "role") }}
            rest={[
              { value: item.company, label: "Company", onCommit: save(item.id, "company") },
              { value: item.location, label: "Location", onCommit: save(item.id, "location") },
            ]}
            start={{ value: item.start, label: "Start date", onCommit: save(item.id, "start") }}
            end={{ value: item.end, label: "End date", onCommit: save(item.id, "end") }}
          />
          <Bullets value={item.bullets} onCommit={save(item.id, "bullets")} marked={changed?.[`experience:${item.id}`]} />
        </div>
      ));
    }
    case "projects": {
      const save = (id: string, key: "name" | "tech" | "date" | "bullets") =>
        set && ((next: string) => set({ projects: patch(resume.projects, id, { [key]: next }) }));
      // Name and links, with the date on the right; what it's built with on the line below
      return resume.projects.filter(hasProject).map((item) => (
        <div key={item.id} className="break-inside-avoid">
          <div className="flex items-baseline justify-between gap-4">
            <p>
              {item.name && text({ value: item.name, label: "Project name", onCommit: save(item.id, "name") }, "font-bold text-neutral-950")}
              {item.link && (
                <>
                  {" — "}
                  <WebLinks field={item.link} mode={resume.style.links} />
                </>
              )}
            </p>
            {item.date && (
              <span className="shrink-0 text-neutral-600">
                {text({ value: item.date, label: "Project date", onCommit: save(item.id, "date") })}
              </span>
            )}
          </div>
          {item.tech && (
            <Editable as="p" className="text-neutral-600" value={item.tech} label="Built with" onCommit={save(item.id, "tech")} />
          )}
          <Bullets value={item.bullets} onCommit={save(item.id, "bullets")} marked={changed?.[`projects:${item.id}`]} />
        </div>
      ));
    }
    case "education": {
      const save = (id: string, key: "degree" | "school" | "location" | "start" | "end" | "details") =>
        set && ((next: string) => set({ education: patch(resume.education, id, { [key]: next }) }));
      // The degree in bold with the dates, then the school (and place) on the line below
      return resume.education.filter(hasEducation).map((item) => {
        const degree: Field = { value: item.degree, label: "Degree", onCommit: save(item.id, "degree") };
        const school: Field = { value: item.school, label: "School", onCommit: save(item.id, "school") };
        const location: Field = { value: item.location, label: "Location", onCommit: save(item.id, "location") };
        const second = [item.degree ? school : none, location].filter((field) => field.value);
        return (
          <div key={item.id} className="break-inside-avoid">
            <EntryLine
              bold={item.degree ? degree : school}
              rest={[]}
              start={{ value: item.start, label: "Start year", onCommit: save(item.id, "start") }}
              end={{ value: item.end, label: "End year", onCommit: save(item.id, "end") }}
            />
            {second.length > 0 && (
              <p>
                {second.map((field, i) => (
                  <span key={field.label}>
                    {i > 0 && " — "}
                    {text(field)}
                  </span>
                ))}
              </p>
            )}
            {item.details && (
              <Editable as="p" className="mt-0.5" value={item.details} label="Details" onCommit={save(item.id, "details")} />
            )}
          </div>
        );
      });
    }
    case "skills": {
      const groups = skillGroups(resume.skills);
      if (!groups.some((group) => group.label)) {
        return (
          <Editable
            as="p"
            value={skillList(resume.skills).join(", ")}
            label="Skills, separated by commas"
            onCommit={set && ((skills) => set({ skills }))}
          />
        );
      }
      // Grouped: one line per group, its label in bold. Emptying a group's skills removes it.
      const saveGroup = (index: number) =>
        set &&
        ((next: string) =>
          set({
            skills: skillsText(
              groups
                .map((group, i) => (i === index ? { ...group, items: skillList(next) } : group))
                .filter((group) => group.items.length > 0),
            ),
          }));
      return (
        <div className="flex flex-col gap-0.5">
          {groups.map((group, i) => (
            <p key={i}>
              {group.label && <span className="font-bold text-neutral-950">{group.label}: </span>}
              {text({ value: group.items.join(", "), label: group.label ? `${group.label} skills` : "Skills", onCommit: saveGroup(i) })}
            </p>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

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
  // Sections swap places in the saved order, which also holds the ones not on the page yet
  const swapSections = (a: string, b: string) => {
    const order = [...resume.order];
    const i = order.indexOf(a);
    const j = order.indexOf(b);
    [order[i], order[j]] = [order[j], order[i]];
    set?.({ order });
  };
  // Clearing a heading puts the standard name back
  const renameSection = (key: string, next: string) => {
    if (!set) return;
    if (key in CORE_TITLES) {
      const titles = { ...resume.titles, [key]: next };
      if (!next || next === CORE_TITLES[key as CoreSection]) delete titles[key as CoreSection];
      set({ titles });
      return;
    }
    set({
      extras: resume.extras.map((extra) =>
        extra.id === key ? { ...extra, title: next || EXTRA_KINDS[extra.kind].title } : extra,
      ),
    });
  };

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
          title={{ value: section.title, label: "Section title", onCommit: set && ((next) => renameSection(section.key, next)) }}
          gap={gap}
          spec={spec}
          move={
            set && {
              up: i > 0 ? () => swapSections(section.key, sections[i - 1].key) : undefined,
              down: i < sections.length - 1 ? () => swapSections(section.key, sections[i + 1].key) : undefined,
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
