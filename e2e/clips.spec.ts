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
  await expect(page.getByRole("link", { name: "Entdecken" })).toBeVisible();

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
  for (const path of ["/", "/explore/", "/library/", "/quiz/", "/profile/"]) {
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

const feedTop = (page: Page, testId: string) => page.getByTestId(testId).first().evaluate((el) => Math.round(el.closest("section")!.getBoundingClientRect().top - el.closest("[data-testid=snap-feed]")!.getBoundingClientRect().top));
/** One swipe or wheel turn further in the snapping feed. */
async function next(page: Page) {
  const box = (await page.getByTestId("snap-feed").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, box.height * 0.6);
  await page.waitForTimeout(700);
}

test("the feed snaps: one entry per screen, clips and animations in between, only the current one plays", async ({ page }) => {
  await signIn(page);
  await page.goto("/");
  const feed = page.getByTestId("snap-feed");
  await expect(feed.getByRole("heading", { name: /Hallo/ })).toBeVisible();
  // the page itself does not scroll – only the feed does
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);

  const clip = page.getByTestId("feed-clip").first();
  await expect(async () => {
    await next(page);
    expect(Math.abs(await feedTop(page, "feed-clip"))).toBeLessThanOrEqual(2); // settled exactly at the top of the feed area
  }).toPass({ timeout: 30_000 });
  // every entry before it was a full screen of its own
  const kinds = await feed.locator("section[data-feed-entry]").evaluateAll((els) => els.slice(0, 4).map((el) => (el as HTMLElement).dataset.feedEntry));
  expect(kinds).toEqual(["item", "item", "item", "clip"]);
  await expect(clip.getByTestId("clip-player")).toHaveAttribute("data-status", "ready");
  await expect(clip.getByTestId("clip-player")).toHaveAttribute("data-paused", "false");
  const box = (await clip.boundingBox())!;
  const area = (await feed.boundingBox())!;
  expect(box.height).toBeGreaterThan(area.height * 0.9); // the clip fills the feed screen

  await clip.getByRole("button", { name: /Frage zum Clip/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: /^A/ }).first()).toBeVisible();
  await expect(clip.getByTestId("clip-player")).toHaveAttribute("data-paused", "true"); // paused while the question is open
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  const animation = page.getByTestId("feed-animation").first();
  await expect(async () => {
    await next(page);
    expect(await animation.count()).toBe(1);
    expect(Math.abs(await feedTop(page, "feed-animation"))).toBeLessThanOrEqual(2);
  }).toPass({ timeout: 30_000 });
  await expect(animation.getByTestId("animation-player")).toHaveAttribute("data-playing", "true");
  await expect(clip.getByTestId("clip-player")).toHaveAttribute("data-paused", "true"); // the clip stopped when it left the screen
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("explore finds content by search and topic; the library keeps saved clips", async ({ page }) => {
  await signIn(page);
  await page.goto("/explore/");
  await page.getByRole("searchbox").fill("Herz");
  await expect(page.getByRole("status").filter({ hasText: /Treffer/ })).toBeVisible();
  await expect(page.getByTestId("feed-animation").first()).toContainText("Herz");
  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: /Business/ }).click();
  await expect(page.locator("article").first()).toBeVisible();
  await page.getByRole("button", { name: /Business/ }).click();
  await expect(page.getByRole("link", { name: /Alle Clips/ })).toBeVisible();

  await page.goto("/library/");
  await expect(page.getByText("Noch nichts gemerkt")).toBeVisible();
  await page.getByRole("link", { name: "Für dich" }).click();
  await expect(async () => {
    await next(page);
    expect(Math.abs(await feedTop(page, "feed-clip"))).toBeLessThanOrEqual(2);
  }).toPass({ timeout: 30_000 });
  await page.getByTestId("feed-clip").first().getByRole("button", { name: "Merken" }).click();
  await page.getByRole("link", { name: "Bibliothek" }).click();
  await expect(page.getByTestId("feed-clip")).toHaveCount(1);
});

test("a 3D animation renders, can be stepped through and turned", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await signIn(page);
  await page.goto("/explain/");
  await page.getByRole("button", { name: /Wie DNA aufgebaut ist/ }).click();
  const player = page.getByTestId("animation-player");
  await expect(player).toHaveAttribute("data-renderer", /three|text/); // "text" where the test machine has no WebGL
  if ((await player.getAttribute("data-renderer")) === "three") {
    const stage = page.getByTestId("stage-3d");
    await expect(stage).toHaveAttribute("data-ready", "true", { timeout: 20_000 });
    // something was actually drawn: a picture of one flat colour compresses to almost nothing
    expect((await stage.locator("canvas").screenshot()).length).toBeGreaterThan(6000);
    const box = (await stage.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  }
  await page.getByRole("button", { name: "Schritt 3", exact: true }).click();
  await expect(player).toHaveAttribute("data-step", "2");
  await expect(page.getByText("Helikase")).toBeVisible();
  expect(errors).toEqual([]);
});

test("without WebGL a 3D animation falls back to the drawing or to text, and still explains", async ({ page }) => {
  await signIn(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return /webgl/.test(type) ? null : (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto("/explain/");
  await page.getByRole("button", { name: /Wie ein Benzinmotor arbeitet/ }).click();
  await expect(page.getByTestId("animation-player")).toHaveAttribute("data-renderer", "svg");
  await expect(page.locator("svg[role=img]")).toBeVisible();
  await page.getByText("Alle Animationen").click();
  await page.getByRole("button", { name: /Wie DNA aufgebaut ist/ }).click();
  await expect(page.getByTestId("animation-player")).toHaveAttribute("data-renderer", "text");
  await expect(page.getByText("Die 3D-Ansicht ist auf diesem Gerät nicht verfügbar")).toBeVisible();
  await expect(page.getByText(/verdrehte Strickleiter/)).toBeVisible();
});
