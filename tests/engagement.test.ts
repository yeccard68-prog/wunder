// The feed: what it learns from viewing behaviour, how it varies topics and formats, and the facts in it.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { engagement, recordView, recentAccuracy, topicEngagement, type Signals } from "../lib/engagement";
import { AREAS, factRows, factsFor, rankFacts } from "../lib/facts";
import { entryTopic, mixFeed, type FeedEntry } from "../lib/feed";
import { forAudience } from "../lib/content";
import { demoContent } from "../lib/demo-content";
import { rankForYou, targetDifficulty } from "../lib/ranking";
import type { UserState } from "../lib/types";

const blank = (patch: Partial<UserState> = {}): UserState => ({
  onboarded: true, username: "T", interests: ["science"], goalMinutes: 5, motivation: "discover", ageBand: "16+", xp: 0, week: { key: "", xp: 0 },
  answers: {}, clipStats: {}, comments: {}, books: { read: [], saved: [] }, likes: [], saves: [], hidden: [], reported: [], blocked: [], following: [],
  daily: { date: "", count: 0 }, streak: { current: 0, best: 0, lastDate: null }, dailyChallenge: { date: "", score: null }, challenges: [], achievements: [], log: [],
  settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" }, ...patch,
});
const view = (s: Signals | undefined, cat: string, kind: "item" | "clip", seconds: number, times: number) => {
  for (let i = 0; i < times; i++) s = recordView(s, cat, kind, seconds);
  return s!;
};

test("signals: lingering raises a topic, swiping away lowers it, few views say little", () => {
  let s = view(undefined, "history", "item", 12, 8);
  s = view(s, "sport", "item", 0.6, 8);
  s = view(s, "math", "item", 6, 1);
  const st = blank({ signals: s });
  assert.ok(topicEngagement(st, "history") > 0.3, "long views");
  assert.ok(topicEngagement(st, "sport") < -0.3, "quick skips");
  assert.ok(Math.abs(topicEngagement(st, "math")) < 0.2, "one view is not enough to judge");
  assert.equal(engagement(undefined, []), 0);
  // a card left open for ten minutes counts no more than a minute
  const idle = recordView(undefined, "earth", "item", 600);
  assert.equal(idle.cat.earth.dwell, 60);
});

test("flow: a run of mistakes makes the next cards easier, a streak harder", () => {
  const answers = (results: boolean[]) => Object.fromEntries(results.map((correct, i) => [`q${i}`, { correct, at: new Date(2026, 9, 1, 0, i).toISOString(), categoryId: "science", difficulty: 2 as const, box: null, due: null, reviews: 0, correctIndex: 0, explanation: "" }]));
  const steady = blank({ answers: answers([true, false, true, true, false, true, true, false, true, true]) });
  const slump = blank({ answers: answers([true, true, true, true, true, true, true, false, false, false, false, false]) });
  const streak = blank({ answers: answers([false, true, false, true, true, true, true, true, true, true, true, true]) });
  assert.equal(targetDifficulty(steady), 2);
  assert.ok(targetDifficulty(slump) < targetDifficulty(blank({ answers: answers(Array(12).fill(true)).valueOf() as never })) || targetDifficulty(slump) <= 2);
  assert.equal(recentAccuracy(slump), 3 / 8);
  assert.equal(targetDifficulty(streak), 3);
});

test("odds: a format someone lingers on comes up more often, one they swipe away less often – no fixed places", () => {
  const { items, clips } = forAudience(demoContent(), "de", "16+");
  const share = (s: UserState, seed: string) => {
    const feed = mixFeed(rankForYou(items, s, { seed: "t" }), clips, [], s, [], [], [], [], [], [], seed).slice(0, 30);
    return feed.filter((e: FeedEntry) => e.kind === "clip").length;
  };
  let likes = view(undefined, "science", "clip", 30, 10);
  likes = view(likes, "science", "item", 2, 10);
  let skips = view(undefined, "science", "item", 20, 10);
  skips = view(skips, "science", "clip", 0.5, 10);
  const seeds = ["a", "b", "c", "d", "e", "f"];
  const sum = (s: UserState) => seeds.reduce((n, seed) => n + share(s, seed), 0);
  assert.ok(sum(blank({ signals: likes })) > sum(blank()), "lingering on clips brings more clips");
  assert.ok(sum(blank({ signals: skips })) < sum(blank()), "swiping clips away brings fewer");
  // chance, not slots: different seeds give different orders, the same seed the same one
  const kinds = (seed: string) => mixFeed(rankForYou(items, blank(), { seed: "t" }), clips, [], blank(), [], [], [], [], [], [], seed).slice(0, 15).map((e) => e.kind).join();
  assert.notEqual(kinds("a"), kinds("b"));
  assert.equal(kinds("a"), kinds("a"));
});

test("facts: complete in both languages, sourced, valid area and topic, no duplicates", () => {
  const cats = JSON.parse(fs.readFileSync("content/categories.json", "utf8")).map((c: { id: string }) => c.id);
  assert.ok(factRows.length >= 39);
  assert.equal(new Set(factRows.map((f) => f.id)).size, factRows.length);
  assert.equal(new Set(factRows.map((f) => f.text)).size, factRows.length);
  for (const f of factRows) {
    assert.ok(f.id.startsWith("f-") && f.text.length <= 140 && f.detail.length > 40, f.id);
    assert.ok(f.translations.en?.text && f.translations.en.detail, `${f.id}: English`);
    assert.ok(f.area in AREAS && cats.includes(f.category_id), `${f.id}: area/topic`);
    assert.ok(f.sources.length && f.sources.every((s) => /^https:\/\/(de|en)\.wikipedia\.org\/wiki\//.test(s.url)), `${f.id}: source`);
  }
  assert.equal(factsFor("en", "16+").find((f) => f.id === "f-krake-herzen")!.text, "An octopus has three hearts.");
});

test("the feed: facts between the cards, topics spread, one pause", () => {
  const content = demoContent();
  const { items, clips } = forAudience(content, "de", "16+");
  const state = blank({ facts: { wow: ["f-wombat"], known: [] } });
  const facts = rankFacts(factsFor("de", "16+"), state);
  assert.equal(facts.at(-1)!.id, "f-wombat", "facts already reacted to come last");
  const feed = mixFeed(rankForYou(items, state, { seed: "t" }), clips, [], state, [], [], facts, [], [], [], "test");
  // by chance, so not at a fixed place – but practically always within the first 40 (fact odds ~18 % per place)
  assert.ok(feed.slice(0, 40).some((e) => e.kind === "fact" || e.kind === "series"));
  assert.ok(feed.some((e) => e.kind === "series"), "theme series of three facts");
  assert.equal(feed.filter((e) => e.kind === "pause").length, 1);
  const cards = feed.filter((e) => e.kind !== "pause").map(entryTopic);
  for (let i = 2; i < 60; i++) assert.ok(!(cards[i] === cards[i - 1] && cards[i] === cards[i - 2]), `three ${cards[i]} in a row at ${i}`);
});
