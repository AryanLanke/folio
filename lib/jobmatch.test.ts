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

  it("matches common short forms either way round", () => {
    const short = normalizeTerm("Built apps in JS and TS with ML models on K8s, GCP and Postgres; UX/UI work");
    expect(containsTerm(short, "JavaScript")).toBe(true);
    expect(containsTerm(short, "TypeScript")).toBe(true);
    expect(containsTerm(short, "Machine Learning")).toBe(true);
    expect(containsTerm(short, "Kubernetes")).toBe(true);
    expect(containsTerm(short, "Google Cloud Platform")).toBe(true);
    expect(containsTerm(short, "PostgreSQL")).toBe(true);
    expect(containsTerm(short, "UI/UX")).toBe(true);
    expect(containsTerm(text, "Amazon Web Services")).toBe(true);
    expect(containsTerm(normalizeTerm("Wrote JavaScript and used React.js"), "JS")).toBe(true);
    expect(containsTerm(normalizeTerm("Built with React"), "ReactJS")).toBe(true);
    expect(containsTerm(normalizeTerm("Tracked KPIs in Excel"), "Microsoft Excel")).toBe(true);
    expect(containsTerm(normalizeTerm("Built LLM tools"), "Large Language Models")).toBe(true);
  });

  it("doesn't treat unrelated short forms as matches", () => {
    expect(containsTerm(normalizeTerm("Wrote Java services"), "JavaScript")).toBe(false);
    expect(containsTerm(normalizeTerm("Ready to go live"), "Golang")).toBe(false);
    expect(containsTerm(normalizeTerm("Used JS daily"), "TypeScript")).toBe(false);
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
