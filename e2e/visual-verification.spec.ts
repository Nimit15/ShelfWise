import { test, expect, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
];

async function startDemo(page: Page) {
  await page.getByRole("button", { name: "Run Demo Scan (no upload needed)" }).click();
  await expect(page.getByText("Demo fixture", { exact: true })).toBeVisible();
}

async function startResults(page: Page) {
  await startDemo(page);
  await page.getByRole("button", { name: "Begin Shelf Audit" }).click();
}

async function startAudit(page: Page) {
  await startResults(page);
  await page.getByRole("button", { name: "Shelf Audit" }).click();
}

for (const viewport of VIEWPORTS) {
  test.describe(`Visual verification · ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("landing page", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "ShelfWise", level: 1 })).toBeVisible();
      await expect(page.getByRole("button", { name: "Run Demo Scan (no upload needed)" })).toBeVisible();
      await page.screenshot({
        path: `test-results/screenshots/landing-${viewport.name}.png`,
        fullPage: true,
      });
    });

    test("scan profile and results", async ({ page }) => {
      await page.goto("/");
      await startDemo(page);
      await expect(page.getByText("Scan Profile")).toBeVisible();
      await page.getByRole("button", { name: "Begin Shelf Audit" }).click();
      await expect(page.getByText("Priority Concerns")).toBeVisible();
      await page.screenshot({
        path: `test-results/screenshots/results-${viewport.name}.png`,
        fullPage: true,
      });
    });

    test("shelf audit", async ({ page }) => {
      await page.goto("/");
      await startAudit(page);
      await expect(page.getByRole("heading", { name: "Bio-Inventory Conflicts" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Your Shelf" })).toBeVisible();
      await page.screenshot({
        path: `test-results/screenshots/audit-${viewport.name}.png`,
        fullPage: true,
      });
    });

    test("final verdict", async ({ page }) => {
      await page.goto("/");
      await startAudit(page);
      await page.getByRole("button", { name: "Final Verdict" }).click();
      await expect(page.getByRole("heading", { name: "Clinical Verdict" })).toBeVisible();
      await expect(page.getByText("Final Routine")).toBeVisible();
      await page.screenshot({
        path: `test-results/screenshots/verdict-${viewport.name}.png`,
        fullPage: true,
      });
    });
  });
}
