import { describe, expect, it } from "vitest";
import { atsChecks } from "@/lib/ats";
import { EXAMPLES, findExample } from "@/lib/examples";
import { normalizeResume, visibleSections } from "@/lib/resume";
import { scoreResume } from "@/lib/score";

describe("resume examples", () => {
  it("each has its own address", () => {
    const slugs = EXAMPLES.map((example) => example.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z-]+$/);
  });

  // They're shown as good examples, so they should pass Folio's own checks
  it.each(EXAMPLES.map((example) => [example.slug, example] as const))("%s is complete and scores well", (_, example) => {
    const resume = example.resume();
    const shown = visibleSections(resume).map((section) => section.key);
    expect(shown).toEqual(expect.arrayContaining(["summary", "experience", "education", "skills"]));
    expect(scoreResume(resume).total).toBeGreaterThanOrEqual(85);
    expect(atsChecks(resume).filter((check) => check.status === "fail")).toEqual([]);
    expect(example.tips.length).toBeGreaterThanOrEqual(3);
    expect(example.keywords.length).toBeGreaterThanOrEqual(5);
  });

  it("are made-up people with made-up contact details", () => {
    for (const example of EXAMPLES) {
      const { email, phone } = example.resume().basics;
      expect(email).toMatch(/@example\.com$/);
      expect(phone).toMatch(/555-01\d\d/);
    }
  });

  it("survive being saved and opened again", () => {
    for (const example of EXAMPLES) {
      const resume = example.resume();
      expect(normalizeResume(JSON.parse(JSON.stringify(resume)))).toEqual(resume);
    }
  });

  it("finds an example by its address, and nothing for an unknown one", () => {
    expect(findExample("nurse")?.role).toBe("Nurse");
    expect(findExample("astronaut")).toBeUndefined();
  });
});
