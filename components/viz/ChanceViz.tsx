"use client";

import { useState } from "react";
import { Control, DataTable, Frame, Readout, X0, X1, Y0, Y1 } from "@/components/viz/Chart";
import type { VizProps } from "@/components/viz/types";
import { birthdayChance, birthdayGroup, formatNumber, runningShare, scale, ticks, type ChanceConfig } from "@/lib/visuals";

const chip = "press h-10 rounded-full border border-line bg-surface px-4 text-sm font-semibold disabled:opacity-40";
const pct = (v: number, locale: string, digits = 1) => `${formatNumber(v * 100, locale, digits)} %`;
const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, String(v)), text);

/**
 * A chance experiment: first by hand, once, then a thousand times at a tap – the counted result next to the calculated
 * one. Three experiments: shared birthdays, the three doors (goat problem), tossing a coin.
 */
export default function ChanceViz(props: VizProps) {
  const c = props.visual.config as ChanceConfig;
  if (c.experiment === "birthday") return <Birthdays {...props} />;
  if (c.experiment === "doors") return <Doors {...props} />;
  return <Coins {...props} />;
}

/** Shared birthdays: the chance for a group of n, one group drawn on a year strip, and many groups counted. */
function Birthdays({ visual, color, locale, saved, onChange }: VizProps) {
  const c = visual.config as ChanceConfig;
  const L = visual.labels;
  const s = c.people!;
  const [n, setN] = useState(() => (typeof saved?.n === "number" ? Math.min(s.max, Math.max(s.min, saved.n)) : s.value));
  const [group, setGroup] = useState<ReturnType<typeof birthdayGroup> | null>(null);
  const [sim, setSim] = useState<{ n: number; runs: number; hits: number } | null>(null);
  const exact = birthdayChance(n);
  const x = (k: number) => scale(k, 0, s.max, X0, X1);
  const y = (p: number) => scale(p, 0, 1, Y0, Y1);
  const curve = Array.from({ length: s.max }, (_, k) => `${k ? "L" : "M"}${x(k + 1).toFixed(1)} ${y(birthdayChance(k + 1)).toFixed(1)}`).join("");
  const date = (day: number) => new Date(Date.UTC(2025, 0, 1 + day)).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", { day: "numeric", month: "short", timeZone: "UTC" });
  const setPeople = (v: number) => {
    setN(v);
    setGroup(null);
    onChange?.({ n: v });
  };
  const one = () => {
    setGroup(birthdayGroup(n, Math.random));
    onChange?.({ n });
  };
  const many = () => {
    let hits = 0;
    for (let i = 0; i < c.runs; i++) if (birthdayGroup(n, Math.random).shared.length) hits++;
    setSim((old) => (old && old.n === n ? { n, runs: old.runs + c.runs, hits: old.hits + hits } : { n, runs: c.runs, hits }));
    onChange?.({ n });
  };
  const counted = sim && sim.n === n ? sim : null;

  return (
    <div className="space-y-4">
      <Frame title={visual.title} xLabel={L.axisX} yLabel={L.axisY} xTicks={ticks(s.max, 6).map((t) => ({ at: x(t), label: String(t) }))} yTicks={[0, 0.25, 0.5, 0.75, 1].map((p) => ({ at: y(p), label: `${p * 100} %` }))}>
        <path d={`M${X0} ${y(0.5)}H${X1}`} stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 4" />
        <path d={curve} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <circle cx={x(n)} cy={y(exact)} r={5.5} fill={color} stroke="var(--surface)" strokeWidth={2} />
        <text x={Math.min(X1 - 4, x(n) + 8)} y={y(exact) + (exact > 0.85 ? 16 : -8)} textAnchor={x(n) > X1 - 60 ? "end" : "start"} fontSize={11} fontWeight={700} fill={color}>{pct(exact, locale)}</text>
      </Frame>
      <Control label={L.people} text={String(n)} {...s} value={n} onChange={setPeople} color={color} />
      <div className="grid grid-cols-2 gap-2" data-testid="viz-readout">
        <Readout label={L.exact} value={pct(exact, locale)} color={color} />
        <Readout label={counted ? fill(L.simulated, { runs: formatNumber(counted.runs, locale) }) : L.notYet} value={counted ? pct(counted.hits / counted.runs, locale) : "–"} />
      </div>
      {group && (
        <div className="rounded-2xl bg-raised p-3" data-testid="viz-group">
          <svg viewBox="0 0 340 36" role="img" aria-label={L.strip} className="w-full">
            <rect x={4} y={14} width={332} height={8} rx={4} fill="var(--line)" />
            {Array.from({ length: 12 }, (_, m) => <path key={m} d={`M${(4 + (332 * (Date.UTC(2025, m, 1) - Date.UTC(2025, 0, 1))) / (365 * 864e5)).toFixed(1)} 10v16`} stroke="var(--muted)" strokeWidth={0.8} />)}
            {group.days.map((d, i) => {
              const twin = group.shared.includes(d);
              return <circle key={i} cx={4 + (332 * (d + 0.5)) / 365} cy={18} r={twin ? 5 : 3} fill={twin ? color : "var(--ink)"} opacity={twin ? 1 : 0.55} />;
            })}
          </svg>
          <p className="mt-1 text-center text-sm font-semibold" role="status">{group.shared.length ? fill(L.shared, { days: group.shared.map(date).join(", ") }) : L.none}</p>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={one} className={chip}>{L.one}</button>
        <button onClick={many} className={chip} data-testid="viz-simulate">{fill(L.many, { runs: formatNumber(c.runs, locale) })}</button>
      </div>
      <DataTable summary={locale === "en" ? "Show the numbers as a table" : "Zahlen als Tabelle zeigen"} head={[L.axisX, L.axisY]} rows={[5, 10, 15, 20, 23, 30, 40, 50, 60].filter((k) => k <= s.max).map((k) => [k, pct(birthdayChance(k), locale)])} />
    </div>
  );
}

/** The three doors: play by hand (pick, the host opens a goat, stay or switch), and many games of each strategy counted. */
function Doors({ visual, color, locale, onChange }: VizProps) {
  const c = visual.config as ChanceConfig;
  const L = visual.labels;
  const [round, setRound] = useState(() => ({ car: Math.floor(Math.random() * 3), pick: null as number | null, opened: null as number | null, final: null as number | null }));
  const [tally, setTally] = useState({ stay: { played: 0, won: 0 }, swap: { played: 0, won: 0 } });
  const choose = (door: number) => {
    if (round.pick !== null) return;
    const goats = [0, 1, 2].filter((d) => d !== door && d !== round.car);
    setRound({ ...round, pick: door, opened: goats[Math.floor(Math.random() * goats.length)] });
    onChange?.();
  };
  const decide = (swap: boolean) => {
    if (round.pick === null || round.opened === null || round.final !== null) return;
    const final = swap ? [0, 1, 2].find((d) => d !== round.pick && d !== round.opened)! : round.pick;
    setRound({ ...round, final });
    const key = swap ? "swap" : "stay";
    setTally((t) => ({ ...t, [key]: { played: t[key].played + 1, won: t[key].won + (final === round.car ? 1 : 0) } }));
  };
  const again = () => setRound({ car: Math.floor(Math.random() * 3), pick: null, opened: null, final: null });
  const many = () => {
    const play = (swap: boolean) => {
      let won = 0;
      for (let i = 0; i < c.runs; i++) {
        const car = Math.floor(Math.random() * 3), pick = Math.floor(Math.random() * 3);
        won += swap ? (pick !== car ? 1 : 0) : pick === car ? 1 : 0; // switching wins exactly when the first pick was a goat
      }
      return won;
    };
    const stay = play(false), swap = play(true);
    setTally((t) => ({ stay: { played: t.stay.played + c.runs, won: t.stay.won + stay }, swap: { played: t.swap.played + c.runs, won: t.swap.won + swap } }));
    onChange?.();
  };
  const done = round.final !== null;
  const rate = (k: "stay" | "swap") => (tally[k].played ? tally[k].won / tally[k].played : 0);
  const status = round.pick === null ? L.pick : !done ? fill(L.opened, { door: (round.opened ?? 0) + 1 }) : round.final === round.car ? L.won : L.lost;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={L.pick}>
        {[0, 1, 2].map((d) => {
          const open = d === round.opened || done;
          const car = open && d === round.car;
          const mine = d === (done ? round.final : round.pick);
          return (
            <button key={d} onClick={() => choose(d)} disabled={round.pick !== null} data-door={d} aria-pressed={mine}
              className={`flex aspect-[3/4] flex-col items-center justify-center rounded-2xl border-2 text-sm font-bold transition-colors ${open ? (car ? "bg-good/15" : "bg-raised") : "bg-surface"}`}
              style={{ borderColor: mine ? color : "var(--line)" }}>
              <span className="text-xs font-semibold text-muted">{fill(L.door, { n: d + 1 })}</span>
              <span className="mt-2 text-base" style={car ? { color } : undefined}>{open ? (car ? L.car : L.goat) : "?"}</span>
            </button>
          );
        })}
      </div>
      <p className="min-h-[2.5rem] text-center text-sm font-semibold" role="status">{status}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {round.pick !== null && !done && (
          <>
            <button onClick={() => decide(false)} className={chip}>{L.stay}</button>
            <button onClick={() => decide(true)} className={chip}>{L.swap}</button>
          </>
        )}
        {done && <button onClick={again} className={chip}>{L.again}</button>}
        <button onClick={many} className={chip} data-testid="viz-simulate">{fill(L.many, { runs: formatNumber(c.runs, locale) })}</button>
      </div>
      <div className="space-y-2" data-testid="viz-readout">
        {(["stay", "swap"] as const).map((k) => (
          <div key={k}>
            <p className="flex justify-between text-sm"><span className="font-semibold">{k === "stay" ? L.rateStay : L.rateSwap}</span><span className="tnum text-muted">{fill(L.tally, { won: formatNumber(tally[k].won, locale), played: formatNumber(tally[k].played, locale) })}</span></p>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full transition-all" style={{ width: `${rate(k) * 100}%`, background: k === "swap" ? color : "var(--muted)" }} />
            </div>
            <p className="tnum mt-0.5 text-right text-xs font-bold">{tally[k].played ? pct(rate(k), locale, 0) : "–"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tossing a coin: the share of heads after every toss, settling around one half – and the longest run of one side. */
function Coins({ visual, color, locale, onChange }: VizProps) {
  const c = visual.config as ChanceConfig;
  const L = visual.labels;
  const [tosses, setTosses] = useState<boolean[]>([]);
  const add = (k: number) => {
    setTosses((t) => [...t, ...Array.from({ length: k }, () => Math.random() < 0.5)]);
    onChange?.();
  };
  const share = runningShare(tosses);
  const heads = tosses.filter(Boolean).length;
  let longest = 0, run = 0;
  tosses.forEach((t, i) => {
    run = i && t === tosses[i - 1] ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  const total = Math.max(10, tosses.length);
  const x = (i: number) => scale(i, 0, total * 1.06, X0, X1); // room on the right for the last tick label
  const y = (p: number) => scale(p, 0, 1, Y0, Y1);
  const step = Math.max(1, Math.floor(share.length / 400)); // at most about 400 points on the line
  const shown = share.map((_, i) => i).filter((i) => i % step === 0 || i === share.length - 1);
  const line = shown.map((i, k) => `${k ? "L" : "M"}${x(i + 1).toFixed(1)} ${y(share[i]).toFixed(1)}`).join("");

  return (
    <div className="space-y-4">
      <Frame title={visual.title} xLabel={L.axisX} yLabel={L.axisY} xTicks={ticks(total, 4).filter((t) => Number.isInteger(t)).map((t) => ({ at: x(t), label: formatNumber(t, locale) }))} yTicks={[0, 0.25, 0.5, 0.75, 1].map((p) => ({ at: y(p), label: `${p * 100} %` }))}>
        <path d={`M${X0} ${y(0.5)}H${X1}`} stroke="var(--muted)" strokeWidth={1.2} strokeDasharray="4 4" />
        <text x={X1 - 4} y={y(0.5) - 6} textAnchor="end" fontSize={10.5} fontWeight={600} fill="var(--muted)">{L.half}</text>
        {line && <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />}
      </Frame>
      <div className="grid grid-cols-2 gap-2" data-testid="viz-readout">
        <Readout label={fill(L.share, { heads: formatNumber(heads, locale), n: formatNumber(tosses.length, locale) })} value={tosses.length ? pct(heads / tosses.length, locale) : "–"} color={color} />
        <Readout label={L.streak} value={tosses.length ? `${longest}×` : "–"} />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={() => add(10)} className={chip}>{fill(L.add, { n: 10 })}</button>
        <button onClick={() => add(100)} className={chip}>{fill(L.add, { n: 100 })}</button>
        <button onClick={() => add(c.runs)} className={chip} data-testid="viz-simulate">{fill(L.add, { n: formatNumber(c.runs, locale) })}</button>
        <button onClick={() => setTosses([])} disabled={!tosses.length} className={chip}>{L.reset}</button>
      </div>
    </div>
  );
}
