import { test } from "node:test";
import assert from "node:assert/strict";
import { hz, renderPiano, roomImpulse } from "../lib/synth";

// The instrument voices are pure arithmetic, so their sound can be checked without a speaker: level, fading,
// pitch, brightness and that nothing clicks.
const RATE = 32000;
const rms = (a: Float32Array, from: number, to: number) => {
  let e = 0;
  const i0 = Math.round(from * RATE), i1 = Math.min(a.length, Math.round(to * RATE));
  for (let k = i0; k < i1; k++) e += a[k] * a[k];
  return Math.sqrt(e / Math.max(1, i1 - i0));
};
/** Rough brightness: how fast the wave changes compared with how big it is (in Hz). */
const brightness = (a: Float32Array) => {
  let d = 0, e = 0;
  for (let k = 1; k < a.length; k++) { d += (a[k] - a[k - 1]) ** 2; e += a[k] * a[k]; }
  return (Math.sqrt(d / e) * RATE) / (2 * Math.PI);
};
const magnitudeAt = (a: Float32Array, f: number) => {
  let re = 0, im = 0;
  for (let k = 0; k < a.length; k++) { const p = (2 * Math.PI * f * k) / RATE; re += a[k] * Math.cos(p); im += a[k] * Math.sin(p); }
  return Math.hypot(re, im);
};

test("a piano note stays below full scale, fades like a struck string and does not click", () => {
  for (const midi of [48, 60, 72, 86]) for (const vel of [0.35, 0.7, 1]) {
    const a = renderPiano(midi, vel, 2, RATE);
    assert.equal(a.length, 2 * RATE);
    let peak = 0;
    for (const x of a) { assert.ok(Number.isFinite(x)); peak = Math.max(peak, Math.abs(x)); }
    assert.ok(peak > 0.02 && peak < 1, `${midi}/${vel}: peak ${peak}`);
    assert.ok(rms(a, 0, 0.2) > 4 * rms(a, 1.7, 1.95), `${midi}/${vel}: fades`);
    assert.ok(Math.abs(a[0]) < 1e-3 && Math.abs(a[a.length - 1]) < 1e-3, `${midi}/${vel}: starts and ends at zero`);
  }
});

test("a piano note sounds at its pitch", () => {
  for (const midi of [57, 69, 81]) {
    const a = renderPiano(midi, 0.7, 0.5, RATE), f = hz(midi);
    const own = magnitudeAt(a, f);
    assert.ok(own > 3 * magnitudeAt(a, f * 2 ** (1 / 12)) && own > 3 * magnitudeAt(a, f / 2 ** (1 / 12)), `${midi}`);
  }
});

test("struck harder, a note is louder and brighter; the same note always sounds the same", () => {
  const soft = renderPiano(64, 0.35, 1, RATE), loud = renderPiano(64, 1, 1, RATE);
  assert.ok(rms(loud, 0, 0.5) > 1.8 * rms(soft, 0, 0.5));
  assert.ok(brightness(loud) > 1.1 * brightness(soft));
  assert.deepEqual(renderPiano(64, 0.7, 0.4, RATE), renderPiano(64, 0.7, 0.4, RATE));
});

test("the room's echo has unit energy, differs left and right, and dies away", () => {
  const [l, r] = roomImpulse(48000, 1.6);
  for (const ch of [l, r]) {
    let e = 0, early = 0, late = 0;
    ch.forEach((x, k) => { e += x * x; if (k < 0.3 * 48000) early += x * x; if (k > ch.length - 0.3 * 48000) late += x * x; });
    assert.ok(Math.abs(e - 1) < 0.02, `energy ${e}`);
    assert.ok(early > 100 * late);
  }
  assert.notDeepEqual(l, r);
});
