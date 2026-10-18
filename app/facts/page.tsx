"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Lightbulb } from "lucide-react";
import FactCard from "@/components/FactCard";
import { Chip, Empty } from "@/components/ui";
import { AREAS, factsFor, rankFacts, type Area } from "@/lib/facts";
import { useStore, useT } from "@/lib/store";

/** "Fakten": surprising facts from all areas of life, filterable by area. */
export default function FactsPage() {
  const { state, getState } = useStore();
  const t = useT();
  const [area, setArea] = useState<Area | null>(null);
  // the order is fixed when the page opens, so a fact does not jump away after a reaction
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const facts = useMemo(() => rankFacts(factsFor(state.settings.locale, state.ageBand), getState()), [state.settings.locale, state.ageBand]);
  const areas = (Object.keys(AREAS) as Area[]).filter((a) => facts.some((f) => f.area === a));
  const shown = area ? facts.filter((f) => f.area === area) : facts;
  const wow = facts.filter((f) => state.facts?.wow.includes(f.id)).length;

  return (
    <div className="space-y-4">
      <Link href="/explore/" className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
        <ArrowLeft size={18} /> {t("Zurück zu Entdecken")}
      </Link>
      <header>
        <h1 className="font-display text-3xl font-semibold leading-tight">{t("Fakten")}</h1>
        <p className="text-sm text-muted">{t("Überraschendes aus allen Bereichen – jeder Fakt mit Quelle.")}</p>
        {wow > 0 && <p className="mt-2 text-xs font-semibold text-muted" role="status">{t("{n}× „Wow!“", { n: wow })}</p>}
      </header>
      {areas.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={area === null} onClick={() => setArea(null)}>{t("Alle")}</Chip>
          {areas.map((a) => (
            <Chip key={a} active={area === a} onClick={() => setArea(area === a ? null : a)}>{t(AREAS[a])}</Chip>
          ))}
        </div>
      )}
      {shown.length ? shown.map((f) => <FactCard key={f.id} fact={f} />) : <Empty icon={<Lightbulb size={22} />} title={t("Noch keine Fakten")} text={t("Neue Fakten folgen.")} />}
    </div>
  );
}
