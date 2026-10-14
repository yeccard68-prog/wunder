import { defineConfig } from "@playwright/test";

// Browser tests run against the real static export (demo variant, no backend needed).
// An installed Chrome/Edge is used because the Chromium bundled with Playwright cannot decode H.264.
const channel = process.env.PW_CHANNEL ?? (process.platform === "win32" ? "msedge" : "chrome");
const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined, // several videos decoding at once make the shared CI machine flaky
  reporter: process.env.CI ? [["github"], ["list"], ["html", { open: "never" }]] : "list", // "github": failures become annotations on the run
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel, trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    // empty backend variables → demo mode with the bundled content
    command: `npx next build && node scripts/serve-static.mjs out-e2e ${PORT}`,
    env: { E2E: "1", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
    url: `http://127.0.0.1:${PORT}/`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
});
