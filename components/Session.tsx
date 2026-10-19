"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Share2, X } from "lucide-react";
import type { Item } from "@/lib/types";
import { challengeScore, type Person } from "@/lib/people";
import { today } from "@/lib/gamification";
import { useStore, useT } from "@/lib/store";
import KnowledgeCard from "./KnowledgeCard";
import { Avatar, Button, Ring } from "./ui";

export type SessionMode = "practice" | "review" | "challenge";

interface Props {
  title: string;
  items: Item[];
  mode: SessionMode;
  opponent?: Person;
  onExit: () => void;
}

/** One quiz round: question by question, then a shareable result. */
export default function Session({ title, items, mode, opponent, onExit }: Props) {
  const { state, recordChallenge, share } = useStore();
  const t = useT();
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [startXp] = useState(state.xp);
  const [theirs, setTheirs] = useState<number | null>(null);
  const recorded = useRef(false);
  const finished = idx >= items.length;
  const score = results.filter(Boolean).length;

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    if (mode === "challenge" && opponent) {
      const t = challengeScore(opponent, items, today());
      setTheirs(t);
      recordChallenge(opponent.id, score, t);
    }
  }, [finished, mode, opponent, items, score, recordChallenge]);

  if (finished) {
    const gained = state.xp - startXp;
    const ratio = score / items.length;
    const headline =
      mode === "challenge" && theirs !== null
        ? score > theirs ? t("Gewonnen!") : score === theirs ? t("Unentschieden") : t("Knapp daneben")
        : ratio === 1 ? t("Makellos.") : ratio >= 0.6 ? t("Stark gemacht.") : t("Dranbleiben lohnt sich.");
    const shareText =
      mode === "challenge" && opponent
        ? t("Ich habe {name} auf Wunder herausgefordert: {a}:{b}. Wer traut sich?", { name: opponent.name.split(" ")[0], a: score, b: theirs ?? 0 })
        : t("{title} auf Wunder: {a}/{b} richtig. Schaffst du mehr?", { title, a: score, b: items.length });
    return (
      <div className="card pop mt-4 p-7 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
        {mode === "challenge" && opponent && theirs !== null ? (
          <div className="my-6 flex items-center justify-center gap-5">
            <div>
              <Avatar name={state.username} color="var(--accent)" size={56} />
              <p className="tnum mt-2 font-display text-4xl font-semibold">{score}</p>
            </div>
            <span className="font-display text-xl italic text-muted">vs</span>
            <div>
              <Avatar name={opponent.name} color={opponent.color} size={56} />
              <p className="tnum mt-2 font-display text-4xl font-semibold">{theirs}</p>
            </div>
          </div>
        ) : (
          <div className="my-6 flex justify-center">
            <Ring value={ratio} size={132} stroke={9} color={ratio >= 0.6 ? "var(--good)" : "var(--accent)"}>
              <span className="tnum font-display text-4xl font-semibold">
                {score}
                <span className="text-xl text-muted">/{items.length}</span>
              </span>
            </Ring>
          </div>
        )}
        <h2 className="font-display text-3xl font-semibold tracking-tight">{headline}</h2>
        <p className="mt-2 text-muted">
          {gained > 0 ? <span className="font-semibold text-accent">+{gained} XP</span> : t("Übungsrunde – XP gibt es für neue Fragen und fällige Wiederholungen.")}
          {results.includes(false) && t(" Falsche Antworten kommen zur Wiederholung.")}
        </p>
        <div className="mt-7 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => share(shareText)}>
            <Share2 size={17} /> {t("Teilen")}
          </Button>
          <Button className="flex-1" onClick={onExit}>
            {t("Fertig")}
          </Button>
        </div>
      </div>
    );
  }

  const answered = results.length > idx;
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onExit} aria-label={t("Runde beenden")} className="press -ml-2 flex h-10 w-10 items-center justify-center rounded-full text-muted">
          <X size={20} />
        </button>
        <div className="flex flex-1 gap-1.5" aria-label={`Frage ${idx + 1} von ${items.length}`}>
          {items.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < results.length ? (results[i] ? "bg-good" : "bg-bad") : i === idx ? "bg-ink/40" : "bg-line"}`} />
          ))}
        </div>
        <span className="tnum text-xs font-semibold text-muted">
          {idx + 1}/{items.length}
        </span>
      </div>
      <KnowledgeCard key={items[idx].id} item={items[idx]} context={mode === "practice" ? "quiz" : mode} onAnswered={(c) => setResults((r) => [...r, c])} />
      {answered && (
        <Button onClick={() => setIdx(idx + 1)} className="rise mt-4 h-14 w-full text-base">
          {idx + 1 === items.length ? t("Ergebnis ansehen") : t("Weiter")} <ArrowRight size={18} />
        </Button>
      )}
    </>
  );
}
