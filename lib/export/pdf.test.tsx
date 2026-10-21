import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { extractText } from "unpdf";
import { describe, expect, it } from "vitest";
import { CoverLetterDocument, ResumeDocument } from "@/lib/export/pdf";
import { type Resume, TEMPLATES, type TemplateName, createSampleResume } from "@/lib/resume";

// Reads the PDF back the way ATS software does: as plain text
async function readBack(element: React.ReactElement<DocumentProps>) {
  const buffer = await renderToBuffer(element);
  const { text, totalPages } = await extractText(new Uint8Array(buffer), { mergePages: true });
  return { text: text.replace(/\s+/g, " "), totalPages };
}

describe("resume PDF", () => {
  for (const template of Object.keys(TEMPLATES) as TemplateName[]) {
    it(`${template}: text is extractable, in order, on one page`, async () => {
      const resume: Resume = { ...createSampleResume(), style: { template, fontSize: "medium", spacing: "normal" } };
      const { text, totalPages } = await readBack(ResumeDocument({ resume, paper: "letter" }));

      expect(totalPages).toBe(1);
      expect(text).toContain("Jordan Patel");
      expect(text).toContain("jordan.patel@email.com");
      expect(text).toContain("cutting page load time from 4.1s to 1.6s");
      expect(text).toContain("AWS Certified Cloud Practitioner");

      const headings = ["SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS", "CERTIFICATIONS"];
      const positions = headings.map((h) => text.toUpperCase().indexOf(h));
      expect(positions.every((p) => p >= 0)).toBe(true);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });
  }

  it("spills onto a second page when there is too much content", async () => {
    const resume = createSampleResume();
    resume.experience[0].bullets = Array.from({ length: 60 }, (_, i) => `Delivered project number ${i + 1}`).join("\n");
    const { totalPages } = await readBack(ResumeDocument({ resume, paper: "a4" }));
    expect(totalPages).toBeGreaterThan(1);
  });

  it("replaces characters the PDF fonts can't draw", async () => {
    const resume = createSampleResume();
    resume.summary = "Managed a ₹40 lakh budget";
    const { text } = await readBack(ResumeDocument({ resume, paper: "a4" }));
    expect(text).toContain("Rs. 40 lakh");
  });
});

describe("cover letter PDF", () => {
  it("contains the name and every paragraph", async () => {
    const resume = createSampleResume();
    resume.coverLetter = "Dear Hiring Manager,\n\nI am applying for the role.\n\nSincerely,\nJordan Patel";
    const { text } = await readBack(CoverLetterDocument({ resume, paper: "letter" }));
    expect(text).toContain("Dear Hiring Manager,");
    expect(text).toContain("I am applying for the role.");
    expect(text.match(/Jordan Patel/g)?.length).toBe(2);
  });
});
