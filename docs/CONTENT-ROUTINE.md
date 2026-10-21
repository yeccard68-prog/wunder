# Inhalts-Routine: neue Fakten laufend und ohne Rückfragen

Diese Anleitung arbeitet eine geplante Claude-Sitzung regelmäßig ab (eingerichtet am 19.10.2026 auf Wunsch des
Betreibers). Sie erweitert die App um „Wusstest du?“-Fakten – nur Fakten, weil die als Datei mit der App
ausgeliefert werden: keine Datenbank-Änderung, keine Zähl-Tests, die angepasst werden müssten, kein Risiko für
die Live-Daten. Läuft etwas schief, bricht die Routine ab und hinterlässt eine Notiz – sie veröffentlicht nie
etwas Ungeprüftes.

## Regeln (gelten immer)

- **Jede Aussage belegt:** Für jeden Fakt mindestens ein wörtliches Zitat aus dem verlinkten Wikipedia-Artikel
  im `evidence`-Teil des Batches, ein Zitat je Zahl/Behauptung in Text **und** Erklärung. `verify-evidence.mjs`
  muss für jeden Fakt „ok“ melden. Was nicht belegt ist, wird gestrichen oder so umformuliert, dass es belegt ist
  – nie „ungefähr richtig“ stehen lassen. Populäre Irrtümer prüfen (z. B. „blaues Blut“, „Marathon seit 1908“).
- **Eigene Worte:** keine Sätze aus Wikipedia übernehmen (die Zitate stehen nur im Batch als Beleg, nie in der App).
- **Für alle geeignet:** keine Gewalt-Details, keine Politik/Religion als Streitthema, nichts über lebende
  Privatpersonen, keine Gesundheits- oder Finanzratschläge. Mindestalter 10, außer es passt erst ab 13/16.
- **Status bleibt `ai_checked`.** Nie `verified` setzen – das ist der Redaktion vorbehalten.
- **Nichts Bestehendes ändern oder löschen**, keine Migrationen, keine Datenbank-Schreibzugriffe, keine Clips,
  keine Pakete installieren, nichts Kostenpflichtiges.
- **Höchstens 8 Fakten pro Lauf**, Deutsch und Englisch.

## Ablauf

1. `cd knowledge-app`, `git checkout umbau`, `git pull --ff-only origin umbau` (bei Konflikten: abbrechen, Notiz).
2. `date +%F` → Datum für `TODAY`.
3. `node scripts/content/coverage.mjs` → die zwei bis drei am dünnsten besetzten Themen/Bereiche wählen; die
   Liste der vorhandenen Fakten und Artikel lesen, um Doppelungen zu vermeiden.
4. Passende Wikipedia-Artikel (de) lesen – z. B. mit `node scripts/content/wcheck.mjs "de|Titel|Suchwort"` oder der
   Wikipedia-API – und überraschende, gut belegte Fakten auswählen.
5. Batch `content/_batches/<YYYY-MM>-facts-<n>.mjs` nach dem Muster von `2026-10-facts-6.mjs` anlegen
   (Felder: id, area, category, sources, Text de, Erklärung de, Text en, Erklärung en; dazu `evidence`).
   Kategorien: siehe `content/categories.json`; Bereiche: `AREAS` in `lib/facts.ts`.
6. `node scripts/content/verify-evidence.mjs <batch>` – bis alles „ok“ ist (Fakten streichen oder Zitate
   korrigieren). Wenn am Ende weniger als 3 Fakten übrig sind: abbrechen, Notiz.
7. `node <batch>` (fügt in `content/facts.json` ein), dann `node scripts/content/import.mjs --check`,
   `npx tsc --noEmit -p .` und `npm test` – alles muss grün sein, sonst `git checkout -- .` und Notiz.
8. In `docs/CONTENT-LOG.md` oben eine Zeile ergänzen: Datum, Batch, Anzahl, Themen, verworfene Fakten mit Grund.
9. Commit (`Content routine: N facts (<Themen>)` + Co-Authored-By-Zeile), `git checkout main`,
   `git merge --ff-only umbau`, `git push origin main umbau`, `git checkout umbau`.
10. Keine weiteren Schritte (keine CI-Abfrage-Schleifen: höchstens ein Blick auf
    https://github.com/yeccard68-prog/wunder/actions).

## Notiz bei Abbruch

Eine Zeile in `docs/CONTENT-LOG.md` mit „ABGEBROCHEN“, Datum und Grund – nur diese Datei committen und pushen,
wenn das Repo sonst sauber ist; sonst gar nichts committen.

## Sub-Agents (seit 21.10.2026)

Um Kosten zu sparen, recherchiert und schreibt der Sub-Agent `wunder-fakten-recherche` (günstigeres Modell, Definition
in `~/.claude/agents/wunder-fakten-recherche.md`). Die Routine prüft danach selbst: `verify-evidence.mjs`, Durchsicht
jedes Fakts (jede Zahl, jeder Name, jedes Datum braucht ein Zitat), Tests – erst dann wird veröffentlicht.
Für Übersetzungen und Social-Texte gibt es `wunder-texte` (noch günstigeres Modell). Datenbank, Rechtliches und
Sicherheit bleiben beim Hauptmodell.
