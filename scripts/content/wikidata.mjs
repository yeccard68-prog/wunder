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
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch("https://query.wikidata.org/sparql", { method: "POST", headers: { "user-agent": UA, accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded" }, body: "query=" + encodeURIComponent(query) });
      if (!r.ok) throw new Error(`Wikidata ${r.status}`);
      return (await r.json()).results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((ok) => setTimeout(ok, 8000 * attempt)); // the query service is busy now and then
    }
  }
}
/** German and English names through the label service (much faster than joining rdfs:label). */
const LABELS = (...vars) => `SERVICE wikibase:label { bd:serviceParam wikibase:language "de". ${vars.map((v) => `?${v} rdfs:label ?${v}Label.`).join(" ")} }`;
const LABELS_EN = (...vars) => `SERVICE wikibase:label { bd:serviceParam wikibase:language "en". ${vars.map((v) => `?${v} rdfs:label ?${v}LabelEn.`).join(" ")} }`;
/** The label service falls back to the Q-id when there is no name – such rows are left out. */
const named = (...names) => names.every((n) => n && !/^Q\d+$/.test(n));
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

/**
 * Works and their creator (paintings, books, operas): only creators who died before 1950 – people known for their
 * work, long ago. Exactly one creator; wrong options are other creators of the same century.
 */
async function works(r, t) {
  const rows = await sparql(`
SELECT ?w ?wLabel ?wLabelEn ?links ?c ?cLabel ?cLabelEn ?died ?year WHERE {
  ${t.match ?? `?w wdt:P31 wd:${t.cls}.`} ?w wdt:${t.prop} ?c; wikibase:sitelinks ?links. FILTER(?links >= ${t.minLinks})
  ?c wdt:P570 ?died. FILTER(YEAR(?died) < 1950)
  # people known for their work only: no politicians, rulers, military, prophets or religious leaders
  FILTER NOT EXISTS { ?c wdt:P106 ?occ. FILTER(?occ IN (wd:Q82955, wd:Q116, wd:Q47064, wd:Q189290, wd:Q42857, wd:Q1423891, wd:Q250867)) }
  # a year only where Wikidata knows it to the year (precision 9 or finer) – "19th century" must not become 1850
  OPTIONAL { ?w p:P577/psv:P577 [ wikibase:timeValue ?pub; wikibase:timePrecision ?pp ]. FILTER(?pp >= 9) }
  OPTIONAL { ?w p:P571/psv:P571 [ wikibase:timeValue ?inc; wikibase:timePrecision ?ip ]. FILTER(?ip >= 9) }
  BIND(YEAR(COALESCE(?pub, ?inc)) AS ?year)
  ${LABELS("w", "c")} ${LABELS_EN("w", "c")}
}`);
  const by = new Map();
  for (const x of rows) {
    if (!named(x.wLabel, x.wLabelEn, x.cLabel, x.cLabelEn)) continue;
    const e = by.get(qid(x.w)) ?? { id: qid(x.w), de: x.wLabel, en: x.wLabelEn, links: +x.links, year: x.year ? +x.year : null, creators: new Map() };
    e.creators.set(qid(x.c), { id: qid(x.c), de: x.cLabel, en: x.cLabelEn, group: String(Math.floor(new Date(x.died).getUTCFullYear() / 100)) });
    by.set(e.id, e);
  }
  // a title that names its creator ("Selbstbildnis Rembrandts") gives the answer away
  const lastName = (name) => name.split(" ").at(-1);
  const list = [...by.values()]
    .filter((e) => e.creators.size === 1 && !BLOCKED.has(e.id) && ![...e.creators.values()].some((c) => BLOCKED.has(c.id) || BLOCKED_NAMES.test(c.en)))
    .map((e) => ({ ...e, creator: [...e.creators.values()][0] }))
    .filter((e) => !givesAway(lastName(e.creator.de), e.de) && !givesAway(lastName(e.creator.en), e.en));
  const pool = [...new Map(list.map((e) => [e.creator.id, e.creator])).values()];
  return byFame(list.map((e) => {
    const id = `${t.prefix}-${e.id}`;
    const o = arrange(id, e.creator, wrongOptions(e.creator, pool, e.creator.group, r));
    return {
      id, category_id: "culture", min_age: 13, countries: [], tags: t.tags,
      question: t.de(e.de), options: o.de, correct_index: o.correct, explanation: t.deX(e.de, e.creator.de, e.year),
      source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
      translations: { en: { question: t.en(e.en), options: o.en, explanation: t.enX(e.en, e.creator.en, e.year) } },
    };
  }), list.map((e) => e.links));
}
// Left out on purpose: rulers, dictators, political leaders and religious figures (also as wrong options), religious
// scripture, and folk tales whose "author" only wrote them down.
const BLOCKED = new Set([
  "Q352", "Q855", "Q1394", "Q5816", "Q23559", "Q9061", "Q34943", // Hitler, Stalin, Lenin, Mao, Mussolini, Marx, Engels
  "Q9077", "Q9200", "Q128538", "Q9458", "Q302", "Q41166", "Q43982", "Q130777", // Moses, Paul, Luke, Muhammad, Jesus, …
  "Q1062358", // Three Little Pigs (recorded, not written)
]);
const BLOCKED_NAMES = /Hitler|Stalin|Lenin|Mao Zedong|Mussolini|Karl Marx|Friedrich Engels|Moses|Muhammad/; // in case an id above is off
const inYear = (y) => (y ? ` (${y < 0 ? `${-y} v. Chr.` : y})` : "");
const inYearEn = (y) => (y ? ` (${y < 0 ? `${-y} BC` : y})` : "");

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
  paintings: (r) => works(r, { cls: "Q3305213", prop: "P170", minLinks: 25, tags: ["Kunst", "Malerei"], prefix: "wd-paint",
    de: (w) => `Wer malte das Bild „${w}“?`, en: (w) => `Who painted "${w}"?`,
    deX: (w, c, y) => `„${w}“${inYear(y)} stammt von ${c}.`, enX: (w, c, y) => `"${w}"${inYearEn(y)} was painted by ${c}.` }),
  books: (r) => works(r, { cls: "Q7725634", prop: "P50", minLinks: 50, tags: ["Literatur", "Bücher"], prefix: "wd-book",
    de: (w) => `Wer schrieb „${w}“?`, en: (w) => `Who wrote "${w}"?`,
    deX: (w, c, y) => `„${w}“${inYear(y)} stammt von ${c}.`, enX: (w, c, y) => `"${w}"${inYearEn(y)} was written by ${c}.` }),
  // operas are marked by their genre, not by what they are an instance of
  operas: (r) => works(r, { match: "?w wdt:P136 wd:Q1344.", prop: "P86", minLinks: 15, tags: ["Musik", "Oper"], prefix: "wd-opera",
    de: (w) => `Wer komponierte die Oper „${w}“?`, en: (w) => `Who composed the opera "${w}"?`,
    deX: (w, c, y) => `Die Oper „${w}“${inYear(y)} stammt von ${c}.`, enX: (w, c, y) => `The opera "${w}"${inYearEn(y)} was composed by ${c}.` }),
  // "In welchem Land liegt die Welterbestätte …?" – sites in exactly one country
  async heritage(r) {
    const rows = await sparql(`
SELECT ?s ?sLabel ?sLabelEn ?links ?c WHERE {
  ?s wdt:P1435 wd:Q9259; wikibase:sitelinks ?links; wdt:P17 ?c. FILTER(?links >= 45)
  ${LABELS("s")} ${LABELS_EN("s")}
}`);
    const states = new Map((await sparql(`
SELECT ?c ?cLabel ?cLabelEn ?iso ?cont WHERE {
  ?c wdt:P31 wd:Q3624078; wdt:P297 ?iso; wdt:P30 ?cont. FILTER NOT EXISTS { ?c wdt:P576 [] }
  ${LABELS("c")} ${LABELS_EN("c")}
}`)).map((x) => [qid(x.c), x]));
    const by = new Map();
    for (const x of rows) {
      const c = states.get(qid(x.c));
      if (!named(x.sLabel, x.sLabelEn) || /^Qd+$/.test(x.sLabel)) continue;
      const e = by.get(qid(x.s)) ?? { id: qid(x.s), de: x.sLabel, en: x.sLabelEn, links: +x.links, countries: new Map() };
      e.countries.set(qid(x.c), c ? { id: qid(x.c), de: c.cLabel, en: c.cLabelEn, iso: c.iso, group: qid(c.cont) } : null);
      by.set(e.id, e);
    }
    const list = [...by.values()].filter((e) => e.countries.size === 1 && [...e.countries.values()][0] && !DISPUTED.has([...e.countries.keys()][0])).map((e) => ({ ...e, country: [...e.countries.values()][0] }));
    const pool = [...new Map(list.map((e) => [e.country.id, e.country])).values()];
    // places of war, genocide and slavery are memorials, not quiz material
    const SOMBRE = /KZ|Konzentrationslager|Vernichtung|Gedenk|Friedensdenkmal|Völkermord|Genozid|Schlachtfeld|Sklav|camp|memorial|genocide|battle|slave|prison|Gefängnis|Gorée|Bikini|Robben Island|Hiroshima|Auschwitz|Ruanda|Rwanda|Fort Jesus|Kunta Kinteh|Elmina|Cape Coast/i; // (named ones: slave trade, atomic tests)
    const keep = list.filter((e) => !givesAway(e.country.de, e.de) && !givesAway(e.country.en, e.en) && !SOMBRE.test(e.de) && !SOMBRE.test(e.en));
    return byFame(keep.map((e) => {
      const id = `wd-heri-${e.id}`;
      const o = arrange(id, e.country, wrongOptions(e.country, pool, e.country.group, r));
      return {
        id, category_id: "earth", min_age: 10, countries: [e.country.iso], tags: ["Geografie", "Welterbe"],
        question: `In welchem Land liegt die Welterbestätte „${e.de}“?`, options: o.de, correct_index: o.correct,
        explanation: `„${e.de}“ gehört zum UNESCO-Welterbe und liegt in ${e.country.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `Which country is the World Heritage Site "${e.en}" in?`, options: o.en, explanation: `"${e.en}" is a UNESCO World Heritage Site in ${e.country.en}.` } },
      };
    }), keep.map((e) => e.links));
  },
  // (an animal-class template was tried: the taxon tree in Wikidata is too deep and uneven – queries time out or miss
  // whole classes such as reptiles; needs another approach)
};

// editorial cards already asking the same thing (e.g. "Was ist die Hauptstadt von Australien?") – the generated twin is skipped
const editorial = JSON.parse(fs.readFileSync("content/questions.json", "utf8"));
const asked = (card) => {
  // the subject: the quoted title („…“) or what stands before the colon
  const subject = card.question.match(/„(.+)“/)?.[1] ?? card.question.split(":")[0];
  const word = card.tags.includes("Hauptstädte") ? "Hauptstadt" : card.tags.includes("Elemente") ? "Symbol" : "";
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
