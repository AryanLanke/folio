// The resume's sections in the PDF: the core ones (summary, jobs, projects, education, skills)
// and any added ones (certifications, awards, languages, ...).

import { Link, Text, View } from "@react-pdf/renderer";
import { pdfSafe } from "@/lib/export/text";
import { resumeLinks } from "@/lib/links";
import {
  EXTRA_KINDS,
  type ExtraSection,
  type Resume,
  hasEducation,
  hasExperience,
  hasExtraItem,
  hasProject,
  skillGroups,
  skillList,
} from "@/lib/resume";
import { Bullets, EntryLine, LINK, MUTED, PX, Rich } from "@/lib/export/pdf/shared";

export function Extra({ section }: { section: ExtraSection }) {
  const items = section.items.filter(hasExtraItem);
  if (section.kind === "languages") {
    return (
      <Text>
        <Rich text={items.map((i) => (i.subtitle ? `${i.title} (${i.subtitle})` : i.title)).join(", ")} />
      </Text>
    );
  }
  const fields = EXTRA_KINDS[section.kind];
  return items.map((item) => (
    <View key={item.id}>
      <EntryLine bold={item.title} rest={[item.subtitle]} start={fields.date ? item.date : ""} end="" />
      {fields.bullets && <Bullets text={item.bullets} />}
    </View>
  ));
}

export function Core({ resume, sectionKey }: { resume: Resume; sectionKey: string }) {
  switch (sectionKey) {
    case "summary":
      return (
        <Text>
          <Rich text={resume.summary} />
        </Text>
      );
    case "experience":
      return resume.experience.filter(hasExperience).map((job) => (
        <View key={job.id}>
          <View wrap={false}>
            <EntryLine bold={job.role} rest={[job.company, job.location]} start={job.start} end={job.end} />
          </View>
          <Bullets text={job.bullets} />
        </View>
      ));
    case "projects":
      return resume.projects.filter(hasProject).map((project) => (
        <View key={project.id}>
          {/* Name and links, with the date on the right; what it's built with below */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: "bold", color: "#0a0a0a" }}>
                <Rich text={project.name} />
              </Text>
              {project.link ? " — " : ""}
              {resumeLinks(project.link, resume.style.links).map((link, i) => (
                <Text key={i}>
                  {i > 0 ? ", " : ""}
                  <Link src={link.href} style={LINK}>
                    {pdfSafe(link.text)}
                  </Link>
                </Text>
              ))}
            </Text>
            {project.date ? (
              <Text style={{ color: MUTED }}>
                <Rich text={project.date} />
              </Text>
            ) : null}
          </View>
          {project.tech ? (
            <Text style={{ color: MUTED }}>
              <Rich text={project.tech} />
            </Text>
          ) : null}
          <Bullets text={project.bullets} />
        </View>
      ));
    case "education":
      // The degree in bold with the dates, then the school (and place) on the line below
      return resume.education.filter(hasEducation).map((school) => {
        const second = [school.degree ? school.school : "", school.location].filter(Boolean).join(" — ");
        return (
          <View key={school.id} wrap={false}>
            <EntryLine bold={school.degree || school.school} rest={[]} start={school.start} end={school.end} />
            {second ? (
              <Text>
                <Rich text={second} />
              </Text>
            ) : null}
            {school.details ? (
              <Text style={{ marginTop: 1 }}>
                <Rich text={school.details} />
              </Text>
            ) : null}
          </View>
        );
      });
    case "skills": {
      const groups = skillGroups(resume.skills);
      // As on the page: a plain list is one paragraph, however many lines it was typed on
      if (!groups.some((group) => group.label)) {
        return (
          <Text>
            <Rich text={skillList(resume.skills).join(", ")} />
          </Text>
        );
      }
      // Grouped skills: one line per group with its label in bold, set close together like on the
      // page (not spaced apart like separate jobs, which would make the PDF taller than the page)
      return (
        <View style={{ gap: 2 * PX }}>
          {groups.map((group, i) => (
            <Text key={i}>
              {group.label ? (
                <Text style={{ fontWeight: "bold", color: "#0a0a0a" }}>
                  <Rich text={`${group.label}: `} />
                </Text>
              ) : null}
              <Rich text={group.items.join(", ")} />
            </Text>
          ))}
        </View>
      );
    }
    default:
      return null;
  }
}
