// What applicant tracking systems (Workday, Greenhouse, Taleo, ...) get out of the PDF:
// plain text in reading order. Also a checklist of what they need to parse it well.

import {
  EXTRA_KINDS,
  PRESENT,
  type Resume,
  hasEducation,
  hasExperience,
  hasExtraItem,
  hasProject,
  toLines,
  toList,
  visibleSections,
} from "@/lib/resume";
import { checkDate, checkEmail, checkPhone, parseDate } from "@/lib/validate";
import { contactItems, resumeLinks, splitLinks } from "@/lib/links";

// True when links show as labels, so ATS software (which reads visible text) won't see the addresses
export function linksHiddenFromAts(resume: Resume) {
  if (resume.style.links !== "label") return false;
  return splitLinks(resume.basics.link).length > 0 || resume.projects.some((p) => splitLinks(p.link).length > 0);
}

function joinParts(parts: string[], separator = " | ") {
  return parts.map((part) => part.trim()).filter(Boolean).join(separator);
}

function dateRange(start: string, end: string) {
  return joinParts([start, end], " – ");
}

function bullets(text: string) {
  return toLines(text).map((line) => `• ${line}`);
}

export function resumeToPlainText(resume: Resume): string {
  const { basics } = resume;
  const lines: string[] = [];

  if (basics.name.trim()) lines.push(basics.name.trim().toUpperCase());
  if (basics.title.trim()) lines.push(basics.title.trim());
  // The visible text only: with short link labels, ATS software sees "LinkedIn", not the address
  const contact = joinParts(contactItems(basics, resume.style.links).map((item) => item.text));
  if (contact) lines.push(contact);

  for (const section of visibleSections(resume)) {
    lines.push("", section.title.toUpperCase());

    if (section.extra) {
      const items = section.extra.items.filter(hasExtraItem);
      if (section.extra.kind === "languages") {
        lines.push(items.map((i) => (i.subtitle ? `${i.title} (${i.subtitle})` : i.title)).join(", "));
        continue;
      }
      const fields = EXTRA_KINDS[section.extra.kind];
      for (const item of items) {
        lines.push(joinParts([item.title, item.subtitle, fields.date ? item.date : ""]));
        if (fields.bullets) lines.push(...bullets(item.bullets));
      }
      continue;
    }

    switch (section.key) {
      case "summary":
        lines.push(resume.summary.trim());
        break;
      case "experience":
        for (const job of resume.experience.filter(hasExperience)) {
          lines.push(joinParts([job.role, job.company, job.location, dateRange(job.start, job.end)]));
          lines.push(...bullets(job.bullets));
        }
        break;
      case "projects":
        for (const project of resume.projects.filter(hasProject)) {
          lines.push(joinParts([project.name, ...resumeLinks(project.link, resume.style.links).map((link) => link.text)]));
          lines.push(...bullets(project.bullets));
        }
        break;
      case "education":
        for (const school of resume.education.filter(hasEducation)) {
          lines.push(joinParts([school.degree, school.school, school.location, dateRange(school.start, school.end)]));
          if (school.details.trim()) lines.push(school.details.trim());
        }
        break;
      case "skills":
        lines.push(toList(resume.skills).join(", "));
        break;
    }
  }

  return lines.join("\n").trim();
}

// ATS check: everything screening software needs to read the resume, and what makes it rank
// and read well once it has. Each check scores 0 to 1 and carries a weight, so a resume with
// real gaps can't reach a full score just by having the basics.

export type CheckStatus = "pass" | "warn" | "fail";

export type AtsCheck = {
  label: string;
  // "read": can the software parse it? "content": will it rank and convince once parsed?
  group: "read" | "content";
  // 0 to 1
  score: number;
  weight: number;
  status: CheckStatus;
  detail: string;
  // What to do about it, when it isn't passing
  fix: string | null;
};

// Full marks pass; under half is a problem to fix; anything between is a warning
export function statusOf(score: number): CheckStatus {
  if (score >= 0.999) return "pass";
  return score < 0.5 ? "fail" : "warn";
}

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
export const share = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);
export const quote = (text: string) => `"${text.length > 60 ? `${text.slice(0, 57)}…` : text}"`;

function bulletFields(resume: Resume) {
  return [
    ...resume.experience.filter(hasExperience).map((job) => job.bullets),
    ...resume.projects.filter(hasProject).map((project) => project.bullets),
    ...resume.extras.flatMap((extra) =>
      EXTRA_KINDS[extra.kind].bullets ? extra.items.filter(hasExtraItem).map((item) => item.bullets) : [],
    ),
  ];
}

// Every bullet on the page: jobs, projects, and extra sections that have bullets
export function allBullets(resume: Resume) {
  return bulletFields(resume).flatMap(toLines);
}

// Folio draws the bullet itself, so a typed "•" or "-" shows up twice
const TYPED_BULLET = /^[•\-*–—▪●◦‣·]/;
// Two bullets that ended up on one line ("... dashboards • Cut report time ...")
const JOINED_BULLETS = /\s[•▪●◦‣]\s/;
// A line ending mid-phrase means the sentence carries on in the next line
const ENDS_MID_PHRASE = /([,\-–(/&]|\b(and|or|to|with|for|of|in|the|a|an|on|by|using|via|from|at|into|as))$/i;
// True when a line ends mid-phrase, so the sentence must carry on in the next line
export const continuesLine = (line: string) => ENDS_MID_PHRASE.test(line.trim().replace(/\.$/, ""));
// Lowercase tools that can start a real bullet
const LOWERCASE_TOOLS = /^(npm|pandas|numpy|pytest|webpack|git)\b/;

// True when a line carries on the sentence of the line before it: the one before ends
// mid-phrase, or this one is a short lowercase fragment ("platform using FastAPI.")
function continuesFrom(previous: string, line: string) {
  const shortLowercase =
    /^[a-z]+\b/.test(line) && !LOWERCASE_TOOLS.test(line) && !/^i\b/.test(line) && wordCount(line) < 8;
  return continuesLine(previous) || shortLowercase;
}

// Lines that look broken: typed bullet symbols, two bullets in one line, or a sentence split
// across lines (usually from copying a PDF, which breaks lines where the page ran out)
export function brokenBulletLines(text: string) {
  const lines = toLines(text);
  return lines.filter(
    (line, i) => TYPED_BULLET.test(line) || JOINED_BULLETS.test(line) || (i > 0 && continuesFrom(lines[i - 1], line)),
  );
}

// "Fix automatically": the problems brokenBulletLines finds, fixed. Two bullets on one line are
// split apart, typed bullet symbols are removed, and split sentences are joined back together.
export function fixBulletText(text: string) {
  const pieces = toLines(text)
    .flatMap((line) => line.split(JOINED_BULLETS))
    .map((line) => line.replace(/^([•\-*–—▪●◦‣·]\s*)+/, "").trim())
    .filter(Boolean);
  const fixed: string[] = [];
  for (const line of pieces) {
    const previous = fixed.at(-1);
    if (previous !== undefined && continuesFrom(previous, line)) fixed[fixed.length - 1] = `${previous} ${line}`;
    else fixed.push(line);
  }
  return fixed.join("\n");
}

// The same fix for every bullet in the resume: jobs, projects and extra sections with bullets
export function fixBulletFormatting(resume: Resume): Resume {
  return {
    ...resume,
    experience: resume.experience.map((job) => ({ ...job, bullets: fixBulletText(job.bullets) })),
    projects: resume.projects.map((project) => ({ ...project, bullets: fixBulletText(project.bullets) })),
    extras: resume.extras.map((extra) =>
      EXTRA_KINDS[extra.kind].bullets
        ? { ...extra, items: extra.items.map((item) => ({ ...item, bullets: fixBulletText(item.bullets) })) }
        : extra,
    ),
  };
}

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

const WEAK_START =
  /^(i|i'm|i've|my|we|our|responsible for|worked on|working on|helped|helping|assisted|duties included|tasks included|in charge of|involved in|did|done|was|were)\b/i;
const GENERIC_SUMMARY =
  /\b(hard[- ]?working|motivated|passionate|team player|detail[- ]oriented|go[- ]getter|results[- ]driven|seeking an?|looking for an?|challenging (role|position|environment)|opportunity to (grow|learn)|quick learner|fresher)\b/i;

type Draft = Omit<AtsCheck, "status" | "fix"> & { fix: string };

function readChecks(resume: Resume): Draft[] {
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
  const skillCount = toList(resume.skills).length;
  const untitled = resume.extras.filter((e) => e.items.some(hasExtraItem) && !e.title.trim());
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
      score: empty ? 0 : untitled.length === 0 ? 1 : 0,
      detail: empty ? nothingYet : untitled.length === 0 ? "Every section has a title." : "A section has no title.",
      fix: 'Give every section a plain title like "Certifications", so the ATS knows what it is.',
    },
  ];
}

function contentChecks(resume: Resume): Draft[] {
  const bullets = allBullets(resume);
  const noBullets = bullets.length === 0;
  const addBullets = "Add bullet points to your jobs and projects.";
  const weak = bullets.filter((b) => WEAK_START.test(b) || /^[a-z]/.test(b));
  const withNumbers = bullets.filter((b) => /\d/.test(b));
  const tooShort = bullets.filter((b) => wordCount(b) < 6);
  const tooLong = bullets.filter((b) => wordCount(b) > 30);
  const summary = resume.summary.trim();
  const summaryWords = wordCount(summary);
  const generic = summary.match(GENERIC_SUMMARY)?.[0];
  const summaryScore = summaryWords === 0 ? 0 : (summaryWords < 20 ? 0.5 : summaryWords > 90 ? 0.7 : 1) * (generic ? 0.6 : 1);
  const summaryNotes = [
    summaryWords > 0 && summaryWords < 20 && `Only ${summaryWords} words, about one line.`,
    summaryWords > 90 && `${summaryWords} words, longer than recruiters read.`,
    generic && `"${generic}" is a phrase almost every resume uses.`,
  ].filter(Boolean);

  return [
    {
      label: "Summary",
      group: "content",
      weight: 2,
      score: summaryScore,
      detail: summaryWords === 0 ? "No summary." : summaryNotes.join(" ") || "Two or three specific sentences.",
      fix: 'Write 2 to 3 sentences, about 25 to 60 words: what you do, your strongest skills for this kind of job, and one concrete result. Swap vague words like "hardworking" for facts.',
    },
    {
      label: "Strong action verbs",
      group: "content",
      weight: 1.5,
      score: noBullets ? 0 : 1 - share(weak.length, bullets.length),
      detail: noBullets
        ? "No bullet points yet."
        : weak.length === 0
          ? 'Every bullet opens with an action, like "Built" or "Led".'
          : `${weak.length} of ${bullets.length} bullets start weakly, like ${quote(weak[0])}.`,
      fix: noBullets
        ? addBullets
        : 'Start each bullet with what you did: "Built", "Cut", "Designed", or "Contributed to" for team work. ✨ Enhance can rewrite it.',
    },
    {
      label: "Numbers and results",
      group: "content",
      weight: 1.5,
      // Full marks once half the bullets have a number
      score: noBullets ? 0 : Math.min(1, share(withNumbers.length, bullets.length) * 2),
      detail: noBullets ? "No bullet points yet." : `${withNumbers.length} of ${bullets.length} bullets include a number.`,
      fix: noBullets
        ? addBullets
        : "Add real numbers where you know them: users or people, money or time saved, percentages, team size. Aim for at least half your bullets.",
    },
    {
      label: "Bullet length",
      group: "content",
      weight: 1,
      score: noBullets ? 0 : 1 - share(tooShort.length + tooLong.length, bullets.length),
      detail: noBullets
        ? "No bullet points yet."
        : tooShort.length + tooLong.length === 0
          ? "Every bullet is 6 to 30 words."
          : [
              tooShort.length > 0 && `${tooShort.length} too short, like ${quote(tooShort[0])}.`,
              tooLong.length > 0 && `${tooLong.length} too long, like ${quote(tooLong[0])}.`,
            ]
              .filter(Boolean)
              .join(" "),
      fix: noBullets
        ? addBullets
        : "Aim for one line each, about 10 to 25 words: what you did, how, and the result. Split long bullets in two, and add the how or the result to short ones.",
    },
  ];
}

export function atsChecks(resume: Resume): AtsCheck[] {
  return [...readChecks(resume), ...contentChecks(resume)].map((check) => {
    const status = statusOf(check.score);
    return { ...check, status, fix: status === "pass" ? null : check.fix };
  });
}

// One number out of 100, weighted so the checks that matter most count most
export function atsScore(checks: AtsCheck[]) {
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  return Math.round((checks.reduce((sum, check) => sum + check.score * check.weight, 0) / total) * 100);
}
