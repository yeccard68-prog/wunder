import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { crossfadeLoop, findLoop, midiOf, onsetIndex, partial, pitch } from "../scripts/sounds/dsp.mjs";
import { SAMPLES, nearest } from "../lib/samples";
import { allSnippets, schedule } from "../lib/listen";
import fig from "../components/anim/iso/drehorgel.json";

// Recorded notes: the helpers that cut them to size (scripts/sounds/dsp.mjs) are checked on made-up tones; the list
// lib/samples.json is checked against the files in public/sounds and against the notes the app plays.
const RATE = 32000;
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
const tone = (f: number, secs: number, stretch = 0, lead = 0) => {
  const x = new Float32Array(Math.round(secs * RATE));
  for (let i = Math.round(lead * RATE); i < x.length; i++) {
    const t = i / RATE - lead;
    for (let h = 1; h <= 6; h++) x[i] += (0.3 / h) * Math.sin(2 * Math.PI * f * h * (1 + stretch * h * h) * t);
  }
  return x;
};
const cents = (a: number, b: number) => 1200 * Math.log2(a / b);

test("note names: scientific octaves (middle C = C4) and the organ maker's (middle C = C3)", () => {
  assert.equal(midiOf("C4"), 60);
  assert.equal(midiOf("E3"), 52);
  assert.equal(midiOf("F#4"), 66);
  assert.equal(midiOf("C3", 3), 60);
  assert.equal(midiOf("F#3", 3), 66);
  assert.equal(midiOf("D4", 3), 74);
  assert.throws(() => midiOf("H2"));
});

test("where a note starts, and its pitch – also when the overtones of a string are a little sharp", () => {
  const x = tone(hz(60), 1, 0, 0.1);
  const on = onsetIndex(x, 0.02);
  assert.ok(Math.abs(on - 0.1 * RATE) < 0.002 * RATE, `onset ${on}`);
  for (const m of [52, 66, 88]) {
    const p = pitch(tone(hz(m), 0.6), RATE, 1000, 4096, hz(m) / 2.2, hz(m) * 2.2);
    assert.ok(Math.abs(cents(p.hz, hz(m))) < 5 && p.clarity > 0.9, `${m}: ${p.hz}`); // only a rough check of the note
  }
  // an octave too high or too low is not mistaken for the note
  const high = pitch(tone(hz(72), 0.6), RATE, 1000, 4096, hz(60) / 2.2, hz(60) * 2.2);
  assert.ok(Math.abs(cents(high.hz, hz(72))) < 5);
  // a stretched string: the fundamental is found, not the pull of the overtones
  const piano = tone(hz(64), 1, 0.0004);
  assert.ok(Math.abs(cents(partial(piano, RATE, 1000, 16000, hz(64)), hz(64) * 1.0004)) < 1);
});

test("a sustained note loops without a jump: the end of the loop runs into its start", () => {
  // an organ-like tone whose loudness drifts a little, so no loop is perfect
  const f = hz(70), x = new Float32Array(3 * RATE);
  for (let i = 0; i < x.length; i++) {
    const t = i / RATE;
    for (let h = 1; h <= 5; h++) x[i] += ((0.3 / h) * (1 + 0.05 * Math.sin(2 * Math.PI * 0.4 * t + h))) * Math.sin(2 * Math.PI * f * h * t);
  }
  const loop = findLoop(x, Math.round(0.7 * RATE), RATE, Math.round(1.4 * RATE), Math.round((2 * RATE) / f));
  assert.ok(loop.err < 0.02, `mismatch ${loop.err}`);
  const y = crossfadeLoop(x, loop.start, loop.end, Math.round(0.12 * RATE), 100);
  // play the seam: ... y[end-2], y[end-1], then y[start], y[start+1] ...
  const steps = (a: number[]) => a.slice(1).map((v, i) => Math.abs(v - a[i]));
  const seam = steps([y[loop.end - 2], y[loop.end - 1], y[loop.start], y[loop.start + 1]]);
  let typical = 0;
  for (let i = loop.start; i < loop.start + 2000; i++) typical = Math.max(typical, Math.abs(y[i + 1] - y[i]));
  assert.ok(Math.max(...seam) <= typical * 1.05, `seam ${seam} vs ${typical}`);
  assert.equal(y.length, loop.end + 100);
  assert.deepEqual([...y.subarray(loop.end, loop.end + 100)], [...x.subarray(loop.start, loop.start + 100)]);
});

test("the nearest recording and the playback rate that tunes it", () => {
  const set = [{ midi: 60, cents: 10, file: "a" }, { midi: 62, cents: 0, file: "b" }];
  assert.equal(nearest(set, 62)!.rate, 1);
  const up = nearest(set, 61)!; // between both: the lower one is raised a semitone, minus its 10 cents too high
  assert.equal(up.rec.file, "a");
  assert.ok(Math.abs(cents(up.rate, 1) - 90) < 1e-9);
  assert.equal(nearest(set, 66), null);
  assert.equal(nearest([], 60), null);
});

test("the recordings listed in lib/samples.json are there, loop inside the file and cover every note played", { skip: SAMPLES.piano.length === 0 && "no recordings built yet" }, () => {
  for (const r of [...SAMPLES.piano, ...SAMPLES.organ]) {
    const path = `public/sounds/${r.file}`;
    assert.ok(existsSync(path), path);
    assert.ok(statSync(path).size < 200_000, `${path} is small`);
    assert.ok(Math.abs(r.cents) < 60);
  }
  for (const r of SAMPLES.organ) {
    const b = readFileSync(`public/sounds/${r.file}`);
    assert.equal(b.toString("ascii", 0, 4), "RIFF");
    const seconds = b.readUInt32LE(40) / 2 / b.readUInt32LE(24);
    assert.ok(r.loopStart > 0.2 && r.loopEnd - r.loopStart > 0.5 && r.loopEnd < seconds, `${r.file}: loop ${r.loopStart}–${r.loopEnd} of ${seconds} s`);
  }
  for (const s of allSnippets()) for (const e of schedule(s)) for (const m of e.midis) assert.ok(nearest(SAMPLES.piano, m, 1), `${s.id}: note ${m}`);
  for (const m of fig.pitches) assert.ok(nearest(SAMPLES.organ, m, 1), `barrel organ: note ${m}`);
});
