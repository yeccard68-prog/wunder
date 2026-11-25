import { expect, test } from "@playwright/test";

// The barrel organ animation: an isometric figure whose pinned barrel turns with the clock. The learner can drag
// the crank; sound only after a tap on the sound button (the test counts the started sound sources instead of listening).
// The pipes are recordings, fetched on that tap; the button says "…" until they are there.
const seed = { state: { onboarded: true, username: "Test", interests: ["music"], ageBand: "16+", settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" } } };

test("the barrel organ turns, can be cranked by hand and only sounds after a tap", async ({ page }) => {
  await page.addInitScript((s) => {
    localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
    const w = window as unknown as { __sources: number };
    w.__sources = 0;
    for (const proto of [OscillatorNode.prototype, AudioBufferSourceNode.prototype] as unknown as { start: (...a: unknown[]) => void }[]) {
      const orig = proto.start;
      proto.start = function (this: unknown, ...a: unknown[]) { w.__sources++; return orig.apply(this, a); };
    }
  }, seed);
  await page.goto("/explain/?a=a-drehorgel");
  const player = page.getByTestId("animation-player");
  await expect(player).toHaveAttribute("data-renderer", "svg");
  const crank = page.getByTestId("organ-crank");
  await expect(crank).toBeVisible(); // the figure is loaded on demand
  await expect(page.getByText("Kurbel", { exact: true })).toBeVisible();
  await player.click({ position: { x: 20, y: 20 } }); // pause: from now on only the hand turns the barrel
  await expect(player).toHaveAttribute("data-playing", "false");
  const sound = page.getByTestId("organ-sound");
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await expect(sound).toHaveAttribute("data-state", "on", { timeout: 15_000 });
  await expect(player).toHaveAttribute("data-playing", "false"); // the tap on the button does not toggle the animation
  const before = await page.evaluate(() => (window as unknown as { __sources: number }).__sources);
  // two turns of the crank by hand
  const box = (await crank.boundingBox())!;
  const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(cx + 25, cy);
  await page.mouse.down();
  for (let i = 0; i <= 80; i++) { const a = (i / 40) * Math.PI * 2; await page.mouse.move(cx + 25 * Math.cos(a), cy + 25 * Math.sin(a)); }
  await page.mouse.up();
  const after = await page.evaluate(() => (window as unknown as { __sources: number }).__sources);
  expect(after - before).toBeGreaterThan(20); // two barrel turns: the pins opened valves about 30 times and the pipes sounded
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
});
