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

// "Heute vor … Jahren" batches export `events`: [id, "MM-DD", year, category, sources, text de, detail de, text en,
// detail en]. One quote must come from the Wikipedia day article of that date and start with "<year>:".
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
if (batch.events) {
  const days = fs.existsSync("content/days.json") ? JSON.parse(fs.readFileSync("content/days.json", "utf8")) : [];
  const isNew = !days.some((d) => batch.events.some((e) => e[0] === d.id));
  let bad = 0;
  for (const [id, date, year, category, sources, text, detail, enText, enDetail] of batch.events) {
    const problems = [];
    const [mm, dd] = String(date).split("-").map(Number);
    const dayTitle = mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 ? `${dd}. ${MONTHS[mm - 1]}` : null;
    if (!/^\d\d-\d\d$/.test(String(date)) || !dayTitle) problems.push(`date "${date}" must be "MM-DD"`);
    if (!Number.isInteger(year) || year < 1 || year > new Date().getFullYear() - 1) problems.push(`year ${year} must be a past year`);
    if (!CATEGORIES.includes(category)) problems.push(`category "${category}" is not one of ${CATEGORIES.join(", ")}`);
    if (isNew && days.some((d) => d.id === id)) problems.push(`id ${id} already exists`);
    if (![text, detail, enText, enDetail].every((s) => typeof s === "string" && s.trim().length > 10)) problems.push("text/detail missing in German or English");
    const quotes = evidence[id] ?? [];
    const linked = new Set(sources.map((s) => decodeURIComponent(s.url.split("/wiki/")[1] ?? "").replaceAll("_", " ")));
    if (dayTitle && !linked.has(dayTitle)) problems.push(`the day article "${dayTitle}" must be among the sources`);
    if (dayTitle && !quotes.some((q) => q.split("|")[1].replaceAll("_", " ") === dayTitle && q.split("|").slice(2).join("|").trim().startsWith(`${year}:`))) problems.push(`one quote must come from "${dayTitle}" and start with "${year}:"`);
    for (const q of quotes) {
      const [lang, title, ...rest] = q.split("|");
      const quote = rest.join("|");
      if (!linked.has(title.replaceAll("_", " "))) problems.push(`"${title}" is not among the sources`);
      const t = await article(lang, title);
      if (t === null) problems.push(`article not found: ${lang}|${title}`);
      else if (!t.includes(norm(quote))) problems.push(`not in ${title}: "${quote}"`);
    }
    if (problems.length) { bad++; console.log(`FAIL ${id}\n  - ${problems.join("\n  - ")}`); } else console.log(`ok   ${id} (${dd}.${mm}.${year})`);
  }
  console.log(`${batch.events.length - bad} of ${batch.events.length} events confirmed.`);
  process.exit(bad ? 1 : 0);
}

// "Studie kurz erklärt" batches export `studies`: { id, category, minAge, year, name, sources, de: { question, method,
// result, caveat }, en: { … } }. Every part needs quotes from a linked article; the caveat ("Aber …") is required –
// a study without its limits is not explained. Every year in the texts (and the study year) must be quoted.
if (batch.studies) {
  const existingStudies = fs.existsSync("content/studies.json") ? JSON.parse(fs.readFileSync("content/studies.json", "utf8")) : [];
  const isNewStudyFile = !existingStudies.some((s) => batch.studies.some((b) => b.id === s.id));
  let bad = 0;
  for (const s of batch.studies) {
    const problems = [];
    const quotes = evidence[s.id] ?? [];
    if (!/^s-[a-z0-9-]+$/.test(s.id)) problems.push(`id "${s.id}" must look like s-name`);
    if (isNewStudyFile && existingStudies.some((x) => x.id === s.id)) problems.push(`id ${s.id} already exists`);
    if (!CATEGORIES.includes(s.category)) problems.push(`category "${s.category}" is not one of ${CATEGORIES.join(", ")}`);
    if (![6, 10, 13, 16].includes(s.minAge)) problems.push("minAge must be 6, 10, 13 or 16");
    if (!Number.isInteger(s.year) || s.year > new Date().getFullYear()) problems.push(`year ${s.year} must be a past year`);
    for (const l of ["de", "en"]) for (const k of ["question", "method", "result", "caveat"]) if (!(typeof s[l]?.[k] === "string" && s[l][k].trim().length > 15)) problems.push(`${l}.${k} missing`);
    if (!s.name?.de || !s.name?.en) problems.push("name.de / name.en missing");
    if (!quotes.length) problems.push("no evidence");
    const linked = new Set(s.sources.map((x) => decodeURIComponent(x.url.split("/wiki/")[1] ?? "").replaceAll("_", " ")));
    for (const q of quotes) {
      const [lang, title, ...rest] = q.split("|");
      const quote = rest.join("|");
      if (!linked.has(title.replaceAll("_", " "))) problems.push(`"${title}" is not among the study's sources`);
      if (quote.trim().split(/\s+/).length < 3) problems.push(`quote too short: "${quote}"`);
      const t = await article(lang, title);
      if (t === null) problems.push(`article not found: ${lang}|${title}`);
      else if (!t.includes(norm(quote))) problems.push(`not in ${title}: "${quote}"`);
    }
    const shown = [s.name.de, ...Object.values(s.de), String(s.year)].join(" ");
    const quoted = quotes.join(" ");
    for (const year of new Set(shown.match(/\b1\d{3}\b|\b20\d\d\b/g) ?? [])) if (!quoted.includes(year)) problems.push(`year ${year} is shown but not quoted`);
    if (problems.length) { bad++; console.log(`FAIL ${s.id}\n  - ${problems.join("\n  - ")}`); } else console.log(`ok   ${s.id} (${quotes.length} quotes)`);
  }
  console.log(`${batch.studies.length - bad} of ${batch.studies.length} studies confirmed.`);
  process.exit(bad ? 1 : 0);
}

// clip batches (own clips, e.g. the "Persönlichkeiten" timelines): every quote must be in a linked article, and every
// year that the clip shows or names (people.ts stations, title, texts, captions, quiz) must appear in one of the quotes
if (batch.videos) {
  const people = fs.readFileSync("video/src/people.ts", "utf8");
  let bad = 0;
  for (const v of batch.videos) {
    const problems = [];
    const quotes = evidence[v.id] ?? [];
    if (!quotes.length) problems.push("no evidence");
    if (!CATEGORIES.includes(v.category_id)) problems.push(`category "${v.category_id}" is not one of ${CATEGORIES.join(", ")}`);
    const linked = new Set(v.sources.map((s) => decodeURIComponent(s.url.split("/wiki/")[1] ?? "").replaceAll("_", " ")));
    for (const q of quotes) {
      const [lang, title, ...rest] = q.split("|");
      const quote = rest.join("|");
      if (!linked.has(title.replaceAll("_", " "))) problems.push(`"${title}" is not among the clip's sources`);
      const t = await article(lang, title);
      if (t === null) problems.push(`article not found: ${lang}|${title}`);
      else if (!t.includes(norm(quote))) problems.push(`not in ${title}: "${quote}"`);
    }
    const block = people.split(`id: "${v.id}"`)[1]?.split(/\n  \},?\n/)[0] ?? "";
    const shown = [block, v.title, v.hook, v.description, ...v.captions, v.quiz[0], ...v.quiz[1], v.quiz[3]].join(" ");
    const quoted = quotes.join(" ");
    for (const year of new Set(shown.match(/\b1\d{3}\b|\b20\d\d\b/g) ?? [])) if (!quoted.includes(year)) problems.push(`year ${year} is shown but not quoted`);
    if (problems.length) { bad++; console.log(`FAIL ${v.id}\n  - ${problems.join("\n  - ")}`); } else console.log(`ok   ${v.id} (${quotes.length} quotes)`);
  }
  console.log(`${batch.videos.length - bad} of ${batch.videos.length} clips confirmed.`);
  process.exit(bad ? 1 : 0);
}

// question batches (rows as in apply-batch.mjs) with `evidence` keyed by question id: every question needs a quote from
// its own article (more articles may back it up), each found word for word; every year and every number of the right
// answer must appear in a quote, so nothing on screen goes unchecked
if (batch.questions && !batch.facts) {
  const known = new Set(JSON.parse(fs.readFileSync("content/questions.json", "utf8")).map((q) => q.id));
  const isNewQ = !batch.questions.some((r) => known.has(r[0]));
  let bad = 0;
  for (const row of batch.questions) {
    const [id, category, difficulty, minAge, , question, options, correct, explanation, wiki, enQ, enO, enE] = row;
    const problems = [];
    const quotes = evidence[id] ?? [];
    if (!CATEGORIES.includes(category)) problems.push(`category "${category}" is not one of ${CATEGORIES.join(", ")}`);
    if (isNewQ && known.has(id)) problems.push(`id ${id} already exists`);
    if (![1, 2, 3].includes(difficulty) || ![6, 10, 13, 16].includes(minAge)) problems.push("difficulty 1–3, minAge 6/10/13/16");
    if (!Array.isArray(options) || options.length < 3 || options.length > 5 || new Set(options).size !== options.length) problems.push("3–5 different options");
    if (!Array.isArray(enO) || enO.length !== options.length) problems.push("English options missing or a different number");
    if (!(correct >= 0 && correct < options.length)) problems.push("correct index out of range");
    if (![question, explanation, enQ, enE].every((s) => typeof s === "string" && s.trim().length > 10)) problems.push("question/explanation missing in German or English");
    if (!quotes.length) problems.push("no evidence");
    const [ownLang, ownTitle] = wiki.startsWith("en:") ? ["en", wiki.slice(3)] : ["de", wiki];
    if (!quotes.some((q) => q.split("|")[0] === ownLang && q.split("|")[1] === ownTitle)) problems.push(`no quote from its own article ${wiki}`);
    for (const q of quotes) {
      const [lang, title, ...rest] = q.split("|");
      const quote = rest.join("|");
      if (quote.trim().split(/\s+/).length < 3) problems.push(`quote too short: "${quote}"`);
      const t = await article(lang, title);
      if (t === null) problems.push(`article not found: ${lang}|${title}`);
      else if (!t.includes(norm(quote))) problems.push(`not in ${title}: "${quote}"`);
    }
    const quoted = digitsOf(quotes.join(" "));
    const shown = [question, options[correct], explanation].join(" ");
    for (const n of new Set(shown.match(/\d[\d.,]*\d|\d/g) ?? [])) if (n.replace(/[.,]/g, "").length >= 2 && !quoted.includes(digitsOf(n))) problems.push(`number ${n} is shown but not quoted`);
    if (problems.length) { bad++; console.log(`FAIL ${id}\n  - ${problems.join("\n  - ")}`); } else console.log(`ok   ${id} (${quotes.length} quote${quotes.length === 1 ? "" : "s"})`);
  }
  console.log(`${batch.questions.length - bad} of ${batch.questions.length} questions confirmed.`);
  process.exit(bad ? 1 : 0);
}

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
