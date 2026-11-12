"use client";

import { useState } from "react";
import { Calculator, Check, X } from "lucide-react";
import CountryMap from "@/components/CountryMap";
import MatrixGrid, { MatrixCell } from "@/components/MatrixFigure";
import { makeExercise, type Exercise, type ExerciseKind } from "@/lib/exercises";
import { practised, stepOf } from "@/lib/skill";
import { useStore, useT } from "@/lib/store";

export const EXERCISE_NAMES: Record<ExerciseKind, string> = {
  arithmetic: "Kopfrechnen", percent: "Prozente", fraction: "Brüche", units: "Einheiten", sequence: "Zahlenreihe", weekday: "Wochentage", clock: "Uhrzeit", map: "Landkarte",
  sufficiency: "Reichen die Angaben?", word: "Textaufgabe", numbers: "Zahlen-Knobelei", knights: "Ehrlich oder gelogen?", syllogism: "Was folgt?", order: "Reihenfolge",
  code: "Code knacken", zebra: "Wer hat was?", conditional: "Wenn – dann", scales: "Waage", family: "Verwandtschaft",
  jugs: "Umfüllen", cube: "Würfel kippen", nim: "Streichholzspiel", directions: "Kompass", letters: "Buchstaben", oddone: "Was passt nicht?", crypt: "Buchstaben-Rechnung",
  matrix: "Muster ergänzen",
};
const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * A maths or logic exercise: tap an answer, see right away whether it fits and how it is worked out. Practice only – no
 * points, but the answer moves the learner's step for this kind (lib/skill.ts). When the card appears it is made again
 * at the current step, if that changed since the feed was put together. `daily`: one of the puzzles of the day –
 * `onDone` runs once it is answered.
 */
export default function ExerciseCard({ exercise: given, daily = false, onDone }: { exercise: Exercise; daily?: boolean; onDone?: (right: boolean) => void }) {
  const t = useT();
  const { getState, update } = useStore();
  const [exercise] = useState(() => {
    const s = getState();
    const fresh = makeExercise(given.id.slice(`ex-${given.kind}-`.length), given.kind, s.ageBand, s.settings.locale, stepOf(s, given.kind));
    return fresh.step === given.step ? given : fresh;
  });
  const [picked, setPicked] = useState<number | null>(null);
  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    update({ skill: practised(getState(), exercise.kind, i === exercise.correct ? "right" : "wrong") });
    onDone?.(i === exercise.correct);
  };
  const done = picked !== null;
  const right = picked === exercise.correct;
  const figures = exercise.figure?.options;
  const tone = (i: number) => (done && i === exercise.correct ? "border-good bg-good/10" : done && i === picked ? "border-bad bg-bad/10 shake" : done ? "border-line opacity-50" : "border-line bg-surface hover:border-ink/30");
  const badge = (i: number) => (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done && i === exercise.correct ? "bg-good text-white" : done && i === picked ? "bg-bad text-white" : "bg-raised text-muted"}`}>
      {done && i === exercise.correct ? <Check size={14} /> : done && i === picked ? <X size={14} /> : LETTERS[i]}
    </span>
  );
  return (
    <article className="card p-5" data-testid="exercise" data-kind={exercise.kind} data-step={exercise.step}>
      <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--math)" }}>
        <Calculator size={14} /> {daily ? t("Rätsel des Tages") : t("Übung")} · {t(EXERCISE_NAMES[exercise.kind])}
      </p>
      <h2 className={`font-display font-semibold tracking-tight whitespace-pre-line ${exercise.question.length > 140 ? "text-lg leading-snug" : "text-[1.45rem] leading-[1.2] text-balance"}`}>{exercise.question}</h2>
      {exercise.countries && <CountryMap countries={exercise.countries} zoom />}
      {exercise.figure && <MatrixGrid figure={exercise.figure} />}
      {figures ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {exercise.options.map((o, i) => (
            <button key={o} onClick={() => choose(i)} disabled={done && i !== picked && i !== exercise.correct} aria-label={`${LETTERS[i]}: ${o}`} data-testid="exercise-option"
              className={`press flex items-center gap-2 rounded-2xl border-2 p-2 ${tone(i)}`}>
              {badge(i)}
              <MatrixCell cell={figures[i]} className="h-20 w-20" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-2">
          {exercise.options.map((o, i) => (
            <button key={o} onClick={() => choose(i)} disabled={done && i !== picked && i !== exercise.correct} data-testid="exercise-option"
              className={`press flex min-h-12 items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left text-[15px] font-semibold tabular-nums ${tone(i)}`}>
              {badge(i)}
              {o}
            </button>
          ))}
        </div>
      )}
      {done && (
        <div className="rise mt-4 rounded-2xl bg-raised p-4" aria-live="polite" data-testid="exercise-result">
          <p className={`text-sm font-bold ${right ? "text-good" : "text-bad"}`}>{right ? t("Richtig!") : t("Nicht ganz.")}</p>
          <p className="mt-1 text-[15px] leading-relaxed tabular-nums">{exercise.explanation}</p>
        </div>
      )}
    </article>
  );
}
