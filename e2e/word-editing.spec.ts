import { type Page, expect, test } from "@playwright/test";

const sheet = (page: Page) => page.locator(".origin-top-left");
const firstJobBullets = (page: Page) => sheet(page).locator("ul").first().getByRole("textbox", { name: "Bullet point" });
// Folio saves a moment after the last edit, so checks on what's saved wait for it
const readSaved = (page: Page) =>
  page.evaluate(() => {
    const library = JSON.parse(localStorage.getItem("folio:library") ?? "null");
    return JSON.parse(localStorage.getItem(`folio:resume:${library.activeId}`) ?? "null");
  });

test("format text on the page like in Word, and it's kept for the downloads", async ({ page }) => {
  await page.goto("/builder?example");

  // Bold with the keyboard shortcut
  const summary = sheet(page).getByRole("textbox", { name: "Summary" });
  await summary.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+b");
  await summary.evaluate((el) => (el as HTMLElement).blur());
  await expect(summary.locator("b")).toHaveCount(1);

  // Italic with the Format button, which keeps the selection on the page
  const company = sheet(page).getByRole("textbox", { name: "Company" }).first();
  await company.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Italic" }).click();
  await company.evaluate((el) => (el as HTMLElement).blur());
  await expect(company.locator("i")).toHaveText("Brightpath Software");

  // The grade on the degree line instead of its own line
  const degree = sheet(page).getByRole("textbox", { name: "Degree" });
  await degree.click();
  await page.keyboard.press("End");
  await page.keyboard.type(" (CGPA 3.7)");
  await page.keyboard.press("Enter");
  const details = sheet(page).getByRole("textbox", { name: "Details" });
  await details.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  await page.keyboard.press("Enter");
  await expect(sheet(page)).toContainText("B.S. Computer Science (CGPA 3.7)");
  await expect(details).toHaveCount(0);

  await expect.poll(async () => (await readSaved(page))?.education[0].degree).toBe("B.S. Computer Science (CGPA 3.7)");
  const saved = await readSaved(page);
  expect(saved.summary).toMatch(/^<b>.+<\/b>$/);
  expect(saved.experience[0].company).toBe("<i>Brightpath Software</i>");

  // The form shows just the words, with a note; the ATS check reads the words too
  await expect(page.getByText("Has bold, italic or underline from the page").first()).toBeVisible();
  await page.getByRole("radio", { name: "ATS check" }).click();
  await expect(page.getByText("<b>")).toHaveCount(0);

  // The PDF still downloads with formatting in it
  await page.getByRole("radio", { name: "Page" }).click();
  await page.locator("summary", { hasText: "Download" }).click();
  const download = page.waitForEvent("download");
  await page.getByText("Best for applying online").click();
  expect((await download).suggestedFilename()).toBe("Jordan-Patel-resume.pdf");
});

test("Enter, Backspace and Alt+arrows work on bullets like a Word list", async ({ page }) => {
  await page.goto("/builder?example");
  const bullets = firstJobBullets(page);
  await expect(bullets).toHaveCount(3);

  // Enter at the end starts a new bullet below
  await bullets.nth(0).click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(bullets).toHaveCount(4);
  await page.keyboard.type("Led the move to TypeScript");
  await bullets.nth(1).evaluate((el) => (el as HTMLElement).blur());
  await expect(bullets.nth(1)).toHaveText("Led the move to TypeScript");

  // Enter in the middle splits a bullet in two
  await bullets.nth(1).click();
  await page.keyboard.press("End");
  for (let i = 0; i < "TypeScript".length; i++) await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  await expect(bullets).toHaveCount(5);
  await expect(bullets.nth(1)).toHaveText("Led the move to");
  await expect(bullets.nth(2)).toHaveText("TypeScript");

  // Backspace at the start joins it back
  await page.keyboard.press("Backspace");
  await expect(bullets).toHaveCount(4);
  await expect(bullets.nth(1)).toHaveText("Led the move to TypeScript");

  // Alt+Down moves the bullet below the next one
  await page.keyboard.press("Alt+ArrowDown");
  await expect(bullets.nth(2)).toHaveText("Led the move to TypeScript");
  await bullets.nth(2).evaluate((el) => (el as HTMLElement).blur());

  await expect
    .poll(async () => (await readSaved(page))?.experience[0].bullets.split("\n")[2])
    .toBe("Led the move to TypeScript");
});

test("sections move up and down from the page", async ({ page }) => {
  await page.goto("/builder?example");
  const headings = sheet(page).locator("h2");
  await expect(headings.first()).toHaveText("Summary");
  await headings.first().hover();
  await sheet(page).getByRole("button", { name: "Move Summary down" }).click();
  await expect(headings.nth(0)).toHaveText("Experience");
  await expect(headings.nth(1)).toHaveText("Summary");
});
