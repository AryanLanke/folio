import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { savedLibrary } from "./helpers";

test("download, back up, lose everything, and restore it all from the backup", async ({ page }) => {
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });

  await page.goto("/builder?example");
  await expect(page.locator("summary", { hasText: "Example resume" })).toBeVisible();

  // A second resume, so the backup has to hold more than one
  await page.locator("summary", { hasText: "Example resume" }).click();
  await page.getByRole("button", { name: /Duplicate this resume/ }).click();

  // An edit, so there's something the backup doesn't have yet
  const summary = page.locator("textarea").first();
  await summary.click();
  await summary.press("End");
  await summary.pressSequentially(" Test edit.");
  await expect(page.getByText("Saved in this browser only")).toBeVisible();

  // Downloading the PDF brings up the backup reminder
  await page.locator("summary", { hasText: "Download" }).click();
  const pdfDownload = page.waitForEvent("download");
  await page.getByText("Best for applying online").click();
  expect((await pdfDownload).suggestedFilename()).toBe("Emily-Carter-resume.pdf");
  const reminder = page.getByRole("status");
  await expect(reminder).toContainText("Keep a backup of your resume");

  const backupDownload = page.waitForEvent("download");
  await reminder.getByRole("button", { name: "Save backup file" }).click();
  const backup = await backupDownload;
  expect(backup.suggestedFilename()).toMatch(/^folio-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = await backup.path();
  const data = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  expect(data.resumes.map((r: { name: string }) => r.name)).toEqual(["Example resume", "Example resume (copy)"]);
  expect(data.resumes.some((r: { resume: { summary: string } }) => r.resume.summary.includes("Test edit."))).toBe(true);
  await expect(reminder).toBeHidden();

  // The browser clears Folio's storage (Safari does this to sites you haven't opened in a while)
  await page.evaluate(() => localStorage.clear());
  await page.goto("/builder");
  await expect(page.getByRole("button", { name: "Open backup" })).toBeVisible();
  await page.locator("input[type=file][accept='.json,application/json']").setInputFiles(backupPath);

  await expect.poll(() => dialogs.at(-1)).toMatch(/Restored 2 resumes/);
  const library = await savedLibrary(page);
  expect(library.items.map((i: { name: string }) => i.name)).toEqual(["Example resume", "Example resume (copy)"]);
});

test("Escape closes menus and dialogs", async ({ page }) => {
  await page.goto("/builder");
  const more = page.locator("details", { has: page.locator("summary", { hasText: "More" }) });
  await more.locator("summary").click();
  await expect(more).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(more).not.toHaveAttribute("open", "");

  await page.getByRole("button", { name: "Import resume" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("button", { name: /Build with AI/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
