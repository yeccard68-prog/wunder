import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import fig from "../components/anim/iso/spieluhr.json";
import { START, lastPluck, plucks, speed, stateAt, timeOf } from "../components/anim/Spieluhr";
import { renderTine } from "../lib/synth";

type Snippet = { id: string; notes: { midi: number[]; beats: number }[] };

test("music box: one cylinder turn plays the listening card mk105 an octave up, each pin on a tine of its note", () => {
  const listen = JSON.parse(fs.readFileSync("content/listen.json", "utf8")) as Snippet[] | { snippets: Snippet[] };
  const tune = ("snippets" in listen ? listen.snippets : listen).find((s) => s.id === "mk105")!.notes.flatMap((n) => n.midi.map((m) => m + 12));
  const turn = plucks(-0.001, fig.turn - 0.001);
  assert.deepEqual(turn.map((p) => p.midi), tune);
  for (const p of turn) assert.equal(fig.comb[p.tine], p.midi, `beat ${p.at}`);
  // the next turn plays it again, and each pin is found again as the last pluck of its tine
  assert.deepEqual(plucks(fig.turn - 0.001, 2 * fig.turn - 0.001).map((p) => p.midi), tune);
  for (const p of turn) assert.equal(lastPluck(p.tine, p.at + 0.01), p.at);
});

test("music box: two tines for a note give each tine time to settle before its next pin", () => {
  const ps = plucks(-0.001, 2 * fig.turn);
  const tineAt = new Map<number, number>(), noteAt = new Map<number, number>();
  let tineRest = Infinity, noteRest = Infinity;
  for (const p of ps) {
    if (tineAt.has(p.tine)) tineRest = Math.min(tineRest, p.at - tineAt.get(p.tine)!);
    if (noteAt.has(p.midi)) noteRest = Math.min(noteRest, p.at - noteAt.get(p.midi)!);
    tineAt.set(p.tine, p.at);
    noteAt.set(p.midi, p.at);
  }
  // the same note half a beat apart goes to the other tine of the pair
  assert.equal(noteRest, 0.5);
  assert.ok(tineRest >= 2.5, `a tine is plucked again after only ${tineRest} beats`);
});

test("music box: the spring drives the cylinder forward, ever slower, until it stops", () => {
  assert.deepEqual(stateAt(0), { beat: START, w: 0 });
  let prev = stateAt(0);
  for (let t = 0.05; t < 150; t += 0.05) {
    const s = stateAt(t);
    assert.ok(s.beat >= prev.beat - 1e-9, `the cylinder turns back at ${t} s`);
    assert.ok(s.w >= 0 && s.w <= 1);
    prev = s;
  }
  assert.equal(prev.w, 0); // run down
  assert.ok(prev.beat > 2 * fig.turn); // after more than two turns of the tune
  assert.ok(speed(1) > speed(0.5) && speed(0.5) > speed(0.1) && speed(0) === 0);
  for (const b of [0, 5, 23.5, 60]) assert.ok(Math.abs(stateAt(timeOf(b)).beat - b) < 0.02, `timeOf(${b})`);
});

test("music box: a tine sounds at its pitch, strongest at the pluck, then dies away", () => {
  const rate = 32000, x = renderTine(fig.comb[4], 3, rate);
  assert.ok(x.every(Number.isFinite));
  assert.ok(Math.max(...x.map(Math.abs)) <= 1);
  const rms = (from: number, to: number) => Math.sqrt(x.slice(from * rate, to * rate).reduce((a, v) => a + v * v, 0) / ((to - from) * rate));
  assert.ok(rms(0, 0.1) > 4 * rms(2.5, 2.9));
  const magnitude = (f: number) => {
    let re = 0, im = 0;
    for (let i = Math.round(0.4 * rate); i < 1.2 * rate; i++) {
      re += x[i] * Math.cos((2 * Math.PI * f * i) / rate);
      im += x[i] * Math.sin((2 * Math.PI * f * i) / rate);
    }
    return Math.hypot(re, im);
  };
  const f0 = 440 * 2 ** ((fig.comb[4] - 69) / 12);
  assert.ok(magnitude(f0) > 10 * Math.max(magnitude(f0 * 2 ** (1 / 12)), magnitude(f0 * 2 ** (-1 / 12))));
});
