# Eigene Clips mit Remotion

Kurze Erklär-Clips (10 Sekunden, Hochformat 720 × 1280, ohne Ton), die im Programmcode entstehen statt aus fremdem Filmmaterial. Dieser Ordner ist vom App-Paket getrennt: Remotion wird nur hier installiert und nie mit der App ausgeliefert.

## Ablauf für einen neuen Clip

1. Fakten an der Quelle prüfen. Jede Zahl im Clip wird im Code aus diesen Fakten **berechnet**, nicht eingetippt.
2. Komponente in `src/clips/` schreiben (Deutsch und Englisch über `locale`), in `src/clips.json` (Länge, Bild für die Vorschau) und `src/Root.tsx` eintragen.
3. Texte, Untertitel und Quizfrage in einem Content-Batch (Vorbild: `content/_batches/2026-10-clips-5.mjs`, `creator_name: "Wunder Redaktion"`, `license: "Eigene Produktion"`, `format: "animated_fact"`).
4. Im App-Ordner: `node scripts/content/apply-batch.mjs content/_batches/<batch>.mjs`
5. Hier: `npm install` (einmal), dann `npm run render -- <id>` – schreibt `public/clips/<id>.mp4/.jpg` (Deutsch) und `<id>.en.mp4/.jpg` (Englisch) und trägt Dateien und Länge in `content/videos.json` ein.
6. Im App-Ordner: `npm run content:check`, Tests, Dateien veröffentlichen, **danach** die neuen Zeilen in die Datenbank (siehe `docs/BACKEND.md`).

Vorschau beim Bauen: `npm run studio` öffnet Remotion Studio im Browser.

## Gestaltung

- Dunkle Farben und Schriften der App (`src/theme.tsx`). Fraunces und Geist stehen unter der SIL Open Font License.
- Alles Wichtige oberhalb von `SAFE_BOTTOM` (880 px): darunter blendet die App ihre Untertitel ein.
- Wenig Text im Bild, aber jeder Text in beiden Sprachen – deshalb gibt es je Sprache eine Videodatei (`translations.en.file` in der Datenbank).

## Lizenz

Remotion ist kostenlos für Einzelpersonen, gemeinnützige Organisationen und Firmen mit höchstens 3 Beschäftigten, auch für kommerzielle Videos (`node_modules/remotion/LICENSE.md`). Größere Firmen brauchen eine Company License (remotion.pro). Der Betreiber hat am 15.10.2026 bestätigt, dass die kostenlose Lizenz passt – bei Wachstum über 3 Beschäftigte neu prüfen. Die fertigen Videos selbst sind eigene Werke; Remotion verlangt keinen Hinweis im Video oder in der App.

Version: 4.0.531 (bewusst eine Version, die bei der Installation gut zwei Wochen alt war). Alle `@remotion/*`-Pakete müssen dieselbe Version haben.

## Persönlichkeiten (seit 22.10.2026)

Eine Komponente für alle: `src/clips/Lebenslinie.tsx` zeigt Name, Lebensdaten und vier Stationen auf einem Zeitstrahl.
Die Personen stehen in `src/people.ts`, Texte, Quiz und Belege im Batch (Vorbild: `content/_batches/2026-10-people-1.mjs`).
Regeln: nur lange verstorbene Menschen, die für ihr Werk bekannt sind; keine Kriege, keine Diktatoren; keine Porträts
(rein typografisch, damit keine Bildrechte berührt sind); die letzte Station passt in eine Zeile.
`node scripts/content/verify-evidence.mjs <batch>` prüft jedes Zitat im Artikel **und** dass jede Jahreszahl aus Clip,
Texten und Quiz in einem Zitat vorkommt. Danach wie oben: `apply-batch`, `npm run render -- <ids>`, Zähltests, Seed,
Dateien veröffentlichen, dann die Zeilen in die Datenbank.

## „An diesem Tag“ für Social Media (seit 22.10.2026)

`src/DayClip.tsx` macht aus jedem Ereignis in `content/days.json` einen 8-Sekunden-Clip (Datum, hochzählende
Jahreszahl, der Satz, Quelle, Link). Ohne „vor x Jahren“ im Bild, damit er jedes Jahr stimmt.
`npm run days` rendert die nächsten 14 Tage nach `out/social/de/days/` und schreibt `days.md` mit fertigem Text pro
Post; `npm run days -- en 30` für Englisch und 30 Tage. Nicht in der App, nicht in git – zum Hochladen von Hand.
