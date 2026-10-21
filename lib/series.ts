// Theme series: three facts from the same area of life ("3 × Tiere") in one card to swipe through. Built from the
// ranked facts – no extra content needed. Quiz facts ("myth or truth?") stay single cards: they are asked first.
import type { Fact } from "./facts";

export const SERIES_SIZE = 3;
/** Every SERIES_EVERY-th fact slot becomes a series, when there are enough facts of one area left. */
export const SERIES_EVERY = 3;

export type FactUnit = { kind: "fact"; fact: Fact } | { kind: "series"; area: Fact["area"]; facts: Fact[] };

/** Groups the ranked facts into single facts and series, keeping the ranked order as far as possible. */
export function withSeries(ranked: Fact[], every = SERIES_EVERY, size = SERIES_SIZE): FactUnit[] {
  const rest = [...ranked];
  const out: FactUnit[] = [];
  while (rest.length) {
    const head = rest.shift()!;
    const slot = out.length + 1;
    if (slot % every === 0 && !head.quiz) {
      const same = rest.filter((f) => f.area === head.area && !f.quiz).slice(0, size - 1);
      if (same.length === size - 1) {
        for (const f of same) rest.splice(rest.indexOf(f), 1);
        out.push({ kind: "series", area: head.area, facts: [head, ...same] });
        continue;
      }
    }
    out.push({ kind: "fact", fact: head });
  }
  return out;
}
