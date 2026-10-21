// Cover letters written from the resume itself, so every claim comes from the person's own facts.

import { resumeToPlainText } from "@/lib/ats";
import { BANNED_WORDS } from "@/lib/enhance";
import type { Resume } from "@/lib/resume";

export type CoverLetterRequest = {
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
  company: string;
};

export function coverLetterRequest(resume: Resume): CoverLetterRequest {
  return {
    resumeText: resumeToPlainText(resume),
    jobDescription: resume.target.description,
    jobTitle: resume.target.title,
    company: resume.target.company,
  };
}

export function validateCoverLetter(body: unknown): CoverLetterRequest | null {
  if (!body || typeof body !== "object") return null;
  const src = body as Record<string, unknown>;
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const request = {
    resumeText: text(src.resumeText, 12000),
    jobDescription: text(src.jobDescription, 8000),
    jobTitle: text(src.jobTitle, 120),
    company: text(src.company, 120),
  };
  return request.resumeText.length >= 50 ? request : null;
}

export function buildCoverLetterMessages(request: CoverLetterRequest) {
  const target = [
    request.jobTitle && `Role: ${request.jobTitle}`,
    request.company && `Company: ${request.company}`,
  ]
    .filter(Boolean)
    .join("\n");

  const system = [
    "You write cover letters for working professionals, using only facts from their resume.",
    "",
    "Rules:",
    "- Every claim must come from the resume. Never invent experience, numbers, skills, motivations or details about the company.",
    "- Don't embellish: never add how often something happened, how big it was, who used it or what effect it had unless the resume says so. Write \"built dashboards for 40 store managers\", not \"built dashboards used daily by 40 store managers\".",
    "- 3 or 4 short paragraphs, 220 to 320 words in total.",
    "- Open with the role being applied for. Connect 2 or 3 of the most relevant achievements to what the job needs. Close with a simple, confident request for an interview.",
    "- Plain, warm, professional English, the way a capable person writes. Vary sentence length.",
    `- Never use these words: ${BANNED_WORDS.join(", ")}.`,
    "- No placeholders in brackets. If the company name is unknown, don't mention one.",
    '- Start with "Dear Hiring Manager," and end with "Sincerely," followed by the person\'s name from the resume.',
    "- Before answering, check every sentence against the resume. Delete any detail that the resume doesn't state, such as data sizes, what results were used for, or who benefited. Fewer, true sentences are better than more, embellished ones.",
    "",
    'Respond with JSON only, in exactly this shape: {"paragraphs": ["Dear Hiring Manager,", "...", "Sincerely,\\nName"]}',
  ].join("\n");

  const job = request.jobDescription ? `Job posting:\n<<<\n${request.jobDescription}\n>>>\n\n` : "";
  const user = `${target ? `${target}\n\n` : ""}${job}Resume:\n<<<\n${request.resumeText}\n>>>`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

// Second pass: a strict editor removes anything the draft added that the resume doesn't say.
// Models are far better at striking unsupported claims than at not writing them.
export function buildFactCheckMessages(resumeText: string, letter: string) {
  const system = [
    "You fact-check cover letters against the resume they were written from.",
    "",
    "Remove or rewrite every phrase that states something the resume does not, including:",
    "- how often, how much or how large something was (\"daily\", \"large data sets\", \"millions\")",
    "- who used or benefited from the work, or what it was used for (\"for the pricing team\", \"to monitor KPIs\")",
    "- outcomes, responsibilities, methods, tools or skills that aren't in the resume",
    "- claimed qualities (\"attention to detail\", \"strong communicator\") that the resume doesn't show",
    "",
    "Keep: the greeting, the sign-off, mentions of the role and company, statements of interest, and every claim the resume supports.",
    "Change as little as possible. Don't add anything new. Keep the paragraph structure.",
    "",
    'Respond with JSON only, in exactly this shape: {"paragraphs": ["Dear Hiring Manager,", "...", "Sincerely,\\nName"]}',
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Resume:\n<<<\n${resumeText}\n>>>\n\nCover letter to check:\n<<<\n${letter}\n>>>` },
  ];
}

export function parseCoverLetter(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
    const paragraphs = (Array.isArray(data?.paragraphs) ? data.paragraphs : [])
      .filter((p: unknown): p is string => typeof p === "string")
      .map((p: string) => p.trim())
      .filter(Boolean);
    if (paragraphs.length < 2) return null;
    return paragraphs
      .join("\n\n")
      // The greeting and sign-off get their own paragraphs even when the model glues them on
      .replace(/^(Dear [^,\n]{1,60},)[ \t]*(?=\S)/, "$1\n\n")
      .replace(/[ \t]*\n?[ \t]*(Sincerely,|Regards,|Best regards,|Kind regards,)[ \t]*\n?[ \t]*/g, "\n\n$1\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .replace(/[‐‑‒−]/g, "-")
      .replace(/[   ]/g, " ")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"');
  } catch {
    return null;
  }
}
