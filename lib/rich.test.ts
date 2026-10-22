import { describe, expect, it } from "vitest";
import { atsChecks, resumeToPlainText } from "@/lib/ats";
import { applyOptimize, optimizeRequest } from "@/lib/optimize";
import { createSampleResume } from "@/lib/resume";
import { parseRich, plainResume, plainText, richToHtml, toRich } from "@/lib/rich";

describe("formatted text", () => {
  it("reads bold, italic and underline, including overlapping ones", () => {
    expect(parseRich("B.Tech <b>(CGPA <i>8.67</i>)</b> <u>2024</u>")).toEqual([
      { text: "B.Tech ", bold: false, italic: false, underline: false },
      { text: "(CGPA ", bold: true, italic: false, underline: false },
      { text: "8.67", bold: true, italic: true, underline: false },
      { text: ")", bold: true, italic: false, underline: false },
      { text: " ", bold: false, italic: false, underline: false },
      { text: "2024", bold: false, italic: false, underline: true },
    ]);
  });

  it("copes with tags left open or closed twice", () => {
    expect(parseRich("<b>open to the end")).toEqual([{ text: "open to the end", bold: true, italic: false, underline: false }]);
    expect(plainText("stray</b> close")).toBe("stray close");
  });

  it("writes spans back with as few tags as possible", () => {
    const spans = parseRich("<b>Built</b><b> the app</b> fast");
    expect(toRich(spans)).toBe("<b>Built the app</b> fast");
    expect(toRich(parseRich("<b><i>both</i></b>"))).toBe("<b><i>both</i></b>");
  });

  it("only ever makes the three formatting tags into HTML", () => {
    expect(richToHtml('<b>Safe</b> <script>alert("x")</script> & <img src=x>')).toBe(
      '<b>Safe</b> &lt;script&gt;alert("x")&lt;/script&gt; &amp; &lt;img src=x&gt;',
    );
  });

  it("strips formatting from every field of a resume", () => {
    const resume = { ...createSampleResume(), summary: "<b>Frontend</b> developer" };
    resume.experience[0].bullets = "<i>Rebuilt</i> the dashboard\n<u>Created</u> a library";
    const plain = plainResume(resume);
    expect(plain.summary).toBe("Frontend developer");
    expect(plain.experience[0].bullets).toBe("Rebuilt the dashboard\nCreated a library");
    expect(plain.experience[0].id).toBe(resume.experience[0].id);
  });
});

describe("formatting and the rest of Folio", () => {
  it("is invisible to the ATS check and the text screening software reads", () => {
    const resume = createSampleResume();
    const formatted = createSampleResume();
    formatted.experience = resume.experience.map((job) => ({
      ...job,
      bullets: job.bullets.split("\n").map((line) => `<b>${line}</b>`).join("\n"),
    }));
    formatted.basics = { ...resume.basics, name: "<b>Jordan</b> Patel" };
    expect(atsChecks(formatted).map((c) => c.score)).toEqual(atsChecks(resume).map((c) => c.score));
    expect(resumeToPlainText(formatted)).not.toContain("<b>");
  });

  it("keeps formatting on lines the Optimizer leaves alone", () => {
    const resume = createSampleResume();
    const job = resume.experience[0];
    job.bullets = "Rebuilt the <b>customer dashboard</b>\nmade a library";
    const request = optimizeRequest(resume);
    expect(request.items[0].bullets).toEqual(["Rebuilt the customer dashboard", "made a library"]);
    const next = applyOptimize(resume, {
      summary: request.summary,
      items: [{ id: job.id, bullets: ["Rebuilt the customer dashboard", "Created a shared component library"] }],
    });
    expect(next.experience[0].bullets).toBe("Rebuilt the <b>customer dashboard</b>\nCreated a shared component library");
  });
});
