import { Packer } from "docx";
import { describe, expect, it } from "vitest";
import { coverLetterDocx, resumeDocx } from "@/lib/export/docx";
import { TEMPLATES, type TemplateName, createSampleResume } from "@/lib/resume";

// A .docx file is a zip; Word's text and formatting live in word/document.xml
async function wordXml(document: ReturnType<typeof resumeDocx>) {
  const buffer = await Packer.toBuffer(document);
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  return zip.file("word/document.xml")!.async("string");
}

// The visible text of the Word file
async function wordText(document: ReturnType<typeof resumeDocx>) {
  const xml = await wordXml(document);
  return [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ");
}

describe("Word export", () => {
  it("sets the name in capitals and in serif where the template does, keeping the real spelling", async () => {
    const xml = (template: TemplateName) => {
      const sample = createSampleResume();
      return wordXml(resumeDocx({ ...sample, style: { ...sample.style, template } }, "letter"));
    };
    const academic = await xml("academic");
    expect(academic).toContain("<w:caps/>");
    expect(academic).toContain(">Emily Carter<");
    expect(await xml("classic")).not.toContain("<w:caps/>");
    expect(await xml("elegant")).toContain("Georgia");
    expect(await xml("minimal")).not.toContain("Georgia");
  });

  for (const template of Object.keys(TEMPLATES) as TemplateName[]) {
    it(`${template}: contains every section and entry`, async () => {
      const sample = createSampleResume();
      const resume = { ...sample, style: { ...sample.style, template } };
      const text = await wordText(resumeDocx(resume, "letter"));
      expect(text).toContain("Emily Carter");
      expect(text).toContain("emily.carter@example.com");
      expect(text).toContain("Brightpath Software");
      expect(text).toContain("cutting page load time from 4.1s to 1.6s");
      expect(text).toContain("AWS Certified Cloud Practitioner");
      for (const heading of ["Summary", "Experience", "Projects", "Education", "Skills", "Certifications"]) {
        expect(text.toLowerCase()).toContain(heading.toLowerCase());
      }
    });
  }

  it("puts the degree and dates in one paragraph and the school in the next", async () => {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await Packer.toBuffer(resumeDocx(createSampleResume(), "letter")));
    const xml = await zip.file("word/document.xml")!.async("string");
    const paragraphs = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((p) =>
      [...p[0].matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(""),
    );
    const degree = paragraphs.findIndex((p) => p.startsWith("B.S. Computer Science"));
    expect(paragraphs[degree]).toContain("2019 – 2023");
    expect(paragraphs[degree]).not.toContain("University of Texas");
    expect(paragraphs[degree + 1]).toBe("University of Texas at Austin — Austin, TX");
  });

  it("shows link labels that open the full address", async () => {
    const document = resumeDocx(createSampleResume(), "letter");
    const text = await wordText(document);
    expect(text).toContain("LinkedIn");
    expect(text).not.toContain("linkedin.com/in");
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await Packer.toBuffer(resumeDocx(createSampleResume(), "letter")));
    const rels = await zip.file("word/_rels/document.xml.rels")!.async("string");
    expect(rels).toContain('Target="https://linkedin.com/in/emily-carter-example"');
    expect(rels).toContain('Target="https://github.com/emily-carter-example/budget-buddy"');
  });

  it("writes the cover letter paragraphs", async () => {
    const resume = createSampleResume();
    resume.coverLetter = "Dear Hiring Manager,\n\nI am applying for the role.\n\nSincerely,\nEmily Carter";
    const text = await wordText(coverLetterDocx(resume, "a4"));
    expect(text).toContain("Dear Hiring Manager,");
    expect(text).toContain("I am applying for the role.");
  });
});
