// "Did you know?" – short, surprising facts from all areas of life, each with a source. They ship with the
// app (content/facts.json, like books and visualisations); there is nothing to answer, so no answer key.
import factsJson from "@/content/facts.json";
import { fitsAge } from "@/lib/content";
import { hash, today } from "@/lib/gamification";
import { reviewedStatus } from "@/lib/reviews";
import { topicEngagement } from "@/lib/engagement";
import type { AgeBand, UserState } from "@/lib/types";

/** Areas of life a fact can come from – finer than the ten topics. German names are the translation keys. */
export const AREAS = {
  animals: "Tiere",
  body: "Körper",
  space: "Weltraum",
  food: "Essen & Trinken",
  nature: "Natur & Erde",
  tech: "Technik",
  history: "Geschichte",
  language: "Sprache",
  money: "Geld",
  culture: "Kunst & Kultur",
  sport: "Sport",
  numbers: "Zahlen",
  curious: "Kurioses",
} as const;
export type Area = keyof typeof AREAS;

interface Texts { text: string; detail: string }
export interface FactRow extends Texts {
  id: string;
  category_id: string; // one of the ten topics, for the feed and the interests
  area: Area;
  min_age: number;
  sources: { name: string; url: string }[];
  verification_status: "unverified" | "ai_checked" | "verified";
  status: "draft" | "published" | "archived";
  created_at: string;
  translations: Record<string, Texts>;
}
export interface Fact extends Texts {
  id: string;
  categoryId: string;
  area: Area;
  minAge: number;
  sources: FactRow["sources"];
  verification: FactRow["verification_status"];
  createdAt: string;
}

export const factRows = factsJson as unknown as FactRow[];

/** Published facts for one learner: right language (fallback: German), right age level. */
export function factsFor(locale: string, band: AgeBand | null): Fact[] {
  return factRows
    .filter((f) => f.status === "published" && f.verification_status !== "unverified")
    .map((f) => {
      const t = f.translations[locale] ?? f;
      return { id: f.id, categoryId: f.category_id, area: f.area, minAge: f.min_age, sources: f.sources, verification: reviewedStatus("fact", f), createdAt: f.created_at, text: t.text, detail: t.detail };
    })
    .filter((f) => fitsAge(f, band));
}

/**
 * Order for the feed: facts not reacted to first; within them, topics the learner chose or lingers on,
 * areas that earned a "Wow!" before, and a small daily shuffle so the feed feels new every day.
 */
export function rankFacts(facts: Fact[], state: UserState): Fact[] {
  const wow = new Set(state.facts?.wow ?? []);
  const known = new Set(state.facts?.known ?? []);
  const wowAreas = new Map<string, number>();
  for (const f of facts) if (wow.has(f.id)) wowAreas.set(f.area, (wowAreas.get(f.area) ?? 0) + 1);
  const day = today();
  const score = (f: Fact) =>
    (wow.has(f.id) || known.has(f.id) ? -100 : 0) +
    (state.interests.includes(f.categoryId) ? 2 : 0) +
    2 * topicEngagement(state, f.categoryId) +
    Math.min(2, (wowAreas.get(f.area) ?? 0) * 0.5) +
    (hash(f.id + day) % 100) / 40; // a fair share of chance: facts are about surprise
  return facts.filter((f) => !state.hidden.includes(f.id)).sort((a, b) => score(b) - score(a));
}
