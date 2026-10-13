"use client";

import { useState } from "react";
import { Control, Frame, Readout, X0, X1, Y0, Y1 } from "@/components/viz/Chart";
import type { VizProps } from "@/components/viz/types";
import { equilibrium, formatNumber, scale, ticks, type MarketConfig } from "@/lib/visuals";

const SUPPLY = "#d9772b"; // supply line; demand uses the topic colour. Both lines are also named in the picture.

/** Supply and demand as two straight lines; two sliders shift them and the crossing point follows. */
export default function MarketViz({ visual, color, locale, onChange }: VizProps) {
  const c = visual.config as MarketConfig;
  const L = visual.labels;
  const [demand, setDemand] = useState(c.demandShift.value);
  const [cost, setCost] = useState(c.costShift.value);
  const x = (q: number) => scale(q, 0, c.maxQuantity, X0, X1);
  const y = (p: number) => scale(p, 0, c.maxPrice, Y0, Y1);
  const base = equilibrium(c);
  const now = equilibrium(c, demand, cost);
  // a line between the edges of the plot, clipped to it
  const segment = (priceAt: (q: number) => number) => {
    const pts = [0, c.maxQuantity].map((q) => [q, priceAt(q)] as const);
    return `M${x(pts[0][0])} ${y(pts[0][1])}L${x(pts[1][0])} ${y(pts[1][1])}`;
  };
  const demandAt = (shift: number) => (q: number) => c.demand.intercept + shift - c.demand.slope * q;
  const supplyAt = (shift: number) => (q: number) => c.supply.intercept + shift + c.supply.slope * q;
  const money = (p: number) => `${formatNumber(p, locale, 2)} ${c.unit}`;
  const moved = demand !== 0 || cost !== 0;
  const text = demand !== 0 && cost !== 0 ? L.both : demand > 0 ? L.demandUp : demand < 0 ? L.demandDown : cost > 0 ? L.costUp : cost < 0 ? L.costDown : L.same;
  const change = (set: (v: number) => void) => (v: number) => {
    set(v);
    onChange?.();
  };
  const arrow = (delta: number) => (Math.abs(delta) < 0.005 ? "→" : delta > 0 ? "↑" : "↓");

  return (
    <div className="space-y-4">
      <Frame title={visual.title} xLabel={L.axisX} yLabel={`${L.axisY} (${c.unit})`} xTicks={ticks(c.maxQuantity).map((t) => ({ at: x(t), label: String(t) }))} yTicks={ticks(c.maxPrice, 5).map((t) => ({ at: y(t), label: formatNumber(t, locale, 1) }))}>
        <clipPath id={`plot-${visual.id}`}><rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} /></clipPath>
        <g clipPath={`url(#plot-${visual.id})`}>
          {moved && (
            <>
              <path d={segment(demandAt(0))} stroke={color} strokeWidth={1.5} strokeDasharray="4 5" opacity={0.5} />
              <path d={segment(supplyAt(0))} stroke={SUPPLY} strokeWidth={1.5} strokeDasharray="4 5" opacity={0.5} />
            </>
          )}
          <path d={segment(demandAt(demand))} stroke={color} strokeWidth={3} strokeLinecap="round" />
          <path d={segment(supplyAt(cost))} stroke={SUPPLY} strokeWidth={3} strokeLinecap="round" />
        </g>
        <text x={X0 + 8} y={Math.max(Y1 + 12, y(demandAt(demand)(0)) - 6)} fontSize={11} fontWeight={700} fill={color}>{L.demand}</text>
        <text x={X1 - 6} y={Math.max(Y1 + 12, y(supplyAt(cost)(c.maxQuantity)) - 7)} textAnchor="end" fontSize={11} fontWeight={700} fill={SUPPLY}>{L.supply}</text>
        {moved && <circle cx={x(base.quantity)} cy={y(base.price)} r={4.5} fill="var(--surface)" stroke="var(--muted)" strokeWidth={1.5} />}
        <path d={`M${X0} ${y(now.price)}H${x(now.quantity)}V${Y0}`} fill="none" stroke="var(--ink)" strokeWidth={1} strokeDasharray="2 4" />
        <circle cx={x(now.quantity)} cy={y(now.price)} r={6} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2} data-testid="viz-point" />
      </Frame>
      <div className="grid grid-cols-2 gap-2" data-testid="viz-readout">
        <Readout label={`${L.price} ${arrow(now.price - base.price)}${moved ? ` · ${L.before} ${money(base.price)}` : ""}`} value={money(now.price)} />
        <Readout label={`${L.quantity} ${arrow(now.quantity - base.quantity)}${moved ? ` · ${L.before} ${formatNumber(base.quantity, locale, 1)}` : ""}`} value={`${formatNumber(now.quantity, locale, 1)} ${L.quantityUnit}`} />
      </div>
      <p className="min-h-[4.5rem] rounded-2xl bg-raised px-4 py-3 text-sm leading-relaxed" role="status" data-testid="viz-explain">{text}</p>
      <div className="space-y-2">
        <Control label={L.demandShift} text={demand === 0 ? "±0" : demand > 0 ? L.more : L.less} {...c.demandShift} value={demand} onChange={change(setDemand)} color={color} ends={[L.less, L.more]} />
        <Control label={L.costShift} text={cost === 0 ? "±0" : cost > 0 ? L.dearer : L.cheaper} {...c.costShift} value={cost} onChange={change(setCost)} color={SUPPLY} ends={[L.cheaper, L.dearer]} />
      </div>
    </div>
  );
}
