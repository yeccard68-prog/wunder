// Pattern puzzles (lib/matrix.ts): of all 81 possible drawings exactly one completes the grid – the one marked right.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { makeExercise } from "../lib/exercises";
import { describe, type Cell } from "../lib/matrix";

const FEATURES = ["shape", "count", "fill", "size"] as const;
/** Do nine values (row by row) follow one of the simple rules: all the same, the same along rows, the same down columns, or each once per row and column? */
function regular(v: number[]): boolean {
  const row = (r: number) => [v[r * 3], v[r * 3 + 1], v[r * 3 + 2]], col = (c: number) => [v[c], v[c + 3], v[c + 6]];
  const same = (l: number[]) => l.every((x) => x === l[0]), once = (l: number[]) => new Set(l).size === 3;
  return [0, 1, 2].every((k) => same(row(k))) || [0, 1, 2].every((k) => same(col(k))) || [0, 1, 2].every((k) => once(row(k)) && once(col(k)));
}

test("pattern puzzles: only one drawing fits the grid, and it is the marked option", () => {
  const gaps = new Set<number>();
  for (const step of [1, 2, 3, 4, 5] as const)
    for (let s = 0; s < 150; s++) {
      const e = makeExercise(`mx-${step}-${s}`, "matrix", "16+", s % 2 ? "en" : "de", step);
      const f = e.figure!;
      assert.equal(f.cells.length, 9);
      const gap = f.cells.indexOf(null);
      assert.equal(f.cells.filter((c) => c === null).length, 1);
      gaps.add(gap);
      if (step <= 3) assert.equal(gap, 8, "the easy steps leave out the last drawing");
      const fitting: Cell[] = [];
      for (let k = 0; k < 81; k++) {
        const c: Cell = { shape: k % 3, count: Math.floor(k / 3) % 3, fill: Math.floor(k / 9) % 3, size: Math.floor(k / 27) };
        const grid = f.cells.map((x) => x ?? c);
        if (FEATURES.every((feat) => regular(grid.map((x) => x[feat])))) fitting.push(c);
      }
      assert.equal(fitting.length, 1, e.id);
      assert.deepEqual(f.options[e.correct], fitting[0], e.id);
      assert.equal(f.options.length, 4);
      assert.equal(new Set(f.options.map((o) => JSON.stringify(o))).size, 4, "four different drawings");
      assert.deepEqual(e.options, f.options.map((o) => describe(o, s % 2 === 0)));
      // every wrong drawing differs from the right one in exactly one feature
      f.options.forEach((o, i) => i !== e.correct && assert.equal(FEATURES.filter((feat) => o[feat] !== fitting[0][feat]).length, 1));
      // how many features change grows with the step
      const changing = FEATURES.filter((feat) => new Set(f.cells.map((x) => (x ?? fitting[0])[feat])).size > 1).length;
      assert.equal(changing, Math.min(step, 4), e.id);
    }
  assert.ok(gaps.size > 5, "from step 4 the missing drawing is anywhere");
});

test("drawings in words", () => {
  assert.equal(describe({ shape: 0, count: 0, fill: 1, size: 2 }, true), "ein großer gefüllter Kreis");
  assert.equal(describe({ shape: 1, count: 0, fill: 0, size: 0 }, true), "ein kleines leeres Quadrat");
  assert.equal(describe({ shape: 2, count: 2, fill: 2, size: 1 }, true), "drei mittelgroße graue Dreiecke");
  assert.equal(describe({ shape: 2, count: 1, fill: 2, size: 1 }, false), "two medium grey triangles");
  assert.equal(describe({ shape: 0, count: 0, fill: 0, size: 0 }, false), "one small empty circle");
});
