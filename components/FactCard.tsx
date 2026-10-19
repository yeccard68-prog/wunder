"use client";

import { useState } from "react";
import { Bookmark, ChevronDown, ExternalLink, Lightbulb, Sparkles } from "lucide-react";
import { categoryById } from "@/lib/categories";
import { AREAS, type Fact } from "@/lib/facts";
import { isChild } from "@/lib/content";
import { useStore, useT } from "@/lib/store";
import HintButton from "./HintButton";
import ShareImageButton from "./ShareImageButton";

/** "Did you know?": one surprising fact, the explanation behind it on request, and its source. */
export default function FactCard({ fact }: { fact: Fact }) {
  const { state, reactFact, toggle } = useStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const cat = categoryById(fact.categoryId);
  const wow = state.facts?.wow.includes(fact.id) ?? false;
  const known = state.facts?.known.includes(fact.id) ?? false;
  const saved = state.saves.includes(fact.id);
  return (
    <article className="card overflow-hidden" data-testid="fact-card">
      <div className="p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
          <Lightbulb size={14} /> {t("Wusstest du?")} · {t(AREAS[fact.area])}
        </p>
        <p className="mt-3 font-display text-[1.45rem] font-semibold leading-[1.22] tracking-tight text-balance">{fact.text}</p>
        {open && <p className="rise mt-3 text-[15px] leading-relaxed text-muted" data-testid="fact-detail">{fact.detail}</p>}
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="press mt-3 flex items-center gap-1 text-sm font-semibold text-muted">
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} /> {open ? t("Weniger") : t("Mehr dazu")}
        </button>
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
