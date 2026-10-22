import { expect, test } from "@playwright/test";

test("a filled-in resume still offers AI and import, and clears in one click with undo", async ({ page }) => {
  await page.goto("/builder?example");
  const name = page.getByLabel("Full name").first();
  await expect(name).toHaveValue("Emily Carter");

  await page.locator("summary", { hasText: "change template" }).click();
  await page.getByRole("radio", { name: "Bold", exact: true }).click();

  await expect(page.getByText("Changed your mind?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Build with AI" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import resume" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(name).toHaveValue("");
  await expect(page.getByText("Don't want to fill in forms?")).toBeVisible();
  // The look stays
  await expect(page.locator("summary", { hasText: "change template" })).toContainText("Bold");

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(name).toHaveValue("Emily Carter");
});

test("section headers use a drawn arrow, not the ▶ character phones show as an emoji", async ({ page }) => {
  await page.goto("/builder?example");
  const toggle = page.getByRole("button", { name: "Personal info" });
  await expect(toggle.locator("svg")).toHaveCount(1);
  await expect(toggle).not.toContainText("▶");
});
