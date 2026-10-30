// Rounds: the questions generated from Wikidata templates come five of a kind per feed entry, so the feed is not a
// string of look-alike cards (30.10.2026).  Run: npm test
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { forAudience, toItem, type QuestionRow } from "../lib/content";
import { demoContent } from "../lib/demo-content";
import { entryContentIds, mixFeed, type FeedEntry } from "../lib/feed";
import { rankForYou } from "../lib/ranking";
import { makeRounds, ROUND_SIZE, templateOf, TEMPLATES } from "../lib/rounds";
import type { UserState } from "../lib/types";

const state = (patch: Partial<UserState> = {}): UserState => ({
  onboarded: true, username: "T", interests: ["science", "history", "earth"], goalMinutes: 5, motivation: "discover", ageBand: "16+", xp: 0, week: { key: "", xp: 0 },
  answers: {}, clipStats: {}, comments: {}, books: { read: [], saved: [] }, likes: [], saves: [], hidden: [], reported: [], blocked: [], following: [],
  daily: { date: "", count: 0 }, streak: { current: 0, best: 0, lastDate: null }, dailyChallenge: { date: "", score: null }, challenges: [], achievements: [], log: [],
  settings: { theme: "system", privateProfile: false, muted: true, captions: true, locale: "de" }, ...patch,
}) as UserState;

// the live mix: the hand-written questions plus every generated set (public/gen, loaded into the database)
const { items: handmade, clips } = forAudience(demoContent(), "de", "16+");
const generated = fs.readdirSync("public/gen").filter((f) => f.endsWith(".json")).flatMap((f) =>
  (JSON.parse(fs.readFileSync(`public/gen/${f}`, "utf8")) as Partial<QuestionRow>[]).map((r) =>
    toItem({ kind: "question", difficulty: 2, source_name: "Wikidata", source_url: null, verification_status: "ai_checked", show_in_feed: true, created_at: "2026-10-25T12:00:00Z", ...r } as QuestionRow)));
const all = [...handmade, ...generated];

test("rounds: every generated set has a name, hand-written questions never count as generated", () => {
  const templates = new Set(generated.map((i) => templateOf(i.id)));
  assert.ok(!templates.has(null), "every generated id follows wd-<template>-Q…");
  for (const t of templates) assert.ok(TEMPLATES[t!], `name for template ${t}`);
  assert.equal(handmade.filter((i) => templateOf(i.id)).length, 0);
});

test("rounds: five of one template, each fact once, no template twice within six rounds", () => {
  const s = state();
  const { cards, rounds } = makeRounds(rankForYou(all, s, { seed: "t" }), s);
  assert.equal(cards.filter((c) => templateOf(c.item.id)).length, 0, "no generated question on its own");
  const facts = rounds.flatMap((r) => r.items.map((i) => i.id.replace(/-[rf]$/, "")));
  assert.equal(new Set(facts).size, facts.length, "a fact asked in several ways comes only once");
  for (const [i, r] of rounds.entries()) {
    assert.ok(r.items.length >= 3 && r.items.length <= ROUND_SIZE);
    assert.ok(r.items.every((x) => templateOf(x.id) === r.template));
    const before = rounds.slice(Math.max(0, i - 6), i).map((x) => x.template);
    if (i < 100) assert.ok(!before.includes(r.template), `round ${i} (${r.template}) repeats too soon`);
  }
  // the first rounds go through many different templates
  assert.ok(new Set(rounds.slice(0, 20).map((r) => r.template)).size >= 15);
});

test("rounds: a generated question answered wrong comes back on its own for repetition", () => {
  const id = generated[0].id;
  const s = state({ answers: { [id]: { correct: false, correctIndex: 0, explanation: "", categoryId: generated[0].categoryId, at: "2026-10-01T10:00:00Z", due: "2026-10-02T10:00:00Z" } } as unknown as UserState["answers"] });
  const { cards, rounds } = makeRounds([{ item: generated[0], reason: "Zum Wiederholen" }], s);
  assert.equal(cards.length, 1);
  assert.equal(rounds.length, 0);
});

test("feed with every question: mostly hand-written cards, the generated ones in a few rounds", () => {
  const s = state();
  const feed = mixFeed(rankForYou(all, s, { seed: "t" }), clips, [], s, [], [], [], [], [], [], "seed").slice(0, 100);
  const kinds = (k: FeedEntry["kind"]) => feed.filter((e) => e.kind === k).length;
  assert.ok(kinds("item") >= 55, `hand-written cards: ${kinds("item")}`);
  assert.ok(kinds("round") >= 3 && kinds("round") <= 15, `rounds: ${kinds("round")}`);
  assert.equal(feed.filter((e) => e.kind === "item" && templateOf(e.item.id)).length, 0);
  const ids = feed.flatMap(entryContentIds);
  assert.equal(new Set(ids).size, ids.length);
});
