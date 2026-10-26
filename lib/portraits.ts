// Country portraits (scene "portrait"): the map flies to the country, then flag, capital (guessed first), area, highest
// point, web ending – about half a minute, played by the explainer player like a clip. Data from the generated Wikidata
// files (scripts/content/portraits.mjs → content/portraits.json). Country names stand only before a colon, so no German
// article is missing ("Schweiz: die Flagge", never "die Flagge von Schweiz").
import portraitsJson from "@/content/portraits.json";
import type { Animation } from "@/lib/animations";
import { TIMING } from "@/lib/animations";
import { fitsAge } from "@/lib/content";
import type { AgeBand } from "@/lib/types";

type Name = { de: string; en: string };
export type PortraitStep = "map" | "flag" | "capital" | "area" | "peak" | "domain";
interface PortraitRow {
  id: string;
  iso: string;
  qid: string;
  name: Name;
  continent: Name;
  capital: Name;
  capitalOptions: { de: string[]; en: string[]; correct: number };
  flag: { url: string; credit?: string; source?: string };
  area?: number;
  peak?: Name & { height?: number };
  domain?: string;
}
export const portraitRows = portraitsJson as unknown as PortraitRow[];

/** One portrait as an animation. labels: 0 name, 1 continent, 2 capital, 3 area, 4 peak, 5 web ending, 6–9 headings, 10 peak height. */
export function portraitAnimation(row: PortraitRow, locale: string): Animation {
  const de = locale === "de";
  const L = (n: Name) => (de ? n.de : n.en);
  const nf = new Intl.NumberFormat(locale);
  const name = L(row.name);
  const steps: PortraitStep[] = ["map", "flag", "capital", ...(row.area ? ["area" as const] : []), ...(row.peak ? ["peak" as const] : []), ...(row.domain ? ["domain" as const] : [])];
  const area = row.area ? `${nf.format(row.area)} km²` : "";
  const peak = row.peak ? `${L(row.peak)}${row.peak.height ? `, ${nf.format(row.peak.height)} m` : ""}` : "";
  const text: Record<PortraitStep, string> = de
    ? { map: `${name}: ein Land in ${L(row.continent)}.`, flag: `${name}: die Flagge.`, capital: `Hauptstadt: ${L(row.capital)}.`, area: `Fläche: ${area}.`, peak: `Höchster Punkt: ${peak}.`, domain: `Internetadressen enden auf ${row.domain}.` }
    : { map: `${name}: a country in ${L(row.continent)}.`, flag: `${name}: the flag.`, capital: `Capital: ${L(row.capital)}.`, area: `Area: ${area}.`, peak: `Highest point: ${peak}.`, domain: `Web addresses end in ${row.domain}.` };
  const paced = steps.map((s) => ({ text: text[s], seconds: Math.round(Math.max(TIMING.minStep, (s === "map" ? 6 : 5) * TIMING.pace) * 10) / 10 }));
  return {
    id: row.id, categoryId: "earth", minAge: 10, difficulty: 1, scene: "portrait", renderer: "svg-scene", fallback: null,
    title: de ? `Länderporträt: ${name}` : `Country profile: ${name}`,
    summary: de ? "Karte, Flagge, Hauptstadt und mehr in einer halben Minute." : "Map, flag, capital and more in half a minute.",
    goal: de ? "Du kannst das Land auf der Karte zeigen und seine Hauptstadt nennen." : "You can point to the country on the map and name its capital.",
    labels: [name, L(row.continent), L(row.capital), area, row.peak ? L(row.peak) : "", row.domain ?? "", ...(de ? ["Hauptstadt", "Fläche", "Höchster Punkt", "Internet"] : ["Capital", "Area", "Highest point", "Web"]), row.peak?.height ? `${nf.format(row.peak.height)} m` : ""],
    steps: paced, seconds: Math.round(paced.reduce((n, s) => n + s.seconds, 0)), motion: 1,
    predict: { step: 2, question: de ? "Wie heißt die Hauptstadt?" : "What is the capital?", options: de ? row.capitalOptions.de : row.capitalOptions.en, correct: row.capitalOptions.correct },
    sources: [
      { name: `Wikidata: ${name}`, url: `https://www.wikidata.org/wiki/${row.qid}` },
      ...(row.flag.source ? [{ name: `${de ? "Flagge" : "Flag"}: ${row.flag.credit ?? "Wikimedia Commons"}`, url: row.flag.source }] : []),
    ],
    quizId: null, verification: "ai_checked", countries: [row.iso],
    portrait: { iso: row.iso, flag: row.flag.url, steps },
  };
}

export function portraitsFor(locale: string, band: AgeBand | null): Animation[] {
  return portraitRows.map((r) => portraitAnimation(r, locale)).filter((a) => fitsAge(a, band));
}
