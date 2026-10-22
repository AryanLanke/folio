import { describe, expect, it } from "vitest";
import { atsChecks, atsScore, brokenBulletLines, resumeToPlainText } from "@/lib/ats";
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

// A resume like many people import: typed bullets, a sentence split over two lines by the PDF,
// no education, and a one-line summary
function weakResume() {
  const resume = createSampleResume();
  resume.summary = "Software developer with backend experience.";
  resume.education = [];
  resume.experience = [
    {
      ...resume.experience[0],
      bullets: [
        "• • Developed backend services for a multi-client compliance",
        "platform using FastAPI and MongoDB.",
        "• Built scheduled jobs with APScheduler for 12 clients",
        "Wrote API tests",
      ].join("\n"),
    },
  ];
  resume.projects = [];
  return resume;
}

describe("atsChecks", () => {
  it("passes everything for the sample resume", () => {
    const checks = atsChecks(createSampleResume());
    expect(checks.filter((c) => c.status !== "pass").map((c) => c.label)).toEqual([]);
    expect(atsScore(checks)).toBe(100);
  });

  it("can't give a weak resume full marks", () => {
    const resume = weakResume();
    const checks = atsChecks(resume);
    expect(check(resume, "Education").status).toBe("fail");
    expect(check(resume, "Bullet formatting").status).toBe("fail");
    expect(check(resume, "Summary").status).toBe("warn");
    expect(atsScore(checks)).toBeLessThan(75);
  });

  it("gives a fix for everything that isn't passing, and none for what is", () => {
    for (const c of atsChecks(weakResume())) {
      if (c.status === "pass") expect(c.fix).toBeNull();
      else expect(c.fix).toBeTruthy();
    }
  });

  it("flags missing contact details on an empty resume and scores it low", () => {
    const empty = createEmptyResume();
    for (const label of ["Name", "Email", "Phone", "Work history", "Education"]) expect(check(empty, label).status).toBe("fail");
    expect(atsScore(atsChecks(empty))).toBeLessThan(10);
  });

  it("flags unreadable dates by name", () => {
    const resume = createSampleResume();
    resume.experience[0].start = "a while ago";
    const dates = check(resume, "Dates");
    expect(dates.status).not.toBe("pass");
    expect(dates.detail).toContain('"a while ago"');
  });

  it("flags mixed date styles within a section", () => {
    const resume = createSampleResume();
    resume.experience[0].start = "06/2023";
    const dates = check(resume, "Consistent date format");
    expect(dates.status).toBe("warn");
    expect(dates.detail).toContain('"06/2023"');
    expect(dates.detail).toContain('"Jan 2022"');
  });

  it("accepts years for education and months for jobs, and May with either month style", () => {
    const resume = createSampleResume();
    resume.experience[1].end = "May 2023";
    resume.experience[1].start = "January 2022";
    resume.experience[0].start = "June 2023";
    expect(check(resume, "Consistent date format").status).toBe("pass");
  });

  it("flags an incomplete education entry as a warning", () => {
    const resume = createSampleResume();
    resume.education[0].end = "";
    const education = check(resume, "Education");
    expect(education.status).toBe("warn");
    expect(education.detail).toContain("end year");
  });

  it("flags jobs missing a company", () => {
    const resume = createSampleResume();
    resume.experience[1].company = "";
    expect(check(resume, "Job details").status).not.toBe("pass");
  });

  it("flags a short or generic summary", () => {
    const resume = createSampleResume();
    resume.summary =
      "Hardworking frontend developer with 3 years of experience building web apps in React and TypeScript, looking for a role where I can keep growing.";
    const summary = check(resume, "Summary");
    expect(summary.status).toBe("warn");
    expect(summary.detail).toMatch(/hardworking|passionate|looking for/i);
  });

  it("wants a few more skills before passing", () => {
    const resume = createSampleResume();
    resume.skills = "React, TypeScript, CSS";
    expect(check(resume, "Skills").status).toBe("warn");
  });
});

describe("brokenBulletLines", () => {
  it("finds typed bullets, joined bullets and split sentences", () => {
    const text = [
      "• • Built dashboards",
      "Built reports • Cut report time by 30%",
      "Developed backend services for a multi-client compliance",
      "platform using FastAPI.",
      "Worked with the design team and",
      "Shipped the new checkout flow for 3 markets",
    ].join("\n");
    expect(brokenBulletLines(text)).toEqual([
      "• • Built dashboards",
      "Built reports • Cut report time by 30%",
      "platform using FastAPI.",
      "Shipped the new checkout flow for 3 markets",
    ]);
  });

  it("leaves clean bullets and lowercase tool names alone", () => {
    expect(brokenBulletLines("Built the app in React\nnpm package used by 2 teams\niOS app with 4.8 stars")).toEqual([]);
  });
});
