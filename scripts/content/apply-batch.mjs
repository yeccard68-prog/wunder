// Merges a content batch (content/_batches/*.mjs) into content/*.json.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-expansion.mjs
// Safe to run again: existing ids are updated in place, nothing is duplicated or deleted.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/content/apply-batch.mjs <batch.mjs>");
const batch = await import(pathToFileURL(path.resolve(file)).href);
const L = batch.LOCALE;
const read = (n) => JSON.parse(fs.readFileSync(`content/${n}.json`, "utf8"));
const write = (n, d) => fs.writeFileSync(`content/${n}.json`, JSON.stringify(d, null, 2) + "\n");
const categories = read("categories");
const questions = read("questions");
const videos = read("videos");

const W = "https://de.wikipedia.org/wiki/";
const TODAY = "2026-10-12";
const day = (i) => new Date(Date.parse(TODAY + "T12:00:00Z") - (i % 21) * 86_400_000).toISOString().replace(".000Z", "Z");
const upsert = (list, row) => {
  const i = list.findIndex((r) => r.id === row.id);
  if (i >= 0) list[i] = { ...list[i], ...row, created_at: list[i].created_at ?? row.created_at };
  else list.push(row);
};
const tr = (question, options, explanation) => ({ [L]: { question, options, explanation } });

for (const c of categories) if (batch.categories[c.id]) c.translations = { ...c.translations, [L]: { name: batch.categories[c.id][0], description: batch.categories[c.id][1] } };

// existing questions: age level + translation
for (const q of questions) {
  q.min_age = batch.minAge[q.id] ?? q.min_age ?? 10;
  q.max_age = q.max_age ?? null;
  const e = batch.en[q.id];
  if (e) q.translations = { ...q.translations, ...tr(e[0], e[1] ?? q.options, e[2]) };
  q.translations ??= {};
}

const base = { tags: [], verification_status: "unverified", status: "published", show_in_feed: true, demo_popularity: 0 };
batch.questions.forEach(([id, category_id, difficulty, min_age, max_age, question, options, correct_index, explanation, wiki, enQ, enO, enE], i) =>
  upsert(questions, { id, kind: "question", category_id, question, options, correct_index, explanation, difficulty, ...base, source_name: "Wikipedia: " + wiki.replaceAll("_", " "), source_url: W + wiki, created_at: day(i), min_age, max_age, translations: tr(enQ, enO ?? options, enE) })
);
batch.claims.forEach(([id, category_id, min_age, question, truth, explanation, wiki, enQ, enE], i) =>
  upsert(questions, { id, kind: "fact", category_id, question, options: ["Stimmt", "Stimmt nicht"], correct_index: truth ? 0 : 1, explanation, difficulty: 1, ...base, source_name: "Wikipedia: " + wiki.replaceAll("_", " "), source_url: W + wiki, created_at: day(i * 2 + 1), min_age, max_age: null, translations: tr(enQ, ["True", "False"], enE) })
);
// true/false options of existing claim cards
for (const q of questions) if (q.kind === "fact" && q.translations[L]) q.translations[L].options = ["True", "False"];

for (const v of videos) {
  if (batch.archiveVideos.includes(v.id)) v.status = "archived";
  v.min_age ??= 10;
  v.translations ??= {};
  v.start_seconds ??= null;
  v.end_seconds ??= null;
  v.license ??= null;
}
batch.videos.forEach((v, i) => {
  const quizId = "q-" + v.id;
  const [q, opts, correct, expl, enQ, enO, enE] = v.quiz;
  upsert(questions, { id: quizId, kind: "question", category_id: v.category_id, question: q, options: opts, correct_index: correct, explanation: expl, difficulty: 1, ...base, tags: v.tags, show_in_feed: false, source_name: v.source.name, source_url: v.source.url, created_at: day(i), min_age: v.min_age, max_age: null, translations: tr(enQ, enO, enE) });
  upsert(videos, {
    id: v.id, category_id: v.category_id, title: v.title, hook: v.hook, description: v.description, video_url: v.video_url, thumbnail_url: null,
    duration_seconds: v.end - v.start, has_audio: false, captions: v.captions, creator_name: "NASA", format: "footage", sources: [v.source],
    published_at: day(i), tags: v.tags, quiz_question_id: quizId, verification_status: "unverified", status: "published", demo_popularity: 0, demo_comments: [],
    production: { provider: "external", nasa_id: v.nasa_id }, min_age: v.min_age, start_seconds: v.start, end_seconds: v.end, license: v.license, translations: { [L]: v.en },
  });
});

write("categories", categories);
write("questions", questions);
write("videos", videos);
console.log(`categories ${categories.length}, questions ${questions.length} (feed ${questions.filter((q) => q.show_in_feed).length}), videos ${videos.length} (published ${videos.filter((v) => v.status === "published").length})`);
