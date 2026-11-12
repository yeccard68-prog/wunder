// Three more grid puzzles, generated from a seed like the ones in lib/puzzles.ts and only handed out with exactly one
// solution:
//  - binary: a grid of 0s and 1s – as many of each in every row and column, never three alike in a row;
//  - nonogram: a hidden picture of filled squares – the numbers say how long the runs in each row and column are; only
//    pictures that can be found by logic alone (line by line, no guessing) are used;
//  - skyscrapers: every height once per row and column – the numbers round the edge say how many towers one sees from there.
// `few` leaves a handful of squares open (the feed), `tricky` is the full puzzle (puzzles of the day); the learner's step
// (1–5, lib/skill.ts) sets the size.
import type { AgeBand } from "./types";
import { rng } from "./gamification";
import { START, type Step } from "./skill";

type Level = "few" | "tricky";
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const shuffle = <T,>(list: T[], r: () => number) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// ---------------------------------------------------------------- binary puzzle
export interface Binary { kind: "binary"; id: string; size: number; givens: number[]; solution: number[] } // givens: -1 = empty
/** May `v` go into square `i`? Not a third alike in a row, and no more than half of a row or column. */
function binaryFits(n: number, g: number[], i: number, v: number) {
  const r = Math.floor(i / n), c = i % n;
  const at = (y: number, x: number) => (y < 0 || x < 0 || y >= n || x >= n ? -2 : g[y * n + x]);
  for (const [dy, dx] of [[0, 1], [1, 0]]) {
    const [a2, a1, b1, b2] = [at(r - 2 * dy, c - 2 * dx), at(r - dy, c - dx), at(r + dy, c + dx), at(r + 2 * dy, c + 2 * dx)];
    if ((a2 === v && a1 === v) || (a1 === v && b1 === v) || (b1 === v && b2 === v)) return false;
  }
  let inRow = 0, inCol = 0;
  for (let k = 0; k < n; k++) { if (g[r * n + k] === v) inRow++; if (g[k * n + c] === v) inCol++; }
  return inRow < n / 2 && inCol < n / 2;
}
/** Number of solutions, counted up to `limit`. */
export function countBinary(n: number, g: number[], limit = 2): number {
  // the square with the fewest possibilities first – a square where nothing fits ends the branch at once
  let best = -1, options: number[] = [];
  for (let i = 0; i < g.length; i++) {
    if (g[i] >= 0) continue;
    const fit = [0, 1].filter((v) => binaryFits(n, g, i, v));
    if (!fit.length) return 0;
    if (best < 0 || fit.length < options.length) [best, options] = [i, fit];
    if (fit.length === 1) break;
  }
  if (best < 0) return 1;
  let found = 0;
  for (const v of options) {
    g[best] = v;
    found += countBinary(n, g, limit - found);
    g[best] = -1;
    if (found >= limit) break;
  }
  return found;
}
function fillBinary(n: number, g: number[], r: () => number): boolean {
  const i = g.indexOf(-1);
  if (i < 0) return true;
  for (const v of r() < 0.5 ? [0, 1] : [1, 0]) {
    if (!binaryFits(n, g, i, v)) continue;
    g[i] = v;
    if (fillBinary(n, g, r)) return true;
    g[i] = -1;
  }
  return false;
}
const BINARY: { size: number; few: number; tricky: number }[] = [{ size: 4, few: 4, tricky: 9 }, { size: 6, few: 5, tricky: 18 }, { size: 6, few: 7, tricky: 22 }, { size: 8, few: 10, tricky: 34 }, { size: 8, few: 14, tricky: 40 }];
export function makeBinary(seed: string, age: AgeBand | null, level: Level, step: Step = START as Step): Binary {
  const r = rng(seed);
  const cap = age === "6-9" ? 4 : age === "10-12" ? 6 : 8;
  const { size: n, ...holes } = BINARY.filter((b) => b.size <= cap)[Math.min(step, BINARY.filter((b) => b.size <= cap).length) - 1];
  const solution = Array<number>(n * n).fill(-1);
  fillBinary(n, solution, r);
  const givens = [...solution];
  let open = 0;
  for (const i of shuffle(range(n * n), r)) {
    if (open >= holes[level]) break;
    const keep = givens[i];
    givens[i] = -1;
    if (countBinary(n, [...givens]) === 1) open++;
    else givens[i] = keep;
  }
  return { kind: "binary", id: `pz-binary-${seed}`, size: n, givens, solution };
}
/** Squares that break a rule while typing: three alike in a row, or more than half of a row or column. */
export function binaryConflicts(p: Pick<Binary, "size">, cells: number[]) {
  const n = p.size, bad = new Set<number>();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const v = cells[y * n + x];
    if (v < 0) continue;
    if (x + 2 < n && cells[y * n + x + 1] === v && cells[y * n + x + 2] === v) [0, 1, 2].forEach((k) => bad.add(y * n + x + k));
    if (y + 2 < n && cells[(y + 1) * n + x] === v && cells[(y + 2) * n + x] === v) [0, 1, 2].forEach((k) => bad.add((y + k) * n + x));
  }
  for (let k = 0; k < n; k++) for (const v of [0, 1]) {
    const row = range(n).map((x) => k * n + x).filter((i) => cells[i] === v), col = range(n).map((y) => y * n + k).filter((i) => cells[i] === v);
    if (row.length > n / 2) row.forEach((i) => bad.add(i));
    if (col.length > n / 2) col.forEach((i) => bad.add(i));
  }
  return bad;
}

// ---------------------------------------------------------------- nonogram
export interface Nonogram { kind: "nonogram"; id: string; size: number; solution: number[]; givens: boolean[]; rows: number[][]; cols: number[][] }
/** The lengths of the runs of filled squares in a line – what the numbers at the edge say. */
export const runs = (line: number[]) => line.join("").split("0").filter(Boolean).map((s) => s.length);
/** Every way to lay the runs into a line of length n that agrees with what is known (-1 = unknown). */
function placements(clue: number[], known: number[]): number[][] {
  const n = known.length, out: number[][] = [];
  const go = (k: number, from: number, line: number[]) => {
    if (k === clue.length) {
      for (let x = from; x < n; x++) if (known[x] === 1) return;
      const full = line.slice(0, n); // the last run may end at the edge – its closing gap is then cut off
      while (full.length < n) full.push(0);
      out.push(full);
      return;
    }
    const rest = clue.slice(k + 1).reduce((a, b) => a + b + 1, 0);
    for (let s = from; s + clue[k] + rest <= n; s++) {
      if (known.slice(from, s).includes(1)) break; // a filled square would be left behind
      if (known.slice(s, s + clue[k]).includes(0) || known[s + clue[k]] === 1) continue;
      go(k + 1, s + clue[k] + 1, [...line, ...Array<number>(s - line.length).fill(0), ...Array<number>(clue[k]).fill(1), 0]);
    }
  };
  go(0, 0, []);
  return out;
}
/** Solves by logic alone – row by row and column by column, writing in what every placement agrees on. Returns the grid (-1 = still open). */
export function solveNonogram(n: number, rows: number[][], cols: number[][], start?: number[]): number[] {
  const g = start ? [...start] : Array<number>(n * n).fill(-1);
  for (let changed = true; changed; ) {
    changed = false;
    for (let k = 0; k < 2 * n; k++) {
      const cells = k < n ? range(n).map((x) => k * n + x) : range(n).map((y) => y * n + (k - n));
      const fits = placements(k < n ? rows[k] : cols[k - n], cells.map((i) => g[i]));
      cells.forEach((i, x) => {
        if (g[i] >= 0 || !fits.length) return;
        const v = fits[0][x];
        if (fits.every((f) => f[x] === v)) { g[i] = v; changed = true; }
      });
    }
  }
  return g;
}
const NONOGRAM: { size: number; fill: number; few: number }[] = [{ size: 5, fill: 0.68, few: 1 }, { size: 5, fill: 0.56, few: 1 }, { size: 6, fill: 0.58, few: 2 }, { size: 8, fill: 0.6, few: 2 }, { size: 10, fill: 0.6, few: 3 }];
export function makeNonogram(seed: string, age: AgeBand | null, level: Level, step: Step = START as Step): Nonogram {
  const r = rng(seed);
  const cap = age === "6-9" ? 5 : age === "10-12" ? 6 : 10;
  const { size: n, fill, few } = NONOGRAM.filter((x) => x.size <= cap)[Math.min(step, NONOGRAM.filter((x) => x.size <= cap).length) - 1];
  for (;;) {
    // a random picture, now and then mirrored left to right; no empty row or column
    const mirror = r() < 0.4;
    const solution = range(n * n).map(() => (r() < fill ? 1 : 0));
    if (mirror) for (let y = 0; y < n; y++) for (let x = 0; x < n / 2; x++) solution[y * n + n - 1 - x] = solution[y * n + x];
    const rows = range(n).map((y) => runs(range(n).map((x) => solution[y * n + x]))), cols = range(n).map((x) => runs(range(n).map((y) => solution[y * n + x])));
    if ([...rows, ...cols].some((c) => !c.length)) continue;
    if (solveNonogram(n, rows, cols).includes(-1)) continue; // needs guessing, or has more than one solution
    // few: everything is filled in but a few rows and columns
    const lines = shuffle(range(n), r).slice(0, few), columns = shuffle(range(n), r).slice(0, few);
    const givens = range(n * n).map((i) => level === "few" && !lines.includes(Math.floor(i / n)) && !columns.includes(i % n));
    return { kind: "nonogram", id: `pz-nonogram-${seed}`, size: n, solution, givens, rows, cols };
  }
}

// ---------------------------------------------------------------- skyscrapers
/** Clues round the edge, each read along its row or column towards the middle; 0 = no clue shown. */
export interface Skyscrapers { kind: "skyscrapers"; id: string; size: number; givens: number[]; solution: number[]; top: number[]; bottom: number[]; left: number[]; right: number[] }
/** How many towers one sees along a line: each one taller than all before it. */
export const visible = (line: number[]) => line.reduce((s, h) => (h > s.max ? { max: h, count: s.count + 1 } : s), { max: 0, count: 0 }).count;
const permsOf = (n: number): number[][] => (n === 0 ? [[]] : permsOf(n - 1).flatMap((p) => range(n).map((k) => [...p.slice(0, k), n, ...p.slice(k)])));
type Edges = Pick<Skyscrapers, "top" | "bottom" | "left" | "right">;
/** Number of solutions, counted up to `limit`: row by row, each row one of the orders that fit its clues and givens. */
export function countSkyscrapers(n: number, e: Edges, givens: number[], limit = 2): number {
  const all = permsOf(n);
  const fitting = range(n).map((y) => all.filter((p) => (!e.left[y] || visible(p) === e.left[y]) && (!e.right[y] || visible([...p].reverse()) === e.right[y]) && p.every((h, x) => !givens[y * n + x] || givens[y * n + x] === h)));
  const grid: number[][] = [];
  const go = (y: number): number => {
    if (y === n) return range(n).every((x) => { const col = grid.map((row) => row[x]); return (!e.top[x] || visible(col) === e.top[x]) && (!e.bottom[x] || visible([...col].reverse()) === e.bottom[x]); }) ? 1 : 0;
    let found = 0;
    for (const p of fitting[y]) {
      if (grid.some((row) => row.some((h, x) => h === p[x]))) continue; // a height twice in a column
      grid.push(p);
      found += go(y + 1);
      grid.pop();
      if (found >= limit) break;
    }
    return found;
  };
  return go(0);
}
// size · clues kept round the edge (of 4 × size) · squares left open in the feed
const SKY: { size: number; clues: number; few: number }[] = [{ size: 4, clues: 16, few: 3 }, { size: 4, clues: 13, few: 4 }, { size: 4, clues: 10, few: 5 }, { size: 5, clues: 20, few: 6 }, { size: 5, clues: 15, few: 8 }];
export function makeSkyscrapers(seed: string, age: AgeBand | null, level: Level, step: Step = START as Step): Skyscrapers {
  const r = rng(seed);
  const { size: n, clues, few } = SKY[age === "6-9" ? 0 : age === "10-12" ? Math.min(step, 3) - 1 : step - 1];
  const all = permsOf(n);
  for (;;) {
    // a random Latin square: row by row, each a random order that repeats no height in a column
    let rows: number[][] = [];
    while (rows.length < n) {
      const next = shuffle(all, r).find((p) => rows.every((row) => row.every((h, x) => h !== p[x])));
      if (next) rows.push(next); else rows = [];
    }
    const solution = rows.flat();
    const col = (x: number) => rows.map((row) => row[x]);
    const e: Edges = { left: rows.map(visible), right: rows.map((row) => visible([...row].reverse())), top: range(n).map((x) => visible(col(x))), bottom: range(n).map((x) => visible(col(x).reverse())) };
    const givens = Array<number>(n * n).fill(0);
    if (level === "few") {
      // nearly finished: all but a few squares are written in
      const open = new Set(shuffle(range(n * n), r).slice(0, few));
      solution.forEach((h, i) => { if (!open.has(i)) givens[i] = h; });
    } else {
      // if the numbers alone leave more than one solution, write in a square or two – or start again with another grid
      const order = shuffle(range(n * n), r);
      let written = 0;
      while (countSkyscrapers(n, e, givens) !== 1 && written < 2) givens[order[written]] = solution[order[written++]];
      if (countSkyscrapers(n, e, givens) !== 1) continue;
      // then take away numbers at the edge as long as one solution is left
      let kept = 4 * n;
      for (const [side, k] of shuffle((["top", "bottom", "left", "right"] as const).flatMap((s) => range(n).map((i) => [s, i] as const)), r)) {
        if (kept <= clues) break;
        const was = e[side][k];
        e[side][k] = 0;
        if (countSkyscrapers(n, e, givens) === 1) kept--;
        else e[side][k] = was;
      }
    }
    return { kind: "skyscrapers", id: `pz-skyscrapers-${seed}`, size: n, givens, solution, ...e };
  }
}
/** While typing: squares with a height twice in their row or column, and the clues of full lines that do not hold ("top-2" …). */
export function skyscraperConflicts(p: Skyscrapers, cells: number[]) {
  const n = p.size, bad = new Set<number>(), clues = new Set<string>();
  for (let i = 0; i < n * n; i++) {
    if (!cells[i]) continue;
    for (let k = 0; k < n; k++) if ((k !== i % n && cells[Math.floor(i / n) * n + k] === cells[i]) || (k !== Math.floor(i / n) && cells[k * n + (i % n)] === cells[i])) bad.add(i);
  }
  for (let k = 0; k < n; k++) {
    const row = range(n).map((x) => cells[k * n + x]), col = range(n).map((y) => cells[y * n + k]);
    if (row.every(Boolean)) { if (p.left[k] && visible(row) !== p.left[k]) clues.add(`left-${k}`); if (p.right[k] && visible([...row].reverse()) !== p.right[k]) clues.add(`right-${k}`); }
    if (col.every(Boolean)) { if (p.top[k] && visible(col) !== p.top[k]) clues.add(`top-${k}`); if (p.bottom[k] && visible([...col].reverse()) !== p.bottom[k]) clues.add(`bottom-${k}`); }
  }
  return { bad, clues };
}
