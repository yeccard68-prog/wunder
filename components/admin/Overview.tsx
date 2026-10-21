"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Toggle } from "@/components/ui";
import { reloadFlags, useFlags, type Flags } from "@/lib/flags";
import { fetchOverview, setFlag, type Overview as Data } from "@/lib/supabase";
import { useStore, useT } from "@/lib/store";

/**
 * Editors: how the app is doing – active players per day (answered at least one question), new players, totals –
 * and the switches for chat and groups. Numbers only, no individual players.
 */
export default function Overview() {
  const { toast } = useStore();
  const t = useT();
  const loaded = useFlags();
  const [flags, setFlags] = useState<Flags | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const load = useCallback(() => fetchOverview(14).then(setData, (e) => toast((e as Error).message)), [toast]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (loaded) setFlags(loaded);
  }, [loaded]);

  const toggle = async (key: keyof Flags, on: boolean) => {
    try {
      await setFlag(key, on);
      setFlags(await reloadFlags());
      toast(on ? t("Eingeschaltet") : t("Ausgeschaltet"));
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const max = Math.max(1, ...(data?.days.map((d) => Math.max(d.active, d.new)) ?? [1]));
  const stat = (label: string, value: number | string) => (
    <div className="rounded-2xl bg-raised p-3">
      <p className="tnum font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );

  return (
    <section className="space-y-3" data-testid="overview">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Activity size={18} /> {t("Übersicht")}</h2>
      {data ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stat(t("Spieler gesamt"), data.players)}
            {stat(t("aktiv in 7 Tagen"), data.active7)}
            {stat(t("aktiv in 30 Tagen"), data.active30)}
            {stat(t("Antworten in 30 Tagen"), data.answers30)}
          </div>
          <div className="card p-4">
            <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" /> {t("aktiv (mind. eine Antwort)")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ink/30" /> {t("neu")}</span>
            </p>
            <div className="flex h-28 items-end gap-1" role="img" aria-label={t("Aktive und neue Spieler der letzten 14 Tage")}>
              {data.days.map((d) => (
                <div key={d.day} className="flex h-full flex-1 flex-col justify-end gap-0.5" title={`${new Date(d.day).toLocaleDateString()}: ${d.active} ${t("aktiv")}, ${d.new} ${t("neu")}`}>
                  <div className="rounded-t bg-accent" style={{ height: `${(d.active / max) * 100}%`, minHeight: d.active ? 3 : 0 }} />
                  <div className="rounded-t bg-ink/30" style={{ height: `${(d.new / max) * 60}%`, minHeight: d.new ? 3 : 0 }} />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted">
              <span>{data.days[0] && new Date(data.days[0].day).toLocaleDateString()}</span>
              <span>{t("heute")}</span>
            </div>
          </div>
          <p className="text-xs text-muted">
            {t("Duelle in 30 Tagen: {n}", { n: data.duels30 })} · {t("Gruppen: {n}", { n: data.groups })} · {t("offene Hinweise: {n}", { n: data.openHints })} · {t("offene Chat-Meldungen: {n}", { n: data.openChatReports })} · {t("Datenbank: {s}", { s: data.dbSize })}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">{t("Lädt")}</p>
      )}
      {flags && (
        <div className="card divide-y divide-line px-4">
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold">{t("Chat (Duelle und Gruppen)")}</p>
              <p className="text-xs text-muted">{t("Erst einschalten, wenn Nutzungsbedingungen und Moderation stehen.")}</p>
            </div>
            <Toggle label={t("Chat")} checked={flags.chat} onChange={(on) => toggle("chat", on)} />
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold">{t("Gruppen")}</p>
              <p className="text-xs text-muted">{t("Ausgeschaltet: keine neuen Gruppen, kein Beitreten; Einstiege in der App versteckt.")}</p>
            </div>
            <Toggle label={t("Gruppen")} checked={flags.groups} onChange={(on) => toggle("groups", on)} />
          </div>
        </div>
      )}
    </section>
  );
}
