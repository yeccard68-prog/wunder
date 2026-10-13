# Stand und offene Liste (18.10.2026)

## Was veröffentlicht ist

| Inhalt | Anzahl | Status |
|---|---|---|
| Fragekarten im Feed | 555 | alle „von KI geprüft“, keine „redaktionell geprüft“ |
| davon neue Formate | 24 (8 Reihenfolge, 8 Schätzen, 8 Lückentext) | |
| Video-Quizfragen | 44 | |
| Clips | 38 veröffentlicht, 6 archiviert (alte Balken-Clips) | frei lizenziert, Quelle und Urheber je Clip |
| Animationen | 12 (7 gezeichnet in 2D, 5 in 3D) | |
| Bücher | 20 mit 60 Lektionen (Abruf, Wiederholung, 20 Transferaufgaben) | Beleg-Stufe je Idee |
| Vorhersagefragen in Animationen | 12 (eine je Animation) | |
| Themen | 9 | |

Entwürfe oder Platzhalter gibt es nicht: Was im Datensatz steht, ist veröffentlicht.

Karten je Thema (Feed, aus dem Datensatz gezählt): Wissenschaft 94, Technologie & KI 70, Geschichte 67, Kultur & Gesellschaft 67, Erde & Natur 66, Mathe & Logik 54, Wirtschaft & Geld 49, Sprache 45, Business 43.

## Ziele aus den Aufträgen und Abstand

| Ziel | Stand | Bemerkung |
|---|---|---|
| 1.000 Quizfragen | 599 | rund 150 pro Stapel sind in guter Qualität machbar |
| 100 Kurzvideos | 38 | Engpass ist das Sichten freier Quellen, nicht die Technik |
| 50 Animationen | 12 | jede 3D-Szene ist Handarbeit im Code |
| rund 20 Bücher | 20 | je drei Ideen; fünf bis zehn Ideen je Buch wären der nächste Ausbau |
| 200 Aufgaben für unter 6-Jährige | 0 | zurückgestellt; die App ist seit 18.10. nur ab 16 freigegeben |

## Offene Punkte, nach Wichtigkeit

1. **Menschliche Prüfung.** Kein einziger Inhalt ist von einem Menschen freigegeben. Der Prüfbildschirm (`/admin/`) zeigt Fragen und Clips; Bücher und Animationen tauchen dort weiterhin nicht auf (sie liegen als Dateien in der App, nicht in der Datenbank).
2. **Test auf echten Handys.** Wischen im Schnapp-Feed, 3D-Leistung auf älteren Geräten und Videowiedergabe in Safari sind nur am PC geprüft.
3. **Rechtstexte.** Impressum, Datenschutzerklärung, Verträge mit Vercel und Supabase, Umgang mit Kinderkonten – siehe `docs/LEGAL.md`. (Buch-Fortschritt liegt seit 18.10. im Konto.)
4. **Markenname.** Vorprüfung in `docs/BRAND.md`; Kanzlei-Recherche und Entscheidung stehen aus.
5. **Nutzungsmessung.** Technik steht, Schalter ist standardmäßig aus – ohne Abfrage beim Einstieg kommen kaum Daten.
6. **Herz in 3D** und weitere organische Themen (Lunge, Nervenzelle): brauchen ein lizenziertes oder in Blender gebautes Modell.
7. **Aktuelle Nachrichten als Lernformat, Monetarisierung, Marketing-Automatisierung, Store-Builds:** noch nicht begonnen.
8. **E-Mail-Anmeldung** ist eingebaut, aber nie durchgespielt; Supabase-Site-URL muss auf die Vercel-Adresse zeigen.
9. **Community** ist weiterhin simuliert.

## Rückstand an Inhalten (Vorschläge in Reihenfolge)

- **3D-Animationen:** Stromkreis und Elektromotor in 3D · Transformator/elektromagnetische Induktion · Nervenzelle und Signalübertragung · Jahreszeiten (Erdachse) · Mondphasen · Flugzeugflügel und Auftrieb · Hebel und Flaschenzug · neuronales Netz in 3D.
- **Clips:** Foucaultsches Pendel (vorhandene Datei ließ sich nicht dekodieren – andere Quelle suchen) · Zellteilung im Mikroskop · Vulkanausbruch aus dem All · Gletscher im Zeitraffer · Schallwellen sichtbar gemacht · historische Aufnahmen zu Erfindungen.
- **Bücher:** je Buch auf fünf Ideen ausbauen; neue Titel aus Philosophie, Kommunikation und Naturwissenschaft (jeweils nur zwei bis drei Bücher bisher).
- **Fragen:** weitere Stapel in den neuen Formaten – sie sind bisher nur 24 von 555.

## Kosten

Bisher null: Vercel (Hobby), Supabase (Free), GitHub (kostenlos, inklusive automatischer Prüfung), alle Bibliotheken quelloffen, alle Medien frei lizenziert. Kein MCP und kein Bezahldienst ist nötig. Künftige Kosten: Apple-Entwicklerkonto (99 $/Jahr), Google-Play-Konto (25 $ einmalig), Markenrecherche und -anmeldung, eventuell Supabase Pro ab größerer Nutzung.
