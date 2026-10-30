// NICHT MEHR VERWENDEN (30.10.2026): Studien bekommen nur noch eigene Zeichnungen – scripts/content/study-drawings.mjs.
// Pictures for "Studie kurz erklärt": the lead image of each study's Wikipedia article, only with a clearly free licence
// (CC0, CC BY, CC BY-SA, public domain), copied as a small WebP to public/img/studies/ – served from our own site. The
// credit (author · licence) and the file page go into content/studies.json (image_url, image_credit, image_source).
//   node scripts/content/study-images.mjs
// Studies without a free lead image keep none (a drawn sketch can be added by hand later).
import fs from "node:fs";
import sharp from "sharp";

sharp.cache(false);
const UA = "wunder-content/1.0 (learning app; y.eccard68@gmail.com)";
const api = async (params) => (await (await fetch(`https://de.wikipedia.org/w/api.php?format=json&${params}`, { headers: { "user-agent": UA } })).json()).query;
const strip = (html) => (html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const FREE = /^(CC0|CC BY(-SA)? \d\.\d|public domain|gemeinfrei)/i;

const file = "content/studies.json";
const rows = JSON.parse(fs.readFileSync(file, "utf8"));
fs.mkdirSync("public/img/studies", { recursive: true });
let added = 0;
for (const row of rows) {
  const title = decodeURIComponent(row.sources[0].url.split("/wiki/")[1]).replace(/_/g, " ");
  const page = Object.values((await api(`action=query&prop=pageimages&piprop=name&redirects=1&titles=${encodeURIComponent(title)}`)).pages)[0];
  if (!page.pageimage) { console.log(`${row.id}: kein Hauptbild`); continue; }
  const info = Object.values((await api(`action=query&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=480&titles=${encodeURIComponent("Datei:" + page.pageimage)}`)).pages)[0].imageinfo?.[0];
  const meta = info?.extmetadata ?? {};
  const licence = strip(meta.LicenseShortName?.value);
  const artist = strip(meta.Artist?.value);
  if (!info?.thumburl || !FREE.test(licence) || (/BY/i.test(licence) && !artist)) { console.log(`${row.id}: Lizenz nicht eindeutig frei (${licence || "?"})`); continue; }
  const out = `public/img/studies/${row.id}.webp`;
  const r = await fetch(info.thumburl, { headers: { "user-agent": UA } });
  if (!r.ok) { console.log(`${row.id}: Download fehlgeschlagen`); continue; }
  await sharp(Buffer.from(await r.arrayBuffer())).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
  row.image_url = out.replace(/^public/, "");
  row.image_credit = [/file history|upload history|see below|unknown/i.test(artist) ? "" : artist.slice(0, 80), licence].filter(Boolean).join(" · ");
  row.image_source = info.descriptionurl;
  added++;
  console.log(`${row.id}: ${page.pageimage} – ${row.image_credit}`);
  await new Promise((ok) => setTimeout(ok, 300));
}
fs.writeFileSync(file, JSON.stringify(rows, null, 2) + "\n");
console.log(`${added} von ${rows.length} Studien mit Bild`);
