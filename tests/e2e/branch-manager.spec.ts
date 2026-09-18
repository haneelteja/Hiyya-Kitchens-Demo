import { test, expect } from "@playwright/test";

async function switchToKiran(page: import("@playwright/test").Page) {
  await page.goto("/overview");
  await page.getByLabel("View as").click();
  await page.getByRole("option", { name: /Kiran/ }).click();
}

test("Kiran lands on Today with the four-tab set, and sees no P&L figures", async ({
  page,
}) => {
  await switchToKiran(page);
  await expect(page).toHaveURL(/\/today$/);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveText(["Today", "Purchases", "Stock & SOP", "Wastage"]);
  await expect(page.getByText("Net sales today")).toBeVisible();
  const bodyText = await page.locator("main").innerText();
  expect(bodyText).not.toContain("Net profit");
  expect(bodyText).not.toContain("Margin");
});

test("logging a purchase adds it to the list and shows a confirmation toast", async ({
  page,
}) => {
  await switchToKiran(page);
  await page.getByRole("tab", { name: "Purchases" }).click();
  await expect(page).toHaveURL(/\/purchases$/);

  const rows = page.locator("table tbody tr");
  await expect(rows).not.toHaveCount(0);
  const rowsBefore = await rows.count();

  await page.getByLabel("Quantity").fill("25");
  await page.getByLabel("Rate paid (₹/unit)").fill("120");
  await page.getByLabel("Supplier").fill("Test Traders");
  await page.getByRole("button", { name: /log purchase/i }).click();

  await expect(page.getByText(/Purchase logged:/i).first()).toBeVisible();
  await expect(rows).toHaveCount(rowsBefore + 1);
  await expect(rows.filter({ hasText: "Test Traders" })).toHaveCount(1);
});

test("logging wastage adds it to the list, and shows up on Today", async ({ page }) => {
  await switchToKiran(page);
  await page.getByRole("tab", { name: "Wastage" }).click();
  await expect(page).toHaveURL(/\/wastage$/);

  const rows = page.locator("table tbody tr");
  await expect(rows).not.toHaveCount(0);
  const rowsBefore = await rows.count();
  await page.getByLabel("Quantity").fill("3");
  await page.getByRole("button", { name: /log wastage/i }).click();

  await expect(page.getByText(/Wastage logged:/i).first()).toBeVisible();
  await expect(rows).toHaveCount(rowsBefore + 1);

  await expect(async () => {
    await page.getByRole("tab", { name: "Today" }).click();
    await expect(page).toHaveURL(/\/today$/, { timeout: 1000 });
  }).toPass();
  await expect(page.getByText(/Logged .* wastage/).first()).toBeVisible();
});

test("Stock & SOP shows reorder status and a read-only recipe reference (no inputs)", async ({
  page,
}) => {
  await switchToKiran(page);
  await page.getByRole("tab", { name: "Stock & SOP" }).click();
  await expect(page).toHaveURL(/\/stock_sop$/);
  await expect(page.getByText("SOP quick reference")).toBeVisible();
  await expect(page.locator('input[type="number"]')).toHaveCount(0);
});

test("Branch Manager never sees brand-only or branch-owner-only tabs", async ({
  page,
}) => {
  await switchToKiran(page);
  await expect(page.getByRole("tab", { name: "Revenue share" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "SOP recipes" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "At a glance" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Expenses & profit" })).toHaveCount(0);
});

test("a direct load of /purchases as the default (Brand Owner) persona redirects to /overview", async ({
  page,
}) => {
  await page.goto("/purchases");
  await expect(page).toHaveURL(/\/overview$/);
});

test("no horizontal overflow at 390px across all four Branch Manager tabs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await switchToKiran(page);
  for (const name of ["Today", "Purchases", "Stock & SOP", "Wastage"]) {
    await page.getByRole("tab", { name }).click();
    await expect(page.getByRole("tab", { name })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  }
});
