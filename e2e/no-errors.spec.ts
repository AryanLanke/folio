import { type Page, expect, test } from "@playwright/test";

// Collects anything that would show up as an error in the browser's console
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

test("every page and tab opens without a single error", async ({ page }) => {
  const errors = watchErrors(page);

  for (const path of ["/", "/privacy"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  await page.goto("/builder?example");
  await expect(page.locator("summary", { hasText: "Example resume" })).toBeVisible();
  for (const tab of ["Score", "ATS check", "Job match", "Page"]) {
    await page.getByRole("radio", { name: tab, exact: true }).click();
  }
  // Every template, so each one renders
  for (const template of ["Modern", "Executive", "Compact", "Serif", "Classic"]) {
    await page.getByRole("radio", { name: template, exact: true }).click();
  }
  await page.getByRole("radio", { name: "Cover letter", exact: true }).click();
  await page.getByRole("radio", { name: "Resume", exact: true }).click();

  for (const menu of ["More", "Download", "Example resume"]) {
    await page.locator("summary", { hasText: menu }).click();
    await page.keyboard.press("Escape");
  }

  // Each way of starting, from the home page buttons
  for (const path of ["/builder?chat", "/builder?score", "/builder?view=job"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("Escape");
  }

  // A phone-sized screen, both halves of the editor
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/builder?example");
  await page.getByRole("button", { name: "preview" }).click();
  await page.getByRole("button", { name: "edit" }).click();

  expect(errors).toEqual([]);
});

test("a file over 4 MB is stopped before uploading, with a plain message", async ({ page }) => {
  let uploaded = false;
  await page.route("**/api/import", (route) => {
    uploaded = true;
    return route.fulfill({ json: {} });
  });
  await page.goto("/builder");
  await page.getByRole("button", { name: "Import resume" }).click();
  await page.locator("input[type=file][accept^='.pdf']").setInputFiles({
    name: "big.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(5 * 1024 * 1024),
  });
  await page.getByRole("dialog").getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("That file is too big");
  expect(uploaded).toBe(false);
});
