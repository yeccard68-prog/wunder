// Measures the pacing and smoothness of animations in a real browser.
//   1. build + serve the demo variant:  E2E=1 npx next build && node scripts/serve-static.mjs out-e2e 4173
//   2. node scripts/measure-animations.mjs "Herz" "Benzinmotor" "neuronales Netz"
// For each animation: authored and played duration, measured run time of first play and of a replay,
// time until the picture first changes, and frames per second while playing.
// Frame rates depend on the machine (headless browsers often render 3D in software) – compare, don't quote.
import fs from "node:fs";
import { chromium } from "@playwright/test";

const titles = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync("content/animations.json", "utf8"));
const channel = process.env.PW_CHANNEL ?? (process.platform === "win32" ? "msedge" : "chrome");
const browser = await chromium.launch({ channel });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await page.addInitScript(() => localStorage.setItem("wunder.demo.state.v3", JSON.stringify({ state: { onboarded: true, username: "Test", interests: ["science"], ageBand: "16+", settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" } } })));

// Plays to the end. The stop for the prediction question is answered at once and its duration left out.
const untilDone = async () => {
  const start = Date.now();
  let paused = 0;
  const done = page.getByRole("button", { name: "Noch einmal ansehen" });
  const predict = page.getByTestId("predict");
  while (!(await done.isVisible())) {
    if (Date.now() - start > 90_000) throw new Error("animation did not finish");
    if (await predict.isVisible()) {
      const t0 = Date.now();
      await predict.getByRole("button").first().click();
      await predict.getByRole("button", { name: "Weiter" }).click();
      await predict.waitFor({ state: "hidden" });
      paused += Date.now() - t0;
    }
    await page.waitForTimeout(100);
  }
  return (Date.now() - start - paused) / 1000;
};
const result = [];
for (const title of titles) {
  const row = rows.find((r) => r.title.includes(title));
  if (!row) throw new Error("no animation titled " + title);
  await page.goto("http://127.0.0.1:4173/explain/");
  await page.getByRole("button", { name: new RegExp(row.title) }).click();
  const player = page.getByTestId("animation-player");
  await player.waitFor();
  const renderer = await player.getAttribute("data-renderer");
  if (renderer === "three") await page.getByTestId("stage-3d").and(page.locator("[data-ready=true]")).waitFor({ timeout: 30_000 });
  // frames per second over three seconds of playback
  const fps = await page.evaluate(() => new Promise((done) => {
    let n = 0;
    const t0 = performance.now();
    const tick = () => (performance.now() - t0 < 3000 ? (n++, requestAnimationFrame(tick)) : done(Math.round(n / 3)));
    requestAnimationFrame(tick);
  }));
  // replay from the start and time both runs
  await page.getByRole("button", { name: "Schritt 1", exact: true }).click();
  const first = await untilDone();
  await page.getByRole("button", { name: "Noch einmal ansehen" }).click();
  const replay = await untilDone();
  const played = Number((await page.getByTestId("animation-player").getAttribute("data-seconds")) ?? 0);
  result.push({ animation: row.title, renderer, steps: row.steps.length, authored_s: row.steps.reduce((n, s) => n + (s.seconds ?? 6), 0), played_s: played, first_run_s: +first.toFixed(1), replay_s: +replay.toFixed(1), fps });
}
console.table(result);
await browser.close();
