import { describe, expect, it } from "vitest";
import { containsTerm, matchResume, normalizeTerm, parseJobAnalysis, validateJob } from "@/lib/jobmatch";
import { createSampleResume } from "@/lib/resume";

describe("validateJob", () => {
  it("accepts a real posting and rejects tiny input", () => {
    expect(validateJob({ description: "We need a React developer. ".repeat(5) })).not.toBeNull();
    expect(validateJob({ description: "React dev" })).toBeNull();
    expect(validateJob(null)).toBeNull();
  });
});

describe("parseJobAnalysis", () => {
  it("reads keywords, title and company", () => {
    const raw = '{"title":"Frontend Engineer","company":"Acme","keywords":["React","TypeScript","react"," ","GraphQL"]}';
    expect(parseJobAnalysis(raw)).toEqual({
      title: "Frontend Engineer",
      company: "Acme",
      keywords: ["React", "TypeScript", "GraphQL"],
    });
  });

  it("splits terms with a detail in brackets", () => {
    const raw = '{"title":"Analyst","company":"","keywords":["Python (pandas)","SQL"]}';
    expect(parseJobAnalysis(raw)?.keywords).toEqual(["Python", "pandas", "SQL"]);
  });

  it("rejects broken or empty output", () => {
    expect(parseJobAnalysis("nope")).toBeNull();
    expect(parseJobAnalysis('{"keywords":[]}')).toBeNull();
  });
});

describe("containsTerm", () => {
  const text = normalizeTerm("Built REST APIs in Node.js and C++, deployed on AWS; used Power BI and .NET");

  it("matches whole words regardless of punctuation and case", () => {
    expect(containsTerm(text, "node.js")).toBe(true);
    expect(containsTerm(text, "NodeJS")).toBe(true);
    expect(containsTerm(text, "power bi")).toBe(true);
    expect(containsTerm(text, "C++")).toBe(true);
    expect(containsTerm(text, ".NET")).toBe(true);
  });

  it("matches singular and plural", () => {
    expect(containsTerm(text, "REST API")).toBe(true);
  });

  it("doesn't match inside other words", () => {
    expect(containsTerm(normalizeTerm("javascript developer"), "Java")).toBe(false);
    expect(containsTerm(text, "Azure")).toBe(false);
  });
});

describe("matchResume", () => {
  it("scores how many job keywords the resume contains", () => {
    const result = matchResume(createSampleResume(), ["React", "TypeScript", "Kubernetes", "Figma"]);
    expect(result.matched).toEqual(["React", "TypeScript", "Figma"]);
    expect(result.missing).toEqual(["Kubernetes"]);
    expect(result.score).toBe(75);
  });

  it("scores zero with no keywords", () => {
    expect(matchResume(createSampleResume(), []).score).toBe(0);
  });
});
