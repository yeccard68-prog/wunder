"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Lightbulb } from "lucide-react";
import type { Visual } from "@/lib/books";
import { useT } from "@/lib/store";

/** A cycle of steps; the highlight walks round it, a tap selects a step. */
function Loop({ nodes, note, color }: { nodes: string[]; note?: string; color: string }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    setAuto(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setActive((a) => (a + 1) % nodes.length), 1400);
    return () => clearInterval(id);
  }, [auto, nodes.length]);
  const n = nodes.length;
  const at = (i: number, r: number): [number, number] => [160 + r * Math.sin((i / n) * 2 * Math.PI), 104 - r * Math.cos((i / n) * 2 * Math.PI)];
  return (
    <figure>
      <svg viewBox="0 0 320 208" className="w-full" role="img" aria-label={nodes.join(" → ")}>
        <circle cx={160} cy={104} r={70} fill="none" stroke="var(--line)" strokeWidth={2} strokeDasharray="3 6" />
        {nodes.map((_, i) => {
          // arrow head halfway between two steps, pointing clockwise
          const a = ((i + 0.5) / n) * 2 * Math.PI;
          return <path key={i} d="M-5 -5L4 0L-5 5" fill="none" stroke={active === i ? color : "var(--muted)"} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${160 + 70 * Math.sin(a)} ${104 - 70 * Math.cos(a)}) rotate(${(a * 180) / Math.PI})`} />;
        })}
        {nodes.map((label, i) => {
          const [x, y] = at(i, 70);
          const on = i === active;
          const w = Math.max(74, label.length * 6.6 + 22);
          return (
            <g key={label} onClick={() => { setAuto(false); setActive(i); }} style={{ cursor: "pointer" }}>
              <rect x={x - w / 2} y={y - 15} width={w} height={30} rx={15} fill={on ? color : "var(--surface)"} stroke={on ? color : "var(--line)"} strokeWidth={1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={on ? "#fff" : "var(--ink)"}>{label}</text>
            </g>
          );
        })}
      </svg>
      {note && <figcaption className="mt-1 text-center text-xs leading-relaxed text-muted">{note}</figcaption>}
    </figure>
  );
}

/** Two columns side by side: [heading, ...points]. */
function Compare({ left, right, color }: { left: string[]; right: string[]; color: string }) {
  const column = ([head, ...points]: string[], strong: boolean) => (
    <div className={`rounded-2xl p-3.5 ${strong ? "text-white" : "bg-raised"}`} style={strong ? { background: color } : undefined}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider">{head}</p>
      <ul className="space-y-1.5 text-[13px] leading-snug">
        {points.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {column(left, false)}
      {column(right, true)}
    </div>
  );
}

/** Decide first, then learn what is behind the decision. Nothing here is right or wrong for points. */
function Scenario({ prompt, options, insight, color }: { prompt: string; options: [string, string][]; insight: string; color: string }) {
  const t = useT();
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <div className="rounded-2xl bg-raised p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider" style={{ color }}>{t("Wie würdest du entscheiden?")}</p>
      <p className="text-sm leading-relaxed">{prompt}</p>
      <div className="mt-3 space-y-2">
        {options.map(([label], i) => (
          <button key={label} onClick={() => setChoice(i)} aria-pressed={choice === i} className={`press flex w-full items-center gap-2 rounded-xl border bg-surface px-3.5 py-3 text-left text-sm font-semibold ${choice === i ? "border-ink" : "border-line"}`}>
            <span className="flex-1">{label}</span>
            {choice === i ? <Check size={16} /> : <ArrowRight size={16} className="text-muted" />}
          </button>
        ))}
      </div>
      {choice !== null && (
        <div className="pop mt-3 space-y-2 text-sm leading-relaxed" role="status">
          <p>{options[choice][1]}</p>
          <p className="flex gap-2 font-semibold">
            <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color }} /> {insight}
          </p>
        </div>
      )}
    </div>
  );
}

/** Regular saving with compound growth; the slider sets the number of years. */
function Growth({ unit, perMonth, rate, label, hint, color }: { unit: string; perMonth: number; rate: number; label: string; hint: string; color: string }) {
  const t = useT();
  const [years, setYears] = useState(20);
  const value = (y: number) => {
    const m = rate / 100 / 12;
    return perMonth * ((Math.pow(1 + m, y * 12) - 1) / m);
  };
  const MAX = 45;
  const top = value(MAX);
  const x = (y: number) => 8 + (y / MAX) * 304;
  const yPos = (v: number) => 132 - (v / top) * 120;
  const curve = Array.from({ length: MAX + 1 }, (_, y) => `${y ? "L" : "M"}${x(y).toFixed(1)} ${yPos(value(y)).toFixed(1)}`).join(" ");
  const paid = perMonth * 12 * years;
  const total = value(years);
  const fmt = (v: number) => Math.round(v).toLocaleString("de-DE") + " " + unit;
  return (
    <div className="rounded-2xl bg-raised p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <svg viewBox="0 0 320 140" className="mt-2 w-full" role="img" aria-label={label}>
        <path d={`M${x(0)} ${yPos(0)}L${x(MAX)} ${yPos(perMonth * 12 * MAX)}`} stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 5" />
        <path d={curve} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <path d={`M${x(years)} 8V134`} stroke="var(--ink)" strokeWidth={1} strokeDasharray="2 4" />
        <circle cx={x(years)} cy={yPos(total)} r={5.5} fill={color} stroke="var(--surface)" strokeWidth={2} />
      </svg>
      <input type="range" min={5} max={MAX} value={years} onChange={(e) => setYears(Number(e.target.value))} aria-label={t("Anlagedauer in Jahren")} className="mt-1 w-full" style={{ accentColor: color }} />
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
        <p><span className="tnum block text-base font-bold text-ink">{years}</span><span className="text-muted">{t("Jahre")}</span></p>
        <p><span className="tnum block text-base font-bold text-ink">{fmt(paid)}</span><span className="text-muted">{t("eingezahlt")}</span></p>
        <p><span className="tnum block text-base font-bold" style={{ color }}>{fmt(total)}</span><span className="text-muted">{t("Endwert")}</span></p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

/** The interactive illustration of a book idea. New kinds are added here and in scripts/content/build-books.mjs. */
export default function BookVisual({ visual, color }: { visual: Visual; color: string }) {
  if (visual.type === "loop") return <Loop nodes={visual.nodes} note={visual.note} color={color} />;
  if (visual.type === "compare") return <Compare left={visual.left} right={visual.right} color={color} />;
  if (visual.type === "scenario") return <Scenario prompt={visual.prompt} options={visual.options} insight={visual.insight} color={color} />;
  if (visual.type === "growth") return <Growth unit={visual.unit} perMonth={visual.perMonth} rate={visual.rate} label={visual.label} hint={visual.hint} color={color} />;
  return null;
}
