// Job match: AI reads a job posting once and lists what it asks for; matching against the
// resume then happens in the browser, instantly, every time the resume changes.

import { resumeToPlainText } from "@/lib/ats";
import type { Resume } from "@/lib/resume";

export const MAX_JOB_LENGTH = 8000;
const MAX_KEYWORDS = 25;

export type JobAnalysis = { title: string; company: string; keywords: string[] };

export function validateJob(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const text = (body as Record<string, unknown>).description;
  if (typeof text !== "string" || text.trim().length < 50) return null;
  return text.trim().slice(0, MAX_JOB_LENGTH);
}

export function buildJobMessages(description: string) {
  const system = [
    "You read job postings the way an applicant tracking system (ATS) does.",
    "",
    `List the ${MAX_KEYWORDS} or fewer most important terms a recruiter would search resumes for: hard skills, tools, technologies, certifications, qualifications and key domain terms.`,
    "- Use the exact wording from the posting (keep capitalization, like \"Power BI\" or \"Node.js\").",
    "- Keep each term short: 1 to 4 words.",
    "- Most important first.",
    "- Leave out generic soft skills and filler (\"team player\", \"communication\", \"fast-paced\", \"passionate\") and anything about benefits or the company itself.",
    "",
    'Respond with JSON only, in exactly this shape: {"title": "job title", "company": "company name or empty string", "keywords": ["..."]}',
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Job posting:\n<<<\n${description}\n>>>` },
  ];
}

export function parseJobAnalysis(raw: unknown): JobAnalysis | null {
  if (typeof raw !== "string") return null;
  let data: unknown;
  try {
    data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const src = data as Record<string, unknown>;
  const seen = new Set<string>();
  const keywords = (Array.isArray(src.keywords) ? src.keywords : [])
    .filter((k): k is string => typeof k === "string")
    // "Python (pandas)" is really two things a resume might list separately
    .flatMap((k) => {
      const match = k.match(/^(.+?)\s*\((.+)\)$/);
      return match ? [match[1], ...match[2].split(/,|\bor\b|\//)] : [k];
    })
    .map((k) => k.trim())
    .filter((k) => k.length > 0 && k.length <= 60)
    .filter((k) => {
      const key = normalizeTerm(k);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_KEYWORDS);
  if (keywords.length === 0) return null;
  return {
    title: typeof src.title === "string" ? src.title.trim().slice(0, 120) : "",
    company: typeof src.company === "string" ? src.company.trim().slice(0, 120) : "",
    keywords,
  };
}

// Lowercase, with punctuation turned into spaces, but keeping characters that matter
// in tech terms (C++, C#, .NET)
export function normalizeTerm(text: string) {
  return text
    .toLowerCase()
    .replace(/\.net\b/g, " dotnet")
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// A term counts as present if it appears as whole words, ignoring punctuation, spacing
// ("Node.js" = "NodeJS") and a plural "s"
export function containsTerm(normalizedText: string, term: string) {
  const normalized = normalizeTerm(term);
  if (!normalized) return false;
  const padded = ` ${normalizedText} `;
  const variants = new Set([normalized, normalized.replace(/s$/, ""), `${normalized}s`]);
  for (const variant of variants) {
    if (variant && padded.includes(` ${variant} `)) return true;
  }
  // Spacing differences: "nodejs" vs "node js". Join up to three neighbouring whole words,
  // so a term never matches inside a longer word ("Java" in "JavaScript")
  const compact = normalized.replace(/ /g, "");
  const words = normalizedText.split(" ");
  for (let i = 0; i < words.length; i++) {
    let joined = "";
    for (let j = i; j < Math.min(i + 3, words.length); j++) {
      joined += words[j];
      if (joined === compact) return true;
      if (joined.length >= compact.length) break;
    }
  }
  return false;
}

export type MatchResult = { score: number; matched: string[]; missing: string[] };

export function matchResume(resume: Resume, keywords: string[]): MatchResult {
  const text = normalizeTerm(resumeToPlainText(resume));
  const matched = keywords.filter((k) => containsTerm(text, k));
  const missing = keywords.filter((k) => !matched.includes(k));
  const score = keywords.length === 0 ? 0 : Math.round((matched.length / keywords.length) * 100);
  return { score, matched, missing };
}
