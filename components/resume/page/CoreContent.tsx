import Editable from "@/components/resume/Editable";
import Bullets from "@/components/resume/page/Bullets";
import { EntryLine, type Field, WebLinks, markProps, none, patch, text } from "@/components/resume/page/fields";
import type { ChangedLines } from "@/lib/optimize";
import { type Resume, hasEducation, hasExperience, hasProject, skillGroups, skillList, skillsText } from "@/lib/resume";

type ContentProps = {
  resume: Resume;
  // Saves a change to the resume, when the page is editable
  set?: (change: Partial<Resume>) => void;
  changed?: ChangedLines;
};

// The entries of one of the standard sections: summary, experience, projects, education, skills
export default function CoreContent({ sectionKey, ...props }: ContentProps & { sectionKey: string }) {
  const { resume, set, changed } = props;
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
    case "experience":
      return <Experience {...props} />;
    case "projects":
      return <Projects {...props} />;
    case "education":
      return <Education {...props} />;
    case "skills":
      return <Skills {...props} />;
    default:
      return null;
  }
}

function Experience({ resume, set, changed }: ContentProps) {
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

// Name and links, with the date on the right; what it's built with on the line below
function Projects({ resume, set, changed }: ContentProps) {
  const save = (id: string, key: "name" | "tech" | "date" | "bullets") =>
    set && ((next: string) => set({ projects: patch(resume.projects, id, { [key]: next }) }));
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

// The degree in bold with the dates, then the school (and place) on the line below
function Education({ resume, set }: ContentProps) {
  const save = (id: string, key: "degree" | "school" | "location" | "start" | "end" | "details") =>
    set && ((next: string) => set({ education: patch(resume.education, id, { [key]: next }) }));
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

function Skills({ resume, set }: ContentProps) {
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
