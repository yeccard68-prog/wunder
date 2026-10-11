// Research helper: lists freely licensed videos with licence, author, size and direct file URL.
//   node scripts/clips/find.mjs commons "cheetah running"
//   node scripts/clips/find.mjs nasa "perseverance landing"
//   node scripts/clips/find.mjs archive "assembly line" [collection]
// Only public-domain and CC0 / CC BY / CC BY-SA material may be used (no NC, no ND).
const [source, query, extra] = process.argv.slice(2);
const UA = { "User-Agent": "WunderLearningApp/0.1 (content research; contact: y.eccard68@gmail.com)" };
const strip = (s) => (s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const get = async (url) => (await fetch(url, { headers: UA })).json();

if (source === "commons") {
  const api = "https://commons.wikimedia.org/w/api.php?format=json&origin=*";
  const s = await get(`${api}&action=query&generator=search&gsrnamespace=6&gsrlimit=${extra ?? 25}&gsrsearch=${encodeURIComponent(query + " filetype:video")}&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiextmetadatafilter=LicenseShortName|Artist|Credit`);
  for (const p of Object.values(s.query?.pages ?? {})) {
    const i = p.imageinfo?.[0];
    if (!i) continue;
    const m = i.extmetadata ?? {};
    console.log([p.title.replace("File:", ""), `${i.width}x${i.height}`, Math.round(i.duration ?? 0) + "s", (i.size / 1e6).toFixed(1) + "MB", strip(m.LicenseShortName?.value), strip(m.Artist?.value).slice(0, 50)].join(" | "));
  }
} else if (source === "nasa") {
  const s = await get(`https://images-api.nasa.gov/search?media_type=video&page_size=${extra ?? 20}&q=${encodeURIComponent(query)}`);
  for (const it of s.collection.items) console.log([it.data[0].nasa_id, it.data[0].title.slice(0, 70), (it.data[0].date_created ?? "").slice(0, 10), strip(it.data[0].description).slice(0, 110)].join(" | "));
} else if (source === "archive") {
  const q = `(${query}) AND mediatype:(movies)` + (extra ? ` AND collection:(${extra})` : "");
  const s = await get(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=year&fl[]=licenseurl&fl[]=downloads&sort[]=downloads+desc&rows=20&output=json`);
  for (const d of s.response.docs) console.log([d.identifier, String(d.title).slice(0, 70), d.year ?? "", d.licenseurl ?? "(no licence field)", d.downloads].join(" | "));
} else if (source === "info") {
  // exact Commons file: URL, licence, author, description page
  const api = "https://commons.wikimedia.org/w/api.php?format=json&origin=*";
  const s = await get(`${api}&action=query&titles=${encodeURIComponent("File:" + query)}&prop=imageinfo&iiprop=url|size|extmetadata`);
  const p = Object.values(s.query.pages)[0];
  const i = p.imageinfo?.[0];
  if (!i) console.log("not found");
  else console.log(JSON.stringify({ url: i.url, page: i.descriptionurl, size: `${i.width}x${i.height}`, duration: i.duration, license: strip(i.extmetadata.LicenseShortName?.value), licenseUrl: strip(i.extmetadata.LicenseUrl?.value), artist: strip(i.extmetadata.Artist?.value), credit: strip(i.extmetadata.Credit?.value).slice(0, 120), usage: strip(i.extmetadata.UsageTerms?.value) }, null, 1));
} else console.log("usage: find.mjs commons|nasa|archive|info <query> [limit|collection]");
