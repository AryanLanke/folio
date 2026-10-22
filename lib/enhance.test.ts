import { describe, expect, it } from "vitest";
import {
  BANNED_WORDS,
  DAILY_LIMIT,
  INVOLVEMENT_RULE,
  MAX_INPUT_LENGTH,
  buildMessages,
  parseResult,
  recordUse,
  usesLeft,
  validateRequest,
} from "@/lib/enhance";

describe("validateRequest", () => {
  it("accepts a valid request and trims the text", () => {
    expect(validateRequest({ kind: "bullets", text: "  built things  ", role: "Dev", current: true, focus: ["Go", 3, ""] })).toEqual({
      kind: "bullets",
      text: "built things",
      style: "polish",
      previous: undefined,
      role: "Dev",
      current: true,
      focus: ["Go"],
    });
  });

  it("rejects empty, unknown or oversized input", () => {
    expect(typeof validateRequest(null)).toBe("string");
    expect(typeof validateRequest({ kind: "poem", text: "x" })).toBe("string");
    expect(typeof validateRequest({ kind: "summary", text: "   " })).toBe("string");
    expect(typeof validateRequest({ kind: "summary", text: "x".repeat(MAX_INPUT_LENGTH + 1) })).toBe("string");
  });
});

describe("buildMessages", () => {
  it("forbids invented facts and bans buzzwords", () => {
    const [system] = buildMessages({ kind: "summary", text: "hi" });
    expect(system.content).toContain("Never invent metrics");
    for (const word of BANNED_WORDS) expect(system.content).toContain(word);
  });

  it("keeps the person's level of involvement", () => {
    expect(buildMessages({ kind: "bullets", text: "helped make the site faster" })[0].content).toContain(INVOLVEMENT_RULE);
  });

  it("uses present tense for current jobs and past tense otherwise", () => {
    expect(buildMessages({ kind: "bullets", text: "x", current: true })[0].content).toContain("present tense");
    expect(buildMessages({ kind: "bullets", text: "x" })[0].content).toContain("past tense");
  });

  it("tailors to job keywords only when given, without adding new skills", () => {
    const tailored = buildMessages({ kind: "bullets", text: "x", focus: ["Kubernetes", "Go"] })[0].content;
    expect(tailored).toContain("Kubernetes, Go");
    expect(tailored).toContain("Never add a skill");
    expect(buildMessages({ kind: "bullets", text: "x" })[0].content).not.toContain("looks for");
  });

  it("accepts known styles and falls back to polish", () => {
    expect((validateRequest({ kind: "summary", text: "x", style: "shorter" }) as { style: string }).style).toBe("shorter");
    expect((validateRequest({ kind: "summary", text: "x", style: "poem" }) as { style: string }).style).toBe("polish");
  });

  it("adds the style instruction only for refinements", () => {
    expect(buildMessages({ kind: "summary", text: "x", style: "shorter" })[0].content).toContain("noticeably shorter");
    expect(buildMessages({ kind: "summary", text: "x", style: "polish" })[0].content).not.toContain("noticeably shorter");
  });

  it("refines the previous version but keeps the original as the only source of facts", () => {
    const [system, user] = buildMessages({ kind: "summary", text: "my original", previous: "ai version", style: "formal" });
    expect(system.content).toContain("Facts may only come from the original text");
    expect(user.content).toContain("Original text (the only source of facts):\n<<<\nmy original");
    expect(user.content).toContain("Current version to refine:\n<<<\nai version");
  });

  it("includes the role and the text for the model", () => {
    const [, user] = buildMessages({ kind: "bullets", text: "made app", role: "Developer at Acme" });
    expect(user.content).toContain("Developer at Acme");
    expect(user.content).toContain("made app");
  });
});

describe("parseResult", () => {
  it("reads bullets and a tip", () => {
    expect(parseResult('{"lines":["Built the app","Led a team"],"tip":"How many users?"}', "bullets")).toEqual({
      lines: ["Built the app", "Led a team"],
      tip: "How many users?",
    });
  });

  it("strips bullet symbols and quotes the model adds", () => {
    expect(parseResult('{"lines":["• Built it","- \\"Shipped it\\""],"tip":null}', "bullets")?.lines).toEqual([
      "Built it",
      "Shipped it",
    ]);
  });

  it("joins a summary into one paragraph", () => {
    expect(parseResult('{"lines":["First part.","Second part."],"tip":null}', "summary")?.lines).toEqual([
      "First part. Second part.",
    ]);
  });

  it("accepts a single string and splits it by line", () => {
    expect(parseResult('{"lines":"Built it\\nShipped it","tip":""}', "bullets")).toEqual({
      lines: ["Built it", "Shipped it"],
      tip: null,
    });
  });

  it("converts look-alike characters to plain ones ATS software can read", () => {
    const raw = JSON.stringify({ lines: ["Led cross‑team work on “decision‐making” tools"], tip: null });
    expect(parseResult(raw, "bullets")?.lines).toEqual(['Led cross-team work on "decision-making" tools']);
  });

  it("reads JSON wrapped in a code fence", () => {
    expect(parseResult('```json\n{"lines":["Built it"],"tip":null}\n```', "bullets")?.lines).toEqual(["Built it"]);
  });

  it("returns null for broken or empty output", () => {
    expect(parseResult("not json", "bullets")).toBeNull();
    expect(parseResult('{"lines":[]}', "bullets")).toBeNull();
    expect(parseResult(undefined, "bullets")).toBeNull();
  });
});

describe("daily allowance", () => {
  it("starts full and counts down", () => {
    expect(usesLeft(null, "2026-10-21")).toBe(DAILY_LIMIT);
    const once = recordUse(null, "2026-10-21");
    expect(usesLeft(once, "2026-10-21")).toBe(DAILY_LIMIT - 1);
  });

  it("resets on a new day and survives bad data", () => {
    const once = recordUse(null, "2026-10-21");
    expect(usesLeft(once, "2026-10-22")).toBe(DAILY_LIMIT);
    expect(usesLeft("garbage", "2026-10-21")).toBe(DAILY_LIMIT);
  });

  it("never goes below zero", () => {
    let saved: string | null = null;
    for (let i = 0; i < DAILY_LIMIT + 3; i++) saved = recordUse(saved, "2026-10-21");
    expect(usesLeft(saved, "2026-10-21")).toBe(0);
  });
});
