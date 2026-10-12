// Checks that every Wikipedia page a batch names as a source really exists (and reports redirects).
//   node scripts/content/check-sources.mjs content/_batches/<name>.mjs
// One polite API request per 40 titles. Exit code 1 if a page is missing.
import path from "node:path";
import { pathToFileURL } from "node:url";

const batch = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const titles = [...new Set([...(batch.questions ?? []).map((q) => q[9]), ...(batch.claims ?? []).map((c) => c[6]), ...(batch.formats ?? []).map((f) => f.wiki)])].map((t) => t.replaceAll("_", " "));
const missing = [];
const redirects = [];
for (let i = 0; i < titles.length; i += 40) {
  const chunk = titles.slice(i, i + 40);
  const url = "https://de.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=" + encodeURIComponent(chunk.join("|"));
  const res = await (await fetch(url, { headers: { "User-Agent": "WunderLearningApp/0.1 (content source check; contact: y.eccard68@gmail.com)" } })).json();
  for (const r of res.query.redirects ?? []) redirects.push(`${r.from} → ${r.to}`);
  for (const p of Object.values(res.query.pages)) if ("missing" in p || "invalid" in p) missing.push(p.title);
  await new Promise((r) => setTimeout(r, 500));
}
console.log(`${titles.length} source pages checked, ${redirects.length} redirects, ${missing.length} missing`);
if (redirects.length) console.log("redirects:\n  " + redirects.join("\n  "));
if (missing.length) {
  console.error("MISSING:\n  " + missing.join("\n  "));
  process.exit(1);
}
