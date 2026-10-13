// Learning design: lessons in books, repetition, predictions in animations.  Run: npm test
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { animationRows, animationsFor, TIMING } from "../lib/animations";
import { EVIDENCE_NAME, FORMAT_NAME, bookRows, booksFor, dueIdeas, insightQueue, mergeBookState, rateRecall, recallStats, RECALL_INTERVALS } from "../lib/books";
import { captionAt } from "../lib/content";
import type { UserState } from "../lib/types";

const state = (books: UserState["books"]) => ({ interests: [], books }) as unknown as UserState;

test("lessons: every idea has a hook, a recall task, a takeaway, a format and an evidence level – in every language", () => {
  const questions = new Set((JSON.parse(fs.readFileSync("content/questions.json", "utf8")) as { id: string }[]).map((q) => q.id));
  for (const b of bookRows) {
    assert.ok(b.goal.length > 30 && b.translations.en.goal.length > 30, `${b.id}: learning goal`);
    assert.ok(b.ideas.some((i) => i.transfer), `${b.id}: at least one transfer task`);
    for (const l of b.links) assert.ok(l.kind === "question" ? questions.has(l.id) : animationRows.some((a) => a.id === l.id), `${b.id}: link ${l.id}`);
    b.ideas.forEach((idea, n) => {
      const en = b.translations.en.ideas[n];
      assert.ok(idea.format in FORMAT_NAME && idea.evidence in EVIDENCE_NAME, `${idea.id}: format/evidence`);
      for (const i of [idea, en]) {
        assert.ok(i.hook.endsWith("?"), `${idea.id}: hook is a question`);
        assert.ok(i.recall.question.length > 15 && i.recall.answer.length > 5 && i.takeaway.length > 15, `${idea.id}: recall and takeaway`);
        assert.ok(!i.text.includes(i.takeaway), `${idea.id}: the takeaway is not a copy of the text`);
      }
      assert.equal(!!idea.transfer, !!en.transfer, `${idea.id}: transfer in both languages`);
      if (idea.transfer) assert.ok(idea.transfer.options.length >= 2 && idea.transfer.options[idea.transfer.best], `${idea.id}: transfer options`);
    });
  }
  // several formats are in use, and a thesis is not passed off as established knowledge
  assert.ok(new Set(bookRows.flatMap((b) => b.ideas.map((i) => i.format))).size >= 6);
  assert.deepEqual([...new Set(bookRows.flatMap((b) => b.ideas.map((i) => i.evidence)))].sort(), ["debated", "evidence", "thesis"]);
  assert.equal(booksFor("en", null).find((b) => b.id === "b-kahneman")!.ideas[1].takeaway, "The first number in the room decides what seems cheap or expensive afterwards.");
});

test("repetition: known → the gap grows; not known → again tomorrow, from the start", () => {
  let r = rateRecall(undefined, true, "2026-10-18");
  assert.deepEqual(r, { level: 1, due: "2026-10-20", tries: 1, known: 1 });
  r = rateRecall(r, true, "2026-10-20");
  assert.equal(r.due, "2026-10-27");
  r = rateRecall(r, false, "2026-10-27");
  assert.deepEqual(r, { level: 0, due: "2026-10-28", tries: 3, known: 2 });
  for (let i = 0; i < 10; i++) r = rateRecall(r, true, "2026-11-01");
  assert.equal(r.level, RECALL_INTERVALS.length); // never beyond the longest gap
  assert.equal(r.due, "2026-12-31");
});

test("repetition: due ideas are found, come first in the feed, and the statistics count learning, not viewing", () => {
  const books = booksFor("de", null);
  const [a, b, c] = [books[0].ideas[0].id, books[3].ideas[1].id, books[5].ideas[2].id];
  const s = state({ read: [a, b, c], saved: [], recall: { [a]: { level: 2, due: "2026-10-18", tries: 2, known: 2 }, [b]: { level: 0, due: "2026-10-17", tries: 1, known: 0 }, [c]: { level: 1, due: "2026-10-30", tries: 1, known: 1 } } });
  assert.deepEqual(dueIdeas(s, "2026-10-18"), [b, a]);
  assert.deepEqual(insightQueue(books, s, "2026-10-18").slice(0, 2).map((x) => x.idea.id).sort(), [a, b].sort());
  assert.ok(insightQueue(books, s, "2026-10-18").at(-1)!.idea.id === c); // learned and not due → last
  assert.deepEqual(recallStats(s, "2026-10-18"), { recalled: 3, retained: 1, shaky: 1, due: 2 });
  assert.deepEqual(recallStats(state({ read: ["x"], saved: [] })), { recalled: 0, retained: 0, shaky: 0, due: 0 }); // marked as read is not recalled
});

test("two devices: nothing learned or saved is lost when their book states are joined", () => {
  const phone = { read: ["a", "b"], saved: ["a"], recall: { a: { level: 1, due: "2026-10-20", tries: 1, known: 1 }, b: { level: 0, due: "2026-10-19", tries: 1, known: 0 } } };
  const tablet = { read: ["b", "c"], saved: ["c"], recall: { b: { level: 1, due: "2026-10-22", tries: 2, known: 1 }, c: { level: 1, due: "2026-10-21", tries: 1, known: 1 } } };
  const merged = mergeBookState(phone, tablet);
  assert.deepEqual(merged.read.sort(), ["a", "b", "c"]);
  assert.deepEqual(merged.saved.sort(), ["a", "c"]);
  assert.equal(merged.recall!.b.tries, 2); // the record with more attempts
  assert.deepEqual(mergeBookState(merged, null), merged);
  assert.deepEqual(mergeBookState(null, undefined), { read: [], saved: [], recall: {} });
});

test("animations: each has its own pacing and one prediction that the next step answers", () => {
  const en = animationsFor("en", null);
  for (const a of animationRows) {
    assert.ok(a.timing?.pace && a.timing.pace >= 0.65 && a.timing.pace <= 0.7, `${a.id}: pace`);
    assert.ok(a.timing?.motion && a.timing.motion >= 1 && a.timing.motion <= 1.6, `${a.id}: motion`);
    const p = a.predict!;
    assert.ok(p && p.step >= 1 && p.step < a.steps.length && p.options.length >= 3 && p.options[p.correct], `${a.id}: prediction`);
    assert.equal(a.translations.en.predict!.options.length, p.options.length, `${a.id}: prediction in English`);
    assert.notEqual(en.find((x) => x.id === a.id)!.predict!.question, p.question);
  }
  // the correct option is not always in the same place
  assert.ok(new Set(animationRows.map((a) => a.predict!.correct)).size === 3);
  // every animation is faster than first written, none faster than before by more than the old global factor allowed
  for (const a of animationsFor("de", null)) {
    const authored = animationRows.find((r) => r.id === a.id)!.steps.reduce((n, s) => n + (s.seconds ?? 6), 0);
    assert.ok(a.seconds < authored && a.seconds >= authored * 0.64, `${a.id}: ${a.seconds}s of ${authored}s`);
    assert.ok(a.steps.every((s) => s.seconds >= TIMING.minStep));
  }
});

test("captions are spread over the clip by their length", () => {
  const clip = { captions: ["kurz", "ein deutlich längerer Satz"], start: 2, duration: 10 };
  assert.equal(captionAt(clip, 2), "kurz");
  assert.equal(captionAt(clip, 4), "ein deutlich längerer Satz");
  assert.equal(captionAt(clip, 99), "ein deutlich längerer Satz");
  assert.equal(captionAt({ ...clip, captions: [] }, 3), undefined);
});

test("retention counts what was known again after a pause, not what was looked at", async () => {
  const { retention } = await import("../lib/gamification");
  const a = (patch: object) => ({ correct: true, at: "", categoryId: "science", difficulty: 1, box: null, due: null, reviews: 0, correctIndex: 0, explanation: "", ...patch });
  const s = {
    answers: { q1: a({ reviews: 2 }), q2: a({ correct: false, box: 0, due: "2026-10-18T10:00:00Z" }), q3: a({}), cq: a({}), cq2: a({ correct: false, box: 0, due: "2026-10-30T10:00:00Z" }) },
    clipStats: { c1: { plays: 2, completed: 1 }, c2: { plays: 1, completed: 1 }, c3: { plays: 1, completed: 0 }, c4: { plays: 1, completed: 1 } },
  } as never;
  assert.deepEqual(retention(s, { c1: "cq", c2: "cq2", c3: "cq", c4: undefined }, Date.parse("2026-10-19T00:00:00Z")), { recalled: 1, gaps: 2, due: 1, clipsWatched: 3, clipsUnderstood: 1 });
});
