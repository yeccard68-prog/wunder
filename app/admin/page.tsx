"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Flag, MessageSquareWarning, ShieldCheck, Undo2 } from "lucide-react";
import { Bar, Button, Chip, Empty, Segmented, Skeleton } from "@/components/ui";
import ChatReports from "@/components/admin/ChatReports";
import DuelReports from "@/components/admin/DuelReports";
import HeardFrom from "@/components/admin/HeardFrom";
import { categoryById } from "@/lib/categories";
import { bundleEntries, databaseEntries, type ReviewEntry } from "@/lib/review-queue";
import { setApprovals } from "@/lib/reviews";
import { useStore, useT } from "@/lib/store";
import { adminReview, fetchContentReviews, fetchReviewQueue, isAdmin, reviewContent, type ContentReview, type ReviewItem, type ReviewKind } from "@/lib/supabase";

const KINDS: { id: ReviewKind | "all"; name: string }[] = [
  { id: "all", name: "Alle" },
  { id: "question", name: "Fragen" },
  { id: "video", name: "Clips" },
  { id: "book", name: "Bücher" },
  { id: "animation", name: "Animationen" },
  { id: "visual", name: "Visualisierungen" },
  { id: "fact", name: "Fakten" },
];
const KIND_NAME: Record<ReviewKind, string> = { question: "Frage", video: "Clip", book: "Buch", animation: "Animation", visual: "Visualisierung", fact: "Fakt" };
type Tab = "reported" | "open" | "change" | "approved";
const PAGE = 15;

/**
 * Review desk for editors: everything in the app – questions and clips from the database, books,
 * animations and visualisations from the app itself – in one queue. An editor approves a piece or
 * asks for a change with a note. Approvals of bundled content hold for exactly the version read.
 */
export default function AdminPage() {
  const { toast } = useStore();
  const t = useT();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [queue, setQueue] = useState<ReviewItem[] | null>(null);
  const [reviews, setReviews] = useState<ContentReview[]>([]);
  const [tab, setTab] = useState<Tab>("open");
  const [kind, setKind] = useState<ReviewKind | "all">("all");
  const [lang, setLang] = useState<"de" | "en">("de");
  const [busy, setBusy] = useState<string | null>(null);
  const [writing, setWriting] = useState<string | null>(null); // entry whose change note is being written
  const [note, setNote] = useState("");
  const [count, setCount] = useState(PAGE);

  const load = useCallback(async () => {
    try {
      const ok = await isAdmin();
      setAllowed(ok);
      if (!ok) return;
      const [q, r] = await Promise.all([fetchReviewQueue(), fetchContentReviews()]);
      setQueue(q);
      setReviews(r);
    } catch (e) {
      toast((e as Error).message);
      setQueue([]);
    }
  }, [toast]);
  useEffect(() => {
    load();
  }, [load]);

  const byKey = useMemo(() => new Map(reviews.map((r) => [`${r.kind}:${r.id}`, r])), [reviews]);
  const entries = useMemo(() => (queue ? [...databaseEntries(queue, lang, byKey), ...bundleEntries(lang, byKey, t)] : []), [queue, lang, byKey, t]);
  const inTab = (e: ReviewEntry, which: Tab) => (which === "reported" ? e.state === "reported" : which === "change" ? e.state === "change" : which === "approved" ? e.state === "approved" : e.state === "open" || e.state === "outdated");
  const shown = entries.filter((e) => inTab(e, tab) && (kind === "all" || e.kind === kind));
  const bundle = entries.filter((e) => e.hash);
  const bundleDone = bundle.filter((e) => e.state === "approved").length;

  const remember = (entry: ReviewEntry, decision: ContentReview["decision"], text: string | null) => {
    const row: ContentReview = { kind: entry.kind, id: entry.id, decision, note: text, content_hash: entry.hash, reviewed_at: new Date().toISOString() };
    const next = [row, ...reviews.filter((r) => !(r.kind === entry.kind && r.id === entry.id))];
    setReviews(next);
    setApprovals(next.filter((r) => r.decision === "approved")); // the rest of the app shows the new state at once
  };
  const approve = async (entry: ReviewEntry) => {
    setBusy(entry.id);
    try {
      if (entry.kind === "question" || entry.kind === "video") {
        await adminReview(entry.kind, entry.id, "approve");
        setQueue((list) => list?.filter((x) => !(x.kind === entry.kind && x.id === entry.id)) ?? null);
        if (byKey.get(`${entry.kind}:${entry.id}`)?.decision === "change") await reviewContent(entry.kind, entry.id, "approved"); // the change request is settled
      } else {
        await reviewContent(entry.kind, entry.id, "approved", undefined, entry.hash ?? undefined);
        remember(entry, "approved", null);
      }
      toast(t("Geprüft und freigegeben"));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const askChange = async (entry: ReviewEntry) => {
    if (!note.trim()) return;
    setBusy(entry.id);
    try {
      await reviewContent(entry.kind, entry.id, "change", note.trim(), entry.hash ?? undefined);
      remember(entry, "change", note.trim());
      setWriting(null);
      setNote("");
      toast(t("Änderungswunsch gespeichert"));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const withdraw = async (entry: ReviewEntry) => {
    setBusy(entry.id);
    try {
      await adminReview(entry.kind as "question" | "video", entry.id, "withdraw");
      setQueue((list) => list?.filter((x) => !(x.kind === entry.kind && x.id === entry.id)) ?? null);
      toast(t("Zurückgezogen"));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (allowed === null) return <Skeleton />;
  if (!allowed) return <Empty icon={<ShieldCheck size={22} />} title={t("Kein Zugriff")} text={t("Dieser Bereich ist für das Redaktionsteam.")} />;

  const tabCount = (which: Tab) => entries.filter((e) => inTab(e, which) && (kind === "all" || e.kind === kind)).length;

  return (
    <div className="space-y-4" data-testid="review-desk">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Inhalte prüfen")}</h1>
        <p className="mt-1 text-sm text-muted">{t("Lies jeden Inhalt so, wie er in der App steht, und gib ihn frei – oder beschreibe, was geändert werden soll. Ab drei Meldungen wird eine Frage oder ein Clip automatisch aus der App genommen, bis hier entschieden ist.")}</p>
      </div>
      {queue && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted">{t("Bücher, Animationen, Visualisierungen: {a} von {b} freigegeben", { a: bundleDone, b: bundle.length })} · {t("Fragen und Clips offen: {n}", { n: queue.length })}</p>
          <Bar value={bundle.length ? bundleDone / bundle.length : 0} color="var(--good)" />
        </div>
      )}
      <Segmented value={tab} onChange={(v) => { setTab(v); setCount(PAGE); }} options={[
        { value: "open", label: `${t("Offen")} (${tabCount("open")})` },
        { value: "reported", label: `${t("Gemeldet")} (${tabCount("reported")})` },
        { value: "change", label: `${t("Ändern")} (${tabCount("change")})` },
        { value: "approved", label: `${t("Frei")} (${tabCount("approved")})` },
      ]} />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {KINDS.map((k) => (
          <span key={k.id} className="shrink-0">
            <Chip active={kind === k.id} onClick={() => { setKind(k.id); setCount(PAGE); }}>{t(k.name)}</Chip>
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">{t("Sprache der Inhalte")}</span>
        <Segmented value={lang} onChange={setLang} options={[{ value: "de", label: "Deutsch" }, { value: "en", label: "English" }]} />
      </div>

      {queue === null ? (
        <Skeleton />
      ) : shown.length === 0 ? (
        <Empty icon={<Check size={22} />} title={t("Alles erledigt")} text={tab === "reported" ? t("Es gibt keine gemeldeten Inhalte.") : tab === "change" ? t("Es gibt keine offenen Änderungswünsche.") : tab === "approved" ? t("Noch nichts freigegeben.") : t("Alle Inhalte sind von einem Menschen geprüft.")} />
      ) : (
        shown.slice(0, count).map((entry) => {
          const cat = categoryById(entry.categoryId);
          const db = entry.kind === "question" || entry.kind === "video";
          return (
            <article key={entry.kind + entry.id} className="card p-5" data-testid="review-entry" data-kind={entry.kind}>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="uppercase tracking-wider" style={{ color: cat.color }}>{t(cat.name)}</span>
                <span className="text-muted">· {t(KIND_NAME[entry.kind])} · {entry.id}</span>
                {entry.withdrawn && <span className="rounded-full bg-bad/10 px-2 py-0.5 text-bad">{t("Aus der App genommen")}</span>}
                {entry.state === "outdated" && <span className="rounded-full bg-raised px-2 py-0.5">{t("Text seit der Freigabe geändert")}</span>}
                {entry.state === "approved" && <span className="rounded-full bg-good/10 px-2 py-0.5 text-good">{t("Freigegeben")}</span>}
                {entry.reports > 0 && <span className="flex items-center gap-1 rounded-full bg-raised px-2 py-0.5"><Flag size={11} /> {entry.reports}</span>}
              </div>
              <h2 className="font-display text-lg font-semibold leading-snug">{entry.title}</h2>
              {entry.note && (
                <p className="mt-2 flex gap-2 rounded-xl bg-raised px-3 py-2 text-sm"><MessageSquareWarning size={16} className="mt-0.5 shrink-0" /> {entry.note}</p>
              )}
              <div className={`mt-3 space-y-2 text-sm leading-relaxed ${entry.blocks.length > 12 ? "max-h-[60vh] overflow-y-auto rounded-xl border border-line p-3" : ""}`}>
                {entry.blocks.map((b, i) => (
                  <p key={i} className={b.tone === "good" ? "font-semibold text-good" : b.tone === "muted" ? "text-muted" : ""}>
                    {b.label && <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider text-muted">{b.label}</span>}
                    {b.text}
                  </p>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {entry.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">{s.name} <ExternalLink size={11} /></a>
                ))}
                {entry.link && <Link href={entry.link} className="inline-flex items-center gap-1 font-semibold underline">{t("In der App ansehen")}</Link>}
              </div>
              {writing === entry.kind + entry.id ? (
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-semibold" htmlFor={`note-${entry.id}`}>{t("Was soll geändert werden?")}</label>
                  <textarea id={`note-${entry.id}`} value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} className="w-full rounded-xl border border-line bg-surface p-3 text-sm" placeholder={t("z. B. Die Jahreszahl in Schritt 2 stimmt nicht, richtig ist …")} />
                  <div className="flex gap-2">
                    <Button className="h-10 flex-1 text-sm" disabled={!note.trim() || busy === entry.id} onClick={() => askChange(entry)}>{t("Änderungswunsch speichern")}</Button>
                    <Button variant="secondary" className="h-10 text-sm" onClick={() => { setWriting(null); setNote(""); }}>{t("Abbrechen")}</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.state !== "approved" && (
                    <Button className="h-10 flex-1 text-sm" disabled={busy === entry.id} onClick={() => approve(entry)}><Check size={16} /> {t("Geprüft, freigeben")}</Button>
                  )}
                  <Button variant="secondary" className="h-10 flex-1 text-sm" disabled={busy === entry.id} onClick={() => { setWriting(entry.kind + entry.id); setNote(entry.state === "change" ? entry.note ?? "" : ""); }}>
                    <MessageSquareWarning size={16} /> {entry.state === "change" ? t("Notiz ändern") : t("Änderung nötig")}
                  </Button>
                  {db && (
                    <Button variant="secondary" className="h-10 text-sm" disabled={busy === entry.id} onClick={() => withdraw(entry)}><Undo2 size={16} /> {t("Zurückziehen")}</Button>
                  )}
                </div>
              )}
            </article>
          );
        })
      )}
      {shown.length > count && (
        <Button variant="secondary" className="w-full" onClick={() => setCount((c) => c + PAGE)}>{t("Weitere {n} zeigen", { n: Math.min(PAGE, shown.length - count) })} · {shown.length - count}</Button>
      )}
      <HeardFrom />
      <DuelReports />
      <ChatReports />
    </div>
  );
}
