# Stand, offene Punkte und was als Nächstes kommt (14.10.2026)

## Was veröffentlicht ist

| Inhalt | Anzahl | Status |
|---|---|---|
| Fragekarten im Feed | 587 (davon 76 „Stimmt das?“, 24 neue Formate) | alle „von KI geprüft“, keine „redaktionell geprüft“ |
| Video-Quizfragen | 44 | zweiter Versuch mit Hinweis, halbe Punkte |
| Clips | 38 veröffentlicht, 6 archiviert | frei lizenziert, Quelle und Urheber je Clip, Nachweise unter `/legal/` |
| Animationen | 20 (19 in 3D, Herz gezeichnet) | je eine Vorhersagefrage, Tempo 0,75×/1×/1,5×, Zoom |
| Interaktive Visualisierungen | 5 (Zinseszins, Planeten, Angebot und Nachfrage, Schall, Technik-Zeitleiste) | 3 mit echten Daten, 2 Rechenmodelle; auch im Feed |
| Bücher | 20 mit 60 Lektionen | Abruf, Wiederholung, Beleg-Stufe je Idee |
| Themen | 10 | |

Karten je Thema (Feed): Wissenschaft 98, Technologie & KI 71, Erde & Natur 69, Geschichte 67, Kultur & Gesellschaft 67, Mathe & Logik 54, Wirtschaft & Geld 49, Sprache 45, Business 43, Sport 24.

## Ziele aus den Aufträgen

| Ziel | Stand | Bemerkung |
|---|---|---|
| 1.000 Quizfragen | 631 | rund 150 pro Stapel sind in guter Qualität machbar |
| 100 Kurzvideos | 38 | Engpass ist das Sichten freier Quellen, nicht die Technik |
| 50 Animationen | 20 | jede 3D-Szene ist Handarbeit im Code |
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

1. **Store-Fassung mit Capacitor.** Die App ist eine statische Web-App und lässt sich ohne Umbau in eine Android- und iOS-Hülle packen. Ich kann das Projekt einrichten; zum Bauen braucht es Android Studio (kostenlos) und für iOS einen Mac. Mittlerer Aufwand, Voraussetzung für die Stores.
2. **Prüfbildschirm für alle Inhalte.** Kein Inhalt ist von einem Menschen freigegeben. Der Bildschirm zeigt heute Fragen und Clips; Bücher, Animationen und Visualisierungen fehlen, weil sie als Dateien in der App liegen. Eine Prüfliste mit „freigegeben / ändern“ für alles würde dir die Freigabe stark erleichtern. Mittlerer Aufwand, wichtigster Qualitätshebel.
3. **Einwilligung zur Nutzungsstatistik im Einstieg anbieten.** Der Schalter ist aus und versteckt – ohne Daten lässt sich nach dem Start nicht erkennen, was wirkt. Kleiner Aufwand, rechtlich sauber, wenn freiwillig und abwählbar.
4. **E-Mail-Anmeldung einmal durchspielen** (nach der Site-URL-Einstellung). Klein.

### 3. Inhalte, die Lernende zurückbringen

1. **Fragen auf 1.000** – vor allem Sport (24), Business (43), Sprache (45) und mehr der neuen Formate (nur 24). Zwei bis drei Stapel.
2. **Bücher auf fünf Ideen je Buch** (40 neue Lektionen) – die Bücher sind das Format mit der tiefsten Lernwirkung.
3. **Weitere Visualisierungen** aus den vorhandenen fünf Typen (nur Daten, kein Code) und zwei neue Typen: Kreis-/Anteilsdiagramm und Wahrscheinlichkeits-Experiment.
4. **Clips** – der langsamste Weg (Sichtung freier Quellen); sinnvoll in kleinen Paketen.

### 4. Später

Aktuelle Nachrichten als Lernformat, Bezahlmodell, Marketing-Automatisierung, echte Community (braucht Moderation und Meldewege nach dem Digital Services Act), Bereich für Jüngere (braucht Einwilligung der Eltern), Herz und andere organische 3D-Modelle (brauchen lizenzierte Modelle).

## Bekannte Schwächen

- Kein Inhalt ist redaktionell geprüft.
- Getestet auf einem Windows-PC (Edge) und einem Handy des Betreibers (Animationen „flüssig“); Safari auf dem iPhone und ältere Android-Geräte nicht.
- In den Erdplatten ist im Blick von oben ein kleiner grauer Keil zu sehen, der nicht zugeordnet ist.
- `scripts/measure-animations.mjs` bricht ab, wenn man mehrere Animationen nacheinander misst; einzeln läuft es (Bildraten der letzten drei: 57–58 pro Sekunde).
- Einige Animationsfragen haben in der Datenbank ein Erstelldatum bis 21.10.2026 (gelten ein paar Tage länger als „neu“).

## Kosten

Bisher null: Vercel (Hobby), Supabase (Free), GitHub (kostenlos, inklusive automatischer Prüfung), alle Bibliotheken quelloffen, alle Medien frei lizenziert. Künftig: Apple-Entwicklerkonto (99 $/Jahr), Google-Play-Konto (25 $ einmalig), Markenrecherche und -anmeldung, eventuell Supabase Pro ab größerer Nutzung.
