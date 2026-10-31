// Checks for how well the resume will rank and read once the software has it: the summary,
// action verbs, numbers and bullet length.

import { type CheckDraft, quote, share } from "@/lib/ats/check";
import { allBullets, wordCount } from "@/lib/ats/bullets";
import type { Resume } from "@/lib/resume";

const WEAK_START =
  /^(i|i'm|i've|my|we|our|responsible for|worked on|working on|helped|helping|assisted|duties included|tasks included|in charge of|involved in|did|done|was|were)\b/i;
const GENERIC_SUMMARY =
  /\b(hard[- ]?working|motivated|passionate|team player|detail[- ]oriented|go[- ]getter|results[- ]driven|seeking an?|looking for an?|challenging (role|position|environment)|opportunity to (grow|learn)|quick learner|fresher)\b/i;

export function contentChecks(resume: Resume): CheckDraft[] {
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
        : 'Start each bullet with what you did: "Built", "Cut", "Designed", or "Contributed to" for team work. Enhance with AI can rewrite it.',
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
