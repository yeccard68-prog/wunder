// One feed for everything: question cards, clips and explainer animations.
import type { Animation } from "./animations";
import type { Clip } from "./content";
import type { Ranked } from "./ranking";
import type { UserState } from "./types";

export type FeedEntry = ({ kind: "item" } & Ranked) | { kind: "clip"; clip: Clip } | { kind: "animation"; animation: Animation };

export const entryId = (e: FeedEntry) => (e.kind === "item" ? e.item.id : e.kind === "clip" ? e.clip.id : e.animation.id);
export const asEntries = (ranked: Ranked[]): FeedEntry[] => ranked.map((r) => ({ kind: "item", ...r }));

/** After this many question cards the feed shows something to watch. */
export const MEDIA_EVERY = 3;

/**
 * Weaves clips and animations into the ranked question cards: three cards, then something to watch,
 * every third of those an animation. New material comes first – clips already watched and animations
 * whose question is already answered move to the back. The check question of an animation is shown
 * with the animation, not a second time as a card of its own.
 */
export function mixFeed(ranked: Ranked[], clips: Clip[], animations: Animation[], state: UserState): FeedEntry[] {
  const hidden = new Set(state.hidden);
  const fresh = <T,>(list: T[], seen: (x: T) => boolean) => [...list.filter((x) => !seen(x)), ...list.filter(seen)];
  const clipQueue = fresh(clips.filter((c) => !hidden.has(c.id)), (c) => (state.clipStats[c.id]?.completed ?? 0) > 0);
  const animQueue = fresh(animations, (a) => !!a.quizId && !!state.answers[a.quizId]);
  const withAnimation = new Set(animQueue.map((a) => a.quizId));
  const cards = ranked.filter((r) => !withAnimation.has(r.item.id));

  const out: FeedEntry[] = [];
  let media = 0;
  const nextMedia = (): FeedEntry | null => {
    const wantAnimation = media % 3 === 1; // clip, animation, clip, clip, animation, clip, …
    media++;
    const animation = wantAnimation || !clipQueue.length ? animQueue.shift() : undefined;
    if (animation) return { kind: "animation", animation };
    const clip = clipQueue.shift();
    return clip ? { kind: "clip", clip } : null;
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
