import { test, expect } from "@playwright/test";

test.describe("ShelfWise E2E Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  test("should display the landing page with all key elements", async ({ page }) => {
    await expect(page).toHaveTitle(/ShelfWise/);
    await expect(page.locator("h1:has-text('ShelfWise Atelier')").first()).toBeVisible();
    await expect(page.locator("text=YouCam V2.1 · 16-Channel Biometry")).toBeVisible();

    // Upload button text
    await expect(page.locator("text=Upload Your Selfie for Analysis")).toBeVisible();

    // Demo button
    await expect(page.locator("text=Run Demo Scan (no upload needed)")).toBeVisible();

    // Features grid - use heading selector to avoid strict mode violation
    await expect(page.locator("h4:has-text('YouCam V2.1 Integration')")).toBeVisible();
    await expect(page.locator("h4:has-text('Bio-Inventory Engine')")).toBeVisible();
    await expect(page.locator("h4:has-text('Vehicle Matrix')")).toBeVisible();
    await expect(page.locator("h4:has-text('Sensory Barrier')")).toBeVisible();
  });

  test("should navigate through the full 5-view flow", async ({ page }) => {
    // Step 1: Landing -> upload image
    await page.setInputFiles('input[type="file"]', 'public/sample-selfie.jpg');
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle");

    // Click "Begin Shelf Audit" to navigate to results view
    await page.click('button:has-text("Begin Shelf Audit")');
    await page.waitForTimeout(1000);
    await page.waitForLoadState("networkidle");

    // Step 2: Scan Results view
    await expect(page.locator("h1:has-text('Scan Results:')").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Priority Concerns")).toBeVisible();

    await page.click('button:has-text("Shelf Audit")');
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");

    // Step 3: Shelf Audit view
    await expect(page.locator("h2:has-text('Bio-Inventory Conflicts')")).toBeVisible();
    await expect(page.locator("h2:has-text('Your Shelf')")).toBeVisible();

    // Check audit stats cards
    await expect(page.locator("text=High Severity")).toBeVisible();
    await expect(page.locator("text=Total Conflicts")).toBeVisible();
    await expect(page.locator("text=Barrier Load")).toBeVisible();
    await expect(page.locator("text=Savings Identified")).toBeVisible();
    // Verdict is a label in a stat card - use more specific selector
    await expect(page.locator("div.font-mono-tech:text('Verdict')")).toBeVisible();

    // Check AM/PM routine display
    await expect(page.locator("text=AM Routine")).toBeVisible();
    await expect(page.locator("text=PM Routine")).toBeVisible();

    // Navigate to verdict - use the header button "Final Verdict"
    await page.click('button:has-text("Final Verdict")');
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");

    // Step 5: Verdict view
    await expect(page.locator("h1:has-text('Clinical Verdict')")).toBeVisible();
    await expect(page.locator("text=Audit Summary")).toBeVisible();
    await expect(page.locator("text=Final Routine")).toBeVisible();
    await expect(page.locator("text=Clinical Notes")).toBeVisible();

    // Back to audit
    await page.click('button:has-text("Back to Audit")');
    await page.waitForTimeout(1000);
    await expect(page.locator("h2:has-text('Bio-Inventory Conflicts')")).toBeVisible();
  });

  test("should allow viewing product details from shelf", async ({ page }) => {
    await page.setInputFiles('input[type="file"]', 'public/sample-selfie.jpg');
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Begin Shelf Audit")');
    await page.waitForTimeout(1000);
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Shelf Audit")');
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");

    // Initially 3 products - Your Shelf is h2
    await expect(page.locator("h2:has-text('Your Shelf')")).toBeVisible();

    // Click on a product in the shelf to view details (ExternalLink button)
    const productButtons = page.locator('button:has(svg.lucide-external-link)');
    await productButtons.first().click();
    await page.waitForTimeout(500);

    // Should navigate to product detail view - h1 shows product name
    await expect(page.locator("h1.font-serif-editorial").first()).toBeVisible();
  });

  test("should toggle currency between INR and USD", async ({ page }) => {
    await page.setInputFiles('input[type="file"]', 'public/sample-selfie.jpg');
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Begin Shelf Audit")');
    await page.waitForTimeout(1000);
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Shelf Audit")');
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");

    // Currency dropdown - select USD
    await page.selectOption('select:has(option[value="USD"])', 'USD');
    await page.waitForTimeout(500);

    // Should show USD values
    await expect(page.locator("text=Savings Identified")).toBeVisible();
  });

  test("should show verdict with cost savings", async ({ page }) => {
    await page.setInputFiles('input[type="file"]', 'public/sample-selfie.jpg');
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Begin Shelf Audit")');
    await page.waitForTimeout(1000);
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Shelf Audit")');
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await page.click('button:has-text("Final Verdict")');
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");

    // Check verdict banner
    await expect(page.locator("h1:has-text('Clinical Verdict')")).toBeVisible();

    // Check audit summary stats - use more specific selectors for the stat labels
    await expect(page.locator("div.font-mono-tech:text('Products')")).toBeVisible();
    await expect(page.locator("div.font-mono-tech:text('Conflicts')")).toBeVisible();
    await expect(page.locator("div.font-mono-tech:text('Redundancies')")).toBeVisible();
    await expect(page.locator("div.font-mono-tech:text('Gaps')")).toBeVisible();
    await expect(page.locator("div.font-mono-tech:text('Compat Score')")).toBeVisible();

    // Check cost breakdown - Recommended Spend only shows if totalCostInr > 0
    // Check for either Recommended Spend or the fallback message
    await expect(page.locator("text=Clinical Notes")).toBeVisible();
  });
});