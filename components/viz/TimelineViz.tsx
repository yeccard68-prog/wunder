"use client";

import { useState } from "react";
import { DataTable } from "@/components/viz/Chart";
import type { VizProps } from "@/components/viz/types";
import { gaps, scale, spreadLabels, type TimelineConfig } from "@/lib/visuals";

const W = 340;
const H = 380;
const LINE = 62; // x of the time line
const TOP = 14;
const BOTTOM = H - 14;

/**
 * A vertical timeline. "To scale" places every event at its real year; "equal spacing" puts them
 * one below the other – the comparison shows how much the spacing of time itself tells. Tap an
 * event for its year; the years between events can be shown.
 */
export default function TimelineViz({ visual, color, locale, revealed, onChange }: VizProps) {
  const c = visual.config as TimelineConfig;
  const L = visual.labels;
  const [even, setEven] = useState(false);
  const [showGaps, setShowGaps] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const items = c.items.filter((e) => !e.late || revealed).sort((a, b) => a.year - b.year);
  const y = (year: number, i: number) => (even ? TOP + ((BOTTOM - TOP) * i) / Math.max(1, items.length - 1) : scale(year, c.from, c.to, TOP, BOTTOM));
  const dots = items.map((e, i) => y(e.year, i));
  const labels = spreadLabels(dots, 19);
  // labels pushed below the picture are moved up together
  const overflow = Math.max(0, labels[labels.length - 1] - BOTTOM);
  const placed = labels.map((l) => l - overflow);
  const between = gaps(items);
  const centuries = Array.from({ length: Math.floor(c.to / 100) - Math.ceil(c.from / 100) + 1 }, (_, i) => (Math.ceil(c.from / 100) + i) * 100);
  const toggle = (set: (f: (b: boolean) => boolean) => void) => () => {
    set((b) => !b);
    onChange?.();
  };
  const chip = (on: boolean) => `press h-10 rounded-full border px-4 text-sm font-semibold ${on ? "border-ink bg-ink text-bg" : "border-line bg-surface"}`;
  const current = items.find((e) => e.key === picked);
  const yearText = (year: number) => String(year);

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={visual.title} className="w-full select-none" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        <path d={`M${LINE} ${TOP - 6}V${BOTTOM + 6}`} stroke="var(--line)" strokeWidth={3} strokeLinecap="round" />
        {!even && centuries.map((year) => (
          <g key={year}>
            <path d={`M${LINE - 6} ${scale(year, c.from, c.to, TOP, BOTTOM)}h12`} stroke="var(--muted)" strokeWidth={1} />
            <text x={LINE - 10} y={scale(year, c.from, c.to, TOP, BOTTOM) + 3.5} textAnchor="end" fontSize={9.5} fill="var(--muted)">{year}</text>
          </g>
        ))}
        {items.map((e, i) => {
          const on = e.key === picked;
          const gap = between[i].years;
          return (
            <g key={e.key} role="button" tabIndex={0} aria-label={`${L[e.key]}, ${e.year}`} aria-pressed={on} data-event={e.key} style={{ cursor: "pointer" }}
              onClick={() => { setPicked(e.key); onChange?.(); }} onKeyDown={(k) => (k.key === "Enter" || k.key === " ") && setPicked(e.key)}>
              <path d={`M${LINE} ${dots[i]}L${LINE + 18} ${placed[i]}H${LINE + 24}`} fill="none" stroke="var(--muted)" strokeWidth={0.8} />
              <circle cx={LINE} cy={dots[i]} r={on ? 6.5 : 5} fill={e.late ? "var(--surface)" : color} stroke={on ? "var(--ink)" : color} strokeWidth={2} />
              <rect x={LINE + 22} y={placed[i] - 9} width={W - LINE - 24} height={18} fill="transparent" />
              <text x={LINE + 28} y={placed[i] + 4} fontSize={11.5} fill="var(--ink)" fontWeight={on ? 700 : 500}>
                <tspan className="tnum" fontWeight={700}>{yearText(e.year)}</tspan>
                <tspan dx={6}>{L[e.key]}</tspan>
                {showGaps && gap !== null && <tspan dx={6} fill={color} fontWeight={700}>+{gap}</tspan>}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="min-h-[2.5rem] text-center text-sm font-semibold" role="status" data-testid="viz-readout">
        {current ? L.detail.replace("{name}", L[current.key]).replace("{year}", yearText(current.year)) : L.pick}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={toggle(setEven)} aria-pressed={even} className={chip(even)}>{even ? L.even : L.toScale}</button>
        <button onClick={toggle(setShowGaps)} aria-pressed={showGaps} className={chip(showGaps)}>{L.showGaps}</button>
      </div>
      <DataTable summary={locale === "en" ? "Show the years as a table" : "Jahreszahlen als Tabelle zeigen"} head={["", L.year, L.gapHead]} rows={items.map((e, i) => [L[e.key], e.year, between[i].years ?? "–"])} />
    </div>
  );
}
