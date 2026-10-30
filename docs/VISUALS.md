# Interaktive Visualisierungen (Stand 14.10.2026)

Diagramme und kleine Modelle, die Lernende selbst verändern. Erreichbar unter **Entdecken → Interaktiv** (`/lab/`, eine einzelne über `/lab/?v=<id>`).

## Bestandsaufnahme: Was es wofür gibt

| Bedarf | Lösung im Projekt | Warum so |
|---|---|---|
| Diagramme (Linien, Punkte, Geraden) | eigenes SVG in `components/viz/` | Drei Diagrammarten brauchen keine Bibliothek; SVG ist scharf, klein, per Tastatur und Screenreader erreichbar. **Keine neue Abhängigkeit.** |
| 3D-Abläufe | Three.js über `components/three/` (20 Szenen) | war schon da; wird nur geladen, wenn eine 3D-Animation erscheint |
| 2D-Abläufe | SVG-Szenen in `components/anim/scenes.tsx` | dienen jetzt vor allem als Rückfall ohne 3D |
| Kleine Darstellungen in Buch-Lektionen | `components/books/Visual.tsx` (Kreislauf, Vergleich, Szenario, Wachstum) | bleiben, weil sie in den Lesefluss eingebettet sind |

Recharts, D3 und React Three Fiber wurden **nicht** installiert. D3 lohnt sich erst für Formate wie Sankey, Netzwerk oder Treemap; die Achsen-Hilfen dafür (`ticks`, `logTicks`, `scale`) liegen schon in `lib/visuals.ts`.

## Aufbau

Vier getrennte Schichten:

1. **Inhalt** – `content/visuals.json`: Titel, Lernziel, Einleitung, Annahmen und Grenzen (`note`), Beschriftungen, Erklärung, Schätzfrage, Aufgabe, Quellen, Verknüpfungen, Übersetzungen, `data_kind` (`real` = gemessene Werte aus der genannten Quelle, `model` = Rechenmodell mit Beispielzahlen).
2. **Rechnen** – `lib/visuals.ts`: alle Formeln (`compound`, `paidIn`, `equilibrium`) und Achsen. Reine Funktionen, vollständig getestet (`tests/visuals.test.ts`).
3. **Darstellung** – `components/viz/Chart.tsx` (Rahmen mit Achsen, Regler, Datentabelle, Zahlenanzeige) und je Typ eine Komponente.
4. **Lernablauf** – `components/viz/index.tsx`: die **Registry** `VIZ` (Typ → Komponente, erst bei Bedarf geladen) und die Karte `VisualCard`: Lernziel → erst schätzen → ausprobieren → Erklärung → Aufgabe → Frage aus dem Kopf → passende Animation oder Buch.

Typen heute:

| Typ | Komponente | Beispiel | Interaktion |
|---|---|---|---|
| `growth` | `GrowthViz` | Zinseszins | vier Regler, zwei Linien, Zahlen, Datentabelle |
| `scatter` | `ScatterViz` | Planeten (Keplers drittes Gesetz, echte Daten) | Punkt antippen, lineare ↔ logarithmische Achsen, Gesetz einblenden, Punkt erscheint nach der Schätzung |
| `market` | `MarketViz` | Angebot und Nachfrage | zwei Regler verschieben die Geraden, Schnittpunkt und Erklärtext folgen |
| `bars` | `BarsViz` | Schallgeschwindigkeit (echte Daten) | Balken antippen, absolute ↔ relative Werte („× so schnell wie in Luft“), sortieren |
| `timeline` | `TimelineViz` | Technik-Meilensteine (echte Daten) | Ereignis antippen, Abstände einblenden, maßstabsgetreu ↔ gleiche Abstände; Beschriftungen weichen sich aus (`spreadLabels`) |
| `chance` | `ChanceViz` | Geburtstagsparadoxon, Ziegenproblem, Münzwurf (Rechenmodell, 29.10.2026) | einmal von Hand, dann tausendmal auf Knopfdruck; ausgezählt neben berechnet; Simulation mit `Math.random`, Formeln getestet mit `seeded` |
| `sampling` | `SamplingViz` | Wie eine KI das nächste Wort wählt (Beispielzahlen) | Temperatur-Regler formt die Wahrscheinlichkeiten um (p^(1/T)), Wörter ziehen und zählen |
| `reveal` | `RevealViz` | Blick ins Innere: Erde, Herz, Vulkan, Auge, Ei, Glühbirne, Zelle, Ohr (eigene Zeichnungen, 30.10.2026) | eine Linie trennt Außen- und Innenansicht derselben Zeichnung; ziehen, tippen oder Pfeiltasten/Pos1/Ende; bis zur Schätzung geschlossen, dann öffnet sie sich halb; Beschriftungen erscheinen, wo das Innere zu sehen ist. Zeichnungen in `components/viz/reveal/scenes.tsx` (je Szene `outside` und `inside` im Rahmen 400 × 400), die Erde aus Natural-Earth-Daten (`node scripts/build-globe.mjs`) |

Lernmuster aus dem Auftrag und wo sie stecken: **Predict** (Schätzfrage, sperrt das Ausprobieren bis zur Antwort), **Manipulate/Explore** (Regler, Umschalter), **Explain** (fester Erklärtext, beim Markt zusätzlich ein Text, der auf die Reglerstellung reagiert), **Compare** (gestrichelte Ausgangslage, „vorher“-Werte), **Apply** (Aufgabe), **Recall** (verknüpfte Quizfrage).

## Eine neue Visualisierung hinzufügen

**Fall A – das Thema passt zu einem vorhandenen Typ:** nur ein Eintrag in `content/visuals.json`.

Beispiel: „Bevölkerung wächst exponentiell“ wäre *kein* guter Kandidat für `growth` (der Typ rechnet Sparraten). Ein guter Kandidat ist „Fallzeit und Fallhöhe“ als `scatter`:

```json
{
  "id": "v-fallgesetz", "type": "scatter", "category_id": "science", "min_age": 13, "difficulty": 2,
  "data_kind": "model",
  "config": { "power": 2, "points": [{ "key": "t1", "x": 1, "y": 4.9 }, { "key": "t2", "x": 2, "y": 19.6 }, { "key": "t3", "x": 3, "y": 44.1, "late": true }] },
  "title": "…", "goal": "…", "intro": "…", "note": "Welche Formel, welche Vereinfachung (hier: ohne Luftwiderstand).",
  "labels": { "t1": "nach 1 s", "t2": "nach 2 s", "t3": "nach 3 s", "axisX": "Zeit (s)", "axisY": "Fallweg (m)", "…": "…" },
  "explain": "…", "predict": { "question": "…", "options": ["…", "…", "…"], "feedback": "…" }, "predict_correct": 1, "apply": "…",
  "sources": [{ "name": "…", "url": "https://…" }], "links": [], "verification_status": "ai_checked", "status": "published",
  "translations": { "en": { "…": "dieselben Textfelder auf Englisch" } }
}
```

Hinweis: `scatter` zeichnet das Gesetz als `y = x^power` ohne Vorfaktor. Für `y = 4,9 · x²` müsste der Typ um einen Faktor erweitert werden (eine Zeile in `ScatterViz` und im Typ `ScatterConfig`) – das Beispiel zeigt also zugleich, wo Fall A endet.

**Fall B – ein neuer Typ** (z. B. Balkendiagramm, Zeitachse):

1. Konfigurationstyp und Formeln in `lib/visuals.ts`, Typname in `VisualType`, `TYPE_NAME`.
2. Komponente in `components/viz/` mit den Bausteinen aus `Chart.tsx`; sie bekommt `VizProps` (`visual`, `color`, `locale`, `revealed`, `onChange`).
3. Eintrag in `VIZ` (`components/viz/index.tsx`).
4. Tests: Formeln in `tests/visuals.test.ts`, eine Bedienprobe in `e2e/clips.spec.ts`.

## Ablauf für jeden neuen Inhalt

1. Lernziel und Altersstufe festlegen. 2. Aussagen und Zahlen prüfen, Quelle notieren. 3. Format wählen. 4. Aus vorhandenem Typ bauen oder neuen Typ ergänzen. 5. Schätzfrage, Erklärung, Aufgabe schreiben. 6. `note`: Annahmen und Grenzen. 7. `npm test` (prüft Vollständigkeit, Quellen, Übersetzungen, Verknüpfungen, Rechenwerte) und Browser-Test. 8. Verknüpfen (`links`). 9. Veröffentlichen; Status bleibt „von KI geprüft“, bis ein Mensch freigibt.

## Regeln für Daten und Darstellung

- `real` nur für Werte aus der genannten Quelle; gerundete Werte als gerundet kennzeichnen. Alles Gerechnete ist `model`, und die Formel steht in `note` oder ist in `lib/visuals.ts` nachlesbar. Eigene Zeichnungen (`reveal`) sind `drawing`; was vereinfacht oder nicht maßstäblich ist, steht in `note`.
- Bilder nur selbst gezeichnet (Wunsch des Betreibers, 30.10.2026) – keine fremden Fotos oder Grafiken, keine KI-Bilder.
- Achsen beginnen bei null, außer bei logarithmischen Achsen (dort steht es dabei). Einheiten stehen an jeder Achse.
- Farbe trägt nie allein die Bedeutung: Linien sind im Bild beschriftet, Punkte benannt, und jede Darstellung mit Zahlenreihen hat eine Tabelle.
- Regler sind echte `<input type="range">` mit ausgeschriebenem Wert – Tastatur und Screenreader funktionieren ohne Zusatzcode.

## Barrierefreiheit, Leistung

- Diagramme haben `role="img"` mit Titel; Punkte sind per Tab erreichbar und mit Enter wählbar.
- Die Typ-Komponenten werden erst geladen, wenn eine Visualisierung geöffnet wird. Es laufen keine Animationsschleifen: neu gezeichnet wird nur bei einer Eingabe.

## Was der Auftrag nennt und es noch nicht gibt

Stapel- und Kreisdiagramme, Histogramm, Heatmap, Sankey, Netzwerk, Treemap; Geometrie zum Ziehen, Vektoren, Wahrscheinlichkeit, Ableitungen, Trigonometrie; Entscheidungsbäume, Zustandsmaschinen, Algorithmus-Visualisierungen; Concept Map über alle Inhalte. In den 3D-Animationen fehlen ein- und ausblendbare Ebenen und antippbare Bauteile (vorhanden: Start, Pause, Schritt vor und zurück, Neustart, Tempo 0,75×/1×/1,5×, Zoom per Knopf, Zwei-Finger-Geste oder Trackpad, Drehen per Wischen, Vorhersagefrage). Visualisierungen erscheinen im Feed (jede fünfte Medien-Position), aber noch nicht im Prüfbildschirm.
