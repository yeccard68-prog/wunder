"use client";

import { useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import ExerciseCard, { EXERCISE_NAMES } from "@/components/ExerciseCard";
import PuzzleCard, { PUZZLE_NAMES } from "@/components/PuzzleCard";
import { Button } from "@/components/ui";
import type { DailyTask } from "@/lib/daily";
import { today } from "@/lib/gamification";
import { puzzleState } from "@/lib/puzzles";
import { useStore, useT } from "@/lib/store";

/**
 * "Rätsel des Tages": three tasks before the feed starts, one after the other – a logic question, a brain teaser and
 * a grid puzzle, a different mix every day (lib/daily.ts). Nobody gets stuck: a question is done once it is answered
 * (right or wrong), a grid puzzle has hints, and "Lösung zeigen" counts as done too. `tasks` = today's three,
 * `open` = those not done yet.
 */
export default function DailyPuzzles({ tasks, open, onFinished }: { tasks: DailyTask[]; open: DailyTask[]; onFinished: () => void }) {
  const t = useT();
  const { getState, update } = useStore();
  const [queue] = useState(open);
  const [at, setAt] = useState(0);
  const [done, setDone] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = queue[at];
  const number = tasks.findIndex((p) => p.id === current?.id) + 1;
  const last = at === queue.length - 1;
  const name = (task: DailyTask) => t(task.puzzle ? PUZZLE_NAMES[task.puzzle.kind] : EXERCISE_NAMES[task.exercise.kind]);
  // a question counts as done for today once it is answered (grid puzzles mark themselves – components/PuzzleCard.tsx)
  const answered = (id: string) => {
    const st = puzzleState(getState()), date = today();
    const todays = st.daily.date === date ? st.daily.done : [];
    update({ puzzles: { ...st, daily: { date, done: [...todays.filter((x) => x !== id), id] } } });
    setDone(true);
  };

  return (
    <div ref={box} className="no-scrollbar h-full overflow-y-auto px-4 pb-8 pt-2" data-testid="daily-puzzles">
      <header className="mb-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent"><Sparkles size={14} /> {t("Bevor es losgeht")}</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">{t("Rätsel des Tages")}</h1>
        <p className="mt-1 text-sm text-muted" data-testid="daily-kinds">{t("Heute")}: {tasks.map(name).join(" · ")}</p>
        <div className="mt-2 flex items-center gap-2" aria-label={t("Rätsel {n} von {m}", { n: number, m: tasks.length })}>
          {tasks.map((p, k) => (
            <span key={p.id} className={`h-1.5 flex-1 rounded-full ${k < number - (done ? 0 : 1) || !queue.includes(p) ? "bg-accent" : k === number - 1 ? "bg-accent/40" : "bg-raised"}`} />
          ))}
        </div>
        <p className="mt-1 text-xs font-semibold text-muted" role="status">{t("Rätsel {n} von {m}", { n: number, m: tasks.length })}</p>
      </header>
      {current?.puzzle && <PuzzleCard key={current.id} puzzle={current.puzzle} daily onDone={() => setDone(true)} />}
      {current?.exercise && <ExerciseCard key={current.id} exercise={current.exercise} daily onDone={() => answered(current.id)} />}
      {done && (
        <Button className="mt-4 w-full" onClick={() => (last ? onFinished() : (setAt(at + 1), setDone(false), box.current?.scrollTo({ top: 0 })))} data-testid="daily-next">
          {last ? t("Zum Feed") : t("Nächstes Rätsel")} <ArrowRight size={18} />
        </Button>
      )}
    </div>
  );
}
