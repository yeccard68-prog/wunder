"use client";

import { describe, type Cell, type Figure } from "@/lib/matrix";
import { useStore, useT } from "@/lib/store";

const RADIUS = [9, 14, 19]; // small, medium, large
/** Where the one, two or three shapes of a drawing sit in a 100 × 100 field. */
const places = (count: number, r: number): [number, number][] =>
  count === 0 ? [[50, 50]] : count === 1 ? [[50 - r - 5, 50], [50 + r + 5, 50]] : [[50, 50 - r - 4], [50 - r - 5, 50 + r + 4], [50 + r + 5, 50 + r + 4]]; // clear gaps, so that three squares do not read as one block

/** One drawing: one to three circles, squares or triangles – empty, filled or grey – in the text colour. */
export function MatrixCell({ cell, className = "" }: { cell: Cell; className?: string }) {
  const r = RADIUS[cell.size];
  const paint = cell.fill === 0 ? { fill: "none" } : cell.fill === 1 ? { fill: "currentColor" } : { fill: "currentColor", fillOpacity: 0.3 };
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {places(cell.count, r).map(([x, y], i) =>
        cell.shape === 0 ? <circle key={i} cx={x} cy={y} r={r} stroke="currentColor" strokeWidth={4} {...paint} />
        : cell.shape === 1 ? <rect key={i} x={x - r} y={y - r} width={2 * r} height={2 * r} stroke="currentColor" strokeWidth={4} {...paint} />
        : <polygon key={i} points={`${x},${y - r} ${x - r},${y + r * 0.85} ${x + r},${y + r * 0.85}`} stroke="currentColor" strokeWidth={4} strokeLinejoin="round" {...paint} />,
      )}
    </svg>
  );
}

/** The grid of a pattern puzzle: nine fields, the missing one marked with a question mark. */
export default function MatrixGrid({ figure }: { figure: Figure }) {
  const t = useT();
  const { state } = useStore();
  const de = state.settings.locale === "de";
  return (
    <div role="img" aria-label={`${t("Muster aus neun Feldern")}: ${figure.cells.map((c) => (c ? describe(c, de) : t("leeres Feld"))).join("; ")}`}
      className="mx-auto mt-4 grid w-full max-w-[300px] grid-cols-3 gap-1.5" data-testid="matrix-grid">
      {figure.cells.map((c, i) =>
        c ? <div key={i} className="rounded-xl border border-line bg-surface p-1"><MatrixCell cell={c} /></div>
          : <div key={i} className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/10 font-display text-3xl font-semibold text-accent" data-testid="matrix-gap">?</div>,
      )}
    </div>
  );
}
