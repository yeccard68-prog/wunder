// One feed for everything: question cards, "did you know" facts, clips, explainer animations, book ideas and
// interactive visualisations. How it is put together (see docs/BACKEND.md, "Feed"):
//  - a stream of cards: the ranked questions with a fact after every third (a nearly finished grid puzzle after every eighth), spread so that no more than two
//    of the same topic follow each other;
//  - something to watch or try between the cards – after the second card already (a strong start), then
//    every 2–4 cards depending on whether this learner lingers more on clips and animations or on cards;
//  - after a long time in the feed, once, a friendly suggestion to take a break.
import type { Animation } from "./animations";
import type { Insight } from "./books";
import type { Clip } from "./content";
import { mediaEvery, PAUSE_AFTER, spreadTopics, formatEngagement, type EntryKind } from "./engagement";
import type { DayEvent } from "./days";
import type { Fact } from "./facts";
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
  | { kind: "pause"; id: string };

export const entryId = (e: FeedEntry) =>
  e.kind === "item" ? e.item.id : e.kind === "clip" ? e.clip.id : e.kind === "animation" ? e.animation.id : e.kind === "visual" ? e.visual.id : e.kind === "fact" ? e.fact.id : e.kind === "series" ? e.id : e.kind === "day" ? e.event.id : e.kind === "study" ? e.study.id : e.kind === "puzzle" ? e.puzzle.id : e.kind === "pause" ? e.id : e.idea.id;
/** Every content id an entry shows (a series shows three facts) – all of them count as seen. */
export const entryContentIds = (e: FeedEntry) => (e.kind === "series" ? e.facts.map((f) => f.id) : [entryId(e)]);
/** Topic of an entry (for the signals and for spreading topics). */
export const entryTopic = (e: FeedEntry) =>
  e.kind === "item" ? e.item.categoryId : e.kind === "clip" ? e.clip.categoryId : e.kind === "animation" ? e.animation.categoryId : e.kind === "visual" ? e.visual.categoryId : e.kind === "fact" ? e.fact.categoryId : e.kind === "series" ? e.facts[0].categoryId : e.kind === "day" ? e.event.categoryId : e.kind === "study" ? e.study.categoryId : e.kind === "puzzle" ? "math" : e.kind === "insight" ? e.book.topicId : "";
export const asEntries = (ranked: Ranked[]): FeedEntry[] => ranked.map((r) => ({ kind: "item", ...r }));

/** Default number of cards between two things to watch (adapted per learner by mediaEvery). */
export const MEDIA_EVERY = 3;
/** A fact after this many question cards. */
export const FACT_EVERY = 3;
/** A "Studie kurz erklärt" after this many question cards (longer reads, so less often than facts). */
export const STUDY_EVERY = 7;
/** A nearly finished grid puzzle (sudoku, crossword, pyramid) after this many question cards. */
export const PUZZLE_EVERY = 8;

type Media = Extract<FeedEntry, { kind: "clip" | "animation" | "insight" | "visual" }>;

/**
 * Weaves everything into one feed (see the comment at the top). New material comes first – anything already
 * on screen moves back, and what is done (clip watched, question answered, visualisation tried) comes last. The
 * check question of an animation is shown with the animation, not a second time as a card of its own.
 */
export function mixFeed(ranked: Ranked[], clips: Clip[], animations: Animation[], state: UserState, insights: Insight[] = [], visuals: Visual[] = [], facts: Fact[] = [], days: DayEvent[] = [], studies: Study[] = [], puzzles: Puzzle[] = []): FeedEntry[] {
  const hidden = new Set(state.hidden);
  // new first; seen but not done next; done last – each seen longest ago first (lib/seen.ts)
  const clipQueue = freshFirst(clips.filter((c) => !hidden.has(c.id)), (c) => c.id, state, (c) => (state.clipStats[c.id]?.completed ?? 0) > 0);
  const animQueue = freshFirst(animations, (a) => a.id, state, (a) => !!a.quizId && !!state.answers[a.quizId]);
  const ideaQueue = [...insights]; // already ordered: unread first, spread over the books
  const visualQueue = freshFirst(visuals, (v) => v.id, state, (v) => (state.visuals ?? []).includes(v.id));
  // facts (already ranked) – every few a theme series of three from one area
  const factQueue: FeedEntry[] = withSeries(facts).map((u) => (u.kind === "fact" ? u : { kind: "series", id: `series-${u.facts.map((f) => f.id).join("+")}`, area: u.area, facts: u.facts }));
  const studyQueue = freshFirst(studies, (s) => s.id, state);
  const solved = new Set(state.puzzles?.done ?? []);
  const puzzleQueue = puzzles.filter((p) => !solved.has(p.id));
  const withAnimation = new Set(animQueue.map((a) => a.quizId));

  // 1. the stream of cards: questions with a fact after every few, topics spread out
  const stream: FeedEntry[] = [];
  ranked.filter((r) => !withAnimation.has(r.item.id)).forEach((r, i) => {
    stream.push({ kind: "item", ...r });
    if ((i + 1) % FACT_EVERY === 0 && factQueue.length) stream.push(factQueue.shift()!);
    if ((i + 1) % STUDY_EVERY === 0 && studyQueue.length) stream.push({ kind: "study", study: studyQueue.shift()! });
    if ((i + 1) % PUZZLE_EVERY === 0 && puzzleQueue.length) stream.push({ kind: "puzzle", puzzle: puzzleQueue.shift()! });
  });
  stream.push(...factQueue, ...studyQueue.map((study): FeedEntry => ({ kind: "study", study })));
  // "Heute vor … Jahren": today's event as the second card, unless it was seen already
  const day = days.find((d) => state.seen?.[d.id] === undefined);
  if (day) stream.splice(Math.min(1, stream.length), 0, { kind: "day", event: day });
  const cards = spreadTopics(stream, entryTopic);

  // 2. something to watch between the cards; the format this learner likes most comes up more often
  const rhythm = (["clip", "animation", "insight", "clip", "visual"] as const).slice();
  const liked = (["animation", "visual", "insight"] as const).filter((k) => formatEngagement(state, k as EntryKind) > 0.3);
  const order = [...rhythm, ...liked];
  let media = 0;
  const nextMedia = (): Media | null => {
    const want = order[media % order.length];
    media++;
    for (const kind of [want, "clip", "animation", "insight", "visual"] as const) {
      if (kind === "clip" && clipQueue.length) return { kind, clip: clipQueue.shift()! };
      if (kind === "animation" && animQueue.length) return { kind, animation: animQueue.shift()! };
      if (kind === "insight" && ideaQueue.length) return { kind, ...ideaQueue.shift()! };
      if (kind === "visual" && visualQueue.length) return { kind, visual: visualQueue.shift()! };
    }
    return null;
  };
  const every = mediaEvery(state);
  const out: FeedEntry[] = [];
  cards.forEach((c, i) => {
    out.push(c);
    const first = i === 1; // the first thing to watch comes early: a strong start
    if (first || (i > 1 && (i - 1) % every === 0)) {
      const m = nextMedia();
      if (m) out.push(m);
    }
  });
  // few cards left: the remaining clips and animations still belong in the feed
  for (let m = nextMedia(); m; m = nextMedia()) out.push(m);

  // 3. once, after a long time: a suggestion to pause (learning sticks better with breaks)
  if (out.length > PAUSE_AFTER + 5) out.splice(PAUSE_AFTER, 0, { kind: "pause", id: "pause" });
  return out;
}
