"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Clapperboard, Search, Shapes, Swords, Users, X, Zap, FlaskConical, Puzzle } from "lucide-react";
import Feed from "@/components/Feed";
import { Chip, Empty } from "@/components/ui";
import { animationsFor } from "@/lib/animations";
import { booksFor } from "@/lib/books";
import { CATEGORIES } from "@/lib/categories";
import { isChild } from "@/lib/content";
import type { FeedEntry } from "@/lib/feed";
import { useStore, useT } from "@/lib/store";

const MAX_RESULTS = 60;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** "Entdecken": search, topics and the collections (quiz rounds, clips, animations). */
export default function ExplorePage() {
  const { items, clips, state } = useStore();
  const t = useT();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const animations = useMemo(() => animationsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  const books = useMemo(() => booksFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, items.filter((i) => i.categoryId === c.id).length + clips.filter((x) => x.categoryId === c.id).length + animations.filter((a) => a.categoryId === c.id).length])), [items, clips, animations]);

  const searching = query.trim().length >= 2 || topic !== null;
  const results = useMemo<FeedEntry[]>(() => {
    if (!searching) return [];
    const q = norm(query.trim());
    const hit = (cat: string, ...texts: (string | undefined)[]) => (!topic || cat === topic) && (q.length < 2 || texts.some((x) => x && norm(x).includes(q)));
    const quizIds = new Set(animations.map((a) => a.quizId));
    return [
      ...animations.filter((a) => hit(a.categoryId, a.title, a.summary)).map((animation): FeedEntry => ({ kind: "animation", animation })),
      ...clips.filter((c) => hit(c.categoryId, c.title, c.takeaway, c.description, c.tags.join(" "))).map((clip): FeedEntry => ({ kind: "clip", clip })),
      ...books.flatMap((book) => book.ideas.filter((idea) => hit(book.topicId, book.title, book.original ?? "", book.author, idea.title)).map((idea): FeedEntry => ({ kind: "insight", book, idea }))),
      ...items.filter((i) => !quizIds.has(i.id) && hit(i.categoryId, i.question)).map((item): FeedEntry => ({ kind: "item", item, reason: "" })),
    ].slice(0, MAX_RESULTS);
  }, [searching, query, topic, items, clips, animations, books]);

  const collections = [
    { href: "/books/", Icon: BookOpen, title: t("Bücher"), text: t("{n} Sachbücher, {m} Ideen zum Mitnehmen", { n: books.length, m: books.reduce((s, b) => s + b.ideas.length, 0) }) },
    { href: "/quiz/", Icon: Zap, title: t("Quiz-Runden"), text: t("Daily Challenge, Wiederholung und Üben nach Thema") },
    ...(isChild(state.ageBand) ? [] : [{ href: "/duel/", Icon: Swords, title: t("Duell"), text: t("Drei Runden gegen Freunde oder Zufallsgegner") }]),
    { href: "/riddles/", Icon: Puzzle, title: t("Rätsel"), text: t("{n} Knobelaufgaben mit Tipps", { n: items.filter((i) => i.hints?.length).length }) },
    { href: "/explain/", Icon: Shapes, title: t("So funktioniert’s"), text: t("{n} Animationen zum Durchklicken", { n: animations.length }) },
    { href: "/lab/", Icon: FlaskConical, title: t("Interaktiv"), text: t("Diagramme und Modelle zum Selbst-Verändern") },
    { href: "/clips/", Icon: Clapperboard, title: t("Alle Clips"), text: t("{n} kurze Videos im Vollbild", { n: clips.length }) },
    ...(isChild(state.ageBand) ? [] : [{ href: "/social/", Icon: Users, title: t("Community"), text: t("Freunde, Ranglisten und Challenges") }]),
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Entdecken")}</h1>
      <label className="flex h-12 items-center gap-2.5 rounded-2xl bg-surface px-4 shadow-sm ring-1 ring-line focus-within:ring-2 focus-within:ring-ink">
        <Search size={18} className="text-muted" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Suche nach Themen, Fragen, Clips")} aria-label={t("Suche")} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden" />
        {query && (
          <button onClick={() => setQuery("")} aria-label={t("Suche leeren")} className="press -mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-muted">
            <X size={17} />
          </button>
        )}
      </label>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.filter((c) => counts[c.id] > 0).map((c) => (
          <Chip key={c.id} active={topic === c.id} color={c.color} onClick={() => setTopic(topic === c.id ? null : c.id)}>
            {t(c.name)} <span className="tnum opacity-60">{counts[c.id]}</span>
          </Chip>
        ))}
      </div>

      {searching ? (
        results.length ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted" role="status">{results.length === MAX_RESULTS ? t("Die ersten {n} Treffer", { n: MAX_RESULTS }) : results.length === 1 ? t("1 Treffer") : t("{n} Treffer", { n: results.length })}</p>
            <Feed key={query + topic} entries={results} />
          </>
        ) : (
          <Empty icon={<Search size={22} />} title={t("Nichts gefunden")} text={t("Versuch es mit einem anderen Begriff oder wähle ein Thema.")} />
        )
      ) : (
        <div className="space-y-3">
          {collections.map(({ href, Icon, title, text }) => (
            <Link key={href} href={href} className="press card flex items-center gap-4 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised">
                <Icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold leading-tight">{title}</span>
                <span className="block text-sm text-muted">{text}</span>
              </span>
              <ArrowRight size={18} className="text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
