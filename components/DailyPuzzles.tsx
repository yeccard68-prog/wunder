"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import PuzzleCard from "@/components/PuzzleCard";
import { Button } from "@/components/ui";
import type { Puzzle } from "@/lib/puzzles";
import { useT } from "@/lib/store";

/**
 * "Rätsel des Tages": three tricky puzzles before the feed starts, one after the other. Nobody gets stuck – a hint
 * fills in a cell, and "Lösung zeigen" counts as done too. `puzzles` = today's three, `open` = those not done yet.
 */
export default function DailyPuzzles({ puzzles, open, onFinished }: { puzzles: Puzzle[]; open: Puzzle[]; onFinished: () => void }) {
  const t = useT();
  const [queue] = useState(open);
  const [at, setAt] = useState(0);
  const [done, setDone] = useState(false);
  const current = queue[at];
  const number = puzzles.findIndex((p) => p.id === current?.id) + 1;
  const last = at === queue.length - 1;

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pb-8 pt-2" data-testid="daily-puzzles">
      <header className="mb-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent"><Sparkles size={14} /> {t("Bevor es losgeht")}</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">{t("Rätsel des Tages")}</h1>
        <div className="mt-2 flex items-center gap-2" aria-label={t("Rätsel {n} von {m}", { n: number, m: puzzles.length })}>
          {puzzles.map((p, k) => (
            <span key={p.id} className={`h-1.5 flex-1 rounded-full ${k < number - (done ? 0 : 1) || !queue.includes(p) ? "bg-accent" : k === number - 1 ? "bg-accent/40" : "bg-raised"}`} />
          ))}
        </div>
        <p className="mt-1 text-xs font-semibold text-muted" role="status">{t("Rätsel {n} von {m}", { n: number, m: puzzles.length })}</p>
      </header>
      {current && <PuzzleCard key={current.id} puzzle={current} daily onDone={() => setDone(true)} />}
      {done && (
        <Button className="mt-4 w-full" onClick={() => (last ? onFinished() : (setAt(at + 1), setDone(false)))} data-testid="daily-next">
          {last ? t("Zum Feed") : t("Nächstes Rätsel")} <ArrowRight size={18} />
        </Button>
      )}
    </div>
  );
}
