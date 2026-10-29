// Still pictures of the 3D animations, one per step, for devices without WebGL (AnimationPlayer shows them when a
// 3D scene cannot run and there is no drawn 2D scene). Writes public/anim-stills/<id>-<step>.jpg and adds the id to
// content/anim-stills.json. Needs the app running locally (npm run dev). One browser per animation – software
// rendering does not cope with several 3D pages in a row:
//   for id in $(node -e 'console.log(require("./content/animations.json").filter(a=>a.renderer==="three"&&!a.fallback_scene).map(a=>a.id).join(" "))'); do node scripts/anim-stills.mjs http://localhost:3005 $id; done
import { chromium } from "playwright";
import fs from "node:fs";

const [base, id] = process.argv.slice(2);
const a = JSON.parse(fs.readFileSync("content/animations.json", "utf8")).find((x) => x.id === id);
fs.mkdirSync("public/anim-stills", { recursive: true });
// GPU=1 renders on the graphics card: the animation then runs in real time, so the moments below are the ones meant
// (software rendering is slower than the clock, and the scene falls behind)
const browser = await chromium.launch({ channel: "msedge", args: process.env.GPU ? ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
await page.goto(base + "/");
await page.getByRole("button", { name: /Los geht/ }).click();
for (let i = 0; i < 25; i++) {
  const age = page.getByRole("button", { name: /16 Jahre/ });
  if (await age.count()) await age.first().click();
  const topic = page.getByRole("button", { name: /^Wissenschaft/ });
  if ((await topic.count()) && i < 3) await topic.first().click({ timeout: 1500 }).catch(() => {});
  const ans = page.getByRole("button", { name: /^A\s/ });
  if (await ans.count()) await ans.first().click({ timeout: 1500 }).catch(() => {});
  const next = page.getByRole("button", { name: /^(Weiter|Zum Feed)/ });
  if (!(await next.count())) break;
  await next.first().click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);
}
await page.goto(`${base}/explain/?a=${id}`);
const player = page.getByTestId("animation-player");
await player.waitFor();
// only the 3D picture: no labels (they would be in one language only), no zoom buttons, no app header over it
await page.addStyleTag({ content: "[data-testid=stage-3d] span, [data-testid=stage-3d] p, [data-testid=stage-3d] button { visibility: hidden !important } header { display: none !important }" });
await page.getByRole("button", { name: "Pause" }).click({ timeout: 1500 }).catch(() => {});
for (let n = 1; n <= a.steps.length; n++) {
  // played to its end, the animation makes way for the check question: answer it and the animation comes back
  if (await page.getByTestId("animation-aside").count()) {
    await page.getByRole("button", { name: /^As/ }).first().click();
    await player.waitFor();
    await page.getByRole("button", { name: "Pause" }).click({ timeout: 1500 }).catch(() => {});
  }
  await page.getByRole("button", { name: `Schritt ${n}`, exact: true }).click();
  if ((await player.getAttribute("data-asking")) === "true") {
    // the prediction stops before this step: answer it and go on
    await page.getByTestId("predict").getByRole("button").first().click();
    await page.getByTestId("predict").getByRole("button", { name: "Weiter" }).click({ timeout: 1500 }).catch(() => {});
  }
  // play a little into the step; the last one nearly to its end (where it usually shows the result) – played to the
  // very end, the animation would make way for the check question
  const last = n === a.steps.length;
  const paced = Math.max(3.6, (a.steps[n - 1].seconds ?? 6) * (a.timing?.pace ?? 0.7));
  await page.getByRole("button", { name: "Abspielen" }).click({ timeout: 1500 }).catch(() => {});
  // a prediction may also stop the player only once it reaches the step: answer it and play on
  await page.waitForTimeout(600);
  if ((await player.getAttribute("data-asking")) === "true") {
    // a right guess plays on by itself, a wrong one through "Weiter" – no waiting for a button that is not there
    await page.getByTestId("predict").getByRole("button").first().click();
    const go = page.getByTestId("predict").getByRole("button", { name: "Weiter" });
    if (await go.count()) await go.click();
  }
  await page.waitForTimeout(last ? paced * 800 : 3000);
  await page.getByRole("button", { name: "Pause" }).click({ timeout: 1500 }).catch(() => {});
  await page.getByTestId("stage-3d").screenshot({ path: `public/anim-stills/${id}-${n - 1}.jpg`, type: "jpeg", quality: 72 });
}
await browser.close();
const list = fs.existsSync("content/anim-stills.json") ? JSON.parse(fs.readFileSync("content/anim-stills.json", "utf8")) : [];
fs.writeFileSync("content/anim-stills.json", JSON.stringify([...new Set([...list, id])].sort()) + "\n");
console.log("ok", id);
