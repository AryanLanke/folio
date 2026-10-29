import { describe, expect, it } from "vitest";
import {
  CORE_SECTIONS,
  DEFAULT_STYLE,
  createEmptyResume,
  createSampleResume,
  isBlankResume,
  newExtraSection,
  normalizeResume,
  renameSection,
  skillGroups,
  skillList,
  skillsText,
  swapSections,
  toLines,
  toList,
  visibleSections,
} from "@/lib/resume";

// A resume saved before sections, extras and styles existed
const oldFormat = {
  basics: { name: "A", title: "", email: "", phone: "", location: "", link: "" },
  summary: "hi",
  experience: [{ id: "x", role: "Dev", company: "Co", location: "", start: "2020", end: "Present", bullets: "a\nb" }],
  education: [],
  projects: [],
  skills: "JS",
};

describe("normalizeResume", () => {
  it("upgrades resumes saved in the old format", () => {
    const resume = normalizeResume(oldFormat)!;
    expect(resume.order).toEqual(CORE_SECTIONS);
    expect(resume.extras).toEqual([]);
    expect(resume.style).toEqual(DEFAULT_STYLE);
    expect(resume.experience[0].role).toBe("Dev");
    expect(resume.summary).toBe("hi");
  });

  it("keeps everything when saving and loading the sample", () => {
    const sample = createSampleResume();
    const resume = normalizeResume(JSON.parse(JSON.stringify(sample)))!;
    expect(resume.extras[0].id).toBe(sample.extras[0].id);
    expect(resume.order).toEqual(sample.order);
    expect(resume.extras[0].items[0].title).toBe(sample.extras[0].items[0].title);
  });

  it("keeps a custom section order and repairs a broken one", () => {
    const resume = normalizeResume({
      ...oldFormat,
      extras: [{ id: "e1", kind: "awards", title: "Honors", items: [{ title: "Dean's list" }] }],
      order: ["education", "bogus", "education", "e1", "summary"],
    })!;
    expect(resume.order).toEqual(["education", "e1", "summary", "experience", "projects", "skills"]);
    expect(resume.extras[0].items[0].subtitle).toBe("");
  });

  it("falls back to defaults for unknown values", () => {
    const resume = normalizeResume({
      ...oldFormat,
      extras: [null, 5, { kind: "nope", items: "x" }],
      style: { template: "fancy", fontSize: "large", spacing: "weird" },
    })!;
    expect(resume.extras).toHaveLength(1);
    expect(resume.extras[0].kind).toBe("custom");
    expect(resume.order).toContain(resume.extras[0].id);
    expect(resume.style).toEqual({ template: "classic", fontSize: "large", spacing: "normal", links: "label", accent: null });
  });

  it("keeps a valid heading colour and the person's own section names", () => {
    const resume = normalizeResume({
      ...oldFormat,
      style: { accent: "#1E3A5F" },
      titles: { summary: "  Profile ", skills: "", experience: 4, nonsense: "x" },
    })!;
    expect(resume.style.accent).toBe("#1e3a5f");
    expect(resume.titles).toEqual({ summary: "Profile" });
    expect(normalizeResume({ ...oldFormat, style: { accent: "red" } })!.style.accent).toBeNull();
  });

  it("rejects things that aren't resumes", () => {
    expect(normalizeResume(null)).toBeNull();
    expect(normalizeResume("text")).toBeNull();
    expect(normalizeResume({ hello: 1 })).toBeNull();
  });
});

describe("visibleSections", () => {
  it("leaves out empty sections", () => {
    expect(visibleSections(createEmptyResume())).toEqual([]);
  });

  it("follows the chosen order", () => {
    const resume = createSampleResume();
    resume.order = ["education", ...resume.order.filter((key) => key !== "education")];
    expect(visibleSections(resume)[0].key).toBe("education");
  });

  it("shows extra sections only once they have content", () => {
    const resume = createEmptyResume();
    const awards = newExtraSection("awards");
    resume.extras = [awards];
    resume.order = [...resume.order, awards.id];
    expect(visibleSections(resume)).toEqual([]);

    awards.items[0].title = "Hackathon winner";
    expect(visibleSections(resume).map((s) => s.title)).toEqual(["Awards"]);
  });
});

describe("text helpers", () => {
  it("splits bullets by line and skips blank lines", () => {
    expect(toLines("  one \n\n two\n")).toEqual(["one", "two"]);
  });

  it("splits skills by comma", () => {
    expect(toList("React, , TypeScript ,")).toEqual(["React", "TypeScript"]);
  });
});

describe("skill groups", () => {
  it("reads a plain list as one unlabelled group", () => {
    expect(skillGroups("React, TypeScript, CI-CD")).toEqual([{ label: "", items: ["React", "TypeScript", "CI-CD"] }]);
  });

  it("reads one group per line, with a colon or a dash, and | between skills", () => {
    const text = "Languages: C++, Python\nTools: Git, GitHub, Postman,\nSkills- Corporate Finance | Financial Modelling";
    expect(skillGroups(text)).toEqual([
      { label: "Languages", items: ["C++", "Python"] },
      { label: "Tools", items: ["Git", "GitHub", "Postman"] },
      { label: "Skills", items: ["Corporate Finance", "Financial Modelling"] },
    ]);
    expect(skillList(text)).toHaveLength(7);
  });

  it("writes groups back the same way", () => {
    const groups = [
      { label: "Languages", items: ["C++", "Python"] },
      { label: "", items: ["Figma"] },
    ];
    expect(skillsText(groups)).toBe("Languages: C++, Python\nFigma");
    expect(skillGroups(skillsText(groups))).toEqual(groups);
  });

  it("keeps old saved projects working, with the new fields empty", () => {
    const old = { ...createSampleResume(), projects: [{ id: "p", name: "Site", link: "", bullets: "Built it" }] };
    const loaded = normalizeResume(JSON.parse(JSON.stringify(old)))!;
    expect(loaded.projects[0]).toEqual({ id: "p", name: "Site", link: "", tech: "", date: "", bullets: "Built it" });
  });
});

describe("blank resumes", () => {
  it("counts a resume with no name, summary or jobs as blank, whatever its look", () => {
    expect(isBlankResume({ ...createEmptyResume(), style: { ...DEFAULT_STYLE, template: "bold" } })).toBe(true);
    expect(isBlankResume(createSampleResume())).toBe(false);
  });

  it("stops being blank once anything is written", () => {
    const empty = createEmptyResume();
    expect(isBlankResume({ ...empty, summary: "Engineer" })).toBe(false);
    expect(isBlankResume({ ...empty, basics: { ...empty.basics, name: "Sam" } })).toBe(false);
    expect(isBlankResume({ ...empty, experience: [{ ...empty.experience[0], role: "Dev" }] })).toBe(false);
  });
});

describe("moving and renaming sections", () => {
  it("swaps two sections and leaves the rest where they were", () => {
    const resume = createEmptyResume();
    expect(swapSections(resume, "summary", "experience").order).toEqual(["experience", "summary", "projects", "education", "skills"]);
    expect(resume.order).toEqual(CORE_SECTIONS);
  });

  it("ignores a section that isn't in the order", () => {
    const resume = createEmptyResume();
    expect(swapSections(resume, "summary", "nope")).toBe(resume);
  });

  it("renames a core section, and clearing the name puts the standard one back", () => {
    const renamed = renameSection(createEmptyResume(), "summary", "Profile");
    expect(renamed.titles).toEqual({ summary: "Profile" });
    expect(renameSection(renamed, "summary", "").titles).toEqual({});
    expect(renameSection(renamed, "summary", "Summary").titles).toEqual({});
  });

  it("renames an extra section, falling back to its kind's name", () => {
    const extra = newExtraSection("awards");
    const resume = { ...createEmptyResume(), extras: [extra], order: [...CORE_SECTIONS, extra.id] };
    expect(renameSection(resume, extra.id, "Honours").extras[0].title).toBe("Honours");
    expect(renameSection(resume, extra.id, "").extras[0].title).toBe("Awards");
  });
});
