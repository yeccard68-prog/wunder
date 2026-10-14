// One feed for everything: question cards, clips, explainer animations, book ideas and interactive visualisations.
import type { Animation } from "./animations";
import type { Insight } from "./books";
import type { Clip } from "./content";
import type { Ranked } from "./ranking";
import type { UserState } from "./types";
import type { Visual } from "./visuals";

export type FeedEntry = ({ kind: "item" } & Ranked) | { kind: "clip"; clip: Clip } | { kind: "animation"; animation: Animation } | ({ kind: "insight" } & Insight) | { kind: "visual"; visual: Visual };

export const entryId = (e: FeedEntry) => (e.kind === "item" ? e.item.id : e.kind === "clip" ? e.clip.id : e.kind === "animation" ? e.animation.id : e.kind === "visual" ? e.visual.id : e.idea.id);
export const asEntries = (ranked: Ranked[]): FeedEntry[] => ranked.map((r) => ({ kind: "item", ...r }));

/** After this many question cards the feed shows something to watch. */
export const MEDIA_EVERY = 3;

/**
 * Weaves clips, animations, book ideas and visualisations into the ranked question cards: three cards,
 * then something else – in the rhythm clip, animation, book idea, clip, visualisation. New material comes
 * first – clips already watched, animations whose question is already answered and visualisations
 * already tried move to the back. The check question of an animation is shown
 * with the animation, not a second time as a card of its own.
 */
export function mixFeed(ranked: Ranked[], clips: Clip[], animations: Animation[], state: UserState, insights: Insight[] = [], visuals: Visual[] = []): FeedEntry[] {
  const hidden = new Set(state.hidden);
  const fresh = <T,>(list: T[], seen: (x: T) => boolean) => [...list.filter((x) => !seen(x)), ...list.filter(seen)];
  const clipQueue = fresh(clips.filter((c) => !hidden.has(c.id)), (c) => (state.clipStats[c.id]?.completed ?? 0) > 0);
  const animQueue = fresh(animations, (a) => !!a.quizId && !!state.answers[a.quizId]);
  const ideaQueue = [...insights]; // already ordered: unread first, spread over the books
  const visualQueue = fresh(visuals, (v) => (state.visuals ?? []).includes(v.id));
  const withAnimation = new Set(animQueue.map((a) => a.quizId));
  const cards = ranked.filter((r) => !withAnimation.has(r.item.id));

  const out: FeedEntry[] = [];
  let media = 0;
  const nextMedia = (): FeedEntry | null => {
    const want = (["clip", "animation", "insight", "clip", "visual"] as const)[media % 5];
    media++;
    // the wanted kind first, then whatever is left
    for (const kind of [want, "clip", "animation", "insight", "visual"] as const) {
      if (kind === "clip" && clipQueue.length) return { kind, clip: clipQueue.shift()! };
      if (kind === "animation" && animQueue.length) return { kind, animation: animQueue.shift()! };
      if (kind === "insight" && ideaQueue.length) return { kind, ...ideaQueue.shift()! };
      if (kind === "visual" && visualQueue.length) return { kind, visual: visualQueue.shift()! };
    }
    return null;
  };
  cards.forEach((r, i) => {
    out.push({ kind: "item", ...r });
    if ((i + 1) % MEDIA_EVERY === 0) {
      const m = nextMedia();
      if (m) out.push(m);
    }
  });
  // few question cards left: the remaining clips and animations still belong in the feed
  for (let m = nextMedia(); m; m = nextMedia()) out.push(m);
  return out;
}
