import { describe, expect, it } from "vitest";
import { atsChecks, resumeToPlainText } from "@/lib/ats";
import { createEmptyResume, createSampleResume } from "@/lib/resume";

function check(resume: ReturnType<typeof createSampleResume>, label: string) {
  return atsChecks(resume).find((c) => c.label === label)!;
}

describe("resumeToPlainText", () => {
  it("lists sections in page order with standard headings", () => {
    const text = resumeToPlainText(createSampleResume());
    expect(text.startsWith("JORDAN PATEL\nFrontend Developer")).toBe(true);
    const headings = ["SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS", "CERTIFICATIONS"];
    const positions = headings.map((h) => text.indexOf(`\n${h}\n`));
    expect(positions.every((p) => p > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("writes each job on one line with its bullets below", () => {
    const text = resumeToPlainText(createSampleResume());
    expect(text).toContain("Frontend Developer | Brightpath Software | Austin, TX | Jun 2023 – Present\n• Rebuilt");
  });

  it("is empty for an empty resume", () => {
    expect(resumeToPlainText(createEmptyResume())).toBe("");
  });
});

describe("atsChecks", () => {
  it("passes everything for the sample resume", () => {
    expect(atsChecks(createSampleResume()).filter((c) => !c.ok)).toEqual([]);
  });

  it("flags missing contact details on an empty resume", () => {
    const empty = createEmptyResume();
    expect(check(empty, "Name").ok).toBe(false);
    expect(check(empty, "Email").ok).toBe(false);
    expect(check(empty, "Phone").ok).toBe(false);
    expect(check(empty, "Work history").ok).toBe(false);
  });

  it("flags unreadable dates by name", () => {
    const resume = createSampleResume();
    resume.experience[0].start = "a while ago";
    const dates = check(resume, "Dates");
    expect(dates.ok).toBe(false);
    expect(dates.detail).toContain('"a while ago"');
  });

  it("flags jobs missing a company", () => {
    const resume = createSampleResume();
    resume.experience[1].company = "";
    expect(check(resume, "Job details").ok).toBe(false);
  });
});
