"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bookmark, Check, ChevronDown, Clapperboard, HelpCircle, Shapes } from "lucide-react";
import AnimationPlayer from "@/components/anim/AnimationPlayer";
import InsightCard from "@/components/books/InsightCard";
import VisualCard from "@/components/viz";
import ClipPlayer, { useClipFrame } from "@/components/ClipPlayer";
import { GuessOverlay, GuessPanel, RevealPanel, TipChip, useClipGuess } from "@/components/ClipGuess";
import { DayCard, SeriesCard } from "@/components/DayCards";
import HintButton from "@/components/HintButton";
import { Sheet } from "@/components/ui";
import { track } from "@/lib/analytics";
import type { Animation } from "@/lib/animations";
import { categoryById } from "@/lib/categories";
import { captionAt, type Clip } from "@/lib/content";
import { entryContentIds, entryId, entryTopic, type FeedEntry } from "@/lib/feed";
import FactCard from "./FactCard";
import StudyCard from "./StudyCard";
import { titleGivesAway, useQuizView } from "@/lib/quizGate";
import { reviewDue } from "@/lib/seen";
import { useStore, useT } from "@/lib/store";
import KnowledgeCard from "./KnowledgeCard";
import ExerciseCard from "./ExerciseCard";
import PuzzleCard from "./PuzzleCard";
import RoundCard from "./RoundCard";

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
 * A clip with a question asks it first – „erst raten, dann schauen“ (components/ClipGuess.tsx).
 */
export function ClipCard({ clip, fill }: { clip: Clip; fill?: boolean }) {
  const { state, trackClip, toggle } = useStore();
  const t = useT();
  const { ref, active, near } = useOnScreen(0.6);
  const autoplay = useAutoplay();
  const guess = useClipGuess(clip);
  const [quiz, setQuiz] = useState(false); // the answered question, looked at again
  const [time, setTime] = useState(0);
  const caption = state.settings.captions ? captionAt(clip, time) : undefined;
  const answered = !!clip.quiz && !!state.answers[clip.quiz.id];
  // while the question is open, a title that names the answer gives way to a neutral line
  const heading = guess.phase === "guess" && titleGivesAway(clip.id, state.settings.locale) ? t("Was meinst du? Danach zeigt es der Clip.") : clip.title;
  const saved = state.saves.includes(clip.id);
  const player = <ClipPlayer src={clip.file} poster={clip.poster} start={clip.start} end={clip.end} title={clip.title} active={active && guess.playing && !quiz} mounted={near} autoplay={autoplay} muted onTime={setTime} onComplete={() => { guess.reveal(); trackClip(clip.id, "complete"); track("clip_complete", clip.id, "clip"); }} onStarted={() => { trackClip(clip.id, "play"); track("clip_start", clip.id, "clip"); }} />;
  const review = answered && guess.phase === "done";

  const { card, words, height: videoHeight, top: videoTop } = useClipFrame(!!fill, state.settings.captions && clip.captions.length > 0);

  if (fill)
    return (
      <article ref={card} className="relative h-full overflow-hidden rounded-3xl bg-[#11100e] text-white" data-testid="feed-clip" data-phase={guess.phase}>
        <div ref={ref} className="absolute inset-x-0" style={{ top: videoTop, height: videoHeight ?? "100%" }} data-testid="clip-frame">{player}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-1.5 p-5">
          {caption && guess.playing && <p className="mb-2 inline-block rounded-lg bg-black/70 px-2.5 py-1.5 text-[15px] font-semibold leading-snug" aria-live="off" data-testid="clip-caption">{caption}</p>}
          <div ref={words} className="space-y-1.5" data-testid="clip-text">
            <TipChip clip={clip} guess={guess} light />
            <Kicker categoryId={clip.categoryId} icon={<Clapperboard size={14} />} label={t("Clip")} light />
            <h2 className="font-display text-2xl font-semibold leading-tight drop-shadow">{heading}</h2>
            {!guess.hideAnswer && <p className="text-[15px] leading-snug text-white/90" data-testid="clip-takeaway">{clip.takeaway}</p>}
            <p className="text-[11px] text-white/60">{clip.creator}{clip.license ? ` · ${t(clip.license)}` : ""}</p>
            <div className="pointer-events-auto flex items-center gap-2 pt-2">
              {review && (
                <button onClick={() => setQuiz(true)} className="press flex h-11 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur">
                  <HelpCircle size={17} /> {t("Frage zum Clip ansehen")}
                </button>
              )}
              <button onClick={() => toggle("saves", clip)} aria-label={saved ? t("Nicht mehr merken") : t("Merken")} aria-pressed={saved} className="press flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
              </button>
              <HintButton kind="video" id={clip.id} light />
            </div>
          </div>
        </div>
        <GuessOverlay clip={clip} guess={guess} title={heading} />
        <Sheet open={quiz} onClose={() => setQuiz(false)} title={t("Frage zum Clip")}>
          {clip.quiz && <KnowledgeCard item={clip.quiz} context="video" clip={{ note: clip.takeaway }} />}
        </Sheet>
      </article>
    );

  return (
    <article className="card overflow-hidden" data-testid="feed-clip" data-phase={guess.phase}>
      <div ref={ref} className="relative h-[min(68dvh,calc((100vw-2rem)*16/9))] bg-[#11100e] text-white">
        {player}
      </div>
      <div className="space-y-2 p-5">
        <Kicker categoryId={clip.categoryId} icon={<Clapperboard size={14} />} label={t("Clip")} />
        <h2 className="font-display text-xl font-semibold leading-snug">{heading}</h2>
        <GuessPanel clip={clip} guess={guess} />
        <TipChip clip={clip} guess={guess} />
        <RevealPanel clip={clip} guess={guess} />
        {!guess.hideAnswer && <p className="text-[15px] leading-relaxed" data-testid="clip-takeaway">{clip.takeaway}</p>}
        <p className="flex items-center justify-between gap-2 text-xs text-muted">{clip.creator}{clip.license ? ` · ${t(clip.license)}` : ""} <HintButton kind="video" id={clip.id} label /></p>
        {review && !quiz && (
          <button onClick={() => setQuiz(true)} className="press flex items-center gap-1 pt-1 text-sm font-semibold text-accent">
            {t("Frage zum Clip ansehen")} <ChevronDown size={16} />
          </button>
        )}
      </div>
      {clip.quiz && quiz && (
        <div className="border-t border-line p-3">
          <KnowledgeCard item={clip.quiz} context="video" clip={{ note: clip.takeaway }} />
        </div>
      )}
    </article>
  );
}

/** An explainer animation as a feed entry: starts when it scrolls into view, then asks its question. */
export function AnimationCard({ animation, compact }: { animation: Animation; compact?: boolean }) {
  const { items, state } = useStore();
  const t = useT();
  const { ref, active, near } = useOnScreen(0.5);
  const [seen, setSeen] = useState(false);
  const quiz = animation.quizId ? items.find((i) => i.id === animation.quizId) : undefined;
  // answered before and not due again: the animation is shown without its question (decided when it appears)
  const [askable] = useState(() => !quiz || !state.answers[quiz.id] || reviewDue(state.answers[quiz.id]));
  // while the question is open the animation (its captions and labels show the answer) steps aside
  const { asking, solved } = useQuizView(quiz, askable && seen, state);
  return (
    <article className="card space-y-3 p-5" data-testid="feed-animation">
      <Kicker categoryId={animation.categoryId} icon={<Shapes size={14} />} label={animation.compare ? t("Größenvergleich") : animation.portrait ? t("Länderporträt") : t("So funktioniert’s")} />
      <h2 className="font-display text-xl font-semibold leading-snug">{animation.title}</h2>
      <div ref={ref}>
        {asking ? (
          <p className="flex items-center gap-2 rounded-2xl bg-raised p-3.5 text-sm text-muted" data-testid="animation-aside"><Check size={16} className="shrink-0 text-good" /> {t("Angesehen. Jetzt die Frage – danach kannst du die Animation noch einmal ansehen.")}</p>
        ) : (
          <AnimationPlayer animation={animation} active={active} mounted={near} compact={compact} onFinished={() => { setSeen(true); track("animation_complete", animation.id, "animation"); }} />
        )}
      </div>
      <div className="flex justify-end"><HintButton kind="animation" id={animation.id} label /></div>
      {solved ? (
        <p className="flex items-center gap-2 rounded-2xl bg-good/10 p-3.5 text-sm font-semibold" role="status" data-testid="animation-solved"><Check size={16} className="shrink-0 text-good" /> {t("Richtig! Jetzt kannst du frei mit der Animation spielen.")}</p>
      ) : quiz && askable && seen && (
        <div className="-mx-2 border-t border-line pt-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("Verstanden?")}</p>
          <KnowledgeCard item={quiz} />
        </div>
      )}
    </article>
  );
}

/** Once, after a long time in the feed: a friendly suggestion to take a break – not a wall, just a hint. */
function PauseCard() {
  const { state } = useStore();
  const t = useT();
  return (
    <article className="card p-6 text-center" data-testid="pause-card">
      <p className="text-4xl" aria-hidden>☕</p>
      <p className="mt-3 font-display text-2xl font-semibold">{t("Zeit für eine kurze Pause?")}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{t("Du bist schon eine Weile dabei – heute {n} Antworten. Pausen helfen dem Gehirn, Neues zu behalten. Weiter geht es jederzeit mit einem Wisch.", { n: state.daily.count })}</p>
    </article>
  );
}

function Entry({ entry, fill }: { entry: FeedEntry; fill?: boolean }) {
  const t = useT();
  if (entry.kind === "fact") return <FactCard fact={entry.fact} />;
  if (entry.kind === "series") return <SeriesCard area={entry.area} facts={entry.facts} />;
  if (entry.kind === "day") return <DayCard event={entry.event} />;
  if (entry.kind === "study") return <StudyCard study={entry.study} />;
  if (entry.kind === "pause") return <PauseCard />;
  if (entry.kind === "puzzle") return <PuzzleCard puzzle={entry.puzzle} />;
  if (entry.kind === "exercise") return <ExerciseCard exercise={entry.exercise} />;
  if (entry.kind === "round") return <RoundCard round={entry} />;
  if (entry.kind === "item") return <KnowledgeCard item={entry.item} reason={t(entry.reason, entry.vars)} />;
  if (entry.kind === "clip") return <ClipCard clip={entry.clip} fill={fill} />;
  if (entry.kind === "insight") return <InsightCard book={entry.book} idea={entry.idea} standalone />;
  if (entry.kind === "visual") return <VisualCard visual={entry.visual} />;
  return <AnimationCard animation={entry.animation} compact={fill} />;
}

/** A screen of the snapping feed that reports how long it was in view (the feed learns from it, on this device). */
function Tracked({ entry, root, className, children }: { entry: FeedEntry; root: React.RefObject<HTMLDivElement | null>; className: string; children: ReactNode }) {
  const { trackView } = useStore();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || entry.kind === "pause") return;
    let since = 0;
    const leave = () => {
      if (since) trackView(entryTopic(entry), entry.kind as Exclude<FeedEntry["kind"], "pause">, (performance.now() - since) / 1000, entryContentIds(entry));
      since = 0;
    };
    const obs = new IntersectionObserver(([e]) => (e.isIntersecting ? (since = performance.now()) : leave()), { root: root.current, threshold: 0.6 });
    obs.observe(el);
    const hide = () => document.visibilityState === "hidden" && leave();
    document.addEventListener("visibilitychange", hide);
    return () => {
      leave();
      obs.disconnect();
      document.removeEventListener("visibilitychange", hide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <section ref={ref} data-feed-entry={entry.kind} className={className}>{children}</section>;
}

/**
 * The feed of question cards, clips and animations. More entries are added while scrolling.
 *  - layout "snap": one entry per screen. Every entry settles at the top of the feed area when
 *    scrolling stops (native CSS scroll snapping); an entry taller than the screen can still be
 *    scrolled through.
 *  - layout "list": plain list inside the page (search results, collections).
 */
export default function Feed({ entries, layout = "list", onNearEnd }: { entries: FeedEntry[]; layout?: "snap" | "list"; onNearEnd?: () => void }) {
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

  // snapping feed: entries already rendered keep their place when the list changes (e.g. a new portion of cards
  // arrived), so nothing jumps under the finger; new ones only ever come after them. Lists (search) just follow.
  const shown = useRef<FeedEntry[]>([]);
  const kept = snap ? shown.current.slice(0, count) : [];
  const keptIds = new Set(kept.map(entryId));
  const ordered = [...kept, ...entries.filter((e) => !keptIds.has(entryId(e)))];
  shown.current = ordered;
  const visible = ordered.filter((e) => !state.hidden.includes(entryId(e)));
  const nearEnd = count + PAGE >= visible.length;
  useEffect(() => {
    if (nearEnd) onNearEnd?.();
  }, [nearEnd, onNearEnd]);
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
      {visible.slice(0, count).map((e) => (
        // a clip fills the screen exactly; cards are at least one screen tall and centred
        <Tracked key={entryId(e)} entry={e} root={scroller} className={`${screen} ${e.kind === "clip" ? "h-full" : "min-h-full"}`}>
          <Entry entry={e} fill />
        </Tracked>
      ))}
      <div ref={sentinel} />
      {end && <section className={`${screen} min-h-[40%]`}>{end}</section>}
    </div>
  );
}
