"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Puzzle } from "lucide-react";
import Feed from "@/components/Feed";
import ExerciseCard from "@/components/ExerciseCard";
import PuzzleCard from "@/components/PuzzleCard";
import { Empty } from "@/components/ui";
import type { FeedEntry } from "@/lib/feed";
import { exercisesFor } from "@/lib/exercises";
import { feedPuzzles } from "@/lib/puzzles";
import { useStore, useT } from "@/lib/store";

/** "Rätsel": grid puzzles (sudoku, crossword, pyramid) that are nearly done, then logic riddles with hints, open ones first. */
export default function RiddlesPage() {
  const { items, state, getState } = useStore();
  const [more, setMore] = useState(3);
  const [exCount, setExCount] = useState(4);
  const [exSeed] = useState(() => String(Date.now()));
  const exercises = useMemo(() => exercisesFor(state.ageBand, state.settings.locale, exCount, exSeed), [state.ageBand, state.settings.locale, exCount, exSeed]);
  // fixed while the page is open: a solved puzzle stays where it is
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const done = useMemo(() => new Set(getState().puzzles?.done ?? []), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const grids = useMemo(() => feedPuzzles(items, getState(), more + done.size).filter((p) => !done.has(p.id)).slice(0, more), [items.length, more]);
  const t = useT();
  const riddles = useMemo(() => items.filter((i) => i.hints?.length).sort((a, b) => a.difficulty - b.difficulty), [items]);
  // the order is fixed when the page opens, so a solved riddle does not jump away under the finger
  const entries = useMemo<FeedEntry[]>(
    () => [...riddles.filter((i) => !state.answers[i.id]), ...riddles.filter((i) => state.answers[i.id])].map((item) => ({ kind: "item", item, reason: "" })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [riddles]
  );
  const solved = riddles.filter((i) => state.answers[i.id]?.correct).length;

  return (
    <div className="space-y-4">
      <Link href="/explore/" className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
        <ArrowLeft size={18} /> {t("Zurück zu Entdecken")}
      </Link>
      <header>
        <h1 className="font-display text-3xl font-semibold leading-tight">{t("Rätsel")}</h1>
        <p className="text-sm text-muted">{t("Knobelaufgaben zum Selbst-Denken. Wenn du feststeckst, hilft ein Tipp nach dem anderen – ohne die Lösung zu verraten.")}</p>
        {riddles.length > 0 && <p className="mt-2 text-xs font-semibold text-muted" role="status">{t("{n} von {m} gelöst", { n: solved, m: riddles.length })}</p>}
      </header>
      <section className="space-y-4" aria-label={t("Gitterrätsel")}>
        {grids.map((p) => <PuzzleCard key={p.id} puzzle={p} />)}
        <button onClick={() => setMore((m) => m + 3)} className="press w-full rounded-full bg-raised py-3 text-sm font-semibold" data-testid="more-puzzles">{t("Mehr Gitterrätsel")}</button>
      </section>
      <section className="space-y-4" aria-label={t("Übungen")}>
        <h2 className="font-display text-xl font-semibold">{t("Übungen")}</h2>
        {exercises.map((e) => <ExerciseCard key={e.id} exercise={e} />)}
        <button onClick={() => setExCount((n) => n + 4)} className="press w-full rounded-full bg-raised py-3 text-sm font-semibold" data-testid="more-exercises">{t("Mehr Übungen")}</button>
      </section>
      {entries.length ? <Feed entries={entries} /> : <Empty icon={<Puzzle size={22} />} title={t("Noch keine Rätsel")} text={t("Neue Rätsel folgen.")} />}
    </div>
  );
}
