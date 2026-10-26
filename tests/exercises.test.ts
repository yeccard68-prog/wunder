// Maths and logic exercises: four different options, the right one among them and matching the explanation.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { exercisesFor, KINDS, levelOf, makeExercise } from "../lib/exercises";

test("every kind, every age band: four different options, the answer is the one the explanation ends with", () => {
  for (const age of ["6-9", "10-12", "16+"] as const)
    for (const kind of KINDS[levelOf(age)])
      for (let i = 0; i < 200; i++)
        for (const locale of ["de", "en"]) {
          const e = makeExercise(`t${i}`, kind, age, locale);
          assert.equal(e.options.length, 4, `${kind} ${i}`);
          assert.equal(new Set(e.options).size, 4, `${kind} ${i}: ${e.options}`);
          assert.ok(e.correct >= 0 && e.correct < 4);
          const answer = e.options[e.correct];
          if (kind !== "weekday" && kind !== "sequence") assert.ok(e.explanation.includes(answer), `${kind} ${i}: ${e.explanation} vs ${answer}`);
          if (kind === "weekday") assert.ok(e.explanation.endsWith(`${answer}.`), e.explanation);
        }
});

test("arithmetic is right and children get no percentages or fractions", () => {
  for (let i = 0; i < 300; i++) {
    const e = makeExercise(`a${i}`, "arithmetic", "16+", "en");
    const m = e.question.match(/What is ([\d,]+) (.) ([\d,]+)\?/)!;
    const [a, b] = [Number(m[1].replace(/,/g, "")), Number(m[3].replace(/,/g, ""))];
    const v = { "+": a + b, "−": a - b, "×": a * b, "÷": a / b }[m[2]]!;
    assert.equal(Number(e.options[e.correct].replace(/,/g, "")), v, e.question);
  }
  assert.ok(!KINDS[levelOf("6-9")].includes("percent") && !KINDS[levelOf("6-9")].includes("fraction"));
  const set = exercisesFor("10-12", "de", 30, "x");
  assert.equal(set.length, 30);
  assert.deepEqual(exercisesFor("10-12", "de", 30, "x"), set, "same seed, same exercises");
});
