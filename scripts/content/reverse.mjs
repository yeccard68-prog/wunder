// Reverse questions from the generated cards that already exist – no new Wikidata queries, same sources:
// "Frankreich: Wie heißt die Hauptstadt?" → "Paris ist die Hauptstadt welches Landes?". Output: public/gen/<name>-rev.json,
// imported like any generated file (import_generated).
//   node scripts/content/reverse.mjs
//
// Only templates whose reverse has exactly one right answer: no official languages (Arabic is official in many
// countries), no World Cups and no capital rivers (several answers possible); summits shared by two countries and
// cities that hosted the Olympics more than once are left out. Wrong options never belong to the same subject.
import fs from "node:fs";
import { rng } from "./lib-rng.mjs";

const read = (name) => JSON.parse(fs.readFileSync(`public/gen/${name}.json`, "utf8"));
const answer = (c) => ({ de: c.options[c.correct_index], en: c.translations.en.options[c.correct_index] });
const quoted = (s) => s.match(/[„"]([^“"]+)[“"]/)?.[1];
const before = (s) => s.split(":")[0];
const shuffle = (list, r) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
/** Answer at a position derived from the id; three wrong options drawn from `pool` (distinct, never the answer). */
function options(id, right, pool, r) {
  const wrong = [];
  for (const p of shuffle(pool, r)) if (wrong.length < 3 && p.de !== right.de && p.en !== right.en && !wrong.some((w) => w.de === p.de || w.en === p.en)) wrong.push(p);
  if (wrong.length < 3) return null;
  const at = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 4;
  const list = [...wrong];
  list.splice(at, 0, right);
  return { de: list.map((o) => o.de), en: list.map((o) => o.en), correct: at };
}
const card = (src, id, o, q, cat = src.category_id) => ({
  id, category_id: cat, difficulty: src.difficulty, min_age: src.min_age, countries: q.countries ?? src.countries, tags: src.tags,
  question: q.de, options: o.de, correct_index: o.correct, explanation: src.explanation,
  source_name: src.source_name, source_url: src.source_url,
  translations: { en: { question: q.en, options: o.en, explanation: src.translations.en.explanation } },
});
const continentOf = JSON.parse(fs.readFileSync("lib/map-countries.json", "utf8"));
const count = (list, key) => list.reduce((m, x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1), new Map());
/** At most `n` cards per key – e.g. not thirty "Which moon orbits Jupiter?" */
const cap = (list, key, n) => { const seen = new Map(); return list.filter((x) => { const k = key(x); seen.set(k, (seen.get(k) ?? 0) + 1); return seen.get(k) <= n; }); };

const REVERSE = {
  // Paris → Frankreich (wrong options: countries of the same continent)
  capitals(cards, r) {
    const items = cards.map((c) => ({ c, country: { de: before(c.question), en: before(c.translations.en.question), iso: c.countries[0] }, city: answer(c) }));
    return items.map(({ c, country, city }) => {
      const near = items.filter((x) => continentOf[x.country.iso] && continentOf[x.country.iso] === continentOf[country.iso]).map((x) => x.country);
      const o = options(`${c.id}-r`, country, near.length > 3 ? near : items.map((x) => x.country), r);
      return o && card(c, `${c.id}-r`, o, { de: `${city.de} ist die Hauptstadt welches Landes?`, en: `${city.en} is the capital of which country?` });
    });
  },
  regions(cards, r) {
    const KIND = { DE: ["die Landeshauptstadt welches deutschen Bundeslandes", "the capital of which German state"], AT: ["die Landeshauptstadt welches österreichischen Bundeslandes", "the capital of which Austrian state"], CH: ["der Hauptort welches Schweizer Kantons", "the capital of which Swiss canton"], US: ["die Hauptstadt welches US-Bundesstaats", "the capital of which US state"] };
    const items = cards.map((c) => ({ c, region: { de: before(c.question), en: before(c.translations.en.question) }, iso: c.countries[0], city: answer(c) }));
    return items.map(({ c, region, iso, city }) => {
      const o = options(`${c.id}-r`, region, items.filter((x) => x.iso === iso).map((x) => x.region), r);
      return o && card(c, `${c.id}-r`, o, { de: `${city.de} ist ${KIND[iso][0]}?`, en: `${city.en} is ${KIND[iso][1]}?` });
    });
  },
  // Eisen → Fe
  elements(cards, r) {
    const items = cards.map((c) => ({ c, sym: quoted(c.question), el: answer(c) }));
    return items.map(({ c, sym, el }) => {
      const o = options(`${c.id}-r`, { de: sym, en: sym }, items.map((x) => ({ de: x.sym, en: x.sym })), r);
      return o && card(c, `${c.id}-r`, o, { de: `Welches chemische Symbol hat das Element ${el.de}?`, en: `What is the chemical symbol of ${el.en}?` });
    });
  },
  atomicnumbers(cards, r) {
    return cards.map((c) => {
      const num = Number(c.question.match(/(\d+)\?$/)[1]);
      const el = answer(c);
      const near = [num - 2, num - 1, num + 1, num + 2, num + 3].filter((n) => n > 0 && n !== num).map((n) => ({ de: String(n), en: String(n) }));
      const o = options(`${c.id}-r`, { de: String(num), en: String(num) }, near, r);
      return o && card(c, `${c.id}-r`, o, { de: `Welche Ordnungszahl hat das chemische Element ${el.de}?`, en: `What is the atomic number of ${el.en}?` });
    });
  },
  summits(cards, r) {
    const items = cards.map((c) => ({ c, country: { de: before(c.question), en: before(c.translations.en.question), iso: c.countries[0] }, peak: answer(c) }));
    const shared = count(items, (x) => x.peak.de);
    return items.filter((x) => shared.get(x.peak.de) === 1).map(({ c, country, peak }) => {
      const near = items.filter((x) => continentOf[x.country.iso] === continentOf[country.iso]).map((x) => x.country);
      const o = options(`${c.id}-r`, country, near.length > 3 ? near : items.map((x) => x.country), r);
      return o && card(c, `${c.id}-r`, o, { de: `„${peak.de}“ ist der höchste Punkt welches Landes?`, en: `"${peak.en}" is the highest point of which country?` });
    });
  },
  domains(cards, r) {
    const items = cards.map((c) => ({ c, country: { de: before(c.question), en: before(c.translations.en.question), iso: c.countries[0] }, tld: answer(c).de }));
    return items.map(({ c, country, tld }) => {
      const near = items.filter((x) => continentOf[x.country.iso] === continentOf[country.iso]).map((x) => x.country);
      const o = options(`${c.id}-r`, country, near.length > 3 ? near : items.map((x) => x.country), r);
      return o && card(c, `${c.id}-r`, o, { de: `Zu welchem Land gehört die Internet-Endung ${tld}?`, en: `Which country does the web address ending ${tld} belong to?` });
    });
  },
  // Afrika → one country there, three from other continents
  continents(cards, r) {
    const items = cards.map((c) => ({ c, country: { de: before(c.question), en: before(c.translations.en.question) }, cont: answer(c) }));
    return items.map(({ c, country, cont }) => {
      const o = options(`${c.id}-r`, country, items.filter((x) => x.cont.de !== cont.de).map((x) => x.country), r);
      return o && card(c, `${c.id}-r`, o, { de: `Welches dieser Länder liegt in ${cont.de}?`, en: `Which of these countries is in ${cont.en}?` });
    });
  },
  heritage(cards, r) {
    const items = cards.map((c) => ({ c, site: { de: quoted(c.question), en: quoted(c.translations.en.question) }, country: answer(c), iso: c.countries[0] }));
    return items.map(({ c, site, country }) => {
      const o = options(`${c.id}-r`, site, items.filter((x) => x.country.de !== country.de).map((x) => x.site), r);
      return o && card(c, `${c.id}-r`, o, { de: `Welche dieser Welterbestätten liegt in ${country.de}?`, en: `Which of these World Heritage Sites is in ${country.en}?` });
    });
  },
  companies(cards, r) {
    const items = cards.map((c) => ({ c, firm: { de: quoted(c.question), en: quoted(c.translations.en.question) }, country: answer(c) }));
    return items.map(({ c, firm, country }) => {
      const o = options(`${c.id}-r`, firm, items.filter((x) => x.country.de !== country.de).map((x) => x.firm), r);
      return o && card(c, `${c.id}-r`, o, { de: `Welches dieser Unternehmen hat seinen Hauptsitz in ${country.de}?`, en: `Which of these companies is headquartered in ${country.en}?` });
    });
  },
  // works: one card per creator (the best-known work comes first in the file)
  ...Object.fromEntries([
    ["paintings", "Welches dieser Bilder malte {c}?", "Which of these paintings is by {c}?"],
    ["books", "Welches dieser Werke schrieb {c}?", "Which of these works was written by {c}?"],
    ["operas", "Welche dieser Opern komponierte {c}?", "Which of these operas was composed by {c}?"],
  ].map(([name, de, en]) => [name, (cards, r) => {
    const items = cards.map((c) => ({ c, work: { de: quoted(c.question), en: quoted(c.translations.en.question) }, creator: answer(c) }));
    return cap(items, (x) => x.creator.de, 1).map(({ c, work, creator }) => {
      const o = options(`${c.id}-r`, work, items.filter((x) => x.creator.de !== creator.de).map((x) => x.work), r);
      return o && card(c, `${c.id}-r`, o, { de: de.replace("{c}", creator.de), en: en.replace("{c}", creator.en) });
    });
  }])),
  moons(cards, r) {
    const items = cards.map((c) => ({ c, moon: { de: quoted(c.question), en: quoted(c.translations.en.question) }, planet: answer(c) }));
    return cap(items.filter((x) => x.c.difficulty <= 2), (x) => x.planet.de, 4).map(({ c, moon, planet }) => {
      const o = options(`${c.id}-r`, moon, items.filter((x) => x.planet.de !== planet.de).map((x) => x.moon), r);
      return o && card(c, `${c.id}-r`, o, { de: `Welcher dieser Monde kreist um ${planet.de === "Erde" ? "die Erde" : `den ${planet.de}`}?`, en: `Which of these moons orbits ${planet.en}?` });
    });
  },
  instruments(cards, r) {
    const items = cards.map((c) => ({ c, inst: { de: quoted(c.question), en: quoted(c.translations.en.question) }, group: answer(c) }));
    return cap(items, (x) => x.group.de, 6).map(({ c, inst, group }) => {
      const o = options(`${c.id}-r`, inst, items.filter((x) => x.group.de !== group.de).map((x) => x.inst), r);
      return o && card(c, `${c.id}-r`, o, { de: `Welches dieser Instrumente ist ein ${group.de}?`, en: `Which of these instruments belongs to this family: ${group.en}?` });
    });
  },
  // only cities that hosted once
  olympics(cards, r) {
    const items = cards.map((c) => ({ c, year: c.question.match(/(\d{4})/)[1], kind: /Winter/.test(c.question) ? "winter" : "summer", city: answer(c) }));
    const hosted = count(items, (x) => x.city.de);
    return items.filter((x) => hosted.get(x.city.de) === 1).map(({ c, year, kind, city }) => {
      const near = items.filter((x) => x.kind === kind).map((x) => ({ de: x.year, en: x.year }));
      const o = options(`${c.id}-r`, { de: year, en: year }, near, r);
      const [de, en] = kind === "winter" ? ["Olympische Winterspiele", "Winter Olympics"] : ["Olympische Sommerspiele", "Summer Olympics"];
      return o && card(c, `${c.id}-r`, o, { de: `In welchem Jahr fanden in ${city.de} ${de} statt?`, en: `In which year did ${city.en} host the ${en}?` });
    });
  },
};

let total = 0;
for (const [name, make] of Object.entries(REVERSE)) {
  if (!fs.existsSync(`public/gen/${name}.json`)) continue;
  const out = make(read(name), rng(`reverse-${name}`)).filter(Boolean).filter((c) => !c.question.includes("undefined") && new Set(c.options).size === 4);
  fs.writeFileSync(`public/gen/${name}-rev.json`, JSON.stringify(out));
  total += out.length;
  console.log(`${name}-rev: ${out.length}`);
}
console.log(`zusammen ${total} umgekehrte Fragen`);
