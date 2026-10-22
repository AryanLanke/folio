import { expect, test } from "@playwright/test";
import { savedLibrary } from "./helpers";

// The AI isn't called in tests: the import route is answered with what it would send back,
// so this checks everything around it (upload, filling the editor, showing the score)
const imported = {
  resume: {
    basics: { name: "Priya Manjare", title: "Backend Developer", email: "priya@example.com", phone: "8308034464", location: "Pune", link: "github.com/priya, linkedin.com/in/priya" },
    summary: "Backend developer who builds APIs in FastAPI and MongoDB for compliance teams, with a focus on reliable scheduled jobs.",
    experience: [{ role: "Intern", company: "Ambugrid", location: "", start: "Jun 2026", end: "Present", bullets: "Developed backend services for 12 clients" }],
    education: [{ school: "Pune University", degree: "B.E. Computer Engineering", location: "", start: "2022", end: "2026", details: "" }],
    projects: [{ name: "Budget Buddy", link: "github.com/priya/budget-buddy", bullets: "Built a finance tracker used by 40 classmates" }],
    skills: "Python, FastAPI, MongoDB",
    extras: [],
  },
};

test("importing a PDF fills in the resume and shows its score", async ({ page }) => {
  let uploaded = "";
  await page.route("**/api/import", async (route) => {
    uploaded = route.request().headers()["content-type"] ?? "";
    await route.fulfill({ json: imported });
  });

  await page.goto("/builder");
  await page.getByRole("button", { name: "Import resume" }).click();
  await page.locator("input[type=file][accept^='.pdf']").setInputFiles({
    name: "priya.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test file"),
  });
  await page.getByRole("dialog").getByRole("button", { name: "Import", exact: true }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  expect(uploaded).toContain("multipart/form-data");
  await expect(page.getByText("Resume score")).toBeVisible();
  const library = await savedLibrary(page);
  expect(library.items[0].name).toBe("Priya's resume");
});

test("a busy AI shows a plain message instead of failing silently", async ({ page }) => {
  await page.route("**/api/import", (route) => route.fulfill({ status: 503, json: { error: "busy" } }));
  await page.goto("/builder");
  await page.getByRole("button", { name: "Import resume" }).click();
  await page.locator("input[type=file][accept^='.pdf']").setInputFiles({
    name: "priya.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test file"),
  });
  await page.getByRole("dialog").getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("AI is busy right now");
});

test("the firewall's rate limit shows a plain message too", async ({ page }) => {
  await page.route("**/api/import", (route) => route.fulfill({ status: 429, body: "Too Many Requests" }));
  await page.goto("/builder");
  await page.getByRole("button", { name: "Import resume" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Paste text" }).click();
  await page.getByRole("dialog").locator("textarea").fill("Priya Manjare\nBackend developer\n".repeat(10));
  await page.getByRole("dialog").getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("a lot of AI requests");
});
