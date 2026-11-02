import { test, expect, type Page } from "@playwright/test";

const DEMO_BUTTON = "Run Demo Scan (no upload needed)";

async function startDemoProfile(page: Page) {
  await page.getByRole("button", { name: DEMO_BUTTON }).click();
  await expect(page.getByText("Demo fixture", { exact: true })).toBeVisible();
}

async function startAudit(page: Page) {
  await startDemoProfile(page);
  await page.getByRole("button", { name: "Begin Shelf Audit" }).click();
}

test.describe("ShelfWise user journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("landing page introduces the live scan and sample demo", async ({ page }) => {
    await expect(page).toHaveTitle(/ShelfWise/);
    await expect(page.getByRole("heading", { name: "ShelfWise", level: 1 })).toBeVisible();
    await expect(page.getByText("YouCam V2.1 · 16-Channel Biometry · Bio-Inventory Engine")).toBeVisible();
    await expect(page.getByText("Upload Your Selfie for Analysis")).toBeVisible();
    await expect(page.getByRole("button", { name: DEMO_BUTTON })).toBeVisible();
    await expect(page.getByText("YouCam V2.1 Integration")).toBeVisible();
    await expect(page.getByText("Bio-Inventory Engine")).toBeVisible();
    await expect(page.getByText("Vehicle Matrix")).toBeVisible();
  });

  test("demo scan moves through results, shelf audit, and final verdict", async ({ page }) => {
    await startAudit(page);

    await expect(page.locator("h1").filter({ hasText: "Scan Results:" })).toBeVisible();
    await expect(page.getByText("Priority Concerns")).toBeVisible();

    await page.getByRole("button", { name: "Shelf Audit" }).click();
    await expect(page.getByRole("heading", { name: "Bio-Inventory Conflicts" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your Shelf" })).toBeVisible();
    await expect(page.getByText("High Severity")).toBeVisible();
    await expect(page.getByText("Total Conflicts")).toBeVisible();
    await expect(page.getByText("Barrier Load")).toBeVisible();
    await expect(page.getByText("Savings Identified")).toBeVisible();
    await expect(page.getByText("AM Routine")).toBeVisible();
    await expect(page.getByText("PM Routine")).toBeVisible();

    await page.getByRole("button", { name: "Final Verdict" }).click();
    await expect(page.getByRole("heading", { name: "Clinical Verdict" })).toBeVisible();
    await expect(page.getByText("Audit Summary")).toBeVisible();
    await expect(page.getByText("Final Routine")).toBeVisible();
    await expect(page.getByText("Clinical Notes")).toBeVisible();

    await page.getByRole("button", { name: "Back to Audit" }).click();
    await expect(page.getByRole("heading", { name: "Bio-Inventory Conflicts" })).toBeVisible();
  });

  test("a shelf product can be opened in the product-detail view", async ({ page }) => {
    await startAudit(page);
    await page.getByRole("button", { name: "Shelf Audit" }).click();

    const productButtons = page.locator('button:has(svg.lucide-external-link)');
    await expect(productButtons.first()).toBeVisible();
    await productButtons.first().click();
    await expect(page.locator("h1.font-serif-editorial").first()).toBeVisible();
  });

  test("currency can be changed in the shelf audit", async ({ page }) => {
    await startAudit(page);
    await page.getByRole("button", { name: "Shelf Audit" }).click();

    const currency = page.locator('select:has(option[value="USD"])');
    await expect(currency).toBeVisible();
    await currency.selectOption("USD");
    await expect(page.getByText("Savings Identified")).toBeVisible();
  });

  test("the final verdict shows the audit summary", async ({ page }) => {
    await startAudit(page);
    await page.getByRole("button", { name: "Shelf Audit" }).click();
    await page.getByRole("button", { name: "Final Verdict" }).click();

    await expect(page.getByRole("heading", { name: "Clinical Verdict" })).toBeVisible();
    for (const label of ["Products", "Conflicts", "Redundancies", "Gaps", "Compat Score"]) {
      await expect(page.locator("div.font-mono-tech").filter({ hasText: label }).first()).toBeVisible();
    }
    await expect(page.getByText("Clinical Notes")).toBeVisible();
  });
});
