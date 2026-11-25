// The barrel organ's pipes: recorded organ notes (lib/samples.ts) that keep sounding for as long as a valve is open.
// The recordings are fetched when the sound is switched on; if they cannot be loaded, the pipes synthesised in
// lib/synth.ts play instead.
import { SAMPLES, loadAll, nearest, type LoopedRecording } from "./samples";
import { createPipeOrgan, createRoom, type Organ } from "./synth";

export type LoadingOrgan = Organ & { ready: Promise<"recorded" | "synthesised" | "closed"> };

/** One pipe per pitch in `midis`; `set(i, on)` opens or closes the valve of pipe i. Must be created after a tap. */
export function createOrgan(ctx: AudioContext, midis: number[]): LoadingOrgan {
  const want = midis.map(() => false); // valves opened before the recordings arrived sound as soon as they are there
  let impl: Organ | null = null;
  let closed = false;
  const picks = midis.map((m) => nearest(SAMPLES.organ, m));
  const files = [...new Set(picks.flatMap((p) => (p ? [p.rec.file] : [])))];
  const recordings = picks.length > 0 && picks.every(Boolean) ? loadAll(ctx, files) : Promise.resolve(null);
  const ready = recordings.then((bufs) => {
    if (closed) return "closed" as const;
    impl = bufs ? recordedOrgan(ctx, picks as { rec: LoopedRecording; rate: number }[], bufs) : createPipeOrgan(ctx, midis);
    want.forEach((on, i) => on && impl!.set(i, true));
    return bufs ? ("recorded" as const) : ("synthesised" as const);
  });
  return {
    set: (i, on) => {
      want[i] = on;
      impl?.set(i, on);
    },
    silence: () => {
      want.fill(false);
      impl?.silence();
    },
    close: () => {
      closed = true;
      impl?.close();
    },
    ready,
  };
}

function recordedOrgan(ctx: AudioContext, picks: { rec: LoopedRecording; rate: number }[], bufs: Map<string, AudioBuffer>): Organ {
  const out = ctx.createGain();
  out.gain.value = 0.85;
  out.connect(createRoom(ctx, 1.1, 0.24));
  // the wind from the feeder bellows is never quite steady: a gentle wobble in loudness
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.2;
  const am = ctx.createGain();
  am.gain.value = 0.02;
  lfo.connect(am).connect(out.gain);
  lfo.start();
  const voices: ({ g: GainNode; src: AudioBufferSourceNode } | null)[] = picks.map(() => null);
  const set = (i: number, on: boolean) => {
    const v = voices[i], t = ctx.currentTime;
    if (on && !v) {
      const { rec, rate } = picks[i];
      const src = ctx.createBufferSource();
      src.buffer = bufs.get(rec.file)!;
      src.loop = true; // the steady part of the note repeats while the valve stays open
      src.loopStart = rec.loopStart;
      src.loopEnd = rec.loopEnd;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = 0.35;
      src.connect(g).connect(out);
      src.start(t);
      voices[i] = { g, src };
    } else if (!on && v) {
      voices[i] = null; // the valve closes: the pipe falls silent within a few hundredths of a second
      v.g.gain.setValueAtTime(0.35, t);
      v.g.gain.setTargetAtTime(0, t, 0.025);
      v.src.stop(t + 0.25);
    }
  };
  const silence = () => voices.forEach((_, i) => set(i, false));
  const close = () => {
    silence();
    lfo.stop(ctx.currentTime + 0.25);
  };
  return { set, silence, close };
}
