"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, MessageCircle, Send } from "lucide-react";
import { Sheet } from "@/components/ui";
import { CHAT_MAX, CHAT_POLL_MS, chatAllowedFor, chatProblem, type ChatMessage, type ChatPlace, type ChatReason } from "@/lib/chat";
import { useStore, useT } from "@/lib/store";
import * as api from "@/lib/supabase";

type T = ReturnType<typeof useT>;

function problemText(p: ReturnType<typeof chatProblem>, t: T) {
  if (p === "long") return t("Höchstens {n} Zeichen.", { n: CHAT_MAX });
  if (p === "words") return t("Bitte ohne Beleidigungen.");
  if (p === "link") return t("Links sind im Chat nicht erlaubt.");
  if (p === "contact") return t("Bitte keine Telefonnummern oder E-Mail-Adressen – zu deinem Schutz.");
  return "";
}

/**
 * The chat of a duel or a group. Only for players aged 16+ (the server checks the same and answers
 * "allowed: false" otherwise – then nothing is shown). New messages are fetched every few seconds while
 * the page is visible.
 */
export function Chat({ place, title }: { place: ChatPlace; title?: string }) {
  const { auth, state, toast } = useStore();
  const t = useT();
  const enabled = auth.mode === "live" && chatAllowedFor(state.ageBand);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState<ChatMessage | null>(null);
  const [block, setBlock] = useState(false);
  const last = useRef(0);
  const listRef = useRef<HTMLOListElement>(null);
  const key = `${place.duel ?? ""}|${place.group ?? ""}`;

  const load = useCallback(async (fresh = false) => {
    try {
      const r = await api.fetchChat(place, fresh ? 0 : last.current);
      setAllowed(r.allowed);
      if (!r.messages.length && !fresh) return;
      setMessages((old) => {
        const all = fresh ? r.messages : [...old, ...r.messages.filter((m) => !old.some((o) => o.id === m.id))];
        last.current = all.length ? all[all.length - 1].id : 0;
        return all.slice(-200);
      });
    } catch {
      setAllowed((a) => a ?? false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!enabled) return;
    last.current = 0;
    void load(true);
    const timer = window.setInterval(() => document.visibilityState === "visible" && void load(), CHAT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, load]);

  // keep the newest message in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  if (!enabled || !allowed) return null;
  const problem = text.trim() ? chatProblem(text) : null;

  const send = async () => {
    if (problem || !text.trim() || busy) return;
    setBusy(true);
    try {
      await api.sendChat(place, text);
      setText("");
      await load();
    } catch (e) {
      const m = String((e as { message?: string })?.message ?? e);
      toast(/slow down/.test(m) ? t("Nicht so schnell – warte einen Moment.") : /not allowed/.test(m) ? t("Diese Nachricht ist nicht erlaubt.") : t("Senden hat nicht geklappt."));
    } finally {
      setBusy(false);
    }
  };
  const report = async (reason: ChatReason) => {
    if (!reporting) return;
    try {
      await api.reportChat(reporting.id, reason, block);
      setReporting(null);
      setBlock(false);
      toast(block ? t("Gemeldet und blockiert.") : t("Gemeldet – danke! Wir schauen es uns an."));
      await load(true);
    } catch {
      toast(t("Das hat nicht geklappt. Bitte versuch es noch einmal."));
    }
  };

  return (
    <section className="card p-4" data-testid="chat">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><MessageCircle size={16} /> {title ?? t("Chat")}</h2>
      <ol ref={listRef} className="max-h-72 space-y-2 overflow-y-auto pr-1" aria-live="polite">
        {messages.length === 0 && <li className="py-4 text-center text-sm text-muted">{t("Noch keine Nachrichten. Sag hallo!")}</li>}
        {messages.map((m) => (
          <li key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div className={`group max-w-[85%] rounded-2xl px-3 py-2 text-[15px] leading-snug ${m.mine ? "bg-accent text-white" : "bg-raised"}`}>
              {!m.mine && <p className="mb-0.5 text-xs font-semibold text-muted">{m.name ?? t("Mitspieler")}</p>}
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              {!m.mine && (
                <button onClick={() => setReporting(m)} className="press mt-1 flex items-center gap-1 text-[11px] text-muted" aria-label={t("Nachricht melden")}>
                  <Flag size={11} /> {t("Melden")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value.slice(0, CHAT_MAX + 20))} placeholder={t("Nachricht schreiben")} aria-label={t("Nachricht")} maxLength={CHAT_MAX + 20}
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] outline-none" />
        <button type="submit" disabled={busy || !text.trim() || !!problem} className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-bg disabled:opacity-40" aria-label={t("Senden")}>
          <Send size={17} />
        </button>
      </form>
      {problem && <p className="mt-1.5 text-xs text-bad" role="alert">{problemText(problem, t)}</p>}
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{t("Sei freundlich. Teile keine Kontaktdaten. Nachrichten werden nach 90 Tagen gelöscht.")}</p>

      <Sheet open={!!reporting} onClose={() => { setReporting(null); setBlock(false); }} title={t("Nachricht melden")}>
        <div className="space-y-2 pb-2">
          {reporting && <p className="rounded-2xl bg-raised p-3 text-sm">„{reporting.body}“</p>}
          <label className="flex items-center gap-3 py-2 text-sm font-semibold">
            <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} className="h-5 w-5" />
            {t("Diese Person auch blockieren (du siehst ihre Nachrichten nicht mehr)")}
          </label>
          {([["insult", t("Beleidigend oder gemein")], ["personal", t("Fragt nach persönlichen Daten")], ["spam", t("Spam")], ["other", t("Etwas anderes")]] as const).map(([reason, label]) => (
            <button key={reason} onClick={() => report(reason)} className="press flex h-12 w-full items-center rounded-2xl bg-raised px-4 text-left text-sm font-semibold">
              {label}
            </button>
          ))}
        </div>
      </Sheet>
    </section>
  );
}
