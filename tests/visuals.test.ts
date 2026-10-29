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
  assert.deepEqual(visualsFor("de", "10-12").map((v) => v.id).sort(), visualRows.filter((v) => v.min_age <= 10).map((v) => v.id).sort()); // the age level filters
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

test("example settings: each one is a slider position that exists, and is named in every language", () => {
  for (const v of visualRows.filter((x) => x.type === "growth")) {
    const c = v.config as GrowthConfig;
    for (const p of c.presets ?? []) {
      assert.ok(v.labels[p.label] && v.translations.en.labels[p.label] && v.labels.presets, `${v.id}: ${p.label} named`);
      for (const [k, value] of Object.entries(p.values)) {
        const s = c[k as keyof typeof p.values];
        assert.ok(s.min <= value! && value! <= s.max && Number.isInteger(Math.round((value! - s.min) / s.step * 1e6) / 1e6), `${v.id}: ${p.label}.${k} on the slider`);
      }
    }
  }
  // the compound interest examples are exactly the settings its prediction and task talk about
  const z = visualRows.find((v) => v.id === "v-zinseszins")!.config as GrowthConfig;
  assert.deepEqual(z.presets!.map((p) => [p.values.monthly, p.values.rate, p.values.years]), [[100, 5, 20], [100, 5, 40], [200, 5, 20]]);
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

test("speed of sound: real values, relative view and the thunder task add up", async () => {
  const { relativeTo } = await import("../lib/visuals");
  const c = visualRows.find((v) => v.id === "v-schall")!.config as import("../lib/visuals").BarsConfig;
  const rel = relativeTo(c.items, c.baseline);
  assert.equal(rel[c.items.findIndex((i) => i.key === "air")], 1);
  assert.equal(Math.round(rel[c.items.findIndex((i) => i.key === "water")] * 100) / 100, 4.33); // "a little over four times" in the prediction
  assert.equal(Math.round((6 * 343) / 100) / 10, 2.1); // six seconds to the thunder: about two kilometres
  assert.ok(relativeTo(c.items, "nothing").every((x) => Number.isNaN(x))); // an unknown baseline gives no numbers rather than wrong ones
});

test("timeline: gaps between milestones, and labels never overlap", async () => {
  const { gaps, spreadLabels } = await import("../lib/visuals");
  const c = visualRows.find((v) => v.id === "v-technik-zeitleiste")!.config as import("../lib/visuals").TimelineConfig;
  const g = gaps(c.items);
  assert.equal(g[0].years, null);
  assert.equal(g.find((x) => x.key === "moon")!.years, 66); // the prediction: first flight → Moon landing
  assert.equal(g.find((x) => x.key === "steam")!.years, 319);
  assert.equal(g.find((x) => x.key === "smartphone")!.years, 16);
  assert.ok(c.items.every((e) => e.year >= c.from && e.year <= c.to));
  const placed = spreadLabels([10, 12, 13, 80, 81], 19);
  assert.deepEqual(placed, [10, 29, 48, 80, 99]);
  for (let i = 1; i < placed.length; i++) assert.ok(placed[i] - placed[i - 1] >= 19);
});

test("timeline before Christ: years read correctly, no year 0, round ticks", async () => {
  const { formatYear, gaps, yearTicks } = await import("../lib/visuals");
  assert.equal(formatYear(-3300, "de"), "3300 v. Chr.");
  assert.equal(formatYear(-3300, "en"), "3300 BC");
  assert.equal(formatYear(150, "de", true), "150 n. Chr.");
  assert.equal(formatYear(150, "en", true), "AD 150");
  assert.equal(formatYear(1446, "de", true), "1446");
  assert.equal(formatYear(1969, "de"), "1969");
  // from 250 BC to AD 150 are 399 years, because the year 1 BC is followed directly by AD 1
  assert.deepEqual(gaps([{ key: "a", year: -250 }, { key: "b", year: 150 }]).map((g) => g.years), [null, 399]);
  assert.deepEqual(yearTicks(-3500, 1600), [-3000, -2000, -1000, 1000]);
  assert.deepEqual(yearTicks(1400, 2030), [1400, 1500, 1600, 1700, 1800, 1900, 2000]);
  const c = visualRows.find((v) => v.id === "v-schrift-zeitleiste")!.config as import("../lib/visuals").TimelineConfig;
  assert.ok(c.items.every((e) => e.year >= c.from && e.year <= c.to && e.year !== 0));
  const g = gaps(c.items.filter((e) => !e.late));
  assert.equal(g.find((x) => x.key === "runes")!.years, 399); // Brahmi (250 BC) → runes (AD 150)
});
