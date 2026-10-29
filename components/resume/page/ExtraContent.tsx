import Bullets from "@/components/resume/page/Bullets";
import { EntryLine, none, patch } from "@/components/resume/page/fields";
import type { ChangedLines } from "@/lib/optimize";
import { EXTRA_KINDS, type ExtraSection, hasExtraItem } from "@/lib/resume";

// The entries of a section the person added: certifications, awards, volunteering, languages, ...
export default function ExtraContent({
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
