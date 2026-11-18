// Listening cards ("Hörproben"): a short theme is played before a music question. The notes come from
// content/listen.json (built from Wikipedia's scores by scripts/content/listen.ts); the sound is made right here
// with the Web Audio API – a soft, piano-like tone – so no recordings, files or downloads are involved.
import listenJson from "@/content/listen.json";
import type { Note } from "./lilypond";

export type Snippet = { id: string; title: string; composer: string; url: string; revid: number; bpm: number; notes: Note[] };

const SNIPPETS = new Map((listenJson as Snippet[]).map((s) => [s.id, s]));

/** The theme that belongs to a question, if it has one. */
export const listenFor = (questionId: string): Snippet | undefined => SNIPPETS.get(questionId);
export const allSnippets = (): Snippet[] => [...SNIPPETS.values()];

/** Length in seconds. */
export const duration = (s: Pick<Snippet, "bpm" | "notes">) => (s.notes.reduce((a, n) => a + n.beats, 0) * 60) / s.bpm;

export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Start times and lengths (seconds) of each sounding note – what the player schedules. */
export function schedule(s: Pick<Snippet, "bpm" | "notes">): { at: number; len: number; freqs: number[]; vel: number }[] {
  const beat = 60 / s.bpm;
  const out: { at: number; len: number; freqs: number[]; vel: number }[] = [];
  let t = 0;
  let vel = 0.7;
  for (const n of s.notes) {
    if (n.vel !== undefined) vel = n.vel;
    if (n.midi.length) out.push({ at: t, len: n.beats * beat, freqs: n.midi.map(frequency), vel });
    t += n.beats * beat;
  }
  return out;
}

type Ctx = AudioContext;
const makeContext = (): Ctx | null => {
  const C = typeof window === "undefined" ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return C ? new C() : null;
};

/**
 * Plays a snippet; resolves the returned stop() early if called. Must be started from a tap (browsers only allow
 * sound after a user gesture). Returns null when the browser has no Web Audio.
 */
export function play(s: Pick<Snippet, "bpm" | "notes">, onEnd?: () => void): { stop: () => void; seconds: number } | null {
  const ctx = makeContext();
  if (!ctx) return null;
  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  const t0 = ctx.currentTime + 0.05;
  for (const n of schedule(s)) {
    const start = t0 + n.at;
    const ring = Math.min(Math.max(n.len * 1.15, 0.25), 2.5); // a struck string fades out on its own
    for (const f of n.freqs) {
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, start);
      env.gain.linearRampToValueAtTime(n.vel / n.freqs.length ** 0.5, start + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, start + ring);
      env.connect(master);
      const partials: [OscillatorType, number, number][] = [["triangle", 1, 1], ["sine", 2, 0.25], ["sine", 3, 0.08]];
      for (const [type, mult, amp] of partials) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = f * mult;
        g.gain.value = amp;
        o.connect(g).connect(env);
        o.start(start);
        o.stop(start + ring + 0.05);
      }
    }
  }
  const seconds = duration(s);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    setTimeout(() => ctx.close().catch(() => {}), 200);
    onEnd?.();
  };
  const timer = setTimeout(finish, (seconds + 0.6) * 1000);
  return { stop: finish, seconds };
}
