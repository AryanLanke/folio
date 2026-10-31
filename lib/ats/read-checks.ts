// Checks for whether screening software can read the resume at all: contact details, work
// history, education, dates, bullet formatting, skills and section titles.

import { type CheckDraft, quote, share } from "@/lib/ats/check";
import { allBullets, brokenBulletLines, bulletFields } from "@/lib/ats/bullets";
import {
  type CoreSection,
  PRESENT,
  type Resume,
  hasEducation,
  hasExperience,
  hasExtraItem,
  hasProject,
  skillList,
  visibleSections,
} from "@/lib/resume";
import { checkDate, checkEmail, checkPhone, parseDate } from "@/lib/validate";

// "Jun 2023" and "June 2023" are different styles; "May" fits both, so it's left out
function dateStyle(value: string): string | null {
  const text = value.trim();
  if (!text || text.toLowerCase() === PRESENT.toLowerCase() || parseDate(text) === null) return null;
  if (/^\d{4}$/.test(text)) return "year only";
  if (/^\d{1,2}[/\-.]\d{4}$/.test(text)) return "month number first";
  if (/^\d{4}[/\-.]\d{1,2}$/.test(text)) return "year first";
  const month = text.split(/\s+/)[0].replace(/\.$/, "").toLowerCase();
  if (month === "may") return null;
  return month.length <= 3 || month === "sept" ? "short month" : "full month";
}

// The first example of each style used, when there's more than one style
function mixedStyles(dates: string[]) {
  const examples = new Map<string, string>();
  for (const date of dates) {
    const style = dateStyle(date);
    if (style && !examples.has(style)) examples.set(style, date.trim());
  }
  return examples.size > 1 ? [...examples.values()] : [];
}

// Headings screening software files under each section. A renamed section outside these may
// not be recognised, so its content can end up in the wrong place or be skipped.
const STANDARD_TITLES: Record<CoreSection, string[]> = {
  summary: ["summary", "professional summary", "career summary", "profile", "professional profile", "objective", "career objective", "about me"],
  experience: ["experience", "work experience", "professional experience", "relevant experience", "employment", "employment history", "work history", "internships", "internship experience"],
  projects: ["projects", "personal projects", "academic projects", "key projects", "selected projects", "relevant projects"],
  education: ["education", "academic background", "education and training", "qualifications"],
  skills: ["skills", "technical skills", "core skills", "key skills", "core competencies", "skills and tools", "tools and technologies"],
};

// Renamed core sections whose new name isn't a standard heading, as they appear on the page
function unusualTitles(resume: Resume) {
  return visibleSections(resume)
    .filter((section) => !section.extra && !STANDARD_TITLES[section.key as CoreSection].includes(section.title.trim().toLowerCase()))
    .map((section) => section.title);
}

export function readChecks(resume: Resume): CheckDraft[] {
  const { basics } = resume;
  const jobs = resume.experience.filter(hasExperience);
  const schools = resume.education.filter(hasEducation);
  const projects = resume.projects.filter(hasProject);
  // Checks that would pass only because there's nothing to check yet earn no points
  const empty = visibleSections(resume).length === 0;
  const nothingYet = "Nothing to check yet. Add your experience and education first.";

  const dates = [...jobs.flatMap((job) => [job.start, job.end]), ...schools.flatMap((school) => [school.start, school.end])];
  const filledDates = dates.filter((date) => date.trim());
  const badDates = filledDates.filter((date) => checkDate(date) !== null);
  const incompleteJobs = jobs.filter((job) => !job.role.trim() || !job.company.trim() || !job.start.trim());
  const mixedJobDates = mixedStyles(jobs.flatMap((job) => [job.start, job.end]));
  const mixedSchoolDates = mixedStyles(schools.flatMap((school) => [school.start, school.end]));
  const mixed = mixedJobDates.length > 0 ? mixedJobDates : mixedSchoolDates;
  const bulletCount = allBullets(resume).length;
  const broken = bulletFields(resume).flatMap(brokenBulletLines);
  const skillCount = skillList(resume.skills).length;
  const untitled = resume.extras.filter((e) => e.items.some(hasExtraItem) && !e.title.trim());
  const unusual = unusualTitles(resume);
  const emailProblem = basics.email.trim() ? checkEmail(basics.email) : null;
  const phoneProblem = basics.phone.trim() ? checkPhone(basics.phone) : null;
  const incompleteSchool = schools.find((s) => !s.school.trim() || !s.degree.trim() || !s.end.trim());
  const missingSchoolParts = incompleteSchool
    ? [!incompleteSchool.degree.trim() && "degree", !incompleteSchool.school.trim() && "school", !incompleteSchool.end.trim() && "end year"]
        .filter(Boolean)
        .join(" and ")
    : "";

  return [
    {
      label: "Name",
      group: "read",
      weight: 2,
      score: basics.name.trim() ? 1 : 0,
      detail: basics.name.trim() ? "Found at the top." : "No name at the top.",
      fix: "Add your full name. The ATS uses it to create your candidate profile.",
    },
    {
      label: "Email",
      group: "read",
      weight: 2,
      score: basics.email.trim() && !emailProblem ? 1 : 0,
      detail: !basics.email.trim() ? "No email address." : (emailProblem ?? "Found and readable."),
      fix: "Add an email address you check, like firstname.lastname@gmail.com.",
    },
    {
      label: "Phone",
      group: "read",
      weight: 1,
      score: basics.phone.trim() && !phoneProblem ? 1 : 0,
      detail: !basics.phone.trim() ? "No phone number." : (phoneProblem ?? "Found and readable."),
      fix: "Add a phone number, with the country code if you're applying abroad. Many ATS forms require one.",
    },
    {
      label: "Work history",
      group: "read",
      weight: 2,
      score: jobs.length > 0 || projects.length > 0 ? 1 : 0,
      detail:
        jobs.length > 0 || projects.length > 0
          ? `${jobs.length} job${jobs.length === 1 ? "" : "s"} and ${projects.length} project${projects.length === 1 ? "" : "s"} found.`
          : "No jobs or projects.",
      fix: "Add at least one job, internship or project. Without one, the ATS has no experience to match against the job.",
    },
    {
      label: "Education",
      group: "read",
      weight: 3,
      score: schools.length === 0 ? 0 : incompleteSchool ? 0.6 : 1,
      detail:
        schools.length === 0
          ? "No education section."
          : incompleteSchool
            ? `${incompleteSchool.degree || incompleteSchool.school} is missing its ${missingSchoolParts}.`
            : `${schools.length === 1 ? "Your entry has" : "Every entry has"} a degree, school and year.`,
      fix:
        schools.length === 0
          ? "Add your highest degree or course, the school, and the year you finished (or expect to finish). Many ATS filters screen candidates by degree."
          : "Fill in the degree, school and end year. Still studying? Put the year you expect to finish.",
    },
    {
      label: "Job details",
      group: "read",
      weight: 1.5,
      score: empty ? 0 : 1 - share(incompleteJobs.length, jobs.length),
      detail: empty
        ? nothingYet
        : incompleteJobs.length === 0
          ? "Every job has a title, company and start date."
          : `${incompleteJobs.map((j) => j.role || j.company || "A job").join(", ")} ${incompleteJobs.length === 1 ? "is" : "are"} missing a title, company or start date.`,
      fix: "Give every job a title, a company and a start date. The ATS uses them to build your work timeline.",
    },
    {
      label: "Dates",
      group: "read",
      weight: 1.5,
      score: empty ? 0 : 1 - share(badDates.length, filledDates.length),
      detail: empty
        ? nothingYet
        : badDates.length === 0
          ? "Every date is in a format the ATS can read."
          : `Can't read ${badDates.map((d) => `"${d}"`).join(", ")}.`,
      fix: 'Write dates like "Jun 2023" or "2023", and "Present" for a current job.',
    },
    {
      label: "Consistent date format",
      group: "read",
      weight: 1,
      score: empty ? 0 : mixed.length > 0 ? 0.5 : 1,
      detail: empty
        ? nothingYet
        : mixed.length > 0
          ? `Your ${mixedJobDates.length > 0 ? "jobs" : "education"} mix date styles: ${mixed.map((d) => `"${d}"`).join(" and ")}.`
          : "Dates use one style within each section.",
      fix: 'Pick one style, like "Jun 2023", and use it for every date in the section. Mixed styles can make the ATS misread how long you worked somewhere.',
    },
    {
      label: "Bullet formatting",
      group: "read",
      weight: 3,
      score: empty || bulletCount === 0 ? 0 : Math.max(0, 1 - share(broken.length, bulletCount) * 2),
      detail:
        empty || bulletCount === 0
          ? "No bullet points yet."
          : broken.length === 0
            ? "Every bullet is one clean line."
            : `${broken.length} of ${bulletCount} lines look broken, like ${broken.slice(0, 2).map(quote).join(" and ")}.`,
      fix:
        bulletCount === 0
          ? "Add bullet points to your jobs and projects."
          : "Put each bullet on its own line, and don't type \"•\" or \"-\" yourself: Folio adds the bullet. If a sentence was split over two lines (often from copying a PDF), join it back into one.",
    },
    {
      label: "Skills",
      group: "read",
      weight: 1,
      score: skillCount >= 6 ? 1 : skillCount >= 3 ? 0.6 : 0,
      detail: skillCount === 0 ? "No skills listed." : `${skillCount} skill${skillCount === 1 ? "" : "s"} listed.`,
      fix: 'List at least 6 skills and tools, named the way job postings name them (like "Power BI" or "React"). Recruiters search the ATS for them.',
    },
    {
      label: "Section titles",
      group: "read",
      weight: 0.5,
      score: empty || untitled.length > 0 ? 0 : unusual.length > 0 ? 0.6 : 1,
      detail: empty
        ? nothingYet
        : untitled.length > 0
          ? "A section has no title."
          : unusual.length > 0
            ? `${unusual.map((title) => `"${title}"`).join(" and ")} ${unusual.length === 1 ? "isn't a heading" : "aren't headings"} most ATS software looks for.`
            : "Every section has a title the ATS will recognise.",
      fix:
        untitled.length > 0
          ? 'Give every section a plain title like "Certifications", so the ATS knows what it is.'
          : 'Use a common heading, like "Summary" or "Profile", "Work Experience", "Projects", "Education" and "Skills". Click a heading on the page to rename it.',
    },
  ];
}
