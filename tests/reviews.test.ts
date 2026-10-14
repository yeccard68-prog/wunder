// Human review: fingerprints, lapsing approvals, the review queue.  Run: npm test
import assert from "node:assert/strict";
import test from "node:test";
import { animationRows, animationsFor } from "../lib/animations";
import { bookRows, booksFor } from "../lib/books";
import { bundleEntries, databaseEntries, stateOf } from "../lib/review-queue";
import { contentHash, reviewedStatus, setApprovals } from "../lib/reviews";
import type { ContentReview, ReviewItem } from "../lib/supabase";
import { visualRows } from "../lib/visuals";

const t = (s: string, v?: Record<string, string | number>) => (v ? Object.entries(v).reduce((x, [k, n]) => x.replace("{" + k + "}", String(n)), s) : s);
const review = (kind: ContentReview["kind"], id: string, decision: ContentReview["decision"], hash: string | null, note: string | null = null): ContentReview => ({ kind, id, decision, note, content_hash: hash, reviewed_at: "2026-10-14T10:00:00Z" });

test("fingerprint: stable, independent of key order and review fields, sensitive to any edit", () => {
  const book = bookRows[0];
  assert.match(contentHash(book), /^[0-9a-f]{8}$/);
  assert.equal(contentHash(book), contentHash(structuredClone(book)));
  assert.equal(contentHash({ a: 1, b: [1, { c: 2, d: 3 }] }), contentHash({ b: [1, { d: 3, c: 2 }], a: 1 }));
  assert.equal(contentHash({ ...book, verification_status: "verified", status: "archived" }), contentHash(book)); // the review state is not content
  const edited = structuredClone(book);
  edited.ideas[1].text += " ";
  assert.notEqual(contentHash(edited), contentHash(book)); // even a single added space
  const english = structuredClone(book);
  english.translations.en.ideas[0].takeaway = "Changed.";
  assert.notEqual(contentHash(english), contentHash(book)); // the English version is part of what was reviewed
  const hashes = new Set([...bookRows, ...animationRows, ...visualRows].map((r) => contentHash(r)));
  assert.equal(hashes.size, bookRows.length + animationRows.length + visualRows.length); // no two pieces share a fingerprint
});

test("an approval shows in the app only for the version that was read", () => {
  const a = animationRows[0];
  assert.equal(reviewedStatus("animation", a), "ai_checked");
  setApprovals([{ kind: "animation", id: a.id, content_hash: contentHash(a) }]);
  assert.equal(reviewedStatus("animation", a), "verified");
  assert.equal(animationsFor("de", null).find((x) => x.id === a.id)!.verification, "verified");
  assert.equal(reviewedStatus("animation", { ...a, title: a.title + "!" } as typeof a), "ai_checked"); // edited after approval → lapses
  assert.equal(reviewedStatus("book", { id: a.id, verification_status: "ai_checked" }), "ai_checked"); // approvals are per kind
  setApprovals([{ kind: "book", id: bookRows[0].id, content_hash: "00000000" }]);
  assert.equal(booksFor("de", null)[0].verification, "ai_checked"); // a stale fingerprint approves nothing
  setApprovals([]);
});

test("review states: open, approved, outdated, change request", () => {
  const reviews = new Map([review("book", "b1", "approved", "aaaaaaaa"), review("animation", "a1", "change", "bbbbbbbb", "Schritt 2 falsch")].map((r) => [r.kind + ":" + r.id, r]));
  assert.deepEqual(stateOf("book", "b1", "aaaaaaaa", reviews), { state: "approved", note: null });
  assert.equal(stateOf("book", "b1", "cccccccc", reviews).state, "outdated");
  assert.deepEqual(stateOf("animation", "a1", "bbbbbbbb", reviews), { state: "change", note: "Schritt 2 falsch" });
  assert.equal(stateOf("visual", "v1", "dddddddd", reviews).state, "open");
});

test("the review queue covers every book, animation and visualisation, with the texts the app shows", () => {
  const entries = bundleEntries("de", new Map(), t);
  assert.equal(entries.filter((e) => e.kind === "book").length, bookRows.filter((b) => b.status === "published").length);
  assert.equal(entries.filter((e) => e.kind === "animation").length, animationRows.length);
  assert.equal(entries.filter((e) => e.kind === "visual").length, visualRows.length);
  assert.ok(entries.every((e) => e.state === "open" && e.hash && e.link && e.blocks.length >= 4 && e.sources.length > 0));
  const book = entries.find((e) => e.id === "b-kahneman")!;
  const all = book.blocks.map((b) => b.text).join("\n");
  for (const idea of bookRows.find((b) => b.id === "b-kahneman")!.ideas) {
    assert.ok(all.includes(idea.text) && all.includes(idea.recall.answer) && all.includes(idea.takeaway)); // nothing is left out
  }
  assert.ok(book.blocks.some((b) => b.tone === "good")); // the answer the idea suggests is marked
  const english = bundleEntries("en", new Map(), t).find((e) => e.id === "b-kahneman")!;
  assert.ok(english.blocks.map((b) => b.text).join(" ").includes(bookRows.find((b) => b.id === "b-kahneman")!.translations.en.ideas[0].takeaway));
  const animation = entries.find((e) => e.id === "a-zahnraeder")!;
  assert.ok(animation.blocks.some((b) => b.tone === "good" && b.text.includes("Eine halbe Umdrehung")));
});

test("questions and clips: reports go to their own tab, change requests keep their note", () => {
  const item = (patch: Partial<ReviewItem>): ReviewItem => ({ kind: "question", id: "q1", categoryId: "science", title: "Frage?", options: ["a", "b"], correctIndex: 1, body: "Weil.", sourceName: "Quelle", sourceUrl: "https://example.org", verification: "ai_checked", status: "published", reports: 0, note: null, ...patch });
  const reviews = new Map([["question:q3", review("question", "q3", "change", null, "Antwort b ist auch richtig")]]);
  const [open, reported, change] = databaseEntries([item({}), item({ id: "q2", reports: 3, status: "review" }), item({ id: "q3" })], "de", reviews);
  assert.equal(open.state, "open");
  assert.equal(reported.state, "reported");
  assert.ok(reported.withdrawn);
  assert.equal(change.state, "change");
  assert.equal(change.note, "Antwort b ist auch richtig");
  assert.deepEqual(open.blocks.map((b) => b.tone), ["muted", "good", undefined]);
  const en = databaseEntries([item({ en: { title: "Question?", options: ["x", "y"], body: "Because." } })], "en", new Map())[0];
  assert.equal(en.title, "Question?");
  assert.equal(en.blocks[1].text, "✓ y");
});
