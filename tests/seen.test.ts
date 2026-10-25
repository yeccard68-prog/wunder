import assert from "node:assert/strict";
import test from "node:test";
import { forAudience } from "../lib/content";
import { demoContent } from "../lib/demo-content";
import { rankFacts, factsFor } from "../lib/facts";
import { rankClips } from "../lib/clips";
import { rankForYou } from "../lib/ranking";
import { regionFrom } from "../lib/region";
import { freshFirst, recordSeen, reviewDue, SEEN_MAX } from "../lib/seen";
import type { AnswerRecord, UserState } from "../lib/types";

const { items, clips } = forAudience(demoContent(), "de", "16+");
const questions = items.filter((i) => i.kind === "question");
const base = { interests: ["science"], likes: [], saves: [], hidden: [], answers: {}, clipStats: {}, following: [] };
const state = (patch: Partial<UserState> = {}) => ({ ...base, ...patch }) as unknown as UserState;
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const answer = (correct: boolean, due: string | null, at = ago(60)): AnswerRecord =>
  ({ correct, at, categoryId: "science", difficulty: 1, box: due ? 0 : null, due, reviews: 0, correctIndex: 0, explanation: "" }) as AnswerRecord;
const sec = (min: number) => Math.round((Date.now() - min * 60_000) / 1000);

test("seen: remembered per entry, the oldest forgotten beyond the limit", () => {
  let seen = recordSeen(undefined, "a", 1_000_000);
  seen = recordSeen(seen, "b", 2_000_000);
  assert.deepEqual(Object.keys(seen).sort(), ["a", "b"]);
  const many = Object.fromEntries(Array.from({ length: SEEN_MAX }, (_, i) => [`x${i}`, i + 10]));
  const next = recordSeen(many, "new");
  assert.equal(Object.keys(next).length, SEEN_MAX);
  assert.ok("new" in next && !("x0" in next));
});

test("freshFirst: new in order, then seen longest ago first, done last", () => {
  const s = state({ seen: { b: 300, c: 100, d: 200 } });
  assert.deepEqual(freshFirst(["a", "b", "c", "d", "e"], (x) => x, s, (x) => x === "d"), ["a", "e", "c", "b", "d"]);
});

test("questions: seen ones after all new ones (seen longest ago first); answered ones are left out", () => {
  const [q1, q2, q3, q4] = questions;
  const s = state({ seen: { [q1.id]: sec(5), [q2.id]: sec(500) }, answers: { [q3.id]: answer(true, null) } });
  const order = rankForYou(items, s).map((r) => r.item.id);
  const pos = (id: string) => order.indexOf(id);
  assert.ok(pos(q4.id) < pos(q2.id), "a new card comes before a seen one");
  assert.ok(pos(q2.id) < pos(q1.id), "seen longer ago comes first");
  assert.equal(pos(q3.id), -1, "answered correctly is not shown again");
  assert.equal(order[order.length - 1], q1.id, "the card seen most recently comes last");
});

test("questions answered wrongly come back once due – mixed in among the new ones", () => {
  const wrong = questions.slice(0, 3);
  const s = state({ answers: Object.fromEntries(wrong.map((q, i) => [q.id, answer(false, ago(30 - i))])), seen: Object.fromEntries(wrong.map((q) => [q.id, sec(40)])) });
  const ranked = rankForYou(items, s);
  const at = wrong.map((q) => ranked.findIndex((r) => r.item.id === q.id)).sort((a, b) => a - b);
  // at random places, but among the new ones – not after them
  assert.ok(at.every((i) => i >= 0 && i < 25), JSON.stringify(at));
  assert.ok(wrong.every((q) => /Wiederholen/.test(ranked.find((r) => r.item.id === q.id)!.reason)));
  const other = rankForYou(items, s, { seed: "another day" }).map((r) => r.item.id);
  assert.notDeepEqual(other.slice(0, 25), ranked.map((r) => r.item.id).slice(0, 25), "places drawn by chance");
});

test("cards about the learner's own country come first; the country is read from the device language", () => {
  assert.equal(regionFrom(["de-AT", "de"]), "AT");
  assert.equal(regionFrom(["de"]), "DE");
  assert.equal(regionFrom(["en"]), null);
  const local = { ...questions[questions.length - 1], countries: ["AT"] };
  const list = [...items.filter((i) => i.id !== local.id), local];
  const pos = (region: string | null) => rankForYou(list, state(), { region, seed: "x" }).findIndex((r) => r.item.id === local.id);
  assert.ok(pos("AT") < pos("DE") || pos("AT") === 0, `AT ${pos("AT")} vs DE ${pos("DE")}`);
  assert.equal(rankForYou(list, state(), { region: "AT", seed: "x" }).find((r) => r.item.id === local.id)!.reason.length > 0, true);
});

test("a wrong answer stays out until its repetition is due; a correct one never counts as due", () => {
  const [q1, q2] = questions;
  const soon = new Date(Date.now() + 5 * 60_000).toISOString();
  assert.equal(reviewDue(answer(false, soon)), false);
  assert.equal(reviewDue(answer(true, null)), false);
  assert.equal(reviewDue(answer(false, ago(1))), true);
  const order = rankForYou(items, state({ answers: { [q1.id]: answer(false, soon), [q2.id]: answer(true, null) } })).map((r) => r.item.id);
  assert.ok(!order.includes(q1.id) && !order.includes(q2.id)); // neither is in the feed right now
});

test("facts and clips: seen ones move back behind everything new", () => {
  const facts = factsFor("de", "16+");
  const first = rankFacts(facts, state());
  const seenFact = first[0].id;
  const later = rankFacts(facts, state({ seen: { [seenFact]: sec(1) } }));
  assert.equal(later[later.length - 1].id, seenFact);

  const c = rankClips(clips, state());
  const started = c[0].id;
  const watched = c[1].id;
  const after = rankClips(clips, state({ seen: { [started]: sec(1), [watched]: sec(100) }, clipStats: { [watched]: { plays: 1, completed: 1 } } }));
  assert.deepEqual(after.slice(-2).map((x) => x.id), [started, watched]); // started but not finished before watched
});

test("facts: myth and truth cards carry the statement to judge, figures their localized suffix", async () => {
  const { factsFor } = await import("../lib/facts");
  const de = factsFor("de", "16+");
  const en = factsFor("en", "16+");
  const myth = de.find((f) => f.id === "f-mauer-mond")!;
  assert.equal(myth.quiz, "myth");
  assert.match(myth.claim!, /kann man vom Mond/);
  assert.notEqual(myth.claim, myth.text); // the belief, not the fact
  assert.match(en.find((f) => f.id === "f-mauer-mond")!.claim!, /naked eye/);
  const truth = de.find((f) => f.id === "f-seepferdchen")!;
  assert.equal(truth.claim, truth.text);
  assert.deepEqual(de.find((f) => f.id === "f-zitteraal")!.figure, { value: 860, suffix: " Volt" });
  assert.equal(en.find((f) => f.id === "f-zitteraal")!.figure!.suffix, " volts");
});
