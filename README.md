# Wunder

„Jeden Tag ein bisschen klüger." Kurze Lernclips, „Stimmt das?"-Karten, Quizfragen, Daily Challenge, Wiederholungen und XP – für sechs Themen von Wissenschaft bis Kultur.

Next.js (statischer Export) + Tailwind + Supabase. Für Android/iOS später mit Capacitor verpackbar.

## Start

```bash
npm install
npm run dev        # http://localhost:3000
```

- Mit `.env.local` (siehe `.env.example`): **Live-Modus** gegen Supabase.
- Ohne `.env.local`: **Demo-Modus** mit Beispieldaten, in der App als solcher gekennzeichnet.

## Befehle

| Befehl | Zweck |
|---|---|
| `npm test` | 27 Tests (Datensatz, Import, XP, Streak, Ranking) |
| `npm run typecheck` / `npm run build` | TypeScript / Produktions-Build nach `out/` |
| `npm run content:check` | Inhalte in `content/*.json` prüfen |
| `npm run content:import [-- --update]` | Import-SQL nach `supabase/seed/content.sql` schreiben |
| `npm run content:verify` | Prüfsummen für den Abgleich Datensatz ↔ Datenbank |
| `npm run clips` | Beispielclips neu erzeugen (Browser-Aufnahme) |
| `npm run pipeline` | Fragen aus Quellen erzeugen (Claude, nur serverseitig) |

## Struktur

| Pfad | Inhalt |
|---|---|
| `app/` | Screens: Entdecken, Clips, Quiz, Community, Profil |
| `components/` | Karten, Feed, Quizrunde, Onboarding, Konto, Design-System (`ui.tsx`) |
| `lib/store.tsx` | App-Zustand; im Live-Modus ist der Server die Quelle der Wahrheit |
| `lib/supabase.ts` | einzige Datenzugriffsschicht zum Backend |
| `lib/content.ts` | Abbildung Datensatz/Datenbankzeile → App-Modell |
| `lib/gamification.ts`, `lib/ranking.ts`, `lib/clips.ts` | Regeln für XP/Streak, Feed- und Clip-Ranking |
| `content/` | Inhalte (Quelle der Wahrheit) und unveränderte Originale in `_original/` |
| `supabase/migrations/` | Datenbankschema, Rechte, Server-Funktionen |
| `supabase/seed/content.sql` | erzeugter, wiederholbarer Inhaltsimport |
| `supabase/tests/` | Sicherheits- und Punktetests für die Datenbank |
| `scripts/`, `pipeline/` | Inhalts-Werkzeuge, Clip-Erzeugung, Content-Pipeline |

Alles Weitere – Tabellen, Sicherheit, Dashboard-Schritte, Inhalte pflegen, Store-Vorbereitung, bekannte Einschränkungen – steht in **[docs/BACKEND.md](docs/BACKEND.md)**.
