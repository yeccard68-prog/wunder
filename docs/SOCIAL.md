# Social-Media-Paket: so geht's (Stand 21.10.2026)

Ziel: mit fast null Budget testen, ob die App ankommt. Inhalte sind fertig, dein Aufwand: ca. 5 Minuten pro Tag.

## Was es gibt

- **6 Videos** (`video/out/social/de/clips/`): die eigenen Clips (10 s) plus 3 s Schlussbild mit der Quizfrage,
  „Antwort in der App“ und dem Link. Hochformat 720×1280, ohne Ton (Musik kannst du in TikTok/Instagram
  selbst aus deren freigegebener Bibliothek wählen).
- **24 Bildposts** (`video/out/social/de/facts/`): „Wusstest du?“-Fakten, 1080×1350, jeweils mit Quelle.
- **„An diesem Tag“-Videos** (`video/out/social/de/days/`, seit 22.10.2026): 8 s, je ein geprüftes Ereignis aus der
  Geschichte des Kalendertags, mit fertigem Text in `days.md`. Erzeugen: `npm --prefix video run days` (nächste 14 Tage).
  Ideal für einen täglichen Post am jeweiligen Tag.
- **30-Tage-Plan mit fertigen Texten und Hashtags:** `docs/SOCIAL-PLAN.de.md` (Video alle fünf Tage, Bilder dazwischen).
- Neu erzeugen (z. B. wenn neue Clips oder Fakten dazukommen): `npm --prefix video run social`
  (Englisch: `npm --prefix video run social -- en`). Alles wird auf deinem Rechner gerendert, ohne Kosten.

## Einmalig einrichten (du)

1. Konten auf **TikTok**, **Instagram** und **YouTube** (für Shorts) anlegen – am besten mit dem App-Namen.
   Bei Instagram und TikTok auf ein kostenloses Creator-/Business-Konto umstellen, dann siehst du Statistiken.
2. **Impressum im Profil:** Profile, die für eine App werben, brauchen in Deutschland ein Impressum – mindestens
   ein Link „Impressum“ in der Profilbeschreibung, der auf das Impressum der App führt. Deshalb erst posten,
   wenn Impressum und Datenschutzerklärung stehen (siehe `docs/LEGAL.md`).
3. Link zur App in die Profilbeschreibung: `wunder-one.vercel.app` (später der Store-Link).

## Täglich (5 Minuten)

1. Datei aus dem Plan des Tages hochladen, Text aus dem Plan einfügen.
2. Gleiche Datei auf allen drei Plattformen (TikTok, Reels, Shorts) – Bilder als Foto-Post bzw. bei TikTok im Fotomodus.
3. Auf Kommentare antworten (besonders auf Antworten zur Quizfrage) – das bringt Reichweite.

## Messen

- Im Prüfbildschirm: **„Wie Spieler von uns gehört haben“** (Herkunftsfrage im Einstieg) und die **Übersicht**
  (aktive und neue Spieler pro Tag). Nach 2–3 Wochen siehst du, welcher Kanal wirkt.
- In den Plattform-Statistiken: welche Posts gespeichert und geteilt werden – mehr davon.

## Regeln

- Nur eigene Inhalte posten (die Clips sind eigene Produktionen, die Fakten eigene Texte mit Quelle). Keine Clips
  anderer Urheber aus der App – deren Lizenzen erlauben Werbung oft nicht ohne Weiteres.
- Keine bezahlten Kooperationen ohne Kennzeichnung „Werbung“; bezahlte Werbung erst nach deiner Freigabe.
- „Kostenlos“ ist wahr; „ohne Werbung“ steht bewusst nicht drauf, weil später Affiliate-Links kommen können.
