// What the feed learns from how someone uses it – kept on the device only, never sent to the server.
// Signals per topic and per format: how often something was on screen, for how long, and how often it was
// swiped away within a moment. Older signals fade, so the feed follows changing interests.
import type { UserState } from "./types";

export type EntryKind = "item" | "clip" | "animation" | "insight" | "visual" | "fact" | "series" | "day" | "study" | "puzzle";
export interface Signal { views: number; dwell: number; skips: number } // dwell in seconds
export interface Signals { cat: Record<string, Signal>; kind: Partial<Record<EntryKind, Signal>> }

export const SKIP_SECONDS = 1.5; // gone again within this time: not interested
const DECAY = 0.985; // every new view lets the older ones count a little less
const MAX_DWELL = 60; // a card left open while doing something else must not count as huge interest

const empty = (): Signal => ({ views: 0, dwell: 0, skips: 0 });
const fade = (s: Signal): Signal => ({ views: s.views * DECAY, dwell: s.dwell * DECAY, skips: s.skips * DECAY });

/** Adds one view of an entry (topic and format) that stayed on screen for `seconds`. */
export function recordView(signals: Signals | undefined, categoryId: string, kind: EntryKind, seconds: number): Signals {
  const base: Signals = signals ?? { cat: {}, kind: {} };
  const add = (s: Signal | undefined): Signal => {
    const f = fade(s ?? empty());
    return { views: f.views + 1, dwell: f.dwell + Math.min(MAX_DWELL, seconds), skips: f.skips + (seconds < SKIP_SECONDS ? 1 : 0) };
  };
  const cat: Record<string, Signal> = {};
  for (const [k, v] of Object.entries(base.cat)) cat[k] = k === categoryId ? v : fade(v);
  cat[categoryId] = add(base.cat[categoryId]);
  return { cat, kind: { ...base.kind, [kind]: add(base.kind[kind]) } };
}

/**
 * How much someone engages with a topic or format, from −1 (keeps skipping) to +1 (stays long).
 * Compared with their own average, so slow and fast readers are treated alike. Few views → near 0.
 */
export function engagement(signal: Signal | undefined, all: Signal[]): number {
  if (!signal || signal.views < 1) return 0;
  const total = all.reduce((a, s) => ({ views: a.views + s.views, dwell: a.dwell + s.dwell }), { views: 0, dwell: 0 });
  const mean = total.views ? total.dwell / total.views : 0;
  const own = signal.dwell / signal.views;
  const stay = mean > 0 ? Math.tanh((own - mean) / mean) : 0;
  const skipRate = signal.skips / signal.views;
  const confidence = Math.min(1, signal.views / 6);
  return Math.max(-1, Math.min(1, (0.7 * stay - 0.9 * (skipRate - 0.2)) * confidence));
}

export const topicEngagement = (state: UserState, categoryId: string) => engagement(state.signals?.cat[categoryId], Object.values(state.signals?.cat ?? {}));
export const formatEngagement = (state: UserState, kind: EntryKind) => engagement(state.signals?.kind[kind], Object.values(state.signals?.kind ?? {}) as Signal[]);

/** Topics hardly seen yet – candidates for discovering something new. */
export const unexplored = (state: UserState, categoryId: string) => (state.signals?.cat[categoryId]?.views ?? 0) < 3;

/** Share of correct answers among the last few – keeps the difficulty in the zone where learning feels good. */
export function recentAccuracy(state: UserState, last = 8): number | null {
  const recent = Object.values(state.answers).sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, last);
  if (recent.length < 4) return null;
  return recent.filter((a) => a.correct).length / recent.length;
}

export const PAUSE_AFTER = 40;
