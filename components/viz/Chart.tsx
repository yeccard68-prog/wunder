"use client";

// Building blocks shared by all charts: a frame with labelled axes and grid lines, a slider with
// its value written out, and a table of the same data for people who cannot use the picture.
import type { ReactNode } from "react";

export const W = 340;
export const H = 250;
export const PAD = { left: 46, right: 12, top: 12, bottom: 38 };
export const X0 = PAD.left;
export const X1 = W - PAD.right;
export const Y0 = H - PAD.bottom; // bottom of the plot (smaller values)
export const Y1 = PAD.top;

export interface Tick {
  at: number; // position in the picture
  label: string;
}

/** The plot area: axes, grid, tick labels, axis titles. Children draw the data. */
export function Frame({ title, xTicks, yTicks, xLabel, yLabel, children }: { title: string; xTicks: Tick[]; yTicks: Tick[]; xLabel: string; yLabel: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="w-full select-none" style={{ touchAction: "pan-y", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      {yTicks.map((t) => (
        <g key={"y" + t.label}>
          <path d={`M${X0} ${t.at}H${X1}`} stroke="var(--line)" strokeWidth={1} />
          <text x={X0 - 6} y={t.at + 3.5} textAnchor="end" fontSize={10} fill="var(--muted)">{t.label}</text>
        </g>
      ))}
      {xTicks.map((t) => (
        <g key={"x" + t.label}>
          <path d={`M${t.at} ${Y0}v4`} stroke="var(--muted)" strokeWidth={1} />
          <text x={t.at} y={Y0 + 15} textAnchor="middle" fontSize={10} fill="var(--muted)">{t.label}</text>
        </g>
      ))}
      <path d={`M${X0} ${Y1}V${Y0}H${X1}`} fill="none" stroke="var(--muted)" strokeWidth={1.2} />
      <text x={(X0 + X1) / 2} y={H - 5} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">{xLabel}</text>
      <text x={11} y={(Y0 + Y1) / 2} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)" transform={`rotate(-90 11 ${(Y0 + Y1) / 2})`}>{yLabel}</text>
      {children}
    </svg>
  );
}

/** A slider whose current value is always written next to its name. */
export function Control({ label, text, value, min, max, step, onChange, color, ends }: { label: string; text: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; color: string; ends?: [string, string] }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tnum font-bold" style={{ color }}>{text}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={text} className="mt-1 h-8 w-full" style={{ accentColor: color }} />
      {ends && (
        <span className="-mt-1 flex justify-between text-[11px] text-muted">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </span>
      )}
    </label>
  );
}

/** The numbers behind the picture as a table – for screen readers and for checking. */
export function DataTable({ summary, head, rows }: { summary: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="text-xs text-muted">
      <summary className="press cursor-pointer py-1 font-semibold underline">{summary}</summary>
      <div className="mt-1 overflow-x-auto">
        <table className="tnum w-full border-collapse text-left">
          <thead>
            <tr>{head.map((h) => <th key={h} scope="col" className="border-b border-line py-1 pr-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-line py-1 pr-3">{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** A number with its caption, e.g. below a chart. */
export function Readout({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <p className="text-center">
      <span className="tnum block text-base font-bold" style={color ? { color } : undefined}>{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </p>
  );
}
