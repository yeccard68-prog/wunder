# Wunder – Backend, Inhalte und Betrieb

Stand: 12.10.2026. Supabase-Projekt `wunder` (ID `lkmzxxxkfyidhtwrcmdq`, Region Frankfurt, kostenloser Tarif).

## 1. Architektur

```
Next.js (statischer Export, React, Tailwind)  ── später verpackt mit Capacitor (Android/iOS)
   │  lib/store.tsx      App-Zustand, ein Schreibpfad
   │  lib/supabase.ts    einzige Stelle, die mit dem Backend spricht
   ▼
Supabase: Auth (Gast + E-Mail) · PostgreSQL mit Row Level Security · RPC-Funktionen
```

Zwei getrennte Betriebsarten, die nie gemischt werden:

| | Live | Demo |
|---|---|---|
| Aktiv wenn | `.env.local` enthält URL + Publishable Key | keine Backend-Konfiguration |
| Inhalte | aus der Datenbank (ohne Lösungen) | `content/*.json` aus dem App-Paket |
| Antworten prüfen | Server (`submit_answer`) | lokal |
| Fortschritt | Server; Gerät hält nur eine Kopie | nur `localStorage` |
| Kennzeichnung | Offline-Hinweis bei fehlender Verbindung | Banner „Demo-Modus" |

Fällt im Live-Modus eine Anfrage aus, zeigt die App einen Fehlerbildschirm mit „Erneut versuchen" oder – wenn das Gerät den Nutzer schon kennt – den zuletzt geladenen Stand mit Offline-Hinweis. Sie weicht nie auf Beispieldaten aus.

## 2. Tabellen

| Tabelle | Zweck | Wer schreibt |
|---|---|---|
| `categories` | Themen (id, slug, name, description, display_order, is_active) | Import / Admin |
| `questions` | Fragen und „Stimmt das?"-Karten: Text, `options` (JSON-Array), Schwierigkeit, Tags, Quelle, `verification_status`, `status`, `show_in_feed`, `like_count` | Import / Admin |
| `question_answers` | **Privater Lösungsschlüssel**: `correct_index`, `explanation` | Import / Admin – für Nutzer unlesbar |
| `videos` | Clips: Titel, Hook, Beschreibung, `video_url`, `thumbnail_url`, Dauer, Untertitel, Urheber, Quellen, Datum, Tags, Quizfrage, Prüf- und Veröffentlichungsstatus | Import / Admin |
| `profiles` | Anzeigename, Avatar, Interessen, Onboarding, Tagesziel, Motivation, privat; `is_admin`, `is_premium` (nur Server) | Nutzer (nur erlaubte Spalten) |
| `user_stats` | Streak (aktuell, beste, letzter Tag) | nur Server |
| `daily_activity` | **einzige XP-Quelle**: je Nutzer und Tag XP, beantwortete Fragen, Daily-Challenge-Ergebnis | nur Server |
| `question_attempts` | Verlauf aller Antworten (Auswahl, richtig/falsch, Art, Kontext, XP, Tag) | nur Server |
| `question_progress` | aktueller Lernstand je Frage (zuletzt richtig, Wiederholungsfach, Fälligkeit) | nur Server |
| `question_reactions` | Like, Merken, Kein Interesse, Melden je Frage | Nutzer (eigene Zeilen) |
| `video_progress` | Aufrufe, Abschlüsse, Like, Merken, Ausblenden, Melden je Video | Nutzer (eigene Zeilen) |

Gesamt-XP und Wochen-XP sind Summen über `daily_activity` – es gibt keinen zweiten XP-Zähler, der abweichen könnte.

### Server-Funktionen (die API der App)

| Funktion | Aufgabe |
|---|---|
| `submit_answer(question_id, selected, context, local_date, locale)` | prüft die Antwort, vergibt XP, plant Wiederholungen, pflegt Tageszähler und Streak; gibt Lösung + Erklärung + neue Werte zurück |
| `complete_daily_challenge(local_date)` | Bonus (4 XP je richtiger Antwort, +10 bei 5/5) aus den ersten fünf Daily-Antworten des Tages, einmal täglich |
| `get_my_state(local_date, locale)` | kompletter Stand zum Wiederherstellen auf jedem Gerät; Lösungen nur für bereits beantwortete Fragen |
| `delete_my_account()` | löscht Konto und alle zugehörigen Zeilen |

XP-Regeln: erste richtige Antwort 10 × Schwierigkeit („Stimmt das?" 5), falsch 0; fällige Wiederholung richtig 5; erneutes Üben 0. Wiederholungen nach 10 Minuten, 1, 3, 7, 21 Tagen. Das mitgeschickte Gerätedatum darf höchstens einen Tag vom Serverdatum abweichen (Zeitzonen), sonst zählt das Serverdatum.

## 3. Sicherheit

- Row Level Security ist auf allen 11 Tabellen aktiv; Tabellenrechte wurden erst komplett entzogen und dann einzeln vergeben.
- Ohne Anmeldung: nur veröffentlichte Kategorien, Fragen (ohne Lösung) und Videos lesbar. Keine Funktion aufrufbar.
- Angemeldet (auch Gäste): eigene Zeilen lesen; schreiben nur Reaktionen, Video-Fortschritt und sieben Profilfelder. XP, Streak, Versuche, `is_admin`, `is_premium` sind per Rechtevergabe gesperrt.
- Inhalte ändern dürfen nur Profile mit `is_admin = true` (wird ausschließlich im Dashboard gesetzt).
- In der App steckt nur der Publishable Key. Der Secret/Service-Key wird nirgends im App-Code verwendet.
- Supabase-Sicherheitsprüfung: 4 verbleibende Hinweise „angemeldete Nutzer können SECURITY-DEFINER-Funktion ausführen" – das sind genau die vier Funktionen oben und so beabsichtigt.

Tests dazu: `supabase/tests/security_and_scoring.sql` (49 Prüfungen, rollt alles zurück).

## 4. Inhalte pflegen (ohne App-Code anzufassen)

Quelle der Wahrheit: `content/categories.json`, `content/questions.json`, `content/videos.json`.

```bash
npm run content:check                # prüfen: Pflichtfelder, Duplikate, Lösungsindex, Videodateien, Quellen
npm run content:import               # schreibt supabase/seed/content.sql – fügt nur NEUE Datensätze hinzu
npm run content:import -- --update   # … aktualisiert zusätzlich bestehende Inhalte
npm run content:verify               # Prüfsummen lokal + SQL für den Abgleich mit der Datenbank
```

Die erzeugte SQL-Datei im Supabase-Dashboard unter **SQL Editor** ausführen. Sie ist wiederholbar (keine Duplikate), löscht nie etwas und fasst keine Nutzerdaten oder Like-Zähler an.

Ablauf für neue Inhalte: Datensatz mit `"status": "draft"` anlegen → prüfen → `"review"` → nach Freigabe `"published"` und `verification_status` auf `"verified"` setzen → importieren. Nur `published` ist in der App sichtbar. IDs frei wählbar, aber dauerhaft (sie sind der Importschlüssel).

Felder nur im Datensatz, nicht in der Datenbank: `demo_popularity`, `demo_comments` (erfundene Demo-Werte) und `production` (Vorgaben für `npm run clips`).

## 5. Was du im Supabase-Dashboard noch tun musst

1. **Gast-Anmeldung einschalten (erledigt am 11.10.2026):** Authentication → Sign In / Providers → „Allow anonymous sign-ins" → **Save**. Kontrolle: `https://lkmzxxxkfyidhtwrcmdq.supabase.co/auth/v1/settings` muss `"anonymous_users": true` zeigen (Header `apikey` = Publishable Key).
2. **Weiterleitungsadressen:** Authentication → URL Configuration → Site URL auf die Adresse setzen, unter der die App läuft (lokal `http://localhost:3000`), weitere Adressen (z. B. `http://127.0.0.1:3000`, später die echte Domain) unter „Redirect URLs".
3. **E-Mail-Versand für echte Tester:** Der eingebaute Versand ist stark begrenzt und nur für Tests gedacht. Für externe Tester unter Authentication → Emails einen eigenen SMTP-Dienst eintragen.
4. **Missbrauchsschutz für Gäste (empfohlen vor öffentlichem Test):** Authentication → Attack Protection → CAPTCHA aktivieren.
5. **Admin festlegen (optional):** Table Editor → `profiles` → eigene Zeile → `is_admin = true`.

## 6. Konten

- Erster Start: automatisch ein Gastkonto. Alles wird sofort serverseitig gespeichert.
- „Fortschritt sichern": Das Gastkonto bekommt eine E-Mail-Adresse (Bestätigungslink). Die Nutzer-ID bleibt gleich → nichts geht verloren.
- „Ich habe schon ein Konto": Anmeldelink per E-Mail. Danach gilt der Stand des Kontos; die App warnt vorher, dass der Gast-Fortschritt dieses Geräts nicht übernommen wird.
- Abmelden startet ein neues Gastkonto. „Konto und Daten löschen" entfernt alles auf dem Server.

## 7. Tests

```bash
npm test            # 37 Tests: Datensatz, Validierung, Import-SQL, XP, Level, Streak, Wiederholung, Ranking, Sprachen, Altersstufen
npm run typecheck   # TypeScript
npm run build       # Produktions-Build (statischer Export)
```

Datenbank: Inhalt von `supabase/tests/security_and_scoring.sql` im SQL Editor ausführen. Das Ergebnis erscheint als „Fehlermeldung" mit 49 Zeilen, die alle mit `ok` beginnen müssen – der Abbruch am Ende ist Absicht und macht alle Teständerungen rückgängig.

Ein Linter ist im Projekt nicht eingerichtet.

## 8. Veröffentlichung auf iOS und Android

Empfehlung: beim bestehenden Stack bleiben und mit **Capacitor** verpacken. Die App ist bereits ein statischer Export ohne Server-Code, mobil gestaltet und nutzt nur Web-Funktionen. Ein Umbau auf Expo/React Native würde die gesamte Oberfläche neu erfordern und bringt für diesen Funktionsumfang keinen Vorteil.

Offen bis zur Store-Reife:

| Thema | Was fehlt |
|---|---|
| Native Projekte | `@capacitor/android` und `@capacitor/ios` hinzufügen, Builds auf echten Geräten testen (iOS braucht macOS + Xcode) |
| Anmeldelinks | Deep Links / Universal Links (`@capacitor/app`), damit der E-Mail-Link die App öffnet; Redirect-Adresse im Dashboard ergänzen. Alternative ohne Deep Link: 6-stelliger Code statt Link |
| Sitzung | Supabase-Sitzung in sicherem Gerätespeicher statt `localStorage` |
| Videos | aus dem App-Paket in Supabase Storage/CDN verlagern, Vorschaubilder erzeugen |
| Icons & Splash | PNG-Sätze aus `public/icon.svg` erzeugen (`@capacitor/assets`) |
| Kontolöschung | in der App vorhanden; Apple verlangt zusätzlich einen leicht auffindbaren Weg, Google eine Web-Adresse dafür |
| Datenschutz | Datenschutzerklärung, Angaben in App Store Connect / Play Console (E-Mail, Lernfortschritt, Nutzungsdaten), Altersfreigabe |
| Berechtigungen | derzeit keine nötig (kein Kamera-, Mikrofon-, Standortzugriff) |
| Testphase | TestFlight (iOS) und interner/geschlossener Test (Google; neue private Entwicklerkonten brauchen dort einen geschlossenen Test mit mehreren Testern über zwei Wochen, bevor die Produktion freigeschaltet wird – aktuelle Vorgaben vor dem Start prüfen) |
| Moderation | Meldungen landen in der Datenbank; ein Prozess zum Sichten fehlt |
| Social-Logins | bewusst zurückgestellt; sobald welche angeboten werden, verlangt Apple auch „Mit Apple anmelden" |

## 9. Bekannte Einschränkungen

- Live im Browser getestet: Gast-Onboarding, Antworten mit Server-XP, Likes/Merken, Wiederherstellen nach Neuladen, Sprachwechsel, Altersstufe, Clips. Nicht getestet: zweites Gerät, echtes Handy.
- E-Mail-Registrierung und -Anmeldung sind implementiert, aber nicht mit echtem Postfach getestet.
- Community (Profile, Folgen, Rangliste, Challenges, Kommentare) ist weiterhin simuliert bzw. gerätelokal und so gekennzeichnet. Challenge-Siege geben im Live-Modus keine XP.
- Keine Offline-Warteschlange: Ohne Verbindung werden Antworten nicht gespeichert (die App sagt das).
- Abzeichen werden auf dem Gerät aus dem Serverstand berechnet, nicht serverseitig gespeichert.
- Inhalte sind nicht redaktionell geprüft (`verification_status = unverified`); 167 Fragen haben keine Tags, kein Video hat ein Vorschaubild. Die Wikipedia-Links der Fragen wurden nicht einzeln geprüft und verweisen auch für Englisch auf die deutsche Wikipedia.
- Kein Git auf diesem Rechner: Migrationen und Inhalte liegen als Dateien vor, sind aber noch nicht versioniert.
- Gastkonten ohne Aktivität sammeln sich an; ein Aufräumjob fehlt.

## 10. Sprachen

- **Oberfläche:** Deutsch ist die Ausgangssprache; der deutsche Text ist zugleich der Schlüssel. Jede weitere Sprache ist eine Datei `lib/locales/<sprache>.json` (Deutsch → Übersetzung, derzeit Englisch mit 314 Einträgen). Fehlt ein Eintrag, erscheint der deutsche Text. Neue Sprache: Datei kopieren und übersetzen, in `lib/i18n.ts` unter `LOCALES` und `DICTIONARIES` eintragen.
- **Inhalte:** Die Grundzeile bleibt das Original (Deutsch). Übersetzungen liegen pro Datensatz in `translations` (`{"en": {...}}`), in der Datenbank als JSON-Spalte; übersetzte Erklärungen bleiben im privaten Lösungsschlüssel. Die Antwortposition ist in allen Sprachen gleich. Fehlt eine Übersetzung, wird das Original gezeigt – eine Sprache kann also schrittweise wachsen.
- **Auswahl:** beim ersten Start nach Gerätesprache (Deutsch, sonst Englisch), änderbar auf dem Startbildschirm und in den Einstellungen; gespeichert in `profiles.locale`.
- Stand: alle 179 Fragen und 6 Clips liegen auf Deutsch und Englisch vor. Noch nicht übersetzt: Fehlermeldungen von Supabase, Demo-Kommentare, Tests auf Rechts-nach-links-Sprachen.

## 11. Altersstufen

| Stufe | sieht |
|---|---|
| 6–9 | nur Kinderkarten (`min_age = 6`), derzeit 20 Fragen, keine Clips |
| 10–12 | Kinderkarten und Stufe 10, alle sechs Clips |
| 13–15 | Stufen 10 und 13, keine reinen Kinderkarten |
| 16+ (und nicht gefragt) | alles außer reinen Kinderkarten |

- Gespeichert wird nur die gewählte Stufe (`profiles.age_band`), kein Geburtsdatum. Die Angabe ist eine Selbstauskunft und nicht überprüft.
- Unter 13: kein Community-Tab, kein „Folge ich", keine Kommentare, kein Teilen. Unter 16: keine eigenständige Registrierung per E-Mail (Hinweis auf die Eltern); gelernt wird als Gast.
- **Rechtlich offen:** Sobald Kinder gezielt angesprochen werden, gelten strengere Regeln (Einwilligung der Eltern nach DSGVO unter 16 in Deutschland, COPPA in den USA, Familienrichtlinien von Google Play und die Kinderkategorie bei Apple). Das braucht vor einer Veröffentlichung eine rechtliche Prüfung und einen echten Eltern-Einwilligungsweg.

## 12. Clips

- Veröffentlicht sind 31 Clips in sieben Themen, alle aus frei lizenziertem Material: NASA, Wikimedia Commons und Internet Archive (Prelinger). Zugelassen sind nur gemeinfrei, CC0, CC BY und CC BY-SA – nichts mit „NC" oder „ND". Quelle, Urheber und Lizenz stehen je Clip im Datensatz und in der App; bei CC-Material mit dem Hinweis „bearbeitet".
- Die vollständige Quellenliste (Datei-URL, Quellseite, Urheber, Lizenz) liegt in `content/_batches/2026-10-clip-sources.json`.
- Clips sind eigene Dateien unter `public/clips/` (720×1280, H.264, ohne Ton, je 0,4–3 MB, zusammen rund 45 MB) mit Vorschaubild. Kein Fremd-Hosting mehr.
- Bauen: `npm run clips:build` (fehlende), `-- --force` (alle), `-- v-id` (einzelne). Braucht ffmpeg. Schnittangaben stehen je Clip unter `production` (`start`, `end`, `mode` crop/tall/wide, `x`, `cropBottom`, `loops`). Quellvideos werden in `scripts/clips/.cache` zwischengespeichert (nicht im Git).
- Hilfen: `scripts/clips/find.mjs` (Suche in den drei Archiven), `scripts/clips/sheet.mjs` (Standbild-Übersicht einer Quelle).
- Die Ausschnitte wurden anhand von Standbildern ausgewählt und geprüft, nicht in voller Länge angesehen.
- Die sechs früheren Balken-Clips sind archiviert (`status = archived`), nicht gelöscht.
- Higgsfield: Mit dem kostenlosen Konto (10 Credits) war kein Testvideo möglich.

## 13. Inhalte erweitern (Stand)

- 188 Feed-Karten + 37 Video-Quizfragen in sieben Themen (neu: Business, 21 Karten + 3 Clips).
- Erweiterungen kommen als Stapel: `content/_batches/<name>.mjs` → `node scripts/content/apply-batch.mjs <datei>` → `npm run clips:build` → `npm run content:check` → Import.
- Größere Importe: Ein Admin-Konto lädt die Zeilen über die Schnittstelle hoch (`node scripts/content/rows.mjs <datei>` erzeugt sie). Danach `npm run content:verify`: Prüfsummen lokal und in der Datenbank müssen gleich sein.

## 14. Inhaltsprüfung

- Prüfstatus je Frage und Clip: `unverified` → `ai_checked` (von der KI geschrieben und gegengeprüft) → `verified` (von einem Menschen freigegeben). Die Datenbank verbietet, dass Ungeprüftes veröffentlicht ist.
- Aktuell ist alles `ai_checked`. `verified` setzt nur ein Mensch im Prüfbildschirm.
- Meldungen: Melden drei verschiedene Lernende (mit je mindestens fünf beantworteten Fragen) denselben Inhalt, wechselt er automatisch auf `review` und verschwindet aus der App, bis ein Admin entschieden hat.
- Prüfbildschirm: `/admin/` (Link im Profil, nur für Admins). Reiter „Gemeldet" und „Ungeprüft"; Freigeben (`verified`, wieder online, Meldungen gelöscht) oder Zurückziehen (`archived`). Dahinter steht die Server-Funktion `admin_review`.
- Admin wird man nur über die Datenbank: `update profiles set is_admin = true where id = '<Nutzer-ID>'`.

## 15. Erklär-Animationen („So funktioniert’s“)

- Fünf Animationen (Herz, Benzinmotor, Gewitter, Batterie, Erdplatten), erreichbar über die Startseite, Seite `/explain/`.
- Die App zeichnet sie selbst als SVG – keine Videodateien, keine externen Dienste, keine Kosten. Jede Animation besteht aus Schritten mit je einem Erklärsatz; man kann pausieren, schrittweise vor- und zurückgehen und neu starten. Bei „Bewegung reduzieren“ startet nichts von selbst.
- Texte und Metadaten: `content/animations.json` (Titel, Kurzbeschreibung, Lernziel, Altersstufe, Kategorie, Schwierigkeit, Schritte mit Dauer, Sprache, Renderer, Quellen, Quizfrage, Prüfstatus, Übersetzungen). Zeichnungen: `components/anim/scenes.tsx`, Abspieler: `components/anim/AnimationPlayer.tsx`.
- Neue Animation: Szene in `scenes.tsx` schreiben und in `SCENES` eintragen, Datensatz in `animations.json` ergänzen, Verständnisfrage als normalen Fragen-Stapel anlegen. `npm test` prüft Vollständigkeit, Quellen und die Verknüpfung zur Frage.
- Die Metadaten liegen im App-Paket, nicht in der Datenbank (die Zeichnungen sind ohnehin Code). Die Verständnisfragen sind normale Karten und werden wie alle anderen auf dem Server gewertet.
- Stand der Prüfung: von der KI geschrieben und gegengeprüft, noch nicht von einem Menschen freigegeben. Die Darstellungen sind Schemata, keine anatomisch oder technisch maßstäblichen Zeichnungen.

## 16. Gemeinsamer Feed und Stand der Inhalte (14.10.2026)

- Die Startseite zeigt einen gemeinsamen Feed: nach je drei Fragekarten folgt etwas zum Ansehen – Clip, Animation, Clip, Clip, Animation … (`lib/feed.ts`, getestet in `tests/feed.test.ts`). Neues kommt zuerst; gesehene Clips und Animationen mit beantworteter Frage rücken nach hinten. Die Verständnisfrage einer Animation erscheint bei der Animation, nicht noch einmal als eigene Karte.
- Clips spielen im Feed stumm, solange sie zu mindestens 60 % sichtbar sind; Animationen starten, wenn sie ins Bild kommen. Die Seiten „Clips“ und `/explain/` bleiben als eigene Ansichten bestehen.
- Bestand: 507 Karten im Feed (+ 37 Video-Quizfragen) in neun Themen, 31 Clips, 8 Animationen. Alles `ai_checked`, nichts `verified`.
- Neue Themen: `math` (Mathe & Logik), `language` (Sprache). Karten tragen jetzt Schlagwörter (`tags`) als Unterthema.
- Stapel-Werkzeuge: `scripts/content/check-sources.mjs <stapel>` prüft, ob jede genannte Wikipedia-Seite existiert; `content/_batches/_balance.mjs` verteilt die Position der richtigen Antwort gleichmäßig.
- Die App lädt Inhalte seitenweise (je 500 Zeilen, `allRows` in `lib/supabase.ts`). Vorher war bei 500 Fragen Schluss.
- Beim Hochladen neuer Stapel nur fehlende Zeilen einfügen (kein Überschreiben): sonst würden gemeldete, zurückgestellte Inhalte wieder veröffentlicht.

## 17. Navigation und Schnapp-Feed (Umbau Oktober 2026)

- Vier Ziele statt fünf: **Für dich** (`/`), **Entdecken** (`/explore/`), **Bibliothek** (`/library/`), **Profil**. Clips, Quiz-Runden, Animationen und Community sind keine eigenen Reiter mehr; ihre Seiten gibt es weiter, erreichbar über „Entdecken“.
- Begründung für den Wegfall des Clips-Reiters: Alle Clips stehen im gemeinsamen Feed, die Vollbild-Ansicht bot nur dieselben Inhalte in anderer Verpackung. Sie bleibt als Sammlung „Alle Clips“ erhalten. Nutzungsdaten, die dagegen sprächen, gibt es noch nicht (keine Analytics).
- „Für dich“ ist ein Schnapp-Feed (`components/Feed.tsx`, `layout="snap"`): ein Eintrag pro Bildschirm, natives CSS-Scroll-Snapping (`snap-mandatory`, `snap-always`), die Seite selbst scrollt nicht. Erster Bildschirm ist „Heute“ (Tagesziel, Daily Challenge, fällige Wiederholungen). Clips füllen den Bildschirm, Karten sind zentriert; ein Eintrag, der höher ist als der Bildschirm, lässt sich weiter durchscrollen.
- Es wird nur geladen, was gebraucht wird: je sechs Einträge, Videos nur für Einträge in Bildschirmnähe, Animationen laufen nur im Bild. „Bewegung reduzieren“ wird beachtet (kein Autostart).
- „Entdecken“: Suche über Fragen, Clips und Animationen sowie Themenfilter; „Bibliothek“: Gemerktes und Weiterlernen (Wiederholungen, Animationen).
- Wiederherstellbarer Stand vor dem Umbau: Git-Tag `v0.5-vor-umbau`.

## 18. 3D-Animationen

- Rahmen: `components/three/Stage3D.tsx` (Bühne) + `components/three/scenes/*.ts` (Szenen) + `components/three/types.ts` (Vertrag). Bibliothek: Three.js 0.170 (MIT, kostenlos), keine weiteren Abhängigkeiten, keine externen Modelle – alle Geometrie wird im Code erzeugt.
- Eine Szene baut ihre Objekte einmal und liefert dann für (Schritt, Fortschritt, Zeit) Objektzustand, Kameraposition und Beschriftungen. Der vorhandene Abspieler (Schritte, Erklärsätze, Pause, Vor/Zurück, Verständnisfrage) wird unverändert genutzt: in `content/animations.json` genügt `"renderer": "three"` und der Szenenname.
- Leistung: Three.js wird erst geladen, wenn eine 3D-Animation gezeigt wird (eigene Datei, rund 0,6 MB vor Komprimierung). Es gibt keine eigene Zeichenschleife – gezeichnet wird genau ein Bild pro Änderung; pausierte oder nicht sichtbare Animationen kosten nichts. Auflösung auf das Doppelte der Bildschirmpunkte begrenzt.
- Bedienung: waagerechtes Ziehen dreht die Szene; senkrechtes Wischen bleibt beim Feed. Beschriftungen sind HTML über der Zeichenfläche und bleiben vollständig im Bild.
- Rückfall: Fehlt WebGL oder geht der Grafikkontext verloren, zeigt der Abspieler die 2D-Zeichnung (`fallback_scene`), sonst einen Hinweis; die Erklärsätze bleiben in jedem Fall. Beides ist per Browser-Test abgedeckt.
- Szenen: `engine` (Viertaktmotor, aufgeschnittener Zylinder), `dna` (Doppelhelix, Basenpaarung, Verdopplung), `orbit` (Trägheit + Schwerkraft, Keplersche Gesetze). Die Ellipse ist bewusst übertrieben; das steht im Text.
- Hinweis für die Android-Verpackung: Der statische Export legt Vorlade-Dateien als `__next.<seite>/__PAGE__.txt` ab, angefragt wird `__next.<seite>.__PAGE__.txt`. Vercel löst das auf; ein einfacher Dateiserver nicht (siehe `scripts/serve-static.mjs`). Vor dem Capacitor-Build prüfen.

## 19. Bücher

- 20 Sachbücher mit je drei Lerneinheiten (60 Ideen, 18 davon mit interaktiver Darstellung). Quelle der Texte: `content/_batches/2026-10-books.mjs`; `node scripts/content/build-books.mjs` prüft und schreibt `content/books.json`. Schlägt die Prüfung fehl (fehlende Texte, weniger als drei Ideen, unbekannte Darstellung, fehlende Quellseite, doppelte Idee, Sprachen weichen ab), wird nichts geschrieben.
- Jedes Buch: Titel, Autor, Jahr, Kernthese, Ideen (Erklärung + Beispiel + optional Darstellung), Einordnung und Kritik, Frage zum Weiterdenken, Wissens-Check (normale Karte `bq-…`, Wertung auf dem Server), verwandte Bücher, Quelle, Prüfstatus, Lesezeit.
- Urheberrecht: nur eigene Erklärungen, keine Auszüge, keine Buchcover (eigene typografische Karten). Was der Autor behauptet und was Kritik ist, steht getrennt.
- Darstellungen (`components/books/Visual.tsx`): `loop` (Kreislauf), `compare` (Gegenüberstellung), `scenario` (erst entscheiden, dann Erklärung), `growth` (Zinseszins mit Schieberegler). Neue Arten dort und in `build-books.mjs` ergänzen.
- Seiten: `/books/` (Regal mit Suche und Sparten, „Weiterlesen“, gemerkte Ideen; `?b=<id>` öffnet ein Buch). Einzelne Ideen erscheinen im Feed (Rhythmus Clip – Animation – Buch-Idee – Clip), in der Suche und in der Bibliothek.
- (überholt, siehe Abschnitt 23) Fortschritt und gemerkte Ideen lagen im Profilzustand auf dem Gerät (`state.books`), noch nicht in der Datenbank – sie wandern nicht auf ein zweites Gerät.

## 20. Fragetypen

- Neben Auswahlfragen (`question`) und „Stimmt das?“ (`fact`) gibt es `order` (Reihenfolge), `estimate` (Schätzen per Schieberegler mit Toleranz) und `blank` (Lückentext).
- Der Lösungsschlüssel steht in `question_answers.answer` (für Clients unlesbar). Gewertet wird in `submit_response()`; XP, Wiederholung und Serie laufen danach durch dasselbe `submit_answer()` wie bisher. Über `submit_answer()` direkt lassen sich die neuen Typen nicht beantworten.
- Dieselben Regeln gelten im Demo-Modus (`lib/formats.ts`, `evaluate`). Eingaben: `components/Formats.tsx`.
- Inhalte anlegen: Export `formats` in einem Stapel (siehe `content/_batches/2026-10-formats.mjs`). Die Erklärung muss die Lösung nennen – nach einem Neuladen sieht man nur sie.
- Migration: `supabase/migrations/20261016120000_question_formats.sql` (nur Ergänzungen).

## 21. Tempo der Animationen

- Eine Stelle für alle: `TIMING` in `lib/animations.ts` (Faktor auf die Schrittdauern, Mindestdauer je Schritt, Faktor für laufende Bewegung, feste Dauer für Kamerafahrten und Einblendungen).
- Stand: Faktor 0,7 → jede Animation läuft 30 % schneller als zuerst geschrieben (Herz 29 → 20 s, Motor 26 → 18 s, neuronales Netz 32 → 22 s, DNA 34 → 24 s). Kamerafahrten dauern 0,8 s statt eines Drittels des Schritts.
- Messen: `node scripts/measure-animations.mjs "Herz" "Benzinmotor"` (Laufzeit erster Durchlauf und Wiederholung, Bilder pro Sekunde). Bildraten hängen vom Gerät ab.

## 22. Nutzungsmessung

- Tabelle `public.events` (Migration `20261016150000_usage_events.sql`): Konto, Ereignisname aus fester Liste, höchstens ID und Art des Inhalts, Zeitpunkt. Kein Freitext, keine Gerätedaten, kein Standort. Clients dürfen eigene Zeilen einfügen und nichts lesen.
- Geschrieben wird nur mit Einwilligung: Schalter „Nutzungsstatistik teilen“ in den Einstellungen, **standardmäßig aus**. Nie im Demo-Modus, nie für Kinder-Altersstufen (zusätzlich in der Datenbank verboten).
- Ereignisse heute: `session_start`, `clip_start`, `clip_complete`, `animation_complete`, `insight_complete`, `book_open`, `content_save`. Antworten auf Fragen stehen ohnehin in `question_attempts`.
- Auswertung: per SQL im Supabase-Dashboard. Ein Auswertungs-Bildschirm fehlt noch. Weil der Schalter aus ist, kommen erst Daten, wenn Nutzer ihn einschalten – für belastbare Zahlen müsste beim Onboarding gefragt werden (Entscheidung offen).
- Markenname: Vorprüfung und Empfehlung in `docs/BRAND.md`; der Name steht zentral in `lib/brand.ts`.

## 23. Lernpfade: Bücher, Clip-Fragen, Animationen (13.10.2026)

- **Buch-Lektion** (`components/books/InsightCard.tsx`): Einstiegsfrage → Idee mit Darstellung und Beispiel → Abruf aus dem Kopf (Antwort erst auf Tipp) → Selbsteinschätzung → Transferaufgabe (mindestens eine je Buch) → Merksatz. Inhalte: `content/_batches/2026-10-books-learning.mjs` (Lernziel je Buch, je Idee Format, Einstiegsfrage, Abruf, Merksatz, Beleg-Stufe, Querverweise); `build-books.mjs` prüft und führt sie mit den Buchtexten zusammen.
- **Acht Formate** (`FORMAT_NAME` in `lib/books.ts`): erklären, hinterfragen, anwenden, merken, vergleichen, Denkfehler finden, Denkmodell, mehrere Beispiele. **Beleg-Stufe** je Idee: gut belegt · These des Autors · umstritten.
- **Wiederholung:** `rateRecall` – gewusst: Abstand 2, 7, 21, 60 Tage; nicht gewusst: morgen wieder. Fällige Ideen stehen im Feed vorn und unter „Heute wiederholen“. „Gelernt“ heißt: mindestens einmal aus dem Kopf abgerufen – ansehen allein zählt nicht. Kennzahlen: `recallStats` (abgerufen, nach Pause gewusst, unsicher).
- **Geräteübergreifend:** Tabelle `book_states` (ein JSON je Konto, nur eigene Zeile les- und schreibbar, höchstens 60 kB). Beim Start werden Gerät und Konto zusammengeführt (`mergeBookState`), Änderungen nach 1,2 s geschrieben.
- **Clip-Fragen:** Einblendungen laufen jetzt auch im Feed mit; die Frage wird nach dem ersten vollständigen Durchlauf hervorgehoben. Falscher erster Versuch → Hinweis, Option gesperrt, zweiter Versuch, keine Lösung. Server: `check_first_attempt()` beurteilt genau einen ersten Versuch je Frage und Konto (Tabelle `clip_quiz_attempts`, für Clients unlesbar); gewertet wird weiter in `submit_answer()`. Ein richtiger zweiter Versuch bekommt derzeit die vollen Punkte.
- **Animationen:** Tempo je Animation (`timing.pace`, `timing.motion` in `content/animations.json`, gesetzt durch `content/_batches/2026-10-animations-learning.mjs`); `TIMING` liefert nur noch Standardwerte. Je Animation eine Vorhersagefrage (`predict`): Die Animation hält einmal vor dem Schritt an, der die Antwort zeigt.
- **3D-Leistung:** Bühne wird erst nahe am Bildschirm gebaut und beim Verlassen samt WebGL-Kontext freigegeben; schwache Geräte (≤ 4 GB oder ≤ 4 Kerne) starten ohne Kantenglättung mit geringerer Auflösung; braucht ein Bild im Schnitt über 24 ms, sinkt die Auflösung einmalig; Beschriftungen werden nicht mehr in jedem Bild neu vermessen.
- **Rechtliches:** Seite `/legal/` (Clip-Nachweise mit Lizenz-Links, Bücher, Daten, Software); Checkliste in `docs/LEGAL.md`.
- Migration: `supabase/migrations/20261018100000_learning_state.sql` (nur Ergänzungen).

## 24. Realismus der 3D-Szenen (13.10.2026)

- **Bühne für alle Szenen** (`Stage3D.tsx`): Hintergrund mit weichem Lichtkegel statt Einheitsfarbe, zusätzliches kühles Kantenlicht von hinten. Eine Szene kann über `stage: { shadows, floor }` weiche Schatten und einen unsichtbaren Boden anfordern, der nur den Schatten zeigt. Schatten gibt es nicht auf schwachen Geräten.
- **Zahnräder:** Zähne mit echten Proportionen (Kopfhöhe = Modul, Fußhöhe = 1,25 × Modul, zur Spitze schmaler werdende Flanken, gerundeter Zahnfuß), erhabene Nabe mit Passfeder auf heller Welle, Erleichterungsbohrungen bei größeren Rädern, verschraubte Lagerflansche auf dunkler Grundplatte, auf die die Räder Schatten werfen. Übersetzung und Eingriff unverändert.
- **Motor:** Pleuel mit kleinem und großem Auge und Steg statt Quader, sichtbarer Kolbenbolzen, Kühlrippen am Zylinder, untere Kurbelgehäuse-Hälfte, Ventilfedern mit Federteller, die beim Öffnen zusammengedrückt werden; Schatten auf dem Boden.
- **DNA:** Schatten der Stränge aufeinander. **Planetenbahn und Linse:** nur Hintergrund und Kantenlicht, keine Schatten (Weltraum bzw. Glas).
- Gemessen am Entwicklungs-PC (`scripts/measure-animations.mjs`, beantwortet jetzt die Vorhersagefrage selbst): Motor, Zahnräder, DNA je 60 Bilder pro Sekunde, Laufzeiten unverändert.

## 25. 3D-Ausbau (13.10.2026)

- **Linse** (`scenes/lens.ts`): gedrehtes bikonvexes Linsenprofil aus echtem Glas (Lichtdurchlass mit Brechzahl 1,5), optische Bank mit Skala, Halter und Tisch, Lichtstrahlen als leuchtende Bündel, Gegenstand ist eine brennende Kerze, das Bild eine kopfstehende Kerze aus Licht in der Größe, die die Linsengleichung ergibt.
- **Planetenbahn** (`scenes/orbit.ts`): gemalte Oberflächen (Sonne mit Granulation, blauer Planet, Gesteinsplanet, Gasriese), Leuchten der Sonne, drehende Planeten mit Tag- und Nachtseite, Sterne in zwei Helligkeiten. Neue Bühnen-Option `stage.space`: schwarzer Hintergrund, kein Umgebungslicht.
- **Elektromotor** (`scenes/emotor.ts`) und **Batterie** (`scenes/cell.ts`) sind von der Zeichnung nach 3D gewandert; die Zeichnungen bleiben Rückfall ohne 3D. Motor: Hufeisenmagnet, Spule aus drei Windungen, geteilter Schleifring mit Bürsten, Batterie, Kraftpfeile (linke Seite immer nach oben, rechte nach unten). Batterie: Glas mit Elektrolyt, zwei Metallplatten, Draht mit Lampe, Elektronen im Draht, Ionen in der Flüssigkeit.
- **Neu:** Jahreszeiten (`seasons`), Mondphasen (`moon`, die Phasen entstehen aus der berechneten Beleuchtung beim Blick von der Erde), Hebel (`lever`). Inhalte und Prüffragen: `content/_batches/2026-10-animations-3d-4.mjs`. Gemalte Kugeloberflächen liegen gemeinsam in `components/three/surface.ts` – stilisiert, keine Fotos, keine fremden Texturen.
- Stand: 15 Animationen, davon 10 in 3D und 5 gezeichnet (Herz, Gewitter, Erdplatten, neuronales Netz, Sternentstehung). 602 Fragen (558 im Feed).
- Gemessen am Entwicklungs-PC: Elektromotor, Mondphasen, Hebel, Motor, Zahnräder, DNA je 60 Bilder pro Sekunde. Die Linse erreicht im sichtbaren Browser 60, im Messskript ohne Bildschirm läuft sie nicht durch (Glas mit Lichtdurchlass ist dort sehr langsam) – auf schwächeren Handys ist sie die Szene mit dem größten Risiko.

## 26. Erdplatten und Sternentstehung in 3D (13.10.2026)

- **Erdplatten** (`scenes/plates.ts`): Blockbild aus der Erde geschnitten – glühender Mantel mit umlaufendem Gestein, ozeanische Platten mit Streifen am Meeresboden (machen die Bewegung sichtbar), Ozean, aufquellendes Magma am Rücken, abtauchende Platte mit Gebirge und Vulkan, zum Schluss Blick von oben auf eine Verwerfung: Die Platten hängen fest, rucken, Wellen breiten sich aus und ein Weg ist versetzt. Höhen überzeichnet, Millionen Jahre in Sekunden (steht im Code-Kommentar; die Schritttexte nennen „wenige Zentimeter pro Jahr“).
- **Sternentstehung** (`scenes/starbirth.ts`): 3.200 Teilchen als Wolke, die zusammenfällt, schneller dreht und zur Scheibe abflacht; Protostern glimmt erst rot, wird orange und nach dem Zünden weißgelb; innere Teilchen fallen in den Stern.
- Die Zeichnungen bleiben als Rückfall ohne 3D. Texte und Prüffragen unverändert.
- Sonnenleuchten in allen Szenen mit steilerem Abfall (im linearen Licht war der Rand des Leuchtens als Kante sichtbar).
- Stand: 15 Animationen, 12 in 3D, 3 gezeichnet (Herz, Gewitter, neuronales Netz).

## 27. Gewitter, neuronales Netz, Finsternisse, Treibhauseffekt (13.10.2026)

- **Gewitter** (`scenes/storm.ts`): Landschaft mit Bäumen, aufsteigende Warmluft, Wolkenturm aus 64 weichen Kugeln mit Amboss, Eiskristalle und Graupel, Ladungszeichen (+ oben, – unten, + am Boden), gezackter Blitz mit Lichtblitz. Die Szene setzt ihren eigenen Himmel als Hintergrund.
- **Neuronales Netz** (`scenes/neural.ts`): 16 Eingänge, 6 verborgene Neuronen, 2 Ausgänge – wirklich gerechnet. Linienfarbe = Gewicht (orange positiv, blau negativ), Helligkeit der Neuronen = Aktivierung. Vor dem Training gewinnt die falsche Antwort, beim Training läuft der Fehler rot rückwärts und die Gewichte wandern zu den trainierten Werten.
- **Neu:** Finsternisse (`eclipse`, geneigte Mondbahn, Mondschatten auf der Erde, rötlicher Mond im Erdschatten) und Treibhauseffekt (`greenhouse`, Sonnenlicht, Wärmestrahlung, CO₂-Moleküle, Thermometer, Kraftwerk). Inhalte: `content/_batches/2026-10-animations-3d-5.mjs`; gemeinsame Zusammenführung jetzt in `scripts/content/merge-animations.mjs`.
- Beim Treibhauseffekt sind die Anteile zurückgeschickter Strahlung („etwa die Hälfte“, „etwa drei Viertel“) reine Veranschaulichung, keine Messwerte – steht im Kopf der Szene.
- Stand: 17 Animationen, 16 in 3D, eine gezeichnet (Herz). 604 Fragen (560 im Feed).

## 28. Interaktive Visualisierungen, Sport, Weiterscrollen, drei Animationen (13.10.2026)

- **Interaktiv** (`/lab/`): Datenmodell `content/visuals.json`, Formeln `lib/visuals.ts`, Bausteine und Typen in `components/viz/`, Registry `VIZ`. Drei Lektionen: Zinseszins (Rechenmodell), Planeten und Keplers drittes Gesetz (echte Daten), Angebot und Nachfrage (Lehrmodell). Ausführlich: `docs/VISUALS.md`. Neue Nutzungsereignisse `visual_predict`, `visual_explore` (Migration `20261019100000_visual_events.sql`).
- **Sport** ist das zehnte Thema: 20 Fragen und 4 „Stimmt das?“-Karten (`content/_batches/2026-10-sport.mjs`), Farbe `--sport`.
- **Clip-Fragen:** Nach der endgültigen Antwort schließt die Frage von selbst und der Feed rückt zum nächsten Eintrag (`lib/advance.ts`: 2,6 s nach richtiger, 4,6 s nach falscher Antwort; „Hier bleiben“ bricht ab). Gilt im Feed und in der Clip-Ansicht.
- **Animationen:** Flaschenzug (`pulley`), Stromkreis (`circuit`), Wasserkreislauf (`watercycle`); Inhalte in `content/_batches/2026-10-animations-3d-6.mjs`. Die Vorhersagefrage hält jetzt kurz *vor* dem nächsten Schritt an, damit dessen Beschriftung die Antwort nicht verrät.
- Stand: 20 Animationen (19 in 3D, Herz gezeichnet), 631 Fragen (587 im Feed), 10 Themen, 3 interaktive Visualisierungen.
- Hinweis: Mehrere Abschnitte oben trugen Daten zwischen dem 18. und 21.10.; sie sind auf den 13.10.2026 berichtigt. Einige Fragen haben ein Erstelldatum bis zum 21.10. in der Datenbank – ohne Folgen, sie gelten lediglich ein paar Tage länger als „neu“.

## 29. Offene Punkte abgearbeitet (14.10.2026)

- **Visualisierungen:** zwei neue Typen `bars` (Schallgeschwindigkeit, Werte aus dem Wikipedia-Artikel „Schallgeschwindigkeit“, abgerufen 14.10.2026) und `timeline` (Technik-Meilensteine); Inhalte in `content/_batches/2026-10-visuals-2.mjs`. Visualisierungen stehen jetzt auch im Feed (`mixFeed`, fünfter Medienplatz; ausprobierte rücken nach hinten, gemerkt in `state.visuals`).
- **3D-Bedienung:** Tempo-Knopf im Player (0,75×/1×/1,5×, auf dem Gerät gemerkt), Zoom in der 3D-Bühne (Knöpfe, Zwei-Finger-Geste, Strg + Mausrad bzw. Trackpad-Geste; ein normales Mausrad scrollt weiter die Seite).
- **Clip-Fragen:** Wer erst im zweiten Versuch richtig liegt, bekommt die Hälfte der Punkte – auf dem Server (`submit_answer`, Migration `20261020100000_second_attempt_half_points.sql`) und im Demo-Modus.

## 30. Prüfbildschirm für alle Inhalte (14.10.2026)

- `/admin/` (nur für Konten mit `profiles.is_admin`): eine Liste für **alles** – Fragen und Clips aus der Datenbank, Bücher, Animationen und Visualisierungen aus der App. Reiter *Offen · Gemeldet · Ändern · Frei*, Filter nach Art, Umschalter *Deutsch / English* für die Inhalte. Jeder Eintrag zeigt die Texte so, wie die App sie zeigt (bei Büchern jede Idee mit Einstiegsfrage, Abruf, Transfer, Merksatz und Beleg-Stufe; bei Animationen alle Schritte, Beschriftungen und die Vorhersagefrage mit Lösung; bei Visualisierungen Daten, Annahmen, Schätzfrage, Erklärung, Aufgabe) und verlinkt auf die Stelle in der App.
- Entscheidungen: **Geprüft, freigeben** · **Änderung nötig** (mit Notiz) · bei Fragen und Clips zusätzlich **Zurückziehen**.
- Tabelle `content_reviews` (Migration `20261021100000_content_reviews.sql`): je Inhalt eine Entscheidung. Für Bücher, Animationen und Visualisierungen wird der **Fingerabdruck** der gelesenen Fassung gespeichert (`lib/reviews.ts`, FNV-1a über den Datensatz in beiden Sprachen). Die App zeigt „redaktionell geprüft“ nur, solange der Text genau dieser Fassung entspricht; wird er später geändert, landet er wieder unter *Offen* („Text seit der Freigabe geändert“). Freigaben sind öffentlich lesbar (nur Art, Kennung, Fingerabdruck), Notizen nur für Redakteure (`admin_content_reviews()`); geschrieben wird nur über `review_content()`, das Redaktionsrechte prüft. Fragen und Clips werden wie bisher über `admin_review()` freigegeben.
- **Änderungswünsche umsetzen:** Die Notizen lassen sich mit `select kind, id, note from content_reviews where decision = 'change'` abrufen; nach der Korrektur im Datensatz erscheint der Inhalt wieder unter *Offen* bzw. wird nach erneuter Freigabe grün.
- **Zugang:** Ein Konto bekommt Redaktionsrechte per SQL: `update profiles set is_admin = true where id = '<Konto-ID>'`. Sinnvoll ist ein Konto mit E-Mail-Anmeldung, damit der Zugang nicht an einem Gerät hängt.

## 31. Store-Fassung (14.10.2026)

Capacitor 8.5.2 packt den statischen Export in eine Android-App (`android/`, `capacitor.config.ts`, `lib/native.ts`, `scripts/app/icons.mjs`). GitHub Actions (`.github/workflows/android.yml`) baut die Testversion und prüft sie im Emulator. Alles Weitere in `docs/STORE.md`. Drei anonyme Testkonten aus Browser-Tests wurden am 14.10.2026 gelöscht.
