"use client";

import EnhanceTextArea from "@/components/builder/EnhanceTextArea";
import EducationSection from "@/components/builder/editor/EducationSection";
import ExperienceSection from "@/components/builder/editor/ExperienceSection";
import ExtraSectionEditor from "@/components/builder/editor/ExtraSectionEditor";
import PersonalInfo from "@/components/builder/editor/PersonalInfo";
import ProjectsSection from "@/components/builder/editor/ProjectsSection";
import { type SectionProps, moveItem } from "@/components/builder/editor/shared";
import { Card, TextArea } from "@/components/builder/fields";
import {
  CORE_TITLES,
  type CoreSection,
  EXTRA_KINDS,
  type ExtraKind,
  type Resume,
  newExtraSection,
  sectionTitle,
} from "@/lib/resume";

// The form on the left of the editor: personal info, then every section in the page's order, each
// in a card that folds shut and moves up or down. Each kind of section has its own file in editor/.
export default function Editor({
  resume,
  onChange,
}: {
  resume: Resume;
  // checkpoint marks big changes (like removing a job) that Undo should be able to reverse
  onChange: (resume: Resume, checkpoint?: boolean) => void;
}) {
  const set: SectionProps["set"] = (patch, checkpoint = false) => onChange({ ...resume, ...patch }, checkpoint);
  // Job keywords from Job match, so AI wording leans toward the target job
  const focus = resume.target.keywords.length > 0 ? resume.target.keywords : undefined;
  const props = { resume, set, focus };

  const addExtra = (kind: ExtraKind) => {
    const section = newExtraSection(kind);
    set({ extras: [...resume.extras, section], order: [...resume.order, section.id] });
  };

  const removeExtra = (id: string) =>
    set(
      { extras: resume.extras.filter((e) => e.id !== id), order: resume.order.filter((key) => key !== id) },
      true,
    );

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
        return <ExperienceSection {...props} />;
      case "projects":
        return <ProjectsSection {...props} />;
      case "education":
        return <EducationSection {...props} />;
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

  // Single-use kinds (certifications, awards, ...) are offered only until added; custom can repeat
  const addable = (Object.keys(EXTRA_KINDS) as ExtraKind[]).filter(
    (kind) => kind === "custom" || !resume.extras.some((e) => e.kind === kind),
  );

  return (
    <div className="space-y-4">
      <PersonalInfo basics={resume.basics} setBasics={(patch) => set({ basics: { ...resume.basics, ...patch } })} />

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
            <ExtraSectionEditor {...props} section={section} />
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
              className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent-ink"
            >
              + {EXTRA_KINDS[kind].title}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
