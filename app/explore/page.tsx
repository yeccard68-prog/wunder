"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Clapperboard, FlaskConical, Lightbulb, Play, Puzzle, Search, Shapes, Swords, Users, X, Zap } from "lucide-react";
import Feed from "@/components/Feed";
import { BookCover } from "@/components/books/InsightCard";
import { Empty, Ring } from "@/components/ui";
import { animationsFor } from "@/lib/animations";
import { booksFor } from "@/lib/books";
import { CATEGORIES, categoryById } from "@/lib/categories";
import { isChild } from "@/lib/content";
import { factsFor, rankFacts } from "@/lib/facts";
import type { FeedEntry } from "@/lib/feed";
import { useFlags } from "@/lib/flags";
import { mastery } from "@/lib/gamification";
import { freshFirst } from "@/lib/seen";
import { useStore, useT } from "@/lib/store";

const MAX_RESULTS = 60;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
/** A colour as a soft diagonal gradient (for tiles in the topic colours). */
const tint = (color: string) => `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 55%, #11100e))`;

/** A horizontal row of content with a title and a "see all" link. */
function Row({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  const t = useT();
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <Link href={href} className="press flex items-center gap-1 text-sm font-semibold text-muted">{t("Alle")} <ArrowRight size={15} /></Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">{children}</div>
    </section>
  );
}

/**
 * "Entdecken": search first; without a search a page that shows the content itself – today's picks, ways to play,
 * the topics with how much one already knows, and rows of clips, animations, books and facts.
 */
export default function ExplorePage() {
  const { items, clips, state, getState } = useStore();
  const t = useT();
  const flags = useFlags();
  const child = isChild(state.ageBand);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const animations = useMemo(() => animationsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  const books = useMemo(() => booksFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  const facts = useMemo(() => factsFor(state.settings.locale, state.ageBand), [state.settings.locale, state.ageBand]);
  // picked once per visit: new things first (lib/seen.ts), so the page changes as one explores
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const picks = useMemo(() => {
    const s = getState();
    return {
      fact: rankFacts(facts, s)[0],
      animations: freshFirst(animations, (a) => a.id, s, (a) => !!a.quizId && !!s.answers[a.quizId]).slice(0, 8),
      clips: freshFirst(clips, (c) => c.id, s, (c) => (s.clipStats[c.id]?.completed ?? 0) > 0).slice(0, 10),
      facts: rankFacts(facts, s).slice(1, 9),
      books: freshFirst(books, (b) => b.id, s, (b) => b.ideas.every((i) => s.books.read.includes(i.id))).slice(0, 10),
    };
  }, [facts, animations, clips, books]);

  const searching = query.trim().length >= 2 || topic !== null;
  const results = useMemo<FeedEntry[]>(() => {
    if (!searching) return [];
    const q = norm(query.trim());
    const hit = (cat: string, ...texts: (string | undefined)[]) => (!topic || cat === topic) && (q.length < 2 || texts.some((x) => x && norm(x).includes(q)));
    const quizIds = new Set(animations.map((a) => a.quizId));
    return [
      ...animations.filter((a) => hit(a.categoryId, a.title, a.summary)).map((animation): FeedEntry => ({ kind: "animation", animation })),
      ...clips.filter((c) => hit(c.categoryId, c.title, c.takeaway, c.description, c.tags.join(" "))).map((clip): FeedEntry => ({ kind: "clip", clip })),
      ...facts.filter((f) => hit(f.categoryId, f.text, f.detail)).map((fact): FeedEntry => ({ kind: "fact", fact })),
      ...books.flatMap((book) => book.ideas.filter((idea) => hit(book.topicId, book.title, book.original ?? "", book.author, idea.title)).map((idea): FeedEntry => ({ kind: "insight", book, idea }))),
      ...items.filter((i) => !quizIds.has(i.id) && hit(i.categoryId, i.question)).map((item): FeedEntry => ({ kind: "item", item, reason: "" })),
    ].slice(0, MAX_RESULTS);
  }, [searching, query, topic, items, clips, animations, books, facts]);

  const play = [
    ...(child ? [] : [{ href: "/duel/", Icon: Swords, title: t("Duell"), text: t("Freunde, Zufall oder Computer"), color: "var(--accent)" }]),
    { href: "/quiz/", Icon: Zap, title: t("Quiz"), text: t("Üben und Wiederholen"), color: "var(--tech)" },
    { href: "/riddles/", Icon: Puzzle, title: t("Rätsel"), text: t("{n} Knobelaufgaben", { n: items.filter((i) => i.hints?.length).length }), color: "var(--math)" },
  ];
  const featured = picks.animations[0];

  return (
    <div className="space-y-6">
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

      {searching ? (
        <>
          {topic && (
            <button onClick={() => setTopic(null)} className="press flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white" style={{ background: categoryById(topic).color }} data-testid="topic-filter">
              {t(categoryById(topic).name)} <X size={15} />
            </button>
          )}
          {results.length ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted" role="status">{results.length === MAX_RESULTS ? t("Die ersten {n} Treffer", { n: MAX_RESULTS }) : results.length === 1 ? t("1 Treffer") : t("{n} Treffer", { n: results.length })}</p>
              <Feed key={query + topic} entries={results} />
            </>
          ) : (
            <Empty icon={<Search size={22} />} title={t("Nichts gefunden")} text={t("Versuch es mit einem anderen Begriff oder wähle ein Thema.")} />
          )}
        </>
      ) : (
        <>
          {/* today: a fact to read now and an animation to watch */}
          <section className="grid gap-3 sm:grid-cols-2" aria-label={t("Heute entdecken")}>
            {picks.fact && (
              <Link href="/facts/" className="press relative flex min-h-44 flex-col justify-between overflow-hidden rounded-3xl p-5 text-white" style={{ background: tint(categoryById(picks.fact.categoryId).color) }} data-testid="explore-fact">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-90"><Lightbulb size={14} /> {t("Fakt des Tages")}</span>
                <span className="mt-3 font-display text-[1.35rem] font-semibold leading-[1.2] text-balance">{picks.fact.text}</span>
                <span className="mt-3 flex items-center gap-1 text-sm font-semibold opacity-90">{t("Mehr Fakten")} <ArrowRight size={15} /></span>
              </Link>
            )}
            {featured && (
              <Link href={`/explain/?a=${featured.id}`} className="press relative flex min-h-44 flex-col justify-between overflow-hidden rounded-3xl bg-ink p-5 text-bg">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-80"><Shapes size={14} /> {t("So funktioniert’s")}</span>
                <span className="mt-3 font-display text-[1.35rem] font-semibold leading-[1.2] text-balance">{featured.title}</span>
                <span className="mt-3 flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-ink"><Play size={15} fill="currentColor" /></span> {t("{n} Sekunden", { n: featured.seconds })}</span>
              </Link>
            )}
          </section>

          {/* ways to play */}
          <section>
            <h2 className="mb-2 font-display text-xl font-semibold">{t("Spielen")}</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {play.map(({ href, Icon, title, text, color }) => (
                <Link key={href} href={href} className="press flex aspect-[4/5] flex-col justify-between rounded-3xl p-3.5 text-white" style={{ background: tint(color) }}>
                  <Icon size={26} />
                  <span>
                    <span className="block font-display text-lg font-semibold leading-tight">{title}</span>
                    <span className="block text-[12px] leading-snug opacity-85">{text}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* topics with how much one knows already */}
          <section>
            <h2 className="mb-2 font-display text-xl font-semibold">{t("Themen")}</h2>
            <div className="grid grid-cols-2 gap-2.5" data-testid="explore-topics">
              {CATEGORIES.map((c) => {
                const m = mastery(items, state, c.id);
                return (
                  <button key={c.id} onClick={() => setTopic(c.id)} className="press card flex items-center gap-3 p-3 text-left">
                    <Ring value={m} size={44} stroke={4} color={c.color}>
                      <span className="tnum text-[11px] font-bold">{Math.round(m * 100)}%</span>
                    </Ring>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">{t(c.name)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {picks.clips.length > 0 && (
            <Row title={t("Clips")} href="/clips/">
              {picks.clips.map((c) => (
                <Link key={c.id} href={`/clips/?c=${c.id}`} className="press relative w-32 shrink-0 snap-start overflow-hidden rounded-2xl bg-[#11100e] text-white" style={{ aspectRatio: "9 / 16" }}>
                  {c.poster && <img src={c.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-8 text-[13px] font-semibold leading-snug">{c.title}</span>
                  <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50"><Clapperboard size={14} /></span>
                </Link>
              ))}
            </Row>
          )}

          {picks.animations.length > 1 && (
            <Row title={t("So funktioniert’s")} href="/explain/">
              {picks.animations.slice(1).map((a) => (
                <Link key={a.id} href={`/explain/?a=${a.id}`} className="press flex h-36 w-44 shrink-0 snap-start flex-col justify-between rounded-2xl p-3.5 text-white" style={{ background: tint(categoryById(a.categoryId).color) }}>
                  <Shapes size={20} />
                  <span className="font-display text-[15px] font-semibold leading-snug">{a.title}</span>
                </Link>
              ))}
            </Row>
          )}

          {picks.books.length > 0 && (
            <Row title={t("Bücher")} href="/books/">
              {picks.books.map((b) => (
                <Link key={b.id} href={`/books/?b=${b.id}`} className="press shrink-0 snap-start" aria-label={b.title}>
                  <BookCover book={b} size="lg" />
                </Link>
              ))}
            </Row>
          )}

          {picks.facts.length > 0 && (
            <Row title={t("Fakten")} href="/facts/">
              {picks.facts.map((f) => (
                <Link key={f.id} href="/facts/" className="press card flex w-60 shrink-0 snap-start flex-col justify-between gap-3 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: categoryById(f.categoryId).color }}>{t("Wusstest du?")}</span>
                  <span className="font-display text-[15px] font-semibold leading-snug">{f.text}</span>
                </Link>
              ))}
            </Row>
          )}

          {/* the rest, compact */}
          <section className="grid grid-cols-2 gap-2.5">
            <Link href="/lab/" className="press card flex items-center gap-2.5 p-3.5 text-sm font-semibold"><FlaskConical size={18} /> {t("Interaktiv")}</Link>
            <Link href="/books/" className="press card flex items-center gap-2.5 p-3.5 text-sm font-semibold"><BookOpen size={18} /> {t("Alle Bücher")}</Link>
            {!child && flags?.groups !== false && <Link href="/groups/" className="press card flex items-center gap-2.5 p-3.5 text-sm font-semibold"><Users size={18} /> {t("Gruppen")}</Link>}
            {!child && <Link href="/social/" className="press card flex items-center gap-2.5 p-3.5 text-sm font-semibold"><Users size={18} /> {t("Community")}</Link>}
          </section>
        </>
      )}
    </div>
  );
}
