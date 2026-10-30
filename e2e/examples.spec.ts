import { expect, test } from "@playwright/test";
import { savedLibrary, seedResumes, weakResume } from "./helpers";

test("the examples list every job, and each page fits a phone", async ({ page }) => {
  await page.goto("/examples");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Resume examples by job");
  await expect(page.locator("main > ul > li")).toHaveCount(10);

  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/examples", "/examples/nurse"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    }
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nurse resume example");
  await expect(page).toHaveTitle("Nurse resume example · Folio");
});

// Pages are streamed, so the status may already be sent; search engines go by the noindex tag
test("an unknown example shows the not-found page and isn't indexed", async ({ page }) => {
  await page.goto("/examples/astronaut");
  await expect(page.getByText("This page could not be found")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});

test("Use this example opens it in the editor, and a reload doesn't add it twice", async ({ page }) => {
  await page.goto("/examples/nurse");
  await page.evaluate(() => localStorage.clear());
  await page.getByRole("link", { name: "Use this example" }).click();

  await expect(page.locator("summary", { hasText: "Nurse example" })).toBeVisible();
  await expect(page.locator(".origin-top-left").first()).toContainText("Hannah Brooks");
  await expect(page).not.toHaveURL(/example=/);

  await page.reload();
  await expect(page.locator(".origin-top-left").first()).toContainText("Hannah Brooks");
  expect((await savedLibrary(page)).items).toHaveLength(1);
});

test("Use this example never overwrites saved resumes", async ({ page }) => {
  await seedResumes(page, { w: { name: "Weak resume", resume: weakResume } });
  await page.goto("/examples/teacher");
  await page.getByRole("link", { name: "Use this example" }).click();

  await expect(page.locator("summary", { hasText: "Teacher example" })).toBeVisible();
  await expect(page.locator(".origin-top-left").first()).toContainText("Michael Chen");

  await page.reload();
  const library = await savedLibrary(page);
  expect(library.items.map((item: { name: string }) => item.name)).toEqual(["Weak resume", "Teacher example"]);
  const weak = await page.evaluate(() => JSON.parse(localStorage.getItem("folio:resume:w") ?? "null"));
  expect(weak.basics.name).toBe("Priya Manjare");
});
