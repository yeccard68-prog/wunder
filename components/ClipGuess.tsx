"use client";

import { useState } from "react";
import { Check, Clapperboard, HelpCircle, X } from "lucide-react";
import type { Clip } from "@/lib/content";
import { useStore, useT } from "@/lib/store";
import { Button } from "./ui";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
type Phase = "guess" | "watch" | "reveal" | "done";
export type ClipGuess = ReturnType<typeof useClipGuess>;

/**
 * „Erst raten, dann schauen“ (29.10.2026, the operator's choice after hints #31–33: the question used to come after the
 * clip, which had just shown the answer). A clip's question comes first, over the paused clip. The tip is the answer –
 * submitted at once, so it counts like any first answer – but its result waits until the clip has shown it.
 * guess (question over the paused clip) → watch (the clip plays) → reveal (result, at the end or on request) → done.
 */
export function useClipGuess(clip: Clip) {
  const { state, answer } = useStore();
  const quiz = clip.quiz;
  const [phase, setPhase] = useState<Phase>(() => (quiz && !state.answers[quiz.id] ? "guess" : "done"));
  const [tip, setTip] = useState<{ picked: number; correct: boolean; correctIndex: number; explanation: string } | null>(null);
  const [pending, setPending] = useState(false);
  const pick = async (i: number) => {
    if (!quiz || pending || phase !== "guess") return;
    setPending(true);
    const res = await answer(quiz, i, "video");
    setPending(false);
    if (!res) return; // not saved: the question stays and can be tried again
    setTip({ picked: i, correct: res.correct, correctIndex: res.correctIndex, explanation: res.explanation });
    setPhase("watch");
  };
  return {
    phase,
    tip,
    pending,
    pick,
    reveal: () => setPhase((p) => (p === "watch" ? "reveal" : p)),
    close: () => setPhase("done"),
    /** the clip runs while it is watched – not under its question or its result */
    playing: phase === "watch" || phase === "done",
    /** the key message waits until the result is shown */
    hideAnswer: !!quiz && phase !== "done",
  };
}

/** The question, asked before the clip; the options give nothing away until the clip has played. */
export function GuessPanel({ clip, guess, title }: { clip: Clip; guess: ClipGuess; title?: string }) {
  const t = useT();
  const quiz = clip.quiz;
  if (!quiz || guess.phase !== "guess") return null;
  return (
    <div className="space-y-3" data-testid="clip-guess">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
        <HelpCircle size={14} /> {t("Erst raten, dann schauen")}
      </p>
      {title && <p className="text-xs font-semibold text-muted">{title}</p>}
      <p className="font-display text-lg font-semibold leading-snug">{quiz.question}</p>
      <div className="space-y-2">
        {quiz.options.map((option, i) => (
          <button key={i} onClick={() => guess.pick(i)} disabled={guess.pending} className="press flex min-h-12 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-2 text-left text-[15px] font-medium disabled:opacity-60">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-bold text-muted">{LETTERS[i]}</span>
            {option}
          </button>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted">{t("Dein Tipp zählt als Antwort – der Clip zeigt dir danach, ob er stimmt.")}</p>
    </div>
  );
}

/** While the clip plays: the tip, and a way to the result without waiting for the end. */
export function TipChip({ clip, guess, light }: { clip: Clip; guess: ClipGuess; light?: boolean }) {
  const t = useT();
  if (!clip.quiz || guess.phase !== "watch" || !guess.tip) return null;
  return (
    <p className={`pointer-events-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${light ? "bg-black/60 text-white" : "bg-raised"}`} data-testid="clip-tip">
      <span className="min-w-0 flex-1 truncate">{t("Dein Tipp: {x}", { x: `${LETTERS[guess.tip.picked]} – ${clip.quiz.options[guess.tip.picked]}` })}</span>
      <button onClick={guess.reveal} className="press shrink-0 underline underline-offset-2">{t("Auflösung")}</button>
    </p>
  );
}

/** After the clip: was the tip right, why, and what the clip showed. */
export function RevealPanel({ clip, guess }: { clip: Clip; guess: ClipGuess }) {
  const t = useT();
  const quiz = clip.quiz;
  if (!quiz || guess.phase !== "reveal" || !guess.tip) return null;
  const { tip } = guess;
  return (
    <div className="space-y-3" data-testid="clip-reveal" aria-live="polite">
      <p className={`flex items-start gap-1.5 text-sm font-bold ${tip.correct ? "text-good" : "text-bad"}`}>
        {tip.correct ? <Check size={17} className="shrink-0" /> : <X size={17} className="shrink-0" />}
        {tip.correct ? t("Richtig getippt!") : t("Nicht ganz – richtig ist: {x}", { x: quiz.options[tip.correctIndex] })}
      </p>
      <p className="text-[15px] leading-relaxed">{tip.explanation}</p>
      <p className="flex gap-2 border-t border-line pt-2 text-sm leading-relaxed text-muted">
        <Clapperboard size={15} className="mt-0.5 shrink-0" />
        <span><span className="font-semibold">{t("Im Clip:")}</span> {clip.takeaway}</span>
      </p>
      {!tip.correct && <p className="text-xs text-muted">{t("Kommt später noch einmal.")}</p>}
      <Button className="w-full" onClick={guess.close}>{t("Weiter")}</Button>
    </div>
  );
}

/** Question or result as a panel over a full-screen clip (the clip stays visible above it). */
export function GuessOverlay({ clip, guess, title }: { clip: Clip; guess: ClipGuess; title?: string }) {
  if (guess.phase !== "guess" && guess.phase !== "reveal") return null;
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-black/45 p-3 text-ink" data-testid="clip-overlay">
      <div className="rise max-h-full w-full overflow-y-auto rounded-3xl bg-surface p-4 shadow-lg">
        <GuessPanel clip={clip} guess={guess} title={title} />
        <RevealPanel clip={clip} guess={guess} />
      </div>
    </div>
  );
}
