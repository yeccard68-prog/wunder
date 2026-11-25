// Signal helpers for preparing recorded notes (scripts/sounds/build-samples.mjs): where a note starts, which pitch
// it has, and a seamless loop for notes that have to sound for as long as a key is held. Pure functions on
// Float32Arrays, so they can be tested without recordings (tests/samples.test.ts).

/** Index where the note begins: the first sample louder than `rel` × the loudest one, moved back by `pre` samples. */
export function onsetIndex(x, rel = 0.02, pre = 0) {
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  let i = 0;
  while (i < x.length && Math.abs(x[i]) < peak * rel) i++;
  return Math.max(0, i - pre);
}

/**
 * Fundamental frequency (Hz) of x[from, from + size), searched between `lo` and `hi` Hz (the YIN method: the
 * shortest lag at which the wave repeats). `clarity` near 1 means a clearly pitched sound.
 */
export function pitch(x, rate, from, size, lo, hi) {
  const maxLag = Math.ceil(rate / lo), minLag = Math.max(2, Math.floor(rate / hi));
  if (from + size + maxLag + 2 > x.length) throw new Error("window too close to the end");
  const cm = new Float64Array(maxLag + 2); // cumulative mean normalised difference
  let run = 0;
  cm[0] = 1;
  for (let tau = 1; tau <= maxLag + 1; tau++) {
    let d = 0;
    for (let j = 0; j < size; j++) {
      const v = x[from + j] - x[from + j + tau];
      d += v * v;
    }
    run += d;
    cm[tau] = run > 0 ? (d * tau) / run : 1;
  }
  let tau = -1;
  for (let t = minLag; t <= maxLag; t++) {
    if (cm[t] < 0.15) {
      while (t + 1 <= maxLag && cm[t + 1] < cm[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) {
    tau = minLag;
    for (let t = minLag; t <= maxLag; t++) if (cm[t] < cm[tau]) tau = t;
  }
  const a = cm[tau - 1], b = cm[tau], c = cm[tau + 1], den = a - 2 * b + c;
  const shift = den > 0 ? Math.max(-0.5, Math.min(0.5, (a - c) / (2 * den))) : 0;
  return { hz: rate / (tau + shift), clarity: 1 - b };
}

/**
 * Frequency (Hz) of the strongest partial within ±`span` cents of `f` in x[from, from + size) – for a piano note
 * the fundamental itself. (A piano's overtones are slightly sharp, which pulls the repetition-based measure above
 * upwards; the fundamental is what has to be in tune.)
 */
export function partial(x, rate, from, size, f, span = 80) {
  if (from + size > x.length) throw new Error("window too close to the end");
  const mag = (fr) => {
    let re = 0, im = 0;
    const w = (2 * Math.PI * fr) / rate;
    for (let j = 0; j < size; j++) {
      const v = x[from + j] * (0.5 - 0.5 * Math.cos((2 * Math.PI * j) / (size - 1))); // Hann window
      re += v * Math.cos(w * j);
      im -= v * Math.sin(w * j);
    }
    return Math.hypot(re, im);
  };
  const m = [];
  for (let c = -span; c <= span; c++) m.push(mag(f * 2 ** (c / 1200)));
  let i = 1;
  for (let k = 1; k < m.length - 1; k++) if (m[k] > m[i]) i = k;
  const den = m[i - 1] - 2 * m[i] + m[i + 1];
  const shift = den < 0 ? Math.max(-0.5, Math.min(0.5, (m[i - 1] - m[i + 1]) / (2 * den))) : 0;
  return f * 2 ** ((i - span + shift) / 1200);
}

/**
 * A loop for a sustained note, starting at `start`: the end (between minLen and maxLen samples later) is chosen where
 * the wave around it matches the wave around the start best. `err` is the remaining mismatch (0 = identical).
 */
export function findLoop(x, start, minLen, maxLen, win) {
  let best = { start, end: start + minLen, err: Infinity };
  for (let end = start + minLen; end <= start + maxLen; end++) {
    let e = 0, n = 0;
    for (let k = -win; k < win; k++) {
      const a = x[start + k], b = x[end + k];
      e += (a - b) ** 2;
      n += a * a + b * b;
    }
    const err = n > 0 ? e / n : 1;
    if (err < best.err) best = { start, end, err };
  }
  return best;
}

/**
 * Makes the loop [start, end) seamless: the last `fade` samples before `end` blend into the samples just before
 * `start`, so the wave runs on smoothly when playback jumps back; the `tail` samples after `end` repeat those after
 * `start` (resampling filters look a little ahead). Returns a new array that ends after the tail.
 */
export function crossfadeLoop(x, start, end, fade, tail) {
  if (start < fade) throw new Error("the loop starts too early for the crossfade");
  const out = Float32Array.from(x.subarray(0, end + tail));
  for (let k = 0; k < fade; k++) {
    const a = 0.5 - 0.5 * Math.cos((Math.PI * (k + 1)) / fade); // 0 → 1
    out[end - fade + k] = (1 - a) * x[end - fade + k] + a * x[start - fade + k];
  }
  for (let k = 0; k < tail; k++) out[end + k] = x[start + k];
  return out;
}

/** Root mean square of x[from, to). */
export function rms(x, from, to) {
  let e = 0;
  for (let i = from; i < to; i++) e += x[i] * x[i];
  return Math.sqrt(e / Math.max(1, to - from));
}

/** Fades the first `fin` samples in and the last `fout` samples out (raised cosine), in place. */
export function fade(x, fin, fout) {
  for (let k = 0; k < fin; k++) x[k] *= 0.5 - 0.5 * Math.cos((Math.PI * k) / fin);
  for (let k = 0; k < fout; k++) x[x.length - 1 - k] *= 0.5 - 0.5 * Math.cos((Math.PI * k) / fout);
  return x;
}

/** A mono 16-bit WAV file. */
export function wav16(x, rate) {
  const n = x.length, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  return buf;
}

const STEPS = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };

/** MIDI number of a note name such as "F#3"; `c4` is the octave number the maker gives middle C (4, or 3 at Yamaha). */
export function midiOf(name, c4 = 4) {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`not a note name: ${name}`);
  return 60 + 12 * (Number(m[2]) - c4) + STEPS[m[1]];
}
