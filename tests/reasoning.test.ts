// Tricky maths (lib/reasoning.ts): "Reichen die Angaben?" decided exactly, word problems and number puzzles recomputed.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { makeExercise } from "../lib/exercises";
import { sufficiencyAnswer } from "../lib/reasoning";

const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => [lo + i]);
const P = (test: (v: number[]) => boolean) => ({ id: String(Math.random()), de: "", en: "", test });

test("sufficiency: classic cases come out right", () => {
  const D = range(-10, 10);
  const positive = { id: "pos", de: "", en: "", yes: ([x]: number[]) => x > 0 };
  // x² = 9 leaves 3 and −3 (not enough); x³ < 0 says no (enough) → B
  assert.equal(sufficiencyAnswer(positive, P(([x]) => x * x === 9), P(([x]) => x ** 3 < 0), D), 1);
  // x² = 9 and x < 0: neither alone settles the value, together x = −3 → C
  const value = { id: "value", de: "", en: "", value: ([x]: number[]) => x };
  assert.equal(sufficiencyAnswer(value, P(([x]) => x * x === 9), P(([x]) => x < 0), D), 2);
  // x + 1 = 4 and 2x = 6: each alone → D
  assert.equal(sufficiencyAnswer(value, P(([x]) => x + 1 === 4), P(([x]) => 2 * x === 6), D), 3);
  // x even and x > 0: even together many values → E
  assert.equal(sufficiencyAnswer(value, P(([x]) => x % 2 === 0), P(([x]) => x > 0), D), 4);
  // x = 5 alone → A
  assert.equal(sufficiencyAnswer(value, P(([x]) => x === 5), P(([x]) => x > 0), D), 0);
});

test("sufficiency: five fixed answers, every letter turns up, the explanation ends with the right one", () => {
  const seen = [0, 0, 0, 0, 0];
  for (const step of [1, 2, 3, 4, 5] as const)
    for (let i = 0; i < 120; i++) {
      const e = makeExercise(`ds-${step}-${i}`, "sufficiency", "16+", "de", step);
      assert.equal(e.options.length, 5);
      assert.ok(e.explanation.endsWith(`${e.options[e.correct]}.`), e.explanation);
      assert.ok(!/(^|[\s(=,<>])-\d/.test(e.question + e.explanation), "real minus signs");
      seen[e.correct]++;
    }
  for (const n of seen) assert.ok(n >= 600 * 0.12, `every answer often enough: ${seen}`);
});

test("word problems and number puzzles: recomputed from the question", () => {
  const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.−-]/g, "").replace("−", "-"));
  const traps = new Set<string>();
  for (let i = 0; i < 300; i++) {
    for (const step of [1, 2, 3, 4, 5] as const) {
      const w = makeExercise(`w-${step}-${i}`, "word", "16+", "de", step);
      const ans = w.options[w.correct];
      let m;
      if ((m = w.question.match(/^(\d+) Personen geben sich/))) assert.equal(num(ans), (+m[1] * (+m[1] - 1)) / 2);
      if ((m = w.question.match(/Durchschnitt von (\d+) Zahlen ist (\d+)\. .* auf (\d+)\./))) assert.equal(num(ans), (+m[1] + 1) * +m[3] - +m[1] * +m[2]);
      if ((m = w.question.match(/hin mit (\d+) km\/h und .* zurück mit (\d+) km\/h/))) assert.equal(num(ans), (2 * +m[1] * +m[2]) / (+m[1] + +m[2]));
      if ((m = w.question.match(/Von (\d+) Personen sprechen (\d+) Englisch und (\d+) Französisch\. (\d+) (?:Person spricht|sprechen) keine/))) assert.equal(num(ans), +m[2] + +m[3] - (+m[1] - +m[4]));
      if ((m = w.question.match(/Aus (\d+) Personen soll ein Team aus (\d+)/))) { let c = 1; for (let k = 0; k < +m[2]; k++) c = (c * (+m[1] - k)) / (k + 1); assert.equal(num(ans), c); }
      // the traps, each worked out the long way
      if ((m = w.question.match(/Zaun ist (\d+) m lang\. Alle (\d+) m steht ein Pfosten/))) { let posts = 0; for (let x = 0; x <= +m[1]; x += +m[2]) posts++; assert.equal(num(ans), posts); traps.add("posts"); }
      if ((m = w.question.match(/in (\d+) gleich lange Stücke gesägt werden\. Jeder Schnitt dauert (\d+) Minuten/))) { assert.equal(num(ans), (+m[1] - 1) * +m[2]); traps.add("saw"); }
      if ((m = w.question.match(/Socken in (\d+) Farben .* um sicher (ein Paar|drei Socken|vier Socken) derselben Farbe/))) {
        const [colours, want] = [+m[1], { "ein Paar": 2, "drei Socken": 3, "vier Socken": 4 }[m[2]]!];
        // the unluckiest draw: as evenly spread over the colours as possible
        let n = 0; const drawn = Array<number>(colours).fill(0);
        while (Math.max(...drawn) < want) { drawn[n % colours]++; n++; }
        assert.equal(num(ans), n); traps.add("socks");
      }
      if ((m = w.question.match(/haben sie (\d+) Köpfe und (\d+) Beine/))) { let rabbits = -1; for (let k = 0; k <= +m[1]; k++) if (4 * k + 2 * (+m[1] - k) === +m[2]) rabbits = k; assert.equal(num(ans), rabbits); traps.add("legs"); }
      if ((m = w.question.match(/eines (\d+) m tiefen Brunnens\. Jeden Tag kriecht sie (\d+) m hoch, jede Nacht rutscht sie (\d+) m zurück/))) {
        let day = 0, at = 0;
        for (;;) { day++; at += +m[2]; if (at >= +m[1]) break; at -= +m[3]; }
        assert.equal(num(ans), day); assert.notEqual(day, Math.ceil(+m[1] / (+m[2] - +m[3])), "only where the quick answer is wrong"); traps.add("snail");
      }
      if ((m = w.question.match(/schlägt um (\d+) Uhr \d+-mal und braucht dafür (\d+) Sekunden .* um (\d+) Uhr/))) { assert.equal(num(ans), (+m[2] / (+m[1] - 1)) * (+m[3] - 1)); traps.add("strikes"); }
      if ((m = w.question.match(/liegen ([\d.]+) km auseinander\. .* der eine mit (\d+) km\/h, der andere mit (\d+) km\/h/))) { assert.equal(num(ans), num(m[1]) / (+m[2] + +m[3])); traps.add("trains"); }
      const n = makeExercise(`n-${step}-${i}`, "numbers", "16+", "de", step);
      const a = n.options[n.correct];
      if ((m = n.question.match(/Summe aller Zahlen von 1 bis (\d+)/))) assert.equal(num(a), (+m[1] * (+m[1] + 1)) / 2);
      if ((m = n.question.match(/Auf welche Ziffer endet (\d)\^(\d+)/))) assert.equal(+a, Number(BigInt(m[1]) ** BigInt(m[2]) % BigInt(10)));
      if ((m = n.question.match(/Welchen Rest lässt (\d)\^(\d+) beim Teilen durch (\d+)/))) assert.equal(+a, Number(BigInt(m[1]) ** BigInt(m[2]) % BigInt(m[3])));
      if ((m = n.question.match(/Auf wie viele Nullen endet (\d+)!/))) { let f = BigInt(1); for (let k = BigInt(2); k <= BigInt(m[1]); k++) f *= k; assert.equal(+a, String(f).length - String(f).replace(/0+$/, "").length); }
      if ((m = n.question.match(/von 1 bis (\d+) sind durch (\d+) oder durch (\d+) teilbar/))) { let c = 0; for (let k = 1; k <= +m[1]; k++) if (k % +m[2] === 0 || k % +m[3] === 0) c++; assert.equal(num(a), c); }
      if ((m = n.question.match(/Wie viele Teiler hat (\d+)/))) { let c = 0; for (let k = 1; k <= +m[1]; k++) if (+m[1] % k === 0) c++; assert.equal(+a, c); }
    }
  }
  assert.deepEqual([...traps].sort(), ["legs", "posts", "saw", "snail", "socks", "strikes", "trains"], "every trap comes up");
});

test("the tricky kinds are for adults only", async () => {
  const { KINDS, levelOf } = await import("../lib/exercises");
  for (const age of ["6-9", "10-12"] as const) assert.ok(!KINDS[levelOf(age)].some((k) => ["sufficiency", "word", "numbers"].includes(k)));
});
