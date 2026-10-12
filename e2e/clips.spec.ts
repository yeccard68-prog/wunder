import { expect, test, type Page } from "@playwright/test";

// A learner who has finished onboarding (demo mode keeps its state on the device).
const seed = { state: { onboarded: true, username: "Test", interests: ["science", "history"], ageBand: "16+", settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" } } };

const signIn = (page: Page) =>
  page.addInitScript((s) => {
    if (!localStorage.getItem("wunder.demo.state.v3")) localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
  }, seed);
async function openClips(page: Page) {
  await signIn(page);
  await page.goto("/clips/");
  return page.getByTestId("clip-player").first();
}
const currentTime = (page: Page) => page.locator("video").first().evaluate((v: HTMLVideoElement) => v.currentTime);

test("a valid clip starts playing", async ({ page }) => {
  const player = await openClips(page);
  await expect(player).toHaveAttribute("data-status", "ready");
  await expect(player).toHaveAttribute("data-paused", "false");
  await expect.poll(() => currentTime(page)).toBeGreaterThan(0.3);
  expect(await page.locator("video").first().evaluate((v: HTMLVideoElement) => v.error)).toBeNull();
});

test("pause and resume work", async ({ page }) => {
  const player = await openClips(page);
  await expect(player).toHaveAttribute("data-paused", "false");
  await page.locator("video").first().click();
  await expect(player).toHaveAttribute("data-paused", "true");
  const at = await currentTime(page);
  await page.getByRole("button", { name: "Abspielen" }).click();
  await expect(player).toHaveAttribute("data-paused", "false");
  await expect.poll(() => currentTime(page)).not.toBe(at);
});

test("an unreachable clip shows an understandable message and can be retried", async ({ page }) => {
  await page.route("**/clips/*.mp4", (route) => route.abort());
  const player = await openClips(page);
  await expect(player).toHaveAttribute("data-status", "error");
  await expect(page.getByRole("alert").first()).toContainText("Dieser Clip lädt gerade nicht.");
  // the rest of the app keeps working
  await expect(page.getByRole("link", { name: /Quiz/ })).toBeVisible();

  await page.unroute("**/clips/*.mp4");
  await page.getByRole("button", { name: "Erneut versuchen" }).first().click();
  await expect(player).toHaveAttribute("data-status", "ready");
  await expect.poll(() => currentTime(page)).toBeGreaterThan(0.3);
});

test("a clip without an audio track plays and offers no sound button", async ({ page }) => {
  const player = await openClips(page);
  await expect(player).toHaveAttribute("data-status", "ready");
  const hasAudio = await page.locator("video").first().evaluate((v: HTMLVideoElement & { webkitAudioDecodedByteCount?: number }) => (v.webkitAudioDecodedByteCount ?? 0) > 0);
  expect(hasAudio).toBe(false);
  await expect(page.getByRole("button", { name: /Ton (ein|aus)schalten/ })).toHaveCount(0);
});

test("the clip fills the screen without horizontal scrolling", async ({ page }) => {
  const player = await openClips(page);
  await expect(player).toHaveAttribute("data-status", "ready");
  const view = page.viewportSize()!;
  const box = (await page.locator("video").first().boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(view.width + 1);
  expect(box.height).toBeGreaterThan(view.height * 0.6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("the built app opens its main pages without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openClips(page);
  for (const path of ["/", "/quiz/", "/profile/"]) {
    await page.goto(path);
    await expect(page.locator("nav")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("an explainer animation plays, can be stepped through and ends with its question", async ({ page }) => {
  await signIn(page);
  await page.goto("/explain/");
  await page.getByRole("button", { name: /Wie das Herz Blut pumpt/ }).click();
  const player = page.getByTestId("animation-player");
  await expect(player).toHaveAttribute("data-playing", "true");
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(player).toHaveAttribute("data-playing", "false");
  await page.getByRole("button", { name: "Schritt 4", exact: true }).click();
  await expect(player).toHaveAttribute("data-step", "3");
  await expect(page.getByText("4/4")).toBeVisible();
  await page.getByRole("button", { name: "Abspielen" }).click();
  await expect(page.getByText("Verstanden?")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Noch einmal ansehen" })).toBeVisible();
  const box = (await page.locator("svg[role=img]").boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
});

test("the home feed mixes question cards, clips and animations", async ({ page }) => {
  await signIn(page);
  await page.goto("/");
  await expect(page.locator("article").first()).toBeVisible();
  const clip = page.getByTestId("feed-clip").first();
  await clip.scrollIntoViewIfNeeded();
  await expect(clip.getByTestId("clip-player")).toHaveAttribute("data-status", "ready");
  await expect(clip.getByTestId("clip-player")).toHaveAttribute("data-paused", "false");
  await clip.getByRole("button", { name: /Frage zum Clip/ }).click();
  await expect(clip.getByRole("button", { name: /^A/ }).first()).toBeVisible();
  const animation = page.getByTestId("feed-animation").first();
  // the feed loads more entries as the learner scrolls
  await expect(async () => {
    await page.mouse.wheel(0, 700);
    expect(await animation.count()).toBe(1);
  }).toPass({ timeout: 20_000 });
  await animation.scrollIntoViewIfNeeded();
  await expect(animation.getByTestId("animation-player")).toHaveAttribute("data-playing", "true");
  // the clip above stops when it leaves the screen
  await expect(clip.getByTestId("clip-player")).toHaveAttribute("data-paused", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
