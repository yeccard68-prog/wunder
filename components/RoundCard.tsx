"use client";

import { useState } from "react";
import { ArrowRight, Layers } from "lucide-react";
import { roundName, type Round } from "@/lib/rounds";
import { useStore, useT } from "@/lib/store";
import KnowledgeCard from "./KnowledgeCard";
import { Button } from "./ui";

/**
 * Five questions of one template in one feed entry (lib/rounds.ts), question by question. The progress lives in the
 * answers, so a round left halfway goes on where it stopped; a finished one shows how it went.
 */
export default function RoundCard({ round }: { round: Round }) {
  const { state } = useStore();
  const t = useT();
  const { items } = round;
  const [idx, setIdx] = useState(() => {
    const i = items.findIndex((x) => !state.answers[x.id]);
    return i < 0 ? items.length : i;
  });
  const finished = idx >= items.length;
  const answered = !finished && !!state.answers[items[idx].id];
  const score = items.filter((x) => state.answers[x.id]?.correct).length;
  const shown = Math.min(idx + 1, items.length);

  return (
    <div data-testid="feed-round">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          <Layers size={14} /> {t("Runde: {topic}", { topic: t(roundName(round.template)) })}
        </span>
        <div className="flex flex-1 gap-1.5" aria-label={t("Frage {n} von {m}", { n: shown, m: items.length })}>
          {items.map((x, i) => {
            const a = state.answers[x.id];
            return <span key={x.id} className={`h-1.5 flex-1 rounded-full transition-colors ${a ? (a.correct ? "bg-good" : "bg-bad") : i === idx ? "bg-ink/40" : "bg-line"}`} />;
          })}
        </div>
        <span className="tnum text-xs font-semibold text-muted">{shown}/{items.length}</span>
      </div>
      {finished ? (
        <div className="card pop p-6 text-center" data-testid="round-result">
          <p className="tnum font-display text-4xl font-semibold">
            {score}
            <span className="text-xl text-muted">/{items.length}</span>
          </p>
          <p className="mt-2 font-display text-xl font-semibold">{score === items.length ? t("Makellos.") : score / items.length >= 0.6 ? t("Stark gemacht.") : t("Dranbleiben lohnt sich.")}</p>
          <p className="mt-1 text-sm text-muted">{score < items.length ? t("Was danebenging, kommt später noch einmal.") : t("Weiter geht es mit einem Wisch.")}</p>
        </div>
      ) : (
        <>
          <KnowledgeCard key={items[idx].id} item={items[idx]} onAnswered={() => {}} />
          {answered && (
            <Button onClick={() => setIdx(idx + 1)} className="rise mt-3 h-12 w-full" data-testid="round-next">
              {idx + 1 === items.length ? t("Ergebnis ansehen") : t("Nächste Frage")} <ArrowRight size={18} />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
