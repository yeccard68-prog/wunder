import assert from "node:assert/strict";
import { test } from "node:test";
import { chatAllowedFor, chatProblem, CHAT_MAX, tidy } from "../lib/chat";
import { BOT_ACCURACY } from "../lib/duel";
import { places, timeLeft } from "../lib/groups";

test("chat: normal sentences pass, also with numbers and words that only contain a blocked word across borders", () => {
  for (const s of ["Wer hat gewonnen?", "eine gerade Linie", "2024 waren es 15 Fragen", "Gut gespielt! 😀", "Das war knapp: 4 zu 5"]) assert.equal(chatProblem(s), null, s);
});

test("chat: insults, links and contact data are refused", () => {
  assert.equal(chatProblem("du arschloch"), "words");
  assert.equal(chatProblem("A R S C H"), null); // single letters are not words – reports catch the rest
  assert.equal(chatProblem("so ein Sch1t"), null);
  assert.equal(chatProblem("shit"), "words");
  assert.equal(chatProblem("schau auf beispiel.com"), "link");
  assert.equal(chatProblem("www.irgendwas.xyz"), "link");
  assert.equal(chatProblem("https://x.y"), "link");
  assert.equal(chatProblem("mail an x@y.de"), "contact");
  assert.equal(chatProblem("ruf an: 0171 234 5678"), "contact");
  assert.equal(chatProblem("+49 (171) 234-5678"), "contact");
});

test("chat: empty and too long messages", () => {
  assert.equal(chatProblem("   "), "empty");
  assert.equal(chatProblem("a".repeat(CHAT_MAX)), null);
  assert.equal(chatProblem("a".repeat(CHAT_MAX + 1)), "long");
  assert.equal(tidy("  Wer hat   gewonnen?  "), "Wer hat gewonnen?");
});

test("chat only from 16", () => {
  assert.equal(chatAllowedFor("16+"), true);
  for (const band of ["6-9", "10-12", "13-15", null, undefined]) assert.equal(chatAllowedFor(band), false);
});

test("group ranking: equal scores share a place", () => {
  assert.deepEqual(places([{ score: 6 }, { score: 4 }, { score: 4 }, { score: 1 }]), [1, 2, 2, 4]);
  assert.deepEqual(places([]), []);
});

test("group round: time left in days and hours", () => {
  const now = Date.parse("2026-10-19T12:00:00Z");
  assert.deepEqual(timeLeft("2026-10-22T12:00:00Z", now), { days: 3, hours: 0 });
  assert.deepEqual(timeLeft("2026-10-19T17:30:00Z", now), { days: 0, hours: 6 });
  assert.deepEqual(timeLeft("2026-10-18T12:00:00Z", now), { days: 0, hours: 0 });
});

test("computer levels get stronger and match the database", () => {
  assert.deepEqual(BOT_ACCURACY, { 1: 0.5, 2: 0.67, 3: 0.8 });
});
