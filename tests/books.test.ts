import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { shopUrl, showsAffiliate } from "../lib/affiliate";
import { BOOK_CATEGORIES, bookRows, booksFor, insightQueue } from "../lib/books";
import { forAudience } from "../lib/content";
import { demoContent } from "../lib/demo-content";
import { mixFeed } from "../lib/feed";
import type { UserState } from "../lib/types";

const questions = JSON.parse(fs.readFileSync("content/questions.json", "utf8")) as { id: string; show_in_feed: boolean; status: string }[];
const categories = JSON.parse(fs.readFileSync("content/categories.json", "utf8")) as { id: string }[];
const state = (patch: Partial<UserState> = {}) => ({ hidden: [], clipStats: {}, answers: {}, interests: [], books: { read: [], saved: [] }, ...patch }) as unknown as UserState;

test("books: every record is complete, sourced and points to things that exist", () => {
  assert.equal(new Set(bookRows.map((b) => b.id)).size, bookRows.length);
  const ideaIds = bookRows.flatMap((b) => b.ideas.map((i) => i.id));
  assert.equal(new Set(ideaIds).size, ideaIds.length);
  for (const b of bookRows) {
    assert.ok(b.title && b.author && b.year && b.thesis && b.limits && b.reflect.endsWith("?"), `${b.id}: incomplete`);
    assert.ok(b.ideas.length >= 3 && b.ideas.length <= 10, `${b.id}: 3–10 ideas`);
    assert.ok(b.ideas.every((i) => i.title && i.text.length > 80 && i.example.length > 20), `${b.id}: every idea needs text and an example`);
    assert.ok(BOOK_CATEGORIES.some((c) => c.id === b.category) && categories.some((c) => c.id === b.topic_id), `${b.id}: unknown category`);
    assert.ok(b.sources.length > 0 && b.sources.every((s) => /^https:\/\//.test(s.url)), `${b.id}: needs a source`);
    assert.ok(b.related.every((r) => bookRows.some((x) => x.id === r)), `${b.id}: related book missing`);
    const quiz = questions.find((q) => q.id === b.quiz_question_id);
    assert.ok(quiz && quiz.show_in_feed && quiz.status === "published", `${b.id}: knowledge check missing`);
    if (b.status === "published") assert.notEqual(b.verification_status, "unverified", `${b.id}: unchecked content must not be published`);
    for (const [locale, tr] of Object.entries(b.translations)) {
      assert.equal(tr.ideas.length, b.ideas.length, `${b.id}/${locale}: ideas`);
      tr.ideas.forEach((i, n) => assert.equal(i.visual?.type ?? null, b.ideas[n].visual?.type ?? null, `${b.id}/${locale}: visual ${n + 1}`));
    }
  }
});

test("books: language, original title and age level", () => {
  const de = booksFor("de", null);
  const en = booksFor("en", null);
  const k = de.find((b) => b.id === "b-kahneman")!;
  assert.equal(k.title, "Schnelles Denken, langsames Denken");
  assert.equal(k.original, "Thinking, Fast and Slow");
  assert.equal(en.find((b) => b.id === "b-kahneman")!.title, "Thinking, Fast and Slow");
  assert.notEqual(en[0].thesis, de[0].thesis);
  assert.equal(de.find((b) => b.id === "b-aurel")!.year, "um 175 n. Chr.");
  assert.equal(booksFor("de", "10-12").length, 0); // nothing below the age the books were written for
  assert.ok(booksFor("de", "13-15").every((b) => b.minAge <= 13));
});

test("books in the feed: unread ideas first, spread over many books, in the rhythm clip – animation – idea", () => {
  const books = booksFor("de", "16+");
  const queue = insightQueue(books, state());
  assert.equal(queue.length, books.reduce((n, b) => n + b.ideas.length, 0));
  assert.equal(new Set(queue.slice(0, books.length).map((x) => x.book.id)).size, books.length); // first one idea of every book
  const readFirst = insightQueue(books, state({ books: { read: [queue[0].idea.id], saved: [] } }));
  assert.equal(readFirst[readFirst.length - 1].idea.id, queue[0].idea.id);

  const { items, clips } = forAudience(demoContent(), "de", "16+");
  const feed = mixFeed(items.map((item) => ({ item, reason: "Neu" })), clips, [], state(), queue);
  const media = feed.filter((e) => e.kind !== "item").slice(0, 4).map((e) => e.kind);
  assert.deepEqual(media, ["clip", "clip", "insight", "clip"]); // no animations passed in → their slot goes to a clip
  assert.equal(feed.filter((e) => e.kind === "insight").length, queue.length);
});

test("books: no quotes from the books, and shop links only with a partner tag", () => {
  // the lessons promise "no excerpts or quotes": "Harari calls it „…four or more words…“" would break that
  const escape = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const texts = (o: unknown): string[] => (typeof o === "string" ? [o] : o && typeof o === "object" ? Object.values(o).flatMap(texts) : []);
  for (const b of bookRows) {
    const surname = escape(b.author.replace(/\s*\(.*\)/, "").split(" ").pop()!);
    const quote = new RegExp(`${surname}(s|'s)?\\b[^.„“”"]{0,60}?(Satz|Lieblingsfrage|nennt|bezeichnet|sentence|calls|question)[^.]{0,60}[„“"]([^„“”"]*\\s){3}[^„“”"]*[“”"]`);
    for (const text of texts(b)) assert.doesNotMatch(text, quote, b.id);
  }
  assert.equal(shopUrl({ title: "Schnelles Denken, langsames Denken", author: "Daniel Kahneman" }, ""), null);
  assert.equal(shopUrl({ title: "x", author: "y" }, "bad tag!"), null);
  assert.equal(shopUrl({ title: "x", author: "y" }, "wunder-21", "evil.example"), null);
  assert.equal(
    shopUrl({ title: "Schnelles Denken, langsames Denken", author: "Daniel Kahneman" }, "wunder-21"),
    "https://www.amazon.de/s?k=Schnelles%20Denken%2C%20langsames%20Denken%20Daniel%20Kahneman&i=stripbooks&tag=wunder-21"
  );
  assert.equal(showsAffiliate("16+"), false, "the test build has no partner tag");
});
