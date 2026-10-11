"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Flag, ShieldCheck, Undo2 } from "lucide-react";
import { Button, Empty, Segmented, Skeleton } from "@/components/ui";
import { categoryById } from "@/lib/categories";
import { useStore, useT } from "@/lib/store";
import { adminReview, fetchReviewQueue, isAdmin, type ReviewItem } from "@/lib/supabase";

/** Review desk for admins: reported content first, then everything a human has not confirmed yet. */
export default function AdminPage() {
  const { toast } = useStore();
  const t = useT();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [tab, setTab] = useState<"reported" | "unverified">("reported");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const ok = await isAdmin();
      setAllowed(ok);
      if (ok) setItems(await fetchReviewQueue());
    } catch (e) {
      toast((e as Error).message);
      setItems([]);
    }
  }, [toast]);
  useEffect(() => {
    load();
  }, [load]);

  const decide = async (item: ReviewItem, action: "approve" | "withdraw") => {
    setBusy(item.id);
    try {
      await adminReview(item.kind, item.id, action);
      setItems((list) => list?.filter((x) => x.id !== item.id) ?? null);
      toast(action === "approve" ? t("Geprüft und freigegeben") : t("Zurückgezogen"));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (allowed === null) return <Skeleton />;
  if (!allowed) return <Empty icon={<ShieldCheck size={22} />} title={t("Kein Zugriff")} text={t("Dieser Bereich ist für das Redaktionsteam.")} />;

  const reported = (items ?? []).filter((i) => i.status === "review" || i.reports > 0);
  const unverified = (items ?? []).filter((i) => i.status !== "review" && i.reports === 0);
  const shown = tab === "reported" ? reported : unverified;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Inhalte prüfen")}</h1>
        <p className="mt-1 text-sm text-muted">{t("Ab drei Meldungen wird ein Inhalt automatisch aus der App genommen, bis hier entschieden ist.")}</p>
      </div>
      <Segmented value={tab} onChange={setTab} options={[{ value: "reported", label: `${t("Gemeldet")} (${reported.length})` }, { value: "unverified", label: `${t("Ungeprüft")} (${unverified.length})` }]} />

      {items === null ? (
        <Skeleton />
      ) : shown.length === 0 ? (
        <Empty icon={<Check size={22} />} title={t("Alles erledigt")} text={tab === "reported" ? t("Es gibt keine gemeldeten Inhalte.") : t("Alle Inhalte sind von einem Menschen geprüft.")} />
      ) : (
        shown.slice(0, 40).map((item) => {
          const cat = categoryById(item.categoryId);
          return (
            <article key={item.kind + item.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="uppercase tracking-wider" style={{ color: cat.color }}>{t(cat.name)}</span>
                <span className="text-muted">· {item.kind === "video" ? "Clip" : t("Frage")} · {item.id}</span>
                {item.status === "review" && <span className="rounded-full bg-bad/10 px-2 py-0.5 text-bad">{t("Aus der App genommen")}</span>}
                {item.reports > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-raised px-2 py-0.5">
                    <Flag size={11} /> {item.reports}
                  </span>
                )}
              </div>
              <h2 className="font-display text-lg font-semibold leading-snug">{item.title}</h2>
              {item.options && (
                <ul className="mt-3 space-y-1 text-sm">
                  {item.options.map((o, i) => (
                    <li key={i} className={i === item.correctIndex ? "font-semibold text-good" : "text-muted"}>
                      {i === item.correctIndex ? "✓" : "·"} {o}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm leading-relaxed">{item.body}</p>
              {item.sourceUrl && (
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-muted underline">
                  {item.sourceName ?? item.sourceUrl} <ExternalLink size={11} />
                </a>
              )}
              {item.note && <p className="mt-2 text-xs text-muted">{item.note}</p>}
              <div className="mt-4 flex gap-2">
                <Button className="h-10 flex-1 text-sm" disabled={busy === item.id} onClick={() => decide(item, "approve")}>
                  <Check size={16} /> {t("Geprüft, freigeben")}
                </Button>
                <Button variant="secondary" className="h-10 flex-1 text-sm" disabled={busy === item.id} onClick={() => decide(item, "withdraw")}>
                  <Undo2 size={16} /> {t("Zurückziehen")}
                </Button>
              </div>
            </article>
          );
        })
      )}
      {shown.length > 40 && <p className="py-4 text-center text-sm text-muted">{t("{n} weitere folgen, sobald diese bearbeitet sind.", { n: shown.length - 40 })}</p>}
    </div>
  );
}
