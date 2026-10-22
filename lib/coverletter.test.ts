import { describe, expect, it } from "vitest";
import {
  buildCoverLetterMessages,
  buildFactCheckMessages,
  coverLetterRequest,
  parseCoverLetter,
  validateCoverLetter,
} from "@/lib/coverletter";
import { createSampleResume } from "@/lib/resume";

describe("cover letter", () => {
  it("builds the request from the resume and its target job", () => {
    const resume = createSampleResume();
    resume.target = { description: "We need React skills", title: "Frontend Engineer", company: "Acme", keywords: [] };
    const request = coverLetterRequest(resume);
    expect(request.resumeText).toContain("EMILY CARTER");
    expect(request.company).toBe("Acme");
  });

  it("rejects requests without a real resume", () => {
    expect(validateCoverLetter({ resumeText: "short" })).toBeNull();
    expect(validateCoverLetter(null)).toBeNull();
  });

  it("forbids invented facts and includes the job when there is one", () => {
    const [system, user] = buildCoverLetterMessages({
      resumeText: "resume text",
      jobDescription: "posting text",
      jobTitle: "Engineer",
      company: "Acme",
    });
    expect(system.content).toContain("Never invent");
    expect(user.content).toContain("posting text");
    expect(user.content).toContain("Company: Acme");
  });

  it("leaves the job out when there isn't one", () => {
    const [, user] = buildCoverLetterMessages({ resumeText: "resume text", jobDescription: "", jobTitle: "", company: "" });
    expect(user.content).not.toContain("Job posting");
  });

  it("joins paragraphs and cleans look-alike characters", () => {
    const raw = JSON.stringify({ paragraphs: ["Dear Hiring Manager,", "I’m applying for the front‑end role.", "Sincerely,\nEmily"] });
    expect(parseCoverLetter(raw)).toBe("Dear Hiring Manager,\n\nI'm applying for the front-end role.\n\nSincerely,\nEmily");
  });

  it("puts the greeting and sign-off in their own paragraphs", () => {
    const glued = JSON.stringify({ paragraphs: ["Dear Hiring Manager, I am applying.", "Thanks for your time. Sincerely,\nEmily"] });
    expect(parseCoverLetter(glued)).toBe("Dear Hiring Manager,\n\nI am applying.\n\nThanks for your time.\n\nSincerely,\nEmily");
    const split = JSON.stringify({ paragraphs: ["Dear Hiring Manager,", "Thanks for your time.\nSincerely,\nEmily"] });
    expect(parseCoverLetter(split)).toBe("Dear Hiring Manager,\n\nThanks for your time.\n\nSincerely,\nEmily");
  });

  it("asks the fact-checker to strike unsupported details and keep the rest", () => {
    const [system, user] = buildFactCheckMessages("resume text", "letter text");
    expect(system.content).toContain("Remove or rewrite every phrase");
    expect(system.content).toContain("Don't add anything new");
    expect(user.content).toContain("resume text");
    expect(user.content).toContain("letter text");
  });

  it("rejects broken replies", () => {
    expect(parseCoverLetter("nope")).toBeNull();
    expect(parseCoverLetter('{"paragraphs":["only one"]}')).toBeNull();
  });
});
