// Recorded instrument notes: a grand piano for the listening cards and a small pipe organ for the barrel organ.
// The recordings come from the Versilian Community Sample Library (VCSL, CC0 1.0, github.com/sgossner/VCSL) and
// were cut to size by scripts/sounds/build-samples.mjs, which also wrote the list lib/samples.json. The files live in
// public/sounds/ (same origin, no third party) and are fetched only when something is played; each is decoded once
// and kept for the rest of the visit. If a file cannot be loaded, the caller falls back to the voices in lib/synth.ts.
import list from "./samples.json";

/** One recorded note: its pitch (MIDI), how far the recording is off that pitch (cents, measured) and the file. */
export type Recording = { midi: number; cents: number; file: string };
/** A sustained note: it repeats the part between loopStart and loopEnd (seconds) for as long as it is held. */
export type LoopedRecording = Recording & { loopStart: number; loopEnd: number };

type List = { piano: Recording[]; organ: LoopedRecording[] };
export const SAMPLES = list as unknown as List;

/**
 * The recording closest to `midi` and the playback rate that brings it to the right pitch (recordings lie two
 * semitones apart, so a note is shifted by at most one; the measured tuning of the recording is corrected too).
 * null when no recording is within `reach` semitones.
 */
export function nearest<T extends Recording>(set: readonly T[], midi: number, reach = 2): { rec: T; rate: number } | null {
  let rec: T | undefined;
  for (const r of set) if (!rec || Math.abs(r.midi - midi) < Math.abs(rec.midi - midi)) rec = r;
  if (!rec || Math.abs(rec.midi - midi) > reach) return null;
  return { rec, rate: 2 ** ((midi - rec.midi - rec.cents / 100) / 12) };
}

// decoding happens in a context of its own, so it does not matter when the player that asked for it is closed
let decoder: BaseAudioContext | null = null;
const decoderFor = (rate: number, fallback: BaseAudioContext): BaseAudioContext => {
  if (decoder?.sampleRate === rate) return decoder;
  const O = typeof window === "undefined" ? undefined : window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  try {
    decoder = O ? new O(1, 1, rate) : fallback;
  } catch {
    decoder = fallback;
  }
  return decoder;
};

const decode = (ctx: BaseAudioContext, data: ArrayBuffer) =>
  new Promise<AudioBuffer>((resolve, reject) => {
    // the callback form works everywhere; newer browsers also return a promise, whose rejection is handled here
    const p = ctx.decodeAudioData(data, resolve, reject) as Promise<AudioBuffer> | undefined;
    p?.catch?.(() => {});
  });

const buffers = new Map<string, Promise<AudioBuffer | null>>();

/** A recording as audio, fetched and decoded once; null if it cannot be loaded (offline, old browser). */
export function load(ctx: BaseAudioContext, file: string): Promise<AudioBuffer | null> {
  let p = buffers.get(file);
  if (!p) {
    p = fetch(`/sounds/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) => decode(decoderFor(ctx.sampleRate, ctx), data))
      .catch(() => {
        buffers.delete(file); // try again next time
        return null;
      });
    buffers.set(file, p);
  }
  return p;
}

/** All of the recordings, or null if any one is missing – a theme is played either fully recorded or fully synthesised. */
export async function loadAll(ctx: BaseAudioContext, files: string[], ms = 8000): Promise<Map<string, AudioBuffer> | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>((resolve) => (timer = setTimeout(() => resolve(null), ms)));
  const all = Promise.all(files.map((f) => load(ctx, f))).then((bs) => (bs.every(Boolean) ? new Map(files.map((f, i) => [f, bs[i]!])) : null));
  const out = await Promise.race([all, late]);
  clearTimeout(timer);
  return out;
}

const onsets = new WeakMap<AudioBuffer, number>();

/**
 * Where the note starts in a buffer (seconds). Compressed files begin with a few milliseconds of padding that some
 * browsers keep; skipping it keeps the notes on the beat.
 */
export function onset(b: AudioBuffer): number {
  let o = onsets.get(b);
  if (o === undefined) {
    const d = b.getChannelData(0);
    let i = 0;
    while (i < d.length && Math.abs(d[i]) < 0.003) i++;
    o = i >= d.length ? 0 : Math.max(0, i / b.sampleRate - 0.002);
    onsets.set(b, o);
  }
  return o;
}
