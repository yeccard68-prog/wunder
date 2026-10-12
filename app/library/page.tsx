"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Bookmark, Check, RotateCcw, Shapes } from "lucide-react";
import Feed from "@/components/Feed";
import { Empty, Segmented } from "@/components/ui";
import { animationsFor } from "@/lib/animations";
import { bookProgress, booksFor } from "@/lib/books";
import { categoryById } from "@/lib/categories";
import type { FeedEntry } from "@/lib/feed";
import { dueReviews } from "@/lib/gamification";
import { useStore, useT } from "@/lib/store";

/** "Bibliothek": everything the learner wants to keep or come back to. */
export default function LibraryPage() {
  const { items, clips, state } = useStore();
  const t = useT();
  const [tab, setTab] = useState<"saved" | "paths">("saved");
  const animations = useMemo(() => animationsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  const books = useMemo(() => booksFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  const learned = books.reduce((n, b) => n + bookProgress(b, state), 0);
  const saved = useMemo<FeedEntry[]>(
    () => [...books.flatMap((book) => book.ideas.filter((i) => state.books?.saved.includes(i.id)).map((idea): FeedEntry => ({ kind: "insight", book, idea }))), ...clips.filter((c) => state.saves.includes(c.id)).map((clip): FeedEntry => ({ kind: "clip", clip })), ...items.filter((i) => state.saves.includes(i.id)).map((item): FeedEntry => ({ kind: "item", item, reason: "" }))],
    [items, clips, books, state.saves, state.books],
  );
  const due = dueReviews(items, state).length;
  const mistakes = Object.values(state.answers).filter((a) => !a.correct).length;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Bibliothek")}</h1>
      <Link href="/books/" className="press card flex items-center gap-4 p-4" data-testid="library-books">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-bg">
          <BookOpen size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold leading-tight">{t("Bücher")}</span>
          <span className="block text-sm text-muted">{learned ? t("{a} von {b} Ideen gelernt", { a: learned, b: books.reduce((n, b) => n + b.ideas.length, 0) }) : t("{n} Sachbücher, {m} Ideen zum Mitnehmen", { n: books.length, m: books.reduce((n, b) => n + b.ideas.length, 0) })}</span>
        </span>
        <ArrowRight size={18} className="text-muted" />
      </Link>
      <Segmented value={tab} onChange={setTab} options={[{ value: "saved", label: t("Gemerkt") + (saved.length ? ` · ${saved.length}` : "") }, { value: "paths", label: t("Weiterlernen") }]} />

      {tab === "saved" ? (
        saved.length ? (
          <Feed entries={saved} />
        ) : (
          <Empty icon={<Bookmark size={22} />} title={t("Noch nichts gemerkt")} text={t("Tippe bei einer Karte oder einem Clip auf das Lesezeichen – dann findest du sie hier wieder.")} />
        )
      ) : (
        <div className="space-y-3">
          <Link href="/quiz/" className="press card flex items-center gap-4 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised">
              <RotateCcw size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-semibold leading-tight">{t("Wiederholen")}</span>
              <span className="block text-sm text-muted">{due ? (due === 1 ? t("1 Wiederholung ist fällig") : t("{n} Wiederholungen sind fällig", { n: due })) : mistakes ? t("Gerade ist nichts fällig. Falsch beantwortete Karten kommen automatisch wieder.") : t("Hier landen Karten, die du noch einmal üben solltest.")}</span>
            </span>
            <ArrowRight size={18} className="text-muted" />
          </Link>
          <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("So funktioniert’s")}</p>
          {animations.map((a) => {
            const done = !!a.quizId && !!state.answers[a.quizId];
            const cat = categoryById(a.categoryId);
            return (
              <Link key={a.id} href="/explain/" className="press card flex items-center gap-4 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ background: cat.color }}>
                  {done ? <Check size={19} /> : <Shapes size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-tight">{a.title}</span>
                  <span className="block text-sm text-muted">{t(cat.name)} · {done ? t("Abgeschlossen") : t("{n} Schritte", { n: a.steps.length })}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
