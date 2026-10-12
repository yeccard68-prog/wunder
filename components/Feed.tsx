"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bookmark, ChevronDown, Clapperboard, HelpCircle, Shapes } from "lucide-react";
import AnimationPlayer from "@/components/anim/AnimationPlayer";
import ClipPlayer from "@/components/ClipPlayer";
import { Sheet } from "@/components/ui";
import type { Animation } from "@/lib/animations";
import { categoryById } from "@/lib/categories";
import type { Clip } from "@/lib/content";
import { entryId, type FeedEntry } from "@/lib/feed";
import { useStore, useT } from "@/lib/store";
import KnowledgeCard from "./KnowledgeCard";

const PAGE = 6;

/** True while at least `ratio` of the element is on screen; `near` already a screen earlier. */
function useOnScreen(ratio: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const a = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: ratio });
    const n = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "100% 0px" });
    a.observe(el);
    n.observe(el);
    return () => {
      a.disconnect();
      n.disconnect();
    };
  }, [ratio]);
  return { ref, active, near };
}

function Kicker({ categoryId, icon, label, light }: { categoryId: string; icon: ReactNode; label: string; light?: boolean }) {
  const t = useT();
  const cat = categoryById(categoryId);
  return (
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: light ? "#fff" : cat.color }}>
      {icon} {label} · {t(cat.name)}
    </p>
  );
}

function useAutoplay() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setOk(!window.matchMedia("(prefers-reduced-motion: reduce)").matches && !saveData);
  }, []);
  return ok;
}

/**
 * A clip as a feed entry: plays muted while it is on screen. `fill` = the clip takes the whole
 * feed screen with its text on top (snap feed); otherwise it is a card with the text below.
 */
export function ClipCard({ clip, fill }: { clip: Clip; fill?: boolean }) {
  const { state, trackClip, toggle } = useStore();
  const t = useT();
  const { ref, active, near } = useOnScreen(0.6);
  const autoplay = useAutoplay();
  const [quiz, setQuiz] = useState(false);
  const answered = !!clip.quiz && !!state.answers[clip.quiz.id];
  const saved = state.saves.includes(clip.id);
  const player = <ClipPlayer src={clip.file} poster={clip.poster} start={clip.start} end={clip.end} title={clip.title} active={active && !quiz} mounted={near} autoplay={autoplay} muted onComplete={() => trackClip(clip.id, "complete")} onStarted={() => trackClip(clip.id, "play")} />;
  const quizLabel = answered ? t("Frage zum Clip ansehen") : t("Frage zum Clip");

  if (fill)
    return (
      <article className="relative h-full overflow-hidden rounded-3xl bg-[#11100e] text-white" data-testid="feed-clip">
        <div ref={ref} className="absolute inset-0">{player}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-1.5 p-5">
          <Kicker categoryId={clip.categoryId} icon={<Clapperboard size={14} />} label={t("Clip")} light />
          <h2 className="font-display text-2xl font-semibold leading-tight drop-shadow">{clip.title}</h2>
          <p className="text-[15px] leading-snug text-white/90">{clip.takeaway}</p>
          <p className="text-[11px] text-white/60">{clip.creator}{clip.license ? ` · ${clip.license}` : ""}</p>
          <div className="pointer-events-auto flex items-center gap-2 pt-2">
            {clip.quiz && (
              <button onClick={() => setQuiz(true)} className="press flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#11100e]">
                <HelpCircle size={17} /> {quizLabel}
              </button>
            )}
            <button onClick={() => toggle("saves", clip)} aria-label={saved ? t("Nicht mehr merken") : t("Merken")} aria-pressed={saved} className="press flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        <Sheet open={quiz} onClose={() => setQuiz(false)} title={t("Frage zum Clip")}>
          {clip.quiz && <KnowledgeCard item={clip.quiz} />}
        </Sheet>
      </article>
    );

  return (
    <article className="card overflow-hidden" data-testid="feed-clip">
      <div ref={ref} className="relative h-[min(68dvh,calc((100vw-2rem)*16/9))] bg-[#11100e] text-white">
        {player}
      </div>
      <div className="space-y-2 p-5">
        <Kicker categoryId={clip.categoryId} icon={<Clapperboard size={14} />} label={t("Clip")} />
        <h2 className="font-display text-xl font-semibold leading-snug">{clip.title}</h2>
        <p className="text-[15px] leading-relaxed">{clip.takeaway}</p>
        <p className="text-xs text-muted">{clip.creator}{clip.license ? ` · ${clip.license}` : ""}</p>
        {clip.quiz && !quiz && (
          <button onClick={() => setQuiz(true)} className="press flex items-center gap-1 pt-1 text-sm font-semibold text-accent">
            {quizLabel} <ChevronDown size={16} />
          </button>
        )}
      </div>
      {clip.quiz && quiz && (
        <div className="border-t border-line p-3">
          <KnowledgeCard item={clip.quiz} />
        </div>
      )}
    </article>
  );
}

/** An explainer animation as a feed entry: starts when it scrolls into view, then asks its question. */
export function AnimationCard({ animation, compact }: { animation: Animation; compact?: boolean }) {
  const { items, state } = useStore();
  const t = useT();
  const { ref, active } = useOnScreen(0.5);
  const [seen, setSeen] = useState(false);
  const quiz = animation.quizId ? items.find((i) => i.id === animation.quizId) : undefined;
  return (
    <article className="card space-y-3 p-5" data-testid="feed-animation">
      <Kicker categoryId={animation.categoryId} icon={<Shapes size={14} />} label={t("So funktioniert’s")} />
      <h2 className="font-display text-xl font-semibold leading-snug">{animation.title}</h2>
      <div ref={ref}>
        <AnimationPlayer animation={animation} active={active} compact={compact} onFinished={() => setSeen(true)} />
      </div>
      {quiz && (seen || !!state.answers[quiz.id]) && (
        <div className="-mx-2 border-t border-line pt-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("Verstanden?")}</p>
          <KnowledgeCard item={quiz} />
        </div>
      )}
    </article>
  );
}

function Entry({ entry, fill }: { entry: FeedEntry; fill?: boolean }) {
  const t = useT();
  if (entry.kind === "item") return <KnowledgeCard item={entry.item} reason={t(entry.reason, entry.vars)} />;
  if (entry.kind === "clip") return <ClipCard clip={entry.clip} fill={fill} />;
  return <AnimationCard animation={entry.animation} compact={fill} />;
}

/**
 * The feed of question cards, clips and animations. More entries are added while scrolling.
 *  - layout "snap": one entry per screen. Every entry settles at the top of the feed area when
 *    scrolling stops (native CSS scroll snapping); an entry taller than the screen can still be
 *    scrolled through. `lead` is shown as the first screen.
 *  - layout "list": plain list inside the page (search results, collections).
 */
export default function Feed({ entries, layout = "list", lead }: { entries: FeedEntry[]; layout?: "snap" | "list"; lead?: ReactNode }) {
  const { state } = useStore();
  const t = useT();
  const [count, setCount] = useState(PAGE);
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const snap = layout === "snap";

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setCount((c) => c + PAGE), snap ? { root: scroller.current, rootMargin: "200% 0px" } : { rootMargin: "600px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [snap]);

  const visible = entries.filter((e) => !state.hidden.includes(entryId(e)));
  const end = count >= visible.length && visible.length > 0 && <p className="py-8 text-center text-sm text-muted">{t("Das war alles für heute. Morgen gibt es Neues.")}</p>;

  if (!snap)
    return (
      <div className="space-y-4">
        {visible.slice(0, count).map((e) => <Entry key={entryId(e)} entry={e} />)}
        <div ref={sentinel} />
        {end}
      </div>
    );

  const screen = "flex snap-start snap-always flex-col justify-center px-4 py-2";
  return (
    <div ref={scroller} tabIndex={0} aria-label={t("Dein Feed")} data-testid="snap-feed" className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none">
      {lead && <section className={`${screen} min-h-full`}>{lead}</section>}
      {visible.slice(0, count).map((e) => (
        // a clip fills the screen exactly; cards are at least one screen tall and centred
        <section key={entryId(e)} data-feed-entry={e.kind} className={`${screen} ${e.kind === "clip" ? "h-full" : "min-h-full"}`}>
          <Entry entry={e} fill />
        </section>
      ))}
      <div ref={sentinel} />
      {end && <section className={`${screen} min-h-[40%]`}>{end}</section>}
    </div>
  );
}
