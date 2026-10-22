# Benchmark, sinnvolle Ergänzungen und günstige Vermarktung (Stand 19.10.2026)

Kurzfassung: Wunder verbindet drei Dinge, die die Konkurrenz nur getrennt anbietet – einen kurzweiligen Feed
(wie TikTok/Nibble), echtes Üben mit Wiederholung (wie Duolingo/Brilliant) und Duelle mit Freunden
(wie Quizduell) – und hat als einziges davon **zu jedem Inhalt eine Quelle**. Was fehlt, sind vor allem
die Dinge, die Menschen *zurückholen* (Benachrichtigungen, Widget, Wochenliga) und die die App *von selbst
weitertragen* (teilbare Karten, Einladungen mit Belohnung). Beides ist günstig zu bauen. Bezahlt werden
sollte ein Abo „Wunder Plus“ unterhalb der Konkurrenzpreise; Werbung erst einmal nicht.

## 1. Wer macht was – und was kostet es

| App | Kern | Geld | Preis (Richtwert, USA/EU) |
|---|---|---|---|
| Duolingo | Sprachen (auch Mathe, Musik), Streaks, Ligen, Maskottchen | Freemium-Abo + Werbung | Q2 2026: 58,7 Mio. tägliche Nutzer, 12,7 Mio. Zahlende, 298,5 Mio. $ Umsatz im Quartal¹ |
| Brilliant | interaktive Mathe/Naturwissenschaft-Kurse | Abo, 7 Tage Test, 2 Lektionen/Tag gratis | ca. 25–28 $/Monat oder 120–162 $/Jahr (Quellen uneinig)² |
| Imprint | visuelle Kurzkurse zu Büchern/Ideen | Jahresabo | ca. 52 $ im 1. Jahr, danach ca. 100 $/Jahr³ |
| Headway | Buchzusammenfassungen (Text + Audio) | Abo in 4/12/24-Wochen-Paketen | ca. 20 $ / 4 Wochen³ |
| Nibble | Microlearning-Quizze und Kurzlektionen | Abo | ca. 50–100 $/Jahr (Angaben widersprechen sich)³ |
| Quizduell (MAG Interactive) | Quiz-Duelle gegen Freunde | Werbung + VIP-Abo | VIP laut Nutzerberichten 4,99 €/Monat; Videowerbung nach Runden⁴ |

Was man daraus lernt:
- **Wiederkommen schlägt Inhalt.** Duolingo wächst über Streaks, Ligen, Erinnerungen und ein Maskottchen – nicht über mehr Lektionen. Die Zahlen oben stammen aus dem Quartalsbericht.¹
- **Microlearning-Apps verlangen viel** (50–160 $/Jahr) und arbeiten fast alle mit Gratis-Test + Jahresabo.
- **Quizduell zeigt die Grenze von Werbung:** Unüberspringbare Videos nach jeder Runde sind der häufigste Ärger in Nutzerkommentaren.⁴
- **Lücke im Markt:** Keine dieser Apps belegt jede Aussage mit einer Quelle. Das ist Wunders klarstes Verkaufsargument („Wissen, dem man trauen kann“) – gerade in Zeiten von KI-Inhalten.

## 2. Wo Wunder heute steht

Stark: Feed mit 6 Formaten (Fragen, Fakten, Clips, 3D-Animationen, Buchideen, interaktive Grafiken),
Quellen überall, Wiederholung falscher Antworten, Duelle (auch gegen den Computer), Gruppen mit Chat,
lernender Feed ohne Datenweitergabe, Deutsch + Englisch, eigene Clips ohne Lizenzkosten.

Schwach im Vergleich: keine Benachrichtigungen, kein Widget, keine Wochenliga, kein Audio, kein Offline-Modus,
kein Teilen als Bild, keine strukturierten „Pfade“ (Kurse), keine Bezahlfunktion, Inhalte noch klein
(824 Fragen, 51 Clips, 74 Fakten, 26 Animationen) und nur „von KI geprüft“.

## 3. Sinnvolle Ergänzungen – nach Nutzen pro Aufwand

| # | Ergänzung | Warum | Aufwand | Laufende Kosten |
|---|---|---|---|---|
| 1 | **Teilbare Karten** (Fakt/Ergebnis als Bild mit App-Link, „Wusstest du?“) | jeder geteilte Fakt ist kostenlose Werbung | klein | 0 € |
| 2 | **Einladen mit Belohnung** (Freund kommt → beide 1 Monat Plus) | Duelle/Gruppen leben von Freunden | klein–mittel | 0 € |
| 3 | **Push-Benachrichtigungen** (Wiederholung fällig, Gegner hat gespielt, Gruppenrunde läuft) – sparsam, abschaltbar | wichtigster Rückhol-Hebel | mittel | 0 € (Firebase Cloud Messaging ist kostenlos) |
| 4 | **Widget „Fakt des Tages“** (Android/iOS) | täglicher Blick ohne App-Öffnen | mittel | 0 € |
| 5 | **Wochenliga** (Gruppen à 30, Auf-/Abstieg nach XP) | Duolingos stärkstes Motivationssystem | mittel | 0 € |
| 6 | **Lernpfade** („In 7 Tagen: Wie das Universum funktioniert“) aus vorhandenen Inhalten | Struktur, gutes Plus-Argument | mittel | 0 € |
| 7 | **„Dein Wunder-Jahr“** (Rückblick zum Teilen, à la Spotify Wrapped) | jährlicher Viral-Moment | klein | 0 € |
| 8 | **Vorlesen** über die Sprachausgabe des Geräts | Barrierefreiheit, Lernen unterwegs | klein | 0 € (keine kostenpflichtige Text-zu-Sprache) |
| 9 | **Offline-Modus** (Feed vorladen) | Pendeln, Flugzeug; Plus-Funktion | mittel | 0 € |
| 10 | **Weitere Sprachen** (Spanisch, Französisch) | größerer Markt | groß (Inhalte übersetzen + prüfen) | 0 € bei eigener Übersetzung |
| später | Schul-/Lehrermodus, Kinderbereich | großer Markt, aber Elterneinwilligung und Datenschutz für Kinder nötig | groß | – |
| später | KI-Erklärungen („Warum?“-Nachfrage) | spannend, aber laufende API-Kosten – nur mit deiner Freigabe | mittel | pro Nutzung |

## 4. Geld verdienen

**Empfehlung: Freemium mit „Wunder Plus“, vorerst ohne Werbung.**
- Gratis bleibt: der ganze Feed, Quiz, Wiederholung, Duelle, Gruppen – die App muss auch ohne Abo begeistern, sonst teilt sie niemand.
- Plus (Vorschlag): **4,99 € im Monat oder 34,99 € im Jahr**, 7 Tage gratis testen. Enthält: Lernpfade, Offline-Modus, Vorlesen ohne Begrenzung, ausführliche Statistik, unbegrenzt Computer-Duelle, eigene Gruppen-Themen, später Wunder-Jahr in Vollversion. Damit liegt Wunder deutlich unter Brilliant, Imprint und Nibble und auf Höhe von Quizduell-VIP.
- Store-Gebühren: Apple nimmt im Small Business Program (bis 1 Mio. $ Umsatz) 15 %, Abos ab dem 2. Jahr ohnehin 15 %; bei Google sind es für Abos 15 % oder weniger (eine Senkung auf 10 % ab Mitte 2026 wird berichtet, ist aber nicht offiziell bestätigt).⁵
- Zusätzlich: die schon vorbereiteten Affiliate-Links zu Büchern (nur für Erwachsene, gekennzeichnet).
- **Keine Werbung jetzt**: schlechtere Erfahrung, Einwilligungs-Banner nötig, und bei Jugendlichen rechtlich heikel. Kann man später für Nicht-Abonnenten prüfen.

**Laufende Kosten bei Wachstum** (Richtwerte von Drittanbieter-Seiten, vor dem Budget auf den offiziellen Preisseiten prüfen):⁶
- Supabase Pro: 25 $/Monat, 100.000 monatlich aktive Nutzer inklusive; realistisch 35–75 $/Monat für eine kleine bis mittlere App.
- Vercel Pro: 20 $ pro Person und Monat, 1 TB Datenverkehr inklusive. Videos sind der größte Posten – bei vielen Nutzern lohnt ein günstiger Video-Speicher.
- Stores: Apple 99 $/Jahr, Google 25 $ einmalig.
- → Die App trägt sich schon mit **wenigen Dutzend Abonnenten**.

## 5. Günstig vermarkten – was fast nichts kostet

1. **Die eigenen Clips auf TikTok, Instagram Reels und YouTube Shorts posten.** Sie sind schon fertig, ohne Gesicht, ohne Lizenzfragen, und enden mit der Quizfrage („Weißt du's? Antwort in der App“). Duolingo hat laut eigenem Bericht in sechs Monaten fast 3 Mio. TikTok-Follower und über 500 Mio. Aufrufe erreicht – bei nahezu null Werbebudget, mit einer wiedererkennbaren Figur und Tempo bei Trends.⁷ Für Wunder: 1 Clip pro Tag, gleiches Format, gleiche Stimme/Figur.
2. **Eingebaute Weiterverbreitung**: Duell-Einladungen (gibt es schon), teilbare Karten, Einladen mit Belohnung (siehe Ergänzungen 1 und 2) – das ist Quizduells Wachstumsweg.
3. **App-Store-Optimierung**: Titel/Untertitel mit Suchbegriffen („Allgemeinwissen“, „Quiz“, „Wissen in 5 Minuten“), Screenshots mit Feed + Duell + Quelle, kurzes Vorschauvideo aus den eigenen Clips.
4. **„Wie hast du von uns gehört?“** als freiwillige Frage im Einstieg – so misst Duolingo, welcher Kanal wirkt, ganz ohne Tracker.⁷
5. **Presse und Communities**: Geschichte „Lern-App, die jede Aussage belegt“ für Tech-/Bildungsredaktionen, Product Hunt, Reddit (r/de, r/todayilearned – nur mit echtem Mehrwert, keine Werbung).
6. **Kleine Creator** (Wissens-Kanäle mit 10–100 Tsd. Followern) erst, wenn die Zahlen aus 1–4 stimmen – das kostet Geld und braucht deine Freigabe.
7. **Gruppen als Hebel**: Vereine, Lerngruppen, Freundeskreise – ein Gruppen-Code auf einem Plakat oder in einer WhatsApp-Gruppe bringt gleich mehrere Nutzer.

Wichtig: Bei allen Profilen gelten Impressum und Kennzeichnung (eigene Inhalte = eigene Werbung, das ist erlaubt; bezahlte Creator-Posts müssen als Werbung markiert sein).

## 6. Vorschlag für die Reihenfolge

1. Vor dem Start: rechtliche Punkte aus `docs/LEGAL.md`, Teilbare Karten, „Wie hast du von uns gehört?“, Store-Texte/Screenshots.
2. Zum Start: Push-Benachrichtigungen, Einladen mit Belohnung, täglich Clips posten.
3. Nach dem Start: Wunder Plus (Lernpfade, Offline, Vorlesen), Widget, Wochenliga.
4. Später: weitere Sprachen, Schulen, KI-Funktionen (nur mit Kostenfreigabe).

## 7. Nachtrag: Vergleich mit Deepstash (Stand 22.10.2026)

Deepstash (Brainstash, Inc.) ist der nächste Verwandte von Wunder: ein Feed mit kurzen „Ideen“-Karten statt Doomscrolling.

| | Deepstash | Wunder |
|---|---|---|
| Inhalt | „200.000+ Ideen“ aus Büchern, Artikeln, Podcasts, Videos – von Nutzern zusammengefasst⁸ | rund 850 Fragen, 109 Fakten, 71 Clips, 31 Tagesereignisse – von der Redaktion, jede Aussage mit Zitat aus der Quelle |
| Lernen | Lesen und Sammeln („Stashes“), kaum aktives Üben⁹ | Quiz, Mythos-oder-Wahrheit, Wiederholung falscher Antworten, Duelle |
| Formate | Textkarten, Vorlesen (Audio), Buch-Zusammenfassungen⁸ | Fragen, Fakten, eigene Clips, 3D-Animationen, Grafiken, Serien, „Heute vor … Jahren“ |
| Gemeinschaft | anderen folgen, Sammlungen teilen⁹ | Duelle; Gruppen und Chat gebaut, aber noch aus |
| Reichweite | „10M+“ Downloads (eigene Angabe)⁸; US-App-Store 4,7 bei 49.782 Bewertungen, DE 4,5 bei 2.016 (Stand Juni/Juli 2026)¹⁰ | noch nicht veröffentlicht |
| Geld | Gratis mit Werbung; Pro ohne Werbung, unbegrenztes Speichern, offline, Vorlesen – ca. 13 $/Monat, Jahresabo je nach Region/Aktion ca. 50–120 $ (Drittquellen, uneinheitlich)⁹ | noch keine Einnahmen |
| Kritik | Qualität schwankt (Nutzer schreiben die Karten), passives Lesen, Gratisversion stark eingeschränkt⁹ | – |

Was Wunder daraus mitnehmen kann – nach Nutzen pro Aufwand:
1. **Positionierung schärfen:** Deepstash wirbt mit „statt Doomscrolling“. Wunder kann dasselbe Versprechen geben und es
   übertreffen: *„Statt Doomscrolling – Wissen mit Quelle, das hängen bleibt.“* (Quellen + Quiz sind genau Deepstashs Schwächen.)
2. **Vorlesen:** Deepstash bietet Audio. Wunder könnte Fakten und Erklärungen mit der eingebauten Sprachausgabe des Geräts
   vorlesen (Web Speech API) – ohne Kosten, ohne Server, auf Deutsch und Englisch. Ein Nachmittag Arbeit.
3. **Eigene Sammlungen:** Wunder hat „Merken“, aber nur eine Liste. Sammlungen mit Namen („Für die Party“, „Weltraum“) wären der
   Deepstash-Kern in klein – lokal gespeichert, kein Datenschutzthema.
4. **Menge ohne Qualitätsverlust:** Deepstash wächst über Nutzerinhalte und kämpft mit schwankender Qualität. Wunder wächst
   lieber langsamer über die geprüfte Routine; Nutzer helfen über „Hinweis an die Redaktion“. Nutzerinhalte erst, wenn es
   eine Moderation gibt.
5. **Bücher:** Deepstashs Herzstück sind Buchideen. Für Wunder gilt weiter: eigene Worte, keine Auszüge, keine Verlagscover
   (siehe `docs/LEGAL.md`). Daran nichts ändern – das Risiko trägt sonst der Betreiber.
6. **Preis später:** Deepstash zeigt, dass Werbung + Pro-Abo funktioniert, aber die Gratisversion wird als zu knapp kritisiert.
   Für „Wunder Plus“ (Abschnitt 4) gilt: Lernen bleibt gratis, Plus bringt Komfort (offline, Vorlesen, Sammlungen, Statistik).

## Quellen

1. Duolingo, Quartalsbericht Q2 2026 (Form 10-Q / Shareholder Letter): https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053603/duol-20260630.htm und https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm
2. Brilliant-Preise (Drittanbieter, uneinheitlich): https://nibble-app.com/blog/is-brilliant-free, https://subger.com/en/service/brilliant; offizielle Hilfe ohne Zahlen: https://brilliant.org/help/pricing-and-plans/how-much-does-brilliant-premium-cost/
3. Imprint/Headway/Nibble (Quelle ist Nibbles eigener Blog – mit Vorsicht): https://nibble-app.com/blog/imprint-review, https://nibble-app.com/blog/headway-cost, https://nibble-app.com/blog/how-much-is-nibble-app
4. Quizduell (ältere Quellen, Nutzerberichte): https://www.appgefahren.de/neues-quizduell-abgesang-auf-ein-populaeres-wissensquiz-293772.html, https://www.heise.de/download/product/quizduell-93847
5. Store-Gebühren (Drittanbieter): https://www.revenuecat.com/blog/engineering/small-business-program, https://appbot.co/blog/app-developers-apple-google-small-business-programs/
6. Supabase/Vercel (Drittanbieter): https://makerkit.dev/blog/md/saas/supabase-pricing, https://makerkit.dev/blog/saas/vercel-cost
7. Duolingo-Marketing: Shareholder Letter Q4 2021 https://www.sec.gov/Archives/edgar/data/1562088/000156208822000033/duolingo_q4-2021xshareho.htm, Adweek https://www.adweek.com/brand-marketing/duolingo-duo-owl-marketing-strategy/

8. Deepstash, eigene Website: https://deepstash.com/ und App Store: https://apps.apple.com/app/id1445023295
9. Deepstash-Funktionen und -Preise (Konkurrenz-Blogs, mit Vorsicht): https://nibble-app.com/blog/deepstash-review, https://nibble-app.com/blog/is-deepstash-worth-it, https://makeheadway.com/blog/deepstash-cost/
10. App-Store-Bewertungen (AppFollow-Momentaufnahmen): https://apps.appfollow.io/ios/deepstash-smarter-every-day/1445023295?country=us, https://apps.appfollow.io/ios/deepstash-smarter-every-day/1445023295?country=de

Preise und Gebühren ändern sich und sind teils nur aus Drittquellen; vor Entscheidungen bitte die offiziellen Seiten prüfen.
