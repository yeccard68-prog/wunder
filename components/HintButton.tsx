"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button, Chip, Sheet } from "@/components/ui";
import { CHAT_MAX, chatProblem } from "@/lib/chat";
import { useStore, useT } from "@/lib/store";
import * as api from "@/lib/supabase";

export type HintKind = "question" | "fact" | "video" | "animation" | "book" | "visual";
export type HintReason = "error" | "source" | "unclear" | "idea" | "other";
const REASONS: [HintReason, string][] = [
  ["error", "Hier stimmt etwas nicht"],
  ["source", "Quelle fehlt oder ist besser"],
  ["unclear", "Schwer zu verstehen"],
  ["idea", "Idee oder Wunsch"],
  ["other", "Etwas anderes"],
];

/** The hint window on its own – for cards that open it from an existing menu. */
export function HintSheet({ kind, id, open, onClose }: { kind: HintKind; id: string; open: boolean; onClose: () => void }) {
  const { auth, state, toast } = useStore();
  const t = useT();
  const [reason, setReason] = useState<HintReason | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const problem = note.trim() ? chatProblem(note) : null;
  const close = () => {
    setReason(null);
    setNote("");
    onClose();
  };
  const send = async () => {
    if (!reason || problem) return;
    setBusy(true);
    try {
      if (auth.mode === "live") await api.sendContentHint(kind, id, reason, note, state.settings.locale);
      toast(t("Danke! Die Redaktion schaut es sich an."));
      close();
    } catch (e) {
      const m = String((e as { message?: string })?.message ?? e);
      toast(/slow down/.test(m) ? t("Heute sind schon viele Hinweise von dir gekommen – danke! Morgen geht es weiter.") : /not allowed/.test(m) ? t("Bitte ohne Links, Kontaktdaten oder Beleidigungen.") : t("Das hat nicht geklappt. Bitte versuch es noch einmal."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open={open} onClose={close} title={t("Hinweis an die Redaktion")}>
      <div className="space-y-4 pb-2" data-testid="hint-sheet">
        <p className="text-sm text-muted">{t("Nur die Redaktion liest das. Wir prüfen jeden Hinweis und verbessern die Karte, wenn nötig.")}</p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map(([r, label]) => (
            <Chip key={r} active={reason === r} onClick={() => setReason(r)}>{t(label)}</Chip>
          ))}
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">{t("Was genau? (freiwillig)")}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, CHAT_MAX))} rows={3} maxLength={CHAT_MAX} placeholder={t("z. B. „Laut Quelle war es 1934, nicht 1932.“")}
            className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] outline-none focus:border-ink" />
        </label>
        {problem && <p className="text-xs text-bad" role="alert">{problem === "link" ? t("Links sind hier nicht möglich – nenne die Quelle einfach mit Namen.") : t("Bitte ohne Links, Kontaktdaten oder Beleidigungen.")}</p>}
        <Button variant="accent" className="w-full" disabled={!reason || !!problem || busy} onClick={send}>{t("Hinweis senden")}</Button>
      </div>
    </Sheet>
  );
}

/** A small button that opens the hint window. `light`: on top of a dark clip. */
export default function HintButton({ kind, id, light, label }: { kind: HintKind; id: string; light?: boolean; label?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label={t("Hinweis an die Redaktion")} data-testid="hint-button"
        className={label ? "press flex items-center gap-1 text-xs text-muted underline" : `press flex h-11 w-11 items-center justify-center rounded-full ${light ? "bg-white/15 backdrop-blur" : "text-muted"}`}>
        <Flag size={label ? 11 : 17} /> {label && t("Hinweis an die Redaktion")}
      </button>
      <HintSheet kind={kind} id={id} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
