// "Rätsel des Tages" (lib/daily.ts): three tasks a day, a different mix every day, no kind on two days running.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { DAILY, dailyOpen, dailyTasks, dayNumber, minGap, turn } from "../lib/daily";
import { KINDS } from "../lib/exercises";
import type { Item, UserState } from "../lib/types";

const item = (id: string, question: string, answer: string): Item => ({
  id, kind: "question", categoryId: "science", question, options: [answer, "x", "y", "z"], source: { name: "s" }, difficulty: 1,
  createdAt: "", popularity: 0, verification: "ai_checked", minAge: 10, maxAge: null,
});
const words = ["SONNE", "MOND", "ERDE", "NEBEL", "STERN", "KOMET", "ORBIT", "MARS", "ATOM", "TON", "SAND"];
const items = words.map((w, i) => item(`q${i}`, `Frage ${i}?`, w[0] + w.slice(1).toLowerCase()));
const state = (extra: Partial<UserState> = {}) => ({ answers: Object.fromEntries(items.map((i) => [i.id, { correctIndex: 0 }])), ageBand: "16+", settings: { locale: "de" }, ...extra }) as unknown as UserState;
/** The date `k` days after 1 November 2026. */
const date = (k: number) => new Date(Date.UTC(2026, 10, 1 + k)).toISOString().slice(0, 10);

test("taking turns: every entry once per round, a new order each round, and nothing comes again after a day or two", () => {
  for (const n of [3, 4, 6, 7, 8, 12]) {
    const pool = Array.from({ length: n }, (_, i) => `k${i}`);
    const days = Array.from({ length: n * 30 }, (_, d) => turn(pool, 20000 + d, "t"));
    const from = n - (20000 % n); // the first full round starts here
    for (let r = 0; r + 1 < 29; r++) assert.equal(new Set(days.slice(from + r * n, from + (r + 1) * n)).size, n, `pool of ${n}, round ${r}`);
    // between two turns of the same entry lie at least minGap(n) days: 2 for the smallest pools, 3 for 6 to 8, 5 for 12
    const gap = minGap(n);
    assert.equal(gap, { 3: 2, 4: 2, 6: 3, 7: 3, 8: 3, 12: 5 }[n]);
    days.forEach((k, d) => { for (let back = 1; back < gap && back <= d; back++) assert.notEqual(k, days[d - back], `pool of ${n}: ${k} again after ${back} day(s) (day ${d})`); });
    const orders = new Set(Array.from({ length: 20 }, (_, r) => days.slice(from + r * n, from + (r + 1) * n).join()));
    assert.ok(orders.size > (n === 3 ? 2 : 10), `pool of ${n}: ${orders.size} different orders in 20 rounds`);
  }
  assert.equal(dayNumber("1970-01-02"), 1);
  assert.equal(dayNumber("2026-11-12") - dayNumber("2026-11-11"), 1);
  assert.equal(dayNumber("2026-03-30") - dayNumber("2026-03-28"), 2, "also across the change to summer time");
});

test("three tasks a day: a logic question, a brain teaser, a grid puzzle – another mix every day", () => {
  const days = Array.from({ length: 84 }, (_, k) => dailyTasks(items, state(), date(k)));
  const seen = { logic: new Set<string>(), teaser: new Set<string>(), grid: new Set<string>() };
  days.forEach((tasks, k) => {
    assert.equal(tasks.length, 3);
    const [logic, teaser, grid] = tasks;
    assert.ok(logic.exercise && DAILY.logic[2].includes(logic.exercise.kind), `${date(k)}: ${logic.kind}`);
    assert.ok(teaser.exercise && DAILY.teaser[2].includes(teaser.exercise.kind), `${date(k)}: ${teaser.kind}`);
    assert.ok(grid.puzzle && DAILY.grid[2].includes(grid.puzzle.kind), `${date(k)}: ${grid.kind}`);
    assert.equal(new Set(tasks.map((t) => t.id)).size, 3);
    tasks.forEach((t) => assert.equal(t.id, t.puzzle ? t.puzzle.id : t.exercise.id));
    seen.logic.add(logic.kind); seen.teaser.add(teaser.kind); seen.grid.add(grid.kind);
    // a kind is back after three days at the earliest (the teasers, with twelve kinds, after five)
    for (const slot of [0, 1, 2]) for (let back = 1; back < (slot === 1 ? 5 : 3) && back <= k; back++) assert.notEqual(tasks[slot].kind, days[k - back][slot].kind, `${date(k)}: ${tasks[slot].kind} again after ${back} day(s)`);
  });
  // within twelve weeks every kind has had its turn
  assert.equal(seen.logic.size, DAILY.logic[2].length);
  assert.equal(seen.teaser.size, DAILY.teaser[2].length);
  assert.equal(seen.grid.size, DAILY.grid[2].length);
  // the same trio of kinds hardly ever comes twice in those weeks (672 trios are possible)
  const trios = new Set(days.map((tasks) => tasks.map((t) => t.kind).join("+")));
  assert.ok(trios.size >= 70, `${trios.size} different trios in 84 days`);
  // the same day, the same tasks – and other ones the next day
  assert.deepEqual(dailyTasks(items, state(), date(5)), days[5]);
  assert.notDeepEqual(days[5].map((t) => t.id), days[6].map((t) => t.id));
});

test("the step decides how hard a task is, not which kind it is", () => {
  const easy = dailyTasks(items, state({ skill: Object.fromEntries([...KINDS[2], "sudoku", "binary", "nonogram", "pyramid", "futoshiki", "skyscrapers", "crossword"].map((k) => [k, 1])) }), date(3));
  const hard = dailyTasks(items, state({ skill: Object.fromEntries([...KINDS[2], "sudoku", "binary", "nonogram", "pyramid", "futoshiki", "skyscrapers", "crossword"].map((k) => [k, 5])) }), date(3));
  assert.deepEqual(easy.map((t) => t.kind), hard.map((t) => t.kind));
  assert.deepEqual(easy.slice(0, 2).map((t) => t.exercise!.step), [1, 1]);
  assert.deepEqual(hard.slice(0, 2).map((t) => t.exercise!.step), [5, 5]);
});

test("a crossword only once enough questions are answered – otherwise another grid puzzle takes its place", () => {
  const fresh = Array.from({ length: 42 }, (_, k) => dailyTasks(items, state({ answers: {} }), date(k)));
  assert.ok(fresh.every((tasks) => tasks.length === 3 && tasks[2].puzzle && tasks[2].kind !== "crossword"));
  const full = Array.from({ length: 42 }, (_, k) => dailyTasks(items, state(), date(k)));
  assert.ok(full.some((tasks) => tasks[2].kind === "crossword"));
});

test("children get the kinds made for them, on their steps", () => {
  for (const [age, level, cap] of [["6-9", 0, 1], ["10-12", 1, 2]] as const)
    for (let k = 0; k < 30; k++) {
      const tasks = dailyTasks(items, state({ ageBand: age, skill: { oddone: 5, matrix: 5, sudoku: 5 } }), date(k));
      assert.equal(tasks.length, 3);
      for (const t of tasks.slice(0, 2)) {
        assert.ok(KINDS[level].includes(t.exercise!.kind), `${age}: ${t.kind}`);
        assert.ok(t.exercise!.step <= cap, `${age}: ${t.kind} on step ${t.exercise!.step}`);
      }
      assert.ok(DAILY.grid[level].includes(tasks[2].puzzle!.kind));
    }
  // every kind in the pools exists for that age
  for (const level of [0, 1, 2] as const) for (const kind of [...DAILY.logic[level], ...DAILY.teaser[level]]) assert.ok(KINDS[level].includes(kind), `${level}: ${kind}`);
});

test("done for today: what is solved stays solved until midnight", () => {
  const tasks = dailyTasks(items, state(), date(9));
  const s = state({ puzzles: { daily: { date: date(9), done: [tasks[0].id, tasks[2].id] }, done: [] } });
  assert.deepEqual(dailyOpen(s, tasks, date(9)).map((t) => t.id), [tasks[1].id]);
  assert.equal(dailyOpen(s, dailyTasks(items, s, date(10)), date(10)).length, 3);
  assert.equal(dailyOpen(state(), tasks, date(9)).length, 3);
});
