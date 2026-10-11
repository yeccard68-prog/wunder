"use client";

import { useState } from "react";
import { Check, Mail } from "lucide-react";
import { canRegister } from "@/lib/content";
import { useStore, useT } from "@/lib/store";
import { Button } from "./ui";

/**
 * Optional registration.
 *   Guest      → "Fortschritt sichern": the guest account gets an email address, progress stays.
 *   Returning  → t("Anmelden"): one-time link to an existing account (replaces the guest on this device).
 * Social logins are intentionally not offered until this basic flow is proven.
 */
export default function Account({ allowSignIn = true, initialMode = "register" }: { allowSignIn?: boolean; initialMode?: "register" | "signin" }) {
  const { auth, state, toast, registerEmail, signInEmail, signOut } = useStore();
  const t = useT();
  const [mode, setMode] = useState<"register" | "signin">(initialMode);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (auth.mode === "demo")
    return (
      <p className="rounded-2xl bg-raised p-4 text-sm leading-relaxed text-muted">
        {t("Demo-Modus: Es ist kein Backend verbunden. Inhalte sind Beispieldaten, dein Fortschritt liegt nur auf diesem Gerät, eine Anmeldung ist nicht möglich.")}
      </p>
    );

  if (!canRegister(state.ageBand) && auth.isGuest)
    return (
      <p className="rounded-2xl bg-raised p-4 text-sm leading-relaxed text-muted">
        {t("Für ein Konto mit E-Mail-Adresse brauchst du die Zustimmung deiner Eltern. Bis dahin lernst du als Gast weiter – dein Fortschritt bleibt gespeichert.")}
      </p>
    );

  if (!auth.isGuest && auth.email)
    return (
      <div className="rounded-2xl bg-raised p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Check size={16} className="text-good" /> {t("Angemeldet als {email}", { email: auth.email })}
        </p>
        <p className="mt-1 text-sm text-muted">{t("Dein Fortschritt ist gesichert und auf jedem Gerät verfügbar.")}</p>
        <Button variant="secondary" className="mt-3 h-10 text-sm" disabled={busy} onClick={() => { setBusy(true); signOut().catch(() => toast(t("Abmelden fehlgeschlagen"))).finally(() => setBusy(false)); }}>
          {t("Abmelden")}
        </Button>
      </div>
    );

  if (sentTo)
    return (
      <div className="rounded-2xl bg-raised p-4 text-sm leading-relaxed">
        <p className="flex items-center gap-2 font-semibold">
          <Mail size={16} /> {t("Link gesendet an {email}", { email: sentTo })}
        </p>
        <p className="mt-1 text-muted">{mode === "register" ? t("Öffne die E-Mail auf diesem Gerät und tippe auf den Link, um dein Konto zu bestätigen.") : t("Öffne die E-Mail auf diesem Gerät und tippe auf den Link, um dich anzumelden.")}</p>
        <button onClick={() => setSentTo(null)} className="mt-2 text-sm font-semibold underline">{t("Andere Adresse verwenden")}</button>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await (mode === "register" ? registerEmail(email) : signInEmail(email));
      setSentTo(email);
    } catch (err) {
      const m = (err as Error).message ?? "";
      toast(/already|registered|exists/i.test(m) ? t("Diese Adresse hat schon ein Konto – bitte anmelden.") : /rate|security purposes/i.test(m) ? t("Zu viele Versuche. Bitte warte kurz.") : /not found|signups not allowed/i.test(m) ? t("Kein Konto mit dieser Adresse gefunden.") : m || t("Das hat nicht geklappt"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted">
        {mode === "register"
          ? t("Du lernst gerade als Gast. Mit einer E-Mail-Adresse sicherst du deinen Fortschritt und kannst auf anderen Geräten weitermachen.")
          : state.xp > 0
            ? t("Achtung: Nach der Anmeldung siehst du den Stand deines Kontos. Der Gast-Fortschritt auf diesem Gerät ({n} XP) wird nicht übernommen.", { n: state.xp })
            : t("Wir senden dir einen Anmeldelink per E-Mail.")}
      </p>
      <form className="flex gap-2" onSubmit={submit}>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("E-Mail-Adresse")} aria-label={t("E-Mail-Adresse")} autoComplete="email" className="h-12 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] outline-none focus:border-ink" />
        <Button type="submit" disabled={busy}>
          {mode === "register" ? t("Sichern") : t("Anmelden")}
        </Button>
      </form>
      {allowSignIn && (
        <button onClick={() => setMode(mode === "register" ? "signin" : "register")} className="text-sm font-semibold underline">
          {mode === "register" ? t("Ich habe schon ein Konto") : t("Zurück: Gast-Fortschritt sichern")}
        </button>
      )}
    </div>
  );
}
