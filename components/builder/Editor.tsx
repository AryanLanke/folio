"use client";

import EnhanceTextArea from "@/components/builder/EnhanceTextArea";
import { AddButton, Card, Field, Item, ItemControls, TextArea } from "@/components/builder/fields";
import {
  type Basics,
  CORE_TITLES,
  type CoreSection,
  type Education,
  EXTRA_KINDS,
  type Experience,
  type ExtraItem,
  type ExtraKind,
  type ExtraSection,
  PRESENT,
  type Project,
  type Resume,
  newEducation,
  newExperience,
  newExtraItem,
  newExtraSection,
  newProject,
  sectionTitle,
} from "@/lib/resume";
import { checkDate, checkDateRange, checkEmail, checkLink, checkPhone } from "@/lib/validate";

// Shared list helpers
function updateItem<T extends { id: string }>(list: T[], id: string, patch: Partial<T>) {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function moveItem<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function Editor({
  resume,
  onChange,
}: {
  resume: Resume;
  // checkpoint marks big changes (like removing a job) that Undo should be able to reverse
  onChange: (resume: Resume, checkpoint?: boolean) => void;
}) {
  const set = (patch: Partial<Resume>, checkpoint = false) =>
    onChange({ ...resume, ...patch }, checkpoint);
  const setBasics = (patch: Partial<Basics>) => set({ basics: { ...resume.basics, ...patch } });

  const setExperience = (id: string, patch: Partial<Experience>, checkpoint = false) =>
    set({ experience: updateItem(resume.experience, id, patch) }, checkpoint);
  const setEducation = (id: string, patch: Partial<Education>) =>
    set({ education: updateItem(resume.education, id, patch) });
  const setProject = (id: string, patch: Partial<Project>, checkpoint = false) =>
    set({ projects: updateItem(resume.projects, id, patch) }, checkpoint);
  const setExtra = (id: string, patch: Partial<ExtraSection>) =>
    set({ extras: updateItem(resume.extras, id, patch) });

  const addExtra = (kind: ExtraKind) => {
    const section = newExtraSection(kind);
    set({ extras: [...resume.extras, section], order: [...resume.order, section.id] });
  };

  const removeExtra = (id: string) =>
    set(
      { extras: resume.extras.filter((e) => e.id !== id), order: resume.order.filter((key) => key !== id) },
      true,
    );

  const { basics } = resume;
  // Job keywords from Job match, so AI wording leans toward the target job
  const focus = resume.target.keywords.length > 0 ? resume.target.keywords : undefined;

  const renderCore = (key: CoreSection) => {
    switch (key) {
      case "summary":
        return (
          <EnhanceTextArea
            kind="summary"
            focus={focus}
            role={resume.basics.title}
            label="A few lines about you"
            hint="2–3 sentences"
            value={resume.summary}
            onChange={(v) => set({ summary: v })}
            onAccept={(v) => set({ summary: v }, true)}
            placeholder="Frontend developer with 3 years of experience..."
          />
        );

      case "experience":
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

      case "projects":
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

      case "education":
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

      case "skills":
        return (
          <TextArea
            label="Your skills"
            hint="Separate with commas. To group them, one group per line"
            rows={4}
            value={resume.skills}
            onChange={(v) => set({ skills: v })}
            placeholder={"JavaScript, React, SQL, Figma\n\nor grouped:\nLanguages: Python, SQL\nTools: Git, Docker"}
          />
        );
    }
  };

  const renderExtra = (section: ExtraSection) => {
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
  };

  // Single-use kinds (certifications, awards, ...) are offered only until added; custom can repeat
  const addable = (Object.keys(EXTRA_KINDS) as ExtraKind[]).filter(
    (kind) => kind === "custom" || !resume.extras.some((e) => e.kind === kind),
  );

  return (
    <div className="space-y-4">
      <Card title="Personal info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={basics.name} onChange={(v) => setBasics({ name: v })} placeholder="Emily Carter" />
          <Field label="Job title" value={basics.title} onChange={(v) => setBasics({ title: v })} placeholder="Frontend Developer" />
          <Field
            label="Email"
            type="email"
            value={basics.email}
            onChange={(v) => setBasics({ email: v })}
            placeholder="you@example.com"
            warning={checkEmail(basics.email)}
          />
          <Field
            label="Phone"
            type="tel"
            value={basics.phone}
            onChange={(v) => setBasics({ phone: v })}
            placeholder="(512) 555-0142"
            warning={checkPhone(basics.phone)}
          />
          <Field label="Location" value={basics.location} onChange={(v) => setBasics({ location: v })} placeholder="Austin, TX" />
          <Field
            label="Links (LinkedIn, GitHub, portfolio)"
            value={basics.link}
            onChange={(v) => setBasics({ link: v })}
            placeholder="linkedin.com/in/you, github.com/you"
            warning={checkLink(basics.link)}
          />
        </div>
      </Card>

      {resume.order.map((key, index) => {
        const move = {
          index,
          count: resume.order.length,
          to: (to: number) => set({ order: moveItem(resume.order, index, to) }),
        };
        if (key in CORE_TITLES) {
          return (
            <Card key={key} title={sectionTitle(resume, key as CoreSection)} move={move}>
              {renderCore(key as CoreSection)}
            </Card>
          );
        }
        const section = resume.extras.find((e) => e.id === key);
        if (!section) return null;
        return (
          <Card key={key} title={section.title} move={move} onRemove={() => removeExtra(section.id)}>
            {renderExtra(section)}
          </Card>
        );
      })}

      <section className="rounded-lg border border-dashed border-border p-5">
        <h2 className="text-base font-bold">Add a section</h2>
        <p className="mt-1 text-sm text-muted">Empty sections are left off your resume.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {addable.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => addExtra(kind)}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
            >
              + {EXTRA_KINDS[kind].title}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
