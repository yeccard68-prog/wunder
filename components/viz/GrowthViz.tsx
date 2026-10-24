"use client";

import { useState } from "react";
import { Control, DataTable, Frame, Readout, X0, X1, Y0, Y1 } from "@/components/viz/Chart";
import type { VizProps } from "@/components/viz/types";
import { compound, formatNumber, paidIn, scale, ticks, type GrowthConfig } from "@/lib/visuals";

/** Saving with compound interest: four sliders, two lines (with interest / only paid in), the numbers below. */
export default function GrowthViz({ visual, color, locale, onChange }: VizProps) {
  const c = visual.config as GrowthConfig;
  const L = visual.labels;
  const [v, setV] = useState({ start: c.start.value, monthly: c.monthly.value, rate: c.rate.value, years: c.years.value });
  const set = (key: keyof typeof v) => (value: number) => {
    setV((old) => ({ ...old, [key]: value }));
    onChange?.();
  };
  const grown = compound(v.start, v.monthly, v.rate, v.years);
  const paid = paidIn(v.start, v.monthly, v.years);
  const top = Math.max(grown[v.years], 1);
  const yT = ticks(top);
  const yMax = Math.max(top, yT[yT.length - 1]);
  const x = (year: number) => scale(year, 0, v.years, X0, X1);
  const y = (value: number) => scale(value, 0, yMax, Y0, Y1);
  const line = (series: number[]) => series.map((value, year) => `${year ? "L" : "M"}${x(year).toFixed(1)} ${y(value).toFixed(1)}`).join("");
  const money = (value: number) => `${formatNumber(Math.round(value), locale)} ${c.unit}`;
  const short = (value: number) => (value >= 1000 ? `${formatNumber(value / 1000, locale, 1)} ${locale === "en" ? "k" : "Tsd."}` : formatNumber(value, locale));
  const final = grown[v.years];
  const interest = final - paid[v.years];
  const share = final > 0 ? Math.round((interest / final) * 100) : 0;
  const xT = ticks(v.years, 4).filter((t) => Number.isInteger(t));

  return (
    <div className="space-y-4">
      <Frame title={visual.title} xLabel={L.axisX} yLabel={`${L.axisY} (${c.unit})`} xTicks={xT.map((t) => ({ at: x(t), label: String(t) }))} yTicks={yT.map((t) => ({ at: y(t), label: short(t) }))}>
        <defs>
          {/* the area under the curve fades out downwards */}
          <linearGradient id={`grow-${visual.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity={0.38} />
            <stop offset="1" stopColor={color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <path d={`${line(grown)}L${x(v.years)} ${y(paid[v.years])}${paid.map((value, year) => `L${x(year).toFixed(1)} ${y(value).toFixed(1)}`).reverse().join("")}Z`} fill={`url(#grow-${visual.id})`} />
        <path d={line(paid)} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 5" />
        <path d={line(grown)} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <circle cx={x(v.years)} cy={y(final)} r={5} fill={color} stroke="var(--surface)" strokeWidth={2} />
        {/* the lines are named in the picture – colour alone does not carry the meaning */}
        <text x={X1 - 4} y={Math.max(Y1 + 10, y(final) - 9)} textAnchor="end" fontSize={10.5} fontWeight={700} fill={color}>{L.withInterest}</text>
        <text x={X1 - 4} y={Math.min(Y0 - 5, y(paid[v.years]) + 14)} textAnchor="end" fontSize={10.5} fontWeight={600} fill="var(--muted)">{L.paid}</text>
      </Frame>
      <div className="grid grid-cols-3 gap-2" data-testid="viz-readout">
        <Readout label={L.paidTotal} value={money(paid[v.years])} />
        <Readout label={L.interest} value={money(interest)} color={color} />
        <Readout label={L.final} value={money(final)} />
      </div>
      <p className="text-center text-sm font-semibold" role="status">{L.share.replace("{pct}", String(share))}</p>
      <div className="space-y-2">
        <Control label={L.years} text={`${v.years} ${L.yearsUnit}`} {...c.years} value={v.years} onChange={set("years")} color={color} />
        <Control label={L.monthly} text={money(v.monthly)} {...c.monthly} value={v.monthly} onChange={set("monthly")} color={color} />
        <Control label={L.rate} text={`${formatNumber(v.rate, locale, 1)} %`} {...c.rate} value={v.rate} onChange={set("rate")} color={color} />
        <Control label={L.start} text={money(v.start)} {...c.start} value={v.start} onChange={set("start")} color={color} />
      </div>
      <DataTable summary={locale === "en" ? "Show the numbers as a table" : "Zahlen als Tabelle zeigen"} head={[L.axisX, L.paid, L.withInterest]} rows={grown.map((value, year) => [year, money(paid[year]), money(value)]).filter((_, year) => year % Math.max(1, Math.round(v.years / 10)) === 0 || year === v.years)} />
    </div>
  );
}
