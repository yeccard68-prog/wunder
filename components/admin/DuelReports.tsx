"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui";
import { fetchDuelReports, resolveDuelReports, type DuelReport } from "@/lib/supabase";
import { useStore, useT } from "@/lib/store";

const REASON: Record<string, string> = { name: "Unangemessener Name", cheating: "Schummeln", other: "Etwas anderes" };

/** Editors: players reported in duels. Reset an offensive name, or keep it – either way the reports close. */
export default function DuelReports() {
  const { toast } = useStore();
  const t = useT();
  const [rows, setRows] = useState<DuelReport[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => fetchDuelReports().then(setRows, (e) => { toast((e as Error).message); setRows([]); }), [toast]);
  useEffect(() => {
    load();
  }, [load]);
  const resolve = async (r: DuelReport, reset: boolean) => {
    setBusy(r.reported);
    try {
      await resolveDuelReports(r.reported, reset);
      toast(reset ? t("Name zurückgesetzt") : t("Meldungen geschlossen"));
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  return (
    <section className="space-y-2" data-testid="duel-reports">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Flag size={18} /> {t("Gemeldete Spieler (Duelle)")}</h2>
      {rows === null ? (
        <p className="text-sm text-muted">{t("Lädt")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{t("Keine offenen Meldungen.")}</p>
      ) : (
        rows.map((r) => (
          <article key={r.reported} className="card space-y-2 p-4">
            <p className="font-semibold">{r.display_name ?? t("(gelöschtes Konto)")}</p>
            <p className="text-sm text-muted">{t("{n} Meldungen", { n: r.reports })} · {r.reasons.map((x) => t(REASON[x] ?? x)).join(", ")} · {new Date(r.last_at).toLocaleDateString()}</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="h-10 flex-1 text-sm" disabled={busy === r.reported} onClick={() => resolve(r, true)}>{t("Name zurücksetzen")}</Button>
              <Button variant="ghost" className="h-10 text-sm" disabled={busy === r.reported} onClick={() => resolve(r, false)}>{t("Ist in Ordnung")}</Button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
