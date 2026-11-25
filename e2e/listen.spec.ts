import { expect, test } from "@playwright/test";

// Listening cards ("Hörproben"): the theme only plays after a tap, the app makes the sound itself (Web Audio),
// and the progress bar runs while it plays. The test records which notes get scheduled instead of listening.
const seed = { state: { onboarded: true, username: "Test", interests: ["music"], ageBand: "16+", settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" } } };

test("a listening card plays its theme only after a tap", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript((s) => {
    if (!localStorage.getItem("wunder.demo.state.v3")) localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
    // count the sound sources the page starts (oscillators, piano notes) – no sound before the tap
    const w = window as unknown as { __sources: number };
    w.__sources = 0;
    for (const proto of [OscillatorNode.prototype, AudioBufferSourceNode.prototype] as unknown as { start: (...a: unknown[]) => void }[]) {
      const orig = proto.start;
      proto.start = function (this: unknown, ...a: unknown[]) { w.__sources++; return orig.apply(this, a); };
    }
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
  expect(await page.evaluate(() => (window as unknown as { __sources: number }).__sources)).toBe(0); // nothing plays by itself
  await expect(page.getByText(/Hörprobe · \d+ s/)).toBeVisible();
  await listen.click();
  await expect(listen).toHaveAttribute("aria-label", "Hörprobe stoppen");
  // the notes are prepared and scheduled a little ahead while the theme plays
  await expect.poll(() => page.evaluate(() => (window as unknown as { __sources: number }).__sources), { timeout: 5_000 }).toBeGreaterThan(3);
  await expect(listen).toHaveAttribute("aria-label", "Hörprobe stoppen");
  await listen.click(); // stop
  await expect(listen).toHaveAttribute("aria-label", "Hörprobe abspielen");
});
