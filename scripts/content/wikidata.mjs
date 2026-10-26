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
// Territories whose status is disputed – never an answer for "in which country is …?"
const CONTESTED = new Set(["Q219060", "Q865", "Q1246", "Q40362", "Q23681"]); // Palestine, Taiwan, Kosovo, Western Sahara, Northern Cyprus
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
  let list = [...by.values()]
    .filter((e) => e.creators.size === 1 && !BLOCKED.has(e.id) && ![...e.creators.values()].some((c) => BLOCKED.has(c.id) || BLOCKED_NAMES.test(c.en)))
    .map((e) => ({ ...e, creator: [...e.creators.values()][0] }))
    .filter((e) => !givesAway(lastName(e.creator.de), e.de) && !givesAway(lastName(e.creator.en), e.en));
  // two works with the same title (Botticelli's and Bouguereau's "Birth of Venus") would ask one question with two answers:
  // keep only the best-known work of each title
  const byTitle = new Map();
  for (const e of list) if (!byTitle.has(e.de) || byTitle.get(e.de).links < e.links) byTitle.set(e.de, e);
  list = list.filter((e) => byTitle.get(e.de) === e);
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
  "Q629", // oxygen: discovered independently by Scheele and Priestley, Wikidata names one
]);
const BLOCKED_NAMES = /Hitler|Stalin|Lenin|Mao Zedong|Mussolini|Karl Marx|Friedrich Engels|Moses|Muhammad/; // in case an id above is off
/**
 * Something (?p) and one attribute (?v): painter → movement, mountain → range, lake → country … `t.query` binds ?p, ?v
 * and ?links. Exactly one value; wrong options are other values of the same template; no answer that names the subject.
 * t.ordered: joins in the written order – for some queries the planner picks an order that runs into the 60 s timeout.
 * t.apart(value): wrong options only from other groups – no "Mittelmeer" next to "Adriatisches Meer", both would be right.
 */
async function attribute(r, t) {
  const rows = await sparql(`
SELECT ?p ?pLabel ?pLabelEn ?v ?vLabel ?vLabelEn ?links ?iso WHERE {
  ${t.ordered ? 'hint:Query hint:optimizer "None".' : ""}
  ${t.query}
  ${t.valueIso ? "OPTIONAL { ?v wdt:P297 ?iso. }" : ""}
  ${t.noPersonFilter ? "" : "FILTER NOT EXISTS { ?p wdt:P106 ?occ. FILTER(?occ IN (wd:Q82955, wd:Q116, wd:Q47064, wd:Q189290, wd:Q42857)) }"}
  ${LABELS("p", "v")} ${LABELS_EN("p", "v")}
}`);
  const by = new Map();
  for (const x of rows) {
    if (!named(x.pLabel, x.pLabelEn, x.vLabel, x.vLabelEn) || BLOCKED.has(qid(x.p)) || BLOCKED_NAMES.test(x.pLabelEn) || t.exclude?.includes(x.pLabel)) continue;
    // t.normalize: fold sub-labels into one ("Hochrenaissance" → "Renaissance"), so no two options are both right
    const norm = t.normalize?.[x.vLabel];
    if (norm) Object.assign(x, { v: "norm:" + norm[0], vLabel: norm[0], vLabelEn: norm[1] });
    const e = by.get(qid(x.p)) ?? { id: qid(x.p), de: x.pLabel, en: x.pLabelEn, links: +x.links, values: new Map() };
    e.values.set(qid(x.v), { id: qid(x.v), de: x.vLabel, en: x.vLabelEn, iso: x.iso, group: "all" });
    by.set(e.id, e);
  }
  let list = [...by.values()].filter((e) => e.values.size === 1 && !e.de.includes("(")).map((e) => ({ ...e, value: [...e.values.values()][0] }))
    .filter((e) => !CONTESTED.has(e.value.id)); // a place "in Taiwan" or "in Kosovo" is a political statement – left out
  // t.minUses: only values shared by at least that many entries (keeps out one-off labels as answers and options)
  if (t.minUses) {
    const uses = new Map();
    for (const e of list) uses.set(e.value.id, (uses.get(e.value.id) ?? 0) + 1);
    list = list.filter((e) => uses.get(e.value.id) >= t.minUses);
  }
  // t.extra: wrong options only (e.g. the medicine prize: never an answer, but a plausible fourth option)
  const pool = [...new Map([...list.map((e) => [e.value.id, e.value]), ...(t.extra ?? []).map((v) => [v.id, { ...v, group: "all" }])]).values()];
  if (pool.length < 4) return [];
  const keep = list.filter((e) => !givesAway(e.de, e.value.de) && !givesAway(e.value.de, e.de));
  return byFame(keep.map((e) => {
    const id = `${t.prefix}-${e.id}`;
    const o = arrange(id, e.value, wrongOptions(e.value, t.apart ? pool.filter((x) => t.apart(x.de) !== t.apart(e.value.de)) : pool, "all", r));
    return {
      id, category_id: t.cat, min_age: t.minAge, countries: t.valueIso && e.value.iso ? [e.value.iso] : [], tags: t.tags,
      question: t.de(e.de), options: o.de, correct_index: o.correct, explanation: t.deX(e.de, e.value.de),
      source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
      translations: { en: { question: t.en(e.en), options: o.en, explanation: t.enX(e.en, e.value.en) } },
    };
  }), keep.map((e) => e.links));
}
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
  // "Bayern: Wie heißt die Landeshauptstadt?" – states of Germany and Austria, Swiss cantons, US states
  async regions(r) {
    const KINDS = [
      { cls: "Q1221156", iso: "DE", de: "Landeshauptstadt", art: "die", en: "state capital" },
      { cls: "Q261543", iso: "AT", de: "Landeshauptstadt", art: "die", en: "state capital" },
      { cls: "Q23058", iso: "CH", de: "Hauptort", art: "der", en: "capital" },
      { cls: "Q35657", iso: "US", de: "Hauptstadt", art: "die", en: "capital" },
    ];
    const out = [];
    for (const k of KINDS) {
      const rows = await sparql(`
SELECT ?s ?sLabel ?sLabelEn ?v ?vLabel ?vLabelEn ?links WHERE {
  ?s wdt:P31 wd:${k.cls}; wikibase:sitelinks ?links. ?s p:P36 ?st. ?st ps:P36 ?v. FILTER NOT EXISTS { ?st pq:P582 [] }
  ${LABELS("s", "v")} ${LABELS_EN("s", "v")}
}`);
      const by = new Map();
      for (const x of rows) {
        if (!named(x.sLabel, x.sLabelEn, x.vLabel, x.vLabelEn)) continue;
        const e = by.get(qid(x.s)) ?? { id: qid(x.s), de: x.sLabel, en: x.sLabelEn, links: +x.links, values: new Map(), k };
        e.values.set(qid(x.v), { id: qid(x.v), de: x.vLabel, en: x.vLabelEn, group: k.iso });
        by.set(e.id, e);
      }
      out.push(...[...by.values()].filter((e) => e.values.size === 1).map((e) => ({ ...e, value: [...e.values.values()][0] })));
    }
    const pool = out.map((e) => e.value);
    const keep = out.filter((e) => e.value.id !== e.id && !givesAway(e.de, e.value.de) && !givesAway(e.value.de, e.de));
    return byFame(keep.map((e) => {
      const id = `wd-reg-${e.id}`;
      const o = arrange(id, e.value, wrongOptions(e.value, pool, e.k.iso, r));
      return {
        id, category_id: "earth", min_age: 10, countries: [e.k.iso], tags: ["Geografie", "Hauptstädte"],
        question: `${e.de}: Wie heißt ${e.k.art} ${e.k.de}?`, options: o.de, correct_index: o.correct,
        explanation: `${e.k.art === "der" ? "Der" : "Die"} ${e.k.de} von ${e.de} ist ${e.value.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `${e.en}: What is the ${e.k.en}?`, options: o.en, explanation: `The ${e.k.en} of ${e.en} is ${e.value.en}.` } },
      };
    }), keep.map((e) => e.links));
  },
  // Olympic Games that have taken place: host city
  async olympics(r) {
    const out = [];
    for (const [cls, de, en] of [["Q159821", "Olympischen Sommerspiele", "Summer Olympics"], ["Q82414", "Olympischen Winterspiele", "Winter Olympics"]]) {
      const rows = await sparql(`
SELECT ?g (YEAR(?start) AS ?year) ?city ?cityLabel ?cityLabelEn WHERE {
  ?g wdt:P3450 wd:${cls}; wdt:P276 ?city; wdt:P580 ?start. FILTER(YEAR(?start) <= 2024) # editions point to their series
  ?city wdt:P31/wdt:P279* wd:Q515.
  ${LABELS("city")} ${LABELS_EN("city")}
}`);
      const by = new Map();
      for (const x of rows) {
        if (!named(x.cityLabel, x.cityLabelEn)) continue;
        const e = by.get(qid(x.g)) ?? { id: qid(x.g), year: +x.year, cities: new Map(), de, en };
        e.cities.set(qid(x.city), { id: qid(x.city), de: x.cityLabel, en: x.cityLabelEn, group: de });
        by.set(e.id, e);
      }
      out.push(...[...by.values()].filter((e) => e.cities.size === 1).map((e) => ({ ...e, city: [...e.cities.values()][0] })));
    }
    const pool = [...new Map(out.map((e) => [e.city.id, e.city])).values()];
    return out.map((e) => {
      const id = `wd-olym-${e.id}`;
      const o = arrange(id, e.city, wrongOptions(e.city, pool, e.de, r));
      return {
        id, category_id: "sport", difficulty: e.year >= 1980 ? 1 : e.year >= 1948 ? 2 : 3, min_age: 10, countries: [], tags: ["Olympia"],
        question: `In welcher Stadt fanden die ${e.de} ${e.year} statt?`, options: o.de, correct_index: o.correct,
        explanation: `Die ${e.de} ${e.year} fanden in ${e.city.de} statt.`,
        source_name: `Wikidata: ${e.de} ${e.year}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `Which city hosted the ${e.year} ${e.en}?`, options: o.en, explanation: `The ${e.year} ${e.en} were held in ${e.city.en}.` } },
      };
    });
  },
  // men's football World Cups that have taken place: host country and winner
  async worldcups(r) {
    const rows = await sparql(`
SELECT ?w (YEAR(?start) AS ?year) ?p ?c ?cLabel ?cLabelEn WHERE {
  ?w wdt:P3450 wd:Q19317; wdt:P580 ?start. FILTER(YEAR(?start) <= 2022) # editions point to their series
  { ?w wdt:P17 ?c. BIND("host" AS ?p) } UNION { ?w wdt:P1346 ?team. ?team wdt:P17 ?c. BIND("winner" AS ?p) }
  ${LABELS("c")} ${LABELS_EN("c")}
}`);
    const by = new Map();
    for (const x of rows) {
      // England, Scotland … play as their own teams – Wikidata gives the United Kingdom, which would be wrong here
      if (!named(x.cLabel, x.cLabelEn) || qid(x.c) === "Q145") continue;
      const e = by.get(qid(x.w)) ?? { id: qid(x.w), year: +x.year, host: new Map(), winner: new Map() };
      e[x.p].set(qid(x.c), { id: qid(x.c), de: x.cLabel, en: x.cLabelEn, group: "all" });
      by.set(e.id, e);
    }
    const list = [...by.values()];
    const pool = [...new Map(list.flatMap((e) => [...e.host.values(), ...e.winner.values()]).map((c) => [c.id, c])).values()];
    const cards = [];
    for (const e of list) {
      const diff = e.year >= 1990 ? 1 : e.year >= 1966 ? 2 : 3;
      if (e.host.size === 1 && e.winner.size === 1) { // a winner marks the final tournament (not a qualification)
        const c = [...e.host.values()][0], id = `wd-wch-${e.id}`, o = arrange(id, c, wrongOptions(c, pool, "all", r));
        cards.push({ id, category_id: "sport", difficulty: diff, min_age: 10, countries: [], tags: ["Fußball", "Weltmeisterschaft"],
          question: `In welchem Land fand die Fußball-Weltmeisterschaft der Männer ${e.year} statt?`, options: o.de, correct_index: o.correct,
          explanation: `Gastgeber der Fußball-WM ${e.year} war ${c.de}.`, source_name: `Wikidata: Fußball-Weltmeisterschaft ${e.year}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
          translations: { en: { question: `Which country hosted the ${e.year} men's FIFA World Cup?`, options: o.en, explanation: `The ${e.year} World Cup was hosted by ${c.en}.` } } });
      }
      if (e.winner.size === 1) {
        const c = [...e.winner.values()][0], id = `wd-wcw-${e.id}`, o = arrange(id, c, wrongOptions(c, pool, "all", r));
        cards.push({ id, category_id: "sport", difficulty: diff, min_age: 10, countries: [], tags: ["Fußball", "Weltmeisterschaft"],
          question: `Welches Land wurde ${e.year} Fußball-Weltmeister der Männer?`, options: o.de, correct_index: o.correct,
          explanation: `${e.year} gewann ${c.de} die Fußball-Weltmeisterschaft.`, source_name: `Wikidata: Fußball-Weltmeisterschaft ${e.year}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
          translations: { en: { question: `Which country won the ${e.year} men's FIFA World Cup?`, options: o.en, explanation: `${c.en} won the ${e.year} World Cup.` } } });
      }
    }
    return cards;
  },
  // countries with exactly one official language that does not give itself away (Frankreich → Französisch)
  async languages(r) {
    const list = await countryValues("P37");
    const pool = [...new Map(list.map((e) => [e.value.id, { ...e.value, group: "all" }])).values()];
    const keep = list.filter((e) => e.links >= 150 && !givesAway(e.de, e.value.de) && !givesAway(e.en, e.value.en));
    return byFame(keep.map((e) => {
      const id = `wd-lang-${e.id}`;
      const o = arrange(id, e.value, wrongOptions(e.value, pool, "all", r));
      return {
        id, category_id: "language", min_age: 10, countries: [e.iso], tags: ["Sprachen", "Länder"],
        question: `${e.de}: Welche Sprache ist dort Amtssprache?`, options: o.de, correct_index: o.correct,
        explanation: `Amtssprache von ${e.de} ist ${e.value.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `${e.en}: What is the official language there?`, options: o.en, explanation: `The official language of ${e.en} is ${e.value.en}.` } },
      };
    }), keep.map((e) => e.links));
  },
  // well-known companies: country of their headquarters
  async companies(r) {
    const rows = await sparql(`
SELECT ?f ?fLabel ?fLabelEn ?links ?c WHERE {
  ?f wdt:P31 ?type; wikibase:sitelinks ?links. FILTER(?type IN (wd:Q4830453, wd:Q891723, wd:Q6881511, wd:Q783794)) FILTER(?links >= 70)
  ?f wdt:P159 ?hq. ?hq wdt:P17 ?c. FILTER NOT EXISTS { ?f wdt:P576 [] }
  ${LABELS("f")} ${LABELS_EN("f")}
}`);
    const states = new Map((await sparql(`
SELECT ?c ?cLabel ?cLabelEn ?iso WHERE { ?c wdt:P31 wd:Q3624078; wdt:P297 ?iso. ${LABELS("c")} ${LABELS_EN("c")} }`)).map((x) => [qid(x.c), x]));
    const by = new Map();
    for (const x of rows) {
      const c = states.get(qid(x.c));
      if (!c || !named(x.fLabel, x.fLabelEn)) continue;
      const e = by.get(qid(x.f)) ?? { id: qid(x.f), de: x.fLabel, en: x.fLabelEn, links: +x.links, countries: new Map() };
      e.countries.set(qid(x.c), { id: qid(x.c), de: c.cLabel, en: c.cLabelEn, iso: c.iso, group: "all" });
      by.set(e.id, e);
    }
    const list = [...by.values()].filter((e) => e.countries.size === 1).map((e) => ({ ...e, country: [...e.countries.values()][0] }));
    const pool = [...new Map(list.map((e) => [e.country.id, e.country])).values()];
    const keep = list.filter((e) => !givesAway(e.country.de, e.de) && !givesAway(e.country.en, e.en));
    return byFame(keep.map((e) => {
      const id = `wd-firm-${e.id}`;
      const o = arrange(id, e.country, wrongOptions(e.country, pool, "all", r));
      return {
        id, category_id: "business", min_age: 10, countries: [e.country.iso], tags: ["Unternehmen"],
        question: `In welchem Land hat das Unternehmen „${e.de}“ seinen Hauptsitz?`, options: o.de, correct_index: o.correct,
        explanation: `„${e.de}“ hat seinen Hauptsitz in ${e.country.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `In which country does the company "${e.en}" have its headquarters?`, options: o.en, explanation: `"${e.en}" is headquartered in ${e.country.en}.` } },
      };
    }), keep.map((e) => e.links));
  },
  // "Peru: Auf welchem Kontinent liegt das Land?" – countries on exactly one continent (easy, also for children)
  async continents(r) {
    const list = await countryValues("P30");
    const pool = [...new Map(list.map((e) => [e.value.id, { ...e.value, group: "all" }])).values()].filter((c) => c.id !== "Q51"); // not Antarctica
    return byFame(list.filter((e) => e.links >= 150).map((e) => {
      const id = `wd-cont-${e.id}`;
      const o = arrange(id, e.value, wrongOptions(e.value, pool, "all", r));
      return {
        id, category_id: "earth", min_age: 6, countries: [e.iso], tags: ["Geografie", "Kontinente"],
        question: `${e.de}: Auf welchem Kontinent liegt das Land?`, options: o.de, correct_index: o.correct,
        explanation: `${e.de} liegt in ${e.value.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `${e.en}: Which continent is the country in?`, options: o.en, explanation: `${e.en} is in ${e.value.en}.` } },
      };
    }), list.filter((e) => e.links >= 150).map((e) => e.links));
  },
  // highest point of a country (P610)
  async summits(r) {
    const list = await countryValues("P610");
    const pool = list.map((e) => ({ ...e.value, group: e.cont }));
    const keep = list.filter((e) => e.links >= 150 && !givesAway(e.de, e.value.de) && !givesAway(e.en, e.value.en));
    return byFame(keep.map((e) => {
      const id = `wd-peak-${e.id}`;
      const o = arrange(id, e.value, wrongOptions(e.value, pool, e.cont, r));
      return {
        id, category_id: "earth", min_age: 10, countries: [e.iso], tags: ["Geografie", "Berge"],
        question: `${e.de}: Wie heißt der höchste Punkt des Landes?`, options: o.de, correct_index: o.correct,
        explanation: `Der höchste Punkt von ${e.de} ist ${e.value.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `${e.en}: What is the country's highest point?`, options: o.en, explanation: `The highest point of ${e.en} is ${e.value.en}.` } },
      };
    }), keep.map((e) => e.links));
  },
  // country code top-level domains (.de, .fr …)
  async domains(r) {
    const list = (await countryValues("P78")).filter((e) => /^\.[a-z]{2}$/.test(e.value.en));
    const pool = list.map((e) => ({ ...e.value, de: e.value.en, group: e.cont }));
    return byFame(list.filter((e) => e.links >= 150).map((e) => {
      const id = `wd-tld-${e.id}`;
      const answer = { ...e.value, de: e.value.en };
      const o = arrange(id, answer, wrongOptions(answer, pool, e.cont, r));
      return {
        id, category_id: "technology", min_age: 10, countries: [e.iso], tags: ["Internet", "Länder"],
        question: `${e.de}: Mit welcher Endung enden Internetadressen aus diesem Land?`, options: o.de, correct_index: o.correct,
        explanation: `Die Länderendung von ${e.de} ist ${answer.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `${e.en}: Which ending do web addresses from this country have?`, options: o.en, explanation: `The country code domain of ${e.en} is ${answer.en}.` } },
      };
    }), list.filter((e) => e.links >= 150).map((e) => e.links));
  },
  // moons and the planet they orbit
  async moons(r) {
    const PLANETS = ["Q111", "Q319", "Q193", "Q324", "Q332", "Q2"]; // Mars, Jupiter, Saturn, Uranus, Neptune, Earth
    const rows = await sparql(`
SELECT ?m ?mLabel ?mLabelEn ?p ?pLabel ?pLabelEn ?links WHERE {
  VALUES ?p { ${PLANETS.map((p) => "wd:" + p).join(" ")} }
  ?m wdt:P397 ?p; wdt:P31/wdt:P279* wd:Q2537; wikibase:sitelinks ?links. FILTER(?links >= 55)
  ${LABELS("m", "p")} ${LABELS_EN("m", "p")}
}`);
    // not the Moon itself, no numbered moons (S/2011 J 2)
    const list = [...new Map(rows.filter((x) => named(x.mLabel, x.mLabelEn, x.pLabel, x.pLabelEn) && qid(x.m) !== "Q405" && !/[0-9/]/.test(x.mLabel)).map((x) => [qid(x.m), { id: qid(x.m), de: x.mLabel.replace(/^\S+ [IVXL]+ /, ""), en: x.mLabelEn.replace(/^\S+ [IVXL]+ /, ""), links: +x.links, planet: { id: qid(x.p), de: x.pLabel, en: x.pLabelEn, group: "all" } }])).values()];
    const pool = [...new Map(list.map((e) => [e.planet.id, e.planet])).values()];
    return byFame(list.map((e) => {
      const id = `wd-moon-${e.id}`;
      const o = arrange(id, e.planet, wrongOptions(e.planet, pool, "all", r));
      return {
        id, category_id: "science", min_age: 10, countries: [], tags: ["Weltraum", "Monde"],
        question: `Um welchen Planeten kreist der Mond „${e.de}“?`, options: o.de, correct_index: o.correct,
        explanation: `${e.de} ist ein Mond des ${e.planet.de === "Erde" ? "Planeten Erde" : `Planeten ${e.planet.de}`}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `Which planet does the moon "${e.en}" orbit?`, options: o.en, explanation: `${e.en} is a moon of ${e.planet.en}.` } },
      };
    }), list.map((e) => e.links));
  },
  // (a rivers-by-continent template was tried: Wikidata rarely gives rivers a continent – left out)
  // elements by atomic number (the first 36: the ones people meet at school)
  async atomicnumbers(r) {
    const rows = await sparql(`
SELECT ?e ?eLabel ?eLabelEn ?num WHERE { ?e wdt:P31 wd:Q11344; wdt:P1086 ?num. FILTER(?num <= 36) ${LABELS("e")} ${LABELS_EN("e")} }`);
    const list = [...new Map(rows.filter((x) => named(x.eLabel, x.eLabelEn)).map((x) => [qid(x.e), { id: qid(x.e), de: x.eLabel, en: x.eLabelEn, num: +x.num }])).values()];
    const pool = list.map((e) => ({ ...e, group: String(Math.floor((e.num - 1) / 6)) }));
    return list.map((e) => {
      const id = `wd-z-${e.id}`;
      const answer = pool.find((p) => p.id === e.id);
      const o = arrange(id, answer, wrongOptions(answer, pool, answer.group, r));
      return {
        id, category_id: "science", difficulty: e.num <= 10 ? 1 : e.num <= 20 ? 2 : 3, min_age: 10, countries: [], tags: ["Chemie", "Elemente"],
        question: `Welches chemische Element hat die Ordnungszahl ${e.num}?`, options: o.de, correct_index: o.correct,
        explanation: `${e.de} hat die Ordnungszahl ${e.num}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `Which chemical element has atomic number ${e.num}?`, options: o.en, explanation: `${e.en} has atomic number ${e.num}.` } },
      };
    });
  },
  // more works and their creators
  compositions: (r) => works(r, { match: "?w wdt:P86 ?x; wdt:P31/wdt:P279* wd:Q2188189. ?x wikibase:sitelinks ?xl. FILTER(?xl >= 70) FILTER NOT EXISTS { ?w wdt:P136 wd:Q1344 } FILTER NOT EXISTS { ?w wdt:P31 wd:Q23691 }", prop: "P86", minLinks: 30, tags: ["Musik", "Klassik"], prefix: "wd-comp",
    de: (w) => `Wer komponierte „${w}“?`, en: (w) => `Who composed "${w}"?`,
    deX: (w, c, y) => `„${w}“${inYear(y)} stammt von ${c}.`, enX: (w, c, y) => `"${w}"${inYearEn(y)} was composed by ${c}.` }),
  // (sculptures and inventions were tried: too few sculptures, and the inventions mixed in drugs and obscure stars – left out)
  // "In welcher Stadt steht …?" – famous towers, bridges, cathedrals, museums and palaces
  async structures(r) {
    const rows = await sparql(`
SELECT ?s ?sLabel ?sLabelEn ?links ?city ?cityLabel ?cityLabelEn ?iso WHERE {
  VALUES ?type { wd:Q12518 wd:Q11303 wd:Q12280 wd:Q2977 wd:Q33506 wd:Q16560 wd:Q23413 wd:Q4989906 }
  ?s wdt:P31 ?type; wikibase:sitelinks ?links; wdt:P131 ?city. FILTER(?links >= 60)
  VALUES ?ct { wd:Q515 wd:Q1549591 wd:Q1637706 wd:Q5119 wd:Q200250 } ?city wdt:P31 ?ct; wdt:P17 ?c. ?c wdt:P297 ?iso.
  ${LABELS("s", "city")} ${LABELS_EN("s", "city")}
}`);
    const by = new Map();
    for (const x of rows) {
      if (!named(x.sLabel, x.sLabelEn, x.cityLabel, x.cityLabelEn)) continue;
      const e = by.get(qid(x.s)) ?? { id: qid(x.s), de: x.sLabel, en: x.sLabelEn, links: +x.links, cities: new Map() };
      e.cities.set(qid(x.city), { id: qid(x.city), de: x.cityLabel, en: x.cityLabelEn, iso: x.iso, group: x.iso });
      by.set(e.id, e);
    }
    const list = [...by.values()].filter((e) => e.cities.size === 1).map((e) => ({ ...e, city: [...e.cities.values()][0] }));
    const pool = [...new Map(list.map((e) => [e.city.id, e.city])).values()];
    const keep = list.filter((e) => !givesAway(e.city.de, e.de) && !givesAway(e.city.en, e.en));
    return byFame(keep.map((e) => {
      const id = `wd-bldg-${e.id}`;
      const o = arrange(id, e.city, wrongOptions(e.city, pool, e.city.iso, r));
      return {
        id, category_id: "culture", min_age: 10, countries: [e.city.iso], tags: ["Bauwerke", "Städte"],
        question: `In welcher Stadt steht „${e.de}“?`, options: o.de, correct_index: o.correct,
        explanation: `„${e.de}“ steht in ${e.city.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `Which city is "${e.en}" in?`, options: o.en, explanation: `"${e.en}" is in ${e.city.en}.` } },
      };
    }), keep.map((e) => e.links));
  },
  // "An welchem Fluss liegt Wien?" – capitals next to exactly one river
  async capitalrivers(r) {
    const rows = await sparql(`
SELECT ?city ?cityLabel ?cityLabelEn ?links ?river ?riverLabel ?riverLabelEn ?iso WHERE {
  ?c wdt:P31 wd:Q3624078; wdt:P36 ?city; wdt:P297 ?iso.
  ?city wdt:P206 ?river; wikibase:sitelinks ?links. ?river wdt:P31/wdt:P279* wd:Q4022.
  ${LABELS("city", "river")} ${LABELS_EN("city", "river")}
}`);
    const by = new Map();
    for (const x of rows) {
      if (!named(x.cityLabel, x.cityLabelEn, x.riverLabel, x.riverLabelEn)) continue;
      const e = by.get(qid(x.city)) ?? { id: qid(x.city), de: x.cityLabel, en: x.cityLabelEn, links: +x.links, iso: x.iso, rivers: new Map() };
      e.rivers.set(qid(x.river), { id: qid(x.river), de: x.riverLabel, en: x.riverLabelEn, group: "all" });
      by.set(e.id, e);
    }
    const list = [...by.values()].filter((e) => e.rivers.size === 1).map((e) => ({ ...e, river: [...e.rivers.values()][0] }));
    const pool = [...new Map(list.map((e) => [e.river.id, e.river])).values()];
    const keep = list.filter((e) => !givesAway(e.de, e.river.de) && !givesAway(e.river.de, e.de));
    return byFame(keep.map((e) => {
      const id = `wd-crivr-${e.id}`;
      const o = arrange(id, e.river, wrongOptions(e.river, pool, "all", r));
      return {
        id, category_id: "earth", min_age: 10, countries: [e.iso], tags: ["Geografie", "Flüsse"],
        question: `An welchem Fluss liegt die Hauptstadt ${e.de}?`, options: o.de, correct_index: o.correct,
        explanation: `${e.de} liegt am Fluss ${e.river.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: `Which river is the capital ${e.en} on?`, options: o.en, explanation: `${e.en} lies on the ${e.river.en}.` } },
      };
    }), keep.map((e) => e.links));
  },
  // "Zu welcher Kunstrichtung gehört Claude Monet?" – painters who died before 1950, exactly one movement
  async movements(r) {
    return attribute(r, {
      query: `?p wdt:P106 wd:Q1028181; wdt:P570 ?died; wdt:P135 ?v; wikibase:sitelinks ?links. FILTER(YEAR(?died) < 1950 && ?links >= 60)`,
      prefix: "wd-move2", cat: "culture", tags: ["Kunst", "Malerei"], minAge: 13,
      normalize: Object.fromEntries([
        ...["Italienische Renaissance", "Deutsche Renaissance", "Frührenaissance", "Hochrenaissance", "Nordische Renaissance", "Manierismus"].map((k) => [k, ["Renaissance", "Renaissance"]]),
        ["barocke Malerei", ["Barock", "Baroque"]],
      ]),
      de: (p) => `Malerei: Zu welcher Kunstrichtung wird ${p} gezählt?`, en: (p) => `Painting: Which art movement is ${p} associated with?`, minUses: 2,
      deX: (p, v) => `${p} wird zur Kunstrichtung ${v} gezählt.`, enX: (p, v) => `${p} is associated with ${v}.`,
    });
  },
  // Nobel laureates in physics, chemistry and literature who died before 1950: the subject
  async nobel(r) {
    return attribute(r, {
      query: `VALUES ?v { wd:Q38104 wd:Q44585 wd:Q37922 } ?p wdt:P166 ?v; wdt:P570 ?died; wikibase:sitelinks ?links. FILTER(YEAR(?died) < 1950 && ?links >= 40)`,
      prefix: "wd-nobel", cat: "science", tags: ["Nobelpreis", "Wissenschaft"], minAge: 13,
      extra: [{ id: "Q80061", de: "Nobelpreis für Physiologie oder Medizin", en: "Nobel Prize in Physiology or Medicine" }],
      de: (p) => `Für welches Fach erhielt ${p} den Nobelpreis?`, en: (p) => `In which field was ${p} awarded the Nobel Prize?`,
      deX: (p, v) => `${p} erhielt den ${v}.`, enX: (p, v) => `${p} was awarded the ${v}.`,
    });
  },
  // (a writing-system template was tried: "Latin script" and "Latin alphabet" both came up as options – left out)
  // (a mountain-range template was published and withdrawn on 26.10.2026: wrong pairs such as Mount Kenya → Kilimanjaro, and
  // sub-ranges next to their parent range – Mahalangur Himal and Himalaya would both be right)
  // lakes that lie in exactly one country
  async lakes(r) {
    return attribute(r, {
      query: `?p wdt:P31 wd:Q23397; wdt:P17 ?v; wikibase:sitelinks ?links. ?v wdt:P31 wd:Q3624078. FILTER(?links >= 50)`,
      prefix: "wd-lake", ordered: true, cat: "earth", tags: ["Geografie", "Seen"], minAge: 10, noPersonFilter: true, valueIso: true,
      de: (p) => `In welchem Land liegt der See „${p}“?`, en: (p) => `Which country is the lake "${p}" in?`,
      deX: (p, v) => `Der See „${p}“ liegt in diesem Land: ${v}.`, enX: (p, v) => `The lake "${p}" is in this country: ${v}.`,
    });
  },
  // (a professions template was tried: Wikidata often lists only some professions – Pavlov came out as a chemist –
  // and has no female forms; left out)
  // "Zu welchem Sternbild gehört Sirius?"
  async constellations(r) {
    return attribute(r, {
      query: `?p wdt:P59 ?v; wikibase:sitelinks ?links. FILTER(?links >= 40) ?p wdt:P31/wdt:P279* wd:Q523.`,
      prefix: "wd-star", ordered: true, cat: "science", tags: ["Weltraum", "Sterne"], minAge: 10, noPersonFilter: true,
      de: (p) => `Zu welchem Sternbild gehört der Stern „${p}“?`, en: (p) => `Which constellation is the star "${p}" in?`,
      deX: (p, v) => `Der Stern „${p}“ gehört zum Sternbild ${v}.`, enX: (p, v) => `The star "${p}" is in the constellation ${v}.`,
    });
  },
  // car brands and the country they come from
  async carbrands(r) {
    return attribute(r, {
      query: `?p wdt:P31 wd:Q786820; wdt:P17 ?v; wikibase:sitelinks ?links. ?v wdt:P31 wd:Q3624078. FILTER(?links >= 40) FILTER NOT EXISTS { ?p wdt:P576 [] }`,
      prefix: "wd-car", ordered: true, exclude: ["Volvo Car Corporation", "smart", "Stellantis North America", "ELBO"], cat: "business", tags: ["Unternehmen", "Autos"], minAge: 10, noPersonFilter: true, valueIso: true,
      de: (p) => `Aus welchem Land stammt der Autohersteller „${p}“?`, en: (p) => `Which country does the carmaker "${p}" come from?`,
      deX: (p, v) => `Der Autohersteller „${p}“ stammt aus diesem Land: ${v}.`, enX: (p, v) => `The carmaker "${p}" comes from this country: ${v}.`,
    });
  },
  // who discovered an element (one discoverer only, died before 1950)
  async discoverers(r) {
    return attribute(r, {
      query: `?p wdt:P31 wd:Q11344; wdt:P61 ?v; wikibase:sitelinks ?links. ?v wdt:P570 ?died. FILTER(YEAR(?died) < 1950) FILTER NOT EXISTS { ?p wdt:P61 ?other. FILTER(?other != ?v) }`,
      prefix: "wd-disc", cat: "science", tags: ["Chemie", "Elemente"], minAge: 13, noPersonFilter: true,
      de: (p) => `Wer entdeckte das chemische Element ${p}?`, en: (p) => `Who discovered the chemical element ${p}?`,
      deX: (p, v) => `Das Element ${p} wurde von ${v} entdeckt.`, enX: (p, v) => `${p} was discovered by ${v}.`,
    });
  },
  // volcanoes and waterfalls in exactly one country, deserts on exactly one continent
  async volcanoes(r) {
    return attribute(r, {
      query: `?p wdt:P31 ?t; wdt:P17 ?v; wikibase:sitelinks ?links. VALUES ?t { wd:Q8072 wd:Q169358 wd:Q212057 } ?v wdt:P31 wd:Q3624078. FILTER(?links >= 40)`,
      prefix: "wd-volc", ordered: true, exclude: ["Kasbek", "Amsterdam-Insel", "Sankt-Paul-Insel", "Ball’s Pyramid", "Inaccessible"], cat: "earth", tags: ["Geografie", "Vulkane"], minAge: 10, noPersonFilter: true, valueIso: true,
      de: (p) => `In welchem Land liegt der Vulkan „${p}“?`, en: (p) => `Which country is the volcano "${p}" in?`,
      deX: (p, v) => `Der Vulkan „${p}“ liegt in diesem Land: ${v}.`, enX: (p, v) => `The volcano "${p}" is in this country: ${v}.`,
    });
  },
  async waterfalls(r) {
    return attribute(r, {
      query: `?p wdt:P31 wd:Q34038; wdt:P17 ?v; wikibase:sitelinks ?links. ?v wdt:P31 wd:Q3624078. FILTER(?links >= 30)`,
      prefix: "wd-fall", ordered: true, exclude: ["Livingstonefälle"], cat: "earth", tags: ["Geografie", "Wasserfälle"], minAge: 10, noPersonFilter: true, valueIso: true,
      de: (p) => `In welchem Land liegt der Wasserfall „${p}“?`, en: (p) => `Which country is the waterfall "${p}" in?`,
      deX: (p, v) => `Der Wasserfall „${p}“ liegt in diesem Land: ${v}.`, enX: (p, v) => `The waterfall "${p}" is in this country: ${v}.`,
    });
  },
  // (deserts and football clubs were tried: too few deserts, partly not deserts; clubs came out with the city of their
  // stadium, not their home – left out)
  // musical instruments and their family
  async instruments(r) {
    return attribute(r, {
      query: `VALUES ?v { wd:Q1798603 wd:Q173453 wd:Q133163 wd:Q52954 } ?p wdt:P279+ ?v; wikibase:sitelinks ?links. FILTER(?links >= 40)`,
      prefix: "wd-instr", cat: "culture", tags: ["Musik", "Instrumente"], minAge: 6, noPersonFilter: true,
      // wrong in Wikidata (harmonica as keyboard, jaw harp as string instrument), not an instrument, or fits two families
      exclude: ["Mundharmonika", "Bandoneon", "Akkordeon", "Zymbal", "Stimmgabel", "Maultrommel", "Streichinstrument", "Fender Stratocaster", "Drehorgel"],
      de: (p) => `Zu welcher Gruppe von Musikinstrumenten gehört das Instrument „${p}“?`, en: (p) => `Which family of musical instruments does the "${p}" belong to?`,
      deX: (p, v) => `Das Instrument „${p}“ gehört zur Gruppe ${v}.`, enX: (p, v) => `The ${p} belongs to the family: ${v}.`,
    });
  },
  // "Zu welchem Land gehört diese Flagge?" – the flag picture (P41) is added by commons-images.mjs; a card without a
  // clearly free picture is dropped there (needs_image)
  async flags(r) {
    const rows = await sparql(`
SELECT ?c ?cLabel ?cLabelEn ?iso ?cont ?links WHERE {
  ?c wdt:P31 wd:Q3624078; wdt:P297 ?iso; wdt:P30 ?cont; wdt:P41 []; wikibase:sitelinks ?links. FILTER NOT EXISTS { ?c wdt:P576 [] }
  ${LABELS("c")} ${LABELS_EN("c")}
}`);
    const list = [...new Map(rows.filter((x) => named(x.cLabel, x.cLabelEn) && !DISPUTED.has(qid(x.c))).map((x) => [qid(x.c), { id: qid(x.c), de: x.cLabel, en: x.cLabelEn, iso: x.iso, group: qid(x.cont), links: +x.links }])).values()];
    return byFame(list.map((e) => {
      const id = `wd-flag-${e.id}`;
      const o = arrange(id, e, wrongOptions(e, list, e.group, r));
      return {
        id, category_id: "earth", min_age: 6, countries: [e.iso], tags: ["Geografie", "Flaggen"], needs_image: true,
        question: "Zu welchem Land gehört diese Flagge?", options: o.de, correct_index: o.correct,
        explanation: `Das ist die Flagge von ${e.de}.`,
        source_name: `Wikidata: ${e.de}`, source_url: `https://www.wikidata.org/wiki/${e.id}`,
        translations: { en: { question: "Which country does this flag belong to?", options: o.en, explanation: `This is the flag of ${e.en}.` } },
      };
    }), list.map((e) => e.links));
  },
  // (a neighbouring-countries template was tried: Wikidata's shared borders include sea borders – Gabon "borders" Angola)
  // (an animal-class template was tried: the taxon tree in Wikidata is too deep and uneven – queries time out or miss
  // whole classes such as reptiles; needs another approach)
  // islands, national parks, mountains and big cities in exactly one country (border peaks and split islands drop out).
  // Names that already say what they are ("Insel Skye", "Nationalpark Teide", "Mount Cook") are not repeated in the question.
  async islands(r) {
    const said = (p) => /insel|island|isle|atoll/i.test(p);
    return attribute(r, {
      query: `?p wdt:P31 wd:Q23442; wikibase:sitelinks ?links. FILTER(?links >= 50) ?p wdt:P17 ?v. ?v wdt:P31 wd:Q3624078.`,
      prefix: "wd-isl", ordered: true, cat: "earth", tags: ["Geografie", "Inseln"], minAge: 10, noPersonFilter: true, valueIso: true,
      // Utøya (attack of 2011) and the Snake Island (war of 2022) are no quiz material; sovereignty disputed or the island split
      exclude: ["Utøya", "Schlangeninsel", "Diego Garcia", "Südgeorgien", "Navassa", "Peñón de Vélez de la Gomera", "St. Martin"],
      de: (p) => (said(p) ? `Zu welchem Land gehört „${p}“?` : `Zu welchem Land gehört die Insel „${p}“?`),
      en: (p) => (said(p) ? `Which country does "${p}" belong to?` : `Which country does the island "${p}" belong to?`),
      deX: (p, v) => (said(p) ? `„${p}“ gehört zu diesem Land: ${v}.` : `Die Insel „${p}“ gehört zu diesem Land: ${v}.`),
      enX: (p, v) => (said(p) ? `"${p}" belongs to this country: ${v}.` : `The island "${p}" belongs to this country: ${v}.`),
    });
  },
  async parks(r) {
    const said = (p) => /nationalpark|national park/i.test(p);
    return attribute(r, {
      query: `?p wdt:P31 wd:Q46169; wikibase:sitelinks ?links. FILTER(?links >= 30) ?p wdt:P17 ?v. ?v wdt:P31 wd:Q3624078.`,
      prefix: "wd-park", ordered: true, cat: "earth", tags: ["Geografie", "Nationalparks"], minAge: 10, noPersonFilter: true, valueIso: true,
      // two parks of the same name (Canada, USA); Kashmir; forts and excavations that are national parks only by law
      exclude: ["Glacier-Nationalpark", "Deosai-Nationalpark", "Sepphoris", "Gezer", "Fort Jesus", "Nationalpark Brimstone Hill Fortress", "Berg Olymp"],
      de: (p) => (said(p) ? `In welchem Land liegt der „${p}“?` : `In welchem Land liegt der Nationalpark „${p}“?`),
      en: (p) => (said(p) ? `Which country is "${p}" in?` : `Which country is the national park "${p}" in?`),
      deX: (p, v) => (said(p) ? `Der „${p}“ liegt in diesem Land: ${v}.` : `Der Nationalpark „${p}“ liegt in diesem Land: ${v}.`),
      enX: (p, v) => (said(p) ? `"${p}" is in this country: ${v}.` : `The national park "${p}" is in this country: ${v}.`),
    });
  },
  async mountains(r) {
    const said = (p) => /^(Berg|Mount|Mont|Pik) |-Massiv$/i.test(p);
    return attribute(r, {
      query: `?p wdt:P31 wd:Q8502; wikibase:sitelinks ?links. FILTER(?links >= 50) ?p wdt:P17 ?v. ?v wdt:P31 wd:Q3624078.`,
      prefix: "wd-mtn", ordered: true, cat: "earth", tags: ["Geografie", "Berge"], minAge: 10, noPersonFilter: true, valueIso: true,
      // on a border although Wikidata names one country; in disputed Kashmir or East Jerusalem; an island
      exclude: ["K2", "Kasbek", "Belucha", "Gangkhar Puensum", "Nanga Parbat", "Ölberg", "Vulcano"],
      de: (p) => (said(p) ? `In welchem Land steht der „${p}“?` : `In welchem Land steht der Berg „${p}“?`),
      en: (p) => (said(p) ? `Which country is "${p}" in?` : `Which country is the mountain "${p}" in?`),
      deX: (p, v) => (said(p) ? `Der „${p}“ steht in diesem Land: ${v}.` : `Der Berg „${p}“ steht in diesem Land: ${v}.`),
      enX: (p, v) => (said(p) ? `"${p}" is in this country: ${v}.` : `The mountain "${p}" is in this country: ${v}.`),
    });
  },
  // rivers and the sea or ocean they flow into – not an estuary or a bay; a marginal sea and its ocean never stand side by side
  async rivermouths(r) {
    const family = {
      med: ["Mittelmeer", "Adriatisches Meer", "Tyrrhenisches Meer", "Ägäisches Meer", "Thrakisches Meer", "Ionisches Meer", "Ligurisches Meer", "Levantisches Meer", "Balearenmeer", "Alboránmeer"],
      atl: ["Atlantischer Ozean", "Nordsee", "Ostsee", "Ärmelkanal", "Irische See", "Karibisches Meer", "Golf von Mexiko", "Keltische See", "Golf von Biskaya", "Sargassosee"],
      pac: ["Pazifischer Ozean", "Beringmeer", "Südchinesisches Meer", "Gelbes Meer", "Ostchinesisches Meer", "Japanisches Meer", "Ochotskisches Meer", "Bohai-Meer"],
      ind: ["Indischer Ozean", "Arabisches Meer", "Persischer Golf", "Golf von Bengalen", "Rotes Meer", "Andamanensee"],
      arc: ["Arktischer Ozean", "Karasee", "Ostsibirische See", "Beaufortsee", "Laptewsee", "Barentssee", "Weißes Meer", "Petschorasee", "Tschuktschensee"],
      black: ["Schwarzes Meer", "Asowsches Meer"],
    };
    const apart = (v) => Object.keys(family).find((k) => family[k].includes(v)) ?? v;
    return attribute(r, {
      query: `?p wdt:P31 wd:Q4022; wikibase:sitelinks ?links. FILTER(?links >= 50) ?p wdt:P403 ?v. ?v wdt:P31 ?vt. VALUES ?vt { wd:Q165 wd:Q9430 wd:Q1286517 wd:Q1973404 }`,
      prefix: "wd-mouth", ordered: true, cat: "earth", tags: ["Geografie", "Flüsse"], minAge: 10, noPersonFilter: true, apart,
      // the Murray ends in the Southern Ocean by Australian count, in the Indian Ocean by others
      exclude: ["Murray River"],
      de: (p) => `In welches Meer oder welchen Ozean mündet der Fluss „${p}“?`, en: (p) => `Which sea or ocean does the river "${p}" flow into?`,
      deX: (p, v) => `Der Fluss „${p}“ mündet hier: ${v}.`, enX: (p, v) => `The river "${p}" flows into: ${v}.`,
    });
  },
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
