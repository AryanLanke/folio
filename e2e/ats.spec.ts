import { expect, test } from "@playwright/test";
import { seedResumes, shownScore, weakResume } from "./helpers";

test("a weak resume can't get full marks, and broken bullets fix in one click with undo", async ({ page }) => {
  await seedResumes(page, { w: { name: "Weak resume", resume: weakResume } });
  await page.goto("/builder?view=ats");

  await expect(page.getByText("ATS score")).toBeVisible();
  const before = await shownScore(page);
  expect(before).toBeLessThan(75);

  const bulletCheck = page.locator("li", { hasText: "Bullet formatting" });
  await expect(bulletCheck.getByLabel("Needs fixing")).toBeVisible();
  await expect(page.locator("li", { hasText: "Education" }).getByLabel("Needs fixing")).toBeVisible();

  await bulletCheck.getByRole("button", { name: /Fix automatically/ }).click();
  await expect(bulletCheck.getByLabel("Passed")).toBeVisible();
  await expect(bulletCheck.getByRole("button", { name: /Fix automatically/ })).toBeHidden();
  const after = await shownScore(page);
  expect(after).toBeGreaterThan(before);

  // The fix is one undo step
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(bulletCheck.getByLabel("Needs fixing")).toBeVisible();
  expect(await shownScore(page)).toBe(before);
});

test("the Score tab shows the same ATS score as the ATS check tab", async ({ page }) => {
  await seedResumes(page, { w: { name: "Weak resume", resume: weakResume } });
  await page.goto("/builder?view=ats");
  const ats = await shownScore(page);
  await page.getByRole("radio", { name: "Score", exact: true }).click();
  await expect(page.getByText("Resume score")).toBeVisible();
  await expect(page.locator("section", { hasText: "The same checks as the ATS check tab" })).toContainText(`${ats}/100`);
});
