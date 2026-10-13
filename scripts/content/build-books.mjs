// Builds content/books.json from a book batch and refuses to write anything that fails validation.
//   node scripts/content/build-books.mjs [content/_batches/2026-10-books.mjs] [--offline]
// Checks: required texts in every language, 3–10 ideas per book, same number of ideas and same
// visuals in all languages, known visual types, related books exist, no idea title used twice,
// reading time, and (unless --offline) that each source page exists on Wikipedia.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) ?? "content/_batches/2026-10-books.mjs";
const { books, VERIFICATION } = await import(pathToFileURL(path.resolve(file)).href);
// learning design (hook, recall, transfer, takeaway, evidence level, links) lives next to the batch: <batch>-learning.mjs
const { learning, evidence } = await import(pathToFileURL(path.resolve(file.replace(".mjs", "-learning.mjs"))).href);
const FORMATS = ["explain", "challenge", "apply", "remember", "compare", "spot", "model", "examples"];
const EVIDENCE = ["evidence", "thesis", "debated"];
const known = { question: new Set(JSON.parse(fs.readFileSync("content/questions.json", "utf8")).map((q) => q.id)), animation: new Set(JSON.parse(fs.readFileSync("content/animations.json", "utf8")).map((a) => a.id)), clip: new Set(JSON.parse(fs.readFileSync("content/videos.json", "utf8")).filter((v) => v.status === "published").map((v) => v.id)) };
const errors = [];
const VISUALS = { loop: ["nodes"], compare: ["left", "right"], scenario: ["prompt", "options", "insight"], growth: ["perMonth", "rate", "label", "hint"] };
const CATEGORIES = ["psychology", "thinking", "habits", "business", "money", "science", "history", "philosophy", "communication", "learning"];
const words = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean).length;
const ids = new Set(books.map((b) => b.id));
const seenTitles = new Map();

for (const b of books) {
  const at = (m) => errors.push(`${b.id}: ${m}`);
  if (!b.title || !b.author || !Number.isInteger(b.year)) at("title, author and year are required");
  if (!CATEGORIES.includes(b.category)) at(`unknown category ${b.category}`);
  if (![10, 13, 16].includes(b.minAge)) at("minAge must be 10, 13 or 16");
  for (const r of b.related) if (!ids.has(r)) at(`related book ${r} does not exist`);
  for (const [lang, t] of [["de", b.de], ["en", b.en]]) {
    if (words(t.thesis) < 15) at(`${lang}: thesis too short`);
    if (words(t.limits) < 15) at(`${lang}: limits/criticism missing`);
    if (!/\?$/.test(t.reflect.trim())) at(`${lang}: reflect must be a question`);
    if (t.ideas.length < 3 || t.ideas.length > 10) at(`${lang}: needs 3–10 ideas`);
    t.ideas.forEach(([title, text, example, visual], i) => {
      if (!title || words(text) < 20 || words(text) > 90) at(`${lang}: idea ${i + 1} needs a title and 20–90 words (has ${words(text)})`);
      if (words(example) < 5) at(`${lang}: idea ${i + 1} needs an example`);
      if (visual) {
        const need = VISUALS[visual.type];
        if (!need) at(`${lang}: idea ${i + 1} has unsupported visual "${visual.type}"`);
        else for (const k of need) if (visual[k] == null) at(`${lang}: idea ${i + 1} visual lacks ${k}`);
        if (visual.type === "scenario" && (visual.options.length < 2 || visual.options.some((o) => o.length !== 2))) at(`${lang}: idea ${i + 1} scenario needs options [label, feedback]`);
      }
      if (lang === "de") {
        const key = title.toLowerCase();
        if (seenTitles.has(key)) at(`idea "${title}" also appears in ${seenTitles.get(key)}`);
        seenTitles.set(key, b.id);
      }
    });
  }
  const L = learning[b.id];
  if (!L) at("learning design missing");
  else {
    if (words(L.goal[0]) < 8 || words(L.goal[1]) < 8) at("learning goal missing");
    for (const [kind, id] of L.links ?? []) if (!known[kind]?.has(id)) at(`link to unknown ${kind} ${id}`);
    if (L.ideas.length !== b.de.ideas.length) at("learning steps and ideas differ in number");
    if ((evidence[b.id] ?? []).length !== b.de.ideas.length || evidence[b.id].some((e) => !EVIDENCE.includes(e))) at("evidence level missing or unknown");
    if (!L.ideas.some((i) => i.transfer)) at("needs at least one transfer task");
    L.ideas.forEach((i, n) => {
      const it = (m) => at(`idea ${n + 1}: ${m}`);
      if (!FORMATS.includes(i.format)) it(`unknown format ${i.format}`);
      for (const l of [0, 1]) {
        if (!i.hook[l].trim().endsWith("?")) it("hook must be a question");
        if (words(i.recall[l][0]) < 3 || words(i.recall[l][1]) < 2) it("recall needs a prompt and an answer");
        if (words(i.takeaway[l]) < 4 || words(i.takeaway[l]) > 30) it("takeaway must be one sentence of 4–30 words");
      }
      if (i.transfer) for (const l of ["de", "en"]) {
        const [situation, ...options] = i.transfer[l];
        if (words(situation) < 8 || options.length < 2 || options.some((o) => o.length !== 2 || words(o[1]) < 8)) it(`transfer (${l}) needs a situation and options [label, feedback]`);
        if (!options[i.transfer.best]) it("transfer.best points at no option");
      }
    });
  }
  if (b.de.ideas.length !== b.en.ideas.length) at("languages have different numbers of ideas");
  b.de.ideas.forEach((idea, i) => (idea[3]?.type ?? null) !== (b.en.ideas[i]?.[3]?.type ?? null) && at(`idea ${i + 1}: visual differs between languages`));
}

if (!args.includes("--offline")) {
  const titles = [...new Set(books.map((b) => b.wiki.replaceAll("_", " ")))];
  for (let i = 0; i < titles.length; i += 40) {
    const url = "https://de.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=" + encodeURIComponent(titles.slice(i, i + 40).join("|"));
    const res = await (await fetch(url, { headers: { "User-Agent": "WunderLearningApp/0.1 (book source check; contact: y.eccard68@gmail.com)" } })).json();
    for (const p of Object.values(res.query.pages)) if ("missing" in p || "invalid" in p) errors.push(`source page missing on Wikipedia: ${p.title}`);
    for (const r of res.query.redirects ?? []) console.log(`  note: source "${r.from}" redirects to "${r.to}"`);
  }
}

if (errors.length) {
  console.error(errors.join("\n") + `\n\n${errors.length} problems – content/books.json was not written.`);
  process.exit(1);
}

const YEAR_LABEL = { aurel: { de: "um 175 n. Chr.", en: "c. AD 175" } };
const ideas = (b, t, l = 0) => t.ideas.map(([title, text, example, visual], i) => {
  const L = learning[b.id].ideas[i];
  const tr = L.transfer?.[l ? "en" : "de"];
  return {
    id: `b-${b.id}-${i + 1}`, format: L.format, evidence: evidence[b.id][i], hook: L.hook[l], title, text, example, visual: visual ?? null,
    recall: { question: L.recall[l][0], answer: L.recall[l][1] },
    transfer: tr ? { situation: tr[0], options: tr.slice(1), best: L.transfer.best } : null,
    takeaway: L.takeaway[l],
  };
});
const out = books.map((b, n) => {
  const minutes = Math.max(2, Math.ceil((words(b.de.thesis) + words(b.de.limits) + b.de.ideas.reduce((s, i) => s + words(i[1]) + words(i[2]), 0)) / 180));
  return {
    id: `b-${b.id}`, category: b.category, topic_id: b.topic, title: b.title, title_de: b.titleDe, author: b.author, year: b.year, year_label: YEAR_LABEL[b.id]?.de ?? null,
    min_age: b.minAge, language: "de", minutes, goal: learning[b.id].goal[0], links: (learning[b.id].links ?? []).map(([kind, id]) => ({ kind, id })), thesis: b.de.thesis, ideas: ideas(b, b.de), limits: b.de.limits, reflect: b.de.reflect,
    related: b.related.map((r) => `b-${r}`), quiz_question_id: `bq-${b.id}`,
    sources: [{ name: "Wikipedia: " + b.wiki.replaceAll("_", " "), url: "https://de.wikipedia.org/wiki/" + b.wiki }],
    license: "Eigene Zusammenfassung und Einordnung in eigenen Worten; keine Auszüge oder Zitate aus dem Buch, kein Buchcover des Verlags.",
    verification_status: VERIFICATION, status: "published", created_at: new Date(Date.parse("2026-10-16T12:00:00Z") - n * 3_600_000).toISOString().replace(".000Z", "Z"),
    translations: { en: { year_label: YEAR_LABEL[b.id]?.en ?? null, goal: learning[b.id].goal[1], thesis: b.en.thesis, ideas: ideas(b, b.en, 1).map(({ id, format, evidence, ...rest }) => rest), limits: b.en.limits, reflect: b.en.reflect } },
  };
});
fs.writeFileSync("content/books.json", JSON.stringify(out, null, 2) + "\n");
console.log(`content/books.json: ${out.length} books, ${out.reduce((n, b) => n + b.ideas.length, 0)} learning units, ${out.reduce((n, b) => n + b.ideas.filter((i) => i.visual).length, 0)} with an interactive visual.`);
