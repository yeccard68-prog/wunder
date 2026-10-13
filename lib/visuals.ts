// Interactive visualisations ("Interaktiv"): charts and small simulations the learner can change.
// Content lives in content/visuals.json; each entry names a type, and components/viz/index.tsx
// maps the type to the component that draws it. Adding a topic that fits an existing type is a
// new JSON entry – no new code. See docs/VISUALS.md.
// This file holds the data model and every formula, so the numbers on screen can be tested.
import visualsJson from "@/content/visuals.json";
import { fitsAge } from "@/lib/content";
import type { AgeBand } from "@/lib/types";

export type VisualType = "growth" | "scatter" | "market";
/** real = measured values from the named source · model = computed from the stated formula with example numbers */
export type DataKind = "real" | "model";

export interface Slider {
  min: number;
  max: number;
  step: number;
  value: number;
}
export interface GrowthConfig {
  unit: string;
  start: Slider;
  monthly: Slider;
  rate: Slider;
  years: Slider;
}
export interface ScatterConfig {
  /** x and y of every point; `late` points only appear after the prediction */
  points: { key: string; x: number; y: number; late?: boolean }[];
  /** y = x^power is drawn as the law behind the points */
  power: number;
}
export interface MarketConfig {
  unit: string;
  demand: { intercept: number; slope: number }; // price = intercept − slope × quantity
  supply: { intercept: number; slope: number }; // price = intercept + slope × quantity
  demandShift: Slider;
  costShift: Slider;
  maxQuantity: number;
  maxPrice: number;
}
interface Texts {
  title: string;
  goal: string; // what the learner can do afterwards
  intro: string;
  note: string; // assumptions, simplifications, limits of the model or the data
  labels: Record<string, string>; // every word inside the chart
  explain: string; // why it behaves this way
  predict: { question: string; options: string[]; feedback: string } | null;
  apply: string | null; // a task to carry out with the controls
}
export interface VisualRow extends Texts {
  id: string;
  type: VisualType;
  category_id: string;
  min_age: number;
  difficulty: 1 | 2 | 3;
  data_kind: DataKind;
  config: GrowthConfig | ScatterConfig | MarketConfig;
  predict_correct: number | null;
  sources: { name: string; url: string }[];
  links: { kind: "question" | "animation" | "book"; id: string }[];
  verification_status: "unverified" | "ai_checked" | "verified";
  status: "draft" | "published" | "archived";
  translations: Record<string, Texts>;
}
export interface Visual extends Texts {
  id: string;
  type: VisualType;
  categoryId: string;
  minAge: number;
  difficulty: number;
  dataKind: DataKind;
  config: VisualRow["config"];
  correct: number | null;
  sources: VisualRow["sources"];
  links: VisualRow["links"];
  verification: VisualRow["verification_status"];
}

export const visualRows = visualsJson as unknown as VisualRow[];
/** German names of the types; also the translation keys. */
export const TYPE_NAME: Record<VisualType, string> = { growth: "Rechner mit Verlauf", scatter: "Daten erkunden", market: "Modell zum Ausprobieren" };
export const KIND_NAME: Record<DataKind, string> = { real: "Echte Daten", model: "Rechenmodell mit Beispielzahlen" };

/** Published visualisations for one learner: right language (fallback: German), right age level. */
export function visualsFor(locale: string, band: AgeBand | null): Visual[] {
  return visualRows
    .filter((v) => v.status === "published" && v.verification_status !== "unverified")
    .map((v) => {
      const tr = v.translations[locale];
      const t: Texts = tr ?? v;
      return {
        id: v.id, type: v.type, categoryId: v.category_id, minAge: v.min_age, difficulty: v.difficulty, dataKind: v.data_kind, config: v.config, correct: v.predict_correct,
        sources: v.sources, links: v.links, verification: v.verification_status,
        title: t.title, goal: t.goal, intro: t.intro, note: t.note, labels: t.labels, explain: t.explain, predict: t.predict, apply: t.apply,
      };
    })
    .filter((v) => fitsAge(v, band));
}

// ---------- formulas ----------

/**
 * Saving with compound interest, credited monthly: balance at the end of every year (index 0 = today).
 * No taxes, fees or inflation.
 */
export function compound(start: number, monthly: number, ratePercent: number, years: number): number[] {
  const m = ratePercent / 100 / 12;
  const out = [start];
  let balance = start;
  for (let y = 1; y <= years; y++) {
    for (let k = 0; k < 12; k++) balance = balance * (1 + m) + monthly;
    out.push(balance);
  }
  return out;
}
/** The same payments without any interest. */
export const paidIn = (start: number, monthly: number, years: number): number[] => Array.from({ length: years + 1 }, (_, y) => start + monthly * 12 * y);

/**
 * Where a straight demand line and a straight supply line cross.
 * demandShift moves demand up or down (people want more or less at every price),
 * costShift moves supply up or down (producing becomes dearer or cheaper).
 */
export function equilibrium(c: Pick<MarketConfig, "demand" | "supply">, demandShift = 0, costShift = 0): { quantity: number; price: number } {
  const quantity = Math.max(0, (c.demand.intercept + demandShift - c.supply.intercept - costShift) / (c.demand.slope + c.supply.slope));
  return { quantity, price: c.supply.intercept + costShift + c.supply.slope * quantity };
}

// ---------- axes ----------

/** Round tick values covering 0 … max (about `count` of them). */
export function ticks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0];
  const raw = max / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= raw) ?? raw;
  return Array.from({ length: Math.floor(max / step + 1e-9) + 1 }, (_, i) => +(i * step).toPrecision(12));
}
/** Powers of ten between min and max, for a logarithmic axis. */
export function logTicks(min: number, max: number): number[] {
  const out: number[] = [];
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) out.push(Math.pow(10, e));
  return out;
}
/** Maps a value to a position between `from` and `to`, on a linear or logarithmic axis. */
export function scale(value: number, min: number, max: number, from: number, to: number, log = false): number {
  const k = log ? (Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)) : (value - min) / (max - min);
  return from + k * (to - from);
}
/** 152602.3 → "152.602" (de) / "152,602" (en); small numbers keep up to two decimals. */
export function formatNumber(value: number, locale: string, digits = 0): string {
  return value.toLocaleString(locale === "en" ? "en-GB" : "de-DE", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
