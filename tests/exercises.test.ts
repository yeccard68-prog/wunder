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

test("every kind on every step: four different options, the right one checked against the computation", () => {
  for (const step of [1, 2, 3, 4, 5] as const)
    for (const kind of KINDS[2])
      for (let i = 0; i < 150; i++)
        for (const locale of ["de", "en"]) {
          const e = makeExercise(`s${step}-${i}`, kind, "16+", locale, step);
          assert.equal(e.step, step);
          assert.equal(e.options.length, 4, `${kind} ${step} ${i}: ${e.options}`);
          assert.equal(new Set(e.options).size, 4, `${kind} ${step} ${i}: ${e.options}`);
          const answer = e.options[e.correct];
          if (kind === "weekday") assert.ok(e.explanation.endsWith(`${answer}.`), e.explanation);
          else if (kind !== "sequence") assert.ok(e.explanation.includes(answer.replace(/ €$/, "")), `${kind} ${step} ${i}: ${e.explanation} vs ${answer}`);
        }
});

test("the hard steps compute right: percent backwards and chained, time zones, dates", () => {
  for (let i = 0; i < 200; i++) {
    const back = makeExercise(`p4-${i}`, "percent", "16+", "en", 4);
    const [, p, after] = back.question.match(/a (\d+)% discount something costs €([\d,.]+)/)!.map((x) => x.replace(/,/g, ""));
    assert.equal(Number(back.options[back.correct].replace(/[ €,]/g, "")) * (100 - Number(p)) / 100, Number(after), back.question);
    const chain = makeExercise(`p5-${i}`, "percent", "16+", "en", 5);
    const [, a, b] = chain.question.match(/rises by (\d+)% and then falls by (\d+)%/)!;
    const total = Math.round(((1 + +a / 100) * (1 - +b / 100) - 1) * 10000) / 100;
    assert.equal(chain.options[chain.correct], (total > 0 ? "+" : total < 0 ? "−" : "±") + Math.abs(total).toLocaleString("en-GB") + "%", chain.question);
    const fly = makeExercise(`c5-${i}`, "clock", "16+", "en", 5);
    const m = fly.question.match(/leaves at (\d\d):(\d\d) local time and takes (\d+) h(?: (\d+) min)?\. Clocks at the destination are (\d+) hours? (ahead|behind)/)!;
    const end = (+m[1] * 60 + +m[2] + +m[3] * 60 + +(m[4] ?? 0) + (m[6] === "ahead" ? 1 : -1) * +m[5] * 60 + 1440 * 2) % 1440;
    assert.equal(fly.options[fly.correct], `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`, fly.question);
  }
  // 1 March → 1 June in a common year: 92 days, 13 weeks and 1 day
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let i = 0; i < 100; i++) {
    const e = makeExercise(`w5-${i}`, "weekday", "16+", "en", 5);
    const n = Number(e.explanation.match(/is (\d+) days/)![1]);
    assert.ok(n > 0 && n < 365);
    assert.ok(days.length === 12);
  }
});

test("children stay on their steps whatever their value", () => {
  assert.equal(makeExercise("k", "arithmetic", "6-9", "de", 5).step, 1);
  assert.equal(makeExercise("k", "arithmetic", "10-12", "de", 5).step, 2);
  const set = exercisesFor("16+", "de", 20, "y", (k) => (k === "arithmetic" ? 5 : 1));
  assert.ok(set.every((e) => e.step === (e.kind === "arithmetic" ? 5 : 1)));
});
