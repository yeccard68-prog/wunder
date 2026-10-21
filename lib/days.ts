// "Heute vor … Jahren": one event per calendar day, each quoted from the Wikipedia day article (content/days.json,
// checked by scripts/content/verify-evidence.mjs). Ships with the app like the facts – nothing to answer.
import daysJson from "@/content/days.json";
import { fitsAge } from "@/lib/content";
import type { AgeBand } from "@/lib/types";

interface Texts { text: string; detail: string }
export interface DayRow extends Texts {
  id: string;
  date: string; // "MM-DD"
  year: number;
  category_id: string;
  min_age: number;
  sources: { name: string; url: string }[];
  verification_status: "unverified" | "ai_checked" | "verified";
  status: "draft" | "published" | "archived";
  created_at: string;
  translations: Record<string, Texts>;
}
export interface DayEvent extends Texts {
  id: string;
  date: string;
  year: number;
  categoryId: string;
  minAge: number;
  sources: DayRow["sources"];
  verification: DayRow["verification_status"];
  yearsAgo: number;
  /** 0 = exactly today; otherwise how many days away (an event from this week when today has none) */
  offset: number;
}

const rows = daysJson as unknown as DayRow[];
const pad = (n: number) => String(n).padStart(2, "0");
const mmdd = (d: Date) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * The events for a day: today's if there are any, otherwise the nearest from the three days before or after
 * ("this week x years ago"). Right language and age level.
 */
export function eventsFor(locale: string, band: AgeBand | null, now = new Date()): DayEvent[] {
  const published = rows.filter((r) => r.status === "published" && r.verification_status !== "unverified");
  for (const offset of [0, -1, 1, -2, 2, -3, 3]) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const key = mmdd(d);
    const found = published
      .filter((r) => r.date === key)
      .map((r): DayEvent => {
        const t = r.translations[locale] ?? r;
        return { id: r.id, date: r.date, year: r.year, categoryId: r.category_id, minAge: r.min_age, sources: r.sources, verification: r.verification_status, text: t.text, detail: t.detail, yearsAgo: d.getFullYear() - r.year, offset };
      })
      .filter((e) => fitsAge(e, band));
    if (found.length) return found;
  }
  return [];
}

/** "21. Oktober 1879" / "21 October 1879" */
export function formatEventDate(e: Pick<DayEvent, "date" | "year">, locale: string) {
  const [m, d] = e.date.split("-").map(Number);
  return new Date(e.year, m - 1, d).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", { day: "numeric", month: "long", year: "numeric" });
}
