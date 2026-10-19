"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Bookmark, Brain, Check, ChevronDown, Info, Lightbulb, RotateCcw } from "lucide-react";
import BookVisual from "@/components/books/Visual";
import HintButton from "@/components/HintButton";
import { track } from "@/lib/analytics";
import { EVIDENCE_HELP, EVIDENCE_NAME, FORMAT_NAME, rateRecall, type Book, type Idea } from "@/lib/books";
import { categoryById } from "@/lib/categories";
import { useStore, useT } from "@/lib/store";

/** The learner's book state: saved ideas, and for every idea recalled from memory when it is due again. */
export function useBookState() {
  const { state, update } = useStore();
  const books = state.books ?? { read: [], saved: [] };
  const toggleSaved = (id: string) => {
    if (!books.saved.includes(id)) track("content_save", id, "insight");
    update({ books: { ...books, saved: books.saved.includes(id) ? books.saved.filter((x) => x !== id) : [...books.saved, id] } });
  };
  /** The learner recalled the idea and says whether they knew it – this, not viewing, counts as learned. */
  const rate = (id: string, known: boolean) => {
    track(known ? "recall_known" : "recall_again", id, "insight");
    if (!books.read.includes(id)) track("insight_complete", id, "insight");
    update({ books: { ...books, read: books.read.includes(id) ? books.read : [...books.read, id], recall: { ...books.recall, [id]: rateRecall(books.recall?.[id], known) } } });
  };
  return { read: books.read, saved: books.saved, recall: books.recall ?? {}, rate, toggleSaved };
}

/** Our own cover: typography on the topic colour. No publisher artwork is used anywhere. */
export function BookCover({ book, size = "md" }: { book: Book; size?: "sm" | "md" | "lg" }) {
  const color = categoryById(book.topicId).color;
  const dims = size === "lg" ? "h-44 w-32 p-3.5" : size === "md" ? "h-28 w-20 p-2.5" : "h-11 w-8 p-1";
  return (
    <span aria-hidden className={`relative flex shrink-0 flex-col justify-between overflow-hidden rounded-lg text-white shadow-md ${dims}`} style={{ background: color }}>
      <span className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
      {size !== "sm" && (
        <>
          <span className={`font-display font-semibold leading-[1.1] ${size === "lg" ? "text-[17px]" : "text-[11px]"}`}>{book.title}</span>
          <span className={`font-semibold uppercase tracking-wide opacity-80 ${size === "lg" ? "text-[10px]" : "text-[7px]"}`}>{book.author.split(/[,(]/)[0]}</span>
        </>
      )}
    </span>
  );
}

const EVIDENCE_STYLE = { evidence: "text-good", thesis: "text-muted", debated: "text-bad" } as const;

/** Format and evidence level of an idea; a tap on the evidence level explains what it means. */
function Badges({ idea }: { idea: Idea }) {
  const t = useT();
  const [help, setHelp] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
        <span className="rounded-full bg-raised px-2.5 py-1">{t(FORMAT_NAME[idea.format])}</span>
        <button onClick={() => setHelp((v) => !v)} aria-expanded={help} className={`press flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 ${EVIDENCE_STYLE[idea.evidence]}`} data-testid="evidence">
          {t(EVIDENCE_NAME[idea.evidence])} <Info size={12} />
        </button>
      </div>
      {help && <p className="pop mt-1.5 text-xs leading-relaxed text-muted" role="status">{t(EVIDENCE_HELP[idea.evidence])}</p>}
    </div>
  );
}

/**
 * One idea from a book as a short lesson: a question to open, the idea with illustration and
 * example, then recalling it from memory (the answer stays hidden until asked for), applying it to
 * a new situation, and one sentence to keep. An idea the learner has recalled before starts with
 * the recall question – the explanation is only a tap away, but not in the way.
 * `standalone` (feed, search, saved): shows which book it comes from and links there.
 */
export default function InsightCard({ book, idea, standalone, index }: { book: Book; idea: Idea; standalone?: boolean; index?: number }) {
  const t = useT();
  const { saved, recall, rate, toggleSaved } = useBookState();
  const color = categoryById(book.topicId).color;
  const record = recall[idea.id];
  const [open, setOpen] = useState(!record); // explanation visible
  const [shown, setShown] = useState(false); // answer revealed
  const [rated, setRated] = useState<boolean | null>(null); // rated in this sitting
  const [choice, setChoice] = useState<number | null>(null);
  const isSaved = saved.includes(idea.id);
  const days = record ? Math.max(1, Math.round((Date.parse(record.due) - Date.parse(new Date().toISOString().slice(0, 10))) / 86_400_000)) : 0;
  const label = "mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider";
  const answer = (known: boolean) => {
    setRated(known);
    rate(idea.id, known);
  };
  return (
    <article className="card overflow-hidden" data-testid="insight-card" data-stage={rated !== null ? "done" : shown ? "rate" : "recall"}>
      <div className="space-y-3 p-5">
        {standalone ? (
          <Link href={`/books/?b=${book.id}`} className="press flex items-center gap-3">
            <BookCover book={book} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color }}>
                <BookOpen size={14} /> {record && rated === null ? t("Wiederholung") : t("Buch-Idee")}
              </span>
              <span className="block truncate text-xs text-muted">{book.author.split(/[,(]/)[0]} · {book.title}</span>
            </span>
          </Link>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{t("Idee {n}", { n: (index ?? 0) + 1 })}</p>
        )}
        <Badges idea={idea} />
        <p className="font-display text-lg italic leading-snug" style={{ color }}>{idea.hook}</p>
        <h2 className="font-display text-xl font-semibold leading-snug">{idea.title}</h2>
        {open ? (
          <>
            <p className="text-[15px] leading-relaxed">{idea.text}</p>
            {idea.visual && <BookVisual visual={idea.visual} color={color} />}
            <p className="rounded-2xl border border-line px-4 py-3 text-sm leading-relaxed">
              <span className="mb-0.5 block text-xs font-bold uppercase tracking-wider text-muted">{t("Beispiel")}</span>
              {idea.example}
            </p>
          </>
        ) : (
          <button onClick={() => setOpen(true)} className="press flex items-center gap-1 text-sm font-semibold text-muted">
            {t("Idee noch einmal lesen")} <ChevronDown size={16} />
          </button>
        )}

        <section className="rounded-2xl bg-raised p-4" aria-label={t("Aus dem Kopf")}>
          <p className={label} style={{ color }}><Brain size={14} /> {t("Aus dem Kopf")}</p>
          <p className="text-[15px] font-semibold leading-snug">{idea.recall.question}</p>
          {!shown ? (
            <>
              <p className="mt-1 text-xs text-muted">{t("Erst überlegen, dann aufdecken.")}</p>
              <button onClick={() => setShown(true)} className="press mt-3 h-11 w-full rounded-full bg-ink text-sm font-semibold text-bg">{t("Antwort zeigen")}</button>
            </>
          ) : (
            <div className="pop mt-2" role="status">
              <p className="text-sm leading-relaxed">{idea.recall.answer}</p>
              {rated === null ? (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold text-muted">{t("Hast du es gewusst?")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => answer(false)} className="press flex h-11 items-center justify-center gap-1.5 rounded-full border border-line bg-surface text-sm font-semibold"><RotateCcw size={15} /> {t("Noch nicht")}</button>
                    <button onClick={() => answer(true)} className="press flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-sm font-semibold text-bg"><Check size={16} /> {t("Gewusst")}</button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs font-semibold text-muted">
                  {!rated ? t("Kein Problem – genau dafür ist das da. Morgen fragen wir noch einmal.") : days === 1 ? t("Gut. Morgen fragen wir noch einmal.") : t("Gut. Wir fragen in {n} Tagen noch einmal.", { n: days })}
                </p>
              )}
            </div>
          )}
        </section>

        {rated !== null && idea.transfer && (
          <section className="pop rounded-2xl border border-line p-4" data-testid="transfer">
            <p className={label} style={{ color }}><ArrowRight size={14} /> {t("Übertrage es")}</p>
            <p className="text-sm leading-relaxed">{idea.transfer.situation}</p>
            <div className="mt-3 space-y-2">
              {idea.transfer.options.map(([option], i) => (
                <button key={option} onClick={() => setChoice(i)} aria-pressed={choice === i} className={`press w-full rounded-xl border bg-surface px-3.5 py-3 text-left text-sm font-semibold ${choice === i ? "border-ink" : "border-line"}`}>{option}</button>
              ))}
            </div>
            {choice !== null && (
              <p className="pop mt-3 text-sm leading-relaxed" role="status">
                {choice === idea.transfer.best && <span className="mb-0.5 block text-xs font-bold uppercase tracking-wider text-good">{t("Dazu rät die Idee")}</span>}
                {idea.transfer.options[choice][1]}
              </p>
            )}
          </section>
        )}

        {rated !== null && (
          <p className="pop flex gap-2 rounded-2xl px-4 py-3 text-sm font-semibold leading-relaxed text-white" style={{ background: color }} data-testid="takeaway">
            <Lightbulb size={17} className="mt-0.5 shrink-0" /> {idea.takeaway}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        <button onClick={() => toggleSaved(idea.id)} aria-label={isSaved ? t("Nicht mehr merken") : t("Merken")} aria-pressed={isSaved} className="press flex h-10 w-10 items-center justify-center rounded-full text-muted">
          <Bookmark size={19} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <HintButton kind="book" id={idea.id} />
        {record && (
          <span className="flex items-center gap-1 text-xs font-semibold text-good">
            <Check size={14} /> {t("{n}× abgerufen", { n: record.tries })}
          </span>
        )}
        <span className="flex-1" />
        {standalone && (
          <Link href={`/books/?b=${book.id}`} className="press flex items-center gap-1 text-sm font-semibold text-muted">
            {t("Zum Buch")} <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </article>
  );
}
