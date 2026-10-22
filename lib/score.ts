// Resume Score: one number out of 100, built only from checks the person can see and fix.
// Up to three parts: the ATS check (can screening software read it, and does it rank and read
// well?), writing style (does it sound like a person, not a template?) and, when a job is
// added, job match (does it cover what the job asks for?).

import { allBullets, atsChecks, atsScore, quote, share } from "@/lib/ats";
import { BANNED_WORDS } from "@/lib/enhance";
import { matchResume } from "@/lib/jobmatch";
import { type Resume, hasExperience, toLines } from "@/lib/resume";

export type ScoreItem = {
  label: string;
  // 0 to 1
  score: number;
  detail: string;
  // What to do about it, when it isn't passing
  fix?: string | null;
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

const FIRST_PERSON = /\b(i|i'm|i've|me|my|mine)\b/i;

// Bullet verbs, numbers, length and the summary are part of the ATS check, so they aren't
// counted twice here
function writingItems(resume: Resume): ScoreItem[] {
  const bullets = allBullets(resume);
  const jobs = resume.experience.filter(hasExperience);
  const firstPerson = [...bullets, resume.summary].filter((t) => t.trim() && FIRST_PERSON.test(t));
  const text = [resume.summary, ...bullets].join(" ").toLowerCase();
  const buzzwords = BANNED_WORDS.filter((word) => new RegExp(`\\b${word.replace("-", "[- ]")}\\b`, "i").test(text));
  const thinJobs = jobs.filter((job) => toLines(job.bullets).length < 2);
  // "No I" and "No buzzwords" only count once there's writing to check
  const nothingWritten = bullets.length === 0 && !resume.summary.trim();
  const nothingYet = "Nothing to check yet. Write your summary and bullets first.";

  return [
    {
      label: 'No "I" or "my"',
      score: nothingWritten ? 0 : firstPerson.length === 0 ? 1 : Math.max(0, 1 - firstPerson.length * 0.25),
      detail: nothingWritten
        ? nothingYet
        : firstPerson.length === 0
          ? "Written in the usual resume style, without first person."
          : `Found in ${quote(firstPerson[0])}.`,
      fix: 'Resumes usually leave out "I" and "my": write "Built the dashboard", not "I built the dashboard".',
    },
    {
      label: "No buzzwords",
      score: nothingWritten ? 0 : Math.max(0, 1 - buzzwords.length * 0.25),
      detail: nothingWritten
        ? nothingYet
        : buzzwords.length === 0
          ? "No overused words that make resumes sound generic."
          : `Found ${buzzwords.map((w) => `"${w}"`).join(", ")}.`,
      fix: "Replace overused words with what you actually did and what changed because of it.",
    },
    {
      label: "Each job has enough detail",
      score: jobs.length === 0 ? 0 : 1 - share(thinJobs.length, jobs.length),
      detail:
        jobs.length === 0
          ? "No jobs yet."
          : thinJobs.length === 0
            ? "Every job has at least two bullet points."
            : `${thinJobs.map((j) => j.role || j.company || "A job").join(", ")} ${thinJobs.length === 1 ? "has" : "have"} fewer than two bullets.`,
      fix:
        jobs.length === 0
          ? "Add at least one job, internship or volunteer role."
          : "Give every job at least two bullets: what you worked on, and a result.",
    },
  ].map((item) => ({ ...item, fix: item.score >= 0.999 ? null : item.fix }));
}

const average = (items: ScoreItem[]) => Math.round((items.reduce((sum, i) => sum + i.score, 0) / items.length) * 100);

export function scoreResume(resume: Resume): ResumeScore {
  const checks = atsChecks(resume);
  const writing = writingItems(resume);

  const parts: ScorePart[] = [
    { key: "ats", label: "ATS check", score: atsScore(checks), weight: 0.7, items: checks },
    { key: "writing", label: "Writing style", score: average(writing), weight: 0.3, items: writing },
  ];

  if (resume.target.keywords.length > 0) {
    const match = matchResume(resume, resume.target.keywords);
    parts[0].weight = 0.55;
    parts[1].weight = 0.2;
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
              : `Missing: ${match.missing.join(", ")}.`,
          fix: match.missing.length === 0 ? null : "Add the ones you really have, using the job's exact wording. Never add skills you don't have.",
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
