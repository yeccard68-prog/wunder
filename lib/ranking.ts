import type { Item, UserState } from "./types";
import { categoryById } from "./categories";
import { ACTIVITIES, personById } from "./people";
import { hash, today } from "./gamification";
import { recentAccuracy, topicEngagement, unexplored } from "./engagement";
import { lastSeen, reviewDue } from "./seen";

// Deterministic, explainable "For You" ranking. No ML, no LLM calls.
// Every card carries the main reason it was picked.
const W = {
  interest: 4, // chosen during onboarding
  noInterest: -3,
  affinity: 3, // likes/saves in the category (normalised)
  gap: 3, // wrong answers in the category → more practice
  difficultyFit: 2,
  freshness: 3,
  popularity: 1, // secondary signal only
  engaged: 3, // lingers on the topic in the feed (from −1 to +1, see engagement.ts)
};

/** Questions due for repetition are mixed in from this place on, one every few cards. */
export const REVIEW_FROM = 2;
export const REVIEW_EVERY = 3;

export interface Ranked {
  item: Item;
  reason: string; // German text = translation key, may contain {placeholders}
  vars?: Record<string, string>;
}

/**
 * The difficulty that keeps learning in the "flow" zone (roughly 70–80 % right): overall accuracy sets the
 * level, the last few answers nudge it – a run of mistakes makes the next cards easier, a streak harder.
 */
export function targetDifficulty(state: UserState): number {
  const all = Object.values(state.answers);
  if (all.length < 5) return 1;
  const acc = all.filter((a) => a.correct).length / all.length;
  const base = acc > 0.8 ? 3 : acc > 0.55 ? 2 : 1;
  const recent = recentAccuracy(state);
  const nudge = recent === null ? 0 : recent >= 0.9 ? 1 : recent <= 0.5 ? -1 : 0;
  return Math.max(1, Math.min(3, base + nudge));
}

export function rankForYou(items: Item[], state: UserState): Ranked[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const liked: Record<string, number> = {};
  const gaps: Record<string, number> = {};
  const bump = (m: Record<string, number>, cat: string | undefined, v: number) => cat && (m[cat] = (m[cat] ?? 0) + v);
  for (const id of state.likes) bump(liked, byId.get(id)?.categoryId, 1);
  for (const id of state.saves) bump(liked, byId.get(id)?.categoryId, 1.5);
  for (const id of state.hidden) bump(liked, byId.get(id)?.categoryId, -2);
  for (const a of Object.values(state.answers)) if (!a.correct) bump(gaps, a.categoryId, 1);

  const norm = (m: Record<string, number>) => Math.max(1, ...Object.values(m).map(Math.abs));
  const maxLiked = norm(liked);
  const maxGap = norm(gaps);
  const maxPop = Math.max(1, ...items.map((i) => i.popularity));
  const target = targetDifficulty(state);
  const hidden = new Set(state.hidden);
  const day = today();
  const now = Date.now();

  const scored = items
    .filter((i) => !hidden.has(i.id))
    .map((item) => {
      const cat = categoryById(item.categoryId);
      const ageDays = (Date.now() - Date.parse(item.createdAt)) / 86_400_000;
      const parts: [number, string, Record<string, string>?][] = [
        [state.interests.includes(item.categoryId) ? W.interest : W.noInterest, "Passt zu deinen Themen"],
        [(W.affinity * (liked[item.categoryId] ?? 0)) / maxLiked, "Weil dir Ähnliches gefallen hat"],
        [(W.gap * (gaps[item.categoryId] ?? 0)) / maxGap, "Zum Üben: {topic}", { topic: cat.name }],
        [W.freshness * Math.exp(-ageDays / 10), "Neu"],
        [(W.popularity * item.popularity) / maxPop, "Gerade beliebt"],
        [W.engaged * topicEngagement(state, item.categoryId), "Weil dir Ähnliches gefallen hat"],
      ];
      const score =
        parts.reduce((n, [v]) => n + v, 0) +
        (item.kind === "question" ? W.difficultyFit * (1 - Math.abs(item.difficulty - target) / 2) : 1) +
        (hash(item.id + day) % 100) / 100; // small daily shuffle
      const [, reason, vars] = [...parts].sort((a, b) => b[0] - a[0])[0];
      return { item, reason, vars, score, rec: state.answers[item.id], at: lastSeen(state, item.id) };
    });
  const strip = ({ item, reason, vars }: Ranked): Ranked => ({ item, reason, vars });

  // 1. never seen, best first; questions due for repetition mixed in (soonest due first)
  const fresh = scored.filter((r) => !r.rec && r.at === null).sort((a, b) => b.score - a.score).map(strip);
  const reviews = scored
    .filter((r) => reviewDue(r.rec, now))
    .sort((a, b) => Date.parse(a.rec!.due!) - Date.parse(b.rec!.due!))
    .map((r): Ranked => ({ item: r.item, reason: "Zum Wiederholen: Hier lagst du daneben" }));
  const head = withDiscoveries(fresh, state);
  for (let at = REVIEW_FROM; reviews.length && at <= head.length; at += REVIEW_EVERY) head.splice(at, 0, reviews.shift()!);
  head.push(...reviews);
  // 2. seen but not answered – seen longest ago first
  const seen = scored.filter((r) => !r.rec && r.at !== null).sort((a, b) => a.at! - b.at!).map(strip);
  // 3. answered: repetitions coming up soonest first, then those known – answered longest ago first
  const pending = (r: (typeof scored)[number]) => (r.rec!.due ? Date.parse(r.rec!.due) : Infinity);
  const done = scored
    .filter((r) => r.rec && !reviewDue(r.rec, now))
    .sort((a, b) => pending(a) - pending(b) || Date.parse(a.rec!.at) - Date.parse(b.rec!.at))
    .map(strip);
  return [...head, ...seen, ...done];
}

/** From the 5th place on, every 7th card comes from a topic the learner neither chose nor has seen much – so new interests can show. */
export const DISCOVER_FROM = 4;
export const DISCOVER_EVERY = 7;
function withDiscoveries(ranked: Ranked[], state: UserState): Ranked[] {
  const isNew = (r: Ranked) => !state.interests.includes(r.item.categoryId) && unexplored(state, r.item.categoryId) && !state.answers[r.item.id];
  const pool = ranked.filter(isNew);
  const out = ranked.filter((r) => !isNew(r));
  const seen = new Set<string>();
  for (let at = DISCOVER_FROM; at <= out.length && pool.length; at += DISCOVER_EVERY) {
    // one topic at a time: the next discovery comes from a topic not yet offered
    const i = Math.max(0, pool.findIndex((r) => !seen.has(r.item.categoryId)));
    const [r] = pool.splice(i, 1);
    seen.add(r.item.categoryId);
    out.splice(at, 0, { ...r, reason: "Etwas Neues für dich", vars: undefined });
  }
  return [...out, ...pool];
}

/** Following feed: cards that people you follow have liked, newest activity first. */
export function rankFollowing(items: Item[], state: UserState): Ranked[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const seen = new Set<string>(state.hidden);
  const out: Ranked[] = [];
  for (const a of [...ACTIVITIES].sort((x, y) => x.hoursAgo - y.hoursAgo)) {
    const item = a.itemId && byId.get(a.itemId);
    if (a.type !== "like" || !item || seen.has(item.id) || !state.following.includes(a.userId)) continue;
    seen.add(item.id);
    out.push({ item, reason: "{name} gefällt das", vars: { name: personById(a.userId)!.name.split(" ")[0] } });
  }
  return out;
}
