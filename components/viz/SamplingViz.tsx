"use client";

import { useState } from "react";
import { Control } from "@/components/viz/Chart";
import type { VizProps } from "@/components/viz/types";
import { drawIndex, formatNumber, withTemperature, type SamplingConfig } from "@/lib/visuals";

const W = 340;
const LABEL = 96;
const ROW = 28;
const chip = "press h-10 rounded-full border border-line bg-surface px-4 text-sm font-semibold disabled:opacity-40";

/**
 * How a language model picks the next word: example probabilities for a sentence start, a temperature slider that
 * reshapes them, and a button that draws words – the drawn ones are counted, so the effect of the slider shows.
 */
export default function SamplingViz({ visual, color, locale, saved, onChange }: VizProps) {
  const c = visual.config as SamplingConfig;
  const L = visual.labels;
  const s = c.temperature;
  const [t, setT] = useState(() => (typeof saved?.t === "number" ? Math.min(s.max, Math.max(s.min, saved.t)) : s.value));
  const [drawn, setDrawn] = useState<number[]>([]);
  const p = withTemperature(c.words.map((w) => w.p), t);
  const max = Math.max(...p);
  const counts = c.words.map((_, i) => drawn.filter((d) => d === i).length);
  const draw = (k: number) => {
    setDrawn((old) => [...old, ...Array.from({ length: k }, () => drawIndex(p, Math.random()))]);
    onChange?.({ t });
  };
  const setTemperature = (v: number) => {
    setT(v);
    setDrawn([]); // counts from another temperature would mix two experiments
    onChange?.({ t: v });
  };
  const last = drawn.length ? c.words[drawn[drawn.length - 1]].key : null;
  const h = c.words.length * ROW + 6;

  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-raised px-4 py-3 text-center text-[15px] font-semibold leading-snug" role="status" data-testid="viz-sentence">
        {L.prompt} <span className="rounded-md px-1.5 py-0.5" style={last ? { background: color, color: "#fff" } : { border: "1px dashed var(--muted)" }}>{last ? L[last] : "…"}</span>
      </p>
      <svg viewBox={`0 0 ${W} ${h}`} role="img" aria-label={visual.title} className="w-full select-none" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        {c.words.map((w, i) => {
          const y = 3 + i * ROW;
          const width = ((W - LABEL - 92) * p[i]) / max;
          return (
            <g key={w.key} transform={`translate(0 ${y})`} data-word={w.key}>
              <text x={LABEL - 8} y={16} textAnchor="end" fontSize={11.5} fontWeight={w.key === last ? 700 : 500} fill="var(--ink)">{L[w.key]}</text>
              <rect x={LABEL} y={4} width={Math.max(2, width)} height={ROW - 11} rx={4} fill={color} opacity={w.key === last ? 1 : 0.7} style={{ transition: "width 0.25s" }} />
              <text x={LABEL + width + 6} y={16} fontSize={11} fontWeight={600} fill="var(--ink)" className="tnum">{formatNumber(p[i] * 100, locale, p[i] < 0.1 ? 1 : 0)} %{drawn.length ? `  ·  ${counts[i]}×` : ""}</text>
            </g>
          );
        })}
      </svg>
      <Control label={L.temperature} text={formatNumber(t, locale, 1)} {...s} value={t} onChange={setTemperature} color={color} ends={[L.low, L.high]} />
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={() => draw(1)} className={chip}>{L.draw}</button>
        <button onClick={() => draw(20)} className={chip} data-testid="viz-simulate">{L.drawMany}</button>
        <button onClick={() => setDrawn([])} disabled={!drawn.length} className={chip}>{L.reset}</button>
      </div>
      <p className="text-center text-xs text-muted" data-testid="viz-readout">{drawn.length ? L.counted.replace("{n}", formatNumber(drawn.length, locale)) : L.hint}</p>
    </div>
  );
}
