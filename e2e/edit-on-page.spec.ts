import { expect, test } from "@playwright/test";

// Editing straight on the resume page, like a Word document
test.describe("editing on the page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/builder?example");
    await expect(page.locator("article")).toContainText("Brightpath Software");
  });

  test("click, type and press Enter: the form and saved resume update, and Undo reverses it", async ({ page }) => {
    const company = page.locator("article").getByRole("textbox", { name: "Company" }).first();
    await company.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("Northwind Labs");
    await page.keyboard.press("Enter");

    await expect(company).toHaveText("Northwind Labs");
    // The form on the left shows the same change
    await expect(page.getByRole("textbox", { name: "Company" }).and(page.locator("input")).first()).toHaveValue("Northwind Labs");
    await expect
      .poll(() => page.evaluate(() => {
        const library = JSON.parse(localStorage.getItem("folio:library")!);
        // Empty until the first autosave, a moment after the edit
        return JSON.parse(localStorage.getItem(`folio:resume:${library.activeId}`) ?? "null")?.experience[0].company;
      }))
      .toBe("Northwind Labs");

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(company).toHaveText("Brightpath Software");
  });

  test("Escape puts the text back", async ({ page }) => {
    const summary = page.locator("article").getByRole("textbox", { name: "Summary" });
    const before = await summary.textContent();
    await summary.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("Something else entirely");
    await page.keyboard.press("Escape");
    await expect(summary).toHaveText(before!);
  });

  test("a bullet can be rewritten, and emptying it removes it", async ({ page }) => {
    const bullets = page.locator("article").getByRole("textbox", { name: "Bullet point" });
    const count = await bullets.count();

    await bullets.first().click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("Rebuilt the dashboard in React for 3 product teams");
    await page.keyboard.press("Enter");
    await expect(bullets.first()).toHaveText("Rebuilt the dashboard in React for 3 product teams");

    await bullets.first().click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.press("Delete");
    await page.keyboard.press("Enter");
    await expect(bullets).toHaveCount(count - 1);
  });

  test("pasted text arrives as plain text on one line", async ({ page }) => {
    const school = page.locator("article").getByRole("textbox", { name: "School" });
    await school.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.evaluate(() => {
      const data = new DataTransfer();
      data.setData("text/plain", "IIT\nBombay");
      data.setData("text/html", "<b>IIT</b><br>Bombay");
      document.activeElement!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
    await page.keyboard.press("Enter");
    await expect(school).toHaveText("IIT Bombay");
    expect(await school.innerHTML()).toBe("IIT Bombay");
  });
});
