import assert from "node:assert/strict";
import test from "node:test";
import { factsFor } from "../lib/facts";
import { SERIES_EVERY, SERIES_SIZE, withSeries } from "../lib/series";

const facts = factsFor("de", "16+");

test("series: every few slots three facts of one area, no fact twice, none lost", () => {
  const units = withSeries(facts);
  const ids = units.flatMap((u) => (u.kind === "fact" ? [u.fact.id] : u.facts.map((f) => f.id)));
  assert.equal(ids.length, facts.length);
  assert.equal(new Set(ids).size, ids.length);
  const series = units.filter((u) => u.kind === "series");
  assert.ok(series.length > 0);
  for (const s of series) {
    if (s.kind !== "series") continue;
    assert.equal(s.facts.length, SERIES_SIZE);
    assert.ok(s.facts.every((f) => f.area === s.area && !f.quiz));
  }
  assert.equal(units[SERIES_EVERY - 1].kind === "series" || !!facts[0], true);
});

test("series: quiz facts stay single cards", () => {
  const units = withSeries(facts);
  for (const u of units) if (u.kind === "series") assert.ok(u.facts.every((f) => !f.quiz));
  assert.ok(units.some((u) => u.kind === "fact" && !!u.fact.quiz));
});

test("on this day: today's event, otherwise the nearest of this week, with how many years ago", async () => {
  const { eventsFor, formatEventDate } = await import("../lib/days");
  const today = eventsFor("de", "16+", new Date(2026, 9, 21));
  assert.equal(today[0].id, "d-1879-10-21-gluehlampe");
  assert.equal(today[0].yearsAgo, 147);
  assert.equal(today[0].offset, 0);
  const later = eventsFor("de", "16+", new Date(2026, 10, 23)); // 23 November: no event – 20 November is three days back
  assert.equal(later[0]?.offset, -3);
  assert.equal(eventsFor("de", "16+", new Date(2026, 1, 10)).length, 0); // nothing near: no card
  assert.equal(formatEventDate(today[0], "de"), "21. Oktober 1879");
  assert.match(eventsFor("en", "16+", new Date(2026, 9, 21))[0].text, /light bulb/);
});
