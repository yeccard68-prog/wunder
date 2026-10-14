"use client";

import { useState } from "react";
import { DataTable } from "@/components/viz/Chart";
import type { VizProps } from "@/components/viz/types";
import { formatNumber, relativeTo, type BarsConfig } from "@/lib/visuals";

const W = 340;
const LABEL = 104; // width of the name column
const ROW = 30;

/**
 * Horizontal bars for a comparison: tap a bar for its value, switch between the measured values
 * and "times the baseline", sort by value or keep the order of the data.
 */
export default function BarsViz({ visual, color, locale, onChange }: VizProps) {
  const c = visual.config as BarsConfig;
  const L = visual.labels;
  const [relative, setRelative] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const rel = relativeTo(c.items, c.baseline);
  const rows = c.items.map((item, i) => ({ ...item, rel: rel[i] }));
  const shown = sorted ? [...rows].sort((a, b) => b.value - a.value) : rows;
  const max = Math.max(...rows.map((r) => r.value));
  const width = (value: number) => ((W - LABEL - 64) * value) / max; // the axis starts at zero: lengths stay comparable
  const text = (r: (typeof rows)[number]) => (relative ? `${formatNumber(r.rel, locale, r.rel < 10 ? 1 : 0)} ×` : `${formatNumber(r.value, locale)} ${c.unit}`);
  const toggle = (set: (f: (b: boolean) => boolean) => void) => () => {
    set((b) => !b);
    onChange?.();
  };
  const chip = (on: boolean) => `press h-10 rounded-full border px-4 text-sm font-semibold ${on ? "border-ink bg-ink text-bg" : "border-line bg-surface"}`;
  const current = rows.find((r) => r.key === picked);
  const h = shown.length * ROW + 8;

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${h}`} role="img" aria-label={visual.title} className="w-full select-none" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        {shown.map((r, i) => {
          const y = 4 + i * ROW;
          const on = r.key === picked;
          const base = r.key === c.baseline;
          return (
            <g key={r.key} role="button" tabIndex={0} aria-label={`${L[r.key]}: ${text(r)}`} aria-pressed={on} data-bar={r.key} style={{ cursor: "pointer", transition: "transform 0.3s" }} transform={`translate(0 ${y})`}
              onClick={() => { setPicked(r.key); onChange?.(); }} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setPicked(r.key)}>
              <rect x={0} y={0} width={W} height={ROW - 4} fill="transparent" />
              <text x={LABEL - 8} y={17} textAnchor="end" fontSize={11.5} fontWeight={on || base ? 700 : 500} fill="var(--ink)">{L[r.key]}</text>
              <rect x={LABEL} y={4} width={Math.max(2, width(r.value))} height={ROW - 12} rx={4} fill={base ? "var(--muted)" : color} opacity={on || !picked ? 1 : 0.55} />
              <text x={LABEL + width(r.value) + 6} y={17} fontSize={11} fontWeight={600} fill="var(--ink)" className="tnum">{text(r)}</text>
            </g>
          );
        })}
      </svg>
      <p className="min-h-[2.5rem] text-center text-sm font-semibold" role="status" data-testid="viz-readout">
        {current ? L.detail.replace("{name}", L[current.key]).replace("{value}", `${formatNumber(current.value, locale)} ${c.unit}`).replace("{times}", formatNumber(current.rel, locale, 1)) : L.pick}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={toggle(setRelative)} aria-pressed={relative} className={chip(relative)}>{L.relative}</button>
        <button onClick={toggle(setSorted)} aria-pressed={sorted} className={chip(sorted)}>{L.sort}</button>
      </div>
      <DataTable summary={locale === "en" ? "Show the numbers as a table" : "Zahlen als Tabelle zeigen"} head={["", c.unit, L.relativeHead]} rows={rows.map((r) => [L[r.key], formatNumber(r.value, locale), `${formatNumber(r.rel, locale, 2)} ×`])} />
    </div>
  );
}
