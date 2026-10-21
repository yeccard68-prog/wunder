"use client";

import { useRef, useState } from "react";
import { CalendarDays, ExternalLink, Layers } from "lucide-react";
import { categoryById } from "@/lib/categories";
import { isChild } from "@/lib/content";
import { formatEventDate, type DayEvent } from "@/lib/days";
import { AREAS, type Fact } from "@/lib/facts";
import { useStore, useT } from "@/lib/store";
import HintButton from "./HintButton";
import ShareImageButton from "./ShareImageButton";

/** "Heute vor 147 Jahren": an event from this calendar day, quoted from the Wikipedia day article. */
export function DayCard({ event }: { event: DayEvent }) {
  const { state } = useStore();
  const t = useT();
  const cat = categoryById(event.categoryId);
  const kicker = event.offset === 0 ? t("Heute vor {n} Jahren", { n: event.yearsAgo }) : t("Diese Woche vor {n} Jahren", { n: event.yearsAgo });
  const date = formatEventDate(event, state.settings.locale);
  return (
    <article className="card overflow-hidden" data-testid="day-card">
      <div className="p-5 text-white" style={{ background: `linear-gradient(135deg, ${cat.color}, color-mix(in oklab, ${cat.color} 55%, #11100e))` }}>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-90"><CalendarDays size={14} /> {kicker}</p>
        <p className="tnum mt-2 font-display text-4xl font-semibold leading-none">{event.year}</p>
        <p className="mt-1 text-sm opacity-85">{date}</p>
      </div>
      <div className="p-5">
        <p className="font-display text-[1.35rem] font-semibold leading-[1.22] tracking-tight text-balance">{event.text}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{event.detail}</p>
        {!isChild(state.ageBand) && (
          <div className="mt-3 flex justify-end">
            <ShareImageButton fileName={`${event.id}.png`} text={`${kicker}: ${event.text}`}
              card={{ kicker: `${kicker} · ${date}`, title: event.text, detail: event.detail, footer: `${t("Quelle:")} ${event.sources.map((s) => s.name).join(", ")}`, color: cat.color }} />
          </div>
        )}
      </div>
      <footer className="border-t border-line px-5 py-3 text-xs text-muted">
        {event.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline">{t("Quelle:")} {s.name} <ExternalLink size={11} /></a>
        ))}
        <p className="mt-1">{event.verification === "verified" ? t("Redaktionell geprüft") : t("Von KI geprüft, noch nicht redaktionell bestätigt.")}</p>
        <div className="mt-1.5"><HintButton kind="fact" id={event.id} label /></div>
      </footer>
    </article>
  );
}

/** A theme series: three facts from one area to swipe through, with dots that show where one is. */
export function SeriesCard({ area, facts }: { area: Fact["area"]; facts: Fact[] }) {
  const t = useT();
  const scroller = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const cat = categoryById(facts[0].categoryId);
  const onScroll = () => {
    const el = scroller.current;
    if (el) setAt(Math.round(el.scrollLeft / el.clientWidth));
  };
  const go = (i: number) => scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: "smooth" });
  return (
    <article className="card overflow-hidden" data-testid="series-card">
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
          <Layers size={14} /> {t("{n} Fakten · {area}", { n: facts.length, area: t(AREAS[area]) })}
        </p>
        <span className="tnum text-xs font-semibold text-muted">{at + 1}/{facts.length}</span>
      </div>
      <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" aria-roledescription={t("Karussell")}>
        {facts.map((f, i) => (
          <section key={f.id} className="w-full shrink-0 snap-start px-5 pb-4 pt-3" aria-label={`${i + 1}/${facts.length}`} data-testid="series-slide">
            <p className="font-display text-[1.3rem] font-semibold leading-[1.22] tracking-tight text-balance">{f.text}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.detail}</p>
            <p className="mt-2 text-xs text-muted">
              {f.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">{s.name} <ExternalLink size={10} /></a>
              ))}
            </p>
          </section>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 pb-4">
        {facts.map((f, i) => (
          <button key={f.id} onClick={() => go(i)} aria-label={t("Fakt {n}", { n: i + 1 })} className="press flex h-6 w-6 items-center justify-center">
            <span className="block h-2 rounded-full transition-all" style={{ width: i === at ? 20 : 8, background: i === at ? cat.color : "var(--line)" }} />
          </button>
        ))}
      </div>
    </article>
  );
}
