import { test, expect } from "@playwright/test";

// Placeholder to prove the Playwright pipeline is wired correctly.
// Real per-persona specs (Section 10) land starting Phase 2.
test("scaffold page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("HIYYA Kitchens Command Center")).toBeVisible();
});

test("no horizontal overflow at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
