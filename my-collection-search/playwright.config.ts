import { defineConfig } from "@playwright/test";

// Browser tests drive an already-running app (the worktree dev stack); this
// config never starts a server, so no `next dev`/`next build` runs on the host.
// `just player-e2e` resolves E2E_BASE_URL from the worktree's APP_PORT.
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/test-results",
  reporter: [["list"], ["html", { outputFolder: "./e2e/report", open: "never" }]],
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
});
