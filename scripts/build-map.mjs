// Builds the small world map for cards about a country: public/map/world.json = { width, height, paths: { ISO2: "M…" },
// dots: { ISO2: [x, y] } }. Shapes from Natural Earth (public domain) via the world-atlas package (110m – coarse, so the
// file stays small); countries too small for that scale get a dot at their coordinates (from Wikidata, CC0).
//   node scripts/build-map.mjs
import fs from "node:fs";
import { feature } from "topojson-client";

const W = 1000, TOP = 84, BOTTOM = -58; // equirectangular, without Antarctica
const H = Math.round((W * (TOP - BOTTOM)) / 360);
const x = (lon) => Math.round(((lon + 180) / 360) * W * 10) / 10;
const y = (lat) => Math.round(((TOP - lat) / (TOP - BOTTOM)) * H * 10) / 10;

const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"));
const world = feature(topo, topo.objects.countries);

async function sparql(query) {
  const r = await fetch("https://query.wikidata.org/sparql", { method: "POST", headers: { "user-agent": "wunder-content/1.0", accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded" }, body: "query=" + encodeURIComponent(query) });
  if (!r.ok) throw new Error(`Wikidata ${r.status}`);
  return (await r.json()).results.bindings;
}
// ISO numeric → alpha-2, and a point for every sovereign state
const rows = await sparql(`SELECT ?num ?iso ?coord ?cont WHERE { ?c wdt:P31 wd:Q3624078; wdt:P297 ?iso. OPTIONAL { ?c wdt:P299 ?num } OPTIONAL { ?c wdt:P625 ?coord } OPTIONAL { ?c wdt:P30 ?cont } }`);
const alpha = new Map(), point = new Map(), continent = new Map();
for (const r of rows) {
  if (r.num) alpha.set(r.num.value.padStart(3, "0"), r.iso.value);
  if (r.cont && !continent.has(r.iso.value)) continent.set(r.iso.value, r.cont.value.split("/").pop());
  const m = r.coord?.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
  if (m) point.set(r.iso.value, [x(+m[1]), y(+m[2])]);
}

const ring = (pts) => {
  let d = "", last = "";
  pts.forEach(([lon, lat], i) => {
    const p = `${x(lon)},${y(Math.max(BOTTOM, lat))}`;
    if (p === last) return;
    d += (i ? "L" : "M") + p;
    last = p;
  });
  return d + "Z";
};
const paths = {};
for (const f of world.features) {
  const iso = alpha.get(String(f.id).padStart(3, "0"));
  if (!iso) continue;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  // skip rings that wrap around the date line (they would draw a stripe across the map)
  paths[iso] = polys.flatMap((poly) => poly.filter((r) => !r.some(([lon], i) => i && Math.abs(lon - r[i - 1][0]) > 180)).map(ring)).join("");
}
const dots = Object.fromEntries([...point].filter(([iso]) => !paths[iso]));
fs.mkdirSync("public/map", { recursive: true });
fs.writeFileSync("public/map/world.json", JSON.stringify({ width: W, height: H, paths, dots }));
// the countries the map quiz can ask (a shape on the map) and their continent – for wrong options nearby
const quiz = Object.fromEntries(Object.keys(paths).filter((iso) => continent.has(iso)).sort().map((iso) => [iso, continent.get(iso)]));
fs.writeFileSync("lib/map-countries.json", JSON.stringify(quiz));
console.log(`map: ${Object.keys(paths).length} shapes, ${Object.keys(dots).length} dots, ${(fs.statSync("public/map/world.json").size / 1024).toFixed(0)} KB`);
