"use client";

import { useState } from "react";
import { Bookmark, Check, Ellipsis, EyeOff, ExternalLink, Flag, Heart, Share2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { AnswerContext, Item } from "@/lib/types";
import { categoryById } from "@/lib/categories";
import { isChild } from "@/lib/content";
import { useStore, useT } from "@/lib/store";
import { Sheet } from "./ui";

const LEVELS = ["", "Leicht", "Mittel", "Schwer"];
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const isNew = (iso: string) => Date.now() - Date.parse(iso) < 4 * 86_400_000;

function SourceLine({ item }: { item: Item }) {
  const t = useT();
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
      {t("Quelle:")}
      {item.source.url ? (
        <a href={item.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-line underline-offset-2">
          {item.source.name} <ExternalLink size={11} />
        </a>
      ) : (
        item.source.name
      )}
    </p>
  );
}

interface Props {
  item: Item;
  reason?: string;
  /** Inside a quiz session: always answerable, no social actions. */
  onAnswered?: (correct: boolean) => void;
  context?: AnswerContext;
}

export default function KnowledgeCard({ item, reason, onAnswered, context = "feed" }: Props) {
  const { state, answer, toggle, hide, share } = useStore();
  const t = useT();
  const cat = categoryById(item.categoryId);
  const inSession = !!onAnswered;
  const prev = inSession ? undefined : state.answers[item.id];
  const [picked, setPicked] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; correctIndex: number; explanation: string } | null>(null);
  const [menu, setMenu] = useState(false);
  const isFact = item.kind === "fact";
  // The answer is only known after submitting (or from an earlier attempt).
  const reveal = result ?? (prev ? { correct: prev.correct, correctIndex: prev.correctIndex, explanation: prev.explanation } : null);
  const done = !!reveal;
  const liked = state.likes.includes(item.id);
  const saved = state.saves.includes(item.id);

  const pick = async (i: number) => {
    if (done || pending) return;
    setPicked(i);
    setPending(true);
    const res = await answer(item, i, context);
    setPending(false);
    if (!res) return setPicked(null); // not saved → let the user try again
    setResult(res);
    onAnswered?.(res.correct);
  };

  const optionStyle = (i: number) => {
    if (!reveal) return pending ? (i === picked ? "border-ink/50 bg-raised animate-pulse" : "border-line opacity-50") : "border-line bg-surface hover:border-ink/30";
    if (i === reveal.correctIndex) return "border-good bg-good/10";
    if (i === picked) return "border-bad bg-bad/10 shake";
    return "border-line opacity-50";
  };

  const shareText = isFact ? `„${item.question}“\n\n${t("Stimmt das? Finde es heraus – Wunder")}` : `${item.question}\n\n${t("Weißt du die Antwort? – Wunder")}`;

  return (
    <article className="card rise overflow-hidden">
      <div className="p-5 pb-4">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 uppercase tracking-wider" style={{ color: cat.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
            {t(cat.name)}
          </span>
          {!isFact && <span className="text-muted">· {t(LEVELS[item.difficulty])}</span>}
          {isNew(item.createdAt) && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-accent">{t("Neu")}</span>}
          {!inSession && (
            <button onClick={() => setMenu(true)} aria-label={t("Mehr Optionen")} className="press -my-2 -mr-2 ml-auto flex h-10 w-10 items-center justify-center rounded-full text-muted">
              <Ellipsis size={20} />
            </button>
          )}
        </div>

        {isFact && <p className="mb-1.5 font-display text-sm italic text-muted">{t("Stimmt das?")}</p>}
        <h2 className="font-display text-[1.45rem] font-semibold leading-[1.2] tracking-tight text-balance">{item.question}</h2>

        <div className={isFact ? "mt-5 grid grid-cols-2 gap-2.5" : "mt-5 space-y-2.5"}>
          {item.options.map((opt, i) => (
            <button key={i} onClick={() => pick(i)} disabled={done || pending} className={`press flex min-h-[3.25rem] w-full items-center rounded-2xl border py-2.5 text-left text-[15px] font-medium ${isFact ? "justify-center gap-2 whitespace-nowrap px-2" : "gap-3 px-3.5"} ${optionStyle(i)}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${reveal && i === reveal.correctIndex ? "bg-good text-white" : reveal && i === picked ? "bg-bad text-white" : "bg-raised text-muted"}`}>
                {reveal && i === reveal.correctIndex ? <Check size={14} /> : reveal && i === picked ? <X size={14} /> : isFact ? i === 0 ? <ThumbsUp size={13} /> : <ThumbsDown size={13} /> : LETTERS[i]}
              </span>
              {opt}
            </button>
          ))}
        </div>
        {reveal && (
          <div className="rise mt-4 rounded-2xl bg-raised p-4" aria-live="polite">
            <p className={`text-sm font-bold ${reveal.correct ? "text-good" : "text-bad"}`}>
              {isFact ? (reveal.correctIndex === 0 ? t("Stimmt wirklich. ") : t("Ein Mythos. ")) : ""}
              {reveal.correct ? (isFact ? t("Gut eingeschätzt!") : t("Richtig!")) : picked === null ? t("Beim letzten Mal falsch") : isFact ? t("Kommt später noch einmal.") : t("Nicht ganz – kommt später zur Wiederholung")}
            </p>
            <p className="mt-1 text-[15px] leading-relaxed">{reveal.explanation}</p>
            <SourceLine item={item} />
          </div>
        )}
      </div>

      {!inSession && (
        <footer className="flex items-center gap-1 border-t border-line px-3 py-1.5">
          <button onClick={() => toggle("likes", item)} aria-pressed={liked} aria-label={t("Gefällt mir")} className={`press flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${liked ? "text-accent" : "text-muted"}`}>
            <Heart size={19} fill={liked ? "currentColor" : "none"} className={liked ? "pop" : ""} />
            <span className="tnum">{item.popularity + (liked ? 1 : 0)}</span>
          </button>
          <button onClick={() => toggle("saves", item)} aria-pressed={saved} aria-label={t("Merken")} className={`press flex h-11 w-11 items-center justify-center rounded-full ${saved ? "text-ink" : "text-muted"}`}>
            <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
          </button>
          {!isChild(state.ageBand) && (
            <button onClick={() => share(shareText)} aria-label={t("Teilen")} className="press flex h-11 w-11 items-center justify-center rounded-full text-muted">
              <Share2 size={19} />
            </button>
          )}
          {reason && <span className="ml-auto truncate pr-2 text-xs text-muted">{reason}</span>}
        </footer>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={t("Diese Karte")}>
        <div className="space-y-2 pb-2">
          {reason && <p className="mb-3 rounded-2xl bg-raised p-3.5 text-sm text-muted">{t("Warum du das siehst: {reason}.", { reason: reason })}</p>}
          <button onClick={() => hide(item)} className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-raised px-4 text-left font-semibold">
            <EyeOff size={19} /> {t("Kein Interesse")}
          </button>
          <button onClick={() => hide(item, true)} className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-raised px-4 text-left font-semibold text-bad">
            <Flag size={19} /> {t("Fehler oder Problem melden")}
          </button>
        </div>
      </Sheet>
    </article>
  );
}
