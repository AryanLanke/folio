import { type Page, expect, test } from "@playwright/test";
import { showPage } from "./helpers";

const sheet = (page: Page) => page.locator(".origin-top-left");
const openPicker = (page: Page) => page.locator("summary", { hasText: "change template" }).click();

test("the template picker previews the resume in every template, and picking one applies it", async ({ page }) => {
  await page.goto("/builder?example");
  await expect(page.locator("summary", { hasText: "Example resume" })).toBeVisible();
  await showPage(page);
  await openPicker(page);

  const choices = page.getByRole("radiogroup", { name: "Template" }).getByRole("radio");
  await expect(choices).toHaveCount(9);
  // Each choice is a small preview of this resume, not a stock picture
  await expect(page.getByRole("radiogroup", { name: "Template" }).locator("article")).toHaveCount(9);
  await expect(page.getByRole("radiogroup", { name: "Template" }).getByText("Emily Carter").first()).toBeAttached();
  await expect(page.getByRole("radio", { name: "Classic", exact: true })).toHaveAttribute("aria-checked", "true");

  // Bold: the name in capitals over a thick bar
  await page.getByRole("radio", { name: "Bold", exact: true }).click();
  await expect(page.getByRole("radiogroup", { name: "Template" })).toBeHidden();
  await expect(page.locator("summary", { hasText: "change template" })).toContainText("Bold");
  const name = sheet(page).getByRole("textbox", { name: "Full name" });
  expect(await name.evaluate((el) => getComputedStyle(el).textTransform)).toBe("uppercase");

  // Elegant: serif name and headings over a sans-serif body
  await openPicker(page);
  await page.getByRole("radio", { name: "Elegant", exact: true }).click();
  const fonts = await sheet(page).evaluate((el) => ({
    heading: getComputedStyle(el.querySelector("h2")!).fontFamily,
    body: getComputedStyle(el.querySelector("article")!).fontFamily,
  }));
  expect(fonts.heading).toContain("Georgia");
  expect(fonts.body).toContain("Arial");

  // The choice is saved with the resume
  await expect
    .poll(() =>
      page.evaluate(() => {
        const library = JSON.parse(localStorage.getItem("folio:library") ?? "null");
        return JSON.parse(localStorage.getItem(`folio:resume:${library.activeId}`) ?? "null")?.style.template;
      }),
    )
    .toBe("elegant");
});
