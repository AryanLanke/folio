// "Tell AI about yourself": a short chat where AI asks about someone's work, then writes a
// resume from what they said. Every fact comes from the person; the AI only organizes and words it.

import { BANNED_WORDS, INVOLVEMENT_RULE } from "@/lib/enhance";
import { PRESENT } from "@/lib/resume";

export type ChatTurn = { role: "assistant" | "user"; content: string };

export const MAX_TURNS = 40;
const MAX_TURN_LENGTH = 4000;
const MAX_TOTAL_LENGTH = 24000;

export const OPENING =
  "Hi! I'll help you build your resume. Tell me about yourself in your own words: your name, what you do now, where you've worked before, your education, any certificates, and your skills. Type or tap the mic and just talk. Messy is fine, I'll organize it.";

export function validateChat(body: unknown): ChatTurn[] | null {
  if (!body || typeof body !== "object") return null;
  const turns = (body as Record<string, unknown>).messages;
  if (!Array.isArray(turns) || turns.length === 0 || turns.length > MAX_TURNS) return null;
  const clean = turns
    .filter((t): t is Record<string, unknown> => Boolean(t) && typeof t === "object")
    .filter((t) => (t.role === "assistant" || t.role === "user") && typeof t.content === "string")
    .map((t) => ({ role: t.role as ChatTurn["role"], content: (t.content as string).slice(0, MAX_TURN_LENGTH) }));
  const total = clean.reduce((sum, t) => sum + t.content.length, 0);
  if (!clean.some((t) => t.role === "user" && t.content.trim()) || total > MAX_TOTAL_LENGTH) return null;
  return clean;
}

function transcript(turns: ChatTurn[]) {
  return turns.map((t) => `${t.role === "user" ? "Person" : "Assistant"}: ${t.content}`).join("\n\n");
}

export function buildInterviewMessages(turns: ChatTurn[]) {
  const system = [
    "You are Folio's friendly resume assistant. You are interviewing someone so a resume can be written for them. Many people find this hard, so be warm, brief and encouraging, in simple English.",
    "",
    "Find out, roughly in this order, whatever is still missing:",
    "1. Name, and optionally email, phone and city (never insist on contact details)",
    "2. Their current or most recent job: title, company, rough dates, what they do day to day, and results they're proud of (numbers if they know them)",
    "3. Earlier jobs, the same way",
    "4. Education",
    "5. Certificates, awards, languages",
    "6. Skills and tools",
    "",
    "Rules:",
    "- Ask one or two short questions at a time. Briefly acknowledge what they shared before asking.",
    "- Accept how people describe themselves: \"I work as a software tester\" already gives the job title. Don't ask for an \"exact\" title, exact dates or other precision they didn't offer.",
    "- Never ask the same question twice. If something wasn't answered, move on to the next topic.",
    "- When they mention a job, ask for a concrete achievement or number once, but accept \"I don't know\" and move on.",
    "- Never invent or assume facts, and don't write the resume in the chat.",
    "- Set \"ready\" to true as soon as you know their name and at least one job or their education. While ready, end your message by saying they can press \"Create my resume\" now or keep adding details.",
    "- If they say they're done, or everything above is covered, set ready to true and thank them.",
    "",
    'Respond with JSON only, in exactly this shape: {"reply": "...", "ready": true or false}',
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Conversation so far:\n<<<\n${transcript(turns)}\n>>>\n\nWrite the assistant's next message.` },
  ];
}

export function parseInterviewReply(raw: unknown): { reply: string; ready: boolean } | null {
  if (typeof raw !== "string") return null;
  try {
    const data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
    const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
    return reply ? { reply: reply.slice(0, 1500), ready: data.ready === true } : null;
  } catch {
    return null;
  }
}

// Same JSON shape as resume import, so the same parser turns it into a Folio resume
const RESUME_SHAPE = JSON.stringify({
  basics: { name: "", title: "", email: "", phone: "", location: "", link: "" },
  summary: "",
  experience: [{ role: "", company: "", location: "", start: "", end: "", bullets: [""] }],
  education: [{ school: "", degree: "", location: "", start: "", end: "", details: "" }],
  projects: [{ name: "", link: "", bullets: [""] }],
  skills: [""],
  certifications: [{ name: "", issuer: "", date: "" }],
  awards: [{ name: "", issuer: "", date: "" }],
  volunteering: [{ role: "", organization: "", dates: "", bullets: [""] }],
  languages: [{ language: "", level: "" }],
});

export function buildDraftMessages(turns: ChatTurn[]) {
  const system = [
    "You turn a conversation into a professional resume for a working professional.",
    "",
    "Rules:",
    "- Use only facts the person stated. Never invent numbers, dates, companies, job titles, degrees, skills, tools or achievements. Leave anything they didn't say empty.",
    "- Turn what they said about each job into 2 to 5 clear, concise resume bullets that start with strong, ordinary action verbs (past tense for old jobs, present tense for the current one). Fix grammar and spelling.",
    "- Don't embellish: no added frequencies, sizes, audiences or outcomes that they didn't mention.",
    `- ${INVOLVEMENT_RULE}`,
    `- For the current job, set "end" to "${PRESENT}". Write dates the way they said them, for example "Jun 2021" or "2019".`,
    "- Every job needs a role. Use how they described their work as the job title, in Title Case: \"I work as a software tester\" becomes \"Software Tester\", an internship becomes \"Intern\". Don't upgrade titles (no \"Senior\" or \"Lead\" unless they said so).",
    "- \"title\" at the top is the job title they have now or are aiming for, worded the same way.",
    "- Write a 2 to 3 sentence summary from their own facts, in implied first person (no \"I\").",
    "- Put each skill or tool they mentioned as its own item.",
    '- Put every profile link they gave (LinkedIn, GitHub, portfolio) in basics "link", separated by commas.',
    `- Plain, natural English. Never use these words: ${BANNED_WORDS.join(", ")}.`,
    "",
    "Respond with JSON only, in exactly this shape:",
    RESUME_SHAPE,
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Conversation:\n<<<\n${transcript(turns)}\n>>>` },
  ];
}

// Second pass: strike anything the draft states that the person never said
export function buildDraftCheckMessages(turns: ChatTurn[], draftJson: string) {
  const system = [
    "You fact-check a resume against the conversation it was written from.",
    "",
    "Remove or rewrite anything the person did not say, including invented numbers, dates, tools, skills, outcomes, and added details about how often, how much or for whom.",
    "Also rewrite any bullet that gives the person more credit than they described: if they said they helped or were part of a team, the bullet must say so, not \"Led\", \"Coordinated\" or \"Improved\" on their own.",
    "Job titles written from how they described their work are supported (\"I'm a tester\" supports \"Software Tester\"; an internship supports \"Intern\"), but not upgraded ones like \"Senior\" or \"Lead\".",
    "Keep everything the conversation supports, and keep the professional wording. Don't add anything new.",
    "",
    "Respond with the corrected resume as JSON only, in exactly the same shape as the input.",
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    {
      role: "user" as const,
      content: `Conversation:\n<<<\n${transcript(turns)}\n>>>\n\nResume to check:\n<<<\n${draftJson}\n>>>`,
    },
  ];
}
