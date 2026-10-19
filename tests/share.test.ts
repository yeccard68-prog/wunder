import assert from "node:assert/strict";
import test from "node:test";
import { fitTitle, wrapLines } from "../lib/shareCard";

const mono = (s: string) => s.length * 10; // every character 10 px wide

test("share card: lines break between words and never exceed the width", () => {
  const lines = wrapLines("Ein Herz schlägt in einem langen Leben rund drei Milliarden Mal.", 200, mono);
  assert.deepEqual(lines, ["Ein Herz schlägt in", "einem langen Leben", "rund drei Milliarden", "Mal."]);
  assert.ok(lines.every((l) => mono(l) <= 200));
  assert.deepEqual(wrapLines("Donaudampfschifffahrtsgesellschaft", 100, mono), ["Donaudampfschifffahrtsgesellschaft"]); // a long word stays whole
});

test("share card: the title gets the largest size that fits in seven lines", () => {
  const measureAt = (s: string, size: number) => s.length * size * 0.5;
  const short = fitTitle("Kurz und knapp.", 900, measureAt);
  assert.equal(short.size, 84);
  const long = fitTitle("wort ".repeat(120).trim(), 900, measureAt);
  assert.equal(long.size, 42);
  assert.equal(long.lines.length, 7);
});
