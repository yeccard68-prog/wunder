// Writes the dataset as database rows (JSON) for an upload through the API by an admin account.
//   node scripts/content/rows.mjs <output.json>
// Same mapping as the SQL import: explanations go to question_answers, demo-only fields are dropped.
import fs from "node:fs";
import { loadContent, validateContent } from "./lib.mjs";

const content = loadContent();
const { errors } = validateContent(content);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const mapTr = (translations, pick) => Object.fromEntries(Object.entries(translations ?? {}).map(([loc, t]) => [loc, pick(t)]));

const rows = {
  categories: content.categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description, display_order: c.display_order, is_active: c.is_active, translations: c.translations ?? {} })),
  questions: content.questions.map((q) => ({
    id: q.id, kind: q.kind, category_id: q.category_id, question: q.question, options: q.options, difficulty: q.difficulty, tags: q.tags, source_name: q.source_name, source_url: q.source_url,
    verification_status: q.verification_status, status: q.status, show_in_feed: q.show_in_feed, created_at: q.created_at, min_age: q.min_age, max_age: q.max_age ?? null,
    translations: mapTr(q.translations, (t) => ({ question: t.question, options: t.options })),
  })),
  question_answers: content.questions.map((q) => ({ question_id: q.id, correct_index: q.correct_index, explanation: q.explanation, translations: mapTr(q.translations, (t) => ({ explanation: t.explanation })), answer: q.answer ?? null })),
  videos: content.videos.map((v) => ({
    id: v.id, category_id: v.category_id, title: v.title, hook: v.hook, description: v.description, video_url: v.video_url, thumbnail_url: v.thumbnail_url, duration_seconds: v.duration_seconds, has_audio: v.has_audio,
    captions: v.captions, creator_name: v.creator_name, format: v.format, sources: v.sources, published_at: v.published_at, tags: v.tags, quiz_question_id: v.quiz_question_id,
    verification_status: v.verification_status, status: v.status, min_age: v.min_age, start_seconds: v.start_seconds ?? null, end_seconds: v.end_seconds ?? null, license: v.license ?? null, translations: v.translations ?? {},
  })),
};
fs.writeFileSync(process.argv[2], JSON.stringify(rows));
console.log(Object.entries(rows).map(([k, v]) => `${k}: ${v.length}`).join(", "));
