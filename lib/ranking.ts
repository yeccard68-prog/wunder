import type { Item, UserState } from "./types";
import { categoryById } from "./categories";
import { ACTIVITIES, personById } from "./people";
import { hash, today } from "./gamification";

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
  completed: -20,
};

export interface Ranked {
  item: Item;
  reason: string; // German text = translation key, may contain {placeholders}
  vars?: Record<string, string>;
}

export function targetDifficulty(state: UserState): number {
  const all = Object.values(state.answers);
  if (all.length < 5) return 1;
  const acc = all.filter((a) => a.correct).length / all.length;
  return acc > 0.8 ? 3 : acc > 0.55 ? 2 : 1;
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

  return items
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
      ];
      const done = state.answers[item.id];
      const score =
        parts.reduce((n, [v]) => n + v, 0) +
        (item.kind === "question" ? W.difficultyFit * (1 - Math.abs(item.difficulty - target) / 2) : 1) +
        (done ? W.completed : 0) +
        (hash(item.id + day) % 100) / 100; // small daily shuffle
      const [, reason, vars] = [...parts].sort((a, b) => b[0] - a[0])[0];
      return { item, reason, vars, score };
    })
    .sort((a, b) => b.score - a.score);
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
