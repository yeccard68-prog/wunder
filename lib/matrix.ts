// Pattern puzzles ("Muster ergänzen"): a grid of 3 × 3 small drawings with one missing – which drawing completes it?
// Every drawing has four features (shape, number, filling, size). Each feature follows one simple rule across the grid:
// the same everywhere, the same along each row, the same down each column, or each possibility exactly once per row and
// column. So the missing drawing is certain – tests/matrix.test.ts tries all 81 possible drawings and finds only one that
// fits. The drawings themselves are plain SVG shapes (components/MatrixFigure.tsx) – our own, no images.
import type { Make } from "./exercises";

export interface Cell { shape: number; count: number; fill: number; size: number } // each 0, 1 or 2 (count: one, two, three)
export interface Figure { cells: (Cell | null)[]; options: Cell[] } // nine cells row by row, null = the missing one · one drawing per option
export type Rule = "same" | "row" | "col" | "latin";
export const FEATURES = ["shape", "count", "fill", "size"] as const;
type Feature = (typeof FEATURES)[number];

const SHAPES = [["Kreis", "Kreise", "m", "circle"], ["Quadrat", "Quadrate", "n", "square"], ["Dreieck", "Dreiecke", "n", "triangle"]];
const FILLS = [["leer", "empty"], ["gefüllt", "filled"], ["grau", "grey"]];
const SIZES = [["klein", "small"], ["mittelgroß", "medium"], ["groß", "large"]];
const COUNTS = [["ein", "zwei", "drei"], ["one", "two", "three"]];
/** A drawing in words – the text of an option and what a screen reader says: "zwei große gefüllte Kreise". */
export function describe(c: Cell, de: boolean): string {
  if (!de) return `${COUNTS[1][c.count]} ${SIZES[c.size][1]} ${FILLS[c.fill][1]} ${SHAPES[c.shape][3]}${c.count ? "s" : ""}`;
  const end = c.count ? "e" : SHAPES[c.shape][2] === "m" ? "er" : "es"; // ein großer Kreis · ein großes Quadrat · zwei große Kreise
  return `${COUNTS[0][c.count]} ${SIZES[c.size][0]}${end} ${FILLS[c.fill][0]}${end} ${SHAPES[c.shape][c.count ? 1 : 0]}`;
}
const NAMES: Record<Feature, [string, string]> = { shape: ["die Form", "the shape"], count: ["die Anzahl", "the number"], fill: ["die Füllung", "the filling"], size: ["die Größe", "the size"] };

/** Does a feature's nine values (row by row) follow the rule? */
export function follows(rule: Rule, v: number[]): boolean {
  const at = (r: number, c: number) => v[r * 3 + c];
  const rows = [0, 1, 2].every((r) => at(r, 0) === at(r, 1) && at(r, 1) === at(r, 2)), cols = [0, 1, 2].every((c) => at(0, c) === at(1, c) && at(1, c) === at(2, c));
  if (rule === "same") return v.every((x) => x === v[0]);
  if (rule === "row") return rows && !cols; // really different from row to row
  if (rule === "col") return cols && !rows;
  const once = (list: number[]) => new Set(list).size === 3;
  return [0, 1, 2].every((k) => once([at(k, 0), at(k, 1), at(k, 2)]) && once([at(0, k), at(1, k), at(2, k)]));
}

const matrix: Make = (r, d, de) => {
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const shuffle = <T,>(list: T[]) => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // which features change, and by which rule: more of them, and more of the "once per row and column" kind, with each step
  const changing = shuffle([...FEATURES]).slice(0, Math.min(d, 4));
  const rules = {} as Record<Feature, Rule>;
  for (const f of FEATURES) rules[f] = "same";
  changing.forEach((f, i) => { rules[f] = d === 1 ? pick<Rule>(["row", "col"]) : i < (d <= 3 ? 1 : 2) ? "latin" : pick<Rule>(["row", "col", "latin"]); });
  if (d === 2 && r() < 0.5) rules[changing[0]] = pick<Rule>(["row", "col"]); // step 2: sometimes two plain rules …
  if (d === 2 && rules[changing[0]] !== "latin" && rules[changing[1]] === rules[changing[0]]) rules[changing[1]] = rules[changing[0]] === "row" ? "col" : "row"; // … but then one along rows, one down columns
  const value = {} as Record<Feature, (row: number, col: number) => number>;
  for (const f of FEATURES) {
    const order = shuffle([0, 1, 2]), turn = pick([1, 2]);
    value[f] = (row, col) => order[rules[f] === "same" ? 0 : rules[f] === "row" ? row : rules[f] === "col" ? col : (row + turn * col) % 3];
  }
  const all: Cell[] = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => ({ shape: value.shape(row, col), count: value.count(row, col), fill: value.fill(row, col), size: value.size(row, col) })));
  const gap = d >= 4 ? Math.floor(r() * 9) : 8; // from step 4 the missing drawing can be anywhere
  const answer = all[gap];
  // wrong options: one feature different – first the features that change in this puzzle
  const others = [...shuffle(changing), ...shuffle(FEATURES.filter((f) => !changing.includes(f)))].flatMap((f) => shuffle([0, 1, 2].filter((x) => x !== answer[f])).map((x) => ({ ...answer, [f]: x }) as Cell));
  const wrong: Cell[] = [];
  for (const f of [...changing, ...FEATURES]) { const c = others.find((o) => o[f] !== answer[f] && !wrong.includes(o)); if (c && wrong.length < 3) wrong.push(c); }
  for (const o of others) if (wrong.length < 3 && !wrong.includes(o)) wrong.push(o);
  const at = Math.floor(r() * 4);
  const shown = [...wrong];
  shown.splice(at, 0, answer);
  const L = de ? 0 : 1;
  const why = changing.map((f) => {
    const name = NAMES[f][L];
    if (rules[f] === "latin") return de ? `${name[0].toUpperCase() + name.slice(1)}: Jede Möglichkeit kommt in jeder Zeile und jeder Spalte genau einmal vor.` : `${name[0].toUpperCase() + name.slice(1)}: each possibility appears exactly once in every row and every column.`;
    return de ? `In jeder ${rules[f] === "row" ? "Zeile" : "Spalte"} ist ${name} gleich.` : `${name[0].toUpperCase() + name.slice(1)} is the same ${rules[f] === "row" ? "along each row" : "down each column"}.`;
  });
  return {
    question: de ? "Welches Bild gehört in das leere Feld?" : "Which picture belongs in the empty field?",
    options: shown.map((c) => describe(c, de)), correct: at,
    explanation: `${why.join(" ")} ${de ? "Es fehlt also:" : "So the missing one is:"} ${describe(answer, de)}.`,
    figure: { cells: all.map((c, i) => (i === gap ? null : c)), options: shown },
  };
};

export const MATRIX = { matrix };
