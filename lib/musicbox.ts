// The music box's comb: every pin that lets a tine go plays one note. The notes are worked out once per pitch
// (lib/synth.ts renderTine: the modes of a steel tine clamped at one end) and kept as short sound buffers, so a pluck
// costs no more than starting a buffer. Must be created after a tap (no audio before a user gesture).
import { createRoom, renderTine } from "./synth";

export type MusicBox = { pluck: (midi: number) => void; close: () => void };

const SECONDS = 3.5;

export function createMusicBox(ctx: AudioContext): MusicBox {
  const out = ctx.createGain();
  out.gain.value = 0.7;
  out.connect(createRoom(ctx, 1.4, 0.3)); // the box itself and the room ring along
  const notes = new Map<number, AudioBuffer>();
  const bufferOf = (midi: number) => {
    let b = notes.get(midi);
    if (!b) {
      const x = renderTine(midi, SECONDS, ctx.sampleRate);
      b = ctx.createBuffer(1, x.length, ctx.sampleRate);
      b.getChannelData(0).set(x);
      notes.set(midi, b);
    }
    return b;
  };
  let closed = false;
  return {
    pluck: (midi) => {
      if (closed) return;
      const src = ctx.createBufferSource();
      src.buffer = bufferOf(midi);
      src.connect(out);
      src.start();
    },
    close: () => {
      closed = true;
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    },
  };
}
