"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { Bar, Button } from "@/components/ui";
import { categoryById } from "@/lib/categories";
import { SECONDS_PER_QUESTION, type DuelAnswerResult, type DuelQuestion } from "@/lib/duel";
import type { useT } from "@/lib/store";

type T = ReturnType<typeof useT>;
const LETTERS = ["A", "B", "C", "D"];

/**
 * A run of questions against the clock – a duel round (3) or a group round (6). Online the server hands out
 * one question at a time and keeps the time (onOpen); the practice duel passes all questions up front.
 */
export function QuestionRound({ category, questions, start, count, onOpen, onAnswer, onDone, t }: {
  category: string | null;
  questions?: DuelQuestion[] | null;
  start: number; // questions already answered
  count: number;
  onOpen?: (idx: number) => Promise<{ question: DuelQuestion; secondsLeft: number }>;
  onAnswer: (idx: number, selected: number | null) => Promise<DuelAnswerResult>;
  onDone: () => void | Promise<void>;
  t: T;
}) {
  const [idx, setIdx] = useState(start);
  const [finishing, setFinishing] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<DuelAnswerResult | null>(null);
  const [pending, setPending] = useState(false);
  const [left, setLeft] = useState(SECONDS_PER_QUESTION);
  const sent = useRef(false);
  const revealRef = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState<{ idx: number; question: DuelQuestion } | null>(null);
  const q = opened?.idx === idx ? opened.question : onOpen ? undefined : questions?.[idx];
  useEffect(() => {
    if (!onOpen) return;
    let gone = false;
    onOpen(idx).then(
      ({ question, secondsLeft }) => {
        if (gone) return;
        setLeft(Math.max(0, Math.min(SECONDS_PER_QUESTION, secondsLeft)));
        setOpened({ idx, question });
      },
      () => {
        // older server without the one-by-one function: the question comes with the state
        const question = questions?.[idx];
        if (!gone && question) setOpened({ idx, question });
      }
    );
    return () => {
      gone = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const send = useCallback(
    async (selected: number | null) => {
      if (sent.current) return;
      sent.current = true;
      setPicked(selected);
      setPending(true);
      try {
        setResult(await onAnswer(idx, selected));
      } catch {
        sent.current = false; // let them try again
        setPicked(null);
      } finally {
        setPending(false);
      }
    },
    [idx, onAnswer]
  );
  // on a phone the explanation and the next button sit below the options
  useEffect(() => {
    if (result) revealRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [result]);
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  // the clock: when it runs out, the question counts as not answered
  useEffect(() => {
    if (result || pending || !q) return;
    const end = Date.now() + left * 1000;
    const timer = window.setInterval(() => {
      const rest = Math.max(0, (end - Date.now()) / 1000);
      setLeft(rest);
      if (rest === 0) {
        window.clearInterval(timer);
        void sendRef.current(null);
      }
    }, 100);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, result, pending, q?.id]);

  if (!q) return <p className="py-16 text-center text-sm text-muted" aria-busy>{t("Lädt")}</p>;
  const next = () => {
    if (idx + 1 >= count) {
      setFinishing(true);
      return void onDone();
    }
    sent.current = false;
    setIdx(idx + 1);
    setPicked(null);
    setResult(null);
    setLeft(SECONDS_PER_QUESTION);
  };
  const style = (i: number) => {
    if (!result) return pending ? (i === picked ? "border-ink/50 bg-raised animate-pulse" : "border-line opacity-50") : "border-line bg-surface hover:border-ink/30";
    if (i === result.correctIndex) return "border-good bg-good/10";
    if (i === picked) return "border-bad bg-bad/10 shake";
    return "border-line opacity-50";
  };
  const cat = category ? categoryById(category) : null;

  return (
    <section className="card p-5" data-testid="duel-question">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold">
        <span className="uppercase tracking-wider" style={{ color: cat?.color }}>{cat ? t(cat.name) : ""}</span>
        <span className="tnum text-muted">{t("Frage {n} von {m}", { n: idx + 1, m: count })}</span>
      </div>
      <div className="mb-4 flex items-center gap-2" aria-label={t("Noch {n} Sekunden", { n: Math.ceil(left) })}>
        <Clock size={14} className={left < 5 && !result ? "text-bad" : "text-muted"} />
        <div className="flex-1"><Bar value={left / SECONDS_PER_QUESTION} color={left < 5 ? "var(--bad)" : "var(--accent)"} /></div>
        <span className="tnum w-6 text-right text-xs font-semibold text-muted">{Math.ceil(left)}</span>
      </div>
      <h2 className="font-display text-[1.35rem] font-semibold leading-[1.2] tracking-tight text-balance">{q.question}</h2>
      <div className="mt-5 space-y-2.5">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => send(i)} disabled={!!result || pending} className={`press flex min-h-[3.25rem] w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left text-[15px] font-medium ${style(i)}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${result && i === result.correctIndex ? "bg-good text-white" : result && i === picked ? "bg-bad text-white" : "bg-raised text-muted"}`}>
              {result && i === result.correctIndex ? <Check size={14} /> : result && i === picked ? <X size={14} /> : LETTERS[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>
      {result && (
        <div ref={revealRef} className="rise mt-4 scroll-mb-24 rounded-2xl bg-raised p-4" aria-live="polite">
          <p className={`text-sm font-bold ${result.correct ? "text-good" : "text-bad"}`}>{result.correct ? t("Richtig!") : picked === null || result.late ? t("Zeit abgelaufen") : t("Leider falsch")}</p>
          <p className="mt-1 text-[15px] leading-relaxed">{result.explanation}</p>
          <Button className="mt-4 w-full" onClick={next} disabled={finishing}>
            {idx + 1 >= count ? t("Runde beenden") : t("Nächste Frage")}
          </Button>
        </div>
      )}
    </section>
  );
}
