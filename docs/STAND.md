# Stand, offene Punkte und was als Nächstes kommt (19.10.2026)

## Was veröffentlicht ist

| Inhalt | Anzahl | Status |
|---|---|---|
| Fragekarten im Feed | 766 (davon 84 „Stimmt das?“, 49 neue Formate, 51 Rätsel mit Tipps) | alle „von KI geprüft“, keine „redaktionell geprüft“ |
| Video-Quizfragen | 56 | zweiter Versuch mit Hinweis, halbe Punkte |
| Clips | 50 veröffentlicht (45 fremde, 5 eigene), 6 archiviert | fremde frei lizenziert mit Quelle und Urheber je Clip (`/legal/`); eigene mit Remotion gerendert (`video/`), je Sprache eine Datei |
| Animationen | 26 (alle in 3D; Herz seit 18.10.2026 neu) | je eine Vorhersagefrage, Tempo 0,75×/1×/1,5×, Zoom |
| Interaktive Visualisierungen | 6 (Zinseszins, Planeten, Angebot und Nachfrage, Schall, Technik-Zeitleiste, Schrift-Zeitleiste) | 4 mit echten Daten, 2 Rechenmodelle; auch im Feed |
| Bücher | 20 mit 60 Lektionen | Abruf, Wiederholung, Beleg-Stufe je Idee; Copyright am 15.10.2026 erneut geprüft; Affiliate-Link vorbereitet (aus, bis ein Partner-Tag eingetragen ist) |
| Fakten („Wusstest du?“) | 58 aus 13 Bereichen | im Feed und unter Entdecken → Fakten, je mit Quelle |
| Themen | 10 | |
| Duelle | drei Runden à drei Fragen, gegen Freunde (Link/Code), Zufallsgegner oder den Computer (drei Stufen); im Demo-Modus gegen einen Übungsgegner | Regeln, Zeitlimit und Antworten auf dem Server; Melden und Sperren eingebaut |
| Gruppen und Chat | Gruppen per Code, Gruppenrunden (6 Fragen, 3 Tage, Rangliste); Chat in Duellen und Gruppen nur ab 16 | Filter, Melden, Blockieren, Prüfbildschirm, Löschung nach 90 Tagen; Nutzungsbedingungen und Meldestelle fehlen noch (`docs/LEGAL.md` Punkt 4) |

Karten je Thema (Feed): Wissenschaft 105, Kultur & Gesellschaft 83, Technologie & KI 78, Sprache 77, Erde & Natur 75, Business 74, Mathe & Logik 74, Geschichte 70, Wirtschaft & Geld 69, Sport 61.

## Ziele aus den Aufträgen

| Ziel | Stand | Bemerkung |
|---|---|---|
| 1.000 Quizfragen | 823 | rund 150 pro Stapel sind in guter Qualität machbar |
| 100 Kurzvideos | 50 | seit 15.10.2026 auch eigene Clips mit Remotion – unabhängig von freien Quellen, je Clip etwa so viel Handarbeit wie eine kleine Animation |
| 50 Animationen | 26 | jede 3D-Szene ist Handarbeit im Code |
| rund 20 Bücher | 20 | je drei Ideen; fünf je Buch wären der nächste Ausbau |
| 200 Aufgaben für unter 6-Jährige | 0 | zurückgestellt; die App ist nur ab 16 freigegeben |

## Bewertung: Was als Nächstes kommt

Maßstab: Was verhindert eine Veröffentlichung in den Stores, was bringt Lernende zurück, was kostet wie viel Aufwand. Die App ist inhaltlich und technisch weit genug für einen ersten öffentlichen Start – es fehlen vor allem Dinge, die nicht im Code liegen.

### 1. Ohne diese Punkte keine Veröffentlichung (nur du oder eine Kanzlei)

| Punkt | Warum | Aufwand |
|---|---|---|
| Impressum und Datenschutzerklärung | gesetzlich vorgeschrieben, die Stores verlangen eine Datenschutz-Adresse; braucht Name und Anschrift des Betreibers | ein Nachmittag mit einem Generator oder einer Kanzlei; einbauen kann ich danach in Minuten |
| Verträge zur Auftragsverarbeitung mit Vercel und Supabase | DSGVO | beide bieten sie im Konto zum Unterschreiben an |
| Markenname | „Wunder“ ist nur vorgeprüft; ein Streit nach dem Start ist teuer | Kanzlei-Recherche (`docs/BRAND.md`) |
| Entwicklerkonten | Apple 99 $/Jahr, Google 25 $ einmalig | Anmeldung durch dich |
| Supabase-Einstellung „Site URL“ | sonst funktionieren Anmelde-Links per E-Mail nicht | eine Einstellung im Dashboard |

### 2. Technisch als Nächstes (kann ich machen)

1. ~~Store-Fassung mit Capacitor~~ – Android eingerichtet am 14.10.2026 (`docs/STORE.md`): GitHub baut bei jedem Push eine Testversion und startet sie im Emulator. Offen: Upload-Schlüssel, Play-Konto, iOS (braucht Apple-Konto und Mac oder macOS-Bau).
2. ~~Prüfbildschirm für alle Inhalte~~ – erledigt am 14.10.2026 (`/admin/`, siehe `docs/BACKEND.md` Abschnitt 30). Offen ist die Prüfung selbst: rund 765 Fragen und Clips sowie 48 Bücher, Animationen und Visualisierungen.
3. ~~Einwilligung zur Nutzungsstatistik im Einstieg~~ – erledigt am 19.10.2026 (freiwilliger Schalter im letzten Schritt, ausgeschaltet voreingestellt).
4. **E-Mail-Anmeldung einmal durchspielen** (nach Site-URL und E-Mail-Vorlage mit Code, siehe `docs/STORE.md`). Klein.
5. ~~Duell fertig machen~~ – erledigt am 19.10.2026: Zeitlimit auf dem Server, Namensfilter, Meldungen im Prüfbildschirm.
6. ~~Anmeldung in der Android-App~~ – per Code aus der E-Mail (braucht die angepasste E-Mail-Vorlage).
7. ~~Computer-Gegner, Gruppen, Chat~~ – erledigt am 19.10.2026 (`docs/BACKEND.md` Abschnitt 40). Offen: einmal live mit zwei Testkonten durchspielen (braucht deine Zustimmung, weil dabei Gastkonten entstehen); Push-Benachrichtigungen bei neuen Nachrichten (bisher nur, solange die Seite offen ist).

### 3. Inhalte, die Lernende zurückbringen

1. **Fragen auf 1.000** – am 15.10.2026 kamen 25 Rätsel und 57 Karten für Sport, Business, Sprache und Wirtschaft dazu. Danach eine zweite Runde mit 14 Rätseln und 26 Karten für Wirtschaft und Sport. In einer dritten Runde kamen Business, Kultur und Sprache dazu; am dünnsten sind jetzt Sport (61), Wirtschaft (69) und Geschichte (70).
2. **Bücher auf fünf Ideen je Buch** (40 neue Lektionen) – die Bücher sind das Format mit der tiefsten Lernwirkung.
3. **Weitere Visualisierungen** aus den vorhandenen fünf Typen (nur Daten, kein Code) und zwei neue Typen: Kreis-/Anteilsdiagramm und Wahrscheinlichkeits-Experiment.
4. **Clips** – der langsamste Weg (Sichtung freier Quellen); sinnvoll in kleinen Paketen.

### 4. Später

Aktuelle Nachrichten als Lernformat, Bezahlmodell, Marketing-Automatisierung, Freundesliste und Profile anderer (brauchen weitere Moderation), Bereich für Jüngere (braucht Einwilligung der Eltern), Herz und andere organische 3D-Modelle (brauchen lizenzierte Modelle).

Ideen aus Hinweisen der App:
- Animation „Photosynthese“ (a-photosynthese): Das Blatt wirkt „komisch“ (Hinweis #26, 26.10.2026) – die Mittelrippe läuft als gerade Linie über das ganze Blatt hinaus; ein Blattstiel nur auf einer Seite und eine leicht gewölbte Blattform wären natürlicher.

## Vorschlag: Zeitplan bis zur Veröffentlichung (Stand 19.10.2026)

Ohne feste Frist, aber in einer sinnvollen Reihenfolge – die Wochen sind Richtwerte, keine Zusagen:

| Phase | Was | Wer | Dauer |
|---|---|---|---|
| 1. Rechtliches | Impressum und Datenschutzerklärung, Verträge zur Auftragsverarbeitung (Vercel, Supabase), kurze Nutzungsbedingungen mit Meldeadresse, Markenrecherche für den Namen | du / Kanzlei | 2–4 Wochen, läuft parallel |
| 2. Inhalte prüfen | zuerst „Einordnung und Kritik“ der Bücher, dann die meistgesehenen Fragen und Clips im Prüfbildschirm | du oder eine Hilfskraft | 2–3 Wochen, ein paar Stunden pro Woche |
| 3. Einstellungen | Supabase Site URL und E-Mail-Vorlage mit Code; E-Mail-Anmeldung einmal durchspielen | du (10 Minuten), dann ich | 1 Tag |
| 4. Geschlossener Test | Google-Play-Konto (25 $), Upload-Schlüssel, Testgruppe mit mindestens 12 Personen für 14 Tage (Pflicht bei neuen Play-Konten); Rückmeldungen einarbeiten | du + ich | 3 Wochen |
| 5. Start Android | Store-Eintrag (Texte, Screenshots, Datenschutz-Formular), Veröffentlichung | du + ich | 1 Woche |
| 6. iOS | Apple-Entwicklerkonto (99 $/Jahr), Bau über einen Mac oder macOS in GitHub, TestFlight, Prüfung durch Apple | du + ich | 2–4 Wochen danach |

Realistisch also: Android etwa **6–8 Wochen** nach dem Start von Phase 1, iOS einige Wochen später. Inhalte (Fragen, Fakten, Animationen, Clips) baue ich währenddessen weiter aus.

## Bekannte Schwächen

- Kein Inhalt ist redaktionell geprüft.
- **Duelle:** Am 15.10.2026 mit zwei Gast-Testkonten auf der Live-Seite durchgespielt (Einladung per Link, drei Runden, Ergebnis auf beiden Seiten gleich, Zufallsgegner, Melden, Revanche danach gesperrt); die Testkonten wurden über die App gelöscht. Nach dem Löschen legt die App sofort ein neues, leeres Gastkonto an – die leeren Testkonten (2 vom 15.10., 6 vom 19.10.) wurden am 19.10.2026 mit Zustimmung des Betreibers per SQL gelöscht. Live-Test von Gruppen, Chat und Computer-Duell am 19.10.2026 bestanden (`docs/BACKEND.md` Abschnitt 40). Seit 19.10.2026 zählt der Server die 20 Sekunden (Neuladen bringt keine neue Zeit), und Meldungen stehen im Prüfbildschirm.
- Getestet auf einem Windows-PC (Edge) und einem Handy des Betreibers (Animationen „flüssig“); Safari auf dem iPhone und ältere Android-Geräte nicht.
- In den Erdplatten ist im Blick von oben ein kleiner grauer Keil zu sehen, der nicht zugeordnet ist.
- `scripts/measure-animations.mjs` bricht ab, wenn man mehrere Animationen nacheinander misst; einzeln läuft es (Bildraten der letzten drei: 57–58 pro Sekunde).
- Einige Animationsfragen haben in der Datenbank ein Erstelldatum bis 21.10.2026 (gelten ein paar Tage länger als „neu“).

## Kosten

Bisher null: Vercel (Hobby), Supabase (Free), GitHub (kostenlos, inklusive automatischer Prüfung), alle Bibliotheken quelloffen, alle Medien frei lizenziert. Künftig: Apple-Entwicklerkonto (99 $/Jahr), Google-Play-Konto (25 $ einmalig), Markenrecherche und -anmeldung, eventuell Supabase Pro ab größerer Nutzung.
