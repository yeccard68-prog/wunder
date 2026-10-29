"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { estimateRange, tolerance, type AnswerKey, type FormatResponse } from "@/lib/formats";
import { useT } from "@/lib/store";
import type { Item } from "@/lib/types";
import { Button } from "./ui";

interface Props {
  item: Item;
  locale: string;
  pending: boolean;
  /** Set once the answer was submitted (or restored): the input is locked; `solution` may be missing for old answers. */
  done: { correct: boolean; solution?: AnswerKey } | null;
  submit: (response: FormatResponse) => void;
}
const number = (v: number, locale: string) => v.toLocaleString(locale === "de" ? "de-DE" : "en-GB");

/** Put the options into the right sequence with the arrow buttons (works with touch, mouse and keyboard). */
function Order({ item, pending, done, submit }: Props) {
  const t = useT();
  const [order, setOrder] = useState(() => item.options.map((_, i) => i));
  const move = (pos: number, by: number) => {
    const next = [...order];
    [next[pos], next[pos + by]] = [next[pos + by], next[pos]];
    setOrder(next);
  };
  const [sent, setSent] = useState<number[] | null>(null);
  const solution = done?.solution?.order;
  // After a wrong answer the learner's own order stays, each place marked right or wrong, and the solution follows below.
  const mine = done && solution && !done.correct && sent;
  const shown = mine ? sent : (solution ?? order);
  const mark = (idx: number, pos: number) => (!done || !solution ? null : solution[pos] === idx);
  return (
    <div className="mt-5">
      <ol className="space-y-2" data-testid="order-list">
        {shown.map((idx, pos) => (
          <li key={idx} data-mark={String(mark(idx, pos))} className={`flex min-h-[3.25rem] items-center gap-3 rounded-2xl border px-3.5 py-2 text-[15px] font-medium ${mark(idx, pos) === true ? "border-good bg-good/10" : mark(idx, pos) === false ? "border-bad bg-bad/10" : done ? "border-line" : "border-line bg-surface"}`}>
            <span className={`tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${mark(idx, pos) === true ? "bg-good text-white" : mark(idx, pos) === false ? "bg-bad text-white" : "bg-raised text-muted"}`}>{mark(idx, pos) === false ? <X size={14} /> : pos + 1}</span>
            <span className="flex-1">{item.options[idx]}</span>
            {!done && (
              <span className="flex gap-1">
                <button onClick={() => move(pos, -1)} disabled={pos === 0 || pending} aria-label={t("„{x}“ nach oben", { x: item.options[idx] })} className="press flex h-9 w-9 items-center justify-center rounded-full bg-raised disabled:opacity-30">
                  <ArrowUp size={16} />
                </button>
                <button onClick={() => move(pos, 1)} disabled={pos === order.length - 1 || pending} aria-label={t("„{x}“ nach unten", { x: item.options[idx] })} className="press flex h-9 w-9 items-center justify-center rounded-full bg-raised disabled:opacity-30">
                  <ArrowDown size={16} />
                </button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {mine && (
        <>
          <p className="mt-4 text-sm font-semibold text-muted">{t("Richtige Reihenfolge")}</p>
          <ol className="mt-2 space-y-1.5" data-testid="order-solution">
            {solution.map((idx, pos) => (
              <li key={idx} className="flex items-center gap-3 rounded-xl border border-good bg-good/10 px-3.5 py-1.5 text-[15px] font-medium">
                <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-good text-xs font-bold text-white">{pos + 1}</span>
                {item.options[idx]}
              </li>
            ))}
          </ol>
        </>
      )}
      {!done && (
        <Button className="mt-3 w-full" disabled={pending} onClick={() => { setSent(order); submit({ order }); }}>
          {t("Reihenfolge prüfen")}
        </Button>
      )}
    </div>
  );
}

/** Estimate a number with a slider; anything within the stated tolerance counts. */
function Estimate({ item, locale, pending, done, submit }: Props) {
  const t = useT();
  const { min, max, unit, step } = estimateRange(item.options);
  const [value, setValue] = useState(() => Math.round((min + max) / 2 / step) * step);
  const key = done?.solution;
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
  return (
    <div className="mt-5">
      <p className="text-center">
        <span className="tnum font-display text-4xl font-semibold">{number(value, locale)}</span> <span className="text-lg text-muted">{unit}</span>
      </p>
      <div className="relative mt-3">
        <input type="range" min={min} max={max} step={step} value={value} disabled={!!done || pending} onChange={(e) => setValue(Number(e.target.value))} aria-label={t("Deine Schätzung")} className="w-full accent-[var(--ink)]" />
        {key?.value != null && (
          // the accepted range and the true value on the same scale as the slider
          <div className="pointer-events-none relative mt-1 h-3 rounded-full bg-raised" aria-hidden>
            <span className="absolute inset-y-0 rounded-full bg-good/35" style={{ left: pct(key.value - tolerance(key)), right: `calc(100% - ${pct(key.value + tolerance(key))})` }} />
            <span className="absolute -top-0.5 h-4 w-1 -translate-x-1/2 rounded-full bg-good" style={{ left: pct(key.value) }} />
          </div>
        )}
      </div>
      <p className="mt-1 flex justify-between text-xs text-muted">
        <span className="tnum">{number(min, locale)}</span>
        <span className="tnum">{number(max, locale)}</span>
      </p>
      {key?.value != null && (
        <p className="mt-2 text-center text-sm font-semibold text-good">
          {t("Richtig sind {v} {unit}", { v: number(key.value, locale), unit })}{tolerance(key) > 0 ? ` (± ${number(tolerance(key), locale)})` : ""}
        </p>
      )}
      {!done && (
        <Button className="mt-3 w-full" disabled={pending} onClick={() => submit({ value })}>
          {t("Schätzung abgeben")}
        </Button>
      )}
    </div>
  );
}

/** Type the missing word. The question is the sentence with ___; options = [hint, format name]. */
function Blank({ item, pending, done, submit }: Props) {
  const t = useT();
  const [text, setText] = useState("");
  const [before, after] = item.question.split("___");
  const solved = done?.solution?.show;
  return (
    <form className="mt-5" onSubmit={(e) => { e.preventDefault(); if (text.trim() && !done) submit({ text }); }}>
      <p className="rounded-2xl bg-raised p-4 text-[17px] leading-relaxed">
        {before}
        <span className={`mx-1 inline-block min-w-16 border-b-2 px-1 text-center font-semibold ${done ? (done.correct ? "border-good text-good" : "border-bad text-bad") : "border-ink"}`}>{done && solved ? solved : text || " "}</span>
        {after}
      </p>
      {!done && (
        <>
          <div className="mt-3 flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} disabled={pending} maxLength={80} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder={item.options[0]} aria-label={t("Deine Antwort")} className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-[15px] outline-none focus:border-ink" />
            <Button type="submit" disabled={pending || !text.trim()}>{t("Prüfen")}</Button>
          </div>
        </>
      )}
      {done && !done.correct && text && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-bad">
          <X size={15} /> {t("Deine Antwort: {x}", { x: text })}
        </p>
      )}
      {done?.correct && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-good"><Check size={15} /> {solved ?? text}</p>}
    </form>
  );
}

/** The input for a question of one of the new formats. */
export default function FormatInput(props: Props) {
  if (props.item.kind === "order") return <Order {...props} />;
  if (props.item.kind === "estimate") return <Estimate {...props} />;
  return <Blank {...props} />;
}

export const FORMAT_LABEL: Record<string, string> = { order: "Bring es in die richtige Reihenfolge", estimate: "Schätz mal", blank: "Ergänze" };
