// The learner's step per exercise and puzzle kind (lib/skill.ts).  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { practised, skillOf, START, stepOf } from "../lib/skill";

test("a new learner starts on step 3; right answers raise the step slowly, mistakes lower it faster", () => {
  let s: { skill?: Record<string, number> } = {};
  assert.equal(stepOf(s, "sudoku"), START);
  for (let i = 0; i < 3; i++) s = { skill: practised(s, "sudoku", "right") };
  assert.equal(stepOf(s, "sudoku"), 4, "three right in a row: one step up");
  s = { skill: practised(s, "sudoku", "wrong") };
  assert.equal(stepOf(s, "sudoku"), 3, "one mistake: back down");
  assert.equal(stepOf(s, "percent"), START, "every kind on its own");
});

test("the value stays between 1 and 5 and settles where about seven in ten are right", () => {
  let s: { skill?: Record<string, number> } = {};
  for (let i = 0; i < 50; i++) s = { skill: practised(s, "x", "right") };
  assert.equal(skillOf(s, "x"), 5);
  for (let i = 0; i < 50; i++) s = { skill: practised(s, "x", "wrong") };
  assert.equal(skillOf(s, "x"), 1);
  // a learner who solves 70 % on every step: the value neither climbs nor falls over many rounds
  s = { skill: { x: 3 } };
  for (let i = 0; i < 1000; i++) s = { skill: practised(s, "x", i % 10 < 7 ? "right" : "wrong") };
  assert.ok(Math.abs(skillOf(s, "x") - 3) < 1, String(skillOf(s, "x")));
  // hints count for little
  assert.ok(skillOf({ skill: practised({}, "y", "hinted") }, "y") < skillOf({ skill: practised({}, "y", "right") }, "y"));
});
