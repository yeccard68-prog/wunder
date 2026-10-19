"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { fetchChatReports, resolveChatReport, type ChatReport } from "@/lib/supabase";
import { useStore, useT } from "@/lib/store";

const REASON: Record<string, string> = { insult: "Beleidigend oder gemein", personal: "Fragt nach persönlichen Daten", spam: "Spam", other: "Etwas anderes" };

/** Editors: reported chat messages. Delete the message, or show it again – either way the reports close. */
export default function ChatReports() {
  const { toast } = useStore();
  const t = useT();
  const [rows, setRows] = useState<ChatReport[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(() => fetchChatReports().then(setRows, (e) => { toast((e as Error).message); setRows([]); }), [toast]);
  useEffect(() => {
    load();
  }, [load]);
  const resolve = async (r: ChatReport, remove: boolean) => {
    setBusy(r.message_id);
    try {
      await resolveChatReport(r.message_id, remove);
      toast(remove ? t("Nachricht gelöscht") : t("Meldungen geschlossen"));
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  return (
    <section className="space-y-2" data-testid="chat-reports">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><MessageCircle size={18} /> {t("Gemeldete Chat-Nachrichten")}</h2>
      {rows === null ? (
        <p className="text-sm text-muted">{t("Lädt")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{t("Keine offenen Meldungen.")}</p>
      ) : (
        rows.map((r) => (
          <article key={r.message_id} className="card space-y-2 p-4">
            <p className="rounded-2xl bg-raised p-3 text-sm">„{r.body}“</p>
            <p className="text-sm text-muted">
              {r.display_name ?? t("(gelöschtes Konto)")} · {t("{n} Meldungen", { n: r.reports })} · {r.reasons.map((x) => t(REASON[x] ?? x)).join(", ")}
              {r.hidden ? ` · ${t("für alle ausgeblendet")}` : ""} · {new Date(r.last_at).toLocaleDateString()}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" className="h-10 flex-1 text-sm" disabled={busy === r.message_id} onClick={() => resolve(r, true)}>{t("Nachricht löschen")}</Button>
              <Button variant="ghost" className="h-10 text-sm" disabled={busy === r.message_id} onClick={() => resolve(r, false)}>{t("Ist in Ordnung")}</Button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
