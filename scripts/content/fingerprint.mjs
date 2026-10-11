// Verifies that the database content matches content/*.json field by field.
//   npm run content:verify
// Prints one checksum per table for the local dataset plus the SQL that produces the same
// checksums in the database (run it in the Supabase SQL editor and compare).
import crypto from "node:crypto";
import { loadContent } from "./lib.mjs";

const SEP = "\u001f";
const md5 = (rows) => crypto.createHash("md5").update(rows.sort().join("\n"), "utf8").digest("hex");
const epoch = (iso) => String(Math.floor(Date.parse(iso) / 1000));
// translations in a stable text form: locale=field1¦field2… sorted by locale
const tr = (translations, fields) => Object.keys(translations ?? {}).sort().map((loc) => loc + "=" + fields.map((f) => (Array.isArray(translations[loc][f]) ? translations[loc][f].join("|") : translations[loc][f] ?? "")).join("¦")).join("§");
const { categories, questions, videos } = loadContent();

export const local = {
  categories: md5(categories.map((c) => [c.id, c.slug, c.name, c.description ?? "", c.display_order, c.is_active, tr(c.translations, ["name", "description"])].join(SEP))),
  questions: md5(questions.map((q) => [q.id, q.kind, q.category_id, q.question, q.options.join("|"), q.difficulty, q.tags.join("|"), q.source_name ?? "", q.source_url ?? "",
    q.verification_status, q.status, q.show_in_feed, epoch(q.created_at), q.correct_index, q.explanation, q.min_age, q.max_age ?? "", tr(q.translations, ["question", "options", "explanation"])].join(SEP))),
  videos: md5(videos.map((v) => [v.id, v.category_id, v.title, v.hook, v.description ?? "", v.video_url, v.thumbnail_url ?? "", v.duration_seconds, v.has_audio, v.captions.join("|"),
    v.creator_name ?? "", v.format ?? "", v.sources.map((s) => s.name + "=" + s.url).join("|"), epoch(v.published_at), v.tags.join("|"), v.quiz_question_id ?? "", v.verification_status, v.status,
    v.min_age, v.start_seconds ?? "", v.end_seconds ?? "", v.license ?? "", tr(v.translations, ["title", "hook", "description", "captions"])].join(SEP))),
  counts: { categories: categories.length, questions: questions.length, videos: videos.length },
};

const arr = (expr) => `(select coalesce(string_agg(x, '|' order by n), '') from jsonb_array_elements_text(${expr}) with ordinality e(x, n))`;
export const sql = `
select
  (select md5(string_agg(r, E'\\n' order by r collate "C")) from (
     select concat_ws(E'\\x1f', id, slug, name, coalesce(description, ''), display_order, is_active::text,
       (select coalesce(string_agg(k || '=' || (v ->> 'name') || '¦' || coalesce(v ->> 'description', ''), '§' order by k collate "C"), '') from jsonb_each(translations) t(k, v))) as r
     from public.categories) t) as categories,
  (select md5(string_agg(r, E'\\n' order by r collate "C")) from (
     select concat_ws(E'\\x1f', q.id, q.kind, q.category_id, q.question, ${arr("q.options")},
       q.difficulty, array_to_string(q.tags, '|'), coalesce(q.source_name, ''), coalesce(q.source_url, ''),
       q.verification_status, q.status, q.show_in_feed::text, extract(epoch from q.created_at)::bigint, a.correct_index, a.explanation, q.min_age, coalesce(q.max_age::text, ''),
       (select coalesce(string_agg(k || '=' || (v ->> 'question') || '¦' || ${arr("v -> 'options'")} || '¦' || coalesce(a.translations -> k ->> 'explanation', ''), '§' order by k collate "C"), '') from jsonb_each(q.translations) t(k, v))) as r
     from public.questions q join public.question_answers a on a.question_id = q.id) t) as questions,
  (select md5(string_agg(r, E'\\n' order by r collate "C")) from (
     select concat_ws(E'\\x1f', v.id, v.category_id, v.title, v.hook, coalesce(v.description, ''), v.video_url, coalesce(v.thumbnail_url, ''),
       v.duration_seconds::float8, v.has_audio::text, ${arr("v.captions")},
       coalesce(v.creator_name, ''), coalesce(v.format, ''),
       (select coalesce(string_agg((s ->> 'name') || '=' || (s ->> 'url'), '|' order by n), '') from jsonb_array_elements(v.sources) with ordinality x(s, n)),
       extract(epoch from v.published_at)::bigint, array_to_string(v.tags, '|'), coalesce(v.quiz_question_id, ''), v.verification_status, v.status,
       v.min_age, coalesce(v.start_seconds::float8::text, ''), coalesce(v.end_seconds::float8::text, ''), coalesce(v.license, ''),
       (select coalesce(string_agg(k || '=' || (t ->> 'title') || '¦' || (t ->> 'hook') || '¦' || coalesce(t ->> 'description', '') || '¦' || ${arr("t -> 'captions'")}, '§' order by k collate "C"), '') from jsonb_each(v.translations) x(k, t))) as r
     from public.videos v) t) as videos,
  (select count(*) from public.categories) as n_categories,
  (select count(*) from public.questions) as n_questions,
  (select count(*) from public.question_answers) as n_answers,
  (select count(*) from public.videos) as n_videos;`;

if (process.argv[1]?.endsWith("fingerprint.mjs")) {
  console.log("Lokaler Datensatz:", JSON.stringify(local, null, 2));
  console.log("\nIn der Datenbank ausführen und vergleichen:\n" + sql);
}
