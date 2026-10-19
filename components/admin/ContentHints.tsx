"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui";
import { fetchContentHints, resolveContentHints, type ContentHint } from "@/lib/supabase";
import { useStore, useT } from "@/lib/store";

const REASON: Record<string, string> = { error: "Hier stimmt etwas nicht", source: "Quelle fehlt oder ist besser", unclear: "Schwer zu verstehen", idea: "Idee oder Wunsch", other: "Etwas anderes" };
const KIND: Record<string, string> = { question: "Frage", fact: "Fakt", video: "Clip", animation: "Animation", book: "Buch", visual: "Interaktiv" };

/** Editors: hints from players, grouped by card. Close them as corrected or as left unchanged. */
export default function ContentHints() {
  const { toast } = useStore();
  const t = useT();
  const [rows, setRows] = useState<ContentHint[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => fetchContentHints().then(setRows, (e) => { toast((e as Error).message); setRows([]); }), [toast]);
  useEffect(() => {
    load();
  }, [load]);
  const resolve = async (r: ContentHint, resolution: "fixed" | "kept") => {
    setBusy(r.kind + r.content_id);
    try {
      await resolveContentHints(r.kind, r.content_id, resolution);
      toast(resolution === "fixed" ? t("Als korrigiert geschlossen") : t("Meldungen geschlossen"));
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  return (
    <section className="space-y-2" data-testid="content-hints">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Flag size={18} /> {t("Hinweise an die Redaktion")}</h2>
      {rows === null ? (
        <p className="text-sm text-muted">{t("Lädt")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{t("Keine offenen Hinweise.")}</p>
      ) : (
        rows.map((r) => (
          <article key={r.kind + r.content_id} className="card space-y-2 p-4">
            <p className="font-semibold">{t(KIND[r.kind] ?? r.kind)} · <span className="font-mono text-sm">{r.content_id}</span></p>
            <p className="text-sm text-muted">{t("{n} Hinweise", { n: r.hints })} · {r.reasons.map((x) => t(REASON[x] ?? x)).join(", ")} · {new Date(r.last_at).toLocaleDateString()}</p>
            {r.notes.slice(0, 5).map((n, i) => <p key={i} className="rounded-2xl bg-raised p-3 text-sm">„{n}“</p>)}
            <div className="flex gap-2">
              <Button variant="secondary" className="h-10 flex-1 text-sm" disabled={busy === r.kind + r.content_id} onClick={() => resolve(r, "fixed")}>{t("Korrigiert")}</Button>
              <Button variant="ghost" className="h-10 text-sm" disabled={busy === r.kind + r.content_id} onClick={() => resolve(r, "kept")}>{t("Bleibt so")}</Button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
