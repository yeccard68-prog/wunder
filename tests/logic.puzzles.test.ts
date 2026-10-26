// Logic puzzles (lib/logic.ts) solved again from their German text, independently of the generator; futoshiki.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { makeExercise } from "../lib/exercises";
import { countFutoshiki, feedPuzzles, futoshikiConflicts, makeFutoshiki } from "../lib/puzzles";

const NAMES = ["Anna", "Ben", "Clara", "David", "Emil"];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

test("truth or lie: read back from the text, exactly one distribution fits – the one marked right", () => {
  for (const step of [1, 2, 3, 4, 5] as const)
    for (let s = 0; s < 120; s++) {
      const e = makeExercise(`kn-${step}-${s}`, "knights", "16+", "de", step);
      const said = [...e.question.matchAll(/^(\w+): „(.+)“$/gm)].map((m) => ({ who: NAMES.indexOf(m[1]), text: m[2] }));
      const n = said.length;
      const truth = (i: number, t: string, h: boolean[]): boolean => {
        const c = (x: boolean[]) => x.filter(Boolean).length;
        let m;
        if ((m = t.match(/^(\w+) lügt\.$/))) return !h[NAMES.indexOf(m[1])];
        if ((m = t.match(/^(\w+) sagt die Wahrheit\.$/))) return h[NAMES.indexOf(m[1])];
        if ((m = t.match(/^(\w+) und ich sind gleich/))) return h[NAMES.indexOf(m[1])] === h[i];
        if ((m = t.match(/^(\w+) und (\w+) sind gleich/))) return h[NAMES.indexOf(m[1])] === h[NAMES.indexOf(m[2])];
        if (t === "Mindestens eine Person hier lügt.") return c(h) < n;
        if (t === "Wir lügen alle.") return c(h) === 0;
        if (t === "Genau eine Person hier ist ehrlich.") return c(h) === 1;
        if (t === "Genau zwei Personen hier sind ehrlich.") return c(h) === 2;
        if ((m = t.match(/^Ich lüge, oder (\w+) ist ehrlich\.$/))) return !h[i] || h[NAMES.indexOf(m[1])];
        throw new Error(`unknown statement: ${t}`);
      };
      const fit = range(2 ** n).map((m) => range(n).map((i) => !!(m & (1 << i)))).filter((h) => said.every((x) => truth(x.who, x.text, h) === h[x.who]));
      assert.equal(fit.length, 1, e.question);
      assert.equal(e.options[e.correct], range(n).map((i) => `${NAMES[i]} ${fit[0][i] ? "ehrlich" : "lügt"}`).join(" · "), e.question);
      assert.equal(new Set(e.options).size, 4);
    }
});

test("what follows: checked again over every arrangement of the three groups", () => {
  for (const step of [1, 2, 3, 4, 5] as const)
    for (let s = 0; s < 120; s++) {
      const e = makeExercise(`sy-${step}-${s}`, "syllogism", "16+", "de", step);
      const groups = e.question.match(/^Es gibt (\S+), (\S+) und (\S+)\./)!.slice(1);
      const parse = (t: string) => {
        const m = t.match(/^(Alle|Keine|Einige) (\S+) sind (keine )?(\S+)\.$/)!;
        const [x, y] = [groups.indexOf(m[2]), groups.indexOf(m[4])];
        return (w: number[]) => {
          const xy = w.some((g) => g & (1 << x) && g & (1 << y)), xNot = w.some((g) => g & (1 << x) && !(g & (1 << y)));
          return m[1] === "Alle" ? !xNot : m[1] === "Keine" ? !xy : m[3] ? xNot : xy;
        };
      };
      const [p1, p2] = [...e.question.matchAll(/^\(\d\) (.+)$/gm)].map((m) => parse(m[1]));
      const worlds = range(256).map((m) => range(8).filter((g) => m & (1 << g))).filter((w) => [0, 1, 2].every((k) => w.some((g) => g & (1 << k)))).filter((w) => p1(w) && p2(w));
      const follows = e.options.slice(0, 3).map((o) => worlds.every(parse(o)));
      const expected = follows.indexOf(true) >= 0 ? follows.indexOf(true) : 3;
      assert.equal(follows.filter(Boolean).length <= 1, true, e.question);
      assert.equal(e.correct, expected, `${e.question}\n${e.options}`);
    }
});

test("order: the clues read back leave exactly one finishing order", () => {
  for (const step of [1, 2, 3, 4, 5] as const)
    for (let s = 0; s < 80; s++) {
      const e = makeExercise(`or-${step}-${s}`, "order", "16+", "de", step);
      const n = Number(e.question.match(/^(\d) Personen/)![1]);
      const clues = [...e.question.matchAll(/^– (.+)$/gm)].map((m) => m[1]);
      const at = (o: number[], name: string) => o.indexOf(NAMES.indexOf(name));
      const check = (o: number[], t: string) => {
        let m;
        if ((m = t.match(/^(\w+) ist vor (\w+) im Ziel\.$/))) return at(o, m[1]) < at(o, m[2]);
        if ((m = t.match(/^(\w+) kommt direkt vor (\w+) ins Ziel\.$/))) return at(o, m[1]) + 1 === at(o, m[2]);
        if ((m = t.match(/^(\w+) und (\w+) kommen direkt nacheinander/))) return Math.abs(at(o, m[1]) - at(o, m[2])) === 1;
        if ((m = t.match(/^Zwischen (\w+) und (\w+) kommt genau eine Person/))) return Math.abs(at(o, m[1]) - at(o, m[2])) === 2;
        if ((m = t.match(/^(\w+) landet nicht auf Platz (\d)\.$/))) return at(o, m[1]) !== +m[2] - 1;
        if ((m = t.match(/^(\w+) landet auf Platz (\d)\.$/))) return at(o, m[1]) === +m[2] - 1;
        throw new Error(`unknown clue: ${t}`);
      };
      const perms = (k: number): number[][] => (k === 1 ? [[0]] : perms(k - 1).flatMap((p) => range(k).map((i) => [...p.slice(0, i), k - 1, ...p.slice(i)])));
      const fit = perms(n).filter((o) => clues.every((c) => check(o, c)));
      assert.equal(fit.length, 1, e.question);
      const q = Number(e.question.match(/Platz (\d)\?$/)![1]);
      assert.equal(e.options[e.correct], NAMES[fit[0][q - 1]], e.question);
    }
});

test("futoshiki: exactly one solution on every step, the signs hold in it, mistakes show while typing", () => {
  for (const step of [1, 2, 3, 4, 5] as const)
    for (const level of ["few", "tricky"] as const)
      for (let s = 0; s < 4; s++) {
        const p = makeFutoshiki(`fu-${step}-${level}-${s}`, level, step);
        assert.equal(countFutoshiki(p, [...p.givens]), 1);
        assert.equal(futoshikiConflicts(p, p.solution).size, 0);
        const n = p.size;
        for (let i = 0; i < n * n; i++) {
          if (p.right[i]) assert.equal(p.right[i] === "<", p.solution[i] < p.solution[i + 1]);
          if (p.down[i]) assert.equal(p.down[i] === "<", p.solution[i] < p.solution[i + n]);
        }
        const wrong = [...p.solution];
        [wrong[0], wrong[1]] = [wrong[1], wrong[0]]; // two numbers swapped: a column now has a number twice
        assert.ok(futoshikiConflicts(p, wrong).size > 0);
      }
  const state = { answers: {}, settings: { locale: "de" }, ageBand: "16+" } as never;
  assert.ok(feedPuzzles([], state, 8, "2026-10-27").some((p) => p.kind === "futoshiki"));
});
