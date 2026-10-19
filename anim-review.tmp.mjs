// Review sheets of all explainer animations: every step screenshotted after it has played for a while,
// then the four steps of one animation side by side (ffmpeg tile). Needs the demo build on :4173.
//   node anim-review.mjs <outDir> [a-id ...]
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(process.cwd() + "/");
const animations = require("./content/animations.json");
const { ffmpegPath } = await import(path.resolve("scripts/clips/ffmpeg.mjs").replace(/\\/g, "/").replace(/^/, "file:///"));
const FF = ffmpegPath();
const [out, ...only] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await page.addInitScript(() => localStorage.setItem("wunder.demo.state.v3", JSON.stringify({ state: { onboarded: true, username: "Test", interests: ["science"], ageBand: "16+", settings: { theme: "light", privateProfile: false, muted: true, captions: true, locale: "de" } } })));
for (const a of animations) {
  if (only.length && !only.includes(a.id)) continue;
  const files = [];
  for (let step = 1; step <= a.steps.length; step++) {
    await page.goto(`${process.env.BASE ?? "http://127.0.0.1:4173"}/explain/?a=${a.id}`);
    const stage = page.getByTestId("animation-player").locator("> div").first();
    await stage.waitFor({ timeout: 30_000 });
    await page.getByRole("button", { name: `Schritt ${step}`, exact: true }).click();
    await page.waitForTimeout(Number(process.env.WAIT ?? 2800));
    const f = path.join(out, `${a.id}-${step}.png`);
    await stage.screenshot({ path: f });
    files.push(f);
  }
  // one sheet per animation: steps side by side
  execFileSync(FF, ["-y", "-v", "error", ...files.flatMap((f) => ["-i", f]), "-filter_complex", `${files.map((_, i) => `[${i}:v]scale=300:400:force_original_aspect_ratio=decrease,pad=300:400:(ow-iw)/2:(oh-ih)/2:color=0x777777[s${i}]`).join(";")};${files.map((_, i) => `[s${i}]`).join("")}hstack=inputs=${files.length}`, path.join(out, `sheet-${a.id}.png`)]);
  console.log("sheet", a.id);
}
await browser.close();
