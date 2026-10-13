// Interactive visualisations: data, formulas and axes.  Run: npm test
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { CATEGORIES } from "../lib/categories";
import { compound, equilibrium, formatNumber, logTicks, paidIn, scale, ticks, visualRows, visualsFor, type GrowthConfig, type MarketConfig, type ScatterConfig } from "../lib/visuals";

const ids = (file: string) => new Set((JSON.parse(fs.readFileSync(file, "utf8")) as { id: string }[]).map((x) => x.id));
const known = { question: ids("content/questions.json"), animation: ids("content/animations.json"), book: ids("content/books.json") };

test("visuals: every record is complete, sourced, translated and points to things that exist", () => {
  assert.equal(new Set(visualRows.map((v) => v.id)).size, visualRows.length);
  for (const v of visualRows) {
    assert.ok(CATEGORIES.some((c) => c.id === v.category_id), `${v.id}: category`);
    assert.ok(["real", "model"].includes(v.data_kind), `${v.id}: data kind`);
    assert.ok(v.sources.length > 0 && v.sources.every((s) => /^https:\/\//.test(s.url)), `${v.id}: sources`);
    for (const l of v.links) assert.ok(known[l.kind].has(l.id), `${v.id}: link ${l.id}`);
    if (v.status === "published") assert.notEqual(v.verification_status, "unverified");
    for (const t of [v, v.translations.en]) {
      assert.ok(t.title && t.goal.length > 40 && t.intro.length > 40 && t.explain.length > 80, `${v.id}: texts`);
      assert.ok(t.note.length > 60, `${v.id}: the note must state assumptions and limits`);
      if (t.predict) assert.ok(t.predict.options.length >= 3 && t.predict.options[v.predict_correct!] && t.predict.feedback.length > 30, `${v.id}: prediction`);
    }
    assert.deepEqual(Object.keys(v.translations.en.labels).sort(), Object.keys(v.labels).sort(), `${v.id}: the same labels in every language`);
    assert.equal(!!v.predict, !!v.translations.en.predict);
  }
  assert.ok(new Set(visualRows.map((v) => v.type)).size >= 3); // several kinds of visualisation
  assert.equal(visualsFor("en", null).find((v) => v.id === "v-kepler")!.labels.earth, "Earth");
  assert.equal(visualsFor("de", "10-12").length, 0);
});

test("compound interest: the numbers shown are right", () => {
  // 100 a month at 5 % for 20 and 40 years – the figures the prediction quotes
  assert.equal(Math.round(compound(0, 100, 5, 20)[20]), 41103);
  assert.equal(Math.round(compound(0, 100, 5, 40)[40]), 152602);
  assert.deepEqual(compound(1000, 0, 0, 3), [1000, 1000, 1000, 1000]); // no interest, no saving: nothing changes
  assert.equal(Math.round(compound(1000, 0, 12, 1)[1] * 100) / 100, 1126.83); // 1 % a month for a year
  assert.deepEqual(paidIn(500, 100, 2), [500, 1700, 2900]);
  const c = visualRows.find((v) => v.id === "v-zinseszins")!.config as GrowthConfig;
  for (const s of [c.start, c.monthly, c.rate, c.years]) assert.ok(s.min <= s.value && s.value <= s.max && s.step > 0);
  assert.ok(compound(0, 200, 5, 20)[20] < compound(0, 100, 5, 40)[40]); // the task: doubling the time beats doubling the rate
});

test("supply and demand: the crossing point moves the way the texts say", () => {
  const c = visualRows.find((v) => v.id === "v-angebot-nachfrage")!.config as MarketConfig;
  const base = equilibrium(c);
  assert.deepEqual([base.quantity, base.price].map((x) => Math.round(x * 100) / 100), [10, 1.5]);
  const hot = equilibrium(c, 1, 0); // more demand: price and quantity both rise
  assert.ok(hot.price > base.price && hot.quantity > base.quantity);
  const milk = equilibrium(c, 0, 0.5); // higher costs: price up, quantity down
  assert.ok(milk.price > base.price && milk.quantity < base.quantity);
  const cheap = equilibrium(c, 0, -0.3);
  assert.ok(cheap.price < base.price && cheap.quantity > base.quantity);
  // on both lines at once, and inside the picture at every slider position
  for (const d of [c.demandShift.min, 0, c.demandShift.max])
    for (const k of [c.costShift.min, 0, c.costShift.max]) {
      const e = equilibrium(c, d, k);
      assert.ok(Math.abs(c.demand.intercept + d - c.demand.slope * e.quantity - e.price) < 1e-9);
      assert.ok(e.quantity > 0 && e.quantity < c.maxQuantity && e.price > 0 && e.price < c.maxPrice, `outside the plot at ${d}/${k}`);
    }
  assert.equal(equilibrium(c, -10, 0).quantity, 0); // nobody wants it: nothing is sold, never a negative quantity
});

test("planets: the real data follow Kepler's third law", () => {
  const c = visualRows.find((v) => v.id === "v-kepler")!.config as ScatterConfig;
  assert.equal(c.points.length, 9);
  for (const p of c.points) assert.ok(Math.abs(Math.pow(p.x, c.power) / p.y - 1) < 0.01, `${p.key}: ${Math.pow(p.x, c.power)} vs ${p.y}`);
  assert.deepEqual(c.points.filter((p) => p.late).map((p) => p.key), ["ceres"]); // shown only after the prediction
});

test("axes: round ticks, logarithmic ticks, scaling and number formats", () => {
  assert.deepEqual(ticks(152602), [0, 50000, 100000, 150000]);
  assert.deepEqual(ticks(16), [0, 5, 10, 15]);
  assert.deepEqual(ticks(0), [0]);
  assert.deepEqual(logTicks(0.241, 164.8), [0.1, 1, 10, 100, 1000]);
  assert.equal(scale(5, 0, 10, 100, 200), 150);
  assert.equal(Math.round(scale(10, 1, 100, 0, 200, true)), 100); // halfway on a logarithmic axis
  assert.equal(formatNumber(152602.3, "de"), "152.602");
  assert.equal(formatNumber(152602.3, "en"), "152,602");
  assert.equal(formatNumber(1.5, "de", 2), "1,5");
});
