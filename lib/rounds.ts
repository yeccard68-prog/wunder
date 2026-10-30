// Rounds (30.10.2026): nine in ten questions are generated from Wikidata templates („In welchem Land liegt …?“,
// ids wd-<template>-Q…, scripts/content/wikidata.mjs), and each fact also comes reversed and as „Stimmt das?“.
// One by one they filled the feed with look-alike cards. In the feed they now come bundled: one entry asks five
// questions of one template, no template twice within a few rounds, and each fact only once per feed.
import type { Ranked } from "./ranking";
import type { Item, UserState } from "./types";

export interface Round { id: string; template: string; items: Item[] }

/** Name of each template (German = translation key); `where`: asks where something is – these are spread apart too. */
export const TEMPLATES: Record<string, { name: string; where?: boolean }> = {
  book: { name: "Bücher" }, cap: { name: "Hauptstädte" }, car: { name: "Automarken", where: true }, castle: { name: "Burgen", where: true },
  city: { name: "Städte", where: true }, comp: { name: "Musikstücke" }, cont: { name: "Kontinente" }, crivr: { name: "Hauptstädte am Fluss" },
  disc: { name: "Entdeckte Elemente" }, el: { name: "Chemische Symbole" }, fall: { name: "Wasserfälle", where: true }, firm: { name: "Unternehmen", where: true },
  flag: { name: "Flaggen" }, heri: { name: "Welterbe", where: true }, instr: { name: "Instrumente" }, isl: { name: "Inseln", where: true },
  lake: { name: "Seen", where: true }, lang: { name: "Sprachen" }, moon: { name: "Monde" }, mouth: { name: "Flussmündungen" },
  move2: { name: "Kunstrichtungen" }, mtn: { name: "Berge", where: true }, museum: { name: "Museen", where: true }, nobel: { name: "Nobelpreise" },
  olym: { name: "Olympia" }, opera: { name: "Opern" }, paint: { name: "Gemälde" }, park: { name: "Nationalparks", where: true },
  peak: { name: "Höchste Gipfel" }, reg: { name: "Landeshauptstädte" }, river: { name: "Flüsse", where: true }, tld: { name: "Internet-Endungen" },
  tower: { name: "Türme", where: true }, uni: { name: "Universitäten", where: true }, volc: { name: "Vulkane", where: true }, wch: { name: "Fußball-WM" },
  wcw: { name: "Frauenfußball-WM" }, z: { name: "Ordnungszahlen" },
};
export const roundName = (template: string) => TEMPLATES[template]?.name ?? "Wissen";

const ID = /^wd-([a-z0-9]+)-(Q\d+)(?:-[rf])?$/;
/** Template of a generated question, null for one written by hand. */
export const templateOf = (id: string) => ID.exec(id)?.[1] ?? null;

export const ROUND_SIZE = 5;
/** The fewest questions a round asks – the rest of a template waits for the next feed. */
const MIN_SIZE = 3;
/** No template twice within this many rounds. */
const SPREAD = 6;

/**
 * Splits the ranked cards into single cards (written by hand, and generated ones due for repetition) and rounds of
 * generated ones. Within a template the ranking order stays; a fact asked in several ways (question, reversed,
 * „Stimmt das?“) goes into the feed once – its other forms wait for a later day.
 */
export function makeRounds(ranked: Ranked[], state: UserState): { cards: Ranked[]; rounds: Round[] } {
  const cards: Ranked[] = [];
  const queues = new Map<string, { item: Item; rank: number }[]>();
  const taken = new Set<string>();
  ranked.forEach((x, rank) => {
    const m = ID.exec(x.item.id);
    if (!m || state.answers[x.item.id]) return void cards.push(x);
    const fact = `${m[1]}-${m[2]}`;
    if (taken.has(fact)) return;
    taken.add(fact);
    if (!queues.has(m[1])) queues.set(m[1], []);
    queues.get(m[1])!.push({ item: x.item, rank });
  });
  // every template once before any comes again (in the order of their best cards – the learner's topics first),
  // and never two rounds in a row that ask where something is
  const uses = new Map<string, number>();
  const rounds: Round[] = [];
  for (;;) {
    const open = [...queues].filter(([, q]) => q.length >= MIN_SIZE)
      .sort(([a, p], [b, q]) => (uses.get(a) ?? 0) - (uses.get(b) ?? 0) || p[0].rank - q[0].rank);
    if (!open.length) break;
    const recent = rounds.slice(-SPREAD).map((r) => r.template);
    const lastWhere = !!rounds.length && !!TEMPLATES[rounds[rounds.length - 1].template]?.where;
    const fits = (t: string, strict: boolean) => !recent.includes(t) && !(strict && lastWhere && TEMPLATES[t]?.where);
    const [template, q] = open.find(([t]) => fits(t, true)) ?? open.find(([t]) => fits(t, false)) ?? open[0];
    const items = q.splice(0, ROUND_SIZE).map((x) => x.item);
    uses.set(template, (uses.get(template) ?? 0) + 1);
    rounds.push({ id: `round-${template}-${items[0].id}`, template, items });
  }
  return { cards, rounds };
}
