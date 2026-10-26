// Size comparisons for the explainer player (scene "compare"): four things drawn to scale side by side – country areas,
// the highest points of countries, planet diameters. Numbers from Wikidata (CC0), every item linked as a source.
// Output: content/compare.json (compact rows; texts are built in lib/compare.ts), shipped with the app.
//   node scripts/content/compare.mjs
//
// Quality rules: only best-rank values in the expected unit, exactly one value per item (or values within 1 %),
// only countries on exactly one continent, no disputed territories, no two items with the same mountain, and the
// largest item at most 25 times the smallest (area) or 6 times (height) – otherwise the small one would vanish.
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
      await new Promise((ok) => setTimeout(ok, 8000 * attempt));
    }
  }
}
const qid = (url) => url.split("/").pop();
const named = (...names) => names.every((n) => n && !/^Q\d+$/.test(n));
const LABELS = (...vars) => `SERVICE wikibase:label { bd:serviceParam wikibase:language "de". ${vars.map((v) => `?${v} rdfs:label ?${v}Label.`).join(" ")} }`;
const LABELS_EN = (...vars) => `SERVICE wikibase:label { bd:serviceParam wikibase:language "en". ${vars.map((v) => `?${v} rdfs:label ?${v}LabelEn.`).join(" ")} }`;

// continents by Wikidata id (Australia/Oceania under both ids)
const CONTINENTS = { Q46: "europe", Q48: "asia", Q15: "africa", Q49: "north-america", Q18: "south-america", Q538: "oceania", Q3960: "oceania", Q55643: "oceania" };
// territories whose borders or status are disputed – left out
const LEFT_OUT = new Set(["Q801", "Q219060", "Q865", "Q1246", "Q40362", "Q23681"]);

/** One value per entry: all best-rank values must agree within 1 %. */
function single(values) {
  const v = [...new Set(values)];
  return v.length && Math.max(...v) <= Math.min(...v) * 1.01 ? v[0] : null;
}

async function countries() {
  const rows = await sparql(`
SELECT ?c ?cLabel ?cLabelEn ?iso ?cont ?links ?area WHERE {
  ?c wdt:P31 wd:Q3624078; wdt:P297 ?iso; wikibase:sitelinks ?links; wdt:P30 ?cont.
  FILTER NOT EXISTS { ?c wdt:P576 [] }
  ?c p:P2046 ?st. ?st a wikibase:BestRank; psv:P2046 [ wikibase:quantityAmount ?area; wikibase:quantityUnit wd:Q712226 ].
  ${LABELS("c")} ${LABELS_EN("c")}
}`);
  const by = new Map();
  for (const r of rows) {
    const id = qid(r.c);
    if (LEFT_OUT.has(id) || !named(r.cLabel, r.cLabelEn)) continue;
    const e = by.get(id) ?? { id, de: r.cLabel, en: r.cLabelEn, iso: r.iso, links: +r.links, conts: new Set(), areas: [] };
    e.conts.add(CONTINENTS[qid(r.cont)] ?? "?");
    e.areas.push(Math.round(+r.area));
    by.set(id, e);
  }
  return [...by.values()].filter((e) => e.conts.size === 1 && !e.conts.has("?")).map((e) => ({ ...e, cont: [...e.conts][0], area: single(e.areas) })).filter((e) => e.area);
}

async function peaks() {
  const rows = await sparql(`
SELECT ?c ?m ?mLabel ?mLabelEn ?h WHERE {
  ?c wdt:P31 wd:Q3624078; wdt:P610 ?m. FILTER NOT EXISTS { ?c wdt:P576 [] }
  ?c p:P610 ?pst. ?pst a wikibase:BestRank; ps:P610 ?m.
  ?m p:P2044 ?st. ?st a wikibase:BestRank; psv:P2044 [ wikibase:quantityAmount ?h; wikibase:quantityUnit wd:Q11573 ].
  ${LABELS("m")} ${LABELS_EN("m")}
}`);
  const by = new Map();
  for (const r of rows) {
    if (!named(r.mLabel, r.mLabelEn)) continue;
    const c = qid(r.c);
    const e = by.get(c) ?? { mountains: new Map() };
    const m = e.mountains.get(qid(r.m)) ?? { id: qid(r.m), de: r.mLabel, en: r.mLabelEn, heights: [] };
    m.heights.push(Math.round(+r.h));
    e.mountains.set(m.id, m);
    by.set(c, e);
  }
  const out = new Map();
  for (const [c, e] of by) {
    if (e.mountains.size !== 1) continue; // two "highest points" – unclear
    const m = [...e.mountains.values()][0];
    const h = single(m.heights);
    if (h && h > 0) out.set(c, { ...m, value: h });
  }
  return out;
}

/** Three partners for an entry: same continent, within the ratio, spread from smaller to larger. */
function partners(e, pool, value, maxRatio, r) {
  const fit = pool.filter((x) => x.id !== e.id && value(x) * maxRatio >= value(e) && value(x) <= value(e) * maxRatio);
  const smaller = fit.filter((x) => value(x) < value(e)), larger = fit.filter((x) => value(x) > value(e));
  const pick = (list) => list.splice(Math.floor(r() * list.length), 1)[0];
  const out = [];
  if (smaller.length) out.push(pick(smaller));
  if (larger.length) out.push(pick(larger));
  const rest = fit.filter((x) => !out.includes(x));
  while (out.length < 3 && rest.length) out.push(pick(rest));
  if (out.length < 3) return null;
  const all = [e, ...out];
  return Math.max(...all.map(value)) <= Math.min(...all.map(value)) * maxRatio ? all : null;
}
/** Shown left to right in a mixed order, so the order does not give away the largest. */
const mixed = (list, r) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const list = await countries();
const known = list.filter((e) => e.links >= 120 && e.area >= 2000);
const rows = [];
for (const e of known) {
  const r = rng(`area-${e.id}`);
  const set = partners(e, known.filter((x) => x.cont === e.cont), (x) => x.area, 25, r);
  if (!set) continue;
  rows.push({ id: `cmp-area-${e.id}`, kind: "area", cont: e.cont, focus: { de: e.de, en: e.en }, countries: [e.iso],
    items: mixed(set, r).map((x) => ({ de: x.de, en: x.en, value: x.area, qid: x.id })) });
}
const tops = await peaks();
const climbers = known.filter((e) => tops.has(e.id)).map((e) => ({ ...e, peak: tops.get(e.id) }));
for (const e of climbers) {
  const r = rng(`peak-${e.id}`);
  const pool = climbers.filter((x) => x.cont === e.cont && x.peak.id !== e.peak.id);
  const set = partners(e, pool, (x) => x.peak.value, 6, r);
  if (!set || new Set(set.map((x) => x.peak.id)).size < 4) continue;
  rows.push({ id: `cmp-peak-${e.id}`, kind: "peak", cont: e.cont, focus: { de: e.de, en: e.en }, countries: [e.iso],
    items: mixed(set, r).map((x) => ({ de: x.de, en: x.en, value: x.peak.value, qid: x.peak.id, sub: { de: x.peak.de, en: x.peak.en } })) });
}
// planets: the mean radius (P2120 with "applies to part: mean"; equator and pole are often stated too) in km, doubled;
// a planet without a "mean" statement counts only when all its best-rank values agree within 1 %
const planets = await sparql(`
SELECT ?p ?pLabel ?pLabelEn ?rad ?mean WHERE {
  VALUES ?p { wd:Q308 wd:Q313 wd:Q2 wd:Q111 wd:Q319 wd:Q193 wd:Q324 wd:Q332 }
  ?p p:P2120 ?st. ?st a wikibase:BestRank; psv:P2120 [ wikibase:quantityAmount ?rad; wikibase:quantityUnit wd:Q828224 ].
  BIND(EXISTS { ?st pq:P518 wd:Q2796622 } AS ?mean)
  ${LABELS("p")} ${LABELS_EN("p")}
}`);
const P = new Map();
for (const x of planets) {
  const e = P.get(qid(x.p)) ?? { id: qid(x.p), de: x.pLabel, en: x.pLabelEn, r: [], mean: [] };
  e.r.push(Math.round(+x.rad));
  if (x.mean === "true") e.mean.push(Math.round(+x.rad));
  P.set(e.id, e);
}
const planet = (id) => { const e = P.get(id); const v = e && single(e.mean.length ? e.mean : e.r); return v ? { de: e.de, en: e.en, value: v * 2, qid: id } : null; };
for (const [id, set] of [["inner", ["Q308", "Q313", "Q2", "Q111"]], ["outer", ["Q2", "Q319", "Q193", "Q324"]], ["giants", ["Q319", "Q193", "Q324", "Q332"]]]) {
  const items = set.map(planet);
  if (items.every(Boolean)) rows.push({ id: `cmp-planet-${id}`, kind: "planet", items: mixed(items, rng(`planet-${id}`)) });
}
fs.writeFileSync("content/compare.json", JSON.stringify(rows) + "\n");
const count = (k) => rows.filter((x) => x.kind === k).length;
console.log(`${rows.length} Vergleiche: ${count("area")} Flächen, ${count("peak")} Gipfel, ${count("planet")} Planeten`);
