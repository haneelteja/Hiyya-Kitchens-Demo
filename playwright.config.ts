import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Every page mounts a WebGL 3D scene (the throne stage) — this machine's GPU
  // visibly stalls (Chrome's own "GPU stall due to ReadPixels" warnings) once
  // more than ~2 of those run at once, which was making tab content genuinely
  // slow to render/hydrate under the default worker count, not any app bug.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  // A modest safety margin over the 5s default — this dev machine runs several
  // background servers through a long session and occasionally needs a bit more
  // than 5s under load, even serving pre-built production chunks.
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      // Chromium at 390px rather than the iPhone 12 preset, which forces WebKit
      // (an extra browser download we don't otherwise need for this project).
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
  ],
  // Runs against the production build, not `pnpm dev`. Phase 7 split every tab
  // into its own next/dynamic chunk (ssr:false) so a session only ever downloads
  // its own role's tabs — great for real users, but under `next dev` a chunk
  // nobody's hit yet needs an on-demand compile (tens of seconds, worse under
  // Playwright's parallel workers all triggering compiles at once), which doesn't
  // reflect real behavior and made the suite genuinely flaky. The production
  // server serves pre-built chunks — fast and deterministic, and it's what a
  // real user's browser talks to anyway.
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
