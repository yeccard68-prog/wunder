"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { fetchHeardFrom, type HeardFromRow } from "@/lib/supabase";
import { useStore, useT } from "@/lib/store";

const LABEL: Record<string, string> = { friends: "Freunde oder Familie", tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", store: "Suche im App Store", press: "Artikel oder Presse", school: "Schule oder Uni", other: "Woanders", none: "Keine Angabe" };

/** Editors: where players heard of the app (optional onboarding answer) – totals only, no individual answers. */
export default function HeardFrom() {
  const { toast } = useStore();
  const t = useT();
  const [rows, setRows] = useState<HeardFromRow[] | null>(null);
  useEffect(() => {
    fetchHeardFrom().then(setRows, (e) => { toast((e as Error).message); setRows([]); });
  }, [toast]);
  const total = rows?.reduce((n, r) => n + Number(r.players), 0) ?? 0;
  return (
    <section className="space-y-2" data-testid="heard-from-stats">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Megaphone size={18} /> {t("Wie Spieler von uns gehört haben")}</h2>
      {rows === null ? (
        <p className="text-sm text-muted">{t("Lädt")}</p>
      ) : (
        <div className="card divide-y divide-line px-4">
          {rows.map((r) => (
            <p key={r.heard_from} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="font-semibold">{t(LABEL[r.heard_from] ?? r.heard_from)}</span>
              <span className="tnum text-muted">{t("{n} gesamt · {m} in 30 Tagen", { n: r.players, m: r.last_30_days })} · {total ? Math.round((Number(r.players) / total) * 100) : 0} %</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
