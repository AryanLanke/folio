// "Enhance with AI": polishes text the user already wrote. It may fix grammar and wording,
// but must never add facts. Shared by the server route and the editor.

export type EnhanceKind = "summary" | "bullets";

// Ways to enhance. "polish" is the first pass; the others refine a suggestion further.
export const ENHANCE_STYLES = {
  polish: { label: "✨ Polish", instruction: "" },
  shorter: {
    label: "Shorter",
    instruction: "Make it noticeably shorter and tighter. Cut filler words and repetition, but keep every fact.",
  },
  impact: {
    label: "More impact",
    instruction:
      "Make it more impactful: lead with the result or the strongest action, and put any numbers early. Only use results and numbers that are in the original.",
  },
  formal: { label: "More formal", instruction: "Use a more formal, corporate tone suitable for large companies and senior roles." },
  simple: {
    label: "Simpler words",
    instruction: "Use simpler, everyday English words and shorter sentences that anyone can read quickly.",
  },
  another: {
    label: "↻ Another version",
    instruction: "Write a noticeably different version from the current one: different structure and word choices, same facts.",
  },
} as const;

export type EnhanceStyle = keyof typeof ENHANCE_STYLES;

export type EnhanceRequest = {
  kind: EnhanceKind;
  // The person's own text: the only source of facts
  text: string;
  style?: EnhanceStyle;
  // The latest suggestion, when refining it further
  previous?: string;
  // Job title and company, so wording fits the role
  role?: string;
  // Current jobs read better in present tense
  current?: boolean;
  // Keywords from the job being applied for, so existing experience uses the job's wording
  focus?: string[];
};

export type EnhanceResult = {
  lines: string[];
  // A short question when a number would make the text stronger, e.g. "How many users?"
  tip: string | null;
};

export const MAX_INPUT_LENGTH = 2000;
// Shared by every AI action (enhance, job match, import, cover letter)
export const DAILY_LIMIT = 15;
// Model ids per provider; override either with the AI_MODEL environment variable
export const DEFAULT_MODEL = "anthropic/claude-haiku-5.5";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
// Smaller model tried when the main one is busy; Groq rate-limits each model separately
export const DEFAULT_GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";

// Words that make resumes sound machine-written
export const BANNED_WORDS = [
  "spearheaded", "leveraged", "leverage", "utilized", "utilize", "synergy", "results-driven",
  "dynamic", "passionate", "orchestrated", "cutting-edge", "robust", "seamless", "seamlessly",
  "delve", "innovative", "go-getter", "team player", "detail-oriented", "proven track record",
];

// "Helped make the site faster" must not become "Improved site performance": that claims the
// work alone. Shared with the "Build with AI" draft, which writes bullets the same way.
export const INVOLVEMENT_RULE =
  'Keep how involved the person was. If they helped, assisted, supported or were part of a team, the wording must still say so, starting with a verb like "Contributed to", "Supported", "Partnered with" or "Worked with the team to" (not "Helped" or "Assisted", which read as weak). Never turn it into sole credit or a leading role ("Improved", "Led", "Coordinated", "Drove", "Owned").';

export function validateRequest(body: unknown): EnhanceRequest | string {
  if (!body || typeof body !== "object") return "Missing request body.";
  const src = body as Record<string, unknown>;
  if (src.kind !== "summary" && src.kind !== "bullets") return "Unknown text type.";
  if (typeof src.text !== "string" || !src.text.trim()) return "There's no text to enhance.";
  if (src.text.length > MAX_INPUT_LENGTH) return `Text is too long (max ${MAX_INPUT_LENGTH} characters).`;
  const style = typeof src.style === "string" && src.style in ENHANCE_STYLES ? (src.style as EnhanceStyle) : "polish";
  const previous =
    typeof src.previous === "string" && src.previous.trim() ? src.previous.trim().slice(0, MAX_INPUT_LENGTH) : undefined;
  return {
    kind: src.kind,
    text: src.text.trim(),
    style,
    previous,
    role: typeof src.role === "string" ? src.role.slice(0, 200) : undefined,
    current: src.current === true,
    focus: Array.isArray(src.focus)
      ? src.focus.filter((k): k is string => typeof k === "string" && k.trim() !== "").map((k) => k.slice(0, 60)).slice(0, 25)
      : undefined,
  };
}

export function buildMessages(request: EnhanceRequest) {
  const shape =
    request.kind === "bullets"
      ? `The text is a list of resume bullet points, one per line. Return the same number of bullets in the same order, one per item in "lines". Start each with a strong, ordinary action verb in ${request.current ? "present" : "past"} tense. No first person (I, my, we). No bullet symbols. No period at the end.`
      : `The text is a professional summary. Return it as a single item in "lines". Use implied first person (no "I"), confident and plain, under 70 words.`;

  const restyle = request.style && request.style !== "polish" ? ENHANCE_STYLES[request.style].instruction : "";

  const system = [
    "You polish resume text for working professionals. The person wrote it themselves; make it read as if a skilled human editor improved it.",
    ...(restyle
      ? [
          "",
          `YOUR MAIN TASK: ${restyle} The result must read clearly different from the current version, while following every rule below.`,
        ]
      : []),
    "",
    "Rules:",
    "- Keep every fact exactly as given. Never add, remove or change numbers, dates, names, companies, tools, skills or achievements. Never invent metrics.",
    `- ${INVOLVEMENT_RULE}`,
    "- Fix grammar, spelling and punctuation. Make the wording clear, specific and concise.",
    `- Write naturally and plainly. Never use these words: ${BANNED_WORDS.join(", ")}.`,
    `- ${shape}`,
    '- If the text would be stronger with a number the person did not give (how many people, how much time saved), ask for it in "tip" as one short question. Otherwise set "tip" to null. Never put made-up numbers in the text.',
    ...(request.focus?.length
      ? [
          `- This is for a job that looks for: ${request.focus.join(", ")}. Where the text already shows one of these, use the job's exact wording for it. Never add a skill, tool or experience that is not already in the text.`,
        ]
      : []),
    ...(request.previous
      ? [
          "- You are refining the current version below. Facts may only come from the original text; if the current version contains anything the original doesn't say, remove it.",
        ]
      : []),
    "",
    'Respond with JSON only, in exactly this shape: {"lines": ["..."], "tip": "..." or null}',
  ].join("\n");

  const context = request.role ? `Role: ${request.role}\n\n` : "";
  const user = request.previous
    ? `${context}Original text (the only source of facts):\n<<<\n${request.text}\n>>>\n\nCurrent version to refine:\n<<<\n${request.previous}\n>>>${restyle ? `\n\nRewrite the current version. ${restyle}` : ""}`
    : `${context}Text to polish:\n<<<\n${request.text}\n>>>${restyle ? `\n\n${restyle}` : ""}`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

// Models sometimes write look-alike characters (non-breaking hyphens, curly quotes, special
// spaces) that some ATS parsers misread, so convert them to plain ones
export function plainCharacters(text: string) {
  return text
    .replace(/[‐‑‒−]/g, "-")
    .replace(/[   ]/g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

// Strips bullet symbols and wrapping quotes the model sometimes adds
function cleanLine(line: string) {
  return plainCharacters(line)
    .trim()
    .replace(/^[•\-*–]\s*/, "")
    .replace(/^"(.*)"$/, "$1")
    .trim();
}

export function parseResult(raw: unknown, kind: EnhanceKind): EnhanceResult | null {
  if (typeof raw !== "string") return null;
  let data: unknown;
  try {
    // Some models wrap JSON in a ```json code fence
    data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const src = data as Record<string, unknown>;

  const rawLines = Array.isArray(src.lines) ? src.lines : typeof src.lines === "string" ? [src.lines] : [];
  let lines = rawLines
    .filter((line): line is string => typeof line === "string")
    .flatMap((line) => line.split("\n"))
    .map(cleanLine)
    .filter(Boolean);
  if (lines.length === 0) return null;
  if (kind === "summary") lines = [lines.join(" ")];

  const tip = typeof src.tip === "string" && src.tip.trim() ? src.tip.trim().slice(0, 200) : null;
  return { lines, tip };
}

// Daily allowance kept in the browser as {"day": "2026-10-21", "count": 3}
export function usesLeft(saved: string | null, today: string) {
  try {
    const data = saved ? JSON.parse(saved) : null;
    const count = data?.day === today && typeof data.count === "number" ? data.count : 0;
    return Math.max(0, DAILY_LIMIT - count);
  } catch {
    return DAILY_LIMIT;
  }
}

export function recordUse(saved: string | null, today: string) {
  const used = DAILY_LIMIT - usesLeft(saved, today);
  return JSON.stringify({ day: today, count: used + 1 });
}
