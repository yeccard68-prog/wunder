import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { estimateRange, evaluate, normalizeText, tolerance, type AnswerKey } from "../lib/formats";

const questions = JSON.parse(fs.readFileSync("content/questions.json", "utf8")) as { id: string; kind: string; options: string[]; correct_index: number; answer?: AnswerKey; explanation: string; translations: Record<string, { options: string[] }> }[];
const special = questions.filter((q) => ["order", "estimate", "blank"].includes(q.kind));

test("formats: order, estimate and blank are judged by the same rules as on the server", () => {
  assert.equal(evaluate("order", { order: [2, 0, 1] }, { order: [2, 0, 1] }), true);
  assert.equal(evaluate("order", { order: [2, 0, 1] }, { order: [0, 1, 2] }), false);
  assert.equal(evaluate("estimate", { value: 71, abs: 5 }, { value: 76 }), true);
  assert.equal(evaluate("estimate", { value: 71, abs: 5 }, { value: 77 }), false);
  assert.equal(evaluate("estimate", { value: 1000, rel: 0.1 }, { value: 900 }), true);
  assert.equal(evaluate("estimate", { value: 3600, abs: 0 }, { value: 3600 }), true);
  assert.equal(evaluate("estimate", { value: 3600, abs: 0 }, { value: 3700 }), false);
  assert.equal(evaluate("blank", { accept: ["paris"], show: "Paris" }, { text: "  Paris. " }), true);
  assert.equal(evaluate("blank", { accept: ["paris"], show: "Paris" }, { text: "Lyon" }), false);
  assert.equal(evaluate("question", { accept: ["x"] }, { text: "x" }), false); // ordinary questions never go this way
  assert.equal(evaluate("blank", undefined, { text: "x" }), false);
  assert.equal(normalizeText("  Twenty   Four! "), "twenty four");
  assert.equal(tolerance({ value: 200, rel: 0.25 }), 50);
});

test("formats: every question of the new formats is well-formed in all languages", () => {
  assert.ok(special.length >= 24);
  for (const q of special) {
    assert.equal(q.correct_index, 0, q.id);
    assert.ok(q.answer, q.id + ": answer key");
    for (const options of [q.options, ...Object.values(q.translations).map((t) => t.options)]) {
      if (q.kind === "order") assert.deepEqual([...q.answer!.order!].sort(), options.map((_, i) => i), q.id);
      if (q.kind === "estimate") {
        const r = estimateRange(options);
        assert.ok(r.min < r.max && r.step > 0 && q.answer!.value! >= r.min && q.answer!.value! <= r.max, q.id + ": range");
        assert.ok(evaluate("estimate", q.answer, { value: Math.round(q.answer!.value! / r.step) * r.step }) || tolerance(q.answer!) > 0, q.id + ": reachable with the slider");
      }
      if (q.kind === "blank") assert.ok(options.length === 2 && q.answer!.accept!.length > 0 && q.answer!.show, q.id);
    }
  }
  assert.ok(questions.filter((q) => !special.includes(q)).every((q) => q.answer == null));
});
