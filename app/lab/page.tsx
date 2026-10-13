"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, FlaskConical } from "lucide-react";
import VisualCard from "@/components/viz";
import { Empty } from "@/components/ui";
import { animationsFor } from "@/lib/animations";
import { booksFor } from "@/lib/books";
import { categoryById } from "@/lib/categories";
import { useStore, useT } from "@/lib/store";
import { KIND_NAME, visualsFor } from "@/lib/visuals";

/** "Interaktiv": charts and small simulations to try out – overview and one visualisation (?v=<id>). */
export default function LabPage() {
  const { state } = useStore();
  const t = useT();
  const { locale } = state.settings;
  const visuals = useMemo(() => visualsFor(locale, state.ageBand), [locale, state.ageBand]);
  // names of the animations and books a visualisation links to
  const titles = useMemo(() => Object.fromEntries([...animationsFor(locale, state.ageBand), ...booksFor(locale, state.ageBand)].map((x) => [x.id, x.title])), [locale, state.ageBand]);
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("v");
    if (id) setOpenId(id);
  }, []);
  const open = (id: string | null) => {
    setOpenId(id);
    window.history.replaceState(null, "", id ? `?v=${id}` : window.location.pathname);
    window.scrollTo(0, 0);
  };
  const current = visuals.find((v) => v.id === openId);

  if (current)
    return (
      <div className="space-y-4">
        <button onClick={() => open(null)} className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
          <ArrowLeft size={18} /> {t("Alle Visualisierungen")}
        </button>
        <VisualCard key={current.id} visual={current} titles={titles} />
      </div>
    );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Interaktiv")}</h1>
        <p className="text-sm text-muted">{t("Diagramme und kleine Modelle zum Selbst-Verändern: erst schätzen, dann ausprobieren.")}</p>
      </header>
      {visuals.length === 0 && <Empty icon={<FlaskConical size={22} />} title={t("Nichts gefunden")} text={t("Für diese Altersstufe gibt es hier noch nichts.")} />}
      <div className="space-y-3">
        {visuals.map((v) => {
          const cat = categoryById(v.categoryId);
          return (
            <button key={v.id} onClick={() => open(v.id)} className="press card flex w-full items-center gap-4 p-4 text-left" data-testid="visual-row">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: cat.color }}><FlaskConical size={22} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>{t(cat.name)} · {t(KIND_NAME[v.dataKind])}</span>
                <span className="block font-display text-lg font-semibold leading-tight">{v.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted">{v.goal}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
