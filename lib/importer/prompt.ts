// What the import asks the AI for: the limits on what it accepts, the JSON shape it fills in
// (shared with "Build with AI"), and the instructions.

import { PRESENT } from "@/lib/resume";

export const MAX_IMPORT_LENGTH = 15000;
// Largest file the import accepts; Vercel turns away request bodies over 4.5 MB before they arrive
export const MAX_IMPORT_FILE_BYTES = 4 * 1024 * 1024;

// The JSON the model fills in, shared with "Build with AI" so one parser reads both
export const RESUME_SHAPE = JSON.stringify({
  basics: { name: "", title: "", email: "", phone: "", location: "", link: "" },
  summary: "",
  experience: [{ role: "", company: "", location: "", start: "", end: "", bullets: [""] }],
  education: [{ school: "", degree: "", location: "", start: "", end: "", details: "" }],
  projects: [{ name: "", link: "", tech: "", date: "", bullets: [""] }],
  skills: [{ group: "", items: [""] }],
  certifications: [{ name: "", issuer: "", date: "" }],
  awards: [{ name: "", issuer: "", date: "" }],
  volunteering: [{ role: "", organization: "", dates: "", bullets: [""] }],
  languages: [{ language: "", level: "" }],
  other: [{ title: "", items: [{ name: "", detail: "", date: "", bullets: [""] }] }],
});

export function buildImportMessages(text: string) {
  const system = [
    "You convert the text of a resume into structured JSON. The text was extracted from a PDF or pasted, so line breaks and spacing may be messy.",
    "",
    "Rules:",
    "- Copy the person's wording exactly. Do not rewrite, improve, summarize or translate anything.",
    "- Never invent information. Use an empty string or empty list for anything not in the text.",
    "- Include every entry of every section; never skip one. That includes school-level education (Class X, Class XII, HSC, SSC, high school) even when no school name is given.",
    `- For a current job, set "end" to "${PRESENT}".`,
    "- Put each bullet point or achievement as its own item in \"bullets\", without bullet symbols. If one bullet's sentence carries on to the next line of the text, it's still one bullet: join it.",
    '- Split skills into individual items. If the resume groups its skills under labels (like "Languages:" or "Tools-"), keep each group with its label in "group"; otherwise use one group with an empty "group".',
    '- For each project, put the line of tools or technologies it was built with in "tech", and its date or date range in "date".',
    '- Every section of the resume must end up somewhere. A section that fits none of the others (for example achievements, open source, publications, extracurricular activities) goes in "other", with its heading as "title". An entry with a name goes in "name" (details in "detail" and "bullets"); a single line with no name of its own goes in "name" by itself. Jobs, internships, projects, education, skills and certifications always go in their own lists, never in "other".',
    '- Put only the person\'s own profile links in basics "link", separated by commas: LinkedIn, their GitHub profile (github.com/username), portfolio, LeetCode and similar.',
    '- A link to one repository, demo or project (like github.com/username/project-name) goes in that project\'s "link", never in basics. Separate several with commas.',
    "- List each link only once.",
    "- Ignore page numbers, headers and footers.",
    "",
    "Respond with JSON only, in exactly this shape:",
    RESUME_SHAPE,
  ].join("\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Resume text:\n<<<\n${text}\n>>>` },
  ];
}
