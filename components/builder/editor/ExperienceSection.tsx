"use client";

import EnhanceTextArea from "@/components/builder/EnhanceTextArea";
import { type SectionProps, moveItem, updateItem } from "@/components/builder/editor/shared";
import { AddButton, Field, Item, ItemControls } from "@/components/builder/fields";
import { type Experience, PRESENT, newExperience } from "@/lib/resume";
import { checkDate, checkDateRange } from "@/lib/validate";

export default function ExperienceSection({ resume, set, focus }: SectionProps) {
  const setExperience = (id: string, patch: Partial<Experience>, checkpoint = false) =>
    set({ experience: updateItem(resume.experience, id, patch) }, checkpoint);

  return (
    <div className="space-y-4">
      {resume.experience.map((item, index) => {
        const current = item.end === PRESENT;
        return (
          <Item
            key={item.id}
            label={item.role || item.company || `Job ${index + 1}`}
            controls={
              <ItemControls
                index={index}
                count={resume.experience.length}
                onMove={(to) => set({ experience: moveItem(resume.experience, index, to) })}
                onRemove={() => set({ experience: resume.experience.filter((e) => e.id !== item.id) }, true)}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Job title" value={item.role} onChange={(v) => setExperience(item.id, { role: v })} />
              <Field label="Company" value={item.company} onChange={(v) => setExperience(item.id, { company: v })} />
              <Field
                label="Start"
                value={item.start}
                onChange={(v) => setExperience(item.id, { start: v })}
                placeholder="Jun 2023"
                warning={checkDate(item.start)}
              />
              <Field
                label="End"
                value={current ? "" : item.end}
                onChange={(v) => setExperience(item.id, { end: v })}
                placeholder={current ? PRESENT : "May 2025"}
                disabled={current}
                warning={current ? null : (checkDate(item.end) ?? checkDateRange(item.start, item.end))}
              />
              <Field label="Location" value={item.location} onChange={(v) => setExperience(item.id, { location: v })} />
              <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-muted">
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={current}
                  onChange={(e) => setExperience(item.id, { end: e.target.checked ? PRESENT : "" })}
                />
                I currently work here
              </label>
            </div>
            <div className="mt-4">
              <EnhanceTextArea
                kind="bullets"
                focus={focus}
                role={[item.role, item.company].filter(Boolean).join(" at ")}
                current={current}
                label="What you did"
                hint="One bullet per line"
                rows={5}
                value={item.bullets}
                onChange={(v) => setExperience(item.id, { bullets: v })}
                onAccept={(v) => setExperience(item.id, { bullets: v }, true)}
                placeholder={"Rebuilt the dashboard, cutting load time by 60%\nLed a team of 3 developers"}
              />
            </div>
          </Item>
        );
      })}
      <AddButton label="Add job" onClick={() => set({ experience: [...resume.experience, newExperience()] })} />
    </div>
  );
}
