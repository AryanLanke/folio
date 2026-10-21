import { describe, expect, it } from "vitest";
import { buildImportMessages, parseImport } from "@/lib/importer";
import { normalizeResume } from "@/lib/resume";

const reply = JSON.stringify({
  basics: { name: "Priya Shah", title: "Data Analyst", email: "priya@mail.com", phone: "+91 98765 43210", location: "Pune", link: "" },
  summary: "Analyst with 4 years in retail data.",
  experience: [
    { role: "Data Analyst", company: "Reliance Retail", location: "Mumbai", start: "Jan 2022", end: "current", bullets: ["• Built Power BI dashboards", "Cut report time by 30%"] },
    { role: "", company: "", bullets: [] },
  ],
  education: [{ school: "University of Pune", degree: "B.Sc. Statistics", start: "2016", end: "2019" }],
  projects: [],
  skills: ["SQL", " Excel ", "", "Power BI"],
  certifications: [{ name: "Google Data Analytics", issuer: "Coursera", date: "2021" }],
  awards: [],
  volunteering: [],
  languages: [{ language: "English", level: "Fluent" }, { language: "Hindi", level: "Native" }],
});

describe("parseImport", () => {
  it("fills every field from the model's JSON", () => {
    const resume = parseImport(reply)!;
    expect(resume.basics.name).toBe("Priya Shah");
    expect(resume.experience).toHaveLength(1);
    expect(resume.experience[0].end).toBe("Present");
    expect(resume.experience[0].bullets).toBe("Built Power BI dashboards\nCut report time by 30%");
    expect(resume.education[0].degree).toBe("B.Sc. Statistics");
    expect(resume.skills).toBe("SQL, Excel, Power BI");
  });

  it("creates extra sections only when they have content, and adds them to the order", () => {
    const resume = parseImport(reply)!;
    expect(resume.extras.map((e) => e.kind)).toEqual(["certifications", "languages"]);
    expect(resume.extras[1].items.map((i) => `${i.title} (${i.subtitle})`)).toEqual(["English (Fluent)", "Hindi (Native)"]);
    for (const extra of resume.extras) expect(resume.order).toContain(extra.id);
  });

  it("produces a resume that survives saving and loading", () => {
    const resume = parseImport(reply)!;
    expect(normalizeResume(JSON.parse(JSON.stringify(resume)))).toEqual(resume);
  });

  it("converts look-alike characters the model writes into plain ones", () => {
    const resume = parseImport(
      JSON.stringify({
        basics: { name: "Ravi" },
        summary: "Cut defects by 20 percent",
        experience: [{ role: "Tester", company: "TCS", bullets: ["Ran a six‑month pilot"] }],
        skills: ["CI‑CD"],
      }),
    )!;
    expect(resume.summary).toBe("Cut defects by 20 percent");
    expect(resume.experience[0].bullets).toBe("Ran a six-month pilot");
    expect(resume.skills).toBe("CI-CD");
  });

  it("shows a same-year job as one date", () => {
    const resume = parseImport(JSON.stringify({ basics: { name: "Ravi" }, experience: [{ role: "Intern", start: "2019", end: "2019" }] }))!;
    expect([resume.experience[0].start, resume.experience[0].end]).toEqual(["2019", ""]);
  });

  it("turns an all-caps name into normal capitalization", () => {
    expect(parseImport(JSON.stringify({ basics: { name: "PRIYA SHAH" } }))!.basics.name).toBe("Priya Shah");
    expect(parseImport(JSON.stringify({ basics: { name: "Priya McKay" } }))!.basics.name).toBe("Priya McKay");
  });

  it("keeps an empty job and school to fill in when none were found", () => {
    const resume = parseImport(JSON.stringify({ basics: { name: "Sam" } }))!;
    expect(resume.experience).toHaveLength(1);
    expect(resume.education).toHaveLength(1);
  });

  it("rejects broken or empty replies", () => {
    expect(parseImport("not json")).toBeNull();
    expect(parseImport("{}")).toBeNull();
  });
});

describe("buildImportMessages", () => {
  it("tells the model to copy, not rewrite or invent", () => {
    const [system, user] = buildImportMessages("Priya Shah resume");
    expect(system.content).toContain("Copy the person's wording exactly");
    expect(system.content).toContain("Never invent");
    expect(user.content).toContain("Priya Shah resume");
  });
});
