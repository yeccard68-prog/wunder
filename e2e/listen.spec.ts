import { expect, test } from "@playwright/test";

// Listening cards ("Hörproben"): the theme only plays after a tap, the app makes the sound itself (Web Audio),
// and the progress bar runs while it plays. The test records which notes get scheduled instead of listening.
const seed = { state: { onboarded: true, username: "Test", interests: ["music"], ageBand: "16+", settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" } } };

test("a listening card plays its theme only after a tap", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript((s) => {
    if (!localStorage.getItem("wunder.demo.state.v3")) localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
    // count the oscillators the page starts – no sound before the tap
    const w = window as unknown as { __oscillators: number };
    w.__oscillators = 0;
    const orig = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...a: Parameters<typeof orig>) { w.__oscillators++; return orig.apply(this, a); };
  }, seed);
  await page.goto("/quiz/");
  await page.getByRole("button", { name: "Musik" }).first().click().catch(() => {}); // already chosen as interest
  const listen = page.getByTestId("listen-button");
  let found = false;
  for (let round = 0; round < 40 && !found; round++) {
    await page.getByRole("button", { name: /Runde starten|Noch eine Runde|Neue Runde/ }).first().click();
    for (let q = 0; q < 12; q++) {
      if (await listen.isVisible().catch(() => false)) { found = true; break; }
      const option = page.locator("main").getByRole("button", { name: /^A\s/ }).first();
      if (!(await option.isVisible().catch(() => false))) break;
      await option.click();
      const next = page.getByRole("button", { name: /^(Weiter|Ergebnis)/ }).first();
      if (await next.isVisible().catch(() => false)) await next.click();
    }
    if (!found) await page.goto("/quiz/");
  }
  expect(found, "a listening card turned up").toBe(true);
  expect(await page.evaluate(() => (window as unknown as { __oscillators: number }).__oscillators)).toBe(0); // nothing plays by itself
  await expect(page.getByText(/Hörprobe · \d+ s/)).toBeVisible();
  await listen.click();
  await expect(listen).toHaveAttribute("aria-label", "Hörprobe stoppen");
  expect(await page.evaluate(() => (window as unknown as { __oscillators: number }).__oscillators)).toBeGreaterThan(10); // the notes are scheduled
  await listen.click(); // stop
  await expect(listen).toHaveAttribute("aria-label", "Hörprobe abspielen");
});
