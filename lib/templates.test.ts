import { describe, expect, it } from "vitest";
import { atsChecks } from "@/lib/ats";
import { createSampleResume, sectionTitle, visibleSections } from "@/lib/resume";
import { ACCENT_COLORS, TEMPLATE_SPECS, layoutFor, tooLight, withAccent } from "@/lib/templates";

describe("heading colour", () => {
  it("keeps the template's look when no colour is chosen", () => {
    expect(withAccent(TEMPLATE_SPECS.modern, null)).toBe(TEMPLATE_SPECS.modern);
  });

  it("recolours only what the template drew in its own heading colour", () => {
    // Classic: black headings, grey title and grey lines; only the headings change
    const classic = withAccent(TEMPLATE_SPECS.classic, "#8b1e3f");
    expect(classic.heading.color).toBe("#8b1e3f");
    expect(classic.heading.ruleColor).toBe(TEMPLATE_SPECS.classic.heading.ruleColor);
    expect(classic.title.color).toBe(TEMPLATE_SPECS.classic.title.color);
    // Modern: headings, their lines and the title under the name are all its green
    const modern = withAccent(TEMPLATE_SPECS.modern, "#1e3a5f");
    expect([modern.heading.color, modern.heading.ruleColor, modern.title.color]).toEqual(["#1e3a5f", "#1e3a5f", "#1e3a5f"]);
    expect(withAccent(TEMPLATE_SPECS.executive, "#0f766e").headerRule?.color).toBe("#0f766e");
  });

  it("is what the preview, PDF and Word file get from layoutFor", () => {
    const resume = createSampleResume();
    expect(layoutFor({ ...resume.style, accent: "#0f766e" }).spec.heading.color).toBe("#0f766e");
  });

  it("offers only colours dark enough to read, and flags light custom ones", () => {
    for (const color of ACCENT_COLORS) if (color.value) expect(tooLight(color.value)).toBe(false);
    expect(tooLight("#fde047")).toBe(true);
    expect(tooLight("#000000")).toBe(false);
  });
});

describe("section names", () => {
  it("uses the person's own name for a section, everywhere the section appears", () => {
    const resume = { ...createSampleResume(), titles: { summary: "Profile" } };
    expect(sectionTitle(resume, "summary")).toBe("Profile");
    expect(sectionTitle(resume, "skills")).toBe("Skills");
    expect(visibleSections(resume)[0].title).toBe("Profile");
  });

  it("warns in the ATS check when a new name isn't a heading screening software knows", () => {
    const check = (titles: object) => atsChecks({ ...createSampleResume(), titles }).find((c) => c.label === "Section titles")!;
    expect(check({ summary: "Profile" }).status).toBe("pass");
    const unusual = check({ summary: "My story" });
    expect(unusual.status).toBe("warn");
    expect(unusual.detail).toContain('"My story"');
    expect(unusual.fix).toContain("Click a heading on the page to rename it");
  });
});
