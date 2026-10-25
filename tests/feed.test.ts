import assert from "node:assert/strict";
import test from "node:test";
import { animationsFor } from "../lib/animations";
import { forAudience } from "../lib/content";
import { demoContent } from "../lib/demo-content";
import { entryId, mixFeed } from "../lib/feed";
import type { UserState } from "../lib/types";

const { items, clips } = forAudience(demoContent(), "de", "16+");
const animations = animationsFor("de", "16+");
const ranked = items.map((item) => ({ item, reason: "Neu" }));
const state = (patch: Partial<UserState> = {}) => ({ hidden: [], clipStats: {}, answers: {}, ...patch }) as unknown as UserState;

test("combined feed: every card, clip and animation appears exactly once", () => {
  const feed = mixFeed(ranked, clips, animations, state());
  const ids = feed.map(entryId);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(feed.filter((e) => e.kind === "clip").length, clips.length);
  assert.equal(feed.filter((e) => e.kind === "animation").length, animations.length);
  // the check question of an animation is shown with the animation, not again as its own card
  assert.equal(feed.filter((e) => e.kind === "item").length, items.length - animations.length);
});

test("combined feed: watched clips and finished animations move to the back, hidden clips disappear", () => {
  const first = mixFeed(ranked, clips, animations, state());
  const clip = first.find((e) => e.kind === "clip")!;
  const anim = first.find((e) => e.kind === "animation")!;
  if (clip.kind !== "clip" || anim.kind !== "animation") throw new Error("unexpected");
  const later = mixFeed(ranked, clips, animations, state({ clipStats: { [clip.clip.id]: { plays: 1, completed: 1 } }, answers: { [anim.animation.quizId!]: { correct: true } } } as unknown as Partial<UserState>));
  const clipsLater = later.filter((e) => e.kind === "clip");
  const animsLater = later.filter((e) => e.kind === "animation");
  assert.equal(entryId(clipsLater[clipsLater.length - 1]), clip.clip.id);
  assert.equal(entryId(animsLater[animsLater.length - 1]), anim.animation.id);
  const hidden = mixFeed(ranked, clips, animations, state({ hidden: [clip.clip.id] }));
  assert.ok(!hidden.some((e) => entryId(e) === clip.clip.id));
});

test("combined feed: every interactive visualisation is in it; tried ones move to the back", async () => {
  const { visualsFor } = await import("../lib/visuals");
  const visuals = visualsFor("de", "16+");
  const feed = mixFeed(ranked, clips, animations, state(), [], visuals);
  assert.equal(feed.filter((e) => e.kind === "visual").length, visuals.length);
  const tried = mixFeed(ranked, clips, animations, { ...state(), visuals: [visuals[0].id] }, [], visuals);
  const order = tried.filter((e) => e.kind === "visual").map((e) => (e as { visual: { id: string } }).visual.id);
  assert.equal(order.at(-1), visuals[0].id);
});
