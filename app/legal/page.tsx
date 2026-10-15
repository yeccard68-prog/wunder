"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import videosJson from "@/content/videos.json";
import { showsAffiliate } from "@/lib/affiliate";
import { BRAND } from "@/lib/brand";
import { useStore, useT } from "@/lib/store";

interface Credit {
  id: string;
  title: string;
  creator_name: string;
  license: string | null;
  status: string;
  sources: { name: string; url: string }[];
  translations?: Record<string, { title: string }>;
}
const credits = (videosJson as unknown as Credit[]).filter((v) => v.status === "published");

/** Link to the licence text, taken from the licence name stored with the clip ("CC BY-SA 4.0, …"). */
function deed(license: string | null): string | null {
  const m = license?.match(/^CC (BY(?:-SA)?) (\d\.\d)/);
  if (m) return `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/`;
  if (license?.startsWith("CC0")) return "https://creativecommons.org/publicdomain/zero/1.0/";
  return null;
}

const SOFTWARE = [
  ["Next.js, React", "MIT"],
  ["Three.js", "MIT"],
  ["Lucide Icons", "ISC"],
  ["Tailwind CSS", "MIT"],
  ["Supabase JS", "MIT"],
  ["Fraunces, Geist (Schriften)", "SIL Open Font License 1.1"],
];

/**
 * "Quellen, Lizenzen & Daten": who made every clip and under which licence it is used, how book
 * content is handled, which open-source software the app contains, and what the app stores.
 * Everything on this page describes what the app actually does – it is not a substitute for the
 * operator's imprint and privacy policy (see docs/LEGAL.md).
 */
export default function LegalPage() {
  const { state } = useStore();
  const t = useT();
  const locale = state.settings.locale;
  const h2 = "font-display text-xl font-semibold";
  const p = "text-sm leading-relaxed text-muted";
  return (
    <div className="space-y-7" data-testid="legal">
      <Link href="/profile/" className="press -ml-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
        <ArrowLeft size={18} /> {t("Profil")}
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t("Quellen, Lizenzen & Daten")}</h1>

      <section className="space-y-2">
        <h2 className={h2}>{t("Texte und Fragen")}</h2>
        <p className={p}>{t("Alle Fragen, Erklärungen und Zusammenfassungen sind eigene Texte. Zu jeder Karte ist eine Quelle verlinkt, an der sich die Aussage nachprüfen lässt. Inhalte mit dem Hinweis „von KI geprüft“ hat noch kein Mensch redaktionell bestätigt.")}</p>
      </section>

      <section className="space-y-2">
        <h2 className={h2}>{t("Bücher")}</h2>
        <p className={p}>{t("Die Buch-Lektionen geben Ideen in eigenen Worten wieder und ordnen sie ein. Sie enthalten keine Auszüge oder Zitate aus den Büchern und keine Buchcover der Verlage; die gezeigten Einbände sind eigene Gestaltungen. Titel und Autorennamen dienen nur dazu, das Werk zu benennen. {brand} steht in keiner Verbindung zu den Autorinnen, Autoren oder Verlagen, und die Lektionen ersetzen das Buch nicht.", { brand: BRAND.name })}</p>
      </section>

      <section className="space-y-3">
        <h2 className={h2}>{t("Clips")} · {credits.length}</h2>
        <p className={p}>{t("Alle Clips sind gemeinfrei oder stehen unter einer freien Creative-Commons-Lizenz. Sie wurden bearbeitet: gekürzt, auf Hochformat zugeschnitten, ohne Ton. Bearbeitete Fassungen von Werken unter „CC BY-SA“ stehen unter derselben Lizenz. Die Urheber haben mit dieser App nichts zu tun und unterstützen sie nicht.")}</p>
        <ul className="divide-y divide-line rounded-2xl bg-surface ring-1 ring-line">
          {credits.map((v) => {
            const url = deed(v.license);
            const name = v.license?.split(",")[0].split(" – ")[0] ?? t("Gemeinfrei");
            return (
              <li key={v.id} className="space-y-0.5 px-4 py-3 text-sm" data-testid="credit">
                <p className="font-semibold leading-snug">{v.translations?.[locale]?.title ?? v.title}</p>
                <p className="text-muted">
                  {v.creator_name} ·{" "}
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer license" className="underline">{name}</a>
                  ) : (
                    t(name === "Gemeinfrei" ? "Gemeinfrei" : name)
                  )}
                </p>
                {v.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted underline">
                    {t("Original:")} {s.name} <ExternalLink size={11} />
                  </a>
                ))}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={h2}>{t("Animationen")}</h2>
        <p className={p}>{t("Alle Animationen – gezeichnet und in 3D – sind eigens für diese App im Programmcode entstanden. Sie verwenden keine fremden Modelle, Bilder oder Videos.")}</p>
      </section>

      <section className="space-y-2">
        <h2 className={h2}>{t("Was die App speichert")}</h2>
        <ul className={`${p} list-disc space-y-1.5 pl-5`}>
          <li>{t("Ein anonymes Konto ohne Namen und ohne E-Mail-Adresse, damit dein Lernstand erhalten bleibt.")}</li>
          <li>{t("Deinen Lernstand: beantwortete Fragen, Wiederholungen, Punkte, gemerkte Inhalte und deine Einstellungen.")}</li>
          <li>{t("Die App ist ab 16 Jahren freigegeben. Gespeichert wird nur die Altersgruppe, kein Geburtsdatum.")}</li>
          <li>{t("Eine E-Mail-Adresse nur, wenn du dich selbst damit anmeldest.")}</li>
          <li>{t("Duelle: die Spielzüge, deine Antworten und das Ergebnis. Dein Gegner sieht deinen Anzeigenamen (bei privatem Profil nicht) und eure Ergebnisse, sonst nichts von dir. Wenn du jemanden meldest, speichern wir die Meldung mit Grund, damit die Redaktion sie prüfen kann.")}</li>
          <li>{t("Nutzungsstatistik nur, wenn du sie im Profil einschaltest. Erfasst wird, welcher Inhalt geöffnet oder abgeschlossen wurde, kein freier Text, kein Standort, keine Gerätedaten.")}</li>
          <li>{showsAffiliate(state.ageBand) ? t("Keine Werbe-Tracker, kein Verkauf von Daten. Einzige Werbung sind gekennzeichnete Affiliate-Links bei den Büchern (siehe unten).") : t("Keine Werbung, keine Werbe-Tracker, kein Verkauf von Daten.")}</li>
          <li>{t("Unter Profil → „Konto und Daten löschen“ entfernst du alles sofort und endgültig.")}</li>
        </ul>
        <p className={p}>{t("Technische Dienstleister: Vercel (Auslieferung der App) und Supabase (Datenbank und Anmeldung).")}</p>
      </section>

      {showsAffiliate(state.ageBand) && (
        <section className="space-y-2" data-testid="legal-affiliate">
          <h2 className={h2}>{t("Werbung: Affiliate-Links")}</h2>
          <p className={p}>{t("Bei jedem Buch steht ein als „Anzeige“ gekennzeichneter Link zur Buchsuche bei Amazon. Kaufst du darüber ein, erhalten wir eine Provision; der Preis ändert sich für dich nicht. Als Amazon-Partner verdienen wir an qualifizierten Verkäufen. Die App lädt dafür nichts von Amazon – keine Bilder, Preise oder Tracker. Erst wenn du den Link öffnest, bist du bei Amazon, und dort gelten Amazons Datenschutzbestimmungen. Die Auswahl und die Texte der Bücher hängen nicht von Provisionen ab.")}</p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className={h2}>{t("Software")}</h2>
        <ul className={`${p} space-y-0.5`}>
          {SOFTWARE.map(([name, license]) => <li key={name}>{name} – {license}</li>)}
        </ul>
      </section>
    </div>
  );
}
