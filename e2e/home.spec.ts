import { expect, test } from "@playwright/test";

test("the home page works on a phone and has a feedback link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("resume builder");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await expect(page.locator("footer").getByRole("link", { name: "Send feedback" })).toHaveAttribute(
    "href",
    /^mailto:.+\?subject=Folio%20feedback$/,
  );
});

test("the privacy page explains backups and how to get in touch", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByText("Save backup file")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Questions" })).toBeVisible();
});
