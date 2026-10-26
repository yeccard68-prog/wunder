// Adds a picture to generated cards (paintings, World Heritage sites): the Wikidata image (P18) from Wikimedia Commons,
// only with a clearly free licence, copied as a small thumbnail to public/img/gen/ – served from our own site, so no
// phone sends its address to a third party. Every picture keeps its credit (author · licence · link to the file page).
//   node scripts/content/commons-images.mjs paintings heritage flags
// Flags use the flag picture (P41) instead of the image (P18); cards marked needs_image are dropped without a free
// picture. Thumbnails are stored as WebP (400 px wide).
//
// Licences: CC0, CC BY, CC BY-SA always; "public domain" only for photos of places (heritage) – not for photos of
// paintings, because in Germany a photo of an old painting can carry its own rights (BGH, 20.12.2018, I ZR 104/17),
// unless the photographer released it (CC0 / CC licence).
import fs from "node:fs";
import sharp from "sharp";

sharp.cache(false);
const PROP = { flags: "P41" }; // which Wikidata property holds the picture (default: P18 image)

const UA = "wunder-content/1.0 (learning app; y.eccard68@gmail.com)";
const WIDTH = 480;
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function json(url, body) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, body ? { method: "POST", headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body } : { headers: { "user-agent": UA } });
      if (!r.ok) throw new Error(`${r.status} ${url.slice(0, 60)}`);
      return await r.json();
    } catch (e) {
      if (attempt >= 3) throw e;
      await wait(5000 * attempt);
    }
  }
}
const strip = (html) => (html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const CC = /^(CC0|CC BY(-SA)? \d\.\d)/i;

for (const name of process.argv.slice(2)) {
  const file = `public/gen/${name}.json`;
  const cards = JSON.parse(fs.readFileSync(file, "utf8"));
  const allowPD = name !== "paintings";
  // 1. the image file of each entry (Wikidata P18)
  const qids = cards.map((c) => c.source_url.split("/").pop());
  const image = new Map();
  for (let i = 0; i < qids.length; i += 200) {
    const res = await json("https://query.wikidata.org/sparql", "format=json&query=" + encodeURIComponent(`SELECT ?e ?img WHERE { VALUES ?e { ${qids.slice(i, i + 200).map((q) => "wd:" + q).join(" ")} } ?e wdt:${PROP[name] ?? "P18"} ?img. }`));
    for (const b of res.results.bindings) image.set(b.e.value.split("/").pop(), decodeURIComponent(b.img.value.split("/").pop()).replace(/_/g, " "));
  }
  // 2. licence, author and a thumbnail URL from Commons (50 files per request)
  const files = [...new Set(image.values())];
  const info = new Map();
  for (let i = 0; i < files.length; i += 50) {
    const titles = files.slice(i, i + 50).map((f) => "File:" + f).join("|");
    const res = await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=${WIDTH}&titles=${encodeURIComponent(titles)}`);
    const norm = new Map((res.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of Object.values(res.query.pages)) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata ?? {};
      info.set((norm.get(p.title) ?? p.title).replace(/^File:/, ""), { thumb: ii.thumburl, page: ii.descriptionurl, licence: strip(m.LicenseShortName?.value), artist: /file history|upload history|see below|unknown|^$/i.test(strip(m.Artist?.value)) ? "" : strip(m.Artist?.value).slice(0, 80) });
    }
    await wait(500);
  }
  // 3. keep what is clearly free, copy the thumbnail
  fs.mkdirSync("public/img/gen", { recursive: true });
  let added = 0, skipped = 0;
  for (const c of cards) {
    const f = image.get(c.source_url.split("/").pop());
    const i = f && info.get(f);
    const free = i && i.thumb && (CC.test(i.licence) || (allowPD && /^public domain$/i.test(i.licence)));
    const needsName = i && /BY/i.test(i.licence);
    if (!free || (needsName && !i.artist)) {
      skipped++;
      delete c.image_url;
      if (c.needs_image) c.drop = true;
      continue;
    }
    const out = `public/img/gen/${c.id}.webp`;
    if (!fs.existsSync(out)) {
      const r = await fetch(i.thumb, { headers: { "user-agent": UA } });
      if (!r.ok) {
        skipped++;
        if (c.needs_image) c.drop = true;
        continue;
      }
      await sharp(Buffer.from(await r.arrayBuffer())).resize({ width: 400, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
      await wait(300);
    }
    c.image_url = out.replace(/^public/, "");
    c.image_credit = [i.artist, i.licence].filter(Boolean).join(" · ");
    c.image_source = i.page;
    added++;
  }
  fs.writeFileSync(file, JSON.stringify(cards.filter((c) => !c.drop).map(({ needs_image, drop, ...c }) => c)));
  console.log(`${name}: ${added} pictures, ${skipped} without a clearly free one`);
}
