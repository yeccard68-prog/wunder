"use client";

import { useState } from "react";
import { Bookmark, Check, Clapperboard, Ellipsis, EyeOff, ExternalLink, Flag, Heart, Lightbulb, RotateCcw, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { track } from "@/lib/analytics";
import type { AnswerContext, Item } from "@/lib/types";
import { categoryById } from "@/lib/categories";
import { isChild } from "@/lib/content";
import { isFormat, type AnswerKey, type FormatResponse } from "@/lib/formats";
import FormatInput, { FORMAT_LABEL } from "./Formats";
import { reviewDue } from "@/lib/seen";
import { useStore, useT } from "@/lib/store";
import ShareImageButton from "./ShareImageButton";
import { HintSheet } from "./HintButton";
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
  /**
   * The question belongs to a clip: a wrong first try gets a hint and a second attempt instead of
   * the solution, and the feedback points back to the clip. note = what the clip says; rewatch = back to the clip.
   */
  clip?: { note: string; rewatch?: () => void; done?: (correct: boolean) => void }; // done: the question has its final answer
}

export default function KnowledgeCard({ item, reason, onAnswered, context = "feed", clip }: Props) {
  const { state, answer, firstTry, toggle, hide } = useStore();
  const [miss, setMiss] = useState<number | null>(null); // wrong first try on a clip question
  const [hintsShown, setHintsShown] = useState(0); // riddles: hints revealed so far
  const t = useT();
  const cat = categoryById(item.categoryId);
  const inSession = !!onAnswered;
  // an earlier answer is shown – unless the repetition is due: then the card asks again (decided once, when it appears)
  const [askAgain] = useState(() => reviewDue(state.answers[item.id]));
  const prev = inSession || askAgain ? undefined : state.answers[item.id];
  const [picked, setPicked] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; correctIndex: number; explanation: string; answer?: AnswerKey } | null>(null);
  const special = isFormat(item.kind); // order, estimate, blank: own input instead of options
  const [menu, setMenu] = useState(false);
  const [hint, setHint] = useState(false);
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
    if (clip && miss === null && item.kind === "question" && item.options.length >= 3 && !state.answers[item.id]) {
      if ((await firstTry(item, i)) === false) {
        track("clip_quiz_retry", item.id, "item");
        setMiss(i);
        setPicked(null);
        return setPending(false);
      }
    }
    const res = await answer(item, i, context);
    setPending(false);
    if (!res) return setPicked(null); // not saved → let the user try again
    setResult(res);
    onAnswered?.(res.correct);
    clip?.done?.(res.correct);
  };

  const respond = async (response: FormatResponse) => {
    if (done || pending) return;
    setPending(true);
    const res = await answer(item, 0, context, response);
    setPending(false);
    if (!res) return; // not saved → the input stays open
    setPicked(0);
    setResult(res);
    onAnswered?.(res.correct);
  };

  const optionStyle = (i: number) => {
    if (!reveal && i === miss) return "border-line opacity-40 line-through";
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
        {special && <p className="mb-1.5 font-display text-sm italic text-muted">{t(FORMAT_LABEL[item.kind])}</p>}
        {item.kind !== "blank" && <h2 className="font-display text-[1.45rem] font-semibold leading-[1.2] tracking-tight text-balance">{item.question}</h2>}

        {item.hints && item.hints.length > 0 && !reveal && (
          <div className="mt-3 space-y-2" data-testid="hints">
            {item.hints.slice(0, hintsShown).map((h, i) => (
              <p key={i} className="pop flex gap-2 rounded-xl bg-raised px-3 py-2 text-sm leading-relaxed"><Lightbulb size={15} className="mt-0.5 shrink-0" /> {h}</p>
            ))}
            {hintsShown < item.hints.length && (
              <button onClick={() => setHintsShown((n) => n + 1)} className="press flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-semibold">
                <Lightbulb size={15} /> {hintsShown === 0 ? t("Tipp") : t("Noch ein Tipp")} <span className="text-muted">{hintsShown + 1}/{item.hints.length}</span>
              </button>
            )}
          </div>
        )}
        {special && <FormatInput item={item} locale={state.settings.locale} pending={pending} done={reveal ? { correct: reveal.correct, solution: result?.answer } : null} submit={respond} />}
        <div className={special ? "hidden" : isFact ? "mt-5 grid grid-cols-2 gap-2.5" : "mt-5 space-y-2.5"}>
          {!special && item.options.map((opt, i) => (
            <button key={i} onClick={() => pick(i)} disabled={done || pending || i === miss} className={`press flex min-h-[3.25rem] w-full items-center rounded-2xl border py-2.5 text-left text-[15px] font-medium ${isFact ? "justify-center gap-2 whitespace-nowrap px-2" : "gap-3 px-3.5"} ${optionStyle(i)}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${reveal && i === reveal.correctIndex ? "bg-good text-white" : reveal && i === picked ? "bg-bad text-white" : "bg-raised text-muted"}`}>
                {reveal && i === reveal.correctIndex ? <Check size={14} /> : reveal && i === picked ? <X size={14} /> : isFact ? i === 0 ? <ThumbsUp size={13} /> : <ThumbsDown size={13} /> : LETTERS[i]}
              </span>
              {opt}
            </button>
          ))}
        </div>
        {clip && miss !== null && !reveal && (
          <div className="rise mt-4 rounded-2xl bg-raised p-4" role="status" data-testid="clip-hint">
            <p className="flex items-center gap-1.5 text-sm font-bold"><Lightbulb size={16} /> {t("Noch nicht – du hast einen zweiten Versuch.")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("Die Antwort steckt im Clip: Achte auf die Einblendungen am unteren Rand.")}</p>
            {clip.rewatch && (
              <button onClick={clip.rewatch} className="press mt-3 flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm font-semibold">
                <RotateCcw size={15} /> {t("Clip noch einmal ansehen")}
              </button>
            )}
          </div>
        )}
        {reveal && (
          <div className="rise mt-4 rounded-2xl bg-raised p-4" aria-live="polite">
            <p className={`text-sm font-bold ${reveal.correct ? "text-good" : "text-bad"}`}>
              {isFact ? (reveal.correctIndex === 0 ? t("Stimmt wirklich. ") : t("Ein Mythos. ")) : ""}
              {reveal.correct ? (isFact ? t("Gut eingeschätzt!") : miss !== null ? t("Richtig – im zweiten Anlauf!") : t("Richtig!")) : picked === null ? t("Beim letzten Mal falsch") : isFact ? t("Kommt später noch einmal.") : t("Nicht ganz – kommt später zur Wiederholung")}
            </p>
            <p className="mt-1 text-[15px] leading-relaxed">{reveal.explanation}</p>
            {clip && (
              <p className="mt-2 flex gap-2 border-t border-line pt-2 text-sm leading-relaxed text-muted">
                <Clapperboard size={15} className="mt-0.5 shrink-0" />
                <span><span className="font-semibold">{t("Im Clip:")}</span> {clip.note}</span>
              </p>
            )}
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
            <ShareImageButton className="h-11 w-11" fileName={`${item.id}.png`} text={shareText}
              card={{ kicker: `${isFact ? t("Stimmt das?") : t("Weißt du es?")} · ${t(categoryById(item.categoryId).name)}`, title: isFact ? `„${item.question}“` : item.question, detail: item.kind !== "question" ? undefined : item.options.map((o, i) => `${"ABCD"[i]})  ${o}`), footer: t("Antwort und Quelle in der App"), color: categoryById(item.categoryId).color }} />
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
          <button onClick={() => { setMenu(false); setHint(true); }} data-testid="hint-button" className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-raised px-4 text-left font-semibold">
            <Flag size={19} /> {t("Hinweis an die Redaktion")}
          </button>
        </div>
      </Sheet>
      <HintSheet kind="question" id={item.id} open={hint} onClose={() => setHint(false)} />
    </article>
  );
}
