import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { animationRows, animationsFor } from "../lib/animations";

const questions = JSON.parse(fs.readFileSync("content/questions.json", "utf8")) as { id: string; show_in_feed: boolean; status: string }[];
const categories = JSON.parse(fs.readFileSync("content/categories.json", "utf8")) as { id: string }[];
const scenes = fs.readFileSync("components/anim/scenes.tsx", "utf8").match(/SCENES.*= \{([^}]*)\}/)![1].split(",").map((s) => s.split(":")[0].trim());

test("animations: every record is complete and points to things that exist", () => {
  assert.equal(new Set(animationRows.map((a) => a.id)).size, animationRows.length);
  for (const a of animationRows) {
    assert.ok(scenes.includes(a.scene), `${a.id}: unknown scene ${a.scene}`);
    assert.ok(categories.some((c) => c.id === a.category_id), `${a.id}: unknown category`);
    assert.ok(a.title && a.summary && a.goal && a.steps.length >= 2 && a.steps.every((s) => s.text.length > 20), `${a.id}: incomplete texts`);
    assert.ok(a.sources.length > 0 && a.sources.every((s) => /^https:\/\//.test(s.url)), `${a.id}: needs a source`);
    assert.ok([6, 10, 13, 16].includes(a.min_age) && [1, 2, 3].includes(a.difficulty));
    const quiz = questions.find((q) => q.id === a.quiz_question_id);
    assert.ok(quiz && quiz.show_in_feed && quiz.status === "published", `${a.id}: quiz question missing`);
    if (a.status === "published") assert.notEqual(a.verification_status, "unverified", `${a.id}: unchecked content must not be published`);
    for (const [locale, tr] of Object.entries(a.translations)) {
      assert.equal(tr.steps.length, a.steps.length, `${a.id}/${locale}: steps`);
      assert.equal(tr.labels.length, a.labels.length, `${a.id}/${locale}: labels`);
    }
  }
});

test("animations: language and age level are applied", () => {
  const de = animationsFor("de", null);
  const en = animationsFor("en", null);
  assert.equal(de.length, animationRows.filter((a) => a.status === "published").length);
  assert.notEqual(de[0].title, en[0].title);
  assert.equal(animationsFor("fr", null)[0].title, de[0].title); // unknown language → original
  assert.ok(animationsFor("de", "6-9").every((a) => a.minAge <= 6));
  assert.ok(de.every((a) => a.seconds >= 5 && a.seconds <= 40));
});
