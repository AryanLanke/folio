import { expect, test } from "@playwright/test";

const headingColor = (page: import("@playwright/test").Page) =>
  page.locator(".origin-top-left h2").first().evaluate((el) => getComputedStyle(el).color);

test("rename a section by clicking its heading on the page", async ({ page }) => {
  await page.goto("/builder?example");
  const heading = page.locator(".origin-top-left").getByRole("textbox", { name: "Section title" }).first();
  await heading.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Profile");
  await page.keyboard.press("Enter");

  await expect(page.locator(".origin-top-left h2").first()).toHaveText("Profile");
  // The form on the left uses the new name too
  await expect(page.getByRole("button", { name: "Move Profile down" }).first()).toBeVisible();

  // A name screening software won't recognise gets a warning in the ATS check
  await heading.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("My story");
  await page.keyboard.press("Enter");
  await page.getByRole("radio", { name: "ATS check" }).click();
  await expect(page.getByText(/"My story" isn't a heading most ATS software looks for/)).toBeVisible();
});

test("change the heading colour from the toolbar or the dot beside a heading", async ({ page }) => {
  await page.goto("/builder?example");
  await page.getByRole("radio", { name: "Navy" }).click();
  expect(await headingColor(page)).toBe("rgb(30, 58, 95)");

  await page.locator(".origin-top-left summary", { hasText: "Change heading colour" }).first().click();
  await page.locator(".origin-top-left details[open]").getByRole("radio", { name: "Burgundy" }).click();
  expect(await headingColor(page)).toBe("rgb(139, 30, 63)");

  await page.getByRole("radio", { name: "Template colour" }).click();
  expect(await headingColor(page)).toBe("rgb(23, 23, 23)");
});

test("an earlier Enhance suggestion can be brought back and used", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/enhance", (route) => {
    calls += 1;
    return route.fulfill({ json: { lines: [calls === 1 ? "First suggestion, the better one." : "Second suggestion."], tip: null } });
  });
  await page.goto("/builder?example");

  await page.getByRole("button", { name: /Enhance/ }).first().click();
  await expect(page.getByText("First suggestion, the better one.")).toBeVisible();
  await page.getByRole("button", { name: "Shorter" }).click();
  await expect(page.getByText("Second suggestion.")).toBeVisible();
  await expect(page.getByText("Version 2 of 2")).toBeVisible();

  await page.getByRole("button", { name: "Previous version" }).click();
  await expect(page.getByText("Version 1 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Use this" }).click();
  await expect(page.locator("textarea").first()).toHaveValue("First suggestion, the better one.");
});
