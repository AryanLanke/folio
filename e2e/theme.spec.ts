import { expect, test } from "@playwright/test";

const theme = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.dataset.theme ?? "dark");

test("every visit opens in dark mode, and light mode lasts only for that visit", async ({ browser }) => {
  // A computer set to light mode, with light mode remembered from an older version of the site
  const context = await browser.newContext({ colorScheme: "light" });
  await context.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("folio:theme", "light");
      sessionStorage.setItem("seeded", "1");
    }
  });
  const page = await context.newPage();
  await page.goto("/");
  expect(await theme(page)).toBe("dark");

  // Switching to light keeps it across pages for the rest of the visit
  await page.getByRole("button", { name: "Light mode" }).click();
  await expect.poll(() => theme(page)).toBe("light");
  await page.goto("/privacy");
  expect(await theme(page)).toBe("light");

  // A new visit starts in dark again
  const next = await context.newPage();
  await next.goto("/");
  expect(await theme(next)).toBe("dark");
  await context.close();
});
