"use client";

import { type SectionProps, moveItem, updateItem } from "@/components/builder/editor/shared";
import { AddButton, Field, Item, ItemControls } from "@/components/builder/fields";
import { type Education, newEducation } from "@/lib/resume";
import { checkDate, checkDateRange } from "@/lib/validate";

export default function EducationSection({ resume, set }: SectionProps) {
  const setEducation = (id: string, patch: Partial<Education>) =>
    set({ education: updateItem(resume.education, id, patch) });

  return (
    <div className="space-y-4">
      {resume.education.map((item, index) => (
        <Item
          key={item.id}
          label={item.school || item.degree || `School ${index + 1}`}
          controls={
            <ItemControls
              index={index}
              count={resume.education.length}
              onMove={(to) => set({ education: moveItem(resume.education, index, to) })}
              onRemove={() => set({ education: resume.education.filter((e) => e.id !== item.id) }, true)}
            />
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School" value={item.school} onChange={(v) => setEducation(item.id, { school: v })} />
            <Field label="Degree" value={item.degree} onChange={(v) => setEducation(item.id, { degree: v })} placeholder="B.S. Computer Science" />
            <Field
              label="Start"
              value={item.start}
              onChange={(v) => setEducation(item.id, { start: v })}
              placeholder="2019"
              warning={checkDate(item.start)}
            />
            <Field
              label="End"
              value={item.end}
              onChange={(v) => setEducation(item.id, { end: v })}
              placeholder="2023"
              warning={checkDate(item.end) ?? checkDateRange(item.start, item.end)}
            />
            <Field label="Location" value={item.location} onChange={(v) => setEducation(item.id, { location: v })} />
            <Field label="Details" value={item.details} onChange={(v) => setEducation(item.id, { details: v })} placeholder="GPA, honors, coursework" />
          </div>
        </Item>
      ))}
      <AddButton label="Add school" onClick={() => set({ education: [...resume.education, newEducation()] })} />
    </div>
  );
}
