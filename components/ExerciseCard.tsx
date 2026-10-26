"use client";

import { useState } from "react";
import { Calculator, Check, X } from "lucide-react";
import type { Exercise } from "@/lib/exercises";
import { useT } from "@/lib/store";

const NAMES = { arithmetic: "Kopfrechnen", percent: "Prozente", fraction: "Brüche", units: "Einheiten", sequence: "Zahlenreihe", weekday: "Wochentage", clock: "Uhrzeit" } as const;
const LETTERS = ["A", "B", "C", "D"];

/** A maths or logic exercise: tap an answer, see right away whether it fits and how it is worked out. Practice only – no points. */
export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  const right = picked === exercise.correct;
  return (
    <article className="card p-5" data-testid="exercise" data-kind={exercise.kind}>
      <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--math)" }}>
        <Calculator size={14} /> {t("Übung")} · {t(NAMES[exercise.kind])}
      </p>
      <h2 className="font-display text-[1.45rem] font-semibold leading-[1.2] tracking-tight text-balance">{exercise.question}</h2>
      <div className="mt-5 grid gap-2">
        {exercise.options.map((o, i) => (
          <button key={o} onClick={() => !done && setPicked(i)} disabled={done && i !== picked && i !== exercise.correct} data-testid="exercise-option"
            className={`press flex min-h-12 items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left text-[15px] font-semibold tabular-nums ${done && i === exercise.correct ? "border-good bg-good/10" : done && i === picked ? "border-bad bg-bad/10 shake" : done ? "border-line opacity-50" : "border-line bg-surface hover:border-ink/30"}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done && i === exercise.correct ? "bg-good text-white" : done && i === picked ? "bg-bad text-white" : "bg-raised text-muted"}`}>
              {done && i === exercise.correct ? <Check size={14} /> : done && i === picked ? <X size={14} /> : LETTERS[i]}
            </span>
            {o}
          </button>
        ))}
      </div>
      {done && (
        <div className="rise mt-4 rounded-2xl bg-raised p-4" aria-live="polite" data-testid="exercise-result">
          <p className={`text-sm font-bold ${right ? "text-good" : "text-bad"}`}>{right ? t("Richtig!") : t("Nicht ganz.")}</p>
          <p className="mt-1 text-[15px] leading-relaxed tabular-nums">{exercise.explanation}</p>
        </div>
      )}
    </article>
  );
}
