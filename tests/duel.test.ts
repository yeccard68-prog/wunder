// Duels: the turn order matches the database, and a practice duel against the computer plays through
// by the same rules (what you may see, when it ends, who wins).  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { demoContent } from "../lib/demo-content";
import { createPractice, duelPool, duelRecord, nextStep, PER_ROUND, practiceAnswer, practiceBot, practicePick, practiceView, type PracticeDuel } from "../lib/duel";

const pool = duelPool(demoContent().items);
// a fixed random sequence, so every run plays the same duel
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const no = [false, false, false];

test("turn order: A picks and plays first, B picks round 2, A picks round 3", () => {
  const order: string[] = [];
  const s = { picked: [...no], done: { a: [...no], b: [...no] }, joined: true };
  for (let step = nextStep(s); step.action !== "done"; step = nextStep(s)) {
    order.push(`${step.round}${step.role} ${step.action}`);
    if (step.action === "pick") s.picked[step.round! - 1] = true;
    else s.done[step.role!][step.round! - 1] = true;
  }
  assert.deepEqual(order, ["1a pick", "1a answer", "1b answer", "2b pick", "2b answer", "2a answer", "3a pick", "3a answer", "3b answer"]);
  // the SQL function walks the same steps
  const sql = fs.readFileSync("supabase/migrations/20261023100000_duels.sql", "utf8");
  assert.ok(sql.includes(`array['${order.join("', '")}']`));
});

test("turn order: without an opponent the duel waits for someone to join", () => {
  assert.deepEqual(nextStep({ picked: [true, false, false], done: { a: [true, false, false], b: [...no] }, joined: false }), { round: 1, role: "b", action: "join" });
});

test("duel questions: plain multiple choice with a known answer, no riddles", () => {
  assert.ok(pool.length > 100);
  for (const i of pool) {
    assert.equal(i.kind, "question", i.id);
    assert.ok(!i.hints?.length, i.id);
    assert.equal(typeof i.correctIndex, "number", i.id);
  }
});

test("practice duel: plays through by the rules, without showing anything early", () => {
  const rng = seeded(7);
  let d: PracticeDuel = createPractice(pool, rng);
  let v = practiceView(d, pool, "de");
  assert.equal(v.next.action, "pick");
  assert.equal(v.rounds[0].offered?.length, 3);
  assert.equal(v.rounds[0].questions, null, "no questions before the topic is chosen");
  assert.throws(() => practiceAnswer(d, "a", 1, 0, 0, pool), /not your turn/);

  const seen = new Set<string>();
  for (let guard = 0; guard < 20; guard++) {
    v = practiceView(d, pool, "de");
    if (v.status === "finished") break;
    if (v.next.role === "b") {
      d = practiceBot(d, pool, rng);
      continue;
    }
    const r = v.next.round!;
    if (v.next.action === "pick") {
      d = practicePick(d, v.rounds[r - 1].offered![0], pool, rng);
      continue;
    }
    const round = practiceView(d, pool, "de").rounds[r - 1];
    assert.equal(round.questions?.length, PER_ROUND);
    if (r === 2) assert.equal(round.theirs, null, "round 2: B's answers stay hidden until A has played it");
    for (const q of round.questions!) {
      assert.ok(!seen.has(q.id), "no question twice in a duel");
      seen.add(q.id);
    }
    for (let idx = round.mine.length; idx < PER_ROUND; idx++) {
      const { duel, result } = practiceAnswer(d, "a", r, idx, idx === 1 ? null : 0, pool);
      assert.equal(typeof result.correctIndex, "number");
      if (idx === 1) assert.equal(result.correct, false, "time ran out: never correct");
      d = duel;
    }
    assert.equal(practiceView(d, pool, "de").rounds[r - 1].theirs !== null, true, "after playing a round you see the other side");
  }
  v = practiceView(d, pool, "de");
  assert.equal(v.status, "finished");
  assert.equal(seen.size, 9);
  assert.ok(v.rounds.every((r) => r.mine.length === PER_ROUND && r.theirs?.length === PER_ROUND));
  const expected = v.score.mine > v.score.theirs ? "win" : v.score.mine < v.score.theirs ? "loss" : "draw";
  assert.equal(v.result, expected);
  assert.deepEqual(duelRecord([v]), { win: +(expected === "win"), draw: +(expected === "draw"), loss: +(expected === "loss") });
});

test("practice duel: giving up is a loss, and B's choice of topic is never shown to A in advance", () => {
  const rng = seeded(11);
  let d = createPractice(pool, rng);
  d = practicePick(d, d.rounds[0].offered[0], pool, rng);
  for (let idx = 0; idx < PER_ROUND; idx++) d = practiceAnswer(d, "a", 1, idx, 0, pool).duel;
  const waiting = practiceView(d, pool, "de");
  assert.equal(waiting.next.role, "b");
  assert.equal(waiting.next.mine, false);
  d = practiceBot(d, pool, rng);
  const v = practiceView(d, pool, "de");
  assert.deepEqual([v.next.round, v.next.role, v.next.action], [2, "a", "answer"]);
  assert.equal(v.rounds[1].offered, null);
  assert.equal(v.rounds[1].theirs, null);
  assert.equal(v.score.theirs, v.rounds[0].theirs!.filter((a) => a.correct).length, "only rounds A has played count for B's visible score");
  const resigned = practiceView({ ...d, resigned: true }, pool, "de");
  assert.equal(resigned.result, "loss");
  assert.equal(resigned.forfeit, "me");
});

test("names: offensive ones are caught, harmless look-alikes pass, and the database uses the same lists", async () => {
  const { BLOCK_ANYWHERE, BLOCK_WORD, nameAllowed } = await import("../lib/names");
  for (const bad of ["F u c k", "fuck3r", "Big Dick", "Arsch", "H1tler", "Spasti99"]) assert.equal(nameAllowed(bad), false, bad);
  for (const ok of ["Alex", "Dickens", "Nazir", "Barsch", "Scharf", "Müller", "Neugierig"]) assert.equal(nameAllowed(ok), true, ok);
  const sql = fs.readFileSync("supabase/migrations/20261024110000_name_filter.sql", "utf8");
  const lists = [...sql.matchAll(/array\[([^\]]+)\]/g)].map((m) => m[1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")));
  assert.deepEqual(lists[0], BLOCK_ANYWHERE);
  assert.deepEqual(lists[1], BLOCK_WORD);
});
