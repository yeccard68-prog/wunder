// What was already on screen – so the feed shows the same thing again as late as possible. Kept on the device
// only (like the other feed signals), never sent to the server. One number per entry: when it was last seen.
//
// The order everywhere in the feed:
//   1. never seen (ranked as before) – plus questions answered wrongly once their repetition is due;
//   2. seen but not done (scrolled past, clip not finished, fact without a reaction) – seen longest ago first;
//   3. done (answered correctly, clip watched to the end, …) – done longest ago first.
// Wrong answers come back on purpose: after 10 minutes, then 1, 3, 7 and 21 days (spaced repetition,
// BOX_MS in gamification.ts) – until they are answered right often enough.
import type { AnswerRecord, UserState } from "./types";

export type Seen = Record<string, number>; // entry id → last seen (seconds since 1970)

/** On screen at least this long counts as seen (a quick fling past does not). */
export const SEEN_MIN_SECONDS = 0.7;
/** At most this many entries are remembered; the oldest are forgotten first. */
export const SEEN_MAX = 4000;

export function recordSeen(seen: Seen | undefined, id: string, now = Date.now()): Seen {
  const next: Seen = { ...(seen ?? {}), [id]: Math.round(now / 1000) };
  const ids = Object.keys(next);
  if (ids.length <= SEEN_MAX) return next;
  const keep = ids.sort((a, b) => next[b] - next[a]).slice(0, SEEN_MAX);
  return Object.fromEntries(keep.map((k) => [k, next[k]]));
}

export const lastSeen = (state: Pick<UserState, "seen">, id: string): number | null => state.seen?.[id] ?? null;

/** A question answered wrongly (or still being repeated) whose next repetition is due. */
export const reviewDue = (rec: AnswerRecord | undefined, now = Date.now()) => !!rec?.due && Date.parse(rec.due) <= now;

/**
 * Never seen first (keeping the given order), then what was seen – longest ago first –, then what is done
 * (`done`, e.g. a watched clip) – also longest ago first. Stable otherwise.
 */
export function freshFirst<T>(list: T[], id: (x: T) => string, state: Pick<UserState, "seen">, done: (x: T) => boolean = () => false): T[] {
  const tier = (x: T) => (done(x) ? 2 : lastSeen(state, id(x)) !== null ? 1 : 0);
  return list
    .map((x, i) => ({ x, i, t: tier(x), at: lastSeen(state, id(x)) ?? 0 }))
    .sort((a, b) => a.t - b.t || (a.t === 0 ? a.i - b.i : a.at - b.at || a.i - b.i))
    .map((e) => e.x);
}
