// "Rätsel des Tages": three tasks before the feed starts – and a different mix every day, so that it never becomes
// routine. Each day brings
//   1. a logic question (who is lying, crack the code, who has what, if–then …),
//   2. a brain teaser with numbers, shapes or space (complete the pattern, scales, tipping a die, the matchstick game …),
//   3. a grid puzzle (sudoku, binary puzzle, futoshiki, nonogram, number pyramid, skyscrapers, crossword).
// Each of the three is taken from its own pool in rounds: every kind once per round, each round in a new order, and
// a kind comes again after three days at the earliest. With pools of 8, 12 and 7 kinds there are 672 possible trios, so the same mix
// hardly ever comes twice within weeks. The day decides the kinds (the same for everyone), the learner's step for a
// kind decides how hard it is (lib/skill.ts).
import type { Item, UserState } from "./types";
import { rng, today } from "./gamification";
import { stepOf, type Step } from "./skill";
import { levelOf, makeExercise, type Exercise, type ExerciseKind } from "./exercises";
import { makeCrossword, makeFutoshiki, makePyramid, makeSudoku, puzzleState, sudokuSizeAt, type Puzzle } from "./puzzles";
import { makeBinary, makeNonogram, makeSkyscrapers } from "./grids";

export type DailyTask = { id: string; kind: string; puzzle: Puzzle; exercise?: undefined } | { id: string; kind: string; exercise: Exercise; puzzle?: undefined };
type Level = 0 | 1 | 2; // 6–9 years, 10–12, 13 and older (as in lib/exercises.ts)

/** The pools by age: children get the kinds made for them. */
export const DAILY: { logic: Record<Level, ExerciseKind[]>; teaser: Record<Level, ExerciseKind[]>; grid: Record<Level, Puzzle["kind"][]> } = {
  logic: {
    0: ["oddone", "letters", "sequence"],
    1: ["oddone", "letters", "scales", "sequence"],
    2: ["knights", "code", "syllogism", "zebra", "conditional", "order", "family", "sufficiency"],
  },
  teaser: {
    0: ["matrix", "clock", "weekday"],
    1: ["matrix", "directions", "cube", "weekday"],
    2: ["matrix", "scales", "jugs", "cube", "nim", "directions", "letters", "oddone", "crypt", "sequence", "word", "numbers"],
  },
  grid: {
    0: ["sudoku", "pyramid", "binary", "nonogram"],
    1: ["sudoku", "pyramid", "binary", "nonogram", "futoshiki", "skyscrapers"],
    2: ["sudoku", "binary", "futoshiki", "nonogram", "pyramid", "skyscrapers", "crossword"],
  },
};

/** The day as a running number (days since 1 January 1970, by the calendar date). */
export const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
/** How many days at least lie between two turns of the same entry of a pool of n (see `turn`). */
export const minGap = (n: number) => Math.min(Math.floor(n / 3) + 1, n - 2 * Math.floor(n / 3) + 1);
/**
 * Which entry of a pool is on for a day. The pool is gone through in rounds: every entry once per round, each round
 * in a new order (drawn from `salt` and the round). What closed the round before does not open the next one: those
 * entries move back within the first two thirds of the round, so nothing comes again after a day or two.
 */
export function turn<T>(pool: T[], day: number, salt: string): T {
  const n = pool.length, round = Math.floor(day / n), m = Math.floor(n / 3);
  const drawn = (k: number) => {
    const a = [...pool], r = rng(`${salt}-${k}`);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const now = drawn(round);
  // the last third of a round is never moved, so each round depends only on the one before it
  const tail = drawn(round - 1).slice(n - m), head = now.slice(0, n - m);
  const order = [...head.filter((x) => !tail.includes(x)), ...head.filter((x) => tail.includes(x)), ...now.slice(n - m)];
  return order[((day % n) + n) % n];
}

/** Today's three: a logic question, a brain teaser, a grid puzzle – a crossword only once enough questions are answered. */
export function dailyTasks(items: Item[], state: UserState, date = today()): DailyTask[] {
  const age = state.ageBand, level = levelOf(age), day = dayNumber(date);
  const seed = `daily-${date}-${age ?? ""}`;
  const at = (kind: string) => stepOf(state, kind);
  const young = (kind: string) => Math.min(at(kind), level < 2 ? 2 : 5) as Step; // these two do not look at the age themselves
  const grid = (kind: Puzzle["kind"]): Puzzle | null =>
    kind === "sudoku" ? makeSudoku(`${seed}-s`, sudokuSizeAt(age, at("sudoku")), "tricky", at("sudoku"))
    : kind === "crossword" ? makeCrossword(`${seed}-c-${state.settings.locale}`, items, state, "tricky", at("crossword"))
    : kind === "pyramid" ? makePyramid(`${seed}-p`, age, "tricky", at("pyramid"))
    : kind === "futoshiki" ? makeFutoshiki(`${seed}-f`, "tricky", young("futoshiki"))
    : kind === "binary" ? makeBinary(`${seed}-b`, age, "tricky", at("binary"))
    : kind === "nonogram" ? makeNonogram(`${seed}-n`, age, "tricky", at("nonogram"))
    : makeSkyscrapers(`${seed}-h`, age, "tricky", young("skyscrapers"));
  const exercise = (kind: ExerciseKind) => makeExercise(`${seed}-${kind}`, kind, age, state.settings.locale, at(kind));
  const puzzle = grid(turn(DAILY.grid[level], day, "grid")) ?? grid(turn(DAILY.grid[level].filter((k) => k !== "crossword"), day, "grid-no-crossword"))!;
  const tasks = [exercise(turn(DAILY.logic[level], day, "logic")), exercise(turn(DAILY.teaser[level], day, "teaser"))];
  return [...tasks.map((e): DailyTask => ({ id: e.id, kind: e.kind, exercise: e })), { id: puzzle.id, kind: puzzle.kind, puzzle }];
}
/** Those of today's three that are not done yet. */
export const dailyOpen = (s: UserState, tasks: DailyTask[], date = today()) => {
  const st = puzzleState(s);
  const done = st.daily.date === date ? st.daily.done : [];
  return tasks.filter((t) => !done.includes(t.id));
};
