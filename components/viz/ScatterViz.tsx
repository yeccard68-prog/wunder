"use client";

import { useState } from "react";
import { DataTable, Frame, X0, X1, Y0, Y1 } from "@/components/viz/Chart";
import type { VizProps } from "@/components/viz/types";
import { formatNumber, logTicks, scale, ticks, type ScatterConfig } from "@/lib/visuals";

/**
 * Measured points with a law behind them: tap a point for its values, switch between linear and
 * logarithmic axes, show the curve y = x^power. Points marked "late" appear once the prediction is made.
 */
export default function ScatterViz({ visual, color, locale, revealed, onChange }: VizProps) {
  const c = visual.config as ScatterConfig;
  const L = visual.labels;
  const [log, setLog] = useState(false);
  const [law, setLaw] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const points = c.points.filter((p) => !p.late || revealed);
  const xs = c.points.map((p) => p.x);
  const ys = c.points.map((p) => p.y);
  const xT = log ? logTicks(Math.min(...xs), Math.max(...xs)) : ticks(Math.max(...xs));
  const yT = log ? logTicks(Math.min(...ys), Math.max(...ys)) : ticks(Math.max(...ys));
  const [xMin, xMax, yMin, yMax] = [log ? xT[0] : 0, Math.max(xT[xT.length - 1], Math.max(...xs)), log ? yT[0] : 0, Math.max(yT[yT.length - 1], Math.max(...ys))];
  const x = (value: number) => scale(value, xMin, xMax, X0, X1, log);
  const y = (value: number) => scale(value, yMin, yMax, Y0, Y1, log);
  const number = (value: number) => formatNumber(value, locale, value < 10 ? 2 : value < 100 ? 1 : 0);
  // the law, drawn through many x values so it is a smooth curve on either kind of axis
  const curve = Array.from({ length: 60 }, (_, i) => {
    const at = log ? Math.pow(10, Math.log10(Math.max(xMin, 0.2)) + (i / 59) * (Math.log10(xMax) - Math.log10(Math.max(xMin, 0.2)))) : (i / 59) * xMax;
    return [at, Math.pow(at, c.power)] as const;
  }).filter(([, v]) => v >= (log ? yMin : 0) && v <= yMax);
  const current = points.find((p) => p.key === picked);
  const toggle = (set: (f: (b: boolean) => boolean) => void) => () => {
    set((b) => !b);
    onChange?.();
  };
  const chip = (on: boolean) => `press h-10 rounded-full border px-4 text-sm font-semibold ${on ? "border-ink bg-ink text-bg" : "border-line bg-surface"}`;

  return (
    <div className="space-y-3">
      <Frame title={visual.title} xLabel={L.axisX} yLabel={L.axisY} xTicks={xT.map((t) => ({ at: x(t), label: number(t) }))} yTicks={yT.map((t) => ({ at: y(t), label: number(t) }))}>
        {law && <path d={curve.map(([a, b], i) => `${i ? "L" : "M"}${x(a).toFixed(1)} ${y(b).toFixed(1)}`).join("")} fill="none" stroke={color} strokeWidth={2} strokeDasharray="6 4" data-testid="viz-law" />}
        {points.map((p) => {
          const on = p.key === picked;
          return (
            <g key={p.key} role="button" tabIndex={0} aria-label={L[p.key]} aria-pressed={on} onClick={() => { setPicked(p.key); onChange?.(); }} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setPicked(p.key)} style={{ cursor: "pointer" }} data-point={p.key}>
              <circle cx={x(p.x)} cy={y(p.y)} r={16} fill="transparent" />
              <circle cx={x(p.x)} cy={y(p.y)} r={on ? 7 : 5} fill={p.late ? "var(--surface)" : color} stroke={on ? "var(--ink)" : color} strokeWidth={on ? 2.5 : 2} />
              {on && <text x={Math.min(X1 - 4, Math.max(X0 + 30, x(p.x)))} y={Math.max(Y1 + 10, y(p.y) - 12)} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">{L[p.key]}</text>}
            </g>
          );
        })}
      </Frame>
      <p className="min-h-[2.5rem] text-center text-sm font-semibold" role="status" data-testid="viz-readout">
        {current ? L.detail.replace("{name}", L[current.key]).replace("{x}", number(current.x)).replace("{y}", number(current.y)) : L.pick}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={toggle(setLog)} aria-pressed={log} className={chip(log)}>{log ? L.log : L.linear}</button>
        <button onClick={toggle(setLaw)} aria-pressed={law} className={chip(law)}>{L.showLaw}</button>
      </div>
      <DataTable summary={locale === "en" ? "Show the numbers as a table" : "Zahlen als Tabelle zeigen"} head={["", L.axisX, L.axisY]} rows={points.map((p) => [L[p.key], number(p.x), number(p.y)])} />
    </div>
  );
}
