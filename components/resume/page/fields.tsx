import Editable from "@/components/resume/Editable";
import { type LinkMode, resumeLinks } from "@/lib/links";
import { plainText } from "@/lib/rich";

// The small building blocks every part of the resume page is made of

// One piece of text and, when the page is editable, how to save a new version of it
export type Field = { value: string; label: string; onCommit?: (next: string) => void };

export const none: Field = { value: "", label: "" };

export const text = (field: Field, className?: string) => (
  <Editable value={field.value} label={field.label} onCommit={field.onCommit} className={className} />
);

// Replaces the fields of one item in a list (a job, a school, ...), found by its id
export function patch<T extends { id: string }>(list: T[], id: string, change: Partial<T>) {
  return list.map((item) => (item.id === id ? { ...item, ...change } : item));
}

// A line Optimize changed: highlighted, with what it said before in its tooltip
export function markProps(before: string | undefined) {
  if (before === undefined) return {};
  return {
    className: "optimize-mark",
    hint: before ? `Before Optimize: ${plainText(before)}` : "Changed by Optimize",
  };
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

// Title on the left, dates on the right: the standard resume entry line
export function EntryLine({ bold, rest, start, end }: { bold: Field; rest: Field[]; start: Field; end: Field }) {
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

// Links show as short labels ("LinkedIn") or full addresses, and always open the full address.
// They're edited in the form, since the label isn't the address.
export function WebLinks({ field, mode }: { field: string; mode: LinkMode }) {
  return resumeLinks(field, mode).map((link, i) => (
    <span key={link.href + i}>
      {i > 0 && ", "}
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
        {link.text}
      </a>
    </span>
  ));
}
