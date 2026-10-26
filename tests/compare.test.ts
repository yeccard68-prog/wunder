// Size comparisons (lib/compare.ts): data rules, texts and the feed order.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { compareRows, comparisonAnimation, comparisonsFor, withComparisons } from "../lib/compare";
import { animationsFor } from "../lib/animations";

test("comparisons: four distinct items, the small one still visible, every item linked to Wikidata", () => {
  assert.ok(compareRows.length >= 150);
  for (const row of compareRows) {
    assert.equal(row.items.length, 4, row.id);
    assert.equal(new Set(row.items.map((i) => i.de)).size, 4, row.id);
    const v = row.items.map((i) => i.value);
    assert.ok(v.every((x) => x > 0), row.id);
    assert.ok(Math.max(...v) <= Math.min(...v) * (row.kind === "area" ? 25 : row.kind === "peak" ? 6 : 12), row.id);
    assert.ok(row.items.every((i) => /^Q\d+$/.test(i.qid)), row.id);
    if (row.kind === "peak") assert.equal(new Set(row.items.map((i) => i.qid)).size, 4, row.id);
  }
});

test("comparisons: the prediction's answer is the largest, the last step names it, one step per item", () => {
  for (const locale of ["de", "en"]) {
    for (const row of compareRows) {
      const a = comparisonAnimation(row, locale);
      const v = a.compare!.values;
      assert.equal(a.predict!.correct, v.indexOf(Math.max(...v)), row.id);
      assert.equal(a.steps.length, 6, row.id);
      assert.equal(a.labels.length, 8, row.id);
      assert.ok(a.steps[5].text.includes(a.predict!.options[a.predict!.correct]) || row.kind === "peak", row.id);
      assert.equal(a.sources.length, 4, row.id);
    }
  }
  const de = comparisonAnimation(compareRows.find((r) => r.kind === "area")!, "de");
  assert.match(de.steps[1].text, /km²$/);
  assert.match(de.steps[5].text, /^Am größten: .+ – rund [\d,]+-mal so viel Fläche/);
});

test("comparisons in the feed: hand-made and comparisons alternate, the learner's country comes first", () => {
  const hand = animationsFor("de", "16+");
  const cmp = comparisonsFor("de", "16+");
  const mixed = withComparisons(hand, cmp, "DE", "s1");
  assert.equal(mixed.length, hand.length + cmp.length);
  assert.equal(mixed[0].id, hand[0].id);
  assert.ok(mixed[1].scene === "compare" && mixed[2].scene === "compare");
  const own = cmp.filter((a) => a.countries?.includes("DE")).length;
  assert.ok(own >= 1);
  const firstCmp = mixed.filter((a) => a.compare).slice(0, own);
  assert.ok(firstCmp.every((a) => a.countries?.includes("DE")));
});
