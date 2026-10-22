"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink, FlaskConical } from "lucide-react";
import { categoryById } from "@/lib/categories";
import { isChild } from "@/lib/content";
import type { Study } from "@/lib/studies";
import { useStore, useT } from "@/lib/store";
import HintButton from "./HintButton";
import ShareImageButton from "./ShareImageButton";

/**
 * "Studie kurz erklärt": the question and how the study went first – the learner thinks about the outcome, then
 * reveals it. The limit of the study ("Der Haken", a text starting "Aber …") always comes with the result: a study without its limits is not explained.
 */
export default function StudyCard({ study }: { study: Study }) {
  const { state } = useStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const cat = categoryById(study.categoryId);
  const part = (label: string, text: string) => (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-[15px] leading-relaxed">{text}</p>
    </div>
  );
  return (
    <article className="card overflow-hidden" data-testid="study-card">
      <div className="p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
          <FlaskConical size={14} /> {t("Studie kurz erklärt")} · <span className="tnum">{study.year}</span>
        </p>
        <h2 className="mt-2 font-display text-[1.35rem] font-semibold leading-[1.22] tracking-tight text-balance">{study.name}</h2>
        {part(t("Die Frage"), study.question)}
        {part(t("So lief die Studie"), study.method)}
        {!open ? (
          <button onClick={() => setOpen(true)} className="press mt-4 h-11 w-full rounded-full text-sm font-semibold text-white" style={{ background: cat.color }} data-testid="study-reveal">
            {t("Was kam heraus?")}
          </button>
        ) : (
          <div data-testid="study-result">
            {part(t("Das Ergebnis"), study.result)}
            <div className="mt-3 rounded-2xl border border-line bg-raised p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><AlertTriangle size={13} /> {t("Der Haken")}</p>
              <p className="mt-1 text-[15px] leading-relaxed">{study.caveat}</p>
            </div>
            {!isChild(state.ageBand) && (
              <div className="mt-3 flex justify-end">
                <ShareImageButton fileName={`${study.id}.png`} text={`${study.name}: ${study.result}`}
                  card={{ kicker: `${t("Studie kurz erklärt")} · ${study.year}`, title: study.name, detail: `${study.result} ${study.caveat}`, footer: `${t("Quelle:")} ${study.sources.map((s) => s.name).join(", ")}`, color: cat.color }} />
              </div>
            )}
          </div>
        )}
      </div>
      <footer className="border-t border-line px-5 py-3 text-xs text-muted">
        {study.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline">{t("Quelle:")} {s.name} <ExternalLink size={11} /></a>
        ))}
        <p className="mt-1">{study.verification === "verified" ? t("Redaktionell geprüft") : t("Von KI geprüft, noch nicht redaktionell bestätigt.")}</p>
        <div className="mt-1.5"><HintButton kind="fact" id={study.id} label /></div>
      </footer>
    </article>
  );
}
