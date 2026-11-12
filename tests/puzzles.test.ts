// Grid puzzles: one solution each, the same puzzle for the same seed, crosswords only from answered questions.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { countSolutions, FEED_KINDS, feedPuzzles, makeCrossword, makePyramid, makeSudoku, sudokuConflicts, wordCells } from "../lib/puzzles";
import type { Item, UserState } from "../lib/types";

const item = (id: string, question: string, answer: string): Item => ({
  id, kind: "question", categoryId: "science", question, options: [answer, "x", "y", "z"], source: { name: "s" }, difficulty: 1,
  createdAt: "", popularity: 0, verification: "ai_checked", minAge: 10, maxAge: null,
});
const words = ["SONNE", "MOND", "ERDE", "NEBEL", "STERN", "KOMET", "ORBIT", "MARS", "ATOM", "TON", "SAND"];
const items = words.map((w, i) => item(`q${i}`, `Frage ${i}?`, w[0] + w.slice(1).toLowerCase()));
const answered = (ids: string[]) => ({ answers: Object.fromEntries(ids.map((id) => [id, { correctIndex: 0 }])) }) as unknown as UserState;
const state = (extra: Partial<UserState> = {}) => ({ ...answered(items.map((i) => i.id)), ageBand: "16+", settings: { locale: "de" }, ...extra }) as UserState;

test("every sudoku has exactly one solution and its givens agree with it", () => {
  for (const size of [4, 6, 9] as const)
    for (const level of ["few", "tricky"] as const) {
      const p = makeSudoku(`t-${size}-${level}`, size, level);
      assert.equal(countSolutions([...p.givens], size, p.boxRows, p.boxCols), 1);
      assert.ok(p.givens.every((v, i) => !v || v === p.solution[i]));
      assert.equal(sudokuConflicts(p, p.solution).size, 0);
      const open = p.givens.filter((v) => !v).length;
      assert.ok(level === "few" ? open <= 6 : open > 6, `${size} ${level}: ${open}`);
    }
});

test("the same seed gives the same puzzle", () => {
  assert.deepEqual(makeSudoku("a", 9, "few"), makeSudoku("a", 9, "few"));
  assert.notDeepEqual(makeSudoku("a", 9, "few").solution, makeSudoku("b", 9, "few").solution);
});

test("a pyramid adds up and can be worked out", () => {
  const p = makePyramid("p", "16+", "tricky");
  p.rows.slice(0, -1).forEach((row, y) => row.forEach((v, x) => assert.equal(v, p.rows[y + 1][x] + p.rows[y + 1][x + 1])));
  assert.ok(p.shown.flat().some((s) => !s));
});

test("a crossword uses only answered questions and its words cross correctly", () => {
  assert.equal(makeCrossword("c", items, answered([]), "few"), null);
  const p = makeCrossword("c", items, state(), "few")!;
  assert.ok(p && p.words.length >= 3);
  for (const w of p.words) wordCells(p, w).forEach((i, k) => assert.equal(p.solution[i], w.answer[k]));
  assert.equal(p.givens.filter((g, i) => !g && p.solution[i]).length > 0, true);
});

test("feed puzzles: six a day of seven kinds taking turns, starting with another kind every day; no crossword while too few questions are answered", () => {
  const days = ["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"].map((d) => feedPuzzles(items, state(), 6, d));
  for (const list of days) {
    assert.equal(list.length, 6);
    assert.equal(new Set(list.map((p) => p.kind)).size, 6, "six different kinds");
    assert.equal(new Set(list.map((p) => p.id)).size, 6);
  }
  assert.equal(new Set(days.map((list) => list[0].kind)).size, 7, "each kind starts once a week");
  assert.equal(new Set(days.flat().map((p) => p.kind)).size, FEED_KINDS.length);
  const fresh = feedPuzzles(items, state({ answers: {} }), 7, "2026-10-25");
  assert.deepEqual(fresh.map((p) => p.kind).sort(), FEED_KINDS.filter((k) => k !== "crossword").sort());
  assert.deepEqual(feedPuzzles(items, state(), 6, "2026-10-25"), days[0], "the same day, the same puzzles");
});

test("puzzles grow with the step: more empty cells, bigger pyramids, still exactly one solution", async () => {
  const { makeSudoku, makePyramid, countSolutions } = await import("../lib/puzzles");
  let last = 0;
  for (const step of [1, 2, 3, 4, 5] as const) {
    const p = makeSudoku(`st-${step}`, 9, "tricky", step);
    const holes = p.givens.filter((v) => v === 0).length;
    assert.ok(holes > last, `step ${step}: ${holes} holes`);
    assert.equal(countSolutions([...p.givens], 9, 3, 3), 1);
    last = holes;
  }
  assert.ok(makePyramid("py", "16+", "tricky", 5).rows.length > makePyramid("py", "16+", "tricky", 1).rows.length);
  // step 3 is what every adult got before
  assert.equal(makeSudoku("same", 9, "few", 3).givens.filter((v) => v === 0).length, 6);
});
