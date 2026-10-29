// Interactive visualisations ("Interaktiv"): charts and small simulations the learner can change.
// Content lives in content/visuals.json; each entry names a type, and components/viz/index.tsx
// maps the type to the component that draws it. Adding a topic that fits an existing type is a
// new JSON entry – no new code. See docs/VISUALS.md.
// This file holds the data model and every formula, so the numbers on screen can be tested.
import visualsJson from "@/content/visuals.json";
import { fitsAge } from "@/lib/content";
import { reviewedStatus } from "@/lib/reviews";
import type { AgeBand } from "@/lib/types";

export type VisualType = "growth" | "scatter" | "market" | "bars" | "timeline" | "chance" | "sampling";
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
  /** example settings from the texts, one tap each; `label` is a key in `labels` (so it is translated) */
  presets?: { label: string; values: Partial<Record<"start" | "monthly" | "rate" | "years", number>> }[];
}
export interface ScatterConfig {
  /** x and y of every point; `late` points only appear after the prediction */
  points: { key: string; x: number; y: number; late?: boolean }[];
  /** y = x^power is drawn as the law behind the points */
  power: number;
}
export interface BarsConfig {
  unit: string;
  baseline: string; // key of the bar the others are compared with in the relative view
  items: { key: string; value: number }[]; // in a meaningful order (e.g. gases, liquids, solids)
}
export interface TimelineConfig {
  from: number; // first and last year of the axis
  to: number;
  items: { key: string; year: number; late?: boolean }[];
}
/** A chance experiment that is run once by hand or a thousand times at a tap: shared birthdays, the three doors, coins */
export interface ChanceConfig {
  experiment: "birthday" | "doors" | "coins";
  people?: Slider; // birthday: the size of the group
  runs: number; // how many times one tap of "simulate" repeats it
}
/** How a language model picks the next word: example probabilities, reshaped by the temperature */
export interface SamplingConfig {
  words: { key: string; p: number }[]; // example values, they add up to 1
  temperature: Slider;
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
  config: GrowthConfig | ScatterConfig | MarketConfig | BarsConfig | TimelineConfig | ChanceConfig | SamplingConfig;
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
export const TYPE_NAME: Record<VisualType, string> = { growth: "Rechner mit Verlauf", scatter: "Daten erkunden", market: "Modell zum Ausprobieren", bars: "Vergleich", timeline: "Zeitleiste", chance: "Zufallsexperiment", sampling: "Modell zum Ausprobieren" };
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
        sources: v.sources, links: v.links, verification: reviewedStatus("visual", v),
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
// ---------- chance ----------

/** A small seeded random generator (mulberry32), so simulations can be tested; the app passes Math.random. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** The chance that at least two of n people share a birthday (365 equally likely days, no 29 February). */
export function birthdayChance(n: number): number {
  let none = 1;
  for (let k = 0; k < n; k++) none *= (365 - k) / 365;
  return 1 - none;
}
/** One group of n birthdays (day of the year 0–364) and the days that occur more than once. */
export function birthdayGroup(n: number, rnd: () => number): { days: number[]; shared: number[] } {
  const days = Array.from({ length: n }, () => Math.floor(rnd() * 365));
  const seen = new Map<number, number>();
  for (const d of days) seen.set(d, (seen.get(d) ?? 0) + 1);
  return { days, shared: [...seen].filter(([, c]) => c > 1).map(([d]) => d).sort((a, b) => a - b) };
}
/**
 * One game of the three doors: the car is behind a random door, the player picks one, the host opens another door with
 * a goat (at random if he has two to choose from), and the player stays or switches.
 */
export function doorsGame(pick: number, switching: boolean, rnd: () => number): { car: number; opened: number; final: number; won: boolean } {
  const car = Math.floor(rnd() * 3);
  const goats = [0, 1, 2].filter((d) => d !== pick && d !== car);
  const opened = goats[Math.floor(rnd() * goats.length)];
  const final = switching ? [0, 1, 2].find((d) => d !== pick && d !== opened)! : pick;
  return { car, opened, final, won: final === car };
}
/** The share of heads after each toss, for the running line of the coin experiment. */
export function runningShare(tosses: boolean[]): number[] {
  let heads = 0;
  return tosses.map((h, i) => (heads += h ? 1 : 0) / (i + 1));
}

// ---------- sampling ----------

/** Probabilities reshaped by a temperature: p^(1/T), normalised. T < 1 sharpens, T > 1 evens out (softmax with temperature). */
export function withTemperature(p: number[], t: number): number[] {
  const w = p.map((x) => Math.pow(x, 1 / Math.max(0.05, t)));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / sum);
}
/** The index a random number r in [0, 1) falls on when the probabilities are laid end to end. */
export function drawIndex(p: number[], r: number): number {
  let acc = 0;
  for (let i = 0; i < p.length; i++) if (r < (acc += p[i])) return i;
  return p.length - 1;
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

/** Each value as a multiple of the baseline value (for "x times as fast as …"). */
export function relativeTo(items: BarsConfig["items"], baseline: string): number[] {
  const base = items.find((i) => i.key === baseline)?.value;
  return items.map((i) => (base ? i.value / base : NaN));
}

/** Years between each event and the one before it (sorted by year; the first has none). */
export function gaps(items: TimelineConfig["items"]): { key: string; years: number | null }[] {
  const sorted = [...items].sort((a, b) => a.year - b.year);
  // years before Christ are negative; there is no year 0, so a span across it is one year shorter
  return sorted.map((e, i) => ({ key: e.key, years: i ? e.year - sorted[i - 1].year - (sorted[i - 1].year < 0 && e.year > 0 ? 1 : 0) : null }));
}

/** A year for display: negative years before Christ; early years after Christ are marked when the axis spans both eras. */
export function formatYear(year: number, locale: string, bothEras = false): string {
  if (year < 0) return locale === "en" ? `${-year} BC` : `${-year} v. Chr.`;
  if (bothEras && year < 1000) return locale === "en" ? `AD ${year}` : `${year} n. Chr.`;
  return String(year);
}

/** Tick marks for a time axis: round years, at most about eight of them. */
export function yearTicks(from: number, to: number): number[] {
  const step = [100, 200, 500, 1000, 2000].find((s) => (to - from) / s <= 8) ?? 5000;
  const out: number[] = [];
  for (let y = Math.ceil(from / step) * step; y <= to; y += step) if (y !== 0) out.push(y);
  return out;
}

/**
 * Positions for labels next to points on a line: as close to the point as possible, but never
 * closer than `min` to the previous label (points stay where they are; a short line connects them).
 */
export function spreadLabels(positions: number[], min: number): number[] {
  const out: number[] = [];
  positions.forEach((p, i) => out.push(i ? Math.max(p, out[i - 1] + min) : p));
  return out;
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
