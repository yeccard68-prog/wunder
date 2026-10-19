"use client";

// Registry of visualisation types and the card every visualisation is shown in.
// A new type = one component here + its config type in lib/visuals.ts. A new topic of an existing
// type = one entry in content/visuals.json. See docs/VISUALS.md.
import { lazy, Suspense, useState, type ComponentType } from "react";
import Link from "next/link";
import { BookOpen, Check, ExternalLink, FlaskConical, Hand, Lightbulb, Shapes, Target, X } from "lucide-react";
import KnowledgeCard from "@/components/KnowledgeCard";
import type { VizProps } from "@/components/viz/types";
import { track } from "@/lib/analytics";
import HintButton from "@/components/HintButton";
import { categoryById } from "@/lib/categories";
import { useStore, useT } from "@/lib/store";
import { KIND_NAME, TYPE_NAME, type Visual, type VisualType } from "@/lib/visuals";

/** type → component. Loaded only when a visualisation of that type is shown. */
export const VIZ: Record<VisualType, ComponentType<VizProps>> = {
  growth: lazy(() => import("@/components/viz/GrowthViz")),
  scatter: lazy(() => import("@/components/viz/ScatterViz")),
  market: lazy(() => import("@/components/viz/MarketViz")),
  bars: lazy(() => import("@/components/viz/BarsViz")),
  timeline: lazy(() => import("@/components/viz/TimelineViz")),
};

/**
 * One visualisation as a lesson: goal → prediction (if there is one, the answer is committed
 * before anything can be tried) → the interactive picture → explanation → a task to apply it →
 * matching questions, animations and books. `titles`: names of linked animations and books.
 */
export default function VisualCard({ visual, titles = {} }: { visual: Visual; titles?: Record<string, string> }) {
  const t = useT();
  const { state, items, update } = useStore();
  const color = categoryById(visual.categoryId).color;
  const Viz = VIZ[visual.type];
  const [guess, setGuess] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const revealed = !visual.predict || guess !== null;
  const question = visual.links.filter((l) => l.kind === "question").map((l) => items.find((i) => i.id === l.id)).find((i) => !!i);
  const label = "mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider";
  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    track("visual_predict", visual.id, "visual");
    if (!(state.visuals ?? []).includes(visual.id)) update({ visuals: [...(state.visuals ?? []), visual.id] });
  };
  const changed = () => {
    if (!touched) track("visual_explore", visual.id, "visual");
    setTouched(true);
  };

  return (
    <article className="card space-y-4 p-5" data-testid="visual-card" data-type={visual.type} data-revealed={revealed}>
      <header className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          <FlaskConical size={14} /> {t("Interaktiv")} · {t(categoryById(visual.categoryId).name)}
        </p>
        <h2 className="font-display text-xl font-semibold leading-snug">{visual.title}</h2>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-raised px-2.5 py-1">{t(TYPE_NAME[visual.type])}</span>
          <span className={`rounded-full bg-raised px-2.5 py-1 ${visual.dataKind === "real" ? "text-good" : "text-muted"}`} data-testid="data-kind">{t(KIND_NAME[visual.dataKind])}</span>
        </div>
        <p className="flex gap-2 text-sm leading-relaxed text-muted">
          <Target size={16} className="mt-0.5 shrink-0" style={{ color }} /> {visual.goal}
        </p>
      </header>

      {visual.predict && (
        <section className="rounded-2xl bg-raised p-4" data-testid="visual-predict">
          <p className={label} style={{ color }}>{t("Erst schätzen")}</p>
          <p className="text-[15px] font-semibold leading-snug">{visual.predict.question}</p>
          <div className="mt-3 space-y-2">
            {visual.predict.options.map((option, i) => {
              const right = guess !== null && i === visual.correct;
              const wrong = guess === i && i !== visual.correct;
              return (
                <button key={option} onClick={() => choose(i)} disabled={guess !== null} aria-pressed={guess === i} className={`press flex w-full items-center gap-2 rounded-xl border px-3.5 py-3 text-left text-sm font-medium ${right ? "border-good bg-good/10" : wrong ? "border-bad bg-bad/10" : guess !== null ? "border-line opacity-50" : "border-line bg-surface"}`}>
                  <span className="flex-1">{option}</span>
                  {right && <Check size={16} className="text-good" />}
                  {wrong && <X size={16} className="text-bad" />}
                </button>
              );
            })}
          </div>
          {guess !== null && <p className="pop mt-3 text-sm leading-relaxed" role="status">{visual.predict.feedback}</p>}
        </section>
      )}

      <section className={revealed ? "space-y-3" : "pointer-events-none space-y-3 opacity-40"} aria-hidden={!revealed} inert={!revealed}>
        <p className="text-[15px] leading-relaxed">{visual.intro}</p>
        <Suspense fallback={<div role="status" aria-label={t("Lädt …")} className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-ink" />}>
          <Viz visual={visual} color={color} locale={state.settings.locale} revealed={revealed} onChange={changed} />
        </Suspense>
      </section>

      {revealed && (
        <>
          <section className="rounded-2xl border border-line p-4">
            <p className={label} style={{ color }}><Lightbulb size={14} /> {t("Warum ist das so?")}</p>
            <p className="text-sm leading-relaxed">{visual.explain}</p>
          </section>
          {visual.apply && (
            <section className="rounded-2xl border border-line p-4" data-testid="visual-apply">
              <p className={label} style={{ color }}><Hand size={14} /> {t("Probier es aus")}</p>
              <p className="text-sm leading-relaxed">{visual.apply}</p>
            </section>
          )}
          {question && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("Aus dem Kopf")}</p>
              <KnowledgeCard item={question} />
            </section>
          )}
          {visual.links.filter((l) => l.kind !== "question" && titles[l.id]).map((l) => (
            <Link key={l.id} href={l.kind === "animation" ? `/explain/?a=${l.id}` : `/books/?b=${l.id}`} className="press flex items-center gap-3 rounded-2xl border border-line p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised">{l.kind === "animation" ? <Shapes size={17} /> : <BookOpen size={17} />}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{l.kind === "animation" ? t("Animation") : t("Buch")}</span>
                <span className="block font-semibold leading-snug">{titles[l.id]}</span>
              </span>
            </Link>
          ))}
        </>
      )}

      <footer className="space-y-1.5 border-t border-line pt-3 text-xs leading-relaxed text-muted">
        <p>{visual.note}</p>
        {visual.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 underline">
            {s.name} <ExternalLink size={12} />
          </a>
        ))}
        <p>{visual.verification === "verified" ? t("Redaktionell geprüft") : t("Von KI geprüft, noch nicht redaktionell bestätigt.")}</p>
        <HintButton kind="visual" id={visual.id} label />
      </footer>
    </article>
  );
}
