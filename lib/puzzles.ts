// Grid puzzles – sudoku, mini crossword, number pyramid. Nothing here is stored as content: every puzzle is generated
// from a seed (the same seed gives the same puzzle on every device), so there are always new ones and none needs a
// source. The crossword is the exception: its words and clues are questions this learner has already answered (with
// the backend the solution of a card only reaches the device after answering) – a repetition in disguise, and every
// clue is already source-checked.
//  - in the feed: a nearly finished puzzle – only a few steps are left;
//  - "Rätsel des Tages": three trickier ones before the feed starts (one of each kind, the same for everyone that day).
import type { AgeBand, Item, UserState } from "./types";
import { rng, today } from "./gamification";

export { rng };

export type Level = "few" | "tricky"; // few = a few steps left (feed), tricky = the daily puzzles

export interface Sudoku { kind: "sudoku"; id: string; size: 4 | 6 | 9; boxRows: number; boxCols: number; givens: number[]; solution: number[] }
export interface CrossWord { answer: string; clue: string; row: number; col: number; across: boolean; itemId: string }
export interface Crossword { kind: "crossword"; id: string; rows: number; cols: number; words: CrossWord[]; solution: (string | null)[]; givens: boolean[] }
export interface Pyramid { kind: "pyramid"; id: string; rows: number[][]; shown: boolean[][] }
export type Puzzle = Sudoku | Crossword | Pyramid;

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
/** A sudoku with exactly one solution; `few` leaves a handful of empty cells, `tricky` many more. */
export function makeSudoku(seed: string, size: 4 | 6 | 9, level: Level): Sudoku {
  const r = rng(seed);
  const [br, bc] = SIZES[size];
  const solution = Array<number>(size * size).fill(0);
  fill(solution, size, br, bc, r);
  const holes = { 4: { few: 4, tricky: 9 }, 6: { few: 5, tricky: 18 }, 9: { few: 6, tricky: 38 } }[size][level];
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
export function makeCrossword(seed: string, items: Item[], state: Pick<UserState, "answers">, level: Level): Crossword | null {
  const r = rng(seed);
  const pool = shuffle(clueWords(items, state), r);
  if (pool.length < 4) return null;
  const want = level === "tricky" ? 6 : 5;
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
  // few: two words are left to fill in, everything else is written in · tricky: everything open but each first letter
  const open = level === "few" ? new Set(shuffle(words, r).slice(0, 2).flatMap(cellsOf)) : new Set(words.flatMap((w) => cellsOf(w).slice(1)));
  const givens = solution.map((ch, i) => ch !== null && !open.has(i));
  return { kind: "crossword", id: `pz-crossword-${seed}`, rows, cols, words, solution, givens };
}
export const wordCells = (p: Crossword, w: CrossWord) => [...w.answer].map((_, k) => (w.row + (w.across ? 0 : k)) * p.cols + w.col + (w.across ? k : 0));

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
export function makePyramid(seed: string, age: AgeBand | null, level: Level): Pyramid {
  const r = rng(seed);
  const height = age === "6-9" ? 3 : level === "tricky" ? 5 : 4;
  const top = age === "6-9" ? 5 : age === "10-12" ? 12 : 20;
  const base = Array.from({ length: height }, () => 1 + Math.floor(r() * top));
  const rows: number[][] = [base];
  while (rows[0].length > 1) rows.unshift(rows[0].slice(1).map((v, i) => v + rows[0][i]));
  const shown = rows.map((row) => row.map(() => true));
  const want = level === "few" ? Math.min(3, height) : Math.round((height * (height + 1)) / 2) - height;
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
  const cw = makeCrossword(`${seed}-c-${state.settings.locale}`, items, state, "tricky");
  return [makeSudoku(`${seed}-s`, sudokuSize(age), "tricky"), cw ?? makePyramid(`${seed}-p2`, age, "few"), makePyramid(`${seed}-p`, age, "tricky")];
}
export const dailyOpen = (s: UserState, puzzles: Puzzle[], date = today()) => {
  const st = puzzleState(s);
  const done = st.daily.date === date ? st.daily.done : [];
  return puzzles.filter((p) => !done.includes(p.id));
};

/** Puzzles for the feed: new ones each day, nearly finished, the kinds taking turns. */
export function feedPuzzles(items: Item[], state: UserState, count = 6, date = today()): Puzzle[] {
  const age = state.ageBand;
  const out: Puzzle[] = [];
  for (let k = 0; k < count; k++) {
    const seed = `feed-${date}-${k}-${age ?? ""}`;
    const kind = k % 3;
    const p = kind === 0 ? makeSudoku(seed, sudokuSize(age), "few") : kind === 1 ? makeCrossword(`${seed}-${state.settings.locale}`, items, state, "few") : makePyramid(seed, age, "few");
    if (p) out.push(p);
  }
  return out;
}
