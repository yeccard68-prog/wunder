import assert from "node:assert/strict";
import test from "node:test";
import { forAudience } from "../lib/content";
import { demoContent } from "../lib/demo-content";
import { entryId, mixFeed } from "../lib/feed";
import { studiesFor, studyRows, type StudyRow } from "../lib/studies";
import type { UserState } from "../lib/types";

const row = (id: string, patch: Partial<StudyRow> = {}): StudyRow => ({
  id, category_id: "science", min_age: 10, year: 1972, name: "Name", question: "Frage", method: "Methode", result: "Ergebnis", caveat: "Aber",
  sources: [{ name: "Wikipedia: X", url: "https://de.wikipedia.org/wiki/X" }], verification_status: "ai_checked", status: "published", created_at: "2026-10-22T12:00:00Z",
  translations: { en: { name: "Name EN", question: "Q", method: "M", result: "R", caveat: "But" } }, ...patch,
});
const state = (patch: Partial<UserState> = {}) => ({ hidden: [], clipStats: {}, answers: {}, ...patch }) as unknown as UserState;
const { items } = forAudience(demoContent(), "de", "16+");
const ranked = items.map((item) => ({ item, reason: "Neu" }));

test("studies: every published study has all four parts in both languages, a source and a caveat", () => {
  for (const s of studyRows.filter((r) => r.status === "published")) {
    for (const t of [s, s.translations.en]) for (const k of ["name", "question", "method", "result", "caveat"] as const) assert.ok(t?.[k]?.trim().length > 3, `${s.id} ${k}`);
    assert.ok(s.sources.length > 0 && s.sources.every((x) => x.url.startsWith("https://")), s.id);
    assert.match(s.id, /^s-[a-z0-9-]+$/);
  }
});

test("studies: language, age level and drafts", () => {
  const rows = [row("s-a"), row("s-b", { min_age: 16 }), row("s-c", { status: "draft" })];
  assert.deepEqual(studiesFor("de", "16+", rows).map((s) => s.id), ["s-a", "s-b"]);
  assert.deepEqual(studiesFor("de", "10-12", rows).map((s) => s.id), ["s-a"]);
  assert.equal(studiesFor("en", "16+", rows)[0].caveat, "But");
});

test("studies in the feed: each once, seen ones last", () => {
  const studies = studiesFor("de", "16+", [row("s-a"), row("s-b"), row("s-c")]);
  const feed = mixFeed(ranked, [], [], state(), [], [], [], [], studies);
  const ids = feed.filter((e) => e.kind === "study").map(entryId);
  assert.deepEqual([...ids].sort(), ["s-a", "s-b", "s-c"]);
  const later = mixFeed(ranked, [], [], state({ seen: { "s-a": Date.now() } } as Partial<UserState>), [], [], [], [], studies);
  const order = later.filter((e) => e.kind === "study").map(entryId);
  assert.equal(order[order.length - 1], "s-a");
});

test("clips: the list of titles that give away their quiz answer is up to date", async () => {
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, ["scripts/content/quiz-leaks.mjs", "--check"], { stdio: "pipe" });
});
