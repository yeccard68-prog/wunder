import fs from "node:fs";
import { expect, test } from "@playwright/test";

// Sharing a fact as a picture: drawn on the device, offered as a download where the system cannot share files.
const seed = { state: { onboarded: true, username: "Test", interests: ["science"], ageBand: "16+", settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de", dailyPuzzles: false } } };

test("a fact can be shared as a picture (download where sharing files is not possible)", async ({ page }) => {
  await page.addInitScript((s) => {
    if (!localStorage.getItem("wunder.demo.state.v3")) localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
    delete (Navigator.prototype as { canShare?: unknown }).canShare;
    delete (Navigator.prototype as { share?: unknown }).share;
  }, seed);
  await page.goto("/facts/");
  const card = page.locator('[data-testid="fact-card"]:not([data-quiz])').first(); // a plain fact – quiz cards show their buttons after the guess
  const download = page.waitForEvent("download");
  await card.getByRole("button", { name: "Als Bild teilen" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^f-.+\.png$/);
  expect(fs.statSync(await file.path()).size).toBeGreaterThan(10_000); // a real picture, not an empty file
});

test("a note to the editors: choose a reason, optional text, links are refused", async ({ page }) => {
  await page.addInitScript((s) => {
    if (!localStorage.getItem("wunder.demo.state.v3")) localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
  }, seed);
  await page.goto("/facts/");
  await page.locator('[data-testid="fact-card"]:not([data-quiz])').first().getByTestId("hint-button").click();
  const sheet = page.getByTestId("hint-sheet");
  const send = sheet.getByRole("button", { name: "Hinweis senden" });
  await expect(send).toBeDisabled(); // a reason is needed
  await sheet.getByRole("button", { name: "Hier stimmt etwas nicht" }).click();
  await sheet.getByRole("textbox").fill("siehe beispiel.com");
  await expect(sheet.getByRole("alert")).toContainText("Links");
  await expect(send).toBeDisabled();
  await sheet.getByRole("textbox").fill("Laut Quelle war es 1934.");
  await send.click();
  await expect(page.getByText("Danke! Die Redaktion schaut es sich an.")).toBeVisible();
});

test("a question answered wrongly comes back when due – and asks again instead of showing the old answer", async ({ page }) => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const answers = { s1: { correct: false, at: past, categoryId: "science", difficulty: 1, box: 0, due: past, reviews: 0, correctIndex: 1, explanation: "Au" } };
  await page.addInitScript((s) => localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s)), { state: { ...seed.state, answers } });
  await page.goto("/");
  const card = page.locator("article").filter({ hasText: "Welches chemische Symbol hat Gold?" }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText("Zum Wiederholen");
  const options = card.getByRole("button", { name: /^[A-D]\s/ });
  await expect(options.first()).toBeEnabled(); // not answered yet: the options can be chosen
  await expect(card.getByText("Au", { exact: true })).toHaveCount(0); // the old explanation is not shown
});

test("myth or truth: guess first, then the verdict and the fact with its source", async ({ page }) => {
  await page.addInitScript((s) => {
    if (!localStorage.getItem("wunder.demo.state.v3")) localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
  }, seed);
  await page.goto("/facts/");
  const card = page.locator('[data-testid="fact-card"][data-quiz="myth"]').filter({ hasText: "Mauer" }).first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText("Mythos oder Wahrheit?");
  await expect(card.getByTestId("fact-detail")).toHaveCount(0); // nothing revealed before the guess
  await card.getByRole("button", { name: "Mythos" }).click();
  await expect(card.getByTestId("fact-verdict")).toContainText("Richtig");
  await expect(card).toContainText("nicht zu sehen");
  await expect(card.getByTestId("fact-detail")).toBeVisible();
});

test("the feed: today's event and a theme series to swipe", async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.install({ time: new Date(2026, 9, 21, 10) }); // 21 October: an event for this day exists
  await page.addInitScript((s) => localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s)), seed);
  await page.goto("/");
  const feed = page.getByTestId("snap-feed");
  await expect(feed.locator("section[data-feed-entry]").first()).toBeVisible();
  // formats come by chance: swipe on until today's event shows up
  for (let i = 0; i < 150 && !(await page.getByTestId("day-card").count()); i++) await feed.evaluate((el) => el.scrollBy(0, el.clientHeight));
  await expect(page.getByTestId("day-card")).toContainText("Heute vor 147 Jahren");
  await expect(page.getByTestId("day-card")).toContainText("Glühlampe");
  for (let i = 0; i < 150 && !(await page.getByTestId("series-card").count()); i++) await feed.evaluate((el) => el.scrollBy(0, el.clientHeight));
  const series = page.getByTestId("series-card").first();
  await expect(series).toContainText("3 Fakten");
  await expect(series.getByTestId("series-slide")).toHaveCount(3);
  await series.getByRole("button", { name: "Fakt 3" }).click();
  await expect(series).toContainText("3/3");
});
