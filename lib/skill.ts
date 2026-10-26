// How hard the next exercise or puzzle should be: one value from 1 to 5 per kind (mental arithmetic, percentages,
// sudoku …), kept on this device. A right answer raises it a little, a wrong one (or "show the solution") lowers it
// more – so it settles where about seven in ten are solved: hard enough to think, not so hard that it frustrates.
// The question cards adapt on their own (ranking.ts, targetDifficulty).
import type { UserState } from "./types";

export type Step = 1 | 2 | 3 | 4 | 5;
export type Skill = Record<string, number>;

export const START = 3; // the level every adult started at before (unchanged for someone new)
export const UP = 0.2, UP_WITH_HINTS = 0.05, DOWN = 0.45; // balance: 0.45 / (0.2 + 0.45) ≈ 69 % right
const clamp = (v: number) => Math.min(5, Math.max(1, v));

export const skillOf = (state: Pick<UserState, "skill">, kind: string) => state.skill?.[kind] ?? START;
/** The level of the next one: the value rounded – so it changes only after a few results in a row. */
export const stepOf = (state: Pick<UserState, "skill">, kind: string): Step => Math.round(skillOf(state, kind)) as Step;

/** The new values after one result: right (with or without hints) or wrong / given up. */
export function practised(state: Pick<UserState, "skill">, kind: string, result: "right" | "hinted" | "wrong"): Skill {
  const v = skillOf(state, kind);
  const next = clamp(v + (result === "right" ? UP : result === "hinted" ? UP_WITH_HINTS : -DOWN));
  return { ...state.skill, [kind]: Math.round(next * 100) / 100 };
}
