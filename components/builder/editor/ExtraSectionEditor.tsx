"use client";

import EnhanceTextArea from "@/components/builder/EnhanceTextArea";
import { type SectionProps, moveItem, updateItem } from "@/components/builder/editor/shared";
import { AddButton, Field, Item, ItemControls } from "@/components/builder/fields";
import { EXTRA_KINDS, type ExtraItem, type ExtraSection, newExtraItem } from "@/lib/resume";

// An added section (certifications, awards, languages, a custom one, ...): its title and items
export default function ExtraSectionEditor({ resume, set, focus, section }: SectionProps & { section: ExtraSection }) {
  const setExtra = (id: string, patch: Partial<ExtraSection>) => set({ extras: updateItem(resume.extras, id, patch) });
  const fields = EXTRA_KINDS[section.kind];
  const setItems = (items: ExtraItem[], checkpoint = false) =>
    set({ extras: updateItem(resume.extras, section.id, { items }) }, checkpoint);
  const setItem = (id: string, patch: Partial<ExtraItem>, checkpoint = false) =>
    setItems(updateItem(section.items, id, patch), checkpoint);

  return (
    <div className="space-y-4">
      <Field label="Section title" value={section.title} onChange={(v) => setExtra(section.id, { title: v })} />
      {section.items.map((item, index) => (
        <Item
          key={item.id}
          label={item.title || `${fields.item} ${index + 1}`}
          controls={
            <ItemControls
              index={index}
              count={section.items.length}
              onMove={(to) => setItems(moveItem(section.items, index, to))}
              onRemove={() => setItems(section.items.filter((i) => i.id !== item.id), true)}
            />
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={fields.item} value={item.title} onChange={(v) => setItem(item.id, { title: v })} />
            <Field label={fields.subtitle} value={item.subtitle} onChange={(v) => setItem(item.id, { subtitle: v })} />
            {fields.date && (
              <Field label={fields.date} value={item.date} onChange={(v) => setItem(item.id, { date: v })} />
            )}
          </div>
          {fields.bullets && (
            <div className="mt-4">
              <EnhanceTextArea
                kind="bullets"
                focus={focus}
                role={[item.title, item.subtitle].filter(Boolean).join(" at ") || undefined}
                label="Details"
                hint="One bullet per line"
                rows={3}
                value={item.bullets}
                onChange={(v) => setItem(item.id, { bullets: v })}
                onAccept={(v) => setItem(item.id, { bullets: v }, true)}
              />
            </div>
          )}
        </Item>
      ))}
      <AddButton label={`Add ${fields.item.toLowerCase()}`} onClick={() => setItems([...section.items, newExtraItem()])} />
    </div>
  );
}
