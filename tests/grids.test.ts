// Binary puzzle, nonogram, skyscrapers (lib/grids.ts): exactly one solution each, checked here by solvers of their own.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { binaryConflicts, countBinary, countSkyscrapers, makeBinary, makeNonogram, makeSkyscrapers, runs, skyscraperConflicts, solveNonogram, visible } from "../lib/grids";

const STEPS = [1, 2, 3, 4, 5] as const;
const LEVELS = ["few", "tricky"] as const;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** All solutions of a binary puzzle by plain trial (rules written out again): as many 0s as 1s per line, never three alike in a row. */
function binarySolutions(n: number, givens: number[], limit = 3): number[][] {
  const out: number[][] = [], g = [...givens];
  const lineOk = (line: number[], full: boolean) => {
    for (const v of [0, 1]) if (line.filter((x) => x === v).length > n / 2) return false;
    for (let i = 0; i + 2 < n; i++) if (line[i] >= 0 && line[i] === line[i + 1] && line[i] === line[i + 2]) return false;
    return !full || !line.includes(-1);
  };
  const go = (i: number) => {
    if (out.length >= limit) return;
    if (i === n * n) { out.push([...g]); return; }
    if (givens[i] >= 0) return go(i + 1);
    for (const v of [0, 1]) {
      g[i] = v;
      const y = Math.floor(i / n), x = i % n;
      if (lineOk(range(n).map((k) => g[y * n + k]), false) && lineOk(range(n).map((k) => g[k * n + x]), false)) go(i + 1);
    }
    g[i] = -1;
  };
  go(0);
  return out;
}
test("binary puzzle: one solution on every step, the size grows, mistakes show while typing", () => {
  const sizes = new Set<number>();
  for (const step of STEPS) for (const level of LEVELS) for (let s = 0; s < 6; s++) {
    const p = makeBinary(`bin-${step}-${level}-${s}`, "16+", level, step);
    const n = p.size;
    sizes.add(n);
    assert.equal(n, [4, 6, 6, 8, 8][step - 1]);
    assert.ok(p.givens.every((v, i) => v === -1 || v === p.solution[i]));
    const open = p.givens.filter((v) => v < 0).length;
    assert.ok(open >= 3, `${step} ${level}: ${open} open`);
    assert.ok(level === "few" ? open <= 14 : open >= 8, `${step} ${level}: ${open} open`);
    const found = binarySolutions(n, p.givens);
    assert.equal(found.length, 1, `${p.id}: ${found.length} solutions`);
    assert.deepEqual(found[0], p.solution);
    assert.equal(countBinary(n, [...p.givens]), 1);
    assert.equal(binaryConflicts(p, p.solution).size, 0);
    // every row and column: as many 0s as 1s
    for (let k = 0; k < n; k++) {
      assert.equal(range(n).filter((x) => p.solution[k * n + x] === 1).length, n / 2);
      assert.equal(range(n).filter((y) => p.solution[y * n + k] === 1).length, n / 2);
    }
  }
  assert.deepEqual([...sizes].sort(), [4, 6, 8]);
  // three alike in a row and a row that is too full are marked
  assert.deepEqual([...binaryConflicts({ size: 4 }, [1, 1, 1, -1, ...Array<number>(12).fill(-1)])].sort(), [0, 1, 2]);
  assert.equal(binaryConflicts({ size: 4 }, [0, 1, 0, -1, 0, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1]).size, 3); // three 0s in the first column
  assert.equal(makeBinary("kid", "6-9", "tricky", 5).size, 4);
  assert.equal(makeBinary("kid", "10-12", "tricky", 5).size, 6);
  assert.deepEqual(makeBinary("same", "16+", "tricky", 3), makeBinary("same", "16+", "tricky", 3));
});

/** Number of pictures with the given numbers at the edge, by trying every row placement (counted up to 2). */
function nonogramCount(n: number, rows: number[][], cols: number[][]): number {
  const options = (clue: number[]): number[][] => {
    const out: number[][] = [];
    const go = (k: number, line: number[]) => {
      if (k === clue.length) { if (line.length <= n + 1) out.push([...line, ...Array<number>(n).fill(0)].slice(0, n)); return; }
      for (let gap = 0; line.length + gap + clue[k] <= n; gap++) go(k + 1, [...line, ...Array<number>(gap).fill(0), ...Array<number>(clue[k]).fill(1), 0]);
    };
    go(0, []);
    return out;
  };
  const perRow = rows.map(options);
  let found = 0;
  const grid: number[][] = [];
  const go = (y: number) => {
    if (found > 1) return;
    if (y === n) { if (range(n).every((x) => JSON.stringify(runs(grid.map((r) => r[x]))) === JSON.stringify(cols[x]))) found++; return; }
    for (const line of perRow[y]) {
      grid.push(line);
      // a column that already has too many or too long runs cannot work out
      const ok = range(n).every((x) => { const have = runs(grid.map((r) => r[x])); return have.length <= cols[x].length && have.every((len, i) => len <= cols[x][i] || i === have.length - 1 && len <= Math.max(...cols[x])); });
      if (ok) go(y + 1);
      grid.pop();
    }
  };
  go(0);
  return found;
}
test("nonogram: the numbers fit the picture, logic alone finds it, and no other picture has the same numbers", () => {
  const sizes = new Set<number>();
  for (const step of STEPS) for (const level of LEVELS) for (let s = 0; s < 5; s++) {
    const p = makeNonogram(`non-${step}-${level}-${s}`, "16+", level, step);
    const n = p.size;
    sizes.add(n);
    assert.equal(n, [5, 5, 6, 8, 10][step - 1]);
    for (let k = 0; k < n; k++) {
      assert.deepEqual(p.rows[k], runs(range(n).map((x) => p.solution[k * n + x])));
      assert.deepEqual(p.cols[k], runs(range(n).map((y) => p.solution[y * n + k])));
      assert.ok(p.rows[k].length > 0 && p.cols[k].length > 0, "no empty row or column");
    }
    assert.deepEqual(solveNonogram(n, p.rows, p.cols), p.solution);
    if (n <= 8) assert.equal(nonogramCount(n, p.rows, p.cols), 1, p.id);
    const open = p.givens.filter((g) => !g).length;
    assert.ok(level === "tricky" ? open === n * n : open > 0 && open < n * n, `${level}: ${open} open`);
  }
  assert.deepEqual([...sizes].sort((a, b) => a - b), [5, 6, 8, 10]);
  assert.deepEqual(runs([1, 1, 0, 1, 0, 0, 1, 1, 1]), [2, 1, 3]);
  assert.equal(makeNonogram("kid", "6-9", "tricky", 5).size, 5);
  assert.deepEqual(makeNonogram("same", "16+", "tricky", 3), makeNonogram("same", "16+", "tricky", 3));
});

/** All grids with every height once per row and column that show the given numbers at the edge (counted up to 2), by plain trial. */
function skyCount(p: ReturnType<typeof makeSkyscrapers>): number {
  const n = p.size, g = [...p.givens];
  let found = 0;
  const see = (line: number[]) => { let max = 0, k = 0; for (const h of line) if (h > max) { max = h; k++; } return k; };
  const go = (i: number) => {
    if (found > 1) return;
    if (i === n * n) {
      for (let k = 0; k < n; k++) {
        const row = range(n).map((x) => g[k * n + x]), col = range(n).map((y) => g[y * n + k]);
        if ((p.left[k] && see(row) !== p.left[k]) || (p.right[k] && see([...row].reverse()) !== p.right[k]) || (p.top[k] && see(col) !== p.top[k]) || (p.bottom[k] && see([...col].reverse()) !== p.bottom[k])) return;
      }
      found++;
      return;
    }
    if (p.givens[i]) return go(i + 1);
    const y = Math.floor(i / n), x = i % n;
    for (let h = 1; h <= n; h++) {
      if (range(n).some((k) => g[y * n + k] === h || g[k * n + x] === h)) continue;
      g[i] = h;
      // a full row must show its numbers
      if (x === n - 1 || range(n).every((k) => g[y * n + k])) { const row = range(n).map((k) => g[y * n + k]); if ((p.left[y] && see(row) !== p.left[y]) || (p.right[y] && see([...row].reverse()) !== p.right[y])) { g[i] = 0; continue; } }
      go(i + 1);
      g[i] = 0;
    }
  };
  go(0);
  return found;
}
test("skyscrapers: one solution on every step, the numbers at the edge are what one sees", () => {
  for (const step of STEPS) for (const level of LEVELS) for (let s = 0; s < 5; s++) {
    const p = makeSkyscrapers(`sky-${step}-${level}-${s}`, "16+", level, step);
    const n = p.size;
    assert.equal(n, step <= 3 ? 4 : 5);
    for (let k = 0; k < n; k++) {
      const row: number[] = range(n).map((x) => p.solution[k * n + x]), col: number[] = range(n).map((y) => p.solution[y * n + k]);
      assert.deepEqual([...row].sort(), range(n).map((h) => h + 1));
      assert.deepEqual([...col].sort(), range(n).map((h) => h + 1));
      if (p.left[k]) assert.equal(p.left[k], visible(row));
      if (p.right[k]) assert.equal(p.right[k], visible([...row].reverse()));
      if (p.top[k]) assert.equal(p.top[k], visible(col));
      if (p.bottom[k]) assert.equal(p.bottom[k], visible([...col].reverse()));
    }
    assert.ok(p.givens.every((h, i) => !h || h === p.solution[i]));
    assert.equal(skyCount(p), 1, p.id);
    assert.equal(countSkyscrapers(n, p, p.givens), 1);
    const shown = [...p.top, ...p.bottom, ...p.left, ...p.right].filter(Boolean).length, open = p.givens.filter((h) => !h).length;
    if (level === "tricky") assert.ok(open >= n * n - 4, `${p.id}: ${open} open`); // almost nothing is written in
    else assert.ok(open >= 3 && open <= 8);
    if (level === "tricky" && (step === 3 || step === 5)) assert.ok(shown < 4 * n, "the harder steps show fewer numbers");
    const { bad, clues } = skyscraperConflicts(p, p.solution);
    assert.equal(bad.size + clues.size, 0);
  }
  assert.equal(visible([2, 1, 4, 3]), 2);
  assert.equal(visible([1, 2, 3, 4]), 4);
  const p = makeSkyscrapers("c", "16+", "tricky", 1);
  const wrong = [...p.solution];
  [wrong[0], wrong[1]] = [wrong[1], wrong[0]];
  assert.ok(skyscraperConflicts(p, wrong).bad.size > 0);
  assert.equal(makeSkyscrapers("kid", "6-9", "tricky", 5).size, 4);
});

test("generating a puzzle stays quick enough for a phone", () => {
  const time = (make: () => unknown) => { const t = Date.now(); for (let i = 0; i < 5; i++) make(); return (Date.now() - t) / 5; };
  for (const step of STEPS) {
    const ms = [time(() => makeBinary(`t${step}${Math.random()}`, "16+", "tricky", step)), time(() => makeNonogram(`t${step}${Math.random()}`, "16+", "tricky", step)), time(() => makeSkyscrapers(`t${step}${Math.random()}`, "16+", "tricky", step))];
    assert.ok(ms.every((v) => v < 400), `step ${step}: ${ms.map((v) => v.toFixed(0)).join(" / ")} ms`);
    console.log(`step ${step}: binary ${ms[0].toFixed(1)} ms, nonogram ${ms[1].toFixed(1)} ms, skyscrapers ${ms[2].toFixed(1)} ms`);
  }
});
