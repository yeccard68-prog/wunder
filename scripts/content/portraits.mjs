// Country portraits for the explainer player (scene "portrait"): the map flies to the country, then flag, capital (asked
// first), area, highest point, web ending. No new queries – everything comes from the generated Wikidata files
// (public/gen/capitals, continents, flags, summits, domains) and the areas and peak heights in content/compare.json.
// Output: content/portraits.json (compact rows; texts are built in lib/portraits.ts).
//   node scripts/content/compare.mjs && node scripts/content/portraits.mjs
//
// A portrait needs at least capital, continent and flag; the other facts are shown where they exist.
import fs from "node:fs";

const read = (name) => JSON.parse(fs.readFileSync(`public/gen/${name}.json`, "utf8"));
const byIso = (name) => new Map(read(name).filter((c) => c.countries?.length === 1).map((c) => [c.countries[0], c]));
const answer = (c) => ({ de: c.options[c.correct_index], en: c.translations.en.options[c.correct_index] });
const capitals = byIso("capitals"), continents = byIso("continents"), flags = byIso("flags"), summits = byIso("summits"), domains = byIso("domains");

// areas and peak heights already checked for the comparisons (by Wikidata id of the country / of the mountain)
const area = new Map(), height = new Map(), peakIds = new Map();
for (const row of JSON.parse(fs.readFileSync("content/compare.json", "utf8"))) {
  for (const i of row.items) if (i.sub) peakIds.set(i.sub.de, i.qid);
  for (const i of row.items) (row.kind === "area" ? area : row.kind === "peak" ? height : new Map()).set(i.qid, i.value);
}
const qidOf = (url) => url.split("/").pop();

const rows = [];
for (const [iso, cap] of capitals) {
  const cont = continents.get(iso), flag = flags.get(iso);
  if (!cont || !flag?.image_url) continue;
  const name = { de: cap.question.split(":")[0], en: cap.translations.en.question.split(":")[0] };
  const country = qidOf(cap.source_url);
  const peak = summits.get(iso);
  const peakName = peak && answer(peak);
  const peakQid = peakName && peakIds.get(peakName.de);
  rows.push({
    id: `por-${iso.toLowerCase()}`, iso, qid: country, name, continent: answer(cont), capital: answer(cap),
    capitalOptions: { de: cap.options, en: cap.translations.en.options, correct: cap.correct_index },
    flag: { url: flag.image_url, credit: flag.image_credit, source: flag.image_source },
    ...(area.has(country) ? { area: area.get(country) } : {}),
    ...(peakName ? { peak: { ...peakName, ...(peakQid && height.has(peakQid) ? { height: height.get(peakQid) } : {}) } } : {}),
    ...(domains.get(iso) ? { domain: answer(domains.get(iso)).en } : {}),
  });
}
rows.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync("content/portraits.json", JSON.stringify(rows) + "\n");
console.log(`${rows.length} Länderporträts (${rows.filter((r) => r.area).length} mit Fläche, ${rows.filter((r) => r.peak?.height).length} mit Gipfelhöhe)`);
