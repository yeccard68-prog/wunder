import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import fig from "../components/anim/iso/drehorgel.json";
import { liftedAt } from "../components/anim/Drehorgel";

test("barrel organ: the pins play the same tune as the listening card mk98, one note at a time", () => {
  const listen = JSON.parse(fs.readFileSync("content/listen.json", "utf8")) as { id: string; notes: { midi: number[]; beats: number }[] }[];
  const tune = listen.find((s) => s.id === "mk98")!.notes;
  assert.deepEqual(fig.notes.map((n) => fig.pitches[n.key]), tune.map((n) => n.midi[0]));
  assert.equal(fig.turn, tune.reduce((a, n) => a + n.beats, 0));
  // walking through one barrel turn, the keys rise in the order of the tune, never two at once
  const heard: number[] = [];
  let last = -1;
  for (let b = 0; b < fig.turn; b += 0.05) {
    const up = liftedAt(b);
    assert.ok(up.filter(Boolean).length <= 1, `two keys at beat ${b}`);
    const i = up.indexOf(true);
    if (i >= 0 && i !== last) heard.push(fig.pitches[i]);
    if (i < 0 || i !== last) last = i;
  }
  assert.deepEqual(heard, tune.map((n) => n.midi[0]));
  assert.ok(fig.layers.feeder.length > 2 && fig.layers.pipes.length === 5);
});
