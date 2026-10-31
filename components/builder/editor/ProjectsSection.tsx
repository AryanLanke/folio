"use client";

import EnhanceTextArea from "@/components/builder/EnhanceTextArea";
import { type SectionProps, moveItem, updateItem } from "@/components/builder/editor/shared";
import { AddButton, Field, Item, ItemControls } from "@/components/builder/fields";
import { type Project, newProject } from "@/lib/resume";
import { checkLink } from "@/lib/validate";

export default function ProjectsSection({ resume, set, focus }: SectionProps) {
  const setProject = (id: string, patch: Partial<Project>, checkpoint = false) =>
    set({ projects: updateItem(resume.projects, id, patch) }, checkpoint);

  return (
    <div className="space-y-4">
      {resume.projects.map((item, index) => (
        <Item
          key={item.id}
          label={item.name || `Project ${index + 1}`}
          controls={
            <ItemControls
              index={index}
              count={resume.projects.length}
              onMove={(to) => set({ projects: moveItem(resume.projects, index, to) })}
              onRemove={() => set({ projects: resume.projects.filter((p) => p.id !== item.id) }, true)}
            />
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project name" value={item.name} onChange={(v) => setProject(item.id, { name: v })} />
            <Field
              label="Links (code, live demo)"
              value={item.link}
              onChange={(v) => setProject(item.id, { link: v })}
              placeholder="github.com/you/project, project.com"
              warning={checkLink(item.link)}
            />
            <Field
              label="Built with"
              value={item.tech}
              onChange={(v) => setProject(item.id, { tech: v })}
              placeholder="React, Node.js, MongoDB"
            />
            <Field label="Date" value={item.date} onChange={(v) => setProject(item.id, { date: v })} placeholder="2025" />
          </div>
          <div className="mt-4">
            <EnhanceTextArea
              kind="bullets"
              focus={focus}
              role={item.name ? `Project: ${item.name}` : undefined}
              label="What it is"
              hint="One bullet per line"
              rows={3}
              value={item.bullets}
              onChange={(v) => setProject(item.id, { bullets: v })}
              onAccept={(v) => setProject(item.id, { bullets: v }, true)}
            />
          </div>
        </Item>
      ))}
      <AddButton label="Add project" onClick={() => set({ projects: [...resume.projects, newProject()] })} />
    </div>
  );
}
