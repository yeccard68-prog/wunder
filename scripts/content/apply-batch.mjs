// Merges a content batch (content/_batches/*.mjs) into content/*.json.
//   node scripts/content/apply-batch.mjs content/_batches/<name>.mjs
// Safe to run again: existing ids are updated in place, nothing is duplicated or deleted.
// A batch may export: LOCALE, TODAY, categories, newCategories, questions, claims, en, minAge,
// archiveVideos, videos, verification (status applied to every record that is still "unverified").
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/content/apply-batch.mjs <batch.mjs>");
const batch = await import(pathToFileURL(path.resolve(file)).href);
const L = batch.LOCALE ?? "en";
const read = (n) => JSON.parse(fs.readFileSync(`content/${n}.json`, "utf8"));
const write = (n, d) => fs.writeFileSync(`content/${n}.json`, JSON.stringify(d, null, 2) + "\n");
const categories = read("categories");
const questions = read("questions");
const videos = read("videos");

const W = "https://de.wikipedia.org/wiki/";
const TODAY = batch.TODAY ?? new Date().toISOString().slice(0, 10);
const day = (i) => new Date(Date.parse(TODAY + "T12:00:00Z") - (i % 21) * 86_400_000).toISOString().replace(".000Z", "Z");
const upsert = (list, row) => {
  const i = list.findIndex((r) => r.id === row.id);
  if (i >= 0) list[i] = { ...list[i], ...row, created_at: list[i].created_at ?? row.created_at, published_at: list[i].published_at ?? row.published_at };
  else list.push(row);
};
const tr = (question, options, explanation) => ({ [L]: { question, options, explanation } });
const status = batch.verification ?? "unverified";

for (const c of batch.newCategories ?? []) upsert(categories, c);
for (const [id, order] of Object.entries(batch.categoryOrder ?? {})) categories.find((c) => c.id === id).display_order = order;
for (const c of categories) {
  const t = batch.categories?.[c.id];
  if (t) c.translations = { ...c.translations, [L]: { name: t[0], description: t[1] } };
  c.translations ??= {};
}

// existing questions: age level + translation
for (const q of questions) {
  q.min_age = batch.minAge?.[q.id] ?? q.min_age ?? 10;
  q.max_age = q.max_age ?? null;
  const e = batch.en?.[q.id];
  if (e) q.translations = { ...q.translations, ...tr(e[0], e[1] ?? q.options, e[2]) };
  q.translations ??= {};
}

const base = { tags: [], verification_status: status, status: "published", show_in_feed: true, demo_popularity: 0 };
(batch.questions ?? []).forEach(([id, category_id, difficulty, min_age, max_age, question, options, correct_index, explanation, wiki, enQ, enO, enE], i) =>
  upsert(questions, { id, kind: "question", category_id, question, options, correct_index, explanation, difficulty, ...base, source_name: "Wikipedia: " + wiki.replaceAll("_", " "), source_url: W + wiki, created_at: day(i), min_age, max_age, translations: tr(enQ, enO ?? options, enE) })
);
(batch.claims ?? []).forEach(([id, category_id, min_age, question, truth, explanation, wiki, enQ, enE], i) =>
  upsert(questions, { id, kind: "fact", category_id, question, options: ["Stimmt", "Stimmt nicht"], correct_index: truth ? 0 : 1, explanation, difficulty: 1, ...base, source_name: "Wikipedia: " + wiki.replaceAll("_", " "), source_url: W + wiki, created_at: day(i * 2 + 1), min_age, max_age: null, translations: tr(enQ, ["True", "False"], enE) })
);
for (const q of questions) if (q.kind === "fact" && q.translations[L]) q.translations[L].options = ["True", "False"];

for (const v of videos) {
  if ((batch.archiveVideos ?? []).includes(v.id)) v.status = "archived";
  v.min_age ??= 10;
  v.translations ??= {};
  v.start_seconds ??= null;
  v.end_seconds ??= null;
  v.license ??= null;
}
(batch.videos ?? []).forEach((v, i) => {
  const quizId = "q-" + v.id;
  const [q, opts, correct, expl, enQ, enO, enE] = v.quiz;
  upsert(questions, { id: quizId, kind: "question", category_id: v.category_id, question: q, options: opts, correct_index: correct, explanation: expl, difficulty: 1, ...base, tags: v.tags, show_in_feed: false, source_name: v.source.name, source_url: v.source.url, created_at: day(i), min_age: v.min_age, max_age: null, translations: tr(enQ, enO ?? opts, enE) });
  const p = v.production; // built clip (scripts/clips/build.mjs) or, without it, a segment of a remote file
  upsert(videos, {
    id: v.id, category_id: v.category_id, title: v.title, hook: v.hook, description: v.description,
    video_url: p ? `/clips/${v.id}.mp4` : v.video_url, thumbnail_url: p ? `/clips/${v.id}.jpg` : null,
    duration_seconds: Math.round((p ? (p.end - p.start) * (p.loops ?? 1) : v.end - v.start) * 100) / 100, has_audio: false, captions: v.captions, creator_name: v.creator_name ?? "NASA", format: v.format ?? "footage", sources: [v.source],
    published_at: day(i), tags: v.tags, quiz_question_id: quizId, verification_status: status, status: "published", demo_popularity: 0, demo_comments: [],
    production: p ?? { provider: "external", nasa_id: v.nasa_id }, min_age: v.min_age, start_seconds: p ? null : v.start, end_seconds: p ? null : v.end, license: v.license, translations: { [L]: v.en },
  });
});

if (batch.verification) {
  for (const q of questions) if (q.verification_status === "unverified") q.verification_status = batch.verification;
  for (const v of videos) if (v.verification_status === "unverified") v.verification_status = batch.verification;
}

write("categories", categories);
write("questions", questions);
write("videos", videos);
console.log(`categories ${categories.length}, questions ${questions.length} (feed ${questions.filter((q) => q.show_in_feed).length}), videos ${videos.length} (published ${videos.filter((v) => v.status === "published").length})`);
