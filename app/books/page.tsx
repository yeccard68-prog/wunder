"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, Check, Clock, ExternalLink, MessageCircleQuestion, Scale, Search, Shapes, Target, X } from "lucide-react";
import InsightCard, { BookCover, useBookState } from "@/components/books/InsightCard";
import KnowledgeCard from "@/components/KnowledgeCard";
import { Bar, Chip, Empty } from "@/components/ui";
import { track } from "@/lib/analytics";
import { animationsFor } from "@/lib/animations";
import { BOOK_CATEGORIES, bookProgress, booksFor, dueIdeas, recallStats, type Book } from "@/lib/books";
import { categoryById } from "@/lib/categories";
import { useStore, useT } from "@/lib/store";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function Row({ book, onOpen }: { book: Book; onOpen: () => void }) {
  const { state } = useStore();
  const t = useT();
  const done = bookProgress(book, state);
  const color = categoryById(book.topicId).color;
  return (
    <button onClick={onOpen} className="press card flex w-full items-stretch gap-4 p-4 text-left" data-testid="book-row">
      <BookCover book={book} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-lg font-semibold leading-tight">{book.title}</span>
        <span className="text-sm text-muted">{book.author} · {book.year}</span>
        <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{book.thesis}</span>
        <span className="mt-auto flex items-center gap-2 pt-2 text-xs font-semibold text-muted">
          {done === book.ideas.length ? <Check size={14} className="text-good" /> : <Clock size={13} />}
          {done ? t("{a} von {b} Ideen gelernt", { a: done, b: book.ideas.length }) : t("{n} Ideen · {m} Min.", { n: book.ideas.length, m: book.minutes })}
        </span>
        {done > 0 && done < book.ideas.length && <span className="mt-1.5 block"><Bar value={done / book.ideas.length} color={color} /></span>}
      </span>
    </button>
  );
}

function Detail({ book, books, open, back }: { book: Book; books: Book[]; open: (id: string) => void; back: () => void }) {
  const { items, state } = useStore();
  const t = useT();
  const color = categoryById(book.topicId).color;
  const quiz = book.quizId ? items.find((i) => i.id === book.quizId) : undefined;
  const done = bookProgress(book, state);
  const related = book.related.map((id) => books.find((b) => b.id === id)).filter((b): b is Book => !!b);
  // matching content elsewhere in the app – only what this learner may see
  const animations = useMemo(() => animationsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  const linkedAnimations = book.links.filter((l) => l.kind === "animation").map((l) => animations.find((a) => a.id === l.id)).filter((a) => !!a);
  const linkedQuestions = book.links.filter((l) => l.kind === "question").map((l) => items.find((i) => i.id === l.id)).filter((i) => !!i);
  const [question, setQuestion] = useState(0);
  return (
    <div className="space-y-5" data-testid="book-detail">
      <button onClick={back} className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
        <ArrowLeft size={18} /> {t("Alle Bücher")}
      </button>
      <header className="flex gap-4">
        <BookCover book={book} size="lg" />
        <div className="flex min-w-0 flex-col">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{t(BOOK_CATEGORIES.find((c) => c.id === book.category)?.name ?? "")}</p>
          <h1 className="font-display text-2xl font-semibold leading-tight">{book.title}</h1>
          <p className="mt-1 text-sm text-muted">{book.author}</p>
          <p className="text-sm text-muted">{book.original ? `${t("Original")}: ${book.original}, ${book.year}` : book.year}</p>
          <p className="mt-auto pt-2 text-xs font-semibold text-muted">{t("{a} von {b} Ideen gelernt", { a: done, b: book.ideas.length })} · {t("{m} Min.", { m: book.minutes })}</p>
          <span className="mt-1.5 block"><Bar value={done / book.ideas.length} color={color} /></span>
        </div>
      </header>

      <p className="flex gap-2.5 rounded-2xl bg-raised px-4 py-3 text-sm leading-relaxed" data-testid="book-goal">
        <Target size={17} className="mt-0.5 shrink-0" style={{ color }} />
        <span><span className="block text-xs font-bold uppercase tracking-wider text-muted">{t("Lernziel")}</span>{book.goal}</span>
      </p>
      <section className="card p-5">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t("Kernthese")}</p>
        <p className="font-display text-lg leading-snug">{book.thesis}</p>
      </section>

      {book.ideas.map((idea, i) => <InsightCard key={idea.id} book={book} idea={idea} index={i} />)}

      <section className="card space-y-2 p-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
          <Scale size={14} /> {t("Einordnung und Kritik")}
        </p>
        <p className="text-[15px] leading-relaxed">{book.limits}</p>
      </section>
      <section className="card space-y-2 p-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
          <MessageCircleQuestion size={14} /> {t("Zum Weiterdenken")}
        </p>
        <p className="font-display text-lg leading-snug">{book.reflect}</p>
      </section>

      {quiz && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("Wissens-Check")}</p>
          <KnowledgeCard item={quiz} />
        </section>
      )}

      {(linkedAnimations.length > 0 || linkedQuestions.length > 0) && (
        <section className="space-y-3" data-testid="book-links">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("Dazu in der App")}</p>
          {linkedAnimations.map((a) => (
            <Link key={a.id} href={`/explain/?a=${a.id}`} className="press card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised"><Shapes size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{t("Animation")}</span>
                <span className="block font-semibold leading-snug">{a.title}</span>
              </span>
            </Link>
          ))}
          {linkedQuestions.length > 0 && (
            <div>
              <KnowledgeCard key={linkedQuestions[question % linkedQuestions.length].id} item={linkedQuestions[question % linkedQuestions.length]} />
              {linkedQuestions.length > 1 && (
                <button onClick={() => setQuestion((n) => n + 1)} className="press mt-2 text-sm font-semibold text-muted">{t("Andere Frage zum Thema")}</button>
              )}
            </div>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("Passt dazu")}</p>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {related.map((r) => (
              <button key={r.id} onClick={() => open(r.id)} className="press flex w-32 shrink-0 flex-col gap-2 text-left">
                <BookCover book={r} size="lg" />
                <span className="text-xs font-semibold leading-tight">{r.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="space-y-1.5 text-xs leading-relaxed text-muted">
        {book.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 underline">
            {s.name} <ExternalLink size={12} />
          </a>
        ))}
        <p>{t("Eigene Zusammenfassung und Einordnung – kein Auszug aus dem Buch. Was der Autor behauptet und was Kritik daran ist, steht getrennt.")}</p>
        <p>{book.verification === "verified" ? t("Redaktionell geprüft") : t("Von KI geprüft, noch nicht redaktionell bestätigt.")}</p>
      </footer>
    </div>
  );
}

/** "Bücher": the shelf (search, sections, continue where you left off) and one book. */
export default function BooksPage() {
  const { state } = useStore();
  const t = useT();
  const books = useMemo(() => booksFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  const { saved } = useBookState();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  // a book can be opened directly: /books/?b=b-kahneman (links from the feed)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("b");
    if (id) setOpenId(id);
  }, []);
  const open = (id: string | null) => {
    if (id) track("book_open", id, "book");
    setOpenId(id);
    window.history.replaceState(null, "", id ? `?b=${id}` : window.location.pathname);
    window.scrollTo(0, 0);
  };

  const current = books.find((b) => b.id === openId);
  if (current) return <Detail book={current} books={books} open={open} back={() => open(null)} />;

  const q = norm(query.trim());
  const shown = books.filter((b) => (!category || b.category === category) && (q.length < 2 || [b.title, b.original ?? "", b.author, b.thesis, ...b.ideas.map((i) => i.title)].some((x) => norm(x).includes(q))));
  const started = books.filter((b) => {
    const n = bookProgress(b, state);
    return n > 0 && n < b.ideas.length;
  });
  const savedIdeas = books.flatMap((book) => book.ideas.filter((i) => saved.includes(i.id)).map((idea) => ({ book, idea })));
  const all = books.flatMap((book) => book.ideas.map((idea) => ({ book, idea })));
  const due = dueIdeas(state).map((id) => all.find((x) => x.idea.id === id)).filter((x) => !!x).slice(0, 5);
  const stats = recallStats(state);
  const browsing = q.length < 2 && !category;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Bücher")}</h1>
        <p className="text-sm text-muted">{t("Die wichtigsten Ideen einflussreicher Sachbücher – als kurze Lektionen mit Abruf und Wiederholung.")}</p>
      </header>
      <label className="flex h-12 items-center gap-2.5 rounded-2xl bg-surface px-4 shadow-sm ring-1 ring-line focus-within:ring-2 focus-within:ring-ink">
        <Search size={18} className="text-muted" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Titel, Autor oder Thema")} aria-label={t("Bücher durchsuchen")} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden" />
        {query && (
          <button onClick={() => setQuery("")} aria-label={t("Suche leeren")} className="press -mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-muted">
            <X size={17} />
          </button>
        )}
      </label>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {BOOK_CATEGORIES.filter((c) => books.some((b) => b.category === c.id)).map((c) => (
          <span key={c.id} className="shrink-0">
            <Chip active={category === c.id} onClick={() => setCategory(category === c.id ? null : c.id)}>{t(c.name)}</Chip>
          </span>
        ))}
      </div>

      {browsing && stats.recalled > 0 && (
        <section className="card grid grid-cols-3 gap-2 p-4 text-center" data-testid="recall-stats">
          <p><span className="tnum block text-xl font-bold">{stats.recalled}</span><span className="text-xs text-muted">{t("Ideen abgerufen")}</span></p>
          <p><span className="tnum block text-xl font-bold text-good">{stats.retained}</span><span className="text-xs text-muted">{t("nach Pause gewusst")}</span></p>
          <p><span className="tnum block text-xl font-bold">{stats.shaky}</span><span className="text-xs text-muted">{t("noch unsicher")}</span></p>
        </section>
      )}
      {browsing && due.length > 0 && (
        <section className="space-y-3" data-testid="recall-due">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><Brain size={14} /> {t("Heute wiederholen")} · {stats.due}</p>
          {due.map(({ book, idea }) => <InsightCard key={idea.id} book={book} idea={idea} standalone />)}
        </section>
      )}
      {browsing && started.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("Weiterlesen")}</p>
          {started.map((b) => <Row key={b.id} book={b} onOpen={() => open(b.id)} />)}
        </section>
      )}
      {browsing && savedIdeas.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("Gemerkte Ideen")}</p>
          {savedIdeas.map(({ book, idea }) => <InsightCard key={idea.id} book={book} idea={idea} standalone />)}
        </section>
      )}

      <section className="space-y-3">
        {browsing && <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("Alle Bücher")} · {books.length}</p>}
        {shown.length ? shown.map((b) => <Row key={b.id} book={b} onOpen={() => open(b.id)} />) : <Empty icon={<BookOpen size={22} />} title={t("Nichts gefunden")} text={t("Versuch es mit einem anderen Begriff oder wähle ein Thema.")} />}
      </section>
    </div>
  );
}
