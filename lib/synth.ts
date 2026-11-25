// Instrument voices built from arithmetic ("modal synthesis") – no recordings, no audio files, no downloads.
//
// A struck string rings in many partials at once. What makes the result sound like a piano rather than a beep:
// – piano strings are slightly stiff, so their partials sit a little above the whole-number multiples, more so up high;
// – the felt hammer is soft for quiet notes and hard for loud ones, so loud notes are brighter;
// – the hammer strikes about 1/8 along the string, which weakens the partials that have a node there;
// – high partials die away much faster than low ones;
// – each note has two strings tuned a hair apart: they beat slowly, one fades quickly (the "prompt sound"),
//   the other lingers (the "aftersound");
// – the hammer's knock starts the note, and a small room adds its echo (roomImpulse + ConvolverNode).
// Organ pipes are different: they sound as long as wind flows, with a breathy "chiff" when they start to speak.
// The pure functions run in the browser (lib/listen.ts, the animations) and in the tests (tests/synth.test.ts).

const LN1000 = Math.log(1000); // amplitude down by 60 dB
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Deterministic noise in [−1, 1): a note sounds the same every time (and in the tests). */
export function noise(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

/** Adds amp·r^k·sin(ωk + phase) to out – a partial that falls by 60 dB in t60 seconds (two-term recursion). */
function addMode(out: Float32Array, rate: number, f: number, amp: number, t60: number, phase: number) {
  const w = (2 * Math.PI * f) / rate;
  const r = Math.exp(-LN1000 / (t60 * rate));
  const c = 2 * r * Math.cos(w), r2 = r * r;
  const n = Math.min(out.length, Math.ceil(Math.log(1e-6 / Math.abs(amp || 1e-9)) / Math.log(r)));
  if (n < 2) return;
  let y0 = amp * Math.sin(phase), y1 = amp * r * Math.sin(w + phase);
  out[0] += y0;
  out[1] += y1;
  for (let k = 2; k < n; k++) {
    const y = c * y1 - r2 * y0;
    out[k] += y;
    y0 = y1;
    y1 = y;
  }
}

/** Smooth start (a few ms) and a short fade at the very end, so nothing clicks. */
function shape(out: Float32Array, rate: number, attack: number, tail = 0.03) {
  const a = Math.max(1, Math.round(attack * rate)), z = Math.min(out.length, Math.round(tail * rate));
  for (let k = 0; k < a && k < out.length; k++) out[k] *= 0.5 - 0.5 * Math.cos((Math.PI * k) / a);
  for (let k = 0; k < z; k++) out[out.length - 1 - k] *= 0.5 - 0.5 * Math.cos((Math.PI * k) / z);
}

/** One struck piano note as mono samples. vel 0..1 (pp ≈ 0.35, ff = 1). Peak stays below 1. */
export function renderPiano(midi: number, vel: number, seconds: number, rate = 32000): Float32Array {
  const out = new Float32Array(Math.max(64, Math.round(seconds * rate)));
  const v = clamp(vel, 0.05, 1);
  const f0 = hz(midi);
  const B = 10 ** (-3.55 + 0.0375 * (Math.max(midi, 48) - 60)); // string stiffness: partials run sharp
  const fc = Math.max(2.5 * f0, 650 + 4300 * v ** 1.6); // the felt hammer: struck harder, it gets brighter
  const beta = 1 / 7.7; // where the hammer meets the string
  const fmax = Math.min(0.45 * rate, 10000);
  const rnd = noise(midi * 131 + 7);
  const spread = 2 ** ((0.6 + 0.8 * Math.abs(rnd())) / 2400); // the two strings: 0.6–1.4 cent apart
  const modes: [number, number, number][] = [];
  let sum = 0;
  for (let k = 1; k <= 60; k++) {
    const f = k * f0 * Math.sqrt(1 + B * k * k);
    if (f > fmax) break;
    const a = (Math.abs(Math.sin(Math.PI * k * beta)) ** 0.5 * k ** -0.9 * (f / Math.hypot(f, 90))) / Math.sqrt(1 + (f / fc) ** 4);
    modes.push([f, a, rnd() * Math.PI]);
    sum += a;
  }
  const g = (0.8 / sum) * v ** 1.1;
  for (const [f, a, ph] of modes) {
    const t60 = clamp(11 * (f / 100) ** -0.8, 0.18, 16);
    addMode(out, rate, f / spread, a * g * 0.72, t60, ph); // string 1: the quick first decay
    addMode(out, rate, f * spread, a * g * 0.28, t60 * 3.2, ph + 1.3); // string 2: the long aftersound
  }
  // the hammer's knock: a few milliseconds of soft noise and a dull thump from the soundboard
  const knock = noise(midi * 977 + 3), lpA = 1 - Math.exp((-2 * Math.PI * (1100 + 2600 * v)) / rate), hpA = 1 - Math.exp((-2 * Math.PI * 140) / rate);
  const tau = (0.0028 + 0.002 * (1 - v)) * rate, kn = 0.55 * g * v ** 0.5;
  let l1 = 0, l2 = 0, hp = 0;
  for (let k = 0, n = Math.min(out.length, Math.round(0.05 * rate)); k < n; k++) {
    l1 += lpA * (knock() - l1);
    l2 += lpA * (l1 - l2);
    hp += hpA * (l2 - hp);
    const t = k / rate;
    out[k] += kn * ((l2 - hp) * Math.exp(-k / tau) + 0.25 * Math.sin(2 * Math.PI * 95 * t) * Math.exp(-t / 0.012));
  }
  shape(out, rate, 0.0035 - 0.002 * v);
  return out;
}

/** Vibration modes of a bar clamped at one end (a music box tine): frequency ratios to its note. */
export const TINE_MODES = [1, 6.267, 17.547];

/**
 * One plucked steel tine of a music box comb as mono samples. Besides its note the tine rings in the much higher
 * modes of a bar clamped at one end, which die away within a few tenths of a second; the comb's base adds a little of
 * the octave. The pin letting go of the tine gives a short, bright click. Peak stays below 1.
 */
export function renderTine(midi: number, seconds: number, rate = 32000): Float32Array {
  const out = new Float32Array(Math.max(64, Math.round(seconds * rate)));
  const f0 = hz(midi), fmax = 0.45 * rate;
  const rnd = noise(midi * 313 + 5);
  const t60 = clamp(3.2 * (f0 / 700) ** -0.8, 0.8, 5); // lower tines ring longer
  const parts: [number, number, number][] = [
    [f0, 0.62, t60],
    [f0 * 2, 0.05, t60 * 0.35], // the base answers the octave a little
    [f0 * TINE_MODES[1], 0.16, 0.32],
    [f0 * TINE_MODES[2], 0.05, 0.09],
  ];
  for (const [f, a, t] of parts) if (f < fmax) addMode(out, rate, f, a, t, rnd() * 0.3);
  // the click of the pin letting go: two milliseconds of bright noise
  const click = noise(midi * 71 + 1), hpA = 1 - Math.exp((-2 * Math.PI * 2500) / rate);
  let lp = 0;
  for (let k = 0, n = Math.min(out.length, Math.round(0.006 * rate)); k < n; k++) {
    const x = click();
    lp += hpA * (x - lp);
    out[k] += 0.12 * (x - lp) * Math.exp(-k / (0.0015 * rate));
  }
  shape(out, rate, 0.0008);
  return out;
}

/**
 * The echo of a small room as a stereo impulse response for a ConvolverNode: a few early reflections and a soft
 * tail that gets darker as it fades. Normalised to unit energy per channel, so the "wet" gain sets the level.
 */
export function roomImpulse(rate: number, t60 = 1.5, seconds = Math.min(2.4, t60 * 1.3), seed = 11): [Float32Array, Float32Array] {
  const n = Math.max(64, Math.round(seconds * rate)), pre = Math.round(0.011 * rate);
  const early = [[[0.013, 0.5], [0.021, -0.36], [0.034, 0.3], [0.049, -0.22], [0.067, 0.16]], [[0.016, -0.48], [0.026, 0.38], [0.039, -0.27], [0.055, 0.2], [0.073, -0.15]]];
  return [0, 1].map((ch) => {
    const out = new Float32Array(n), rnd = noise(seed + ch * 7919);
    let lp = 0;
    for (let k = pre; k < n; k++) {
      const t = (k - pre) / rate;
      lp += (0.07 + 0.6 * Math.exp(-t / 0.3)) * (rnd() - lp); // the tail loses its highs first
      out[k] = lp * Math.exp((-LN1000 * t) / t60) * Math.min(1, 0.15 + t / 0.03);
    }
    let e = 0;
    for (let k = 0; k < n; k++) e += out[k] * out[k];
    const tail = 0.55 / Math.sqrt(e || 1);
    for (let k = 0; k < n; k++) out[k] *= tail;
    for (const [at, g] of early[ch]) out[Math.round(at * rate)] += g * 0.45;
    e = 0;
    for (let k = 0; k < n; k++) e += out[k] * out[k];
    const norm = 1 / Math.sqrt(e || 1);
    for (let k = 0; k < n; k++) out[k] *= norm;
    shape(out, rate, 0, 0.05);
    return out;
  }) as [Float32Array, Float32Array];
}

/**
 * Output chain for a voice: dry signal plus the room's echo, then a gentle compressor so chords never clip.
 * Returns the node to connect the voices to.
 */
export function createRoom(ctx: BaseAudioContext, t60: number, wet: number): GainNode {
  const input = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 10;
  comp.ratio.value = 3;
  comp.attack.value = 0.004;
  comp.release.value = 0.25;
  const conv = ctx.createConvolver();
  conv.normalize = false;
  const [l, r] = roomImpulse(ctx.sampleRate, t60);
  const ir = ctx.createBuffer(2, l.length, ctx.sampleRate);
  ir.getChannelData(0).set(l);
  ir.getChannelData(1).set(r);
  conv.buffer = ir;
  const wetGain = ctx.createGain();
  wetGain.gain.value = wet;
  input.connect(comp);
  input.connect(conv).connect(wetGain).connect(comp);
  comp.connect(ctx.destination);
  return input;
}

// ---- organ pipes (barrel organ): harmonic spectra of two pipe types, sounding together like two registers
/** A wide, flute-like pipe: a strong fundamental, few overtones. */
export const FLUTE_PIPE = [1, 0.32, 0.2, 0.07, 0.05, 0.025, 0.015];
/** A narrow "violin" pipe: many overtones – the bright, singing part of a street organ's sound. */
export const STRING_PIPE = [1, 0.82, 0.68, 0.56, 0.46, 0.38, 0.31, 0.25, 0.2, 0.16, 0.12, 0.09, 0.07, 0.05];

export type Organ = { set: (i: number, on: boolean) => void; silence: () => void; close: () => void };

/**
 * A small pipe organ with one pipe per pitch in `midis`. Each pipe: a flute rank and a violin rank a few cents apart
 * (the slow shimmer of two registers), a breathy chiff when it starts to speak, a little wind noise, and the
 * wobble of the wind from the bellows (a gentle tremolo). Must be created after a tap.
 */
export function createPipeOrgan(ctx: AudioContext, midis: number[]): Organ {
  const out = ctx.createGain();
  out.gain.value = 0.5;
  out.connect(createRoom(ctx, 0.9, 0.22));
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.4;
  const am = ctx.createGain();
  am.gain.value = 0.025; // ±5 % loudness
  const fm = ctx.createGain();
  fm.gain.value = 4; // ±4 cents
  lfo.connect(am).connect(out.gain);
  lfo.connect(fm);
  lfo.start();
  const wave = (h: number[]) => ctx.createPeriodicWave(new Float32Array(h.length + 1), Float32Array.from([0, ...h]));
  const flute = wave(FLUTE_PIPE), violin = wave(STRING_PIPE);
  const rnd = noise(4242);
  const wind = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  wind.getChannelData(0).forEach((_, k, a) => (a[k] = rnd()));
  type Voice = { g: GainNode; src: AudioScheduledSourceNode[] };
  const voices: (Voice | null)[] = midis.map(() => null);
  const set = (i: number, on: boolean) => {
    const v = voices[i], t = ctx.currentTime;
    if (on && !v) {
      const f = hz(midis[i]);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.setTargetAtTime(0.22, t, 0.012);
      g.connect(out);
      const rank = (w: PeriodicWave, cents: number, level: number, speak: number) => {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.setPeriodicWave(w);
        o.frequency.value = f;
        o.detune.value = cents;
        fm.connect(o.detune);
        og.gain.setValueAtTime(0, t);
        og.gain.setTargetAtTime(level, t, speak); // narrow pipes speak a little later
        o.connect(og).connect(g);
        o.start(t);
        return o;
      };
      const a = rank(flute, -1.5, 0.75, 0.01), b = rank(violin, 3, 0.4, 0.03);
      // breath: noise through a band filter around the pipe's overtones – loud for a moment (chiff), then faint
      const n = ctx.createBufferSource();
      n.buffer = wind;
      n.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = Math.min(f * 2.8, 9000);
      bp.Q.value = 3;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0, t);
      ng.gain.linearRampToValueAtTime(0.5, t + 0.008);
      ng.gain.setTargetAtTime(0.05, t + 0.008, 0.03);
      n.connect(bp).connect(ng).connect(g);
      n.start(t, rnd() * 0.5 + 0.5);
      voices[i] = { g, src: [a, b, n] };
    } else if (!on && v) {
      voices[i] = null;
      v.g.gain.cancelScheduledValues(t);
      v.g.gain.setValueAtTime(v.g.gain.value, t);
      v.g.gain.setTargetAtTime(0, t, 0.025);
      v.src.forEach((s) => s.stop(t + 0.2));
    }
  };
  const silence = () => voices.forEach((_, i) => set(i, false));
  const close = () => {
    silence();
    lfo.stop(ctx.currentTime + 0.25);
  };
  return { set, silence, close };
}
