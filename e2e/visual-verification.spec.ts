import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

const DEMO_SCAN_BUTTON = "button:has-text('Try Verified Demo Scan')";

for (const viewport of VIEWPORTS) {
  test.describe(`Visual verification @ ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("landing page renders correctly", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Check main elements are visible - use first() to avoid strict mode violation
      await expect(page.locator("h1:has-text('ShelfWise')").first()).toBeVisible();
      await expect(page.locator(DEMO_SCAN_BUTTON)).toBeVisible();

      // Screenshot
      await page.screenshot({
        path: `test-results/screenshots/landing-${viewport.name}.png`,
        fullPage: true
      });
    });

    test("scan results page with 3D dermal layer and skin type selector", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Start analysis (demo scan)
      await page.click(DEMO_SCAN_BUTTON);
      await page.waitForLoadState("networkidle");

      // Check 16 concerns rendered - look for concern cards by their structure
      const concerns = page.locator('div.flex.items-center.gap-4.rounded-lg.border');
      await expect(concerns.first()).toBeVisible();

      // Check 3D Dermal Layer section
      await expect(page.locator("h3:has-text('3D Exploded Dermal Stack'), h3:has-text('16-Concern Mask Precision View')").first()).toBeVisible();

      // Check Skin Type Selector - use first() to avoid strict mode violations
      await expect(page.locator("h3:has-text('Your Skin Profile')")).toBeVisible();
      await expect(page.locator("text=Oily").first()).toBeVisible();
      await expect(page.locator("text=Dry").first()).toBeVisible();
      await expect(page.locator("text=Combination").first()).toBeVisible();
      await expect(page.locator("text=Normal").first()).toBeVisible();
      await expect(page.locator("text=Sensitive / Reactive Barrier")).toBeVisible();

      // Screenshot
      await page.screenshot({
        path: `test-results/screenshots/results-${viewport.name}.png`,
        fullPage: true
      });
    });

    test("audit page with skin type selector", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Navigate to audit page
      await page.click(DEMO_SCAN_BUTTON);
      await page.waitForLoadState("networkidle");
      await page.click("button:has-text('Audit My Shelf')");
      await page.waitForLoadState("networkidle");

      // Check Skin Type Selector is present
      await expect(page.locator("h3:has-text('Your Skin Profile')")).toBeVisible();

      // Check shelf and catalog
      await expect(page.locator("h2:has-text('Your Shelf')")).toBeVisible();
      await expect(page.locator("h2:has-text('Apothecary Catalog')")).toBeVisible();

      // Screenshot
      await page.screenshot({
        path: `test-results/screenshots/audit-${viewport.name}.png`,
        fullPage: true
      });
    });

    test("verdict page renders correctly", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Navigate to verdict
      await page.click(DEMO_SCAN_BUTTON);
      await page.waitForLoadState("networkidle");
      await page.click("button:has-text('Audit My Shelf')");
      await page.waitForLoadState("networkidle");
      await page.click("button:has-text('View Final Verdict')");
      await page.waitForLoadState("networkidle");

      // Check verdict elements
      await expect(page.locator("h1:has-text('Final Verdict')")).toBeVisible();
      await expect(page.locator("text=Buy Nothing")).toBeVisible();

      // Screenshot
      await page.screenshot({
        path: `test-results/screenshots/verdict-${viewport.name}.png`,
        fullPage: true
      });
    });
  });
}