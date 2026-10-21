import { Packer } from "docx";
import { describe, expect, it } from "vitest";
import { coverLetterDocx, resumeDocx } from "@/lib/export/docx";
import { TEMPLATES, type TemplateName, createSampleResume } from "@/lib/resume";

// A .docx file is a zip; Word's text lives in word/document.xml. Pull the visible text out.
async function wordText(document: ReturnType<typeof resumeDocx>) {
  const buffer = await Packer.toBuffer(document);
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")!.async("string");
  return [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ");
}

describe("Word export", () => {
  for (const template of Object.keys(TEMPLATES) as TemplateName[]) {
    it(`${template}: contains every section and entry`, async () => {
      const resume = { ...createSampleResume(), style: { template, fontSize: "medium" as const, spacing: "normal" as const } };
      const text = await wordText(resumeDocx(resume, "letter"));
      expect(text).toContain("Jordan Patel");
      expect(text).toContain("jordan.patel@email.com");
      expect(text).toContain("Brightpath Software");
      expect(text).toContain("cutting page load time from 4.1s to 1.6s");
      expect(text).toContain("AWS Certified Cloud Practitioner");
      for (const heading of ["Summary", "Experience", "Projects", "Education", "Skills", "Certifications"]) {
        expect(text.toLowerCase()).toContain(heading.toLowerCase());
      }
    });
  }

  it("writes the cover letter paragraphs", async () => {
    const resume = createSampleResume();
    resume.coverLetter = "Dear Hiring Manager,\n\nI am applying for the role.\n\nSincerely,\nJordan Patel";
    const text = await wordText(coverLetterDocx(resume, "a4"));
    expect(text).toContain("Dear Hiring Manager,");
    expect(text).toContain("I am applying for the role.");
  });
});
