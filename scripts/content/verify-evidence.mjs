// Checks the evidence of a facts batch against Wikipedia: every fact must name at least one quote per claim,
// and each quote must appear word for word in the linked article (whitespace and quote marks normalised).
// A batch exports `evidence = { "<fact id>": ["de|Article_Title|exact words from the article", …] }`.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-facts-6.mjs
// Exit code 1 if anything is missing or not found – then the batch must not be merged.
import path from "node:path";
import { pathToFileURL } from "node:url";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/content/verify-evidence.mjs <batch.mjs>");
const batch = await import(pathToFileURL(path.resolve(file)).href);
const facts = batch.facts ?? [];
const evidence = batch.evidence ?? {};

const norm = (s) => s.normalize("NFC").replace(/[„“”"«»]/g, '"').replace(/[‚‘’']/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
const cache = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function article(lang, title) {
  const key = `${lang}|${title}`;
  if (cache.has(key)) return cache.get(key);
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "WunderContentCheck/1.0 (https://github.com/yeccard68-prog/wunder)" } });
    if (res.ok) {
      const page = Object.values((await res.json()).query.pages)[0];
      const text = page.extract ? norm(page.extract) : null;
      cache.set(key, text);
      await sleep(1200); // be gentle with the API
      return text;
    }
    await sleep(3000 * (attempt + 1));
  }
  cache.set(key, null);
  return null;
}

// structure: the right field order, known area and topic, a new id, every text in both languages
import fs from "node:fs";
const AREAS = [...fs.readFileSync("lib/facts.ts", "utf8").match(/export const AREAS = \{([\s\S]*?)\}/)[1].matchAll(/^\s*(\w+):/gm)].map((m) => m[1]);
const CATEGORIES = JSON.parse(fs.readFileSync("content/categories.json", "utf8")).map((c) => c.id);
const existing = new Set(JSON.parse(fs.readFileSync("content/facts.json", "utf8")).map((f) => f.id));
const isNewFile = !JSON.parse(fs.readFileSync("content/facts.json", "utf8")).some((f) => facts.some((r) => r[0] === f.id));

// annotation batches add a "myth or truth" quiz or a counting figure to existing facts: a myth needs a quote that
// refutes the belief; a figure must appear in the fact's already checked text (digits compared without separators)
const annotations = batch.annotations ?? null;
const allRows = JSON.parse(fs.readFileSync("content/facts.json", "utf8"));
const digitsOf = (s) => s.replace(/[.,\s]/g, "");
const rows = annotations
  ? Object.entries(annotations).map(([id, a]) => {
      const f = allRows.find((x) => x.id === id);
      if (!f) return [id, "", "", [], "", "", "", "", a];
      return [id, f.area, f.category_id, f.sources, f.text, f.detail, f.translations?.en?.text ?? "", f.translations?.en?.detail ?? "", a];
    })
  : facts;

let failed = 0;
for (const row of rows) {
  const [id, area, category, sources, text, detail, enText, enDetail, ann] = row;
  const quotes = evidence[id] ?? [];
  const problems = [];
  if (ann) {
    if (!allRows.some((x) => x.id === id)) { problems.push("no such fact"); }
    if (ann.quiz && !["myth", "truth"].includes(ann.quiz)) problems.push(`quiz must be "myth" or "truth"`);
    if (ann.quiz === "myth" && !(ann.myth && ann.mythEn)) problems.push("a myth needs its belief in German and English (myth, mythEn)");
    if (ann.figure) {
      const v = ann.figure.value.toFixed(ann.figure.digits ?? 0).replace(".", "");
      if (!digitsOf(`${text} ${detail}`).includes(v)) problems.push(`figure ${ann.figure.value} does not appear in the fact's text`);
      if (!ann.figureSuffixEn) problems.push("figure needs an English suffix (figureSuffixEn)");
    }
    if (ann.quiz !== "myth") {
      // nothing new is claimed: the quiz shows the fact itself, the figure repeats its number
      if (problems.length) { failed++; console.log(`FAIL ${id}\n  - ${problems.join("\n  - ")}`); } else console.log(`ok   ${id} (${[ann.quiz, ann.figure && "figure"].filter(Boolean).join(", ")})`);
      continue;
    }
  }
  if (!AREAS.includes(area)) problems.push(`area "${area}" is not one of ${AREAS.join(", ")} (order: id, area, category, …)`);
  if (!CATEGORIES.includes(category)) problems.push(`category "${category}" is not one of ${CATEGORIES.join(", ")}`);
  if (!annotations && isNewFile && existing.has(id)) problems.push(`id ${id} already exists`);
  if (![text, detail, enText, enDetail].every((s) => typeof s === "string" && s.trim().length > 10)) problems.push("text/detail missing in German or English");
  if (!quotes.length) problems.push("no evidence");
  const linked = new Set(sources.map((s) => decodeURIComponent(s.url.split("/wiki/")[1] ?? "").replaceAll("_", " ")));
  for (const q of quotes) {
    const [lang, title, ...rest] = q.split("|");
    const quote = rest.join("|");
    if (!linked.has(title.replaceAll("_", " "))) problems.push(`"${title}" is not among the fact's sources`);
    if (quote.trim().split(/\s+/).length < 3) problems.push(`quote too short: "${quote}"`);
    const text = await article(lang, title);
    if (text === null) problems.push(`article not found: ${lang}|${title}`);
    else if (!text.includes(norm(quote))) problems.push(`not in ${title}: "${quote}"`);
  }
  if (problems.length) {
    failed++;
    console.log(`FAIL ${id}\n  - ${problems.join("\n  - ")}`);
  } else console.log(`ok   ${id} (${quotes.length} quote${quotes.length === 1 ? "" : "s"})`);
}
console.log(`${rows.length - failed} of ${rows.length} facts confirmed.`);
process.exit(failed ? 1 : 0);
