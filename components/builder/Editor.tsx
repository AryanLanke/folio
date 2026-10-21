"use client";

import {
  type Basics,
  type Education,
  type Experience,
  type Project,
  type Resume,
  newEducation,
  newExperience,
  newProject,
} from "@/lib/resume";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-neutral-600 outline-none transition-colors focus:border-accent";

function Field({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold text-muted">
        {label}
        {hint && <span className="font-normal text-neutral-500">{hint}</span>}
      </span>
      <textarea
        className={`${inputClass} resize-y leading-6`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-surface p-5">
      <h2 className="mb-4 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ItemControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const button =
    "rounded px-2 py-1 text-xs font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="flex gap-1">
      <button type="button" className={button} disabled={index === 0} onClick={() => onMove(index - 1)}>
        ↑ Up
      </button>
      <button type="button" className={button} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
        ↓ Down
      </button>
      <button type="button" className={`${button} hover:text-red-400`} onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md border border-dashed border-border py-2.5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
    >
      + {label}
    </button>
  );
}

// Shared list helpers for experience, education and projects
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

  const setExperience = (id: string, patch: Partial<Experience>) =>
    set({ experience: updateItem(resume.experience, id, patch) });
  const setEducation = (id: string, patch: Partial<Education>) =>
    set({ education: updateItem(resume.education, id, patch) });
  const setProject = (id: string, patch: Partial<Project>) =>
    set({ projects: updateItem(resume.projects, id, patch) });

  const { basics } = resume;

  return (
    <div className="space-y-4">
      <Card title="Personal info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={basics.name} onChange={(v) => setBasics({ name: v })} placeholder="Jordan Patel" />
          <Field label="Job title" value={basics.title} onChange={(v) => setBasics({ title: v })} placeholder="Frontend Developer" />
          <Field label="Email" value={basics.email} onChange={(v) => setBasics({ email: v })} placeholder="you@email.com" />
          <Field label="Phone" value={basics.phone} onChange={(v) => setBasics({ phone: v })} placeholder="(555) 123-4567" />
          <Field label="Location" value={basics.location} onChange={(v) => setBasics({ location: v })} placeholder="Austin, TX" />
          <Field label="LinkedIn or website" value={basics.link} onChange={(v) => setBasics({ link: v })} placeholder="linkedin.com/in/you" />
        </div>
      </Card>

      <Card title="Summary">
        <TextArea
          label="A few lines about you"
          hint="2–3 sentences"
          value={resume.summary}
          onChange={(v) => set({ summary: v })}
          placeholder="Frontend developer with 3 years of experience..."
        />
      </Card>

      <Card title="Experience">
        <div className="space-y-4">
          {resume.experience.map((item, index) => (
            <div key={item.id} className="rounded-md border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {item.role || item.company || `Job ${index + 1}`}
                </span>
                <ItemControls
                  index={index}
                  count={resume.experience.length}
                  onMove={(to) => set({ experience: moveItem(resume.experience, index, to) })}
                  onRemove={() => set({ experience: resume.experience.filter((e) => e.id !== item.id) }, true)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Job title" value={item.role} onChange={(v) => setExperience(item.id, { role: v })} />
                <Field label="Company" value={item.company} onChange={(v) => setExperience(item.id, { company: v })} />
                <Field label="Start" value={item.start} onChange={(v) => setExperience(item.id, { start: v })} placeholder="Jun 2023" />
                <Field label="End" value={item.end} onChange={(v) => setExperience(item.id, { end: v })} placeholder="Present" />
                <Field label="Location" value={item.location} onChange={(v) => setExperience(item.id, { location: v })} className="sm:col-span-2" />
              </div>
              <div className="mt-4">
                <TextArea
                  label="What you did"
                  hint="One bullet per line"
                  rows={5}
                  value={item.bullets}
                  onChange={(v) => setExperience(item.id, { bullets: v })}
                  placeholder={"Rebuilt the dashboard, cutting load time by 60%\nLed a team of 3 developers"}
                />
              </div>
            </div>
          ))}
          <AddButton label="Add job" onClick={() => set({ experience: [...resume.experience, newExperience()] })} />
        </div>
      </Card>

      <Card title="Projects">
        <div className="space-y-4">
          {resume.projects.map((item, index) => (
            <div key={item.id} className="rounded-md border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{item.name || `Project ${index + 1}`}</span>
                <ItemControls
                  index={index}
                  count={resume.projects.length}
                  onMove={(to) => set({ projects: moveItem(resume.projects, index, to) })}
                  onRemove={() => set({ projects: resume.projects.filter((p) => p.id !== item.id) }, true)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Project name" value={item.name} onChange={(v) => setProject(item.id, { name: v })} />
                <Field label="Link" value={item.link} onChange={(v) => setProject(item.id, { link: v })} placeholder="github.com/you/project" />
              </div>
              <div className="mt-4">
                <TextArea
                  label="What it is"
                  hint="One bullet per line"
                  rows={3}
                  value={item.bullets}
                  onChange={(v) => setProject(item.id, { bullets: v })}
                />
              </div>
            </div>
          ))}
          <AddButton label="Add project" onClick={() => set({ projects: [...resume.projects, newProject()] })} />
        </div>
      </Card>

      <Card title="Education">
        <div className="space-y-4">
          {resume.education.map((item, index) => (
            <div key={item.id} className="rounded-md border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {item.school || item.degree || `School ${index + 1}`}
                </span>
                <ItemControls
                  index={index}
                  count={resume.education.length}
                  onMove={(to) => set({ education: moveItem(resume.education, index, to) })}
                  onRemove={() => set({ education: resume.education.filter((e) => e.id !== item.id) }, true)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="School" value={item.school} onChange={(v) => setEducation(item.id, { school: v })} />
                <Field label="Degree" value={item.degree} onChange={(v) => setEducation(item.id, { degree: v })} placeholder="B.S. Computer Science" />
                <Field label="Start" value={item.start} onChange={(v) => setEducation(item.id, { start: v })} placeholder="2019" />
                <Field label="End" value={item.end} onChange={(v) => setEducation(item.id, { end: v })} placeholder="2023" />
                <Field label="Location" value={item.location} onChange={(v) => setEducation(item.id, { location: v })} />
                <Field label="Details" value={item.details} onChange={(v) => setEducation(item.id, { details: v })} placeholder="GPA, honors, coursework" />
              </div>
            </div>
          ))}
          <AddButton label="Add school" onClick={() => set({ education: [...resume.education, newEducation()] })} />
        </div>
      </Card>

      <Card title="Skills">
        <TextArea
          label="Your skills"
          hint="Separate with commas"
          rows={3}
          value={resume.skills}
          onChange={(v) => set({ skills: v })}
          placeholder="JavaScript, React, SQL, Figma"
        />
      </Card>
    </div>
  );
}
