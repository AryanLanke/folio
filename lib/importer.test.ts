import { describe, expect, it } from "vitest";
import { buildImportMessages, fullYears, parseImport } from "@/lib/importer";
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

  it("strips every typed bullet symbol and joins sentences a PDF split over two lines", () => {
    const resume = parseImport(
      JSON.stringify({
        basics: { name: "Priya" },
        experience: [
          {
            role: "Intern",
            company: "Ambugrid",
            bullets: [
              "• • Developed backend services for a multi-client compliance",
              "platform using FastAPI and MongoDB",
              "- Built scheduled jobs with APScheduler and",
              "Beanie for 12 clients",
              "Wrote API tests",
            ],
          },
        ],
      }),
    )!;
    expect(resume.experience[0].bullets.split("\n")).toEqual([
      "Developed backend services for a multi-client compliance platform using FastAPI and MongoDB",
      "Built scheduled jobs with APScheduler and Beanie for 12 clients",
      "Wrote API tests",
    ]);
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

describe("keeping everything on the resume", () => {
  const resume = parseImport(
    JSON.stringify({
      basics: { name: "Priya Manjare", link: "https://www.linkedin.com/in/priya?utm_source=share_via&utm_medium=member_android" },
      experience: [{ role: "Wealth Manager", company: "Nuvama", start: "Apr'25", end: "Present" }],
      projects: [{ name: "Chat App", tech: "Node.js, Socket.IO, Docker", date: "Feb’24 – May’24", bullets: ["Built it"] }],
      skills: [
        { group: "Languages:", items: ["C++", "Python"] },
        { group: "Tools", items: ["Git", "Postman"] },
      ],
      other: [
        {
          title: "Open Source & Achievements",
          items: [
            { name: "Apache Fluss", bullets: ["Contributed a documentation improvement that was merged"] },
            { name: "Solved 400+ LeetCode problems" },
          ],
        },
      ],
    }),
  )!;

  it("keeps a project's tools and dates", () => {
    expect(resume.projects[0].tech).toBe("Node.js, Socket.IO, Docker");
    expect(resume.projects[0].date).toBe("Feb 2024 – May 2024");
  });

  it("keeps skill groups and their labels", () => {
    expect(resume.skills).toBe("Languages: C++, Python\nTools: Git, Postman");
  });

  it("still reads a plain list of skills", () => {
    expect(parseImport(JSON.stringify({ basics: { name: "Sam" }, skills: ["SQL", "Excel"] }))!.skills).toBe("SQL, Excel");
  });

  it("keeps sections that fit nowhere else under their own heading", () => {
    const other = resume.extras.find((e) => e.title === "Open Source & Achievements")!;
    expect(other.kind).toBe("custom");
    expect(other.items.map((i) => i.title)).toEqual(["Apache Fluss", "Solved 400+ LeetCode problems"]);
    expect(resume.order).toContain(other.id);
  });

  it("writes out two-digit years so the ATS can read them", () => {
    expect(resume.experience[0].start).toBe("Apr 2025");
    expect(fullYears("July'24")).toBe("July 2024");
    expect(fullYears("Jun’98")).toBe("Jun 1998");
    expect(fullYears("2023 - 2025")).toBe("2023 - 2025");
  });

  it("drops share-tracking from links", () => {
    expect(resume.basics.link).toBe("https://www.linkedin.com/in/priya");
  });

  it("puts entries filed under the wrong heading back where they belong", () => {
    const misfiled = parseImport(
      JSON.stringify({
        basics: { name: "Atharva" },
        experience: [{ role: "Wealth Manager", company: "Nuvama", start: "Apr 2025", end: "Present" }],
        certifications: [{ name: "Finance Essentials", issuer: "Harvard" }],
        other: [
          {
            title: "WORK EXPERIENCE",
            items: [{ name: "Product Management Intern", detail: "DBS Bank", date: "May'24 – July'24", bullets: ["Ran a competitive analysis"] }],
          },
          { title: "Certifications", items: [{ name: "Market Concepts", detail: "Bloomberg" }] },
          { title: "Extracurricular Activities", items: [{ name: "Debate club captain" }] },
        ],
      }),
    )!;
    expect(misfiled.experience.map((j) => [j.role, j.company, j.start, j.end])).toEqual([
      ["Wealth Manager", "Nuvama", "Apr 2025", "Present"],
      ["Product Management Intern", "DBS Bank", "May 2024", "July 2024"],
    ]);
    expect(misfiled.extras.map((e) => [e.kind, e.title, e.items.length])).toEqual([
      ["certifications", "Certifications", 2],
      ["custom", "Extracurricular Activities", 1],
    ]);
  });
});

describe("sorting imported links", () => {
  const imported = (basicsLink: string, projects: { name: string; link?: string }[]) =>
    parseImport(
      JSON.stringify({
        basics: { name: "Priya Manjare", link: basicsLink },
        projects: projects.map((p) => ({ ...p, bullets: ["Built it"] })),
      }),
    )!;

  it("keeps profiles in the header and moves repository links to their projects", () => {
    const resume = imported(
      "https://github.com/Priyamanjare54, leetcode.com/u/priya, linkedin.com/in/priya-manjare, https://github.com/Priyamanjare54/budget-buddy, https://github.com/Priyamanjare54/fastapi-compliance-platform",
      [{ name: "Budget Buddy" }, { name: "Multi-client Compliance Service" }],
    );
    expect(resume.basics.link).toBe("https://github.com/Priyamanjare54, leetcode.com/u/priya, linkedin.com/in/priya-manjare");
    expect(resume.projects.map((p) => p.link)).toEqual([
      "https://github.com/Priyamanjare54/budget-buddy",
      "https://github.com/Priyamanjare54/fastapi-compliance-platform",
    ]);
  });

  it("lists each link once, however it's written", () => {
    const resume = imported("github.com/priya, https://www.GitHub.com/priya/, linkedin.com/in/priya", [
      { name: "Chat App", link: "github.com/priya/chat-app, https://github.com/priya/chat-app" },
    ]);
    expect(resume.basics.link).toBe("github.com/priya, linkedin.com/in/priya");
    expect(resume.projects[0].link).toBe("github.com/priya/chat-app");
  });

  it("drops a repository link from the header when its project already has it", () => {
    const resume = imported("github.com/priya, github.com/priya/chat-app", [{ name: "Chat App", link: "github.com/priya/chat-app" }]);
    expect(resume.basics.link).toBe("github.com/priya");
    expect(resume.projects[0].link).toBe("github.com/priya/chat-app");
  });

  it("pairs leftover repository links with projects in order when the numbers match", () => {
    const resume = imported("github.com/priya, github.com/priya/repo-one, github.com/priya/repo-two", [
      { name: "Weather Dashboard" },
      { name: "Expense Tracker" },
    ]);
    expect(resume.basics.link).toBe("github.com/priya");
    expect(resume.projects.map((p) => p.link)).toEqual(["github.com/priya/repo-one", "github.com/priya/repo-two"]);
  });

  it("keeps a repository link it can't place in the header rather than losing it", () => {
    const resume = imported("github.com/priya, github.com/priya/repo-one, github.com/priya/repo-two", [
      { name: "Weather Dashboard" },
    ]);
    expect(resume.basics.link).toBe("github.com/priya, github.com/priya/repo-one, github.com/priya/repo-two");
  });

  it("doesn't match projects on common words like app", () => {
    const resume = imported("github.com/priya/chat-app", [{ name: "Budget App", link: "github.com/priya/budget" }, { name: "Chat App" }]);
    expect(resume.projects.map((p) => p.link)).toEqual(["github.com/priya/budget", "github.com/priya/chat-app"]);
    expect(resume.basics.link).toBe("");
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
