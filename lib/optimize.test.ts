import { describe, expect, it } from "vitest";
import { BANNED_WORDS } from "@/lib/enhance";
import {
  applyOptimize,
  bestLayout,
  buildOptimizeMessages,
  keepsFacts,
  layoutCandidates,
  listChanges,
  optimizeRequest,
  parseOptimize,
  revertChange,
  validateOptimize,
} from "@/lib/optimize";
import { DEFAULT_STYLE, type Resume, createSampleResume } from "@/lib/resume";

const sample = (): Resume => createSampleResume();

describe("optimizeRequest", () => {
  it("sends the summary and every job and project that has bullets, with tense hints", () => {
    const resume = sample();
    const request = optimizeRequest(resume);
    expect(request.summary).toBe(resume.summary);
    expect(request.items[0]).toMatchObject({ context: "Frontend Developer at Brightpath Software", current: true });
    expect(request.items[0].bullets).toHaveLength(3);
    expect(request.items[1].current).toBe(false);
    expect(request.items.some((item) => item.context.startsWith("Project: "))).toBe(true);
  });

  it("leaves out items with no bullets", () => {
    const resume = sample();
    resume.experience[1].bullets = "  \n ";
    expect(optimizeRequest(resume).items.map((item) => item.id)).not.toContain(resume.experience[1].id);
  });
});

describe("validateOptimize", () => {
  it("accepts a request and trims what it keeps", () => {
    expect(
      validateOptimize({ title: " Dev ", summary: " Hi there ", items: [{ id: "a", context: "Job", current: true, bullets: [" Built x ", "", 4] }], focus: ["Go", 2] }),
    ).toEqual({ title: "Dev", summary: "Hi there", items: [{ id: "a", context: "Job", current: true, bullets: ["Built x"] }], focus: ["Go"] });
  });

  it("rejects nothing to work with, broken items and oversized requests", () => {
    expect(validateOptimize(null)).toBeNull();
    expect(validateOptimize({ summary: "", items: [{ id: "a", bullets: [] }] })).toBeNull();
    const huge = Array.from({ length: 20 }, (_, i) => ({ id: `i${i}`, bullets: Array.from({ length: 12 }, () => "x".repeat(400)) }));
    expect(validateOptimize({ summary: "Hi", items: huge })).toBeNull();
  });
});

describe("keepsFacts", () => {
  it("allows numbers the original already has, and nothing new", () => {
    expect(keepsFacts("Cut load time from 4.1s to 1.6s", "Reduced load time from 4.1s to 1.6s")).toBe(true);
    expect(keepsFacts("Cut load time", "Cut load time by 40%")).toBe(false);
    expect(keepsFacts("Reached 200k+ visitors", "Reached 200,000 visitors")).toBe(false);
  });
});

describe("parseOptimize", () => {
  const request = {
    title: "Dev",
    summary: "Developer with 3 years of experience.",
    items: [
      { id: "a", context: "Job", current: false, bullets: ["made dashboard faster", "helped with tests"] },
      { id: "b", context: "Project", current: false, bullets: ["built app"] },
    ],
    focus: [],
  };

  it("uses the rewrite when it keeps every fact and the same number of bullets", () => {
    const raw = JSON.stringify({
      summary: "Developer with 3 years of experience building web apps.",
      items: [
        { id: "a", bullets: ["• Made the dashboard faster", "Contributed to the test suite"] },
        { id: "b", bullets: ["Built a budgeting app"] },
      ],
    });
    expect(parseOptimize(raw, request)).toEqual({
      summary: "Developer with 3 years of experience building web apps.",
      items: [
        { id: "a", bullets: ["Made the dashboard faster", "Contributed to the test suite"] },
        { id: "b", bullets: ["Built a budgeting app"] },
      ],
    });
  });

  it("keeps the person's own words where the rewrite adds a number or changes the bullet count", () => {
    const raw = JSON.stringify({
      summary: "Developer with 5 years of experience.",
      items: [
        { id: "a", bullets: ["Made the dashboard 50% faster", "Contributed to the test suite"] },
        { id: "b", bullets: ["Built an app", "Shipped it"] },
      ],
    });
    expect(parseOptimize(raw, request)).toEqual({
      summary: request.summary,
      items: [
        { id: "a", bullets: ["made dashboard faster", "Contributed to the test suite"] },
        { id: "b", bullets: ["built app"] },
      ],
    });
  });

  it("reads answers wrapped in a code fence, and gives up on broken JSON", () => {
    const fenced = "```json\n" + JSON.stringify({ summary: "", items: [] }) + "\n```";
    expect(parseOptimize(fenced, request)?.items[0].bullets).toEqual(request.items[0].bullets);
    expect(parseOptimize("not json", request)).toBeNull();
    expect(parseOptimize(42, request)).toBeNull();
  });
});

describe("buildOptimizeMessages", () => {
  it("states the rules, the banned words and the job's wording", () => {
    const [system, user] = buildOptimizeMessages({ title: "Dev", summary: "Hi", items: [], focus: ["GraphQL"] });
    expect(system.content).toContain("Never invent metrics");
    expect(system.content).toContain(BANNED_WORDS[0]);
    expect(system.content).toContain("GraphQL");
    expect(user.content).toContain('"summary": "Hi"');
  });
});

describe("applyOptimize", () => {
  it("puts rewritten bullets back by id and leaves untouched ones exactly as typed", () => {
    const resume = sample();
    resume.experience[1].bullets = "Built landing pages\n\nFixed accessibility issues";
    const [job, intern] = resume.experience;
    const next = applyOptimize(resume, {
      summary: "New summary.",
      items: [
        { id: job.id, bullets: ["One", "Two", "Three"] },
        { id: intern.id, bullets: ["Built landing pages", "Fixed accessibility issues"] },
      ],
    });
    expect(next.summary).toBe("New summary.");
    expect(next.experience[0].bullets).toBe("One\nTwo\nThree");
    expect(next.experience[1]).toBe(intern);
  });
});

describe("layout", () => {
  const style = { ...DEFAULT_STYLE, fontSize: "small" as const, spacing: "compact" as const };

  it("tries the current layout first and Compact only as a last resort", () => {
    const candidates = layoutCandidates(style);
    expect(candidates[0]).toBe(style);
    expect(candidates.at(-1)?.template).toBe("compact");
    expect(layoutCandidates({ ...style, template: "compact" }).every((c) => c.template === "compact")).toBe(true);
  });

  it("picks the most readable layout that needs the fewest pages", () => {
    const candidates = layoutCandidates(style);
    // Everything fits on one page: room to breathe, so medium text and airy spacing
    expect(bestLayout(style, candidates, candidates.map(() => 1))).toMatchObject({ fontSize: "medium", spacing: "relaxed" });
    // Only small text saves the second page
    const pages = candidates.map((c) => (c.fontSize === "small" ? 1 : 2));
    expect(bestLayout(style, candidates, pages)).toMatchObject({ fontSize: "small", spacing: "normal", template: "classic" });
    // Only the Compact template saves it
    expect(bestLayout(style, candidates, candidates.map((c) => (c.template === "compact" ? 1 : 2))).template).toBe("compact");
  });

  it("keeps a larger layout the person chose when it already fits", () => {
    const large = { ...DEFAULT_STYLE, fontSize: "large" as const };
    const candidates = layoutCandidates(large);
    expect(bestLayout(large, candidates, candidates.map(() => 1))).toBe(large);
  });
});

describe("listChanges and revertChange", () => {
  it("lists each changed piece, and reverting one keeps the others", () => {
    const before = sample();
    const after: Resume = {
      ...before,
      summary: "A new summary.",
      experience: before.experience.map((job, i) => (i === 0 ? { ...job, bullets: "One\nTwo\nThree" } : job)),
      style: { ...before.style, fontSize: "small" },
    };
    const changes = listChanges(before, after);
    expect(changes.map((c) => c.key)).toEqual(["summary", `experience:${before.experience[0].id}`, "layout"]);
    expect(changes[2].after[0]).toBe("Classic, text S, Normal spacing");

    const reverted = revertChange(after, before, changes[1].key);
    expect(reverted.experience[0].bullets).toBe(before.experience[0].bullets);
    expect(reverted.summary).toBe("A new summary.");
    expect(revertChange(after, before, "layout").style.fontSize).toBe(before.style.fontSize);
    expect(listChanges(before, before)).toEqual([]);
  });
});
