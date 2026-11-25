// Listening cards ("Hörproben"): a short theme is played before a music question. The notes come from
// content/listen.json (built from Wikipedia's scores by scripts/content/listen.ts). The sound: recorded notes of a
// grand piano (lib/samples.ts, fetched from our own server when the card is tapped) in a small room; without them
// (offline) the piano built from arithmetic in lib/synth.ts plays instead.
import listenJson from "@/content/listen.json";
import type { Note } from "./lilypond";
import { SAMPLES, loadAll, nearest, onset } from "./samples";
import { createRoom, noise, renderPiano } from "./synth";

export type Snippet = { id: string; title: string; composer: string; url: string; revid: number; bpm: number; notes: Note[] };

const SNIPPETS = new Map((listenJson as Snippet[]).map((s) => [s.id, s]));

/** The theme that belongs to a question, if it has one. */
export const listenFor = (questionId: string): Snippet | undefined => SNIPPETS.get(questionId);
export const allSnippets = (): Snippet[] => [...SNIPPETS.values()];

/** Length in seconds. */
export const duration = (s: Pick<Snippet, "bpm" | "notes">) => (s.notes.reduce((a, n) => a + n.beats, 0) * 60) / s.bpm;

export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export type Sounding = { at: number; len: number; midis: number[]; freqs: number[]; vel: number };

/** Start times and lengths (seconds) of each sounding note – what the player schedules. */
export function schedule(s: Pick<Snippet, "bpm" | "notes">): Sounding[] {
  const beat = 60 / s.bpm;
  const out: Sounding[] = [];
  let t = 0;
  let vel = 0.7;
  for (const n of s.notes) {
    if (n.vel !== undefined) vel = n.vel;
    if (n.midi.length) out.push({ at: t, len: n.beats * beat, midis: n.midi, freqs: n.midi.map(frequency), vel });
    t += n.beats * beat;
  }
  return out;
}

type Ctx = AudioContext;
const makeContext = (): Ctx | null => {
  const C = typeof window === "undefined" ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return C ? new C() : null;
};

/** Notes are scheduled this far ahead (seconds); the rest follows while the theme plays. */
const AHEAD = 1.5;

/** Starts one piano note: it sounds from `start` and is damped at `end` (context time); `level` shares the loudness of a chord. */
type Voice = (midi: number, vel: number, start: number, end: number, level: number, out: AudioNode) => void;

/** The recorded piano: one loudness was recorded, so a softer touch is made quieter and a little darker. */
function recordedVoice(ctx: Ctx, bufs: Map<string, AudioBuffer>): Voice {
  return (midi, vel, start, end, level, out) => {
    const pick = nearest(SAMPLES.piano, midi)!;
    const buf = bufs.get(pick.rec.file)!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = pick.rate;
    let node: AudioNode = src;
    if (vel < 0.68) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = Math.min(18000, 20000 * (vel / 0.7) ** 3);
      lp.Q.value = -3;
      node = node.connect(lp);
    }
    const damper = damp(ctx, midi, level * Math.min(1.5, (vel / 0.7) ** 1.3), end);
    connectPanned(ctx, node.connect(damper), midi, out);
    const from = onset(buf);
    src.start(start, from);
    src.stop(Math.min(start + (buf.duration - from) / pick.rate, end + 0.6));
  };
}

/** The piano built from arithmetic (lib/synth.ts) – used when the recordings cannot be loaded. */
function synthVoice(ctx: Ctx): Voice {
  const rate = Math.min(ctx.sampleRate, 48000);
  const bufs = new Map<string, AudioBuffer>(); // each note is computed once per pitch, loudness and length, then reused
  return (midi, vel, start, end, level, out) => {
    const v = Math.round(vel * 20) / 20, l = Math.ceil((end - start + 0.6) * 4) / 4;
    const key = `${midi}:${v}:${l}`;
    let buf = bufs.get(key);
    if (!buf) {
      const data = renderPiano(midi, v, l, rate);
      buf = ctx.createBuffer(1, data.length, rate);
      buf.getChannelData(0).set(data);
      bufs.set(key, buf);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    connectPanned(ctx, src.connect(damp(ctx, midi, level, end)), midi, out);
    src.start(start);
    src.stop(Math.min(start + buf.duration, end + 0.6));
  };
}

/** The damper falls back onto the string when the key is let go (the top strings have none). */
function damp(ctx: Ctx, midi: number, level: number, end: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = level;
  g.gain.setValueAtTime(level, end);
  g.gain.setTargetAtTime(0, end, midi >= 89 ? 0.8 : 0.07);
  return g;
}

/** Low notes a little left, high notes right – as heard from the keyboard. */
function connectPanned(ctx: Ctx, node: AudioNode, midi: number, out: AudioNode) {
  if (typeof ctx.createStereoPanner === "function") {
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-0.45, Math.min(0.45, (midi - 66) / 36));
    node = node.connect(pan);
  }
  node.connect(out);
}

export type Player = { stop: () => void; seconds: number };

/**
 * Plays a snippet. Must be started from a tap (browsers only allow sound after a user gesture). The recordings are
 * loaded first, so the sound begins a moment later: `onStart` says when, `onEnd` when it is over (or stopped).
 * Returns null when the browser has no Web Audio.
 */
export function play(s: Pick<Snippet, "bpm" | "notes">, on: { onStart?: () => void; onEnd?: () => void } = {}): Player | null {
  const ctx = makeContext();
  if (!ctx) return null;
  if (typeof ctx.resume === "function") ctx.resume().catch(() => {});
  const master = ctx.createGain();
  master.gain.value = 0.75;
  master.connect(createRoom(ctx, 1.6, 0.32));
  const events = schedule(s);
  const seconds = duration(s);
  // the recordings this theme needs – every note lies within a semitone of one
  const picks = [...new Set(events.flatMap((e) => e.midis))].map((m) => nearest(SAMPLES.piano, m));
  const recorded = picks.length > 0 && picks.every(Boolean);
  let done = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pump: ReturnType<typeof setTimeout> | undefined;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    clearTimeout(pump);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    setTimeout(() => ctx.close().catch(() => {}), 300);
    on.onEnd?.();
  };
  const begin = (bufs: Map<string, AudioBuffer> | null) => {
    if (done) return;
    const voice = bufs ? recordedVoice(ctx, bufs) : synthVoice(ctx);
    const human = noise(events.length * 31 + 5); // a pianist is never metronome-exact
    const t0 = ctx.currentTime + 0.08;
    let i = 0;
    const feed = () => {
      for (const until = ctx.currentTime + AHEAD; i < events.length && t0 + events[i].at < until; i++) {
        const n = events[i];
        const start = t0 + n.at + human() * 0.004;
        const vel = n.vel * (1 + human() * 0.05);
        for (const m of n.midis) voice(m, vel, start, start + n.len, 1 / Math.sqrt(n.midis.length), master);
      }
      if (i < events.length) pump = setTimeout(feed, 250);
    };
    feed();
    timer = setTimeout(finish, (seconds + 0.9) * 1000);
    on.onStart?.();
  };
  (recorded ? loadAll(ctx, [...new Set(picks.map((p) => p!.rec.file))]) : Promise.resolve(null)).then(begin, () => begin(null));
  return { stop: finish, seconds };
}
