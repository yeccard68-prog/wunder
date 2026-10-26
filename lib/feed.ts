// One feed for everything: question cards, "did you know" facts, clips, explainer animations, book ideas,
// interactive visualisations, studies and grid puzzles. How it is put together (see docs/BACKEND.md, "Feed"):
//  - by chance, place by place: a format is drawn with odds that only this learner's behaviour moves (how long
//    they stay, how often they swipe away) – no format has a fixed place;
//  - within a format, new before seen before done; topics the learner lingers on are preferred, never three of
//    the same topic in a row;
//  - after a long time in the feed, once, a friendly suggestion to take a break.
import type { Animation } from "./animations";
import type { Insight } from "./books";
import type { Clip } from "./content";
import { formatEngagement, PAUSE_AFTER, topicEngagement, type EntryKind } from "./engagement";
import { rng } from "./gamification";
import type { DayEvent } from "./days";
import type { Fact } from "./facts";
import type { Exercise } from "./exercises";
import type { Puzzle } from "./puzzles";
import type { Study } from "./studies";
import { withSeries } from "./series";
import type { Ranked } from "./ranking";
import type { UserState } from "./types";
import { freshFirst } from "./seen";
import type { Visual } from "./visuals";

export type FeedEntry =
  | ({ kind: "item" } & Ranked)
  | { kind: "clip"; clip: Clip }
  | { kind: "animation"; animation: Animation }
  | ({ kind: "insight" } & Insight)
  | { kind: "visual"; visual: Visual }
  | { kind: "fact"; fact: Fact }
  | { kind: "series"; id: string; area: Fact["area"]; facts: Fact[] }
  | { kind: "day"; event: DayEvent }
  | { kind: "study"; study: Study }
  | { kind: "puzzle"; puzzle: Puzzle }
  | { kind: "exercise"; exercise: Exercise }
  | { kind: "pause"; id: string };

export const entryId = (e: FeedEntry) =>
  e.kind === "item" ? e.item.id : e.kind === "clip" ? e.clip.id : e.kind === "animation" ? e.animation.id : e.kind === "visual" ? e.visual.id : e.kind === "fact" ? e.fact.id : e.kind === "series" ? e.id : e.kind === "day" ? e.event.id : e.kind === "study" ? e.study.id : e.kind === "puzzle" ? e.puzzle.id : e.kind === "exercise" ? e.exercise.id : e.kind === "pause" ? e.id : e.idea.id;
/** Every content id an entry shows (a series shows three facts) – all of them count as seen. */
export const entryContentIds = (e: FeedEntry) => (e.kind === "series" ? e.facts.map((f) => f.id) : [entryId(e)]);
/** Topic of an entry (for the signals and for spreading topics). */
export const entryTopic = (e: FeedEntry) =>
  e.kind === "item" ? e.item.categoryId : e.kind === "clip" ? e.clip.categoryId : e.kind === "animation" ? e.animation.categoryId : e.kind === "visual" ? e.visual.categoryId : e.kind === "fact" ? e.fact.categoryId : e.kind === "series" ? e.facts[0].categoryId : e.kind === "day" ? e.event.categoryId : e.kind === "study" ? e.study.categoryId : e.kind === "puzzle" || e.kind === "exercise" ? "math" : e.kind === "insight" ? e.book.topicId : "";
export const asEntries = (ranked: Ranked[]): FeedEntry[] => ranked.map((r) => ({ kind: "item", ...r }));

/**
 * How often each format comes up for someone the feed knows nothing about yet. These are only the starting odds:
 * every view moves them – a format someone lingers on comes up more often, one they keep swiping away less often
 * (lib/engagement.ts). No format has a fixed place in the feed.
 */
export const START_ODDS: Record<Exclude<EntryKind, "series">, number> = { item: 50, fact: 13, clip: 10, animation: 7, insight: 4, visual: 3, study: 3, puzzle: 4, exercise: 5, day: 3 };
/** How strongly behaviour moves the odds: engagement −1 … +1 → odds × 1/MOVE … × MOVE. */
const MOVE = 3;
/** Topics someone keeps skipping come up this much less (they never disappear – interests change). */
const TOPIC_MOVE = 2;

/**
 * Weaves everything into one feed by chance, steered only by how this learner uses the feed: for every place a
 * format is drawn at random with the odds above, moved by the learner's behaviour; within a format the next entry
 * comes from its queue (new first, seen longest ago next, done last – lib/seen.ts), preferring topics the learner
 * lingers on. The same `seed` gives the same feed, so it does not reshuffle while someone scrolls. The check question
 * of an animation is shown with the animation, not a second time as a card of its own.
 */
export function mixFeed(ranked: Ranked[], clips: Clip[], animations: Animation[], state: UserState, insights: Insight[] = [], visuals: Visual[] = [], facts: Fact[] = [], days: DayEvent[] = [], studies: Study[] = [], puzzles: Puzzle[] = [], seed = String(Date.now()), exercises: Exercise[] = []): FeedEntry[] {
  const hidden = new Set(state.hidden);
  const r = rng(seed);
  const animQueue = freshFirst(animations, (a) => a.id, state, (a) => !!a.quizId && !!state.answers[a.quizId]);
  const withAnimation = new Set(animQueue.map((a) => a.quizId));
  const solved = new Set(state.puzzles?.done ?? []);
  const queues: Record<keyof typeof START_ODDS, FeedEntry[]> = {
    item: ranked.filter((x) => !withAnimation.has(x.item.id)).map((x): FeedEntry => ({ kind: "item", ...x })),
    // facts (already ranked) – now and then a theme series of three from one area
    fact: withSeries(facts).map((u): FeedEntry => (u.kind === "fact" ? u : { kind: "series", id: `series-${u.facts.map((f) => f.id).join("+")}`, area: u.area, facts: u.facts })),
    clip: freshFirst(clips.filter((c) => !hidden.has(c.id)), (c) => c.id, state, (c) => (state.clipStats[c.id]?.completed ?? 0) > 0).map((clip): FeedEntry => ({ kind: "clip", clip })),
    animation: animQueue.map((animation): FeedEntry => ({ kind: "animation", animation })),
    insight: insights.map((x): FeedEntry => ({ kind: "insight", ...x })), // already ordered: unread first, spread over the books
    visual: freshFirst(visuals, (v) => v.id, state, (v) => (state.visuals ?? []).includes(v.id)).map((visual): FeedEntry => ({ kind: "visual", visual })),
    study: freshFirst(studies, (s) => s.id, state).map((study): FeedEntry => ({ kind: "study", study })),
    puzzle: puzzles.filter((p) => !solved.has(p.id)).map((puzzle): FeedEntry => ({ kind: "puzzle", puzzle })),
    day: days.filter((d) => state.seen?.[d.id] === undefined).slice(0, 1).map((event): FeedEntry => ({ kind: "day", event })),
    exercise: exercises.map((exercise): FeedEntry => ({ kind: "exercise", exercise })),
  };
  const odds = (kind: keyof typeof START_ODDS) => START_ODDS[kind] * MOVE ** formatEngagement(state, kind === "fact" ? "fact" : kind);
  const topicOdds = (e: FeedEntry) => TOPIC_MOVE ** topicEngagement(state, entryTopic(e));
  const out: FeedEntry[] = [];
  for (;;) {
    // never a third entry of the same topic in a row: formats with only that topic left sit this place out
    const last = out.slice(-2).map(entryTopic);
    const blocked = last.length === 2 && last[0] === last[1] ? last[0] : null;
    const all = (Object.keys(queues) as (keyof typeof START_ODDS)[]).filter((k) => queues[k].length);
    if (!all.length) break;
    const free = all.filter((k) => queues[k].some((e) => entryTopic(e) !== blocked));
    const kinds = free.length ? free : all;
    // draw a format
    const weights = kinds.map(odds);
    let x = r() * weights.reduce((a, b) => a + b, 0);
    const kind = kinds[weights.findIndex((w) => (x -= w) < 0)] ?? kinds[kinds.length - 1];
    // within it: cards and facts (long lists) pick one of the next few by the learner's topic odds; the other
    // formats keep their order, so what is done stays at the back
    const q = queues[kind];
    const open = q.map((e, i) => ({ e, i })).filter(({ e }) => entryTopic(e) !== blocked);
    if (!open.length) open.push({ e: q[0], i: 0 }); // nothing else left in this format
    let chosen = open[0];
    if (kind === "item" || kind === "fact") {
      const pick = open.slice(0, 4).map((p) => ({ ...p, w: topicOdds(p.e) }));
      let y = r() * pick.reduce((sum, p) => sum + p.w, 0);
      chosen = pick.find((p) => (y -= p.w) < 0) ?? pick[0];
    }
    out.push(q.splice(chosen.i, 1)[0]);
  }
  // once, after a long time: a suggestion to pause (learning sticks better with breaks)
  if (out.length > PAUSE_AFTER + 5) out.splice(PAUSE_AFTER, 0, { kind: "pause", id: "pause" });
  return out;
}
