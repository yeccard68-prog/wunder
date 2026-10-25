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

/** Foreign 3D models, textures and light in public/ and the animations that use them (attribution as the licensors ask for it). */
const MODELS: { file: string; used: string; credits: string[][]; source: string; origin?: string; free?: string }[] = [
  {
    file: "arm.glb",
    used: "Animation „Wie Muskeln den Arm bewegen“: Knochen und Muskeln des Arms",
    credits: [
      ["Z-Anatomy – The libre 3D atlas of anatomy", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
      ["BodyParts3D – The Database Center for Life Science", "CC BY-SA 2.1 Japan", "https://creativecommons.org/licenses/by-sa/2.1/jp/"],
    ],
    source: "https://github.com/Z-Anatomy/Models-of-human-anatomy",
  },
  {
    file: "heart.glb",
    used: "Animation „Wie das Herz Blut pumpt“: Herz mit Klappen, große Blutgefäße und Lunge",
    credits: [
      ["Z-Anatomy – The libre 3D atlas of anatomy", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
      ["BodyParts3D – The Database Center for Life Science", "CC BY-SA 2.1 Japan", "https://creativecommons.org/licenses/by-sa/2.1/jp/"],
    ],
    source: "https://github.com/Z-Anatomy/Models-of-human-anatomy",
  },
  {
    file: "lungs.glb",
    used: "Animation „Wie wir atmen“: Lunge, Zwerchfell, Luftröhre mit Bronchien, Rippen und Herz",
    credits: [
      ["Z-Anatomy – The libre 3D atlas of anatomy", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
      ["BodyParts3D – The Database Center for Life Science", "CC BY-SA 2.1 Japan", "https://creativecommons.org/licenses/by-sa/2.1/jp/"],
    ],
    source: "https://github.com/Z-Anatomy/Models-of-human-anatomy",
  },
  {
    file: "eye.glb",
    used: "Animation „Wie das Auge sieht“: Augapfel mit Hornhaut, Iris, Linse, Netzhaut, Augenmuskeln und Sehnerv",
    credits: [
      ["Z-Anatomy – The libre 3D atlas of anatomy", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
      ["BodyParts3D – The Database Center for Life Science", "CC BY-SA 2.1 Japan", "https://creativecommons.org/licenses/by-sa/2.1/jp/"],
    ],
    source: "https://github.com/Z-Anatomy/Models-of-human-anatomy",
  },
  {
    file: "knee.glb",
    used: "Animation „Wie das Knie funktioniert“: Knochen des Knies, Menisken, Kreuzbänder und Oberschenkelmuskel",
    credits: [
      ["Z-Anatomy – The libre 3D atlas of anatomy", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
      ["BodyParts3D – The Database Center for Life Science", "CC BY-SA 2.1 Japan", "https://creativecommons.org/licenses/by-sa/2.1/jp/"],
    ],
    source: "https://github.com/Z-Anatomy/Models-of-human-anatomy",
  },
  {
    file: "brain.glb",
    used: "Animation „Wie das Gehirn aufgebaut ist“: Großhirnlappen, Kleinhirn und Hirnstamm",
    credits: [
      ["Z-Anatomy – The libre 3D atlas of anatomy", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
      ["BodyParts3D – The Database Center for Life Science", "CC BY-SA 2.1 Japan", "https://creativecommons.org/licenses/by-sa/2.1/jp/"],
    ],
    source: "https://github.com/Z-Anatomy/Models-of-human-anatomy",
  },
  {
    file: "mouth.glb",
    used: "Animation „Wie wir Laute formen“: Zunge, Kiefer mit Zähnen, Gaumensegel, Kehlkopf und Rachen",
    credits: [
      ["Z-Anatomy – The libre 3D atlas of anatomy", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
      ["BodyParts3D – The Database Center for Life Science", "CC BY-SA 2.1 Japan", "https://creativecommons.org/licenses/by-sa/2.1/jp/"],
    ],
    source: "https://github.com/Z-Anatomy/Models-of-human-anatomy",
  },
  {
    file: "studio_small_09_1k.hdr",
    used: "Licht und Spiegelungen in allen 3D-Animationen",
    credits: [["Studio Small 09 – Sergej Majboroda, Poly Haven", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/"]],
    source: "https://polyhaven.com/a/studio_small_09",
    origin: "Poly Haven",
    free: "Gemeinfrei, ohne Bedingungen nutzbar.",
  },
  {
    file: "earth-blue-marble.jpg, moon-lroc.jpg",
    used: "Erde und Mond in den Weltraum-Animationen",
    credits: [["NASA Visible Earth – Blue Marble (Reto Stöckli, NASA Goddard Space Flight Center)", "gemeinfrei", "https://visibleearth.nasa.gov/images/57752"], ["NASA Scientific Visualization Studio – CGI Moon Kit (Daten: Lunar Reconnaissance Orbiter)", "gemeinfrei", "https://svs.gsfc.nasa.gov/4720"]],
    source: "https://svs.gsfc.nasa.gov/4720",
    origin: "NASA",
    free: "Bilder der NASA sind gemeinfrei. Die NASA hat mit dieser App nichts zu tun und unterstützt sie nicht.",
  },
];

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
        <p className={p}>{t("Fremde Clips sind gemeinfrei oder stehen unter einer freien Creative-Commons-Lizenz. Sie wurden bearbeitet: gekürzt, auf Hochformat zugeschnitten, ohne Ton. Bearbeitete Fassungen von Werken unter „CC BY-SA“ stehen unter derselben Lizenz. Die Urheber haben mit dieser App nichts zu tun und unterstützen sie nicht. Clips mit „Eigene Produktion“ sind für diese App im Programmcode entstanden; ihre Zahlen sind aus den verlinkten Quellen berechnet.")}</p>
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
        <p className={p}>{t("Die Animationen – gezeichnet und in 3D – sind eigens für diese App im Programmcode entstanden. Fremde 3D-Modelle stecken nur in den unten genannten Animationen; sonst verwenden sie keine fremden Modelle, Bilder oder Videos.")}</p>
        <ul className="card divide-y divide-line text-sm">
          {MODELS.map((m) => (
            <li key={m.file} className="space-y-0.5 px-4 py-3" data-testid="model-credit">
              <p className="font-semibold">{t(m.used)}</p>
              <p className="text-muted">{t(m.free ? "Aus" : "Bearbeitete Auszüge aus")} {m.credits.map(([name, license, url], i) => (
                <span key={name}>{i > 0 && ", "}{name} (<a href={url} target="_blank" rel="noopener noreferrer license" className="underline">{license}</a>)</span>
              ))}. {t(m.free ?? "Bearbeitet: Ausschnitt, Formen vereinfacht, eigene Farben und Bewegung. Das bearbeitete Modell steht unter derselben Lizenz (CC BY-SA 4.0).")}</p>
              <a href={m.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted underline">{t("Original:")} {m.origin ?? "Z-Anatomy"} <ExternalLink size={11} /></a>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={h2}>{t("Was die App speichert")}</h2>
        <ul className={`${p} list-disc space-y-1.5 pl-5`}>
          <li>{t("Ein anonymes Konto ohne Namen und ohne E-Mail-Adresse, damit dein Lernstand erhalten bleibt.")}</li>
          <li>{t("Deinen Lernstand: beantwortete Fragen, Wiederholungen, Punkte, gemerkte Inhalte und deine Einstellungen.")}</li>
          <li>{t("Die App ist ab 16 Jahren freigegeben. Gespeichert wird nur die Altersgruppe, kein Geburtsdatum.")}</li>
          <li>{t("Eine E-Mail-Adresse nur, wenn du dich selbst damit anmeldest.")}</li>
          <li>{t("Duelle: die Spielzüge, deine Antworten und das Ergebnis. Dein Gegner sieht deinen Anzeigenamen (bei privatem Profil nicht) und eure Ergebnisse, sonst nichts von dir. Wenn du jemanden meldest, speichern wir die Meldung mit Grund, damit die Redaktion sie prüfen kann.")}</li>
          <li>{t("Gruppen und Chat (nur ab 16): Gruppenname, Mitglieder, Ergebnisse der Gruppenrunden und Chatnachrichten mit Zeitpunkt. Andere sehen deinen Anzeigenamen (bei privatem Profil oder unter 16 nicht). Chatnachrichten werden nach 90 Tagen gelöscht; gemeldete Nachrichten prüft die Redaktion.")}</li>
          <li>{t("Nur auf deinem Gerät, nie auf dem Server: was du im Feed wie lange angesehen hast – damit Themen passen und du dieselben Inhalte möglichst spät wieder siehst.")}</li>
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
