import { describe, expect, it } from "vitest";
import { type Resume, createEmptyResume, createSampleResume, emptyTarget } from "@/lib/resume";
import { scoreResume, scoreVerdict } from "@/lib/score";

function part(resume: Resume, key: string) {
  return scoreResume(resume).parts.find((p) => p.key === key)!;
}

function item(resume: Resume, label: string) {
  return scoreResume(resume).parts.flatMap((p) => p.items).find((i) => i.label === label)!;
}

describe("scoreResume", () => {
  it("scores the strong sample resume highly", () => {
    const { total } = scoreResume(createSampleResume());
    expect(total).toBeGreaterThanOrEqual(85);
  });

  it("scores an empty resume low", () => {
    expect(scoreResume(createEmptyResume()).total).toBeLessThan(25);
  });

  it("stays between 0 and 100", () => {
    for (const resume of [createEmptyResume(), createSampleResume()]) {
      const { total, parts } = scoreResume(resume);
      expect(total).toBeGreaterThanOrEqual(0);
      expect(total).toBeLessThanOrEqual(100);
      for (const p of parts) expect(p.score).toBeGreaterThanOrEqual(0);
    }
  });

  it("includes job match only when a job is added", () => {
    const resume = createSampleResume();
    expect(part(resume, "job")).toBeDefined();
    resume.target = emptyTarget();
    expect(scoreResume(resume).parts.map((p) => p.key)).toEqual(["ats", "writing"]);
  });

  it("weights add up to 1 with and without a job", () => {
    const withJob = scoreResume(createSampleResume()).parts.reduce((s, p) => s + p.weight, 0);
    const resume = createSampleResume();
    resume.target = emptyTarget();
    const withoutJob = scoreResume(resume).parts.reduce((s, p) => s + p.weight, 0);
    expect(withJob).toBeCloseTo(1);
    expect(withoutJob).toBeCloseTo(1);
  });
});

describe("writing checks", () => {
  it("flags weak bullet openings and quotes one", () => {
    const resume = createSampleResume();
    resume.experience = [
      { ...resume.experience[0], bullets: "Responsible for the dashboard\nI fixed bugs in the payment flow\nBuilt a component library for 4 teams" },
    ];
    resume.projects = [];
    const check = item(resume, "Bullets start with a strong verb");
    expect(check.score).toBeCloseTo(1 / 3);
    expect(check.detail).toContain('"Responsible for the dashboard"');
  });

  it("rewards numbers", () => {
    const resume = createSampleResume();
    resume.experience = [{ ...resume.experience[0], bullets: "Built the dashboard for the sales team\nLed weekly planning with design" }];
    resume.projects = [];
    expect(item(resume, "Results backed by numbers").score).toBe(0);
  });

  it("flags first person and buzzwords", () => {
    const resume = createSampleResume();
    resume.summary = "I am a results-driven engineer who leveraged synergy across teams.";
    expect(item(resume, 'No "I" or "my"').score).toBeLessThan(1);
    const buzz = item(resume, "No buzzwords");
    expect(buzz.score).toBeLessThan(1);
    expect(buzz.detail).toContain('"results-driven"');
  });

  it("asks for a summary when there isn't one", () => {
    const resume = createSampleResume();
    resume.summary = "";
    expect(item(resume, "Summary is short and specific").score).toBe(0);
  });
});

describe("scoreVerdict", () => {
  it("describes each range", () => {
    expect(scoreVerdict(90)).toContain("Excellent");
    expect(scoreVerdict(75)).toContain("Good");
    expect(scoreVerdict(55)).toContain("Fair");
    expect(scoreVerdict(20)).toContain("Needs work");
  });
});
