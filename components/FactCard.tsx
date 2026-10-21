"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, ChevronDown, ExternalLink, HelpCircle, Lightbulb, Sparkles, X } from "lucide-react";
import { categoryById } from "@/lib/categories";
import { isChild } from "@/lib/content";
import { AREAS, type Fact, type Figure } from "@/lib/facts";
import { useStore, useT } from "@/lib/store";
import HintButton from "./HintButton";
import ShareImageButton from "./ShareImageButton";

/** A big number that counts up once it scrolls into view (respects "reduce motion"). */
function CountUp({ figure, color, locale }: { figure: Figure; color: string; locale: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") return setValue(figure.value);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 1200);
        setValue(figure.value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [figure.value]);
  const digits = figure.digits ?? 0;
  return (
    <p ref={ref} className="tnum mt-3 font-display text-5xl font-semibold leading-none tracking-tight" style={{ color }} data-testid="fact-figure" aria-label={`${figure.value.toLocaleString(locale)}${figure.suffix}`}>
      {value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}
      <span className="text-2xl">{figure.suffix}</span>
    </p>
  );
}

/**
 * "Did you know?": one surprising fact, the explanation behind it on request, and its source. Some facts are asked
 * first as "Myth or truth?" (a popular belief or a surprising truth to judge), some show their key number counting up.
 */
export default function FactCard({ fact }: { fact: Fact }) {
  const { state, reactFact, toggle } = useStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [guess, setGuess] = useState<"truth" | "myth" | null>(null);
  const cat = categoryById(fact.categoryId);
  const wow = state.facts?.wow.includes(fact.id) ?? false;
  const known = state.facts?.known.includes(fact.id) ?? false;
  const saved = state.saves.includes(fact.id);
  const asking = !!fact.quiz && !!fact.claim && guess === null;
  const right = guess !== null && guess === fact.quiz;

  if (asking)
    return (
      <article className="card overflow-hidden" data-testid="fact-card" data-quiz={fact.quiz}>
        <div className="p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
            <HelpCircle size={14} /> {t("Mythos oder Wahrheit?")} · {t(AREAS[fact.area])}
          </p>
          <p className="mt-3 font-display text-[1.45rem] font-semibold leading-[1.22] tracking-tight text-balance">„{fact.claim}“</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button onClick={() => setGuess("truth")} className="press flex h-12 items-center justify-center gap-2 rounded-full border border-line font-semibold">
              <Check size={17} /> {t("Stimmt")}
            </button>
            <button onClick={() => setGuess("myth")} className="press flex h-12 items-center justify-center gap-2 rounded-full border border-line font-semibold">
              <X size={17} /> {t("Mythos")}
            </button>
          </div>
        </div>
      </article>
    );

  return (
    <article className="card overflow-hidden" data-testid="fact-card" data-quiz={fact.quiz}>
      <div className="p-5">
        {guess !== null && (
          <p className={`pop mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${right ? "bg-good/15 text-good" : "bg-bad/15 text-bad"}`} role="status" data-testid="fact-verdict">
            {right ? <Check size={15} /> : <X size={15} />}
            {fact.quiz === "myth" ? (right ? t("Richtig – das ist ein Mythos!") : t("Doch ein Mythos!")) : right ? t("Richtig – das stimmt wirklich!") : t("Doch, das stimmt!")}
          </p>
        )}
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
          <Lightbulb size={14} /> {t("Wusstest du?")} · {t(AREAS[fact.area])}
        </p>
        {fact.figure && <CountUp figure={fact.figure} color={cat.color} locale={state.settings.locale === "en" ? "en-GB" : "de-DE"} />}
        <p className="mt-3 font-display text-[1.45rem] font-semibold leading-[1.22] tracking-tight text-balance">{fact.text}</p>
        {(open || guess !== null) && <p className="rise mt-3 text-[15px] leading-relaxed text-muted" data-testid="fact-detail">{fact.detail}</p>}
        {guess === null && (
          <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="press mt-3 flex items-center gap-1 text-sm font-semibold text-muted">
            <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} /> {open ? t("Weniger") : t("Mehr dazu")}
          </button>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => reactFact(fact.id, "wow")} aria-pressed={wow} className={`press flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${wow ? "border-accent bg-accent text-white" : "border-line"}`}>
            <Sparkles size={15} /> {t("Wow!")}
          </button>
          <button onClick={() => reactFact(fact.id, "known")} aria-pressed={known} className={`press h-10 rounded-full border px-4 text-sm font-semibold ${known ? "border-ink bg-ink text-bg" : "border-line"}`}>
            {t("Wusste ich schon")}
          </button>
          {!isChild(state.ageBand) && (
            <ShareImageButton className="ml-auto" fileName={`${fact.id}.png`} text={fact.text}
              card={{ kicker: `${t("Wusstest du?")} · ${t(AREAS[fact.area])}`, title: fact.text, detail: fact.detail, footer: `${t("Quelle:")} ${fact.sources.map((s) => s.name).join(", ")}`, color: cat.color }} />
          )}
          <button onClick={() => toggle("saves", fact)} aria-pressed={saved} aria-label={saved ? t("Gemerkt") : t("Merken")} className={`press ${isChild(state.ageBand) ? "ml-auto " : ""}flex h-10 w-10 items-center justify-center rounded-full ${saved ? "text-accent" : "text-muted"}`}>
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <footer className="border-t border-line px-5 py-3 text-xs text-muted">
        {fact.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline">
            {t("Quelle:")} {s.name} <ExternalLink size={11} />
          </a>
        ))}
        <p className="mt-1">{fact.verification === "verified" ? t("Redaktionell geprüft") : t("Von KI geprüft, noch nicht redaktionell bestätigt.")}</p>
        <div className="mt-1.5"><HintButton kind="fact" id={fact.id} label /></div>
      </footer>
    </article>
  );
}
