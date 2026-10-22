import type { Page } from "@playwright/test";

// Starts the editor with these resumes already saved, the way a returning visitor would have them
export async function seedResumes(page: Page, resumes: Record<string, { name: string; resume: object }>) {
  await page.goto("/privacy");
  await page.evaluate((entries) => {
    localStorage.clear();
    const items = Object.entries(entries).map(([id, entry]) => ({ id, name: entry.name, updatedAt: 0 }));
    localStorage.setItem("folio:library", JSON.stringify({ activeId: items[0].id, items }));
    for (const [id, entry] of Object.entries(entries)) localStorage.setItem(`folio:resume:${id}`, JSON.stringify(entry.resume));
  }, resumes);
}

export async function savedLibrary(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("folio:library") ?? "null"));
}

// The big score number on the Score or ATS check tab
export async function shownScore(page: Page) {
  const text = await page.locator(".text-6xl").first().textContent();
  return Number(text?.split("/")[0]);
}

// A resume like many people import: typed bullets, a sentence split over two lines by the PDF,
// no education and a one-line summary
export const weakResume = {
  basics: { name: "Priya Manjare", title: "", email: "priya@example.com", phone: "8308034464", location: "", link: "" },
  summary: "Software developer with backend experience.",
  experience: [
    {
      id: "a",
      role: "Software Development Intern",
      company: "Ambugrid",
      location: "",
      start: "Jun 2026",
      end: "Present",
      bullets: [
        "• • Developed backend services for a multi-client compliance",
        "platform using FastAPI, MongoDB, Beanie and APScheduler.",
        "• Built scheduled jobs that send reminders to 12 clients",
      ].join("\n"),
    },
  ],
  education: [],
  projects: [],
  skills: "Python, FastAPI, MongoDB",
};
