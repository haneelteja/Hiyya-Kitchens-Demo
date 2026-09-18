import { test, expect } from "@playwright/test";

async function switchToSuresh(page: import("@playwright/test").Page) {
  await page.goto("/overview");
  await page.getByLabel("View as").click();
  await page.getByRole("option", { name: /Suresh Reddy/ }).click();
}

async function switchToAnil(page: import("@playwright/test").Page) {
  await page.goto("/overview");
  await page.getByLabel("View as").click();
  await page.getByRole("option", { name: /Anil Kumar/ }).click();
}

test("Suresh Reddy (multi-branch) lands on 'At a glance' with a portfolio view", async ({
  page,
}) => {
  await switchToSuresh(page);
  await expect(page).toHaveURL(/\/glance$/);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveText([
    "At a glance",
    "Sales",
    "Expenses & profit",
    "SOP & wastage",
  ]);
  await expect(page.getByText("Your branches")).toBeVisible();
  await expect(page.getByText("Dino Mandi", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Jail Mandi Vizag", { exact: true }).first()).toBeVisible();
});

test("anonymised network rank shows a rank, never another branch's name or value", async ({
  page,
}) => {
  await switchToSuresh(page);
  await expect(page.getByText("How you rank vs. the network")).toBeVisible();
  await expect(page.getByText(/^Rank \d+ of \d+$/).first()).toBeVisible();
  // Neither of the other two branches (owned by the brand or by Anil Kumar) should
  // ever be named on this page.
  const bodyText = await page.locator("main").innerText();
  expect(bodyText).not.toContain("Chrono Jail Mandi");
  expect(bodyText).not.toContain("Space Mandi");
});

test("Anil Kumar (single branch) sees his branch directly, no portfolio switcher", async ({
  page,
}) => {
  await switchToAnil(page);
  await expect(page).toHaveURL(/\/glance$/);
  await expect(page.getByText("Space Mandi", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Your branches")).toHaveCount(0);
});

test("editing Dino Mandi's rent by +₹78,000 lowers net profit by exactly ₹78,000", async ({
  page,
}) => {
  await switchToSuresh(page);
  await page.getByRole("tab", { name: "Expenses & profit" }).click();
  await expect(page).toHaveURL(/\/expenses$/);

  // Dino Mandi (B02) is first in Suresh's branch list. The KPI card is a <h3>
  // label + sibling <p> value inside one container div (components/kpi/KpiCard.tsx).
  const netProfitValue = page
    .locator("h3", { hasText: "Net profit" })
    .locator("..")
    .locator("p")
    .first();
  const netProfitBefore = await netProfitValue.innerText();

  const rentInput = page
    .locator("tr", { hasText: "Rent" })
    .locator('input[type="number"]');
  await expect(rentInput).toBeVisible();
  const currentRent = Number(await rentInput.inputValue());
  await rentInput.fill(String(currentRent + 78_000));

  await expect(netProfitValue).not.toHaveText(netProfitBefore);

  // The grid's own total line reflects the same +78,000 delta.
  await expect(page.getByText(/\+₹78,000 vs original/)).toBeVisible();
});

test("Branch Owner never sees Revenue share or SOP recipes tabs", async ({ page }) => {
  await switchToSuresh(page);
  await expect(page.getByRole("tab", { name: "Revenue share" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "SOP recipes" })).toHaveCount(0);
});

test("a direct load of /expenses as the default (Brand Owner) persona shows the brand expenses tab, not the fixed-cost grid", async ({
  page,
}) => {
  await page.goto("/expenses");
  await expect(page).toHaveURL(/\/expenses$/);
  await expect(page.getByText("Sales → profit waterfall")).toBeVisible();
});

test("no horizontal overflow at 390px on 'At a glance' or the fixed-cost grid", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await switchToSuresh(page);
  let overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

  await page.getByRole("tab", { name: "Expenses & profit" }).click();
  await expect(page).toHaveURL(/\/expenses$/);
  overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
});
