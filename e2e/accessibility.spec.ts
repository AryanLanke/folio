import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

// Checks every page, and the menus and dialogs that open on top of them, against the WCAG 2.2
// A and AA rules axe can test automatically: contrast, labels, names, focus, target sizes and so
// on. In both themes, since light mode has its own colours. Automatic checks catch roughly half
// of accessibility problems; the rest still needs a person with a keyboard and a screen reader.

const RULES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectAccessible(page: Page, what: string) {
  // Colours still fading in would be measured half-way, so wait for things to settle
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
  const { violations } = await new AxeBuilder({ page }).withTags(RULES).analyze();
  const found = violations.map(
    (v) => `${v.id}: ${v.help}\n    ${v.nodes.map((node) => node.target.join(" ")).slice(0, 3).join("\n    ")}`,
  );
  expect(found, `accessibility problems ${what}`).toEqual([]);
}

for (const theme of ["dark", "light"] as const) {
  test.describe(`${theme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      if (theme === "light") await page.addInitScript(() => localStorage.setItem("folio:theme", "light"));
    });

    test("every page", async ({ page }) => {
      test.slow();
      for (const path of ["/", "/examples", "/examples/nurse", "/privacy", "/terms"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectAccessible(page, `on ${path}`);
      }

      await page.goto("/");
      await page.locator("details.disclosure summary").first().click();
      await expectAccessible(page, "with a question open");
    });

    test("the editor and its tabs", async ({ page }) => {
      // A full scan takes a few seconds, and there's one per tab
      test.slow();
      await page.goto("/builder?example");
      await expect(page.locator("summary", { hasText: "Example resume" })).toBeVisible();
      await expectAccessible(page, "in the editor");

      for (const tab of ["Score", "ATS check", "Job match"]) {
        await page.getByRole("radio", { name: tab, exact: true }).click();
        await expectAccessible(page, `on the ${tab} tab`);
      }
    });

    test("the editor's menus", async ({ page }) => {
      test.slow();
      await page.goto("/builder?example");
      for (const menu of ["Example resume", "More", "Download", "change template", "Change heading colour"]) {
        await page.locator("summary", { hasText: menu }).first().click();
        await expectAccessible(page, `with the ${menu} menu open`);
        await page.keyboard.press("Escape");
      }
    });

    test("the dialogs", async ({ page }) => {
      await page.goto("/builder?example");
      await page.getByRole("button", { name: "Import resume" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page, "with Import open");

      await page.goto("/builder?chat");
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page, "with Build with AI open");
    });
  });
}
