import { expect, test } from "@playwright/test";

// The music box animation: an isometric figure whose pinned cylinder turns while the spring runs down. The learner can
// wind the key by dragging around it; sound only after a tap on the sound button (the test counts the started sound
// sources instead of listening). The tines' sound is computed in the browser, nothing is fetched.
const seed = { state: { onboarded: true, username: "Test", interests: ["music"], ageBand: "16+", settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" } } };

test("the music box plays, can be wound by hand and only sounds after a tap", async ({ page }) => {
  await page.addInitScript((s) => {
    localStorage.setItem("wunder.demo.state.v3", JSON.stringify(s));
    const w = window as unknown as { __sources: number };
    w.__sources = 0;
    for (const proto of [OscillatorNode.prototype, AudioBufferSourceNode.prototype] as unknown as { start: (...a: unknown[]) => void }[]) {
      const orig = proto.start;
      proto.start = function (this: unknown, ...a: unknown[]) { w.__sources++; return orig.apply(this, a); };
    }
  }, seed);
  const sources = () => page.evaluate(() => (window as unknown as { __sources: number }).__sources);
  await page.goto("/explain/?a=a-spieluhr");
  const player = page.getByTestId("animation-player");
  await expect(player).toHaveAttribute("data-renderer", "svg");
  const key = page.getByTestId("musicbox-key");
  await expect(key).toBeVisible(); // the figure is loaded on demand
  await expect(key).toHaveAttribute("aria-label", "Schlüssel"); // the labels of the batch reach the figure (in any step)
  await player.click({ position: { x: 20, y: 20 } }); // pause: from now on only the hand winds the spring
  await expect(player).toHaveAttribute("data-playing", "false");
  expect(await sources()).toBe(0); // no sound before the tap
  const sound = page.getByTestId("musicbox-sound");
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await expect(sound).toHaveAttribute("data-state", "on");
  await expect(player).toHaveAttribute("data-playing", "false"); // the tap on the button does not toggle the animation
  const spring = page.getByTestId("musicbox-spring");
  const before = Number(await spring.getAttribute("data-wind"));
  // two turns of the key by hand
  const box = (await key.boundingBox())!;
  const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(cx + 25, cy);
  await page.mouse.down();
  for (let i = 0; i <= 80; i++) { const a = (i / 40) * Math.PI * 2; await page.mouse.move(cx + 25 * Math.cos(a), cy + 25 * Math.sin(a)); }
  await page.mouse.up();
  await expect(player).toHaveAttribute("data-playing", "false");
  // two of the spring's four turns wound up (it cannot take more than full)
  expect(Number(await spring.getAttribute("data-wind"))).toBeGreaterThan(Math.min(before + 0.3, 0.95));
  // the wound spring turns the cylinder: its pins pluck the tines, which ring and sound
  await expect(page.getByTestId("tine-ringing").first()).toBeAttached({ timeout: 8_000 });
  await expect.poll(sources, { timeout: 8_000 }).toBeGreaterThan(4);
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
});
