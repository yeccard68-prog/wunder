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

## 32. Rätsel, mehr Fragen, drei Animationen, fünf Clips (15.10.2026)

- **Rätsel mit Tipps:** Eine Frage kann bis zu drei Tipps tragen, die nacheinander aufgedeckt werden („Tipp 1/3“), bevor man antwortet. Spalte `questions.hints` (Migration `20261022100000_question_hints.sql`, JSON-Liste mit 1–3 Texten), Übersetzungen unter `translations.<sprache>.hints`. Die Inhaltsprüfung (`scripts/content/lib.mjs`) verlangt 1–3 Tipps, in jeder Sprache gleich viele, und lehnt einen Tipp ab, der die richtige Antwort wörtlich enthält. Batches exportieren dafür `riddles` (Objekte mit `hints` und `en.hints`); sie bekommen automatisch das Schlagwort „Rätsel“. Eigene Seite `/riddles/` (Entdecken → Rätsel, offene zuerst, Fortschritt „x von y gelöst“); im Prüfbildschirm stehen die Tipps unter der Erklärung. Erster Stapel: 25 Rätsel (`content/_batches/2026-10-riddles-1.mjs`) – Logik, Zahlen, Physik, Wortspiele. Ihre Quelle ist der Artikel zur Idee dahinter (etwa Schubfachprinzip, archimedisches Prinzip); die Lösung folgt jeweils aus der Aufgabe selbst.
- **Fragen:** 40 neue Fragen, 3 „Stimmt das?“-Karten und 14 Karten in den neuen Formaten für Sport, Business, Sprache und Wirtschaft (`2026-10-wissen-3.mjs`). Bewusst keine Fakten, die sich gerade ändern könnten (aktuelle Rekorde, letzte Weltmeister).
- **Animationen:** Windrad (`windturbine`), GPS (`gps`), Wärmepumpe (`heatpump`) mit je einer Vorhersage- und Prüffrage (`2026-10-animations-3d-7.mjs`). Vereinfachungen stehen jeweils oben in der Szenendatei (z. B. Getriebe 6 : 1 statt etwa 100 : 1, damit beide Wellen sichtbar drehen).
- **Clips:** Windrad (CC0), Galtonbrett (CC BY-SA 4.0), Muybridges galoppierendes Pferd (gemeinfrei), Delfinbeinschlag (CC BY-SA 4.0), Fingeralphabet der Amerikanischen Gebärdensprache (CC BY-SA 3.0) – die ersten Clips für Sport, Mathe & Logik und Sprache (`2026-10-clips-3.mjs`, Quellen in `2026-10-clip-sources-3.json`).
- **Fehler behoben:** Sprang man über die Schritt-Punkte direkt zum Schritt mit der Antwort auf die Vorhersagefrage – oder lief ein langsames Gerät mit weniger als etwa 50 Bildern pro Sekunde –, konnte während der Frage schon die Beschriftung mit der Lösung zu sehen sein. Der Player hält die Zeit jetzt sofort an (`hold` in `AnimationPlayer.tsx`); ein Browser-Test prüft das.
- Kontakt in den Kennungen der Recherche-Skripte (Wikipedia/Commons-API) ist jetzt die Projektseite statt einer E-Mail-Adresse.
- Stand: 23 Animationen (22 in 3D), 721 Fragen (672 im Feed, davon 25 Rätsel, 38 in den neuen Formaten), 43 Clips, 10 Themen.

## 33. Zweite Rätselrunde, Wirtschaft und Sport, Schall in 3D (15.10.2026)

- **Rätsel:** 14 weitere (`2026-10-riddles-2.mjs`), jetzt auch für Geschichte, Erde, Kultur, Sport und Technik – zusammen 39.
- **Karten:** 18 Fragen, 2 „Stimmt das?“-Karten und 6 Formatkarten für Wirtschaft & Geld und Sport (`2026-10-wissen-4.mjs`). Zwei Erklärungen wurden beim Abgleich mit den Quellen geändert: Usain Bolts Spitzengeschwindigkeit steht dort mit 44,72 km/h, und für die Hyperinflation 1923 nennt der Artikel überdruckte Geldscheine („500 Milliarden“) statt eines Brotpreises.
- **Animation:** Schall (`sound`): Membran, Verdichtungen und Verdünnungen, ein markiertes Teilchen, das nur hin und her schwingt, Frequenz und Tonhöhe, Auslenkung und Lautstärke, Trommelfell (`2026-10-animations-3d-8.mjs`). Die Luft ist eine einzige InstancedMesh (520 Teilchen). Eine Änderung an der Membran wandert mit der Welle nach außen. Die Visualisierung „Wie schnell ist Schall?“ verweist jetzt auf diese Animation.
- **Clips:** In dieser Runde keine neuen – die übrigen frei lizenzierten Kandidaten für Wirtschaft und Business waren zu unscharf oder doppelten vorhandene Clips.
- Stand: 24 Animationen (23 in 3D), 762 Fragen (713 im Feed, davon 39 Rätsel, 44 in den neuen Formaten), 43 Clips.

## 34. Business, Kultur, Sprache, Photosynthese, Schrift-Zeitleiste, zwei Clips (15.10.2026)

- **Dubletten bereinigt:** Drei Sportfragen fragten dieselbe Tatsache wie ältere Kulturfragen (olympische Ringe, Abstand der Sommerspiele, Spieler zu Spielbeginn). sp3, sp20 und sp36 haben neue Fragen mit denselben Kennungen bekommen. Neues Hilfsskript `scripts/content/near-duplicates.mjs` listet Fragenpaare mit großer Wortüberschneidung; die meisten Treffer sind harmlos (gleiche Satzmuster), es ersetzt also nicht das Lesen.
- **Karten:** 14 Business-, 10 Kultur- und 8 Sprachfragen, 3 „Stimmt das?“-Karten, 5 Formatkarten (`2026-10-wissen-5.mjs`).
- **Rätsel:** 12 weitere (`2026-10-riddles-3.mjs`) – zusammen 51.
- **Animation:** Photosynthese (`photosynthesis`): Zutaten, Chlorophyll und Lichtfarben (warum Blätter grün sind), Zucker und Sauerstoff, Transport in die Pflanze (`2026-10-animations-3d-9.mjs`).
- **Visualisierung:** „Wie die Schrift entstand“ (Zeitleiste, echte Daten aus „Geschichte der Schrift“, `2026-10-visuals-3.mjs`). Die Zeitleiste kann jetzt Jahre vor Christus: `formatYear` („3300 v. Chr.“, „150 n. Chr.“), `yearTicks` (runde Teilstriche, höchstens etwa acht) und `gaps` berücksichtigt, dass es kein Jahr 0 gibt. Auch der Prüfbildschirm zeigt die Jahre so.
- **Clips:** Taiko-Trommeln beim Bon-Fest in Tokio (CC BY 2.0) und eine Töpferscheibe (CC BY-SA 4.0), `2026-10-clips-4.mjs`.
- Stand: 25 Animationen (24 in 3D), 817 Fragen (766 im Feed, davon 51 Rätsel, 49 in den neuen Formaten), 45 Clips, 6 Visualisierungen.

## 35. Duelle (15.10.2026)

Zwei Spieler beantworten dieselben Fragen in drei Runden à drei Fragen, abwechselnd mit Themenwahl: Runde 1 wählt und spielt A zuerst, Runde 2 wählt B, Runde 3 wieder A. Jede Frage hat 20 Sekunden; läuft die Zeit ab, zählt sie als falsch. Wer mehr richtig hat, gewinnt.

- **Datenbank** (Migrationen `20261023100000_duels.sql`, `20261023110000_duels_age.sql`): Tabellen `duels`, `duel_rounds`, `duel_answers`, `duel_blocks`, `duel_reports` – RLS an, keine Policies, also für die App nicht direkt lesbar. Alles läuft über Funktionen, die prüfen, wer dran ist: `duel_create('invite'|'random')`, `duel_join(code)`, `duel_pick`, `duel_answer` (gibt erst nach der Antwort die Lösung und Erklärung zurück), `duel_state`, `my_duels`, `duel_rematch`, `duel_decline`, `duel_resign`, `duel_report`, `admin_duel_reports`. Die Antworten des Gegners einer Runde sieht man erst, wenn man sie selbst gespielt hat; die angebotenen Themen werden einmal gezogen (kein Neu-Würfeln). Höchstens 20 offene Duelle pro Person; ein Zufallsduell ohne Gegner läuft nach 3 Tagen ab, wer 7 Tage nicht zieht, verliert.
- **Fragen:** nur veröffentlichte Multiple-Choice-Fragen aus dem Feed, keine Rätsel und keine Sonderformate, ab 13 geeignet und ohne Kinderfassungen; keine Frage zweimal im selben Duell.
- **Alter und Namen:** Unter 13 (Altersgruppen 6–9, 10–12) kein Duell gegen andere – auch per Datenbank gesperrt. Bei privatem Profil oder unter 16 sieht der Gegner keinen Namen, sondern „Gegner“. (Die App ist ohnehin erst ab 16 freigegeben; die Regeln greifen, falls Kinderstufen später geöffnet werden.)
- **Melden:** Name, Schummeln oder anderes; die beiden werden danach nicht mehr zusammen gelost und Einladungen voneinander abgelehnt.
- **App:** Seite `/duel/` (Entdecken → Duell, Community → „Duell gegen echte Leute“). Einladungslink `/duel/?join=CODE` oder Code-Eingabe, geöffnetes Duell `/duel/?d=<id>`. Während man wartet, fragt die Seite alle 10 Sekunden nach. Im Demo-Modus gibt es stattdessen ein Übungsduell gegen den Computer (`lib/duel.ts`, trifft etwa 60 %), das auf dem Gerät gespeichert wird und denselben Regeln folgt.
- **Antwortschlüssel:** Die gebündelten Fragen mit Lösungen (`content/questions.json`) waren bisher Teil des App-Pakets und damit für jeden abrufbar. Sie liegen jetzt in `lib/demo-content.ts` und werden nur in Demo-Builds geladen; in einem Build mit Backend-Adresse entfernt der Bundler diesen Zweig, die Datei wird gar nicht erst veröffentlicht (geprüft: kein Chunk mit `"correct_index"`). Das Paket ist dadurch auch etwa 0,8 MB kleiner.
- **Tests:** `supabase/tests/duels.sql` (30 Prüfungen, alles wird zurückgerollt), `tests/duel.test.ts` (Zugreihenfolge identisch mit der SQL-Funktion, Übungsduell), `e2e/duel.spec.ts` (Übungsduell mit Zeitablauf, Aufgeben).
- **Offen:** Ansicht der Meldungen im Prüfbildschirm; Wortfilter für Anzeigenamen (Apple-Richtlinie für Nutzerinhalte); Benachrichtigung, wenn man dran ist (bräuchte Push-Mitteilungen).

## 36. Bücher: Copyright-Prüfung und Affiliate-Links (15.10.2026)

- **Prüfung:** Alle 20 Bücher durchsucht (Skript über alle Textfelder, beide Sprachen). Keine Cover-Bilder, keine längeren Passagen; fast alle Anführungszeichen umschließen eigene Beispielsätze. Drei kurze wörtliche Zitate (Harari: Landwirtschaft als „Betrug“; Thiel: Lieblingsfrage an Bewerber und „Wettbewerb ist für Verlierer“) stehen jetzt in indirekter Rede, damit der Satz „keine Auszüge oder Zitate“ auf `/legal/` wörtlich stimmt. `tests/books.test.ts` schlägt an, wenn wieder ein Zitat mit vier oder mehr Wörtern direkt dem Autor zugeschrieben wird.
- **Affiliate-Links** (`lib/affiliate.ts`): Mit `NEXT_PUBLIC_AMAZON_PARTNER_TAG` (optional `NEXT_PUBLIC_AMAZON_DOMAIN`, Standard `amazon.de`) zeigt jedes Buch einen Link zur Buchsuche nach Titel und Autor (`/s?k=…&i=stripbooks&tag=…`, keine erfundenen ISBNs), gekennzeichnet als „Anzeige“, mit `rel="sponsored"` und Amazons Pflichtsatz; `/legal/` bekommt dann den Abschnitt „Werbung: Affiliate-Links“ und der Satz „Keine Werbung“ wird angepasst. Nur für die Altersgruppe 16+. Ohne Tag (wie jetzt) erscheint nichts. Einschalten: Wert in Vercel → Project → Settings → Environment Variables eintragen und neu ausrollen.

## 37. Eigene Clips mit Remotion, Online-Duell live getestet (15.10.2026)

- **Remotion** (4.0.531) steckt im eigenen Ordner `video/` mit eigenem `package.json`; die App bündelt nichts davon (`tsconfig.json` schließt `video` aus, `video/node_modules` und `video/out` sind in `.gitignore`). Anleitung: `video/README.md`. Gerendert wird auf dem eigenen Rechner (`npm --prefix video run render`), keine Cloud.
- **Drei eigene Clips** (`content/_batches/2026-10-clips-5.mjs`): Zinseszins (Wirtschaft: 1.000 € bei 7 % über 30 Jahre, 7.612 € gegen 3.100 € ohne Zinseszins), Kleopatra zwischen Cheops-Pyramide und Mondlandung (Geschichte, maßstabsgetreuer Zeitstrahl), Marathon als Stadionrunden (Sport: 105 Runden und 195 m). Alle Zahlen werden im Code berechnet. `creator_name` „Wunder Redaktion“, `license` „Eigene Produktion“, `format` `animated_fact`, `production.provider` `remotion`.
- **Ein Video je Sprache:** Weil die Clips Beschriftungen im Bild haben, gibt es `<id>.mp4` (Deutsch) und `<id>.en.mp4` (Englisch). Die englische Datei steht in `translations.en.file` / `.poster` der Videozeile – keine neue Spalte, die App (`localizeClip`) nimmt sie, wenn vorhanden. Die Inhaltsprüfung verlangt, dass diese Dateien existieren. Die Clips sind 0,14–0,26 MB groß.
- **Batches** dürfen bei Clips jetzt mehrere Quellen angeben (`sources`), die erste dient auch als Quelle der Quizfrage.
- **Lizenz-Hinweis unter Clips** wird übersetzt („Eigene Produktion“ → „Own production“); `/legal/` erklärt eigene Clips.
- **Duell live getestet:** zwei Gast-Testkonten auf wunder-one.vercel.app (vom Betreiber freigegeben): Einladung per Link, alle drei Runden, Ergebnis 3 : 1 / 1 : 3 und Gewonnen/Verloren auf beiden Seiten, Zufallsgegner, Melden, danach Revanche abgelehnt. Beide Konten über Profil → „Konto und Daten löschen“ entfernt, ihre Duelle sind mitgelöscht. Gefunden und behoben: Nach dem Ende einer Runde zeigte die Seite kurz den alten Stand („Runde 2 spielen“), bis die Antwort des Servers da war – jetzt bleibt die Runde stehen, bis der neue Stand geladen ist.
- **Übrig vom Test:** Nach dem Löschen legt die App sofort ein neues leeres Gastkonto an (so verhält sie sich immer, wenn man ohne Neuladen weitermacht). Zwei leere Gastkonten von 11:45 Uhr (UTC) und eine Meldung ohne Personenbezug (`duel_reports.id = 3`, alle Verweise leer) sind noch in der Datenbank; das Löschen per SQL wurde von der Sicherheitsabfrage gestoppt und braucht die Freigabe des Betreibers.

## 38. Animationen überarbeitet, Feed-Algorithmus, Fakten (18.–19.10.2026)

- **Animationen:** Herz neu in 3D (`components/three/scenes/heart.ts`, angeschnittenes Herz mit Kammern, Klappen, Gefäßen und Kreislauf durch Lunge und Körper; die alte Zeichnung bleibt als Ersatz ohne 3D, `fallback_scene`). Treibhauseffekt neu (Erde aus dem All, Strahlen, Wellenpakete, Moleküle, Thermometer). Gemeinsame Erdkugel mit gezeichneten Kontinenten (`surface.ts`, Umrisse als Längen-/Breitengrade, 1024 × 512). Sternentstehung als Nebel, Planetenbahn mit Spur und Tangente, Finsternis-Schatten über Lichtlinien, Gewitterwolke unten dunkel mit Regen, Bildausschnitte bei Netz, Hebel, Stromkreis, Batterie, Jahreszeiten, Erdplatten korrigiert.
- **Feed** (`lib/engagement.ts`, `lib/feed.ts`, `lib/ranking.ts`): Der Feed misst, wie lange ein Eintrag im Bild ist (ab 60 % sichtbar) und was innerhalb von 1,5 s weggewischt wird – je Thema und Format, mit langsamem Verblassen alter Werte, **nur auf dem Gerät** (`state.signals`). Daraus: Themen-Interesse (±1, im Vergleich zum eigenen Durchschnitt), Flow-Schwierigkeit (letzte 8 Antworten verschieben die Stufe), Abstand der Clips/Animationen 2–4 Karten je nach Vorliebe, erster Clip nach zwei Karten, nie mehr als zwei Karten desselben Themas hintereinander, ab Platz 5 jede 7. Karte aus einem neuen Thema („Etwas Neues für dich“), nach 40 Einträgen einmal ein Pausen-Hinweis. Bewusst ohne Endlos-Tricks: Der Feed endet, und der Pausen-Hinweis ist ehrlich gemeint (Store-Richtlinien, EU-Regeln zu süchtig machendem Design).
- **Fakten** (`content/facts.json`, `lib/facts.ts`, `components/FactCard.tsx`, Seite `/facts/`): „Wusstest du?“-Karten mit Erklärung auf Wunsch, Quelle, Reaktionen „Wow!“/„Wusste ich schon“ (`state.facts`) und Merken. 13 Bereiche (`AREAS`), je Fakt eines der zehn Themen. Im Feed nach jeder dritten Frage, sortiert nach Interessen, Verweildauer, „Wow“-Bereichen und täglichem Zufall. Erster Stapel: 39 Fakten (`2026-10-facts-1.mjs`, `scripts/content/merge-facts.mjs`), jeder am verlinkten Artikel geprüft; nicht belegbare „Fakten“ wurden weggelassen. Freigabe im Prüfbildschirm wie bei Büchern (Migration `20261024100000_fact_reviews.sql`).

## 39. Duell fertig, Anmeldung per Code, Statistik-Einwilligung, mehr Inhalte (19.10.2026)

- **Zeitlimit auf dem Server** (Migration `20261024120000_duel_timer.sql`): `duel_question` gibt die Fragen einzeln heraus und merkt sich in `duel_shown`, wann eine Frage zuerst gezeigt wurde; eine Antwort nach mehr als 20 s (+ 3 s Puffer) zählt als „Zeit abgelaufen“ (`late`). `duel_state` zeigt die Fragen der laufenden Runde erst, wenn sie beantwortet sind. Die App fragt jede Frage einzeln ab und fällt auf den alten Weg zurück, falls der Server die Funktion noch nicht hat (Reihenfolge: erst App, dann Datenbank). Tests: `supabase/tests/duels.sql` mit 34 Prüfungen.
- **Namensfilter und Meldungen** (`20261024110000_name_filter.sql`, `lib/names.ts`): Wortlisten (überall bzw. nur als ganzes Wort) gegen anstößige Anzeigenamen; die App weist beim Tippen darauf hin, ein Datenbank-Trigger ersetzt solche Namen durch „Neugierig“ statt das Speichern abzulehnen. Ein Unit-Test hält beide Listen gleich. Im Prüfbildschirm: „Gemeldete Spieler (Duelle)“ mit „Name zurücksetzen“ oder „Ist in Ordnung“ (`admin_resolve_reports`). Tests: `supabase/tests/names.sql`.
- **Fakten im Prüfbildschirm** (`20261024100000_fact_reviews.sql`), in beiden Sprachen.
- **Einstieg:** freiwilliger Schalter „Nutzungsstatistik teilen“, ausgeschaltet voreingestellt.
- **Anmeldung per Code:** Nach dem Anfordern kann man den sechsstelligen Code aus der E-Mail eingeben (`verifyOtp`) – nötig in der Android-App. Voraussetzung: `{{ .Token }}` in den Supabase-E-Mail-Vorlagen (siehe `docs/STORE.md`).
- **Inhalte:** 19 weitere Fakten (58), Animation „Wie Ebbe und Flut entstehen“ (`tides`), zwei eigene Clips (Papier bis zum Mond, Masse der Sonne). Stand: 26 Animationen, 823 Fragen, 50 Clips (5 eigene), 58 Fakten.

## 40. Computer-Gegner, Gruppen, Chat (19.10.2026)

- **Computer-Gegner** (Migration `20261025100000_duel_bot.sql`): `duel_create_bot(p_level)` legt ein Duell der Art `bot` mit Stufe 1–3 an (trifft etwa 50 / 67 / 80 %, gleiche Zahlen in `BOT_ACCURACY`, `lib/duel.ts`). Der Computer spielt direkt am Ende von `duel_answer` (`private.duel_bot_play`): er beantwortet seine Runde und wählt, wenn er dran ist, das nächste Thema – kein Warten. Seine Antworten stehen in `duel_bot_answers`; `duel_state`/`my_duels` liefern zusätzlich `level`, Revanche gibt ein neues Duell auf derselben Stufe, Aufgeben zählt als Niederlage. In der App: „Gegen den Computer“ mit Stufenwahl (nur live; im Demo-Modus bleibt der Übungsgegner auf dem Gerät).
- **Gruppen** (`20261025110000_groups.sql`, `lib/groups.ts`, `/groups/`): Gruppe anlegen (Name mit Wortfilter, Code wie beim Duell), beitreten per Code oder Link, max. 50 Mitglieder, max. 20 Gruppen je Person, verlassen (die Leitung geht an das älteste Mitglied, leere Gruppen werden gelöscht), die Leitung kann Mitglieder entfernen. **Gruppenrunde:** sechs Fragen aus einem Thema (gewählt oder zufällig), dieselben für alle, je 20 s auf dem Server gezählt (`group_shown`), drei Tage Zeit, eine laufende Runde je Gruppe. Die Rangliste sieht man erst nach dem eigenen Spielen oder nach Rundenende. Namen wie im Duell (keiner bei privatem Profil oder unter 16). Unter 13 kein Zugang.
- **Chat** (`20261025120000_chat.sql`, `lib/chat.ts`, `components/Chat.tsx`): in Duellen zwischen Menschen (nicht gegen den Computer, erst wenn beide dabei sind, beide 16+, nicht blockiert) und in Gruppen. **Nur ab 16** – Jüngere sehen den Chat nicht, der Server lehnt ab. Schutz auf dem Server: Wortfilter Wort für Wort (dieselben Listen wie beim Namen), keine Links, E-Mail-Adressen oder Telefonnummern, höchstens 500 Zeichen, höchstens 5 Nachrichten in 30 s und 300 am Tag. Melden (beleidigend, persönliche Daten, Spam, anderes) blendet die Nachricht für die meldende Person sofort aus, ab drei Meldungen für alle bis zur Entscheidung der Redaktion; wahlweise wird die Person gleich blockiert (ihre Nachrichten verschwinden, wer es ist, erfährt man nie – die App bekommt keine Konto-IDs der Schreibenden). Prüfbildschirm: „Gemeldete Chat-Nachrichten“ (löschen oder wieder zeigen). Nachrichten werden nach 90 Tagen gelöscht. Die App fragt alle 5 s nach neuen Nachrichten, solange die Seite sichtbar ist (kein Realtime-Dienst nötig).
- **Tests:** `supabase/tests/groups_chat.sql` (38 Prüfungen, wird zurückgerollt), `tests/social.test.ts`, E2E für die Gruppenseite im Demo-Modus. Die Fragerunde mit Uhr ist jetzt eine eigene Komponente (`components/QuestionRound.tsx`) für Duell und Gruppe.
- **Inhalte:** 10 weitere Fakten (68: Faultier-Algen, Seepferdchen, Eisbärhaut, Zitteraal, Raspelzunge, Bärtierchen im All, Venus dreht rückwärts, Neutronenstern, Blitz, Eis dehnt sich aus).
- **Live-Test 19.10.2026** (vom Betreiber freigegeben): zwei Gastkonten auf der Live-Seite – Gruppe per Link, Gruppenrunde mit Rangliste erst nach dem eigenen Spielen, Gruppenchat in beide Richtungen, Link-Hinweis beim Tippen, Duell-Chat erst nach dem Beitritt, Computer-Duell (Stufe schwer, antwortet sofort, kein Chat), Melden + Blockieren; 18 von 18 Prüfungen bestanden, beide Konten danach über die App gelöscht.
- **Dabei gefunden und behoben:** (1) Seit der Namensfilter-Migration (heute 07:24 UTC) scheiterte **jedes Speichern eines Profils** („permission denied for schema private“): Der Trigger lief mit Nutzerrechten und rief eine Funktion im Schema `private` auf. Neue Nutzer kamen nicht durch den Einstieg. Behoben um 14:11 UTC, ohne zusätzliche Rechte (`20261025130000_name_filter_trigger_fix.sql`, Prüfung jetzt eingebettet). Die SQL-Tests hatten es verdeckt, weil der Trigger dort zuerst als `postgres` lief und sein Plan zwischengespeichert war; neuer Test `supabase/tests/profile_save.sql` wechselt die Rolle vorher. (2) Nach dem Löschen aller Mitglieder blieb eine leere Gruppe stehen – jetzt löscht ein Trigger leere Gruppen (`20261025140000_groups_drop_empty.sql`).

## 41. Feed: Gesehenes möglichst spät wieder, Fehler gezielt wieder (19.10.2026)

- **Gedächtnis „schon gesehen“** (`lib/seen.ts`, `state.seen`): je Inhalt der Zeitpunkt, wann er zuletzt mindestens 0,7 s auf dem Bildschirm war; höchstens 4000 Einträge, die ältesten fallen heraus. Nur auf dem Gerät, wie die übrigen Feed-Signale (auf `/legal/` erwähnt).
- **Reihenfolge überall im Feed** (Fragen, Fakten, Clips, Animationen, Visualisierungen, Buchideen): erst nie Gesehenes (wie bisher gerankt), dann Gesehenes ohne Abschluss (vorbeigescrollt, Clip nicht zu Ende, Fakt ohne Reaktion) – am längsten nicht Gesehenes zuerst –, zuletzt Erledigtes (richtig beantwortet, Clip zu Ende geschaut, ausprobiert), ebenfalls am längsten Zurückliegendes zuerst.
- **Ausnahme Fehler:** Falsch beantwortete Fragen kommen nach der vorhandenen Wiederholungslogik zurück (10 Min., 1, 3, 7, 21 Tage, `BOX_MS`), sobald sie fällig sind – im Feed ab Platz 3 jede dritte Karte, mit dem Grund „Zum Wiederholen: Hier lagst du daneben“. Vorher wurden auch falsch beantwortete Fragen pauschal ans Ende geschoben. Noch nicht fällige Wiederholungen warten hinten, vor den schon gekonnten.
- Der Feed wird weiterhin einmal pro Besuch berechnet (Momentaufnahme) – während des Scrollens sortiert sich nichts um. Tests: `tests/seen.test.ts`.
- **Inhalte:** 6 weitere Fakten (74: kleinster Knochen, Schneekristalle, Lichtjahr, Erdrotation, Diamant und Graphit, Kupfer statt Eisen im Blut).
- **Eigener Clip** „So lange ist Licht unterwegs“ (`v-licht-reise`, Mond 1,3 s, Sonne 8 min 19 s, Proxima Centauri gut 4 Jahre – berechnet aus Lichtgeschwindigkeit und den Entfernungen). Stand: 26 Animationen, 824 Fragen, 51 veröffentlichte Clips (6 eigene), 74 Fakten.

## 42. Start direkt im Feed, Daily Challenge entfernt (19.10.2026)

- Auf Wunsch des Betreibers öffnet die App sofort den Feed – die frühere erste Seite („Hallo …“, Tagesziel-Ring, Daily Challenge, fällige Wiederholungen) ist weg. Fällige Wiederholungen mischt der Feed selbst ein (Abschnitt 41); die Quiz-Seite bietet weiter „Wiederholen“ und „Freies Üben“.
- Die Daily Challenge ist aus der Oberfläche entfernt (Quiz-Seite, Sitzungsmodus, Store, Server-Aufruf im Client). Die Datenbankfunktion `complete_daily_challenge` und die Felder in `user_stats` bleiben unangetastet (keine Daten gelöscht); Challenges gegen Freunde nutzen weiter `dailyItems`. Die Abzeichen „Tagesform“ und „Fünf von fünf“ sind ersetzt durch „Staunender Blick“ (10 Fakten mit Wow) und „Dranbleiber im Kino“ (5 Clips zu Ende geschaut).
- **Inhalte:** 6 weitere Fakten (80) aus Sprache, Sport, Wirtschaft, Geschichte. Benchmark und Vorschläge in `docs/BENCHMARK.md`.

## 43. Teilen als Bild, „Wie hast du von uns gehört?“, Inhalts-Routine (19.10.2026)

- **Teilen als Bild** (`lib/shareCard.ts`, `components/ShareImageButton.tsx`): Fakt- und Fragekarten erzeugen auf dem Gerät ein Bild 1080×1350 (Marke, Thema, Text, Quelle bzw. bei Fragen „Antwort und Quelle in der App“ – die Quelle würde die Antwort verraten –, Link). Geteilt über das System-Teilen mit Datei, sonst als Download; scheitert das Zeichnen, wird Text geteilt. Kein Upload, kein Dienst. Nicht für Kinderstufen. Hinweis: In der Android-App (WebView) gibt es kein Web-Teilen mit Dateien – dort greift der Download; ein natives Teilen bräuchte das kostenlose Capacitor-Share-Plugin.
- **Herkunftsfrage** (`20261025150000_heard_from.sql`): freiwillige Auswahl im letzten Einstiegsschritt (Freunde, TikTok, Instagram, YouTube, App-Store-Suche, Presse, Schule/Uni, Woanders), Spalte `profiles.heard_from` mit fester Werteliste; Nutzer dürfen nur diese eine neue Spalte schreiben. Im Prüfbildschirm nur Summen je Antwort (`admin_heard_from`). Tests: `supabase/tests/heard_from.sql`.
- **Inhalts-Routine** (`docs/CONTENT-ROUTINE.md`, Protokoll `docs/CONTENT-LOG.md`): eine geplante Claude-Sitzung ergänzt regelmäßig bis zu 8 Fakten für die am dünnsten besetzten Themen (`scripts/content/coverage.mjs`). Jede Aussage braucht ein wörtliches Zitat aus dem verlinkten Artikel; `scripts/content/verify-evidence.mjs` lädt den Artikel und lehnt alles ab, was dort nicht steht. Nur Fakten (Datei im App-Paket) – keine Datenbank, keine Migrationen, Status bleibt „von KI geprüft“. Erster Lauf von Hand: `2026-10-facts-6` (86 Fakten).

## 44. Hinweis an die Redaktion (19.10.2026)

- Statt öffentlicher Kommentare (Empfehlung: Moderationsaufwand, DSA-Pflichten, wenig Mehrwert unter Karten) gibt es an jeder Frage, jedem Fakt, Clip, jeder Animation, Buchidee und interaktiven Grafik „Hinweis an die Redaktion“ (`components/HintButton.tsx`): Grund wählen (stimmt nicht, Quelle, unverständlich, Idee, anderes), optional Text bis 500 Zeichen. Nicht öffentlich – nur die Redaktion liest es.
- Datenbank (`20261025160000_content_hints.sql`): Tabelle `content_hints` ohne Lesezugriff für Nutzer, `content_hint_send` mit Chat-Filter (keine Links, Kontaktdaten, Beleidigungen), höchstens 20 Hinweise am Tag, je Karte und Grund nur einer offen; erledigte werden nach 180 Tagen gelöscht. Prüfbildschirm „Hinweise an die Redaktion“, nach Karte gruppiert, schließen als „Korrigiert“ oder „Bleibt so“. Tests: `supabase/tests/content_hints.sql`, E2E in `e2e/share.spec.ts`.
- Der frühere Menüpunkt „Fehler oder Problem melden“ (blendete die Karte nur aus) ist durch den Hinweis ersetzt; „Kein Interesse“ bleibt.

## 45. Korrektur: beantwortete Fragen nicht mehr im Feed (19.10.2026)

- Vom Betreiber gemeldet: richtig beantwortete Fragen tauchten oft im Feed auf – mit schon aufgedeckter Antwort. Ursachen: (1) der Feed schob beantwortete Fragen nur ans Ende statt sie wegzulassen; (2) jede Karte zeigte eine frühere Antwort sofort an – auch bei fälligen Wiederholungen, die dadurch nutzlos waren; (3) Animationen zeigten ihre schon beantwortete Quizfrage samt Lösung.
- Jetzt: beantwortete Fragen bleiben aus dem Feed – gekonnte dauerhaft, falsch beantwortete bis zur fälligen Wiederholung. Eine fällige Wiederholung fragt neu (Antworten wählbar, alte Lösung verborgen). Animationen zeigen ihre Frage nur, wenn sie neu oder wieder fällig ist. Tests: `tests/seen.test.ts`, `tests/logic.test.ts`, E2E in `e2e/share.spec.ts`.

## 46. Schalter für Chat und Gruppen, Übersicht im Prüfbildschirm (21.10.2026)

- **Schalter** (`20261025170000_flags_overview.sql`, `lib/flags.ts`): `private.app_flags` mit `chat` und `groups`, beim Start **beide aus** (Entscheidung 21.10.2026 – die meisten rechtlichen Pflichten). Der Server setzt sie durch: Chat liefert dann nichts und nimmt nichts an (`chat_place_ok`), `group_create`/`group_join` lehnen ab. Die App liest die Schalter einmal beim Start (`app_flags()`, auch ohne Anmeldung) und versteckt Chat, Gruppen-Einstiege und zeigt auf `/groups/` „Gruppen kommen bald“. Kennt der Server die Schalter nicht (ältere Datenbank), gilt alles als an. Umschalten im Prüfbildschirm (`admin_set_flag`), ohne neue App-Version.
- **Übersicht** (`admin_overview`, `components/admin/Overview.tsx`): aktive Spieler pro Tag (= mindestens eine beantwortete Frage; bloßes Öffnen wird nicht gespeichert), neue Spieler, Summen für 7/30 Tage, Duelle, Gruppen, offene Hinweise und Chat-Meldungen, Datenbankgröße. Nur Zahlen, keine Einzelpersonen. Tests: `supabase/tests/flags.sql` (6 Prüfungen); `groups_chat.sql` schaltet beides für seine Prüfungen ein.

## 47. Neue Entdecken-Seite, Abzeichen als Medaillen, Social-Media-Paket (21.10.2026)

- **Entdecken** (`app/explore/page.tsx`): statt zehn gleicher Zeilen – „Fakt des Tages“ und eine neue Animation als große Karten, „Spielen“ (Duell, Quiz, Rätsel als farbige Kacheln), Themen-Raster mit Fortschrittsring je Thema (Tipp filtert alle Inhalte des Themas), Leisten mit Clips (Vorschaubild, Direktlink `/clips/?c=`), Animationen, Bucheinbänden und Fakten – jeweils Ungesehenes zuerst (`freshFirst`). Suche durchsucht jetzt auch Fakten.
- **Abzeichen** (`components/Badge.tsx`, `ACHIEVEMENTS` mit `icon`, `color`, `progress`): sechseckige Medaillen mit eigener Farbe, Verlauf und Glanz; gesperrte grau mit Fortschrittsring; „Nächstes Abzeichen“ mit Balken (`nextAchievement`); Antippen zeigt Details. Test: Fortschritt voll genau dann, wenn das Abzeichen erreicht ist.
- **Social-Media-Paket** (`video/social.mjs`, `video/src/Social.tsx`, Anleitung `docs/SOCIAL.md`, Plan `docs/SOCIAL-PLAN.de.md`): 6 eigene Clips mit Quiz-Schlussbild, 24 Fakten-Bildposts, 30-Tage-Plan mit Texten und Hashtags; lokal gerendert nach `video/out/social/` (nicht im Git).
- **Inhalte:** 8 Fakten (94; Sport, Sprache, Business, Wirtschaft), Quelle „Herzfrequenz“ beim Herz-Fakt ergänzt, eigener Clip „So oft schlägt dein Herz“ (`v-herz-schlaege`). Stand: 825 Fragen, 52 veröffentlichte Clips (7 eigene), 94 Fakten.

## 48. Neue Kartenformate: „Mythos oder Wahrheit?“ und hochzählende Zahlen (21.10.2026)

- Fakten können zusätzlich `quiz` (`"myth"` mit dem verbreiteten Irrtum `myth`/`translations.en.myth`, oder `"truth"`) und `figure` (`value`, `digits`, `suffix`, englisch `translations.en.figureSuffix`) tragen (`lib/facts.ts`). `FactCard` fragt Quiz-Fakten zuerst ab („Stimmt“ / „Mythos“), zeigt dann Urteil, Fakt, Erklärung und Quelle; Zahlen zählen beim Erscheinen hoch (ohne Animation bei „Bewegung reduzieren“). Quiz-Fakten kommen im Feed etwas häufiger (+1 im Fakten-Ranking).
- Daten über Format-Dateien (`content/_batches/*-facts-formats-*.mjs`), geprüft von `verify-evidence.mjs` (Mythos braucht ein Zitat, das ihn widerlegt; Zahl muss im geprüften Text stehen) und eingespielt von `scripts/content/annotate-facts.mjs`. Erste Datei: 2 Mythen, 7 Wahrheiten, 10 Zahlen. Die Inhalts-Routine darf künftig bis zu 6 solcher Ergänzungen pro Lauf liefern (Sub-Agent schreibt, Routine prüft).
- Tests: `tests/seen.test.ts` (Zuordnung), `e2e/share.spec.ts` (erst raten, dann Auflösung).

## 49. „Heute vor … Jahren“, Themen-Serien, Clips von einem anderen Host (21.10.2026)

- **Heute vor … Jahren** (`content/days.json`, `lib/days.ts`, `DayCard` in `components/DayCards.tsx`): ein Ereignis pro Kalendertag, als zweite Karte im Feed (einmal, danach als gesehen gemerkt). Gibt es heute keins, das nächste aus ±3 Tagen („Diese Woche vor … Jahren“). Quelle ist der Wikipedia-Tagesartikel; `verify-evidence.mjs` verlangt ein Zitat, das mit „<Jahr>:“ beginnt; eingespielt mit `scripts/content/merge-days.mjs`. Erster Satz: 21.10.–20.11. (31 Ereignisse, recherchiert vom Sonnet-Agenten, von mir geprüft – dabei korrigiert: KDKA sitzt in Pittsburgh, der Tagesartikel nennt Philadelphia). Die Routine hält künftig mindestens 21 Tage im Voraus gefüllt (`coverage.mjs` zeigt Lücken).
- **Themen-Serien** (`lib/series.ts`, `SeriesCard`): jeder dritte Fakten-Platz wird, wenn möglich, zu einer Karte mit drei Fakten aus demselben Bereich zum Wischen (Punkte, „1/3“). Quiz-Fakten bleiben einzeln. Alle drei Fakten zählen als gesehen.
- **Clips von einem anderen Host:** `NEXT_PUBLIC_MEDIA_BASE` (z. B. eine Cloudflare-Pages-Adresse) lässt `/clips/…` von dort laden (`media()` in `lib/content.ts`); leer = wie bisher.
- Tests: `tests/series.test.ts`, `tests/engagement.test.ts`, E2E in `e2e/share.spec.ts`; der Rhythmus-Test fixiert ein Datum ohne Tagesereignis.

## 50. Feed per Zufall, gesteuert nur vom Nutzerverhalten; Herkunftsland (25.10.2026)

- **Keine festen Plätze mehr** (`mixFeed` in `lib/feed.ts`): Für jeden Platz wird ein Format (Karte, Fakt, Clip, Animation, Buch-Idee, Visualisierung, Studie, Rätsel, „Heute vor … Jahren“) per Zufall gezogen. Startchancen `START_ODDS`; das Verhalten verschiebt sie – Verweildauer und Wegwischen pro Format (`formatEngagement`, Faktor bis ×3 bzw. ÷3). Innerhalb eines Formats: neu vor gesehen vor erledigt; bei Karten und Fakten wird unter den nächsten vier nach dem Themen-Verhalten gewählt; nie drei Einträge desselben Themas hintereinander.
- Wiederholungen und „Etwas Neues für dich“ (`rankForYou`) stehen an zufälligen Plätzen (im Schnitt jede 3. bzw. 7. Karte) statt an festen.
- Der Zufall wird einmal pro Besuch gezogen (`seed`), damit der Feed beim Scrollen nicht neu gemischt wird. Tests geben den Seed fest vor.
- **Herkunftsland** (`lib/region.ts`): aus der Spracheinstellung des Geräts (`de-AT` → AT, nur `de` → DE). Nicht abgefragt, nicht gespeichert, nicht gesendet. Karten mit `countries` (ISO-Codes, kommt mit den Wikidata-Fragen) bekommen im Ranking einen Bonus (`W.home`, Grund „Aus deiner Gegend“).

## 51. Generierte Inhalte aus Wikidata, portionsweise geladen (25.10.2026)

- **Generator** `scripts/content/wikidata.mjs`: Vorlagen fragen Wikidata (CC0) ab und schreiben `public/gen/<vorlage>.json`. Vorlagen: Hauptstädte (157), chemische Elemente (90), Bücher (86), Opern (107), Gemälde (147), Welterbestätten (340). Bei Werken nur Urheber, die vor 1950 starben; keine Politiker, Herrscher, Militärs, religiösen Figuren (auch nicht als falsche Antwort); Jahreszahlen nur, wenn Wikidata sie aufs Jahr genau kennt. Beim Welterbe keine Gedenkstätten, Lager, Schlachtfelder, Orte des Sklavenhandels oder der Atomtests. Verworfen: Währungen (Daten lückenhaft), Tierklassen (Abfragen zu teuer). Regeln: nur aktuelle Werte (keine mit Enddatum), genau ein Wert, nur bekannte Einträge (viele Wikipedia-Sprachen), umstrittene Fälle ausgelassen (Israel, Palästina, Taiwan, Kosovo, Westsahara, Nordzypern, Bolivien, Südafrika, Schweiz, Niederlande), keine Antwort, die den Namen der Frage enthält (Kuwait → Kuwait-Stadt), falsche Antworten aus demselben Pool (gleicher Kontinent), Schwierigkeit nach Bekanntheit in Dritteln. Eine Währungsvorlage wurde verworfen (Wikidata-Daten lückenhaft).
- **Beleg** ist der Wikidata-Eintrag selbst (`source_url` auf die Wikidata-Seite) – mit dem Nutzer am 25.10.2026 so vereinbart.
- **Import** ohne eingefügtes SQL: Datei committen, deployen, dann `select public.import_generated('https://wunder-one.vercel.app/gen/<vorlage>.json');` – die Datenbank lädt die Datei selbst (Erweiterung `http`), fügt nur neue IDs ein, nur Dateien der eigenen Seite, nur für den Datenbank-Eigentümer aufrufbar.
- **Laden in der App:** `questions.origin` = `editorial` (handgemacht, beim Start komplett) oder `generated` (in Portionen à 80 über `sample_generated`: eigene Themen zuerst, Karten zum eigenen Land öfter, schon geladene/beantwortete ausgeschlossen; höchstens 600 auf dem Gerät). Läuft der Feed aus, lädt er nach (`onNearEnd` → `loadMore`). Bereits gezeigte Einträge behalten dabei ihren Platz. Demo-Modus/E2E: ohne generierte Karten.

## 52. Landkarte, Fotos, weitere Wikidata-Vorlagen (26.10.2026)

- **Landkarte** (`components/CountryMap.tsx`, `public/map/world.json`, gebaut mit `node scripts/build-map.mjs`): Umrisse aus Natural Earth 110m (gemeinfrei, Paket `world-atlas`), Kleinstaaten als Punkt (Koordinaten aus Wikidata). Erscheint auf Karten mit `countries` erst nach dem Antworten – so verrät sie nichts.
- **Fotos** (`scripts/content/commons-images.mjs`): Wikidata-Bild (P18) von Wikimedia Commons, nur mit eindeutig freier Lizenz (CC0, CC BY, CC BY-SA; „gemeinfrei“ nur bei Orten, nicht bei Gemälde-Fotos wegen BGH I ZR 104/17). Als WebP (400 px, ~25 KB) unter `public/img/gen/` auf dem eigenen Server – kein Abruf bei Dritten. Urheber · Lizenz unter jedem Bild mit Link zur Originaldatei (`image_url`, `image_credit`, `image_source`). Ergebnis: 311 Welterbe-Fotos, nur 5 Gemälde (fast alle Gemälde-Fotos sind nur „gemeinfrei“ markiert).
- **Neue Vorlagen:** Landeshauptstädte/Hauptorte DE, AT, CH, US (77), Olympia-Austragungsorte bis 2024 (33), Fußball-WM Gastgeber und Weltmeister bis 2022 (41; Vereinigtes Königreich ausgelassen, England spielt als eigenes Team), Amtssprachen (63, ohne „Frankreich → Französisch“), Firmensitze (82). Runde 3: Kontinent eines Landes (155, ab 6 Jahren), höchster Punkt eines Landes (160), Länderendungen im Internet (160), Monde und ihr Planet (71, ohne Nummern-Monde), Elemente nach Ordnungszahl 1–36 (36). Verworfen: Flüsse nach Kontinent (Wikidata trägt bei Flüssen kaum Kontinente ein). Runde 4: Hauptstädte und ihr Fluss (68), Kunstrichtung von Malern (52, nur Richtungen mit mindestens zwei Malern), Nobelpreis-Fach Physik/Chemie/Literatur, gestorben vor 1950 (62), Gebirge eines Bergs (76). Verworfen: Nachbarländer (Seegrenzen zählen mit), Schriften (doppelte Antworten), Skulpturen (zu wenige), Erfindungen (Drogen, unbekannte Sterne), Musikwerke, Bauwerke, Seen (Abfragen zu teuer bzw. Datenfehler – später neuer Versuch). Runde 5: Musikinstrumente und ihre Gruppe (74), Entdecker chemischer Elemente (48; nur Elemente mit genau einem Entdecker, Sauerstoff ausgelassen). Verworfen: Berufe (Wikidata nennt oft nur Nebenberufe, keine weiblichen Formen), Wüsten, Fußballvereine (Stadt des Stadions statt Heimatstadt); Sternbilder, Automarken, Vulkane, Wasserfälle scheitern an Zeitüberschreitungen.
- **Nachtrag 30.10.2026 (nächtlicher Wiederholungslauf):** Musikwerke `compositions` (32: „Wer komponierte …?“). Ausgelassen per `skip`: nummerierte Titel („3. Sinfonie“, „Klaviersonate Nr. 8“ – mehrere Komponisten unter den Antworten wären richtig), BWV-Titel (verraten Bach), die Champions-League-Hymne (nur eine Bearbeitung von Händel). Bauwerke und Sternbilder scheitern weiter an Zeitüberschreitungen (Wikidata 504).
- `import_generated` füllt bei schon vorhandenen generierten Karten nur die Bildspalten nach, nie die Frage selbst. Herkunft von Daten, Karte und Fotos steht auf der Seite „Rechtliches“.

## 53. Mathe- und Logik-Übungen (26.10.2026)

- `lib/exercises.ts`: Kopfrechnen, Prozente, Brüche, Einheiten, Zahlenreihen, Wochentage, Uhrzeiten – auf dem Gerät aus einem Seed erzeugt, unbegrenzt, ohne Quelle. Die Lösung wird mitberechnet und sofort geprüft (nur Übung, keine Punkte). Niveau nach Altersgruppe (6–9: kleine Zahlen, ohne Prozente und Brüche; die App ist derzeit aber erst ab 16 freigegeben).
- Im Feed ein eigenes Format `exercise` (Startchance 5, vom Verhalten verschoben), 40 pro Besuch; auf der Rätsel-Seite ein Block „Übungen“ mit „Mehr Übungen“. `ExerciseCard` zeigt nach dem Tippen richtig/falsch und den Rechenweg.
- Tests: `tests/exercises.test.ts` (200 Aufgaben je Art und Altersgruppe: vier verschiedene Antworten, Rechenweg passt, Kopfrechnen nachgerechnet), E2E auf der Rätsel-Seite.

## 54. Karten-Quiz und Flaggen (26.10.2026)

- **Karten-Quiz** (Übungsart `map` in `lib/exercises.ts`): „Welches Land ist auf der Karte markiert?“ – ein Land der eigenen Weltkarte rot, falsche Antworten vom selben Kontinent (`lib/map-countries.json`, von `scripts/build-map.mjs` mit erzeugt), Ländernamen vom Browser (`Intl.DisplayNames`, Deutsch/Englisch). Die Karte zoomt auf das Land und seine Umgebung (`CountryMap zoom`); ihre Beschreibung für Screenreader nennt im Quiz kein Land.
- **Flaggen** (Wikidata-Vorlage `flags` + `commons-images.mjs flags`): Flaggenbild (P41) von Wikimedia Commons, nur mit eindeutig freier Lizenz (Flaggen sind fast alle gemeinfrei), WebP auf dem eigenen Server; ohne freies Bild keine Flaggenfrage. 188 Länder. Flaggen werden ganz gezeigt (nicht beschnitten). Nach dem Antworten zeigt die Karte das Land.

## 55. Umgekehrte Fragen; Gebirge und Kunstrichtungen korrigiert (26.10.2026)

- `scripts/content/reverse.mjs` baut aus den vorhandenen generierten Dateien die Umkehrung (`public/gen/<vorlage>-rev.json`, IDs `…-r`): „Paris ist die Hauptstadt welches Landes?“, „Welches chemische Symbol hat Eisen?“, „Welches dieser Bilder malte Vermeer?“ … – keine neuen Abfragen, gleiche Quellen. Nur, wo die Umkehrung genau eine richtige Antwort hat: keine Amtssprachen, keine Fußball-WM, keine Hauptstadt-Flüsse; Gipfel, die höchster Punkt zweier Länder sind, und mehrfache Olympia-Städte ausgelassen; bei Werken eine Frage pro Urheber, bei Monden höchstens vier pro Planet. Rund 1 450 Fragen.
- **Zurückgezogen (status `archived`, nicht gelöscht):** alle 76 Gebirgsfragen (falsche Paare wie Mount Kenya → Kilimandscharo; Untergebirge neben ihrem Hauptgebirge wären beide richtig), die 52 Kunstrichtungs-Fragen der ersten Fassung (Renaissance neben Hochrenaissance usw.), 9 Instrumentenfragen (Mundharmonika als Tasteninstrument, Maultrommel als Saiteninstrument, Akkordeon u. a. uneindeutig).
- Kunstrichtungen neu als `wd-move2-…`: Unterformen zusammengefasst (Italienische/Deutsche/Früh-/Hochrenaissance, Manierismus → Renaissance; barocke Malerei → Barock). `attribute()` kann jetzt `exclude` (Namen) und `normalize` (Werte zusammenfassen).

## 56. „Stimmt das?“-Karten aus generierten Daten (26.10.2026)

- `scripts/content/truefalse.mjs` → `public/gen/<vorlage>-tf.json` (IDs `…-f`, kind `fact`, „Stimmt / Stimmt nicht“): je Karte eine Aussage, etwa zur Hälfte wahr; die falsche tauscht die richtige Antwort gegen eine der falschen Möglichkeiten. Bei Ländern grammatisch neutrale Sätze („Kiribati: Die Hauptstadt heißt …“, „Die Welterbestätte „…“ liegt in diesem Land: …“) statt „von Vereinigte Staaten“. Rund 1 765 Karten.
- Ausgelassen, wo eine „falsche“ Aussage doch stimmen könnte: Amtssprachen, Hauptstadt-Flüsse, Werke (Botticelli malte auch eine „Anbetung der Könige“), Kunstrichtungen.
- `import_generated` übernimmt jetzt `kind`; `sample_generated` zieht Stimmt-das-Karten etwa ein Drittel so oft wie Fragen.
- Doppelte Werktitel: Zwei Fragen „Wer malte ‚Die Geburt der Venus‘?“ (Botticelli, Bouguereau) und „Der Kuss“ (Klimt, Hayez) – die weniger bekannten archiviert; `works()` behält künftig pro Titel nur das bekannteste Werk.
- Bekannte Schwäche: Ältere generierte Erklärungen enthalten Sätze wie „Die Hauptstadt von Vereinigte Staaten ist …“ – noch nicht korrigiert.

## 57. Bilder für „Studie kurz erklärt“; Größenvergleiche (26.10.2026)

- Studien: `scripts/content/study-images.mjs` holt das Hauptbild des Wikipedia-Artikels, nur mit klar freier Lizenz (CC0, CC BY, CC BY-SA, gemeinfrei), als WebP nach `public/img/studies/`; Urheber und Lizenz stehen unter dem Bild. 5 Studien haben so ein Foto/Diagramm. Das Foto zum Stanford-Prison-Experiment wurde bewusst nicht genommen (zeigt einen echten Teilnehmer, der noch leben kann). Die übrigen 13 haben eine wortlose Zeichnung (SVG, „Zeichnung: Wunder“).
- Größenvergleich (Szene `compare` im Animationsplayer): vier Dinge maßstabsgetreu nebeneinander – Landesflächen (Quadrate), höchste Punkte von Ländern (Gipfel), Planetendurchmesser (Kreise). Erst die Schätzfrage („Welches ist am größten?“), dann wächst eins nach dem anderen, am Ende das Verhältnis („rund 4,8-mal so viel Fläche“).
- Daten: `scripts/content/compare.mjs` → `content/compare.json` (234 Vergleiche), Werte aus Wikidata (nur Best-Rank, richtige Einheit, eindeutiger Wert; Planeten mittlerer Radius). Nur Länder auf genau einem Kontinent, keine umstrittenen Gebiete, größtes höchstens 25-mal (Fläche) bzw. 6-mal (Höhe) das kleinste. Jedes Ding ist als Quelle verlinkt. Texte baut `lib/compare.ts`; Ländernamen nie dort, wo das Deutsche einen Artikel bräuchte.
- Im Feed wechseln sich handgemachte Animationen und Vergleiche ab (eine, zwei, eine …), Vergleiche zum eigenen Land zuerst. In der Übersicht „So funktioniert’s“ stehen sie nicht, sind aber per Link erreichbar (`/explain/?a=cmp-area-Q183`).

## 58. Länderporträts statt Videodateien (26.10.2026)

- Entscheidung: Daten-Clips entstehen in der App selbst (Szene `portrait` im Animationsplayer), nicht als MP4 – Hunderte Videos würden Repo und Hosting um mehrere hundert MB aufblähen.
- Ablauf (~30 s): Die Weltkarte zoomt aufs Land, dann Flagge, Hauptstadt (vorher Schätzfrage), Fläche, höchster Punkt mit Höhe, Internetendung – soweit vorhanden.
- Daten: `scripts/content/portraits.mjs` → `content/portraits.json` (134 Länder), ohne neue Abfragen aus `public/gen/{capitals,continents,flags,summits,domains}.json` und den Flächen/Gipfelhöhen aus `content/compare.json`. Länder ohne Hauptstadt-Karte (umstrittene Fälle wie Schweiz, Niederlande) fehlen. Quellen: Wikidata-Eintrag des Landes und die Commons-Seite der Flagge mit Urheber.
- Im Feed zusammen mit den Größenvergleichen (Kicker „Länderporträt“), eigenes Land zuerst; per Link `/explain/?a=por-al`.

## 59. Vorlagen Seen, Automarken, Vulkane, Wasserfälle (26.10.2026)

- Neu: `lakes` (42), `carbrands` (50), `volcanoes` (61), `waterfalls` (25) plus je eine „Stimmt das?“-Datei (178 Karten); 120 freie Fotos (Seen, Vulkane, Wasserfälle) über `commons-images.mjs`.
- Die Abfragen liefen bisher in den 60-s-Timeout: `attribute()` kann jetzt `ordered: true` (Joins in der geschriebenen Reihenfolge) – dieselbe Abfrage braucht dann ~2,5 s. Sternbilder bleiben draußen (Wikidata führt Millionen Himmelsobjekte mit Sternbild; nicht schnell genug filterbar), Bauwerke ebenso (Timeout).
- Erklärungen artikelfrei („… liegt in diesem Land: Japan.“).
- Von Hand ausgeschlossen: Volvo und smart (Eigentümer bzw. Sitz heute in China, China unter den Antworten), „Stellantis North America“, ELBO; Kasbek (Grenzberg Georgien/Russland), Amsterdam-Insel, Sankt-Paul-Insel, Ball’s Pyramid, Inaccessible (Inseln, keine bekannten Vulkane); Livingstonefälle (größtenteils DR Kongo).

## 60. Vorlagen Inseln, Nationalparks, Berge, Flussmündungen (26.10.2026)

- Neu: `islands` (206), `parks` (186), `mountains` (65), `rivermouths` (66) plus „Stimmt das?“-Dateien (521 Karten); 431 freie Fotos.
- `attribute()`: Orte in umstrittenen Gebieten (Palästina, Taiwan, Kosovo, Westsahara, Nordzypern) fallen generell heraus (`CONTESTED`); `t.apart` hält Randmeer und Ozean auseinander (nie „Mittelmeer“ als falsche Antwort zu „Adriatisches Meer“).
- Fragen wiederholen den Namen nicht („In welchem Land liegt der „Nationalpark Teide“?“ statt „der Nationalpark „Nationalpark Teide““).
- Von Hand ausgeschlossen: Utøya (Anschlag 2011), Schlangeninsel (Krieg); Diego Garcia, Südgeorgien, Navassa, Peñón de Vélez (Hoheit umstritten), St. Martin (geteilt); zweimal „Glacier-Nationalpark“ (Kanada/USA), Deosai (Kaschmir), Festungen und Ausgrabungen mit Nationalpark-Status; K2, Kasbek, Belucha, Gangkhar Puensum (Grenzberge), Nanga Parbat, Ölberg (umstrittene Gebiete); Murray River (Südlicher oder Indischer Ozean je nach Zählung). Mündungstrichter und Buchten (Gironde, Humber, Chesapeake Bay, Río de la Plata) zählen nicht als Meer.
- Großstädte → Land wurde versucht: die Klasse „Großstadt“ liefert in Wikidata keine eindeutigen Treffer – weggelassen.

## 61. Vorlagen Flüsse, Burgen, Bauwerke, Universitäten, Museen, Städte (27.10.2026)

- `placeIn()` baut „In welchem Land steht/liegt/fließt …?“ für eine Art Ort (Artikel und Nomen aus `word`, kein doppeltes Nomen bei Namen wie „Burg Eltz“). Neu: `rivers` (257), `castles` (77), `towers` (49, „Bauwerk“: Türme und Hochhäuser), `universities` (24), `museums` (17), `cities` (569) plus „Stimmt das?“ (992); 152 freie Fotos.
- `attribute()`: gleichnamige Dinge fallen heraus (San José in Costa Rica und den USA – sonst wären zwei Antworten richtig); `t.skip` lässt Namen nach Muster weg.
- Von Hand ausgeschlossen: Flüsse über eine Grenze, obwohl Wikidata nur ein Land nennt (Ganges, Bagmati, Rio Purus, Sereth, Chabur), in besetzten oder umstrittenen Gebieten (Kalmius, Enguri, Drin), mehrdeutige Namen (Avon, Red River, Río Negro, Morava, Ill, Río Colorado); Camelot (Sage), Fort São Jorge da Mina (Sklavenhandel); Trump-Gebäude (lebende Person); Hebräische Universität (Ostjerusalem); KZ-Gedenkstätten und Yad Vashem (kein Quizstoff); Nikosia (geteilt), Simferopol, Sewastopol (Krim), Tiraspol (Transnistrien).
- Versucht und weggelassen: Kathedralen (Klasse enthält Moscheen), Brücken (keine Treffer).

## 62. Schwierigkeit nach Können für Übungen und Rätsel (27.10.2026)

- `lib/skill.ts`: je Art (Kopfrechnen, Prozente, … Sudoku, Kreuzworträtsel, Zahlenpyramide) ein Wert 1–5 im Nutzerzustand (`skill`, bleibt auf dem Gerät). Richtig +0,2, mit Tipps +0,05, falsch oder „Lösung zeigen“ −0,45 – so pendelt er sich bei etwa 70 % Lösungen ein. Start bei 3 = die bisherige Schwierigkeit für Erwachsene.
- Übungen (`lib/exercises.ts`) haben 5 Stufen. Neu auf 4/5: zweistellig × zweistellig, Prozent rückwärts (Preis vor dem Rabatt), Prozentketten (+20 %, dann −20 %), Brüche malnehmen/teilen, km/h ↔ m/s, Flächen und Rauminhalte, Folgen mit wachsenden Abständen, × 2 + 1, Kubik- und Primzahlen, zwei verschränkte Folgen, Wochentag zwischen zwei Daten, Uhrzeit über Mitternacht, Flug über Zeitzonen. Die Altersstufe begrenzt weiterhin (Kinder: Stufe 1 bzw. 2).
- Rätsel (`lib/puzzles.ts`): Stufe bestimmt Sudoku-Größe und Lücken (Tagesrätsel 9 × 9 von 28 bis 50 Lücken, stets genau eine Lösung), Höhe und Zahlen der Pyramide, offene Wörter im Kreuzworträtsel.
- Die Übungskarte wird beim Erscheinen auf der aktuellen Stufe neu gebaut, falls sich die Stufe seit dem Aufbau des Feeds geändert hat.
- Quizkarten passten sich schon vorher an (`targetDifficulty` in `ranking.ts`).

## 63. Knifflige Mathe: „Reichen die Angaben?“, Textaufgaben, Zahlen-Knobelei (27.10.2026)

- `lib/reasoning.ts`, drei neue Übungsarten nur für Erwachsene, je 5 Stufen (Stufe nach Können, §62). Alles wird erzeugt und nachgerechnet – keine Quellen nötig, keine übernommenen Testaufgaben (Stil von Einstellungstests, aber eigene Aufgaben; der Markenname eines solchen Tests steht nirgends in der App).
- **Reichen die Angaben?** Eine Frage über ganze Zahlen in einem genannten Bereich, zwei Angaben, fünf feste Antworten (A–E). Welche Angaben reichen, entscheidet ein Löser, der alle Werte des Bereichs durchprobiert – also exakt; die Erklärung nennt Gegenbeispiele. Stufen: 1–2 eine Zahl von 1 bis 20, 3 Reste/Primzahlen/Quadratzahlen, 4 zwei Zahlen, 5 negative Zahlen (Fallen wie x² > 16) oder zwei Zahlen von −5 bis 5. Angaben, die die Frage nur wiederholen oder verneinen, kommen nicht vor.
- **Textaufgaben:** Händedrücke, Durchschnitt, Sprachen-Mengen, Pumpen, Mischungen, Durchschnittsgeschwindigkeit (harmonisches Mittel), Alter, zwei Würfel, Ziehen ohne Zurücklegen, Teams (Kombinationen), Sitzordnung mit Paar.
- **Zahlen-Knobelei:** Busse (kgV), Summe 1 bis n, Reste, Teilerzahl, Endziffer großer Potenzen, Endnullen von n!, Rest großer Potenzen, „durch a oder b teilbar“ (Ein- und Ausschluss).
- Tests rechnen Textaufgaben und Zahlen unabhängig nach (BigInt, Abzählen) und prüfen „Reichen die Angaben?“ an klassischen Fällen und auf eine ausgewogene Verteilung der fünf Antworten.

## 64. Logikrätsel und Futoshiki (27.10.2026)

- `lib/logic.ts`, drei Übungsarten nur für Erwachsene, je 5 Stufen; jede Aufgabe wird durch Durchprobieren gelöst und nur gezeigt, wenn genau eine Antwort passt:
  - **Ehrlich oder gelogen?** (Ritter und Schurken, ohne gegenderte Rollenwörter): 2–4 Personen, Aussagen über andere, über „gleich“, „mindestens eine lügt“, „genau zwei sind ehrlich“, „Ich lüge, oder …“. Die Erklärung prüft jede Aussage und zeigt, wo eine falsche Verteilung bricht.
  - **Was folgt?** (Syllogismen) mit erfundenen Gruppen (Blimps, Draxe …), damit Weltwissen nicht hilft oder täuscht. Geprüft über alle 256 Lagen der drei Gruppen (alle drei nicht leer – das steht in der Aufgabe). Immer mit „Nichts davon folgt sicher“; Gegenbeispiel in der Erklärung.
  - **Reihenfolge:** 4–5 Personen im Ziel, Hinweise (vor, direkt vor, nebeneinander, genau eine dazwischen, (nicht) auf Platz …), ab Stufe 2 auf die nötigen Hinweise reduziert; Stufe 5 ohne „landet auf Platz“.
- **Futoshiki** als viertes Gitterrätsel im Feed (Sudoku, Kreuzwort, Pyramide, Futoshiki im Wechsel): lateinisches Quadrat 4×4 bis 6×6 mit < und > zwischen Nachbarn, stets genau eine Lösung; eigene Stufe (`futoshiki`). Fehler (doppelte Zahl, falsches Zeichen) werden beim Tippen rot.
- KenKen bewusst weggelassen (braucht eine eigene Käfig-Darstellung; Futoshiki übt dasselbe Denken).
- Tests lesen die Logikaufgaben aus dem deutschen Text zurück und lösen sie unabhängig vom Erzeuger.

## 65. Korrekturen aus den Hinweisen an die Redaktion (29.10.2026)

- **Reihenfolge-Fragen (#28):** Nach einer falschen Antwort bleibt die eigene Reihenfolge stehen, jeder Platz ist grün oder rot markiert, darunter steht die richtige Reihenfolge. Vorher wurde immer die Lösung grün gezeigt (`components/Formats.tsx`).
- **Grafiken (#27, #30):** Schätzantwort und Reglerstellung bleiben je Grafik auf dem Gerät (`UserState.visualState`, gespeichert, sobald der Regler ruht). Wachstums-Grafiken können Beispiel-Einstellungen aus den Texten als Knöpfe haben (`config.presets`, Beschriftung über `labels`); der Zinseszins hat die drei aus Schätzfrage und Aufgabe.
- **Weltkarte (#34):** Flächen über der Datumsgrenze (Russlands Festland, eine Fidschi-Insel) wurden beim Bau der Karte weggelassen – Russland bestand nur aus Inseln. `scripts/build-map.mjs` zeichnet sie jetzt durchgehend und wiederholt den Teil jenseits von 180° am anderen Rand (`wrap`, wird gezeichnet, aber nicht zum Zoomen verwendet).
- **Clips im Vollbild (#25):** Die eigenen Clips halten alles Wichtige über 880 von 1280 Pixeln. Auf kurzen Bildschirmen reichten Titel und Knöpfe höher und verdeckten das Bild. `useClipFrame` (components/ClipPlayer.tsx) verkleinert das Bild jetzt so weit, dass sein wichtiger Teil über Text und Untertitel endet – im Feed und auf der Clip-Seite.
- **Animation Buchdruck (#29):** Szene in einem Maßstab (1 Einheit = 30 cm): Presse 1,9 m, Werkbänke 86 cm, Seite 30 × 42 cm, Lettern 2,4 cm hoch. Der Karren mit der Druckform rollt zum Einfärben und Auflegen heraus und unter den Tiegel zurück (vorher hätte der Druckerballen nicht zwischen Tiegel und Lettern gepasst). Am Ende zeigt die Kamera „WUNDER“ seitenrichtig auf dem gedruckten Blatt. Standbilder neu (`GPU=1 node scripts/anim-stills.mjs …`; das Skript beantwortet jetzt auch Vorhersagen, die erst beim Abspielen kommen, und nimmt den letzten Schritt kurz vor seinem Ende auf).

## 66. Neue Themen und zwei neue Grafik-Typen (29.10.2026)

- **118 neue Fragen** in acht Paketen, jede Aussage mit wörtlichem Wikipedia-Zitat: Denkfallen und Statistik (`dk`), wie KI funktioniert (`ki`), Alltagstechnik (`at`), Wirtschaft verstehen (`ew`), Sprache im Wandel (`sw`), Alltags- und Erfindungsgeschichte (`ag`), Kunst (`ku`), Musik (`mu`). Batches in `content/_batches/2026-10-*.mjs`; damit gibt es 1.046 handgemachte Fragen (963 im Feed).
- **Belegprüfung für Fragen:** `scripts/content/verify-evidence.mjs` prüft jetzt auch Fragen-Stapel (`questions` + `evidence`): jede Frage braucht ein Zitat aus ihrem eigenen Artikel, jedes Zitat muss wörtlich im Artikel stehen, und jede mehrstellige Zahl aus Frage, richtiger Antwort und Erklärung muss in einem Zitat vorkommen. Fragen dürfen mit `en:Titel` die englische Wikipedia als Quelle nennen (`apply-batch.mjs` setzt dann Quelle und Link entsprechend).
- **Grafik-Typ `chance`** (`components/viz/ChanceViz.tsx`): Geburtstagsparadoxon, Ziegenproblem und Münzwurf – von Hand und tausendmal auf Knopfdruck. **Grafik-Typ `sampling`** (`SamplingViz.tsx`): wie ein Sprachmodell das nächste Wort auslost, mit Temperatur-Regler; ausdrücklich Beispielzahlen. Formeln in `lib/visuals.ts`, Tests in `tests/visuals.test.ts`.
- Datenbank: neue Fragen per `execute_sql` mit dem SQL aus `buildImportSql` nur für die neuen IDs (wie bisher).

## 67. Clip-Fragen: erst raten, dann schauen (30.10.2026)

- **Anlass:** Hinweise #31–33 – die Frage kam nach dem Clip, der die Antwort gerade gezeigt hatte (47 von 77 Clip-Fragen fragten genau das ab). Der Betreiber hat „erst raten, dann schauen“ gewählt.
- **Ablauf** (`components/ClipGuess.tsx`, `useClipGuess`): Hat ein Clip eine Frage, steht sie zuerst über dem angehaltenen Clip (`clip-guess`). Der Tipp wird sofort als Antwort gespeichert (`answer(quiz, i, "video")`, zählt wie jede erste Antwort), das Ergebnis bleibt aber verborgen. Dann läuft der Clip, unten steht „Dein Tipp: …“ mit „Auflösung“ (`clip-tip`). Am Ende des Clips oder auf Knopfdruck folgt das Ergebnis mit Erklärung und dem Satz „Im Clip:“ (`clip-reveal`), danach „Weiter“. Phasen: guess → watch → reveal → done.
- **Wo:** Feed (`ClipCard` in `components/Feed.tsx`; im Vollbild als Overlay über dem Clip, sonst als Feld in der Karte) und Clip-Seite (`app/clips/page.tsx`). Verrät der Clip-Titel die Antwort, steht während des Ratens „Was meinst du? Danach zeigt es der Clip.“ statt des Titels.
- **Entfernt:** das Quiz nach dem Clip (Sheet, „Kurz testen · 10 XP“) und der zweite Versuch nach einer falschen Clip-Antwort (`firstTry`, `missed` im Store, `checkFirstAttempt` in `lib/supabase.ts`). Falsch getippte Fragen kommen wie alle falschen Antworten später wieder.
- **Clip-Bild und Kopfzeile:** Auf der Clip-Seite verdeckte die Kopfzeile („Clips · Wunder Redaktion“) die Themen-Zeile oben im Clip (auf schmalen Handys und am Desktop schon länger, auf üblichen Handys seit der Korrektur zu #25). `useClipFrame` hält das Bild jetzt so groß wie möglich und mittig, die Themen-Zeile unter der Kopfzeile (die Clips sind über 64 von 1280 Pixeln leer) und den wichtigen Teil über dem Text.
- Keine Datenbank-Änderung nötig. Tests: `e2e/clips.spec.ts` (raten, schauen, Auflösung; Ergebnis am Clip-Ende; Kopfzeile über dem leeren Rand).

## 68. Weniger Gleiches im Feed: Runden und Dubletten (30.10.2026)

- **Anlass:** Der Betreiber bemerkte viele gleiche oder ähnliche Inhalte. Befund: 8.918 von 9.957 veröffentlichten Fragen stammen aus Wikidata-Schablonen (`wd-<schablone>-Q…`), jede Sache dreifach (Frage, umgekehrt, „Stimmt das?“), und sie waren neuer als die handgemachten. Ein Probelauf für ein neues Konto zeigte unter den ersten 89 Fragekarten 83 Schablonen-Fragen, rund die Hälfte „In welchem Land liegt …?“. Der Feed verhinderte nur drei Einträge desselben Themenbereichs hintereinander.
- **Runden** (`lib/rounds.ts`, `components/RoundCard.tsx`): Schablonen-Fragen kommen nicht mehr einzeln, sondern als eigenes Format `round` – fünf Fragen einer Schablone in einem Eintrag, Frage für Frage, mit Fortschrittsbalken und Ergebnis. Startchancen: Karte 45, Runde 5 (`START_ODDS`, vom Verhalten verschoben wie alle Formate). Jede Schablone einmal, bevor eine wiederkommt (in der Reihenfolge ihrer besten Karte, also die eigenen Themen zuerst); keine Schablone zweimal in sechs Runden; nie zwei „Wo liegt …?“-Runden hintereinander. Eine Sache kommt pro Feed nur in einer ihrer Formen. Falsch beantwortete Schablonen-Fragen kommen zur Wiederholung einzeln.
- Probelauf danach (erste 100 Einträge, neues Konto): 81 handgemachte Karten, 6 Runden aus 6 verschiedenen Schablonen. Test: `tests/rounds.test.ts` (mit allen Fragen aus `public/gen`).
- **Dubletten:** `node scripts/content/duplicates.mjs` listet handgemachte Fragen und Fakten, die fast dasselbe sagen. Archiviert (nicht gelöscht): 11 Fakten, die eine „Stimmt das?“-Frage wiederholten (Wikinger-Helme, Mona Lisa, Freiheitsstatue, Golfball, erste Münzen, Geburtstags-Paradoxon, kürzester Krieg, Blitz, Herzschläge, WM 1930, Steigbügel), und 7 Fragen (`hm1`, `tf2`, `s-e1`, `b48`, `dk3`, `rt51`, `s11` – je eine von zwei gleichen; bei `tf2` und `s-e1` fragt der Clip dasselbe). Datenbank per `update … set status = 'archived'`; 1.039 handgemachte Fragen veröffentlicht.

## 69. Blick ins Innere: ein Regler zwischen außen und innen (30.10.2026)

- **Anlass:** Der Betreiber sah eine Folie, auf der ein Regler zwischen Außen- und Innenansicht eines Herzens wechselt, und wollte das testen.
- **Neuer Grafik-Typ `reveal`** (`components/viz/RevealViz.tsx`): eine eigene Zeichnung, links der Linie außen, rechts innen. Ziehen (auf dem Handy nur seitwärts – nach oben wischen scrollt weiter den Feed), tippen, Pfeiltasten, Pos1/Ende. Mit Schätzfrage bleibt das Bild bis zur Antwort zu und öffnet sich dann halb von selbst; die Beschriftungen erscheinen nur, wo das Innere zu sehen ist. Die Stellung des Reglers bleibt auf dem Gerät gespeichert (wie bei den anderen Grafiken).
- **Erste zwei Inhalte** (`content/_batches/2026-10-visuals-5.mjs`, Belege wörtlich aus der deutschen Wikipedia geprüft): `v-erde-innen` (Schalen maßstabsgetreu, nur die Kruste dicker gezeichnet; Schätzfrage: 12,3 km tiefstes Bohrloch = rund 0,2 % des Wegs zum Mittelpunkt) und `v-herz-innen` (vier Räume, vier Klappen, Scheidewand, Weg des Blutes; Schätzfrage: die linke Kammer hat die dickste Wand). Neue Datenart `drawing` („Eigene Zeichnung nach Quellen“).
- Tests: `tests/visuals.test.ts` (Beschriftungen vorhanden und im Bild), `e2e/clips.spec.ts` (geschlossen bis zur Schätzung, Ziehen, Tastatur, Beschriftungen).

## 70. Zwölf neue Studien, nur noch eigene Bilder (30.10.2026)

- **Neue Studien** (`content/_batches/2026-10-studies-4.mjs`, 30 insgesamt): Ankereffekt (Glücksrad), Marmeladen-Studie, Galtons Schätzspiel, Pechtropfen-Experiment, Fehlinformation (Loftus), Rutherfords Goldfolie, Stroop-Effekt, Pasteurs Schwanenhalsflaschen, Foucaults Pendel, Michelson-Morley, Youngs Doppelspalt, Besitztumseffekt. Texte in eigenen Worten; jede Aussage und jede Jahreszahl wörtlich belegt (`verify-evidence.mjs`, zwei Belege aus der englischen Wikipedia). Jede Studie hat ihr „Aber …“.
- **Nur eigene Bilder** (Wunsch des Betreibers): Die fünf Wikipedia-Fotos (Asch, Dunning-Kruger, Ebbinghaus, Miller-Urey, Millikan) sind durch eigene Zeichnungen ersetzt, die Fotodateien gelöscht. Alle 30 Studien haben jetzt eine wortlose Zeichnung im Stil der ersten (`scripts/content/study-drawings.mjs` schreibt die SVGs und setzt `image_url`/`image_credit`; früher von Hand gezeichnete bleiben unverändert). `scripts/content/study-images.mjs` (holte Wikipedia-Bilder) nicht mehr verwenden.

## 71. Erste Motion-Graphics-Animation: die Erdgeschichte als ein Tag (30.10.2026)

- **Anlass:** Der Betreiber fragte nach Motion Graphics für neue Animationen; empfohlen und vereinbart: als 2D-Szenen in der App (interaktiv, mit Schritten und Vorhersage), 3D nur noch für räumliche Mechanik. Dies ist das Muster.
- **`a-erdtag`** (Szene `earthday` in `components/anim/scenes.tsx`, Renderer `svg-scene`): 4,54 Milliarden Jahre auf einer 24-Stunden-Uhr. Der Zeiger läuft durch die Erdgeschichte, die Zeitalter füllen sich als farbige Bögen, eine Digitaluhr läuft mit, darunter baut sich die Liste der Ereignisse auf; vor dem letzten Schritt die Frage, wann der Mensch erscheint, dann zoomt das Bild in die letzte Minute (Homo sapiens: 23:59:54 Uhr, nicht einmal sechs Sekunden). Uhrzeiten werden aus den belegten Jahreszahlen berechnet (`EARTH_DAY`); Belege im Kopf von `content/_batches/2026-10-erdtag.mjs`. Prüffrage `et1` (seit wann Homo sapiens belegt ist).
- `scripts/content/merge-animations.mjs` nimmt jetzt `renderer` (`three` oder `svg-scene`) mit.
- Datenbank: `et1` per `execute_sql` nach dem Deploy (wie bei allen neuen Fragen).

## 72. Zwei weitere Motion-Graphics-Animationen (30.10.2026)

- **`a-milliarde`** „Wie groß ist eine Milliarde?“ (Szene `seconds`): Ein Zähler läuft auf eine Million, eine Milliarde, eine Billion Sekunden; daneben Tage-Kästchen (≈ 11,6 Tage), ein Jahres-Balken (≈ 31,7 Jahre), der sich auf ≈ 31.700 Jahre umskaliert; zum Schluss die drei Stufen mit „× 1000“. Reine Rechnung (Jahr = 365,25 Tage); Zahlen mit schmalen Leerzeichen gruppiert, damit sie in jeder Sprache stimmen; der Text erklärt Milliarde = englisch „billion“. Prüffrage: die vorhandene `mf3`.
- **`a-sonnensystem`** „Das Sonnensystem im Fußball-Maßstab“ (Szene `solarscale`): Die Sonne wird zum Fußball (22 cm, 1 : 6,4 Milliarden), dann Erde (2 mm in 23,5 m), Jupiter (2,3 cm in 122 m), Neptun (8 mm in 707 m), alle Planeten unter derselben Lupe; vor dem letzten Schritt die Schätzfrage, dann der nächste Stern: rund 6.300 km – fast der halbe Durchmesser der echten Erde. Werte aus belegten Größen berechnet (Belege im Kopf von `content/_batches/2026-10-sonnensystem.mjs`). Neue Prüffrage `es1` (Sonne etwa 110-mal so groß wie die Erde).

## 73. Blick ins Innere: Vulkan und Auge (30.10.2026)

- Zwei weitere eigene Zeichnungen für den Regler zwischen außen und innen (`content/_batches/2026-10-visuals-6.mjs`, Szenen `volcano` und `eye` in `components/viz/reveal/scenes.tsx`): ein Schichtvulkan (Aschewolke, Krater, Lava- und Ascheschichten, Schlot, Magmakammer; Schätzfrage: Magmakammern liegen einige bis Dutzende Kilometer tief – in der Zeichnung gestaucht) und das Auge von der Seite (Hornhaut, Iris, Linse, Glaskörper, Netzhaut, blinder Fleck, Sehnerv, Lederhaut; Schätzfrage: der Glaskörper ist zu etwa 98 % Wasser). Belege wörtlich geprüft.

## 74. Weltbevölkerung und Wasser als Motion Graphics; Ei und Glühbirne im Regler (30.10.2026)

- **`a-weltbevoelkerung`** (Szene `population`): Die Kurve von 1 auf 8 Milliarden zeichnet sich, ein Jahreszähler läuft, jede Milliarde bekommt ihren Punkt; darunter schrumpfende Balken für die Jahre bis zur nächsten Milliarde (123, 33, 14, 13, 12, 12, 11). Zum Schluss die gestrichelte Prognose bis etwa 10,3 Milliarden um 2084. Jahre nach UN-Angaben (deutsche und englische Wikipedia). Prüffrage `wb1`.
- **`a-wasser`** (Szene `water`): Alles Wasser der Erde als 100 Liter – 97,5 l Salzwasser, 2,5 l Süßwasser, davon fast alles Eis, Schnee und Grundwasser, nur 7,5 ml flüssig an der Oberfläche; die verteilen sich auf Seen (87 %), Sümpfe (11 %) und Flüsse (2 % = 0,15 ml). Anteile aus der englischen Wikipedia (Water distribution on Earth), Mengen daraus berechnet. Prüffrage `wa1` (Süßwasser: nur wenige Prozent).
- **Regler „Blick ins Innere“**: `v-ei-innen` (Kalkschale mit Poren, Schalenhaut, Luftkammer, Eiklar, Dotter, Keimscheibe, Hagelschnüre; Schätzfrage: warum die Luftkammer wächst) und `v-gluehbirne-innen` (Glaskolben mit Füllgas, Glühwendel, Halterung, Stromzuführungen, Edisonsockel, Kontakt; Schätzfrage: nur ca. 2,2 % der Energie werden Licht). Damit sechs Motive.

## 75. Zehn weitere Studien (30.10.2026)

- **Neu** (`content/_batches/2026-10-studies-5.mjs`, 40 insgesamt): Pawlows Hunde, die Bobo-Puppe (Bandura, ab 13), Sherifs wandernder Lichtpunkt, Mendels Erbsen, die Magdeburger Halbkugeln, Cavendish wiegt die Erde (ab 13), Ørsted und die Kompassnadel, der Spiegeltest (Gallup), Ringelmann und das Ziehen im Team, der Zeigarnik-Effekt. In eigenen Worten, jede Aussage und Jahreszahl wörtlich belegt (teils englische Wikipedia); jede Studie mit „Aber …“ (z. B. Zeigarnik kaum wiederholbar, Ørsted nicht der Erste, Sherifs Lichtpunkt hat sich nie bewegt).
- Zehn neue eigene Zeichnungen in `scripts/content/study-drawings.mjs`.
