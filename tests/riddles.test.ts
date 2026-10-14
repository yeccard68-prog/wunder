// Riddles: hints in every language, never the answer, and the app shows the right language.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { buildImportSql, loadContent, validateContent } from "../scripts/content/lib.mjs";
import { localizeItem, toItem, type QuestionRow } from "../lib/content";

type Row = QuestionRow & { hints?: string[]; tags: string[] };
const content = loadContent();
const riddles = (content.questions as Row[]).filter((q) => q.hints);
const errorsOf = (c: typeof content) => validateContent(c).errors as string[];

test("riddles carry 1–3 hints in German and English and the tag Rätsel", () => {
  assert.ok(riddles.length >= 25);
  for (const r of riddles) {
    assert.ok(r.hints!.length >= 1 && r.hints!.length <= 3, r.id);
    assert.equal(r.translations?.en?.hints?.length, r.hints!.length, r.id);
    assert.ok(r.tags.includes("Rätsel"), r.id);
    assert.ok(r.show_in_feed, r.id);
  }
});

test("validation rejects a hint that names the answer and a missing translated hint", () => {
  const c = structuredClone(content);
  const r = (c.questions as Row[]).find((q) => q.id === "rt3")!;
  r.hints = [...r.hints!.slice(0, -1), `Nimm ${r.options[r.correct_index!]} mit.`];
  assert.ok(errorsOf(c).some((e) => e.includes("rt3") && e.includes("gives away")));

  const d = structuredClone(content);
  const s = (d.questions as Row[]).find((q) => q.id === "rt5")!;
  s.translations!.en.hints = [];
  assert.ok(errorsOf(d).some((e) => e.includes("rt5") && e.includes("same number")));
});

test("hints reach the app in the chosen language", () => {
  const row = riddles.find((q) => q.id === "rt1")!;
  const item = toItem(row);
  assert.deepEqual(item.hints, row.hints);
  assert.deepEqual(localizeItem(item, "en").hints, row.translations!.en.hints);
  assert.deepEqual(localizeItem(item, "de").hints, row.hints);
  assert.equal(toItem((content.questions as Row[]).find((q) => !q.hints)!).hints, undefined);
});

test("the import writes hints as JSON and plain questions without", () => {
  const sql = buildImportSql(content) as string;
  assert.match(sql, /"translations", "hints"\)|translations, hints\)/);
  assert.ok(sql.includes(JSON.stringify(riddles[0].hints).replaceAll("'", "''")));
});
