import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
];

for (const viewport of VIEWPORTS) {
  test.describe(`Visual verification @ ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("landing page renders correctly", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Check main elements are visible
      await expect(page.locator("h1:has-text('ShelfWise Atelier')").first()).toBeVisible();
      await expect(page.locator("text=Upload Your Selfie for Analysis")).toBeVisible();

      // Screenshot
      await page.screenshot({
        path: `test-results/screenshots/landing-${viewport.name}.png`,
        fullPage: true
      });
    });

    test("scan results page", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Start analysis (upload test image)
      await page.setInputFiles('input[type="file"]', 'public/sample-selfie.jpg');
      await page.waitForTimeout(3000);
      await page.waitForLoadState("networkidle");

      // Click "Begin Shelf Audit" to navigate to results view
      await page.click('button:has-text("Begin Shelf Audit")');
      await page.waitForTimeout(1000);
      await page.waitForLoadState("networkidle");

      // Screenshot
      await page.screenshot({
        path: `test-results/screenshots/results-${viewport.name}.png`,
        fullPage: true
      });
    });

    test("audit page", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Navigate to audit page
      await page.setInputFiles('input[type="file"]', 'public/sample-selfie.jpg');
      await page.waitForTimeout(3000);
      await page.waitForLoadState("networkidle");

      await page.click('button:has-text("Begin Shelf Audit")');
      await page.waitForTimeout(1000);
      await page.waitForLoadState("networkidle");

      await page.click("button:has-text('Shelf Audit')");
      await page.waitForTimeout(1000);
      await page.waitForLoadState("networkidle");

      // Screenshot
      await page.screenshot({
        path: `test-results/screenshots/audit-${viewport.name}.png`,
        fullPage: true
      });
    });

    test("verdict page", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Navigate to verdict
      await page.setInputFiles('input[type="file"]', 'public/sample-selfie.jpg');
      await page.waitForTimeout(3000);
      await page.waitForLoadState("networkidle");

      await page.click('button:has-text("Begin Shelf Audit")');
      await page.waitForTimeout(1000);
      await page.waitForLoadState("networkidle");

      await page.click("button:has-text('Shelf Audit')");
      await page.waitForTimeout(1000);
      await page.waitForLoadState("networkidle");

      await page.click("button:has-text('Final Verdict')");
      await page.waitForTimeout(1000);
      await page.waitForLoadState("networkidle");

      // Screenshot
      await page.screenshot({
        path: `test-results/screenshots/verdict-${viewport.name}.png`,
        fullPage: true
      });
    });
  });
}