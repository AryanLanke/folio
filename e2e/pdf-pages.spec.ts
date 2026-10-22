import fs from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import { denseResume, seedResumes } from "./helpers";

// What the preview says about pages and what the downloaded PDF really has must agree: a resume
// that "Fits on 1 page" can't download as two (the PDF once spaced skill lines like separate jobs)

async function openResume(page: Page, style: object, paper: "letter" | "a4") {
  await seedResumes(page, { r1: { name: "Test", resume: { ...denseResume, style: { ...denseResume.style, ...style } } } });
  await page.evaluate((size) => localStorage.setItem("folio:paper", size), paper);
  await page.goto("/builder");
  await expect(page.locator(".origin-top-left")).toContainText("Emily Carter");
}

async function pagesInPreview(page: Page) {
  const note = (await page.getByText(/Fits on 1 page|\d+ pages/).first().textContent()) ?? "";
  return note.startsWith("Fits") ? 1 : Number(note.match(/(\d+) pages/)?.[1]);
}

async function pagesInPdf(page: Page) {
  await page.locator("summary", { hasText: "Download" }).click();
  const download = page.waitForEvent("download");
  await page.getByText("Best for applying online").click();
  // Every page of a PDF is an object marked "/Type /Page" (the page tree is "/Type /Pages")
  const pdf = fs.readFileSync(await (await download).path()).toString("latin1");
  return pdf.match(/\/Type\s*\/Page(?![A-Za-z])/g)?.length ?? 0;
}

test("a resume that fits on one page in the preview downloads as one page", async ({ page }) => {
  await openResume(page, { template: "compact", fontSize: "medium", spacing: "compact" }, "a4");
  expect(await pagesInPreview(page)).toBe(1);
  expect(await pagesInPdf(page)).toBe(1);
});

test("a resume that runs to two pages in the preview downloads as two", async ({ page }) => {
  await openResume(page, { template: "classic", fontSize: "large", spacing: "relaxed" }, "letter");
  expect(await pagesInPreview(page)).toBe(2);
  expect(await pagesInPdf(page)).toBe(2);
});
