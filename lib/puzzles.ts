// Grid puzzles – sudoku, mini crossword, number pyramid. Nothing here is stored as content: every puzzle is generated
// from a seed (the same seed gives the same puzzle on every device), so there are always new ones and none needs a
// source. The crossword is the exception: its words and clues are questions this learner has already answered (with
// the backend the solution of a card only reaches the device after answering) – a repetition in disguise, and every
// clue is already source-checked.
//  - in the feed: a nearly finished puzzle – only a few steps are left;
//  - "Rätsel des Tages": three trickier ones before the feed starts (one of each kind, the same for everyone that day).
import type { AgeBand, Item, UserState } from "./types";
import { rng, today } from "./gamification";
import { START, stepOf, type Step } from "./skill";

export { rng };

export type Level = "few" | "tricky"; // few = a few steps left (feed), tricky = the daily puzzles
// Within each, the learner's step (1–5, lib/skill.ts) sets size and gaps; step 3 is what every adult got before.

export interface Sudoku { kind: "sudoku"; id: string; size: 4 | 6 | 9; boxRows: number; boxCols: number; givens: number[]; solution: number[] }
export interface CrossWord { answer: string; clue: string; row: number; col: number; across: boolean; itemId: string }
export interface Crossword { kind: "crossword"; id: string; rows: number; cols: number; words: CrossWord[]; solution: (string | null)[]; givens: boolean[] }
export interface Pyramid { kind: "pyramid"; id: string; rows: number[][]; shown: boolean[][] }
/** Futoshiki: a Latin square (each number once per row and column) with < and > between some neighbours. right[i]:
 *  sign between cell i and the cell to its right; down[i]: between cell i and the cell below ("<" = this one is smaller). */
export interface Futoshiki { kind: "futoshiki"; id: string; size: number; givens: number[]; solution: number[]; right: string[]; down: string[] }
export type Puzzle = Sudoku | Crossword | Pyramid | Futoshiki;

const shuffle = <T,>(list: T[], r: () => number) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- sudoku ----------
const SIZES = { 4: [2, 2], 6: [2, 3], 9: [3, 3] } as const;
export const sudokuSize = (age: AgeBand | null): 4 | 6 | 9 => (age === "6-9" ? 4 : age === "10-12" ? 6 : 9);

function candidates(g: number[], n: number, br: number, bc: number, i: number) {
  const r = Math.floor(i / n), c = i % n, used = new Set<number>();
  for (let k = 0; k < n; k++) used.add(g[r * n + k]).add(g[k * n + c]);
  const r0 = r - (r % br), c0 = c - (c % bc);
  for (let y = r0; y < r0 + br; y++) for (let x = c0; x < c0 + bc; x++) used.add(g[y * n + x]);
  return Array.from({ length: n }, (_, k) => k + 1).filter((v) => !used.has(v));
}
/** Number of solutions, counted up to `limit`. */
export function countSolutions(g: number[], n: number, br: number, bc: number, limit = 2): number {
  let best = -1, bestC: number[] = [];
  for (let i = 0; i < g.length; i++) {
    if (g[i]) continue;
    const c = candidates(g, n, br, bc, i);
    if (!c.length) return 0;
    if (best < 0 || c.length < bestC.length) [best, bestC] = [i, c];
  }
  if (best < 0) return 1;
  let total = 0;
  for (const v of bestC) {
    g[best] = v;
    total += countSolutions(g, n, br, bc, limit - total);
    g[best] = 0;
    if (total >= limit) break;
  }
  return total;
}
function fill(g: number[], n: number, br: number, bc: number, r: () => number): boolean {
  const i = g.indexOf(0);
  if (i < 0) return true;
  for (const v of shuffle(candidates(g, n, br, bc, i), r)) {
    g[i] = v;
    if (fill(g, n, br, bc, r)) return true;
  }
  g[i] = 0;
  return false;
}
/** Empty cells by step: [few, tricky] for each size. */
const HOLES: Record<4 | 6 | 9, [number[], number[]]> = {
  4: [[3, 4, 4, 5, 6], [7, 8, 9, 9, 10]],
  6: [[4, 5, 5, 8, 12], [14, 16, 18, 20, 22]],
  9: [[4, 5, 6, 12, 20], [28, 33, 38, 44, 50]],
};
/** The sudoku size for an age band and step: children keep the small ones, adults start on 9 × 9 from step 2. */
export const sudokuSizeAt = (age: AgeBand | null, step: Step): 4 | 6 | 9 => Math.min(sudokuSize(age), step <= 1 ? 6 : 9) as 4 | 6 | 9;
/** A sudoku with exactly one solution; `few` leaves a handful of empty cells, `tricky` many more – more with each step. */
export function makeSudoku(seed: string, size: 4 | 6 | 9, level: Level, step: Step = START as Step): Sudoku {
  const r = rng(seed);
  const [br, bc] = SIZES[size];
  const solution = Array<number>(size * size).fill(0);
  fill(solution, size, br, bc, r);
  const holes = HOLES[size][level === "few" ? 0 : 1][step - 1];
  const givens = [...solution];
  let open = 0;
  for (const i of shuffle(Array.from({ length: size * size }, (_, k) => k), r)) {
    if (open >= holes) break;
    const keep = givens[i];
    givens[i] = 0;
    if (countSolutions([...givens], size, br, bc) === 1) open++;
    else givens[i] = keep;
  }
  return { kind: "sudoku", id: `pz-sudoku-${seed}`, size, boxRows: br, boxCols: bc, givens, solution };
}
/** Cells that break a rule (same number twice in a row, column or box) – shown in red while typing. */
export function sudokuConflicts(p: Sudoku, cells: number[]) {
  const bad = new Set<number>();
  const n = p.size;
  cells.forEach((v, i) => {
    if (!v) return;
    cells.forEach((w, j) => {
      if (i === j || v !== w) return;
      const [ri, ci, rj, cj] = [Math.floor(i / n), i % n, Math.floor(j / n), j % n];
      const box = Math.floor(ri / p.boxRows) === Math.floor(rj / p.boxRows) && Math.floor(ci / p.boxCols) === Math.floor(cj / p.boxCols);
      if (ri === rj || ci === cj || box) bad.add(i);
    });
  });
  return bad;
}

// ---------- crossword ----------
/** One word in capitals, 3–8 letters, no ß (it has no single capital); "–" etc. rule a word out. */
const wordOf = (s: string) => (/^[A-Za-zÄÖÜäöü]{3,8}$/.test(s.trim()) ? s.trim().toUpperCase() : null);
/** Questions that only make sense next to their options ("Welches dieser …") are no clue. */
const NEEDS_OPTIONS = /\b(dies(e|er|es|en)|folgend|which of these|of the following|these)\b/i;
export function clueWords(items: Item[], state: Pick<UserState, "answers">) {
  const seen = new Set<string>();
  return items.flatMap((i) => {
    const correct = state.answers[i.id]?.correctIndex;
    if (i.kind !== "question" || i.hints?.length || correct === undefined || NEEDS_OPTIONS.test(i.question) || i.question.length > 110) return [];
    const answer = wordOf(i.options[correct] ?? "");
    if (!answer || seen.has(answer)) return [];
    seen.add(answer);
    return [{ answer, clue: i.question, itemId: i.id }];
  });
}

type Placed = CrossWord;
const MAX = 10;
function fits(grid: Map<string, string>, w: string, row: number, col: number, across: boolean) {
  let crossings = 0;
  const at = (r: number, c: number) => grid.get(`${r},${c}`);
  const [dr, dc] = across ? [0, 1] : [1, 0];
  if (at(row - dr, col - dc) || at(row + dr * w.length, col + dc * w.length)) return -1; // no letter right before or after
  for (let k = 0; k < w.length; k++) {
    const r = row + dr * k, c = col + dc * k, here = at(r, c);
    if (here) {
      if (here !== w[k]) return -1;
      crossings++;
    } else if (at(r + dc, c + dr) || at(r - dc, c - dr)) return -1; // no new letter touching a neighbour side by side
  }
  return crossings;
}
/** Lays the words out as a small crossword; every word after the first crosses one already placed. */
export function layoutCrossword(words: { answer: string; clue: string; itemId: string }[], want: number, r: () => number): Placed[] {
  const placed: Placed[] = [];
  const grid = new Map<string, string>();
  const put = (p: Placed) => {
    placed.push(p);
    [...p.answer].forEach((ch, k) => grid.set(`${p.row + (p.across ? 0 : k)},${p.col + (p.across ? k : 0)}`, ch));
  };
  const bounds = () => {
    const keys = [...grid.keys()].map((k) => k.split(",").map(Number));
    const rs = keys.map(([a]) => a), cs = keys.map(([, b]) => b);
    return [Math.min(...rs), Math.max(...rs), Math.min(...cs), Math.max(...cs)];
  };
  for (const w of words) {
    if (placed.length >= want) break;
    if (!placed.length) {
      put({ ...w, row: 0, col: 0, across: true });
      continue;
    }
    const options: Placed[] = [];
    for (const p of placed)
      [...p.answer].forEach((ch, k) =>
        [...w.answer].forEach((wc, j) => {
          if (ch !== wc) return;
          const across = !p.across;
          const row = p.across ? p.row - j : p.row + k, col = p.across ? p.col + k : p.col - j;
          if (fits(grid, w.answer, row, col, across) < 1) return;
          const [r0, r1, c0, c1] = bounds();
          const [er, ec] = across ? [row, col + w.answer.length - 1] : [row + w.answer.length - 1, col];
          if (Math.max(r1, er) - Math.min(r0, row) >= MAX || Math.max(c1, ec) - Math.min(c0, col) >= MAX) return;
          options.push({ ...w, row, col, across });
        }),
      );
    if (options.length) put(options[Math.floor(r() * options.length)]);
  }
  const [r0, , c0] = bounds();
  return placed.map((p) => ({ ...p, row: p.row - r0, col: p.col - c0 }));
}
export function makeCrossword(seed: string, items: Item[], state: Pick<UserState, "answers">, level: Level, step: Step = START as Step): Crossword | null {
  const r = rng(seed);
  const pool = shuffle(clueWords(items, state), r);
  if (pool.length < 4) return null;
  const want = level === "tricky" ? (step <= 2 ? 5 : step <= 4 ? 6 : 7) : 5;
  let words: Placed[] = [];
  // a few tries with different word orders – the one with the most words wins
  for (let t = 0; t < 6 && words.length < want; t++) {
    const tryWords = layoutCrossword(shuffle(pool, r).slice(0, 40), want, r);
    if (tryWords.length > words.length) words = tryWords;
  }
  if (words.length < 3) return null;
  const rows = Math.max(...words.map((w) => w.row + (w.across ? 1 : w.answer.length)));
  const cols = Math.max(...words.map((w) => w.col + (w.across ? w.answer.length : 1)));
  const solution: (string | null)[] = Array(rows * cols).fill(null);
  const cellsOf = (w: Placed) => [...w.answer].map((_, k) => (w.row + (w.across ? 0 : k)) * cols + w.col + (w.across ? k : 0));
  words.forEach((w) => cellsOf(w).forEach((i, k) => (solution[i] = w.answer[k])));
  // few: two words are left to fill in (three from step 4, all from step 5), everything else is written in ·
  // tricky: everything open but each first letter
  const left = step <= 3 ? 2 : step === 4 ? 3 : words.length;
  const open = level === "few" ? new Set(shuffle(words, r).slice(0, left).flatMap(cellsOf)) : new Set(words.flatMap((w) => cellsOf(w).slice(1)));
  const givens = solution.map((ch, i) => ch !== null && !open.has(i));
  return { kind: "crossword", id: `pz-crossword-${seed}`, rows, cols, words, solution, givens };
}
export const wordCells = (p: Crossword, w: CrossWord) => [...w.answer].map((_, k) => (w.row + (w.across ? 0 : k)) * p.cols + w.col + (w.across ? k : 0));

// ---------- futoshiki ----------
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
/** How many solutions (stopping at `limit`): each number once per row and column, every sign kept, the givens kept. */
export function countFutoshiki(p: Pick<Futoshiki, "size" | "right" | "down">, g: number[], limit = 2): number {
  const n = p.size, i = g.indexOf(0);
  if (i < 0) return 1;
  const r = Math.floor(i / n), c = i % n;
  // a sign between two cells holds, or one of them is still empty
  const ok = (sign: string, other: number, smaller: boolean) => !sign || !other || (sign === "<") === smaller;
  let found = 0;
  for (let v = 1; v <= n && found < limit; v++) {
    if (range(n).some((k) => g[r * n + k] === v || g[k * n + c] === v)) continue;
    if (c > 0 && !ok(p.right[i - 1], g[i - 1], g[i - 1] < v)) continue;
    if (c < n - 1 && !ok(p.right[i], g[i + 1], v < g[i + 1])) continue;
    if (r > 0 && !ok(p.down[i - n], g[i - n], g[i - n] < v)) continue;
    if (r < n - 1 && !ok(p.down[i], g[i + n], v < g[i + n])) continue;
    g[i] = v;
    found += countFutoshiki(p, g, limit - found);
    g[i] = 0;
  }
  return found;
}
/** Size and empty cells by step – the feed's "few" leaves fewer open. */
const FUTOSHIKI: { size: number; few: number; tricky: number }[] = [{ size: 4, few: 4, tricky: 9 }, { size: 4, few: 6, tricky: 12 }, { size: 5, few: 7, tricky: 17 }, { size: 5, few: 10, tricky: 21 }, { size: 6, few: 14, tricky: 30 }];
/** A futoshiki with exactly one solution: signs between about a third of the neighbours, then as many cells emptied as the step asks and uniqueness allows. */
export function makeFutoshiki(seed: string, level: Level, step: Step = START as Step): Futoshiki {
  const r = rng(seed);
  const { size: n, ...holes } = FUTOSHIKI[step - 1];
  // a Latin square: (row + column) mod n, with rows, columns and numbers shuffled
  const rows = shuffle(range(n), r), cols = shuffle(range(n), r), nums = shuffle(range(n), r);
  const solution = range(n * n).map((i) => nums[(rows[Math.floor(i / n)] + cols[i % n]) % n] + 1);
  const sign = (a: number, b: number) => (a < b ? "<" : ">");
  const right = range(n * n).map((i) => (i % n < n - 1 && r() < 0.35 ? sign(solution[i], solution[i + 1]) : ""));
  const down = range(n * n).map((i) => (i < n * (n - 1) && r() < 0.35 ? sign(solution[i], solution[i + n]) : ""));
  const givens = [...solution];
  let open = 0;
  for (const i of shuffle(range(n * n), r)) {
    if (open >= holes[level]) break;
    const keep = givens[i];
    givens[i] = 0;
    if (countFutoshiki({ size: n, right, down }, [...givens]) === 1) open++;
    else givens[i] = keep;
  }
  return { kind: "futoshiki", id: `pz-futoshiki-${seed}`, size: n, givens, solution, right, down };
}
/** Cells that break a rule while typing: a number twice in a row or column, or a sign that does not hold. */
export function futoshikiConflicts(p: Futoshiki, cells: number[]) {
  const n = p.size, bad = new Set<number>();
  for (let i = 0; i < n * n; i++) {
    const v = cells[i];
    if (!v) continue;
    const r = Math.floor(i / n), c = i % n;
    for (let k = 0; k < n; k++) {
      if (k !== c && cells[r * n + k] === v) bad.add(i);
      if (k !== r && cells[k * n + c] === v) bad.add(i);
    }
    const breaks = (j: number, s: string) => !!s && !!cells[j] && (s === "<") !== v < cells[j];
    if (c < n - 1 && breaks(i + 1, p.right[i])) bad.add(i).add(i + 1);
    if (r < n - 1 && breaks(i + n, p.down[i])) bad.add(i).add(i + n);
  }
  return bad;
}

// ---------- number pyramid ----------
/** Every stone is the sum of the two below it. A hidden stone can be worked out from two neighbours in its triangle. */
function solvable(rows: number[][], shown: boolean[][]) {
  const known = shown.map((r) => [...r]);
  for (let changed = true; changed; ) {
    changed = false;
    for (let y = 0; y < rows.length - 1; y++)
      for (let x = 0; x < rows[y].length; x++) {
        const tri = [known[y][x], known[y + 1][x], known[y + 1][x + 1]];
        if (tri.filter(Boolean).length === 2) {
          known[y][x] = known[y + 1][x] = known[y + 1][x + 1] = true;
          changed = true;
        }
      }
  }
  return known.every((r) => r.every(Boolean));
}
export function makePyramid(seed: string, age: AgeBand | null, level: Level, step: Step = START as Step): Pyramid {
  const r = rng(seed);
  const height = age === "6-9" ? 3 : level === "tricky" ? [4, 5, 5, 6, 6][step - 1] : step >= 4 ? 5 : 4;
  const top = age === "6-9" ? 5 : age === "10-12" ? 12 : [10, 15, 20, 30, 50][step - 1];
  const base = Array.from({ length: height }, () => 1 + Math.floor(r() * top));
  const rows: number[][] = [base];
  while (rows[0].length > 1) rows.unshift(rows[0].slice(1).map((v, i) => v + rows[0][i]));
  const shown = rows.map((row) => row.map(() => true));
  const want = level === "few" ? Math.min([2, 3, 3, 5, 7][step - 1], height) : Math.round((height * (height + 1)) / 2) - height;
  let hidden = 0;
  for (const [y, x] of shuffle(rows.flatMap((row, y) => row.map((_, x) => [y, x] as const)), r)) {
    if (hidden >= want) break;
    shown[y][x] = false;
    if (solvable(rows, shown)) hidden++;
    else shown[y][x] = true;
  }
  return { kind: "pyramid", id: `pz-pyramid-${seed}`, rows, shown };
}

// ---------- which puzzles, when ----------
export interface PuzzleState { daily: { date: string; done: string[] }; done: string[] }
export const puzzleState = (s: UserState): PuzzleState => s.puzzles ?? { daily: { date: "", done: [] }, done: [] };

/** The three puzzles of the day: a sudoku, a crossword from answered questions (a second pyramid while there are too few) and a pyramid. */
export function dailyPuzzles(items: Item[], state: UserState, date = today()): Puzzle[] {
  const age = state.ageBand;
  const seed = `daily-${date}-${age ?? ""}`;
  const at = (kind: string) => stepOf(state, kind);
  const cw = makeCrossword(`${seed}-c-${state.settings.locale}`, items, state, "tricky", at("crossword"));
  return [makeSudoku(`${seed}-s`, sudokuSizeAt(age, at("sudoku")), "tricky", at("sudoku")), cw ?? makePyramid(`${seed}-p2`, age, "few", at("pyramid")), makePyramid(`${seed}-p`, age, "tricky", at("pyramid"))];
}
export const dailyOpen = (s: UserState, puzzles: Puzzle[], date = today()) => {
  const st = puzzleState(s);
  const done = st.daily.date === date ? st.daily.done : [];
  return puzzles.filter((p) => !done.includes(p.id));
};

/** Puzzles for the feed: new ones each day, nearly finished, the kinds taking turns (sudoku, crossword, pyramid, futoshiki). */
export function feedPuzzles(items: Item[], state: UserState, count = 6, date = today()): Puzzle[] {
  const age = state.ageBand;
  const out: Puzzle[] = [];
  for (let k = 0; k < count; k++) {
    const seed = `feed-${date}-${k}-${age ?? ""}`;
    const kind = k % 4;
    const at = (k: string) => stepOf(state, k);
    const p = kind === 0 ? makeSudoku(seed, sudokuSizeAt(age, at("sudoku")), "few", at("sudoku")) : kind === 1 ? makeCrossword(`${seed}-${state.settings.locale}`, items, state, "few", at("crossword")) : kind === 2 ? makePyramid(seed, age, "few", at("pyramid")) : makeFutoshiki(seed, "few", at("futoshiki"));
    if (p) out.push(p);
  }
  return out;
}
