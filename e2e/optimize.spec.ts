import { expect, test } from "@playwright/test";

// The AI isn't called in tests: the optimize route answers with the first bullet of every item
// reworded, so this checks everything around it (the effect, the changes, revert and undo)
test("Optimize rewords the resume, shows what changed, and each change can be put back", async ({ page }) => {
  await page.route("**/api/optimize", async (route) => {
    const request = route.request().postDataJSON();
    await route.fulfill({
      json: {
        summary: request.summary,
        items: request.items.map((item: { id: string; bullets: string[] }) => ({
          id: item.id,
          bullets: item.bullets.map((line, i) => (i === 0 ? `Optimized: ${line}` : line)),
        })),
      },
    });
  });

  await page.goto("/builder?example");
  const sheet = page.locator(".origin-top-left");
  await expect(sheet).toContainText("Rebuilt the customer dashboard");

  await page.getByRole("button", { name: "Optimize" }).click();
  await expect(page.locator(".optimize-effect")).toBeVisible();

  const panel = page.getByRole("status").filter({ hasText: "Optimized" });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(/ATS score \d+/);
  await expect(panel).toContainText("Frontend Developer at Brightpath Software");
  await expect(sheet).toContainText("Optimized: Rebuilt the customer dashboard");
  await expect(page.locator(".optimize-effect")).toBeHidden();

  // One change goes back on its own; the rest stay
  await panel.locator("li", { hasText: "Brightpath" }).getByRole("button", { name: "Revert" }).click();
  await expect(sheet).not.toContainText("Optimized: Rebuilt");
  await expect(sheet).toContainText("Optimized: Built landing pages");

  // Undo all puts everything back
  await panel.getByRole("button", { name: "Undo all" }).click();
  await expect(sheet).not.toContainText("Optimized:");
  await expect(panel).toBeHidden();
});

test("when AI is busy, Optimize still tidies formatting and says why the wording didn't change", async ({ page }) => {
  await page.route("**/api/optimize", (route) => route.fulfill({ status: 503, json: { error: "busy" } }));
  await page.goto("/builder?example");

  await page.getByRole("button", { name: "Optimize" }).click();
  const panel = page.getByRole("status").filter({ hasText: /Optimized|Already in good shape/ });
  await expect(panel).toContainText("AI is busy right now");
  await expect(panel).toContainText("The wording wasn't changed");
});
