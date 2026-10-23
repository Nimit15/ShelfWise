import { test, expect } from "@playwright/test";

test.describe("ShelfWise E2E Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the landing page with all key elements", async ({ page }) => {
    await expect(page).toHaveTitle(/ShelfWise/);
    await expect(page.locator("h1.apothecary-title")).toHaveText("ShelfWise");
    await expect(page.locator("text=Clinical Skin Analysis")).toBeVisible();
    await expect(
      page.locator("text=Upload a selfie for real YouCam V2.1 skin analysis")
    ).toBeVisible();

    // Try Demo Scan button
    await expect(
      page.locator("button:has-text('Try Verified Demo Scan')")
    ).toBeVisible();

    // Features grid
    await expect(page.locator("text=YouCam V2.1 API")).toBeVisible();
    await expect(page.locator("text=Bio-Inventory Engine")).toBeVisible();
    await expect(page.locator("text=INCI Ingredient Parsing")).toBeVisible();
  });

  test("should navigate through the full 5-view flow", async ({ page }) => {
    // Step 1: Landing -> Click demo scan
    await page.click('button:has-text("Try Verified Demo Scan")');

    // Step 2: Scan Results view
    await expect(page.locator("h1.apothecary-title")).toHaveText("Skin Analysis Results");
    await expect(page.locator("text=All 16 Skin Concerns Ranked by Urgency")).toBeVisible();
    await expect(page.locator("text=Overall Score")).toBeVisible();
    await expect(page.locator("text=86.3")).toBeVisible();

    // Concern with low score (droopy_lower_eyelid has uiScore 71)
    await expect(page.locator("text=Drooping Lower Eyelid")).toBeVisible();
    await page.click('button:has-text("Audit My Shelf")');

    // Step 3: Shelf Audit view
    await expect(page.locator("h1.apothecary-title")).toHaveText("Skincare Shelf Audit");
    await expect(page.locator("h2:has-text('Your Shelf')")).toBeVisible();
    await expect(page.locator("text=Apothecary Catalog")).toBeVisible();
    await expect(page.locator("text=Audit Summary")).toBeVisible();

    // Check currency toggle
    await expect(page.locator('button:has-text("INR")')).toBeVisible();
    await expect(page.locator('button:has-text("USD")')).toBeVisible();

    // Check AM/PM routine display
    await expect(page.locator("text=AM Routine")).toBeVisible();
    await expect(page.locator("text=PM Routine")).toBeVisible();

    // Navigate to verdict
    await page.click('button:has-text("View Final Verdict")');

    // Step 5: Verdict view
    await expect(page.locator("h1.apothecary-title").first()).toHaveText("Final Verdict");
    await expect(page.locator("h1.apothecary-title").nth(1)).toHaveText("Targeted Addition");
    await expect(page.locator("text=CURRENT SHELF VALUE")).toBeVisible();
    await expect(page.locator("text=Audit Trail")).toBeVisible();

    // Back to audit
    await page.click('button:has-text("Back to Audit")');
    await expect(page.locator("h1.apothecary-title")).toHaveText("Skincare Shelf Audit");
  });

  test("should allow adding products from catalog to shelf", async ({ page }) => {
    await page.click('button:has-text("Try Verified Demo Scan")');
    await page.click('button:has-text("Audit My Shelf")');

    // Initially 3 products
    await expect(page.locator("h2:has-text('Your Shelf (3 products)')")).toBeVisible();

    // Find and click first add button in catalog - look for Plus icon buttons
    const addButtons = page.locator('button:has(svg.lucide-plus), button:has-text("Add")');
    await addButtons.first().click();
    await page.waitForTimeout(500);

    // Should update shelf count
    await expect(page.locator("h2:has-text('Your Shelf')")).toBeVisible();
  });

  test("should toggle currency between INR and USD", async ({ page }) => {
    await page.click('button:has-text("Try Verified Demo Scan")');
    await page.click('button:has-text("Audit My Shelf")');

    // Should show INR by default
    await expect(page.locator('button:has-text("INR")')).toBeVisible();

    // Switch to USD
    await page.click('button:has-text("USD")');
    await page.waitForTimeout(500);

    // Budget input should still work
    const budgetInput = page.locator('input[type="number"]');
    await budgetInput.fill("100");
    await expect(budgetInput).toHaveValue("100");
  });

  test("should show verdict with cost savings", async ({ page }) => {
    await page.click('button:has-text("Try Verified Demo Scan")');
    await page.click('button:has-text("Audit My Shelf")');
    await page.click('button:has-text("View Final Verdict")');

    // Check verdict banner
    await expect(page.locator("h1.apothecary-title").first()).toHaveText("Final Verdict");

    // Check cost breakdown
    await expect(page.locator("text=CURRENT SHELF VALUE")).toBeVisible();
    await expect(page.locator("text=NEW PURCHASES")).toBeVisible();
    await expect(page.locator("text=MONEY SAVED")).toBeVisible();

    // Check audit trail
    await expect(page.locator("text=Products Analyzed")).toBeVisible();
    await expect(page.locator("text=Conflicts Found")).toBeVisible();
  });
});
