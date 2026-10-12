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
