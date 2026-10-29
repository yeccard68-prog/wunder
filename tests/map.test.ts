// The small world map (public/map/world.json, built by scripts/build-map.mjs).  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const world = JSON.parse(fs.readFileSync("public/map/world.json", "utf8")) as { width: number; height: number; paths: Record<string, string>; wrap?: Record<string, string> };
const xs = (d: string) => [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => +m[1]);

test("map: shapes across the date line are drawn whole, not left out (hint #34: Russia showed only a few islands)", () => {
  const ru = xs(world.paths.RU);
  assert.ok(ru.length > 400, "Russia's mainland is in the map");
  assert.ok(Math.min(...ru) < 0.6 * world.width && Math.max(...ru) >= world.width, "from west of the Urals to the date line");
  assert.ok(world.wrap?.RU && Math.min(...xs(world.wrap.RU)) < 0, "the far east is repeated past the left edge");
  assert.ok(world.paths.FJ, "Fiji too");
  // no other shape runs far off the map – a ring that jumps across it would draw a stripe through the world
  for (const [iso, d] of Object.entries(world.paths)) {
    const x = xs(d);
    assert.ok(Math.min(...x) >= -0.05 * world.width && Math.max(...x) <= 1.05 * world.width, iso);
    for (const part of d.split(/(?=M)/)) {
      const px = xs(part);
      for (let i = 1; i < px.length; i++) assert.ok(Math.abs(px[i] - px[i - 1]) < world.width / 2, `${iso}: no stripe across the map`);
    }
  }
});
