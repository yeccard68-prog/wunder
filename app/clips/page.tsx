"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Bookmark, Captions, CaptionsOff, Check, Ellipsis, EyeOff, ExternalLink, Flag, Heart, Info, MessageCircle, Play, Send, Share2, Volume2, VolumeX, Zap } from "lucide-react";
import ClipPlayer from "@/components/ClipPlayer";
import KnowledgeCard from "@/components/KnowledgeCard";
import { Avatar, Button, Empty, Sheet } from "@/components/ui";
import { categoryById } from "@/lib/categories";
import { rankClips, type Clip } from "@/lib/clips";
import { personById } from "@/lib/people";
import { scrollToElement, useAutoAdvance } from "@/lib/advance";
import { captionAt, isChild } from "@/lib/content";
import { formatLocale } from "@/lib/i18n";
import { titleGivesAway } from "@/lib/quizGate";
import { useStore, useT } from "@/lib/store";

type SheetKind = "info" | "comments" | "menu" | "quiz";

/** No autoplay for reduced-motion users or when the browser asks to save data. */
function useAutoplay() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setOk(!reduced && !saveData);
  }, []);
  return ok;
}

function RailButton({ label, onClick, active, children, count }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode; count?: number }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={active} className={`press flex flex-col items-center gap-0.5 text-[11px] font-semibold drop-shadow ${active ? "text-[#ff6d48]" : "text-white"}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 backdrop-blur">{children}</span>
      {count !== undefined && <span className="tnum">{count}</span>}
    </button>
  );
}

function ClipView({ clip, index, active, near, autoplay, onActive, open, comments }: { clip: Clip; index: number; active: boolean; near: boolean; autoplay: boolean; onActive: (i: number) => void; open: (kind: SheetKind) => void; comments: boolean }) {
  const { state, update, toggle, share, trackClip } = useStore();
  const t = useT();
  const section = useRef<HTMLElement>(null);
  const [time, setTime] = useState(0);
  const cat = categoryById(clip.categoryId);
  const { muted, captions: showCaptions } = state.settings;
  const liked = state.likes.includes(clip.id);
  const saved = state.saves.includes(clip.id);
  const watched = (state.clipStats[clip.id]?.completed ?? 0) > 0;
  const quizDone = !!clip.quiz && !!state.answers[clip.quiz.id];
  // the key message (the answer) only once the quiz is answered – the explanation sheet stays available on request
  const hideAnswer = !!clip.quiz && !quizDone;
  const label = hideAnswer && titleGivesAway(clip.id, state.settings.locale) ? t("Clip") : clip.title;
  const ownComments = state.comments[clip.id]?.length ?? 0;

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && onActive(index), { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [index, onActive]);

  const caption = captionAt(clip, time);

  return (
    <section ref={section} data-clip-section className="relative h-full snap-start snap-always overflow-hidden bg-[#11100e] text-white" aria-label={label}>
      <ClipPlayer src={clip.file} poster={clip.poster} start={clip.start} end={clip.end} title={clip.title} active={active} mounted={near} autoplay={autoplay} muted={muted} onTime={setTime} onComplete={() => trackClip(clip.id, "complete")} onStarted={() => trackClip(clip.id, "play")} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

      <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),14px)]">
        <span className="font-display text-xl font-semibold italic drop-shadow">Clips</span>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">{clip.creator}</span>
        <span className="flex-1" />
        <button onClick={() => update({ settings: { ...state.settings, captions: !showCaptions } })} aria-label={showCaptions ? t("Untertitel ausblenden") : t("Untertitel einblenden")} aria-pressed={showCaptions} className="press flex h-10 w-10 items-center justify-center rounded-full bg-white/12 backdrop-blur">
          {showCaptions ? <Captions size={19} /> : <CaptionsOff size={19} />}
        </button>
        {clip.hasAudio && (
          <button onClick={() => update({ settings: { ...state.settings, muted: !muted } })} aria-label={muted ? t("Ton einschalten") : t("Ton ausschalten")} aria-pressed={!muted} className="press flex h-10 w-10 items-center justify-center rounded-full bg-white/12 backdrop-blur">
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
        )}
        <button onClick={() => open("menu")} aria-label={t("Mehr Optionen")} className="press flex h-10 w-10 items-center justify-center rounded-full bg-white/12 backdrop-blur">
          <Ellipsis size={19} />
        </button>
      </div>

      <div className="absolute bottom-24 right-3 flex flex-col gap-3.5">
        <RailButton label={t("Gefällt mir")} active={liked} onClick={() => toggle("likes", clip)} count={clip.popularity + (liked ? 1 : 0)}>
          <Heart size={21} fill={liked ? "currentColor" : "none"} className={liked ? "pop" : ""} />
        </RailButton>
        {comments && (
          <RailButton label={t("Kommentare")} onClick={() => open("comments")} count={clip.comments.length + ownComments}>
            <MessageCircle size={21} />
          </RailButton>
        )}
        <RailButton label={t("Merken")} active={saved} onClick={() => toggle("saves", clip)}>
          <Bookmark size={21} fill={saved ? "currentColor" : "none"} />
        </RailButton>
        <RailButton label={t("Teilen")} onClick={() => share(`${clip.title}\n\n${clip.takeaway}\n\n${t("– ein Clip auf Wunder")}`)}>
          <Share2 size={21} />
        </RailButton>
        <RailButton label={t("Erklärung und Quellen")} onClick={() => open("info")}>
          <Info size={21} />
        </RailButton>
      </div>

      <div className="absolute inset-x-0 bottom-0 pb-5 pl-4 pr-[4.5rem]">
        {showCaptions && caption && (
          <p className="mb-3 inline-block rounded-lg bg-black/70 px-2.5 py-1.5 text-[15px] font-semibold leading-snug" aria-live="off">
            {caption}
          </p>
        )}
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
          {t(cat.name)}
        </p>
        {!hideAnswer && <p className="mt-1.5 text-[15px] font-medium leading-snug text-white/90" data-testid="clip-takeaway">{clip.takeaway}</p>}
        <p className="mt-1.5 truncate text-xs text-white/60">
          {clip.creator} · {t("Quelle:")} {clip.sources[0].name}
        </p>
        {clip.quiz && (watched || quizDone) && (
          <button onClick={() => open("quiz")} className="press rise mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#1a1714]">
            {quizDone ? (
              <>
                <Check size={16} /> {t("Quiz gelöst")}
              </>
            ) : (
              <>
                <Zap size={16} /> {t("Kurz testen · 10 XP")}
              </>
            )}
          </button>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
        <div className="h-full bg-white/80" style={{ width: `${Math.min(100, (Math.max(0, time - clip.start) / clip.duration) * 100)}%` }} />
      </div>
    </section>
  );
}

export default function ClipsPage() {
  const { state, clips: allClips, getState, hide, addComment } = useStore();
  const t = useT();
  const child = isChild(state.ageBand); // no comments for children
  const autoplay = useAutoplay();
  const [active, setActive] = useState(0);
  const [sheet, setSheet] = useState<{ kind: SheetKind; clip: Clip } | null>(null);
  const [draft, setDraft] = useState("");

  // ?c=<id> (from Entdecken): that clip first, then the usual order
  const [startId, setStartId] = useState<string | null>(null);
  useEffect(() => setStartId(new URLSearchParams(window.location.search).get("c")), []);
  // Rank once per visit so the order stays stable while watching.
  const ranked = useMemo(() => {
    const list = rankClips(allClips, getState());
    const i = startId ? list.findIndex((c) => c.id === startId) : -1;
    return i > 0 ? [list[i], ...list.slice(0, i), ...list.slice(i + 1)] : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allClips, startId]);
  const clips = ranked.filter((c) => !state.hidden.includes(c.id));
  const close = () => {
    advance.stay();
    setSheet(null);
  };
  // answered → close the question and move on to the next clip
  const next = useCallback(() => {
    setSheet(null);
    scrollToElement(document.querySelectorAll("[data-clip-section]")[active + 1]);
  }, [active]);
  const advance = useAutoAdvance(next);
  const clip = sheet?.clip;

  if (!clips.length)
    return (
      <div className="px-4 pt-16">
        <Empty icon={<Play size={22} />} title={t("Keine Clips mehr")} text={allClips.length ? t("Du hast alle Clips ausgeblendet. Neue folgen.") : t("Noch keine Clips vorhanden. Mit „npm run clips“ werden die Beispielclips erzeugt.")} />
      </div>
    );

  return (
    <>
      <div className="no-scrollbar h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] snap-y snap-mandatory overflow-y-auto overscroll-contain bg-[#11100e]">
        {clips.map((c, i) => (
          // Only the current clip and its neighbours get a video element → no full-feed download.
          <ClipView key={c.id} clip={c} index={i} active={i === active} near={Math.abs(i - active) <= 1} autoplay={autoplay} onActive={setActive} open={(kind) => setSheet({ kind, clip: c })} comments={!child} />
        ))}
      </div>

      <Sheet open={sheet?.kind === "info"} onClose={close} title={t("Erklärung")}>
        {clip && (
          <div className="space-y-4 pb-2">
            <p className="font-display text-xl font-semibold leading-snug">{clip.title}</p>
            <p className="text-[15px] leading-relaxed">{clip.description}</p>
            <p className="rounded-2xl bg-raised p-4 text-[15px] font-semibold leading-snug">{t("Merksatz:")} {clip.takeaway}</p>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{t("Quellen")}</p>
              <ul className="space-y-1.5">
                {clip.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm underline decoration-line underline-offset-2">
                      {s.name} <ExternalLink size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              {clip.creator} · {new Date(clip.publishedAt).toLocaleDateString(formatLocale(state.settings.locale))} · {clip.verification === "verified" ? t("Redaktionell geprüft.") : t("Noch nicht redaktionell geprüft.")}
              {clip.license && <span className="block">{t("Lizenz:")} {clip.license}</span>}
            </p>
            <Button className="w-full" disabled={!clip.quiz} onClick={() => setSheet({ kind: "quiz", clip })}>
              <Zap size={17} /> {clip.quiz && state.answers[clip.quiz.id] ? t("Quiz ansehen") : t("Wissen testen")}
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet?.kind === "quiz"} onClose={close} title={t("Kurz testen")}>
        {clip && (
          <div className="pb-2">
            {clip.quiz && <KnowledgeCard key={clip.quiz.id} item={clip.quiz} context="video" onAnswered={() => {}} clip={{ note: clip.takeaway, rewatch: close, done: advance.start }} />}
            {advance.pending && (
              <p className="mt-3 flex items-center justify-between gap-3 text-sm text-muted" role="status" data-testid="advance">
                {t("Gleich geht es weiter …")}
                <button onClick={advance.stay} className="press h-9 rounded-full border border-line px-3.5 text-sm font-semibold text-ink">{t("Hier bleiben")}</button>
              </p>
            )}
            <Button variant="secondary" className="mt-4 w-full" onClick={close}>
              {t("Weiter schauen")}
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet?.kind === "comments"} onClose={close} title={t("Kommentare")}>
        {clip && (
          <div className="pb-2">
            <ul className="space-y-4">
              {clip.comments.map((c, i) => {
                const p = personById(c.personId);
                return (
                  p && !state.blocked.includes(p.id) && (
                    <li key={i} className="flex gap-3">
                      <Avatar name={p.name} color={p.color} size={34} />
                      <p className="text-[15px] leading-snug">
                        <span className="block text-xs font-semibold text-muted">{p.name} · {t("Demo-Profil")}</span>
                        {c.text}
                      </p>
                    </li>
                  )
                );
              })}
              {(state.comments[clip.id] ?? []).map((text, i) => (
                <li key={"me" + i} className="flex gap-3">
                  <Avatar name={state.username} color="var(--accent)" size={34} />
                  <p className="text-[15px] leading-snug">
                    <span className="block text-xs font-semibold text-muted">{t("Du")}</span>
                    {text}
                  </p>
                </li>
              ))}
            </ul>
            <form
              className="mt-5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                addComment(clip.id, draft.trim());
                setDraft("");
              }}
            >
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={200} placeholder={t("Kommentar schreiben")} aria-label={t("Kommentar schreiben")} className="h-12 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] outline-none focus:border-ink" />
              <Button type="submit" aria-label={t("Senden")} className="w-12 px-0" disabled={!draft.trim()}>
                <Send size={17} />
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted">{t("Kommentare werden noch nicht synchronisiert – deiner bleibt auf diesem Gerät.")}</p>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet?.kind === "menu"} onClose={close} title={t("Dieser Clip")}>
        {clip && (
          <div className="space-y-2 pb-2">
            <button onClick={() => { hide(clip); close(); }} className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-raised px-4 text-left font-semibold">
              <EyeOff size={19} /> {t("Kein Interesse")}
            </button>
            <button onClick={() => { hide(clip, true); close(); }} className="press flex h-14 w-full items-center gap-3 rounded-2xl bg-raised px-4 text-left font-semibold text-bad">
              <Flag size={19} /> {t("Irreführend oder falsch – melden")}
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
