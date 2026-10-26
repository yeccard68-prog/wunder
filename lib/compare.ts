// Size comparisons: four things drawn to scale (scene "compare") – country areas, the highest points of countries,
// planet diameters. The numbers come from Wikidata (scripts/content/compare.mjs → content/compare.json); the texts are
// built here, so every comparison reads the same. Country names never stand where German needs an article
// ("die Schweiz"): they appear as headings, before a colon or in brackets.
import compareJson from "@/content/compare.json";
import type { Animation } from "@/lib/animations";
import { TIMING } from "@/lib/animations";
import { fitsAge } from "@/lib/content";
import { rng } from "@/lib/gamification";
import type { AgeBand } from "@/lib/types";

type Name = { de: string; en: string };
interface CompareRow {
  id: string;
  kind: "area" | "peak" | "planet";
  cont?: string;
  focus?: Name;
  countries?: string[];
  items: (Name & { value: number; qid: string; sub?: Name })[];
}
export const compareRows = compareJson as unknown as CompareRow[];

const CONT: Record<string, Name> = {
  europe: { de: "Europa", en: "Europe" }, asia: { de: "Asien", en: "Asia" }, africa: { de: "Afrika", en: "Africa" },
  "north-america": { de: "Nordamerika", en: "North America" }, "south-america": { de: "Südamerika", en: "South America" }, oceania: { de: "Ozeanien", en: "Oceania" },
};
const PLANET_TITLE: Record<string, Name> = {
  "cmp-planet-inner": { de: "Die inneren Planeten im Größenvergleich", en: "The inner planets compared" },
  "cmp-planet-outer": { de: "Die Erde neben den Riesenplaneten", en: "Earth next to the giant planets" },
  "cmp-planet-giants": { de: "Die vier Riesenplaneten im Vergleich", en: "The four giant planets compared" },
};
const SECONDS = [6, 4.5, 4.5, 4.5, 4.5, 7];

/** "rund 24-mal", "about 1.6 times": one decimal below ten. */
function times(k: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: k < 10 ? 1 : 0 }).format(k);
}
/** Planet diameters are mean values – shown rounded to three digits. */
const round3 = (v: number) => { const f = 10 ** Math.max(0, Math.floor(Math.log10(v)) - 2); return Math.round(v / f) * f; };

/** One comparison as an animation for the player (renderer svg-scene, scene "compare"). */
export function comparisonAnimation(row: CompareRow, locale: string): Animation {
  const de = locale === "de";
  const L = (n: Name) => (de ? n.de : n.en);
  const nf = new Intl.NumberFormat(locale);
  const items = row.items;
  const values = items.map((i) => (row.kind === "planet" ? round3(i.value) : i.value));
  const top = values.indexOf(Math.max(...values)), low = values.indexOf(Math.min(...values));
  const k = times(Math.max(...values) / Math.min(...values), locale);
  const cont = row.cont ? L(CONT[row.cont]) : "";
  const shown = values.map((v) => (row.kind === "area" ? `${nf.format(v)} km²` : row.kind === "peak" ? `${nf.format(v)} m` : `${nf.format(v)} km`));
  let title: string, summary: string, goal: string, ask: string, guess: string, last: string;
  let step: (i: number) => string;
  if (row.kind === "area") {
    title = de ? `Flächenvergleich: ${L(row.focus!)}` : `Area compared: ${L(row.focus!)}`;
    summary = de ? `Vier Länder aus ${cont}, maßstabsgetreu nebeneinander.` : `Four countries in ${cont}, drawn to scale.`;
    goal = de ? "Du kannst die Fläche der vier Länder ungefähr einordnen." : "You can roughly rank the four countries by area.";
    ask = de ? `Vier Länder aus ${cont}. Was schätzt du: Welches hat die größte Fläche?` : `Four countries in ${cont}. Your guess: which one has the largest area?`;
    guess = de ? "Welches Land hat die größte Fläche?" : "Which country has the largest area?";
    step = (i) => `${L(items[i])}: ${shown[i]}`;
    last = de ? `Am größten: ${L(items[top])} – rund ${k}-mal so viel Fläche wie das kleinste Land hier (${L(items[low])}). Die Quadrate sind maßstabsgetreu.` : `Largest: ${L(items[top])} – about ${k} times the area of the smallest country here (${L(items[low])}). The squares are to scale.`;
  } else if (row.kind === "peak") {
    title = de ? `Gipfelvergleich: ${L(row.focus!)}` : `Peaks compared: ${L(row.focus!)}`;
    summary = de ? `Die höchsten Punkte von vier Ländern aus ${cont}, maßstabsgetreu.` : `The highest points of four countries in ${cont}, drawn to scale.`;
    goal = de ? "Du kannst die höchsten Gipfel der vier Länder der Höhe nach ordnen." : "You can rank the highest peaks of the four countries by height.";
    ask = de ? `Der höchste Punkt von vier Ländern aus ${cont}. Was schätzt du: Wo steht der höchste Gipfel?` : `The highest point of four countries in ${cont}. Your guess: where is the tallest peak?`;
    guess = de ? "In welchem Land steht der höchste Gipfel?" : "Which country has the tallest peak?";
    step = (i) => `${L(items[i])}: ${L(items[i].sub!)}, ${shown[i]}`;
    last = de ? `Am höchsten: ${L(items[top].sub!)} (${L(items[top])}) – rund ${k}-mal so hoch wie der niedrigste Gipfel hier (${L(items[low].sub!)}). Höhen über dem Meer, maßstabsgetreu.` : `Tallest: ${L(items[top].sub!)} (${L(items[top])}) – about ${k} times as high as the lowest peak here (${L(items[low].sub!)}). Heights above sea level, to scale.`;
  } else {
    title = L(PLANET_TITLE[row.id] ?? { de: "Planeten im Größenvergleich", en: "Planets compared" });
    summary = de ? "Vier Planeten, maßstabsgetreu nebeneinander." : "Four planets, drawn to scale.";
    goal = de ? "Du kannst die vier Planeten der Größe nach ordnen." : "You can rank the four planets by size.";
    ask = de ? "Vier Planeten. Was schätzt du: Welcher ist am größten?" : "Four planets. Your guess: which one is the largest?";
    guess = de ? "Welcher Planet ist am größten?" : "Which planet is the largest?";
    step = (i) => (de ? `${L(items[i])}: rund ${shown[i]} Durchmesser` : `${L(items[i])}: about ${shown[i]} across`);
    last = de ? `Am größten: ${L(items[top])} – Durchmesser rund ${k}-mal so groß wie beim kleinsten hier (${L(items[low])}). Die Kreise sind maßstabsgetreu.` : `Largest: ${L(items[top])} – about ${k} times the diameter of the smallest here (${L(items[low])}). The circles are to scale.`;
  }
  const texts = [ask, ...items.map((_, i) => step(i)), last];
  const steps = texts.map((text, i) => ({ text, seconds: Math.round(Math.max(TIMING.minStep, SECONDS[i] * TIMING.pace) * 10) / 10 }));
  return {
    id: row.id, categoryId: row.kind === "planet" ? "science" : "earth", minAge: 10, difficulty: 2,
    scene: "compare", renderer: "svg-scene", fallback: null, title, summary, goal,
    labels: [...items.map((i) => L(i)), ...shown],
    steps, seconds: Math.round(steps.reduce((n, s) => n + s.seconds, 0)), motion: 1,
    predict: { step: 1, question: guess, options: items.map((i) => L(i)), correct: top },
    sources: items.map((i) => ({ name: `Wikidata: ${L(i.sub ?? i)}`, url: `https://www.wikidata.org/wiki/${i.qid}` })),
    quizId: null, verification: "ai_checked",
    compare: { shape: row.kind === "area" ? "square" : row.kind === "peak" ? "peak" : "disc", values },
    countries: row.countries,
  };
}

/** All comparisons for one learner (from age 10, like the generated cards). */
export function comparisonsFor(locale: string, band: AgeBand | null): Animation[] {
  return compareRows.map((r) => comparisonAnimation(r, locale)).filter((a) => fitsAge(a, band));
}

/**
 * The animations for the feed: hand-made ones and comparisons alternate (one, two, one, two …), the comparisons in a
 * random order per visit with those about the learner's own country first.
 */
export function withComparisons(animations: Animation[], comparisons: Animation[], region: string | null, seed: string): Animation[] {
  const r = rng(`cmp-${seed}`);
  const mixed = comparisons.map((a) => ({ a, k: r() + (region && a.countries?.includes(region) ? -1 : 0) })).sort((x, y) => x.k - y.k).map((x) => x.a);
  const out: Animation[] = [];
  for (let i = 0, j = 0; i < animations.length || j < mixed.length; ) {
    if (i < animations.length) out.push(animations[i++]);
    for (let k = 0; k < 2 && j < mixed.length; k++) out.push(mixed[j++]);
  }
  return out;
}
