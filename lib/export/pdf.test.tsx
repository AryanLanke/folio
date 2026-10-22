import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { extractLinks, extractText, getDocumentProxy } from "unpdf";
import { describe, expect, it } from "vitest";
import { CoverLetterDocument, ResumeDocument } from "@/lib/export/pdf";
import { type Resume, TEMPLATES, type TemplateName, createSampleResume } from "@/lib/resume";
import { layoutFor } from "@/lib/templates";

// Reads the PDF back the way ATS software does: as plain text
async function readBack(element: React.ReactElement<DocumentProps>) {
  const buffer = await renderToBuffer(element);
  const { text, totalPages } = await extractText(new Uint8Array(buffer), { mergePages: true });
  return { text: text.replace(/\s+/g, " "), totalPages };
}

// How far down the first page each line starting with these words is, in points
async function lineTops(element: React.ReactElement<DocumentProps>, starts: string[]) {
  const pdf = await getDocumentProxy(new Uint8Array(await renderToBuffer(element)));
  const page = await pdf.getPage(1);
  const { items } = await page.getTextContent();
  return starts.map((start) => {
    const item = items.find((i) => "str" in i && i.str.startsWith(start));
    return item && "transform" in item ? page.view[3] - item.transform[5] : NaN;
  });
}

describe("resume PDF", () => {
  for (const template of Object.keys(TEMPLATES) as TemplateName[]) {
    it(`${template}: text is extractable, in order, on one page`, async () => {
      const sample = createSampleResume();
      const resume: Resume = { ...sample, style: { ...sample.style, template } };
      const { text, totalPages } = await readBack(ResumeDocument({ resume, paper: "letter" }));

      expect(totalPages).toBe(1);
      // Some templates set the name in capitals
      expect(text.toLowerCase()).toContain("emily carter");
      expect(text).toContain("emily.carter@example.com");
      expect(text).toContain("cutting page load time from 4.1s to 1.6s");
      expect(text).toContain("AWS Certified Cloud Practitioner");

      const headings = ["SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS", "CERTIFICATIONS"];
      const positions = headings.map((h) => text.toUpperCase().indexOf(h));
      expect(positions.every((p) => p >= 0)).toBe(true);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });
  }

  it("puts the degree and dates on one line and the school on the next", async () => {
    const buffer = await renderToBuffer(ResumeDocument({ resume: createSampleResume(), paper: "letter" }));
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const lines = text.split("\n").map((line) => line.trim());
    const degree = lines.findIndex((line) => line.startsWith("B.S. Computer Science"));
    expect(lines[degree]).toMatch(/B\.S\. Computer Science.*2019 – 2023/);
    expect(lines[degree]).not.toContain("University of Texas");
    expect(lines[degree + 1]).toBe("University of Texas at Austin — Austin, TX");
  });

  it("shows a project's date and what it's built with, and skill groups on their own lines", async () => {
    const resume = createSampleResume();
    resume.skills = "Languages: C++, Python\nTools: Git, Docker";
    const buffer = await renderToBuffer(ResumeDocument({ resume, paper: "letter" }));
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const lines = text.split("\n").map((line) => line.trim());
    const project = lines.findIndex((line) => line.startsWith("Budget Buddy"));
    expect(lines[project]).toContain("2024");
    expect(lines[project + 1]).toBe("Next.js, PostgreSQL");
    expect(lines).toContain("Languages: C++, Python");
    expect(lines).toContain("Tools: Git, Docker");
  });

  it("sets skill groups close together, like on the page, so the PDF isn't taller than the preview", async () => {
    const resume = createSampleResume();
    resume.skills = "Languages: C++, Python\nBackend: Node.js, FastAPI\nTools: Git, Docker\nCloud: AWS, Docker";
    const tops = await lineTops(ResumeDocument({ resume, paper: "letter" }), ["Languages:", "Backend:", "Tools:", "Cloud:"]);
    const { fontSize, lineHeight } = layoutFor(resume.style);
    // One line plus the 2px (1.5pt) the page leaves between groups, not the gap between jobs
    const expected = fontSize * 0.75 * lineHeight + 1.5;
    for (let i = 1; i < tops.length; i++) expect(Math.abs(tops[i] - tops[i - 1] - expected)).toBeLessThan(1);
  });

  it("joins skills typed on separate lines without labels into one paragraph, like the page", async () => {
    const resume = createSampleResume();
    resume.skills = "Python\nGo\nSQL";
    const { text } = await readBack(ResumeDocument({ resume, paper: "letter" }));
    expect(text).toContain("Python, Go, SQL");
  });

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

describe("links in the PDF", () => {
  it("show as short labels that stay clickable and open the full address", async () => {
    const resume = createSampleResume();
    const buffer = await renderToBuffer(ResumeDocument({ resume, paper: "letter" }));
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const { links } = await extractLinks(new Uint8Array(buffer));

    expect(text).toContain("LinkedIn");
    expect(text).toContain("GitHub");
    expect(text).not.toContain("linkedin.com/in");
    expect(links).toEqual(
      expect.arrayContaining([
        "mailto:emily.carter@example.com",
        "https://linkedin.com/in/emily-carter-example",
        "https://github.com/emily-carter-example",
        "https://github.com/emily-carter-example/budget-buddy",
      ]),
    );
  });

  it("can show the full addresses instead", async () => {
    const sample = createSampleResume();
    const resume = { ...sample, style: { ...sample.style, links: "url" as const } };
    const { text } = await readBack(ResumeDocument({ resume, paper: "letter" }));
    expect(text).toContain("linkedin.com/in/emily-carter-example");
  });
});

describe("cover letter PDF", () => {
  it("contains the name and every paragraph", async () => {
    const resume = createSampleResume();
    resume.coverLetter = "Dear Hiring Manager,\n\nI am applying for the role.\n\nSincerely,\nEmily Carter";
    const { text } = await readBack(CoverLetterDocument({ resume, paper: "letter" }));
    expect(text).toContain("Dear Hiring Manager,");
    expect(text).toContain("I am applying for the role.");
    expect(text.match(/Emily Carter/g)?.length).toBe(2);
  });
});
