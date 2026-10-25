// Builds questions from Wikidata (CC0) – thousands of cards from a few templates, every card linked to its Wikidata
// entry as the source. Output: public/gen/<template>.json, loaded into the database with
//   select public.import_generated('https://wunder-one.vercel.app/gen/<template>.json');
// after the file is live (see docs/CONTENT-ROUTINE.md). Generated cards are origin 'generated' and come into the feed
// in portions (sample_generated).
//   node scripts/content/wikidata.mjs [template …]      (default: all templates)
//
// Quality rules: only current values (statements with an end date are skipped), only entries with exactly one current
// value, only well-known entries (many Wikipedia language versions), disputed cases left out, wrong options from the
// same pool (same continent where it applies), no card that an editorial card already asks.
import fs from "node:fs";
import { rng } from "./lib-rng.mjs";

const UA = "wunder-content/1.0 (learning app; y.eccard68@gmail.com)";
async function sparql(query) {
  const r = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), { headers: { "user-agent": UA, accept: "application/sparql-results+json" } });
  if (!r.ok) throw new Error(`Wikidata ${r.status}`);
  return (await r.json()).results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
}
const qid = (url) => url.split("/").pop();
const shuffle = (list, r) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
/** Three wrong options from the pool: same group first (e.g. continent), never the answer, no repeats. */
function wrongOptions(answer, pool, group, r) {
  const same = shuffle(pool.filter((p) => p.group === group && p.de !== answer.de), r);
  const rest = shuffle(pool.filter((p) => p.group !== group && p.de !== answer.de), r);
  const out = [];
  for (const p of [...same, ...rest]) if (out.length < 3 && !out.some((o) => o.de === p.de || o.en === p.en)) out.push(p);
  return out;
}
/** Answer at a position derived from the id (stable across runs), the rest in the order drawn. */
function arrange(id, answer, wrong) {
  const at = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 4;
  const list = [...wrong];
  list.splice(at, 0, answer);
  return { de: list.map((o) => o.de), en: list.map((o) => o.en), correct: at };
}
/** Difficulty by how well known the entry is within its template: best-known third 1, middle 2, rest 3. */
function byFame(cards, links) {
  const sorted = [...links].sort((a, b) => b - a);
  const cut1 = sorted[Math.floor(sorted.length / 3)], cut2 = sorted[Math.floor((2 * sorted.length) / 3)];
  return cards.map((c, i) => ({ ...c, difficulty: links[i] > cut1 ? 1 : links[i] > cut2 ? 2 : 3 }));
}
/** The answer gives itself away when it contains the subject's name (Kuwait → Kuwait-Dinar, Guatemala → Guatemala-Stadt). */
const givesAway = (subject, answer) => {
  const flat = answer.toLowerCase().replace(/[^a-zäöüß]/g, "");
  return subject.toLowerCase().split(/[^a-zäöüß]+/).some((w) => w.length >= 4 && flat.includes(w.slice(0, 4))); // also adjectives: Indien → Indische Rupie
};

// Countries whose capital or currency is disputed or split – left out on purpose.
const DISPUTED = new Set(["Q801", "Q219060", "Q865", "Q1246", "Q40362", "Q23681", "Q750", "Q258", "Q39", "Q55"]); // Israel, Palestine, Taiwan, Kosovo, Western Sahara, Northern Cyprus, Bolivia, South Africa, Switzerland, Netherlands

const COUNTRIES = `
SELECT ?c ?cLabel ?cLabelEn ?iso ?cont ?links ?v ?vLabel ?vLabelEn WHERE {
  ?c wdt:P31 wd:Q3624078; wdt:P297 ?iso; wikibase:sitelinks ?links; wdt:P30 ?cont.
  FILTER NOT EXISTS { ?c wdt:P576 [] }
  ?c p:%P% ?st. ?st ps:%P% ?v. FILTER NOT EXISTS { ?st pq:P582 [] } %EXTRA%
  ?c rdfs:label ?cLabel FILTER(lang(?cLabel) = "de")
  ?c rdfs:label ?cLabelEn FILTER(lang(?cLabelEn) = "en")
  ?v rdfs:label ?vLabel FILTER(lang(?vLabel) = "de")
  ?v rdfs:label ?vLabelEn FILTER(lang(?vLabelEn) = "en")
}`;

/** One row per country with exactly one current value of the property. */
async function countryValues(prop, extra = "") {
  const rows = await sparql(COUNTRIES.replaceAll("%P%", prop).replace("%EXTRA%", extra));
  const by = new Map();
  for (const r of rows) {
    const id = qid(r.c);
    if (DISPUTED.has(id)) continue;
    const e = by.get(id) ?? { id, de: r.cLabel, en: r.cLabelEn, iso: r.iso, cont: qid(r.cont), links: +r.links, values: new Map() };
    e.values.set(qid(r.v), { id: qid(r.v), de: r.vLabel, en: r.vLabelEn });
    by.set(id, e);
  }
  return [...by.values()].filter((e) => e.values.size === 1).map((e) => ({ ...e, value: [...e.values.values()][0] }));
}

const TEMPLATES = {
  async capitals(r) {
    const list = await countryValues("P36");
    const pool = list.map((e) => ({ ...e.value, group: e.cont }));
    const keep = list.filter((e) => e.links >= 150 && !givesAway(e.de, e.value.de) && !givesAway(e.en, e.value.en));
    return byFame(keep.map((e) => {
      const id = `wd-cap-${e.id}`;
      const o = arrange(id, e.value, wrongOptions(e.value, pool, e.cont, r));
      return {
        id, category_id: "earth", min_age: 10, countries: [e.iso], tags: ["Geografie", "Hauptstädte"],
        question: `${e.de}: Wie heißt die Hauptstadt?`, options: o.de, correct_index: o.correct,
        explanation: `Die Hauptstadt von ${e.de} ist ${e.value.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `${e.en}: What is the capital?`, options: o.en, explanation: `The capital of ${e.en} is ${e.value.en}.` } },
      };
    }), keep.map((e) => e.links));
  },
  // (a currency template was tried: Wikidata lacks the euro for many euro countries and has outdated names – left out)
  async elements(r) {
    const rows = await sparql(`
SELECT ?e ?eLabel ?eLabelEn ?sym ?num ?links WHERE {
  ?e wdt:P31 wd:Q11344; wdt:P246 ?sym; wdt:P1086 ?num; wikibase:sitelinks ?links.
  ?e rdfs:label ?eLabel FILTER(lang(?eLabel) = "de")
  ?e rdfs:label ?eLabelEn FILTER(lang(?eLabelEn) = "en")
}`);
    const list = [...new Map(rows.map((x) => [qid(x.e), { id: qid(x.e), de: x.eLabel, en: x.eLabelEn, sym: x.sym, num: +x.num, links: +x.links }])).values()].filter((e) => e.num <= 92);
    const pool = list.map((e) => ({ de: e.de, en: e.en, group: e.sym[0] }));
    return list.filter((e) => e.links >= 120).map((e) => {
      const id = `wd-el-${e.id}`;
      const o = arrange(id, { de: e.de, en: e.en }, wrongOptions({ de: e.de, en: e.en }, pool, e.sym[0], r));
      return {
        id, category_id: "science", difficulty: e.num <= 30 ? 1 : e.num <= 56 ? 2 : 3, min_age: 10, countries: [], tags: ["Chemie", "Elemente"],
        question: `Welches chemische Element hat das Symbol „${e.sym}“?`, options: o.de, correct_index: o.correct,
        explanation: `${e.sym} steht für ${e.de}, das Element mit der Ordnungszahl ${e.num}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `Which chemical element has the symbol "${e.sym}"?`, options: o.en, explanation: `${e.sym} stands for ${e.en}, the element with atomic number ${e.num}.` } },
      };
    });
  },
};

// editorial cards already asking the same thing (e.g. "Was ist die Hauptstadt von Australien?") – the generated twin is skipped
const editorial = JSON.parse(fs.readFileSync("content/questions.json", "utf8"));
const asked = (card) => {
  const subject = card.question.split(":")[0].replace(/^Welches chemische Element hat das Symbol „|“\?$/g, "");
  const word = card.tags.includes("Hauptstädte") ? "Hauptstadt" : "Symbol";
  return editorial.some((q) => q.question.includes(word) && q.question.includes(subject));
};

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TEMPLATES);
fs.mkdirSync("public/gen", { recursive: true });
for (const name of names) {
  const cards = (await TEMPLATES[name](rng(`wikidata-${name}`))).filter((c) => !asked(c));
  const bad = cards.filter((c) => c.options.length !== 4 || new Set(c.options).size !== 4 || new Set(c.translations.en.options).size !== 4);
  if (bad.length) console.warn(`${name}: ${bad.length} cards without four distinct options left out`);
  const good = cards.filter((c) => !bad.includes(c));
  fs.writeFileSync(`public/gen/${name}.json`, JSON.stringify(good));
  console.log(`${name}: ${good.length} cards → public/gen/${name}.json`);
}
