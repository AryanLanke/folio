// Resume Score: one number out of 100, built only from checks the person can see and fix.
// Three parts: ATS readiness (can screening software read it?), writing (will a recruiter be
// convinced?) and, when a job is added, job match (does it cover what the job asks for?).

import { atsChecks } from "@/lib/ats";
import { BANNED_WORDS } from "@/lib/enhance";
import { matchResume } from "@/lib/jobmatch";
import { type Resume, hasExperience, hasProject, toLines, visibleSections } from "@/lib/resume";

export type ScoreItem = {
  label: string;
  // 0 to 1
  score: number;
  detail: string;
};

export type ScorePart = {
  key: "ats" | "writing" | "job";
  label: string;
  // 0 to 100
  score: number;
  weight: number;
  items: ScoreItem[];
};

export type ResumeScore = { total: number; parts: ScorePart[] };

// Words that make a weak start to a bullet, or show it's written in first person
const WEAK_START = /^(i|i'm|i've|my|we|our|responsible for|worked on|working on|helped|helping|assisted|duties included|tasks included|in charge of|involved in|did|done|was|were)\b/i;
const FIRST_PERSON = /\b(i|i'm|i've|me|my|mine)\b/i;

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
const share = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);
const quote = (text: string) => `"${text.length > 60 ? `${text.slice(0, 57)}…` : text}"`;

function allBullets(resume: Resume) {
  return [
    ...resume.experience.filter(hasExperience).flatMap((job) => toLines(job.bullets)),
    ...resume.projects.filter(hasProject).flatMap((project) => toLines(project.bullets)),
  ];
}

function writingItems(resume: Resume): ScoreItem[] {
  const bullets = allBullets(resume);
  const jobs = resume.experience.filter(hasExperience);
  const noBullets = bullets.length === 0;

  const weak = bullets.filter((b) => WEAK_START.test(b.trim()) || /^[a-z]/.test(b.trim()));
  const withNumbers = bullets.filter((b) => /\d/.test(b));
  const badLength = bullets.filter((b) => wordCount(b) < 4 || wordCount(b) > 35);
  const firstPerson = [...bullets, resume.summary].filter((t) => t.trim() && FIRST_PERSON.test(t));
  const text = [resume.summary, ...bullets].join(" ").toLowerCase();
  const buzzwords = BANNED_WORDS.filter((word) => new RegExp(`\\b${word.replace("-", "[- ]")}\\b`, "i").test(text));
  const summaryWords = wordCount(resume.summary);
  const thinJobs = jobs.filter((job) => toLines(job.bullets).length < 2);
  // "No I" and "No buzzwords" only count once there's writing to check
  const nothingWritten = noBullets && summaryWords === 0;

  return [
    {
      label: "Bullets start with a strong verb",
      score: noBullets ? 0 : 1 - share(weak.length, bullets.length),
      detail: noBullets
        ? "Add bullet points to your jobs or projects."
        : weak.length === 0
          ? "Every bullet opens with an action, like \"Built\" or \"Led\"."
          : `${weak.length} bullet${weak.length === 1 ? " starts" : "s start"} weakly, like ${quote(weak[0])}. Start with what you did ("Built", "Cut", "Led"). ✨ Enhance can rewrite it.`,
    },
    {
      label: "Results backed by numbers",
      // Full marks once half the bullets have a number
      score: noBullets ? 0 : Math.min(1, share(withNumbers.length, bullets.length) * 2),
      detail: noBullets
        ? "Add bullet points to your jobs or projects."
        : `${withNumbers.length} of ${bullets.length} bullets include a number. ${
            share(withNumbers.length, bullets.length) >= 0.5
              ? "Recruiters notice measurable results."
              : "Add real numbers where you know them: people, money, time saved, percentages."
          }`,
    },
    {
      label: "Bullets are easy to read",
      score: noBullets ? 0 : 1 - share(badLength.length, bullets.length),
      detail: noBullets
        ? "Add bullet points to your jobs or projects."
        : badLength.length === 0
          ? "Every bullet is a readable length."
          : `${badLength.length} bullet${badLength.length === 1 ? " is" : "s are"} too short or too long, like ${quote(badLength[0])}. Aim for one line, about 8 to 25 words.`,
    },
    {
      label: "No \"I\" or \"my\"",
      score: nothingWritten ? 0 : firstPerson.length === 0 ? 1 : Math.max(0, 1 - firstPerson.length * 0.25),
      detail: nothingWritten
        ? "Nothing to check yet. Write your summary and bullets first."
        : firstPerson.length === 0
          ? "Written in the usual resume style, without first person."
          : `Resumes usually leave out "I" and "my". Found in ${quote(firstPerson[0])}.`,
    },
    {
      label: "No buzzwords",
      score: nothingWritten ? 0 : Math.max(0, 1 - buzzwords.length * 0.25),
      detail: nothingWritten
        ? "Nothing to check yet. Write your summary and bullets first."
        : buzzwords.length === 0
          ? "No overused words that make resumes sound generic."
          : `Replace overused words with what you actually did: ${buzzwords.map((w) => `"${w}"`).join(", ")}.`,
    },
    {
      label: "Summary is short and specific",
      score: summaryWords === 0 ? 0 : summaryWords >= 20 && summaryWords <= 90 ? 1 : 0.5,
      detail:
        summaryWords === 0
          ? "Add a 2 to 3 sentence summary at the top: who you are and what you're best at."
          : summaryWords < 20
            ? "Your summary is very short. Add a sentence about your strongest results or skills."
            : summaryWords > 90
              ? "Your summary is long. Recruiters skim, so keep it to 2 or 3 sentences."
              : "A clear, 2 to 3 sentence summary.",
    },
    {
      label: "Each job has enough detail",
      score: jobs.length === 0 ? 0 : 1 - share(thinJobs.length, jobs.length),
      detail:
        jobs.length === 0
          ? "Add at least one job, internship or volunteer role."
          : thinJobs.length === 0
            ? "Every job has at least two bullet points."
            : `Add at least two bullets to ${thinJobs.map((j) => j.role || j.company || "a job").join(", ")}.`,
    },
  ];
}

const average = (items: ScoreItem[]) => Math.round((items.reduce((sum, i) => sum + i.score, 0) / items.length) * 100);

// Checks that pass only because there's nothing to check yet (no jobs means no bad dates)
// earn no points until there is something there
const NEEDS_CONTENT = new Set(["Job details", "Dates", "Section titles"]);

export function scoreResume(resume: Resume): ResumeScore {
  const hasContent = visibleSections(resume).length > 0;
  const atsItems: ScoreItem[] = atsChecks(resume).map((check) => {
    const vacuous = !hasContent && NEEDS_CONTENT.has(check.label);
    return {
      label: check.label,
      score: check.ok && !vacuous ? 1 : 0,
      detail: vacuous ? "Nothing to check yet. Add your experience and education first." : check.detail,
    };
  });
  const writing = writingItems(resume);

  const parts: ScorePart[] = [
    { key: "ats", label: "ATS readiness", score: average(atsItems), weight: 0.45, items: atsItems },
    { key: "writing", label: "Writing", score: average(writing), weight: 0.55, items: writing },
  ];

  if (resume.target.keywords.length > 0) {
    const match = matchResume(resume, resume.target.keywords);
    parts.forEach((part) => (part.weight = part.key === "ats" ? 0.35 : 0.4));
    parts.push({
      key: "job",
      label: "Job match",
      score: match.score,
      weight: 0.25,
      items: [
        {
          label: `Keywords for ${resume.target.title || "the job"}`,
          score: match.score / 100,
          detail:
            match.missing.length === 0
              ? "Your resume covers every keyword the job asks for."
              : `Missing: ${match.missing.join(", ")}. Add only the ones you really have.`,
        },
      ],
    });
  }

  const total = Math.round(parts.reduce((sum, part) => sum + part.score * part.weight, 0));
  return { total, parts };
}

export function scoreVerdict(total: number) {
  if (total >= 85) return "Excellent. This resume is ready to send.";
  if (total >= 70) return "Good. A few fixes below would make it stronger.";
  if (total >= 50) return "Fair. Fixing the items below will noticeably help.";
  return "Needs work. Start with the items marked below.";
}
