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

test("books: shelf, search, a book with an interactive idea, progress, and ideas in the feed", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await signIn(page);
  await page.goto("/books/");
  await expect(page.getByTestId("book-row")).toHaveCount(20);
  await page.getByRole("searchbox").fill("Kahneman");
  await expect(page.getByTestId("book-row")).toHaveCount(1);
  await page.getByTestId("book-row").click();

  const detail = page.getByTestId("book-detail");
  await expect(detail.getByRole("heading", { level: 1 })).toHaveText("Schnelles Denken, langsames Denken");
  await expect(detail.getByText("Kernthese")).toBeVisible();
  await expect(detail.getByTestId("insight-card")).toHaveCount(3);
  await expect(detail.getByText("Einordnung und Kritik")).toBeVisible();
  // decide first, then the explanation appears
  await detail.getByRole("button", { name: /Der für 55/ }).click();
  await expect(detail.getByRole("status").filter({ hasText: "Rechnerisch richtig" })).toBeVisible();
  // a lesson: the answer stays hidden until asked for; rating it counts as learned and unlocks transfer and takeaway
  const lesson = detail.getByTestId("insight-card").nth(2);
  await expect(detail.getByTestId("book-goal")).toContainText("Du kannst");
  await expect(lesson.getByText("Etwa doppelt so schwer")).toHaveCount(0);
  await expect(lesson.getByTestId("takeaway")).toHaveCount(0);
  await lesson.getByRole("button", { name: "Antwort zeigen" }).click();
  await expect(lesson.getByText(/Etwa doppelt so schwer/)).toBeVisible();
  await lesson.getByRole("button", { name: "Gewusst" }).click();
  await expect(lesson.getByTestId("takeaway")).toContainText("Wir fürchten Verluste");
  await lesson.getByTestId("transfer").getByRole("button", { name: /Würde ich sie heute/ }).click();
  await expect(lesson.getByText("Dazu rät die Idee")).toBeVisible();
  await lesson.getByTestId("evidence").click();
  await expect(lesson.getByText(/Durch viele Untersuchungen gestützt/)).toBeVisible();
  await expect(detail.getByTestId("book-links")).toBeVisible();
  await expect(detail.getByText("1 von 3 Ideen gelernt").first()).toBeVisible();
  await expect(detail.getByText("Wissens-Check")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByText("Alle Bücher").first().click();
  await page.getByRole("searchbox").fill("");
  await expect(page.getByText("Weiterlesen")).toBeVisible(); // continue where you left off
  await expect(page.getByTestId("recall-stats")).toContainText("Ideen abgerufen");
  await page.reload();
  await expect(page.getByText("Weiterlesen")).toBeVisible(); // progress survives a reload

  // a book idea shows up in the feed and leads back to its book
  await page.goto("/");
  const idea = page.getByTestId("snap-feed").getByTestId("insight-card").first();
  await expect(async () => {
    await next(page);
    expect(await idea.count()).toBe(1);
  }).toPass({ timeout: 40_000 });
  await idea.getByRole("link", { name: "Zum Buch" }).click();
  await expect(page.getByTestId("book-detail")).toBeVisible();
  expect(errors).toEqual([]);
});

test("new question formats: put in order, estimate with a slider, fill the gap", async ({ page }) => {
  await signIn(page);
  await page.goto("/explore/");
  const find = async (query: string, text: string) => {
    await page.getByRole("searchbox").fill(query);
    const card = page.locator("article").filter({ hasText: text }).first();
    await expect(card).toBeVisible();
    return card;
  };

  const order = await find("Takte eines Benzinmotors", "Bring die vier Takte");
  await order.getByRole("button", { name: "„Ansaugen“ nach oben" }).click();
  await order.getByRole("button", { name: "„Ansaugen“ nach oben" }).click();
  await order.getByRole("button", { name: "„Arbeiten“ nach oben" }).click();
  await expect(order.locator("ol li").first()).toContainText("Ansaugen");
  await order.getByRole("button", { name: "Reihenfolge prüfen" }).click();
  await expect(order.getByText("Richtig!")).toBeVisible();
  await expect(order.getByRole("button", { name: "Reihenfolge prüfen" })).toHaveCount(0); // locked after answering

  const estimate = await find("Erdoberfläche", "Wie viel Prozent der Erdoberfläche");
  await estimate.getByRole("slider").fill("69");
  await estimate.getByRole("button", { name: "Schätzung abgeben" }).click();
  await expect(estimate.getByText("Richtig!")).toBeVisible(); // 69 is within ± 5 of 71
  await expect(estimate.getByText(/Richtig sind 71 %/)).toBeVisible();

  const blank = await find("Hauptstadt von Frankreich", "Die Hauptstadt von Frankreich ist");
  await blank.getByRole("textbox", { name: "Deine Antwort" }).fill("Lyon");
  await blank.getByRole("button", { name: "Prüfen" }).click();
  await expect(blank.getByText(/Nicht ganz/)).toBeVisible();
  await expect(blank.getByText("Paris", { exact: true }).first()).toBeVisible(); // the solution is shown
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("a question about a clip: a wrong first try gets a hint and a second attempt, not the solution", async ({ page }) => {
  await signIn(page);
  await page.goto("/explore/");
  await page.getByRole("searchbox").fill("Sonnenfinsternis");
  const clip = page.getByTestId("feed-clip").first();
  await clip.getByRole("button", { name: "Frage zum Clip" }).click();
  await clip.getByRole("button", { name: /Die Erde/ }).click();
  await expect(clip.getByTestId("clip-hint")).toContainText("zweiten Versuch");
  await expect(clip.getByRole("button", { name: /Die Erde/ })).toBeDisabled();
  await expect(clip.getByText(/Richtig|Nicht ganz/)).toHaveCount(0); // nothing is given away yet
  await clip.getByRole("button", { name: /Der Mond/ }).click();
  await expect(clip.getByText("Richtig – im zweiten Anlauf!")).toBeVisible();
  await expect(clip.getByText("Im Clip:")).toBeVisible();
  await expect(clip.getByTestId("clip-hint")).toHaveCount(0);
});

test("an animation stops once to ask what happens next, then shows it", async ({ page }) => {
  await signIn(page);
  await page.goto("/explain/?a=a-zahnraeder"); // opened directly, as from a book
  const player = page.getByTestId("animation-player");
  await expect(player).toHaveAttribute("data-asking", "true", { timeout: 15_000 });
  await expect(player).toHaveAttribute("data-playing", "false");
  const predict = page.getByTestId("predict");
  await expect(predict).toContainText("12 Zähne");
  await predict.getByRole("button", { name: "Zwei Umdrehungen" }).click();
  await expect(predict.getByRole("status")).toContainText("Nicht ganz");
  await predict.getByRole("button", { name: "Weiter" }).click();
  await expect(player).toHaveAttribute("data-asking", "false");
  await expect(player).toHaveAttribute("data-playing", "true");
  await expect(player).toHaveAttribute("data-step", "1");
});

test("jumping straight to the step that answers the prediction still asks first – without showing the answer", async ({ page }) => {
  await signIn(page);
  await page.goto("/explain/?a=a-windrad");
  const player = page.getByTestId("animation-player");
  await page.getByRole("button", { name: "Schritt 4", exact: true }).click();
  await expect(player).toHaveAttribute("data-asking", "true");
  await expect(player).toHaveAttribute("data-step", "2"); // the step before, not the one with the answer
  await page.waitForTimeout(600); // a frame already on its way must not move on either
  await expect(player).toHaveAttribute("data-step", "2");
  await expect(page.getByText("doppelter Wind: 8-fache Leistung")).toHaveCount(0);
});

test("riddles: hints come one at a time and never before they are asked for", async ({ page }) => {
  await signIn(page);
  await page.goto("/explore/");
  await page.getByRole("link", { name: /Rätsel/ }).click();
  await expect(page.getByRole("heading", { name: "Rätsel" })).toBeVisible();
  // pin the card by its question – once answered it no longer has hints, so "first card with hints" would move on
  const question = await page.locator("article", { has: page.getByTestId("hints") }).first().locator("h2").textContent();
  const card = page.locator("article", { has: page.getByRole("heading", { name: question!, exact: true }) });
  const hints = card.getByTestId("hints");
  await expect(hints.locator("p")).toHaveCount(0);
  await hints.getByRole("button", { name: /Tipp/ }).click();
  await expect(hints.locator("p")).toHaveCount(1);
  await expect(hints.getByRole("button", { name: /Noch ein Tipp/ })).toContainText("2/");
  await hints.getByRole("button", { name: /Noch ein Tipp/ }).click();
  await expect(hints.locator("p")).toHaveCount(2);
  // answering ends the hints
  await card.locator("button[class*=\"min-h-[3.25rem]\"]").first().click(); // an answer option
  await expect(card.getByTestId("hints")).toHaveCount(0);
});

test("the app is open from 16: a younger person cannot continue, and nothing is stored about them", async ({ page }) => {
  // a new visitor (German, so the texts below match whatever language the test browser reports)
  await page.addInitScript((s) => localStorage.getItem("wunder.demo.state.v3") || localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s)), { state: { settings: seed.state.settings } });
  await page.goto("/");
  await page.getByRole("button", { name: "Los geht's" }).click();
  await expect(page.getByRole("heading", { name: "Wie alt bist du?" })).toBeVisible();
  await expect(page.getByText("6 bis 9 Jahre")).toHaveCount(0); // children's age bands are not offered
  const next = page.getByRole("button", { name: "Weiter" });
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "Jünger als 16" }).click();
  await expect(page.getByTestId("too-young")).toContainText("ab 16 Jahren");
  await expect(next).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wunder.demo.state.v3") ?? "{}").state?.ageBand ?? null)).toBeNull();
  await page.getByRole("button", { name: /16 Jahre und älter/ }).click();
  await expect(next).toBeEnabled();
});

test("an account set up for a children's age band is asked for the age again", async ({ page }) => {
  await page.addInitScript((s) => localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s)), { state: { ...seed.state, ageBand: "6-9" } });
  await page.goto("/profile/");
  await expect(page.getByRole("button", { name: "Los geht's" })).toBeVisible();
  await expect(page.locator("nav")).toHaveCount(0);
});

test("interactive: compound interest – guess first, then the sliders change curve and numbers", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab/");
  await expect(page.getByTestId("visual-row")).toHaveCount(6);
  await page.getByRole("button", { name: /Zinseszins/ }).click();
  const card = page.getByTestId("visual-card");
  await expect(card).toHaveAttribute("data-revealed", "false");
  await expect(card.getByTestId("data-kind")).toHaveText("Rechenmodell mit Beispielzahlen");
  await card.getByRole("button", { name: /82\.000/ }).click(); // a wrong guess: the right one is marked, the reason given
  await expect(card.getByTestId("visual-predict").getByRole("status")).toContainText("153.000");
  await expect(card).toHaveAttribute("data-revealed", "true");
  const readout = card.getByTestId("viz-readout");
  await expect(readout).toContainText("41.103 €"); // 100 € a month, 5 %, 20 years
  await card.getByRole("slider", { name: "Laufzeit" }).fill("40");
  await expect(readout).toContainText("152.602 €");
  await expect(readout).toContainText("48.000 €"); // paid in
  await expect(card.getByText("69 % des Endwerts sind Zinsen.")).toBeVisible();
  await card.getByRole("slider", { name: "Zinssatz pro Jahr" }).fill("0");
  await expect(readout).toContainText("0 €");
  await card.getByText("Zahlen als Tabelle zeigen").click();
  await expect(card.getByRole("table")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("interactive: planets – real data, a point can be picked, axes and law can be switched", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab/?v=v-kepler");
  const card = page.getByTestId("visual-card");
  await expect(card.getByTestId("data-kind")).toHaveText("Echte Daten");
  await expect(card.locator("[data-point=ceres]")).toHaveCount(0); // only after the prediction
  await card.getByRole("button", { name: "Etwa 4,6 Jahre" }).click();
  await expect(card.locator("[data-point=ceres]")).toHaveCount(1);
  await card.locator("[data-point=jupiter]").click();
  await expect(card.getByTestId("viz-readout")).toHaveText("Jupiter: 5,2 AE von der Sonne, ein Umlauf dauert 11,9 Jahre.");
  await expect(card.getByTestId("viz-law")).toHaveCount(0);
  await card.getByRole("button", { name: "Gesetz einblenden" }).click();
  await expect(card.getByTestId("viz-law")).toHaveCount(1);
  const before = await card.locator("[data-point=earth] circle").last().getAttribute("cx");
  await card.getByRole("button", { name: "gleichmäßige Achsen" }).click();
  await expect(card.getByRole("button", { name: "logarithmische Achsen" })).toHaveAttribute("aria-pressed", "true");
  expect(await card.locator("[data-point=earth] circle").last().getAttribute("cx")).not.toBe(before);
  await expect(card.getByRole("link", { name: /Warum Planeten um die Sonne kreisen/ })).toBeVisible(); // link to the 3D animation
});

test("interactive: supply and demand – the crossing point follows the sliders and the text explains", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab/?v=v-angebot-nachfrage");
  const card = page.getByTestId("visual-card");
  await card.getByRole("button", { name: "Preis und verkaufte Menge steigen" }).click();
  await expect(card.getByTestId("viz-readout")).toContainText("1,5 €");
  await expect(card.getByTestId("viz-explain")).toContainText("im Gleichgewicht");
  const point = card.getByTestId("viz-point");
  const [x0, y0] = [Number(await point.getAttribute("cx")), Number(await point.getAttribute("cy"))];
  await card.getByRole("slider", { name: "Lust auf Eis" }).fill("1");
  await expect(card.getByTestId("viz-explain")).toContainText("Mehr Leute wollen Eis");
  expect(Number(await point.getAttribute("cx"))).toBeGreaterThan(x0); // more is sold …
  expect(Number(await point.getAttribute("cy"))).toBeLessThan(y0); // … at a higher price (up in the picture)
  await card.getByRole("slider", { name: "Lust auf Eis" }).fill("0");
  await card.getByRole("slider", { name: "Kosten der Eisdielen" }).fill("0.5");
  await expect(card.getByTestId("viz-explain")).toContainText("teurer");
  expect(Number(await point.getAttribute("cx"))).toBeLessThan(x0);
  await expect(card.getByTestId("visual-apply")).toContainText("Milch");
});

test("after the question about a clip is answered, the feed moves on by itself – or stays if asked to", async ({ page }) => {
  await signIn(page);
  await page.goto("/");
  await expect(async () => {
    await next(page);
    expect(Math.abs(await feedTop(page, "feed-clip"))).toBeLessThanOrEqual(2);
  }).toPass({ timeout: 30_000 });
  const clip = page.getByTestId("feed-clip").first();
  const answer = async () => {
    await clip.getByRole("button", { name: /Frage zum Clip/ }).click();
    const option = (letter: string) => page.getByRole("dialog", { name: "Frage zum Clip" }).getByRole("button", { name: new RegExp("^" + letter + "\\s*\\S") });
    await option("A").click();
    if (await page.getByTestId("clip-hint").isVisible().catch(() => false)) await option("B").click(); // wrong first try: second attempt
  };
  await answer();
  const notice = page.getByTestId("advance");
  await expect(notice).toContainText("Gleich geht es weiter");
  await expect(notice).toHaveCount(0, { timeout: 8_000 }); // the question closes …
  await expect.poll(() => feedTop(page, "feed-clip"), { timeout: 5_000 }).toBeLessThan(-200); // … and the next entry is on screen
});

test("interactive: speed of sound – bars switch to the relative view and can be sorted", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab/?v=v-schall");
  const card = page.getByTestId("visual-card");
  await expect(card.getByTestId("data-kind")).toHaveText("Echte Daten");
  await card.getByRole("button", { name: "Gut viermal so schnell" }).click();
  await card.locator("[data-bar=water]").click();
  await expect(card.getByTestId("viz-readout")).toHaveText("Wasser: 1.484 m/s – 4,3-mal so schnell wie in Luft.");
  await expect(card.locator("[data-bar=steel]")).toContainText("5.920 m/s");
  await card.getByRole("button", { name: "× so schnell wie in Luft" }).click();
  await expect(card.locator("[data-bar=steel]")).toContainText("17 ×");
  await expect(card.locator("[data-bar=air]")).toContainText("1 ×");
  const first = () => card.locator("[data-bar]").first().getAttribute("data-bar");
  expect(await first()).toBe("co2"); // the order of the data: gases, liquids, solids
  await card.getByRole("button", { name: "nach Tempo sortieren" }).click();
  expect(await first()).toBe("steel");
});

test("interactive: timeline – the Moon landing appears after the guess, gaps and spacing can be switched", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab/?v=v-technik-zeitleiste");
  const card = page.getByTestId("visual-card");
  await expect(card.locator("[data-event=moon]")).toHaveCount(0);
  await card.getByRole("button", { name: "66 Jahre" }).click();
  await expect(card.locator("[data-event=moon]")).toHaveCount(1);
  await card.locator("[data-event=flight]").click();
  await expect(card.getByTestId("viz-readout")).toHaveText("Erster Motorflug: 1903");
  await card.getByRole("button", { name: "Jahre dazwischen zeigen" }).click();
  await expect(card.locator("[data-event=moon]")).toContainText("+66");
  const y = () => card.locator("[data-event=bulb] circle").first().getAttribute("cy");
  const scaled = await y();
  await card.getByRole("button", { name: "maßstabsgetreu" }).click();
  await expect(card.getByRole("button", { name: "gleiche Abstände" })).toHaveAttribute("aria-pressed", "true");
  expect(await y()).not.toBe(scaled);
});

test("interactive: a timeline before Christ reads „v. Chr.“ and counts the gaps without a year 0", async ({ page }) => {
  await signIn(page);
  await page.goto("/lab/?v=v-schrift-zeitleiste");
  const card = page.getByTestId("visual-card");
  await expect(card.locator("[data-event=greek]")).toHaveCount(0); // only after the guess
  await card.getByRole("button", { name: "Gut 2.000 Jahre" }).click();
  await expect(card.locator("[data-event=greek]")).toHaveCount(1);
  await card.locator("[data-event=uruk]").click();
  await expect(card.getByTestId("viz-readout")).toHaveText("Bilderschrift in Uruk: 3300 v. Chr.");
  await card.getByRole("button", { name: "Jahre dazwischen zeigen" }).click();
  await expect(card.locator("[data-event=runes]")).toContainText("150 n. Chr.");
  await expect(card.locator("[data-event=runes]")).toContainText("+399"); // 250 BC → AD 150
});

test("3D animations: the playback speed can be chosen and is remembered; the view can be zoomed", async ({ page }) => {
  await signIn(page);
  await page.goto("/explain/?a=a-zahnraeder");
  const speed = page.getByTestId("speed");
  await expect(speed).toHaveText("1×");
  await speed.click();
  await expect(speed).toHaveText("1,5×");
  await page.reload();
  await expect(page.getByTestId("speed")).toHaveText("1,5×");
  const player = page.getByTestId("animation-player");
  if ((await player.getAttribute("data-renderer")) === "three") {
    const stage = page.getByTestId("stage-3d");
    await expect(stage).toHaveAttribute("data-ready", "true", { timeout: 20_000 });
    const zoom = stage.locator("[data-zoom]");
    await expect(zoom).toHaveAttribute("data-zoom", "1");
    await stage.getByRole("button", { name: "Näher heran" }).click();
    await expect(zoom).toHaveAttribute("data-zoom", "0.8");
    await stage.getByRole("button", { name: "Weiter weg" }).click();
    await stage.getByRole("button", { name: "Weiter weg" }).click();
    await expect(zoom).toHaveAttribute("data-zoom", "1.25");
  }
});
