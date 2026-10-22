import { Packer } from "docx";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { resumeDocx } from "@/lib/export/docx";
import { createSampleResume } from "@/lib/resume";
import { docxToText } from "@/lib/server/docx-text";

describe("docxToText", () => {
  it("reads every section of a real Word resume", async () => {
    const buffer = await Packer.toBuffer(resumeDocx(createSampleResume(), "letter"));
    const text = await docxToText(buffer);
    expect(text).toContain("Emily Carter");
    expect(text).toContain("emily.carter@example.com");
    expect(text).toContain("Brightpath Software");
    expect(text).toContain("cutting page load time from 4.1s to 1.6s");
    expect(text).toContain("AWS Certified Cloud Practitioner");
  });

  it("keeps the address behind a labelled link", async () => {
    const buffer = await Packer.toBuffer(resumeDocx(createSampleResume(), "letter"));
    const text = await docxToText(buffer);
    expect(text).toContain("LinkedIn (https://linkedin.com/in/emily-carter-example)");
    expect(text).toContain("GitHub (https://github.com/emily-carter-example/budget-buddy)");
    expect(text).not.toContain("(mailto:");
  });

  it("keeps paragraphs on separate lines and decodes special characters", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      '<w:document><w:body><w:p><w:r><w:t>R&amp;D Lead</w:t></w:r><w:r><w:tab/><w:t xml:space="preserve">2020 &#8211; 2024</w:t></w:r></w:p><w:p><w:r><w:t>Second line</w:t></w:r></w:p></w:body></w:document>',
    );
    const text = await docxToText(await zip.generateAsync({ type: "uint8array" }));
    expect(text).toBe("R&D Lead\t2020 – 2024\nSecond line");
  });

  it("rejects files that aren't Word documents", async () => {
    const zip = new JSZip();
    zip.file("hello.txt", "hi");
    await expect(docxToText(await zip.generateAsync({ type: "uint8array" }))).rejects.toThrow();
    await expect(docxToText(new Uint8Array([1, 2, 3]))).rejects.toThrow();
  });
});
