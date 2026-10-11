// Content dataset, validation rules and import SQL.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildImportSql, loadContent, validateContent } from "../scripts/content/lib.mjs";

const content = loadContent();
const clone = () => structuredClone(content);
const errorsOf = (c: typeof content) => validateContent(c).errors as string[];

test("dataset has the expected record counts", () => {
  assert.equal(content.categories.length, 6);
  assert.equal(content.questions.filter((q: { show_in_feed: boolean }) => q.show_in_feed).length, 167);
  assert.equal(content.questions.filter((q: { show_in_feed: boolean }) => !q.show_in_feed).length, 12);
  assert.equal(content.videos.length, 12);
  assert.equal(content.videos.filter((v: { status: string }) => v.status === "published").length, 6);
});

test("the current dataset passes validation", () => {
  assert.deepEqual(errorsOf(content), []);
});

test("every video file exists and is referenced exactly once", () => {
  for (const v of content.videos) assert.ok(v.video_url.startsWith("https://") || fs.existsSync("public" + v.video_url), v.video_url);
  assert.equal(new Set(content.videos.map((v: { video_url: string }) => v.video_url)).size, content.videos.length);
});

test("every question keeps a source", () => {
  for (const q of content.questions) assert.ok(q.source_name && q.source_url, q.id);
});

test("validation rejects a correct answer that points at no option", () => {
  const c = clone();
  c.questions[0].correct_index = 4;
  assert.match(errorsOf(c).join("\n"), /correct_index 4 does not point at an option/);
});

test("validation rejects duplicate ids, duplicate text and duplicate options", () => {
  const c = clone();
  c.questions.push({ ...c.questions[0] });
  c.questions[1].options = ["A", "a ", "B", "C"];
  const e = errorsOf(c).join("\n");
  assert.match(e, /duplicate id/);
  assert.match(e, /duplicate question/);
  assert.match(e, /duplicate options/);
});

test("validation rejects missing fields, unknown categories and bad true/false cards", () => {
  const c = clone();
  c.questions[0].explanation = " ";
  c.questions[1].category_id = "sports";
  const fact = c.questions.find((q: { kind: string }) => q.kind === "fact");
  fact.options = ["Stimmt", "Stimmt nicht", "Vielleicht"];
  const e = errorsOf(c).join("\n");
  assert.match(e, /explanation missing/);
  assert.match(e, /unknown category "sports"/);
  assert.match(e, /exactly 2 options/);
});

test("validation rejects videos without file, source or with a feed question as quiz", () => {
  const c = clone();
  c.videos[0].video_url = "/clips/does-not-exist.mp4";
  c.videos[1].sources = [];
  c.videos[2].quiz_question_id = "s1";
  const e = errorsOf(c).join("\n");
  assert.match(e, /not found/);
  assert.match(e, /at least one source/);
  assert.match(e, /show_in_feed = false/);
});

test("missing optional metadata is reported as a warning, not invented", () => {
  const { warnings } = validateContent(content);
  assert.ok(warnings.some((w: string) => /no thumbnail/.test(w)));
  assert.ok(warnings.some((w: string) => /have no tags/.test(w)));
});

test("import SQL is idempotent and never destructive", () => {
  const sql: string = buildImportSql(content);
  assert.equal((sql.match(/on conflict \(\w+\) do nothing;/g) ?? []).length, 4);
  assert.doesNotMatch(sql, /\b(truncate|delete from|drop )\b/i);
  assert.doesNotMatch(sql, /like_count|demo_popularity|demo_comments/); // invented demo numbers are not imported
  assert.equal((sql.match(/^  \('/gm) ?? []).length, 6 + 179 + 179 + 12);
});

test("update mode only touches content columns", () => {
  const sql: string = buildImportSql(content, { update: true });
  assert.match(sql, /do update set slug = excluded\.slug/);
  assert.doesNotMatch(sql, /created_at = excluded/);
});

test("single quotes in content are escaped", () => {
  const sql: string = buildImportSql(content);
  assert.match(sql, /The Landlord''s Game/);
});

test("the generated seed file is up to date with the dataset", () => {
  assert.equal(fs.readFileSync("supabase/seed/content.sql", "utf8").trim(), buildImportSql(content, { update: true }).trim());
});
