import { test, expect } from "@playwright/test";

async function switchToBrandManager(page: import("@playwright/test").Page) {
  await page.goto("/overview");
  await page.getByLabel("View as").click();
  await page.getByRole("option", { name: /Brand Manager/i }).click();
  // Brand Manager's default landing tab is still /overview, but the persona
  // switch is still an async store update — settle before the caller clicks a
  // different tab, matching the same fix in branch-owner/branch-manager specs.
  await page.waitForURL(/\/overview$/);
}

test("Brand Manager sees SOP recipes after Branches, Brand Owner never does", async ({
  page,
}) => {
  await switchToBrandManager(page);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveText([
    "Overview",
    "Sales",
    "Expenses & profit",
    "SOP & wastage",
    "Branches",
    "SOP recipes",
    "Revenue share",
  ]);

  await page.getByLabel("View as").click();
  await page.getByRole("option", { name: /Brand Owner: Gautamy/i }).click();
  await expect(page.getByRole("tab", { name: "SOP recipes" })).toHaveCount(0);
});

test("a direct load of /sop_recipes as the default (Brand Owner) persona redirects to /overview", async ({
  page,
}) => {
  await page.goto("/sop_recipes");
  await expect(page).toHaveURL(/\/overview$/);
});

test("editing a recipe qty updates the impact preview, and Apply persists across a tab switch", async ({
  page,
}) => {
  await switchToBrandManager(page);
  await page.getByRole("tab", { name: "SOP recipes" }).click();
  await expect(page).toHaveURL(/\/sop_recipes$/);

  const input = page.locator('input[type="number"]');
  await expect(input).toBeVisible();
  const currentDeviation = page.getByText("Current deviation").locator("..");
  await expect(currentDeviation).toBeVisible();

  await input.fill("0.5");
  await expect(page.getByText("New deviation, if applied").locator("..")).toBeVisible();
  await page.getByRole("button", { name: /apply to demo/i }).click();

  // The overridden qty shows in gold in the recipe table now.
  await expect(page.getByText("0.5 kg").first()).toBeVisible();

  // Persists (in-memory) across a tab round-trip.
  await page.getByRole("tab", { name: "Overview" }).click();
  await page.getByRole("tab", { name: "SOP recipes" }).click();
  await expect(page.getByText("0.5 kg").first()).toBeVisible();

  // Reset demo clears it.
  await page.getByRole("button", { name: /reset demo/i }).click();
  await expect(page.getByText(/reset to its original state/i).first()).toBeVisible();
});

test("no horizontal overflow at 390px on SOP recipes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await switchToBrandManager(page);
  await page.getByRole("tab", { name: "SOP recipes" }).click();
  await expect(page).toHaveURL(/\/sop_recipes$/);
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
