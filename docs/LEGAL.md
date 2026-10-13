# Rechtliches für eine weltweite Veröffentlichung (Stand 18.10.2026)

Das ist eine technische Bestandsaufnahme, **keine Rechtsberatung**. Vor dem Start in den App-Stores sollte eine Kanzlei die Punkte unter „Offen“ prüfen.

## Was in der App rechtlich sauber gelöst ist

| Thema | Stand |
|---|---|
| Clips | Nur gemeinfrei, CC0, CC BY oder CC BY-SA. Urheber, Lizenz, Quelle und der Hinweis „bearbeitet“ stehen je Clip im Datensatz, im Feed und – mit Link zum Lizenztext und zum Original – auf `/legal/`. Bearbeitete CC-BY-SA-Clips stehen unter derselben Lizenz (steht dort). |
| Buchcover | **Keine Verlagscover.** Cover sind urheberrechtlich geschützt; dass eine Buch-Schnittstelle (Open Library, Google Books) sie ausliefert, räumt kein Recht ein, sie in einer eigenen kommerziellen App zu zeigen. Eine pauschale Ausnahme gibt es in der EU nicht, „Fair Use“ gilt nur in den USA und ist auch dort eine Einzelfallfrage. Die App zeigt eigene typografische Einbände. |
| Buchinhalte | Eigene Zusammenfassungen in eigenen Worten, keine Auszüge, keine Zitate. Ideen und Fakten sind nicht geschützt, wohl aber Formulierungen und der Aufbau eines Buchs – deshalb je Buch nur drei Ideen, eigene Beispiele, eigene Einordnung. Titel und Autorennamen dienen der Benennung. Hinweis „keine Verbindung zu Autoren und Verlagen“ auf `/legal/`. |
| Fragen und Erklärungen | Eigene Texte; Wikipedia ist als Nachweis verlinkt, es wurde kein Wikipedia-Text übernommen. |
| Animationen | Vollständig eigener Programmcode, keine fremden Modelle. |
| Software | Nur freie Lizenzen (MIT, ISC, SIL OFL), aufgeführt auf `/legal/`. |
| Daten | Anonymes Konto, kein Name, keine E-Mail nötig; Nutzungsstatistik nur mit Einwilligung und nie für Kinderkonten; Konto-Löschung in der App; Zugriff je Tabelle auf die eigenen Zeilen beschränkt; Datenbank in Frankfurt (EU). |
| Kinder | Altersstufe wird abgefragt; unter 16 keine E-Mail-Anmeldung; unter 13 keine Nutzungsereignisse. Der Bereich für unter 6-Jährige ist bewusst zurückgestellt. |

## Offen – braucht dich oder eine Kanzlei

1. **Impressum** (Deutschland: § 5 DDG) und **Datenschutzerklärung** (DSGVO Art. 13): Beides braucht Name und Anschrift des Betreibers – das kann ich nicht erfinden. `/legal/` beschreibt, was die App tut, ersetzt die beiden Texte aber nicht. Die Stores verlangen außerdem eine öffentlich erreichbare Datenschutz-Adresse.
2. **Auftragsverarbeitung:** Verträge (DPA) mit Vercel und Supabase abschließen; beide bieten sie im Konto an. Vercel liefert auch aus den USA aus – in der Datenschutzerklärung nennen.
3. **Kinder unter 13 (USA: COPPA) und unter 16 (EU: Art. 8 DSGVO):** Auch ein anonymes Konto mit Lernstand ist ein personenbezogenes Datum. Solange die App Kinderaltersstufen anbietet, braucht sie entweder eine Einwilligung der Eltern oder einen Modus ohne Konto für diese Altersstufen. Einfachster Weg bis zur Klärung: App ab 13 bzw. 16 einstufen und die Kinderstufen ausblenden. Für Apples „Kids“-Kategorie und Googles „Designed for Families“ gelten zusätzliche Regeln.
4. **Nutzungsbedingungen**, sobald es Bezahlfunktionen oder echte Community-Beiträge gibt (dann auch Meldewege nach dem Digital Services Act).
5. **Markenname:** „Wunder“ ist nur vorgeprüft (`docs/BRAND.md`); vor dem Store-Eintrag Markenrecherche.
6. **Buchtitel:** Die Nennung ist üblich und zulässig, aber Titel und Autorennamen dürfen nicht als Werbung mit fremdem Namen wirken – keine Store-Screenshots, die nur mit bekannten Buchtiteln werben.
7. **Menschliche Prüfung:** Alle Inhalte sind „von KI geprüft“. Falsche Tatsachenbehauptungen über lebende Autoren wären ein Haftungsrisiko; die Abschnitte „Einordnung und Kritik“ sollten als Erste redaktionell geprüft werden.
8. **Echte Buchcover**, falls gewünscht: nur mit Lizenz – direkt vom Verlag, über einen Partnervertrag (z. B. Buchhandels-Partnerprogramme erlauben Cover meist nur zusammen mit einem Kauf-Link und nur nach deren Regeln) oder für gemeinfreie Ausgaben. Die App ist darauf vorbereitet: `BookCover` ist die einzige Stelle, an der ein Bild eingesetzt würde.
