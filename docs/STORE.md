# Store-Fassung (Stand 14.10.2026)

## Wie die App in die Stores kommt

Die Website ist ein statischer Export (`out/`). **Capacitor** (Version 8.5.2, quelloffen, kostenlos) packt genau diese Dateien in eine native Android- bzw. iOS-Hülle – es gibt nur eine Codebasis. Clips und Inhalte liegen in der App selbst (rund 61 MB), die Datenbank ist dieselbe wie bei der Website.

| Teil | Datei |
|---|---|
| Einstellungen (App-Kennung, Name, Ränder) | `capacitor.config.ts` |
| Android-Projekt | `android/` (von `npx cap add android` erzeugt; die Web-Dateien darin werden nicht eingecheckt) |
| App-Symbole, Startbildschirm, Store-Symbol | `scripts/app/icons.mjs` erzeugt sie aus `public/icon.svg` → `android/app/src/main/res/…`, `store/icon-512.png` |
| Verhalten nur in der App | `lib/native.ts`: Zurück-Taste (schließt erst offene Fenster, geht dann zurück, minimiert auf dem ersten Bildschirm), Links in E-Mails führen zur Website |
| Automatischer Bau | `.github/workflows/android.yml`: baut bei jedem Push die Testversion (APK), startet eine Demo-Fassung (ohne Datenbank, damit kein Gastkonto entsteht) in einem Android-Emulator und prüft, dass der erste Bildschirm erscheint |

**Testversion aufs eigene Handy:** GitHub → Repository → *Actions* → *Android app* → letzter grüner Lauf → *Artifacts* → `wunder-debug-apk` herunterladen, entpacken, auf dem Android-Handy öffnen (Installation aus unbekannter Quelle einmal erlauben). Die Testversion ist nicht für die Veröffentlichung signiert.

**Lokal bauen** (optional): `npx next build && npx cap sync android`, dann `android/` in Android Studio öffnen (kostenlos).

## Entscheidungen, die vor dem ersten Upload fallen müssen

1. **App-Kennung** `io.github.yeccard68.wunder` – folgt dem GitHub-Namensraum des Projekts und braucht keine eigene Domain. Sie ist nach dem ersten Upload **nicht mehr änderbar** und sollte zum endgültigen Namen passen (siehe `docs/BRAND.md`). Ändern: `capacitor.config.ts`, `android/app/build.gradle`, Paketordner von `MainActivity.java`.
2. **App-Name** im Store und unter dem Symbol: derzeit „Wunder“.

## Was du anlegen musst

| Schritt | Kosten | Hinweis |
|---|---|---|
| Google-Play-Entwicklerkonto | 25 $ einmalig | Neue private Konten müssen vor der Veröffentlichung einen geschlossenen Test mit mindestens 12 Testern über 14 Tage durchführen. |
| Apple-Developer-Programm | 99 $ pro Jahr | Für iOS zusätzlich ein Mac oder ein macOS-Bau bei GitHub (für öffentliche Repositories kostenlos) und Signier-Zertifikate. |
| Upload-Schlüssel für Google Play | – | Wird einmal erzeugt und als geheimer Wert bei GitHub hinterlegt (nie im Code). Ich kann den Bauablauf dafür vorbereiten; den Schlüssel erzeugst und verwahrst du. Google verwaltet den eigentlichen App-Signaturschlüssel (Play App Signing). |
| Datenschutzerklärung unter einer festen Adresse | – | Pflicht in beiden Stores; braucht Name und Anschrift (siehe `docs/LEGAL.md`). |
| Supabase „Site URL“ | – | Authentication → URL Configuration → `https://wunder-one.vercel.app` |

## Angaben für die Store-Formulare (aus dem, was die App tatsächlich tut)

**Google Play – Datensicherheit**
- Erhobene Daten: *App-Aktivität* (beantwortete Fragen, Lernstand, Einstellungen) – für die App-Funktion, an ein anonymes Konto gebunden. *E-Mail-Adresse* – nur wenn jemand sein Konto selbst sichert (optional). *Nutzungsstatistik* (welche Inhalte geöffnet oder abgeschlossen wurden) – nur mit Einwilligung, für Analyse.
- Keine Weitergabe an Dritte (Vercel und Supabase sind Auftragsverarbeiter). Keine Werbung, keine Werbe-ID. Übertragung verschlüsselt (HTTPS). Löschung jederzeit in der App (Profil → „Konto und Daten löschen“).
- Berechtigungen der App: nur Internet.

**Zielgruppe:** 16 Jahre und älter; nicht für Kinder- oder Familienkategorien einreichen. Den Fragebogen zur Altersfreigabe wahrheitsgemäß ausfüllen (Lerninhalte, keine Gewalt, keine Käufe, Nutzerinhalte derzeit simuliert).

**Apple – App-Datenschutz:** dieselben Angaben; „Mit Apple anmelden“ ist nicht nötig, weil es keine Anmeldung über Google, Facebook o. Ä. gibt.

## Bekannte Grenzen der App-Fassung

- **Anmelden mit einem bestehenden Konto** geht in der App noch nicht: Der Anmeldelink öffnet den Browser, der die Sitzung nicht an die App übergeben kann. Die App zeigt dann einen Hinweis. Lösung später: Anmeldung per sechsstelligem Code statt Link (braucht eine angepasste E-Mail-Vorlage in Supabase) oder App-Links.
- **Konto sichern per E-Mail** funktioniert: Der Bestätigungslink führt zur Website und bestätigt die Adresse für das Konto der App.
- **Seiten direkt aufrufen:** In der App startet alles auf dem ersten Bildschirm; die Navigation innerhalb der App funktioniert normal.
- **Apple prüft Hüllen-Apps streng** (Richtlinie 4.2 „Minimum Functionality“). Eine App, die nur eine Website zeigt, kann abgelehnt werden. Wunder hat eigene Inhalte, Clips und Animationen in der App; Erinnerungen an das Tagesziel als Mitteilung wären ein zusätzliches natives Merkmal.
- Nicht getestet: echte Android-Geräte (nur der Emulator im automatischen Bau), iOS überhaupt.
