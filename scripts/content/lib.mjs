// Content workflow helpers: load content/*.json, validate it, and turn it into idempotent SQL.
import fs from "node:fs";
import path from "node:path";

const STATUS = ["draft", "review", "published", "archived"];
const VERIFICATION = ["unverified", "ai_checked", "verified"];
const AGES = [6, 10, 13, 16];
const LOCALE = /^[a-z]{2}(-[A-Z]{2})?$/;

export function loadContent(dir = "content") {
  const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name + ".json"), "utf8"));
  return { categories: read("categories"), questions: read("questions"), videos: read("videos") };
}

const blank = (v) => typeof v !== "string" || v.trim() === "";

/** Returns { errors, warnings }. Errors block the import; warnings report missing optional metadata. */
export function validateContent({ categories, questions, videos }, { publicDir = "public" } = {}) {
  const errors = [];
  const warnings = [];
  const dup = (list, key, label) => {
    const seen = new Set();
    for (const row of list) {
      const v = typeof row[key] === "string" ? row[key].trim().toLowerCase() : row[key];
      if (seen.has(v)) errors.push(`${label}: duplicate ${key} "${row[key]}"`);
      seen.add(v);
    }
  };
  dup(categories, "id", "categories");
  dup(categories, "slug", "categories");
  dup(questions, "id", "questions");
  dup(questions, "question", "questions");
  dup(videos, "id", "videos");
  dup(videos, "video_url", "videos");

  const cats = new Set(categories.map((c) => c.id));
  for (const c of categories) {
    if (blank(c.id) || blank(c.slug) || blank(c.name)) errors.push(`category ${c.id}: id, slug and name are required`);
    if (!Number.isInteger(c.display_order)) errors.push(`category ${c.id}: display_order must be an integer`);
    for (const [loc, t] of Object.entries(c.translations ?? {})) if (!LOCALE.test(loc) || blank(t.name)) errors.push(`category ${c.id}: invalid translation "${loc}"`);
  }

  const qById = new Map(questions.map((q) => [q.id, q]));
  for (const q of questions) {
    const at = `question ${q.id}`;
    if (blank(q.id)) errors.push("question without id");
    const special = ["order", "estimate", "blank"].includes(q.kind);
    if (!["question", "fact"].includes(q.kind) && !special) errors.push(`${at}: unknown kind "${q.kind}"`);
    if (special) {
      const a = q.answer ?? {};
      if (q.correct_index !== 0) errors.push(`${at}: correct_index must be 0 (placeholder) for ${q.kind}`);
      if (q.kind === "order" && !(Array.isArray(a.order) && [...a.order].sort().join() === (q.options ?? []).map((_, i) => i).join())) errors.push(`${at}: answer.order must list every option index once`);
      if (q.kind === "estimate") {
        const [min, max, , step] = (q.options ?? []).map(Number);
        if (q.options?.length !== 4 || !(min < max) || !(step > 0)) errors.push(`${at}: options must be [min, max, unit, step]`);
        else if (!(a.value >= min && a.value <= max) || (a.abs == null && a.rel == null)) errors.push(`${at}: answer needs a value inside the range and abs or rel`);
        else if ((a.value - min) % step !== 0 && a.abs === 0) errors.push(`${at}: exact value cannot be reached with this step`);
      }
      if (q.kind === "blank") {
        if (!String(q.question ?? "").includes("___") || Object.values(q.translations ?? {}).some((t) => !String(t.question).includes("___"))) errors.push(`${at}: the question must be the sentence with ___ (in every language)`);
        if (!(Array.isArray(a.accept) && a.accept.length && a.accept.every((x) => x === String(x).toLowerCase().trim())) || blank(a.show)) errors.push(`${at}: answer needs lower-case accept[] and show`);
      }
    } else if (q.answer != null) errors.push(`${at}: only order / estimate / blank questions carry an answer object`);
    if (!cats.has(q.category_id)) errors.push(`${at}: unknown category "${q.category_id}"`);
    if (blank(q.question)) errors.push(`${at}: question text missing`);
    if (blank(q.explanation)) errors.push(`${at}: explanation missing`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) errors.push(`${at}: needs 2–6 options`);
    else {
      if (q.options.some(blank)) errors.push(`${at}: empty option`);
      if (new Set(q.options.map((o) => String(o).trim().toLowerCase())).size !== q.options.length) errors.push(`${at}: duplicate options`);
      if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index >= q.options.length) errors.push(`${at}: correct_index ${q.correct_index} does not point at an option`);
      if (q.kind === "fact" && q.options.length !== 2) errors.push(`${at}: true/false cards need exactly 2 options`);
    }
    if (![1, 2, 3].includes(q.difficulty)) errors.push(`${at}: difficulty must be 1, 2 or 3`);
    if (!AGES.includes(q.min_age)) errors.push(`${at}: min_age must be one of ${AGES.join(", ")}`);
    if (q.max_age != null && !(q.max_age >= q.min_age)) errors.push(`${at}: max_age must not be below min_age`);
    if (!STATUS.includes(q.status)) errors.push(`${at}: invalid status "${q.status}"`);
    if (!VERIFICATION.includes(q.verification_status)) errors.push(`${at}: invalid verification_status`);
    if (!Array.isArray(q.tags)) errors.push(`${at}: tags must be an array`);
    if (Number.isNaN(Date.parse(q.created_at))) errors.push(`${at}: invalid created_at`);
    // A translation must mirror the original: same number of options in the same order (the answer index is shared).
    for (const [loc, t] of Object.entries(q.translations ?? {})) {
      if (!LOCALE.test(loc)) errors.push(`${at}: invalid locale "${loc}"`);
      if (blank(t.question) || blank(t.explanation)) errors.push(`${at}: translation "${loc}" needs question and explanation`);
      if (!Array.isArray(t.options) || t.options.length !== q.options?.length || t.options.some(blank)) errors.push(`${at}: translation "${loc}" must have the same number of options as the original`);
    }
    // riddle hints: 1–3 per language, the same number in every language, never the answer itself
    if (q.hints != null) {
      const sets = [q.hints, ...Object.values(q.translations ?? {}).map((t) => t.hints)];
      const answers = [q.options?.[q.correct_index], ...Object.values(q.translations ?? {}).map((t) => t.options?.[q.correct_index])].filter(Boolean).map((a) => String(a).toLowerCase());
      if (!Array.isArray(q.hints) || q.hints.length < 1 || q.hints.length > 3 || q.hints.some(blank)) errors.push(`${at}: hints must be 1–3 texts`);
      else if (sets.some((h) => !Array.isArray(h) || h.length !== q.hints.length)) errors.push(`${at}: every language needs the same number of hints`);
      else if (sets.flat().some((h) => answers.some((a) => a.length > 3 && String(h).toLowerCase().includes(a)))) errors.push(`${at}: a hint gives away the answer`);
    }
    if (blank(q.source_name)) warnings.push(`${at}: no source name`);
    if (blank(q.source_url)) warnings.push(`${at}: no source URL`);
  }

  for (const v of videos) {
    const at = `video ${v.id}`;
    if (blank(v.id) || blank(v.title) || blank(v.hook)) errors.push(`${at}: id, title and hook are required`);
    if (!cats.has(v.category_id)) errors.push(`${at}: unknown category "${v.category_id}"`);
    if (blank(v.video_url)) errors.push(`${at}: video_url missing`);
    else if (v.video_url.startsWith("/")) {
      // app-bundled asset: the file must exist and be a real video file
      const file = path.join(publicDir, v.video_url);
      if (!fs.existsSync(file)) errors.push(`${at}: file ${v.video_url} not found in ${publicDir}/`);
      else if (fs.statSync(file).size < 10_000) errors.push(`${at}: file ${v.video_url} is suspiciously small`);
    } else if (!/^https:\/\//.test(v.video_url)) errors.push(`${at}: video_url must be https:// or an app path starting with /`);
    else if (blank(v.license)) errors.push(`${at}: external videos need a license note`);
    // own clips with labels in the picture bring one video per language (translations.<lang>.file / poster)
    for (const [lang, tr] of Object.entries(v.translations ?? {}))
      for (const key of ["file", "poster"])
        if (tr?.[key] && !(String(tr[key]).startsWith("/") && fs.existsSync(path.join(publicDir, tr[key])))) errors.push(`${at}: ${lang} ${key} ${tr[key]} not found in ${publicDir}/`);
    if (!(v.duration_seconds > 0 && v.duration_seconds <= 60)) errors.push(`${at}: duration_seconds must be between 0 and 60`);
    if (v.end_seconds != null && !(v.end_seconds > (v.start_seconds ?? 0))) errors.push(`${at}: end_seconds must be after start_seconds`);
    if (v.end_seconds != null && Math.abs(v.end_seconds - (v.start_seconds ?? 0) - v.duration_seconds) > 0.01) errors.push(`${at}: duration_seconds must equal the segment length`);
    if (!AGES.includes(v.min_age)) errors.push(`${at}: min_age must be one of ${AGES.join(", ")}`);
    if (!Array.isArray(v.captions)) errors.push(`${at}: captions must be an array`);
    else if (!v.captions.length) warnings.push(`${at}: no captions`);
    if (!Array.isArray(v.sources) || !v.sources.length) errors.push(`${at}: at least one source is required`);
    else if (v.sources.some((s) => blank(s.name) || !/^https:\/\//.test(s.url ?? ""))) errors.push(`${at}: every source needs a name and an https URL`);
    if (!STATUS.includes(v.status)) errors.push(`${at}: invalid status "${v.status}"`);
    if (!VERIFICATION.includes(v.verification_status)) errors.push(`${at}: invalid verification_status`);
    for (const [loc, t] of Object.entries(v.translations ?? {})) {
      if (!LOCALE.test(loc) || blank(t.title) || blank(t.hook)) errors.push(`${at}: translation "${loc}" needs title and hook`);
      if (!Array.isArray(t.captions) || t.captions.length !== v.captions?.length) errors.push(`${at}: translation "${loc}" must have the same number of captions`);
    }
    if (v.quiz_question_id) {
      const quiz = qById.get(v.quiz_question_id);
      if (!quiz) errors.push(`${at}: quiz question "${v.quiz_question_id}" does not exist`);
      else if (quiz.show_in_feed) errors.push(`${at}: quiz question must have show_in_feed = false`);
    }
    if (v.status === "published" && blank(v.thumbnail_url)) warnings.push(`${at}: no thumbnail`);
  }

  const live = questions.filter((q) => q.status === "published");
  const noTags = live.filter((q) => !q.tags?.length).length;
  if (noTags) warnings.push(`${noTags} questions have no tags`);
  const locales = new Set(live.flatMap((q) => Object.keys(q.translations ?? {})));
  for (const loc of locales) {
    const missing = live.filter((q) => !q.translations?.[loc]).length;
    if (missing) warnings.push(`${missing} questions have no "${loc}" translation (they will be shown in the original language)`);
  }
  const unverified = live.filter((q) => q.verification_status === "unverified").length + videos.filter((v) => v.status === "published" && v.verification_status === "unverified").length;
  if (unverified) warnings.push(`${unverified} published records are not editorially verified yet`);
  return { errors, warnings };
}

// ---------- SQL ----------
const s = (v) => (v === null || v === undefined ? "null" : `'${String(v).replaceAll("'", "''")}'`);
const j = (v) => `${s(JSON.stringify(v))}::jsonb`;
const n = (v) => (v === null || v === undefined ? "null" : String(v));
const arr = (v) => (v.length ? `array[${v.map(s).join(", ")}]::text[]` : `'{}'::text[]`);
const mapTr = (translations, pick) => Object.fromEntries(Object.entries(translations ?? {}).map(([loc, t]) => [loc, pick(t)]));

function insert(table, columns, rows, conflict, update) {
  if (!rows.length) return "";
  const values = rows.map((r) => `  (${r.join(", ")})`).join(",\n");
  const action = update ? `do update set ${columns.filter((c) => !conflict.includes(c) && c !== "created_at").map((c) => `${c} = excluded.${c}`).join(", ")}` : "do nothing";
  return `insert into public.${table} (${columns.join(", ")}) values\n${values}\non conflict (${conflict.join(", ")}) ${action};\n`;
}

/**
 * Idempotent import. Default: only adds records that do not exist yet (never touches existing rows).
 * With update = true, existing content rows are updated from the dataset (the editing workflow).
 * `only` limits the output to the given record ids (for small, reviewable imports).
 * User data and like counters are never written.
 */
export function buildImportSql({ categories, questions, videos }, { update = false, only = null } = {}) {
  const keep = (row) => !only || only.has(row.id);
  const qs = questions.filter(keep);
  const vs = videos.filter(keep);
  return [
    `-- Generated by scripts/content/import.mjs – do not edit by hand.`,
    `-- Mode: ${update ? "insert new + update existing content" : "insert new records only"}`,
    `begin;`,
    insert("categories", ["id", "slug", "name", "description", "display_order", "is_active", "translations"],
      (only ? [] : categories).map((c) => [s(c.id), s(c.slug), s(c.name), s(c.description), c.display_order, c.is_active, j(c.translations ?? {})]), ["id"], update),
    insert("questions", ["id", "kind", "category_id", "question", "options", "difficulty", "tags", "source_name", "source_url", "verification_status", "status", "show_in_feed", "created_at", "min_age", "max_age", "translations", "hints"],
      qs.map((q) => [s(q.id), s(q.kind), s(q.category_id), s(q.question), j(q.options), q.difficulty, arr(q.tags), s(q.source_name), s(q.source_url), s(q.verification_status), s(q.status), q.show_in_feed, s(q.created_at), q.min_age, n(q.max_age),
        j(mapTr(q.translations, (t) => ({ question: t.question, options: t.options, ...(t.hints ? { hints: t.hints } : {}) }))), q.hints ? j(q.hints) : "null"]), ["id"], update),
    // explanations (original and translated) go to the private answer table
    insert("question_answers", ["question_id", "correct_index", "explanation", "translations", "answer"],
      qs.map((q) => [s(q.id), q.correct_index, s(q.explanation), j(mapTr(q.translations, (t) => ({ explanation: t.explanation }))), q.answer ? j(q.answer) : "null"]), ["question_id"], update),
    insert("videos", ["id", "category_id", "title", "hook", "description", "video_url", "thumbnail_url", "duration_seconds", "has_audio", "captions", "creator_name", "format", "sources", "published_at", "tags", "quiz_question_id", "verification_status", "status", "min_age", "start_seconds", "end_seconds", "license", "translations"],
      vs.map((v) => [s(v.id), s(v.category_id), s(v.title), s(v.hook), s(v.description), s(v.video_url), s(v.thumbnail_url), v.duration_seconds, v.has_audio, j(v.captions), s(v.creator_name), s(v.format), j(v.sources), s(v.published_at), arr(v.tags), s(v.quiz_question_id), s(v.verification_status), s(v.status), v.min_age, n(v.start_seconds), n(v.end_seconds), s(v.license), j(v.translations ?? {})]), ["id"], update),
    `commit;`,
  ].join("\n");
}
