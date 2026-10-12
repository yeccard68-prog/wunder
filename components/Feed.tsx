"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Clapperboard, Shapes } from "lucide-react";
import AnimationPlayer from "@/components/anim/AnimationPlayer";
import ClipPlayer from "@/components/ClipPlayer";
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

function Kicker({ categoryId, icon, label }: { categoryId: string; icon: React.ReactNode; label: string }) {
  const t = useT();
  const cat = categoryById(categoryId);
  return (
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
      {icon} {label} · {t(cat.name)}
    </p>
  );
}

/** A clip inside the feed: plays muted while it is on screen, its question can be opened below. */
function ClipCard({ clip }: { clip: Clip }) {
  const { state, trackClip } = useStore();
  const t = useT();
  const { ref, active, near } = useOnScreen(0.6);
  const [autoplay, setAutoplay] = useState(false);
  const [quiz, setQuiz] = useState(false);
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setAutoplay(!window.matchMedia("(prefers-reduced-motion: reduce)").matches && !saveData);
  }, []);
  const answered = !!clip.quiz && !!state.answers[clip.quiz.id];
  return (
    <article className="card overflow-hidden" data-testid="feed-clip">
      <div ref={ref} className="relative h-[min(68dvh,calc((100vw-2rem)*16/9))] bg-[#11100e] text-white">
        <ClipPlayer src={clip.file} poster={clip.poster} start={clip.start} end={clip.end} title={clip.title} active={active} mounted={near} autoplay={autoplay} muted onComplete={() => trackClip(clip.id, "complete")} onStarted={() => trackClip(clip.id, "play")} />
      </div>
      <div className="space-y-2 p-5">
        <Kicker categoryId={clip.categoryId} icon={<Clapperboard size={14} />} label={t("Clip")} />
        <h2 className="font-display text-xl font-semibold leading-snug">{clip.title}</h2>
        <p className="text-[15px] leading-relaxed">{clip.takeaway}</p>
        <p className="text-xs text-muted">{clip.creator}{clip.license ? ` · ${clip.license}` : ""}</p>
        {clip.quiz && !quiz && (
          <button onClick={() => setQuiz(true)} className="press flex items-center gap-1 pt-1 text-sm font-semibold text-accent">
            {answered ? t("Frage zum Clip ansehen") : t("Frage zum Clip")} <ChevronDown size={16} />
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

/** An explainer animation inside the feed: starts when it scrolls into view, then asks its question. */
function AnimationCard({ animation }: { animation: Animation }) {
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
        <AnimationPlayer animation={animation} active={active} onFinished={() => setSeen(true)} />
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

/** Vertical feed of question cards, clips and animations that reveals more as the user scrolls. */
export default function Feed({ entries }: { entries: FeedEntry[] }) {
  const { state } = useStore();
  const t = useT();
  const [count, setCount] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setCount((c) => c + PAGE), { rootMargin: "600px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const visible = entries.filter((e) => !state.hidden.includes(entryId(e)));
  return (
    <div className="space-y-4">
      {visible.slice(0, count).map((e) =>
        e.kind === "item" ? <KnowledgeCard key={e.item.id} item={e.item} reason={t(e.reason, e.vars)} /> : e.kind === "clip" ? <ClipCard key={e.clip.id} clip={e.clip} /> : <AnimationCard key={e.animation.id} animation={e.animation} />,
      )}
      <div ref={sentinel} />
      {count >= visible.length && visible.length > 0 && <p className="py-8 text-center text-sm text-muted">{t("Das war alles für heute. Morgen gibt es Neues.")}</p>}
    </div>
  );
}
