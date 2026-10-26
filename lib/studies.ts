// "Studie kurz erklärt": a famous study in four parts – what the researchers wanted to know, how they found out,
// what came out and the honest limit ("Aber …"). Every part is quoted from the linked article
// (content/studies.json, checked by scripts/content/verify-evidence.mjs). Ships with the app like the facts.
import studiesJson from "@/content/studies.json";
import { fitsAge } from "@/lib/content";
import type { AgeBand } from "@/lib/types";

interface Texts { name: string; question: string; method: string; result: string; caveat: string }
export interface StudyRow extends Texts {
  id: string;
  category_id: string;
  min_age: number;
  year: number;
  sources: { name: string; url: string }[];
  verification_status: "unverified" | "ai_checked" | "verified";
  status: "draft" | "published" | "archived";
  created_at: string;
  translations: Record<string, Texts>;
  image_url?: string; // a free lead image from Wikipedia (WebP) or a drawn sketch (SVG), on the app's own site
  image_credit?: string; // author · licence, or "Zeichnung: Wunder"
  image_source?: string; // page of the original file
}
export interface Study extends Texts {
  id: string;
  categoryId: string;
  minAge: number;
  year: number;
  sources: StudyRow["sources"];
  verification: StudyRow["verification_status"];
  createdAt: string;
  image?: { url: string; credit?: string; source?: string };
}

export const studyRows = studiesJson as unknown as StudyRow[];

/** The published studies in the learner's language and age level. */
export function studiesFor(locale: string, band: AgeBand | null, rows: StudyRow[] = studyRows): Study[] {
  return rows
    .filter((s) => s.status === "published" && s.verification_status !== "unverified")
    .map((s) => {
      const t = s.translations[locale] ?? s;
      return { id: s.id, categoryId: s.category_id, minAge: s.min_age, year: s.year, sources: s.sources, verification: s.verification_status, createdAt: s.created_at, image: s.image_url ? { url: s.image_url, credit: s.image_credit, source: s.image_source } : undefined, name: t.name, question: t.question, method: t.method, result: t.result, caveat: t.caveat };
    })
    .filter((s) => fitsAge(s, band));
}
