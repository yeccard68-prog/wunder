// Brain teasers from lib/teasers.ts, read back from their German text and worked out again here – independently of the
// generator: two buckets, tipping a die, the matchstick game, compass walks, letters, odd one out, letter sums.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { makeExercise } from "../lib/exercises";
import { letterSum, SUMS } from "../lib/teasers";

const STEPS = [1, 2, 3, 4, 5] as const;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

test("two buckets: the fewest steps, found again by a search of its own – or really impossible", () => {
  let impossible = 0;
  for (const step of STEPS)
    for (let s = 0; s < 60; s++) {
      const e = makeExercise(`jugs-${step}-${s}`, "jugs", "16+", "de", step);
      const [, A, B] = e.question.match(/einen (\d+)-Liter-Eimer und einen (\d+)-Liter-Eimer/)!.map(Number);
      const t = Number(e.question.match(/genau (\d+) Liter/)![1]);
      // breadth-first over "a,b" states
      const seen = new Map<string, number>([["0,0", 0]]);
      const queue: [number, number][] = [[0, 0]];
      let best: number | null = null;
      while (queue.length && best === null) {
        const [a, b] = queue.shift()!, n = seen.get(`${a},${b}`)!;
        if (a === t || b === t) { best = n; break; }
        const toB = Math.min(a, B - b), toA = Math.min(b, A - a);
        for (const [x, y] of [[A, b], [a, B], [0, b], [a, 0], [a - toB, b + toB], [a + toA, b - toA]]) if (!seen.has(`${x},${y}`)) { seen.set(`${x},${y}`, n + 1); queue.push([x, y]); }
      }
      const marked = e.options[e.correct];
      if (best === null) { impossible++; assert.equal(marked, "Das geht gar nicht.", e.question); assert.ok(step >= 4); }
      else {
        assert.equal(marked, String(best), e.question);
        assert.equal((e.explanation.match(/→/g) ?? []).length, best - 1, e.explanation); // the way shown has exactly that many steps
      }
      assert.equal(new Set(e.options).size, 4);
      if (step >= 4) assert.equal(e.options[3], "Das geht gar nicht.");
    }
  assert.ok(impossible > 0, "now and then it cannot be done");
});

test("tipping a die: followed again with all six faces", () => {
  const faces = new Set<string>();
  for (const step of STEPS)
    for (let s = 0; s < 80; s++) {
      const e = makeExercise(`cube-${step}-${s}`, "cube", "16+", "de", step);
      const [, top, front, right] = e.question.match(/oben die (\d), vorne \(zu dir\) die (\d), rechts die (\d)/)!.map(Number);
      assert.equal(new Set([top, 7 - top, front, 7 - front, right, 7 - right]).size, 6, e.question);
      let d = { U: top, D: 7 - top, F: front, B: 7 - front, R: right, L: 7 - right };
      const moves = e.question.match(/Du kippst ihn (.+) über die Kante/)![1].match(/nach (rechts|links|vorne|hinten)/g)!;
      assert.equal(moves.length, step);
      for (const m of moves) {
        if (m === "nach rechts") d = { ...d, R: d.U, D: d.R, L: d.D, U: d.L };
        if (m === "nach links") d = { ...d, L: d.U, D: d.L, R: d.D, U: d.R };
        if (m === "nach vorne") d = { ...d, F: d.U, D: d.F, B: d.D, U: d.B };
        if (m === "nach hinten") d = { ...d, B: d.U, D: d.B, F: d.D, U: d.F };
      }
      const asked = e.question.match(/Welche Zahl ist danach (\w+)\?$/)![1];
      faces.add(asked);
      const value = { oben: d.U, unten: d.D, vorne: d.F, hinten: d.B, rechts: d.R, links: d.L }[asked];
      assert.equal(e.options[e.correct], String(value), e.question);
      assert.equal(new Set(e.options).size, 4);
    }
  assert.equal(faces.size, 6, "on the last step every face is asked about");
});

test("matchstick game: who wins is worked out again by playing every game", () => {
  let lost = 0, backwards = 0;
  for (const step of STEPS)
    for (let s = 0; s < 80; s++) {
      const e = makeExercise(`nim-${step}-${s}`, "nim", "16+", "de", step);
      const n = Number(e.question.match(/liegen (\d+) Streichhölzer/)![1]);
      const m = e.question.match(/abwechselnd (?:1 bis (\d+)|([\d, ]+) oder (\d+)) Hölzer/)!;
      const moves = m[1] ? range(Number(m[1])).map((k) => k + 1) : [...m[2].split(", ").map(Number), Number(m[3])];
      const lastWins = /nimmt, gewinnt\./.test(e.question);
      if (!lastWins) { backwards++; assert.match(e.question, /nimmt, verliert\./); }
      const memo = new Map<number, boolean>();
      const wins = (k: number): boolean => { // can the player to move win with k matches left?
        if (k === 0) return !lastWins;
        if (!memo.has(k)) memo.set(k, moves.some((x) => x <= k && !wins(k - x)));
        return memo.get(k)!;
      };
      const good = moves.filter((x) => x <= n && !wins(n - x));
      assert.ok(good.length <= 1, e.question);
      if (good.length) assert.equal(e.options[e.correct], String(good[0]), e.question);
      else { lost++; assert.equal(e.correct, 3); assert.match(e.options[3], /^Egal wie viele/); }
      assert.equal(e.options.length, 4);
      assert.equal(new Set(e.options).size, 4);
      for (const o of e.options.slice(0, 3)) assert.ok(moves.includes(Number(o)), `${o} is no allowed move: ${e.question}`);
    }
  assert.ok(lost > 20 && backwards > 50, `${lost} lost, ${backwards} with the last match losing`);
});

const WIND = ["Norden", "Nordosten", "Osten", "Südosten", "Süden", "Südwesten", "Westen", "Nordwesten"];
const VEC: Record<string, [number, number]> = { Norden: [0, 1], Osten: [1, 0], Süden: [0, -1], Westen: [-1, 0] };
test("compass: turns and walks followed again", () => {
  const kinds = new Set<string>();
  for (const step of STEPS)
    for (let s = 0; s < 80; s++) {
      const e = makeExercise(`dir-${step}-${s}`, "directions", "16+", "de", step);
      const marked = e.options[e.correct];
      let m;
      if ((m = e.question.match(/^Du schaust nach ([A-Za-zäöü]+)\. Du machst (.+)\.\nIn welche Richtung schaust du jetzt\?$/))) {
        kinds.add("turn");
        let dir = WIND.indexOf(m[1]); // eighths of a circle, clockwise
        const turns = m[2].split(", dann ");
        for (const t of turns) dir = (dir + (t === "eine halbe Drehung" ? 4 : t === "eine Vierteldrehung nach rechts" ? 2 : t === "eine Vierteldrehung nach links" ? 6 : NaN)) % 8;
        assert.equal(marked, WIND[dir], e.question);
        turns.forEach((t, i) => i && assert.ok(!(t === "eine halbe Drehung" && turns[i - 1] === t), e.question));
        assert.deepEqual(e.options, ["Norden", "Osten", "Süden", "Westen"]);
      } else if ((m = e.question.match(/^Du gehst (.+)\.\nWie weit bist du jetzt vom Startpunkt entfernt \(Luftlinie\)\?$/))) {
        kinds.add("walk");
        let [x, y] = [0, 0];
        for (const leg of m[1].split(", dann ")) { const [, len, to] = leg.match(/^(\d+) km nach ([A-Za-zäöü]+)$/)!; x += VEC[to][0] * +len; y += VEC[to][1] * +len; }
        assert.equal(marked, `${Math.sqrt(x * x + y * y)} km`, e.question);
        assert.ok(Number.isInteger(Math.sqrt(x * x + y * y)));
      } else {
        kinds.add("back");
        m = e.question.match(/^Du schaust nach ([A-Za-zäöü]+) und gehst (\d+) Schritte geradeaus(.*)\. Jede Drehung ist eine Vierteldrehung\.\nIn welcher Himmelsrichtung liegt der Startpunkt jetzt von dir aus\?$/);
        assert.ok(m, e.question);
        let [dx, dy] = VEC[m[1]], x = dx * +m[2], y = dy * +m[2];
        for (const leg of m[3].matchAll(/drehst dich nach (rechts|links) und gehst (\d+) Schritte/g)) {
          [dx, dy] = leg[1] === "rechts" ? [dy, -dx] : [-dy, dx]; // a quarter turn
          x += dx * +leg[2]; y += dy * +leg[2];
        }
        // the direction from (x, y) back to (0, 0), in eighths clockwise from north
        const angle = (Math.atan2(-x, -y) * 180) / Math.PI;
        assert.ok(Number.isInteger(angle / 45), `${x}, ${y}: ${e.question}`);
        assert.equal(marked, WIND[((angle / 45) % 8 + 8) % 8], e.question);
      }
      assert.equal(new Set(e.options).size, 4);
    }
  assert.deepEqual([...kinds].sort(), ["back", "turn", "walk"]);
});

const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** What comes next, by every simple rule that fits the letters shown (as positions) – a puzzle is fair when they all agree. */
function continuations(p: number[]): number[] {
  const out: number[] = [], k = p.length, gaps = p.slice(1).map((v, i) => v - p[i]);
  if (gaps.every((g) => g === gaps[0])) out.push(p[k - 1] + gaps[0]); // always the same jump
  const second = gaps.slice(1).map((g, i) => g - gaps[i]);
  if (second.length >= 2 && second.every((g) => g === second[0])) out.push(p[k - 1] + gaps[gaps.length - 1] + second[0]); // the jumps grow evenly
  if (gaps.length >= 3 && gaps.every((g, i) => i === 0 || g === 2 * gaps[i - 1])) out.push(p[k - 1] + 2 * gaps[gaps.length - 1]); // the jumps double
  const even = p.filter((_, i) => i % 2 === 0), odd = p.filter((_, i) => i % 2 === 1);
  const steady = (list: number[]) => list.length >= 2 && list.slice(1).every((v, i) => v - list[i] === list[1] - list[0]);
  if (k >= 5 && steady(even) && steady(odd)) { const mine = k % 2 === 0 ? even : odd; out.push(mine[mine.length - 1] + mine[1] - mine[0]); } // two sequences taking turns
  return [...new Set(out)];
}
test("letters: sequences continue in one way only; secret writing and word values are worked out again", () => {
  const kinds = new Set<string>();
  for (const step of STEPS)
    for (let s = 0; s < 120; s++) {
      const e = makeExercise(`let-${step}-${s}`, "letters", "16+", "de", step);
      const marked = e.options[e.correct];
      let m;
      if ((m = e.question.match(/^Welcher Buchstabe kommt als Nächstes\?\n(.+) · \?$/))) {
        kinds.add("sequence");
        const shown = m[1].split(" · ").map((ch) => ABC.indexOf(ch));
        assert.ok(shown.every((p) => p >= 0) && shown.length >= 4, e.question);
        const next = continuations(shown);
        assert.deepEqual(next.map((p) => ABC[p]), [marked], e.question);
      } else if ((m = e.question.match(/Welchen Wert haben die Buchstaben von (\w+) zusammen\?$/))) {
        kinds.add("value");
        assert.equal(marked, String([...m[1]].reduce((sum, ch) => sum + ABC.indexOf(ch) + 1, 0)), e.question);
      } else {
        kinds.add("secret");
        const turn = e.question.includes("wird das Alphabet umgedreht");
        const sh = e.question.match(/um (\d) Stellen? (weiter|zurück)/);
        assert.ok(turn || sh, e.question);
        const code = (w: string) => [...w].map((ch) => ABC[turn ? 25 - ABC.indexOf(ch) : (ABC.indexOf(ch) + (sh![2] === "weiter" ? 1 : -1) * +sh![1] + 26) % 26]).join("");
        if (!turn) assert.match(e.question, new RegExp(`aus ${sh![2] === "weiter" ? "A" : "Z"} wird ${code(sh![2] === "weiter" ? "A" : "Z")};`));
        if ((m = e.question.match(/Wie schreibt man (\w+)\?$/))) assert.equal(marked, code(m[1]), e.question);
        else { m = e.question.match(/Welches Wort wurde zu (\w+)\?$/)!; assert.equal(code(marked), m[1], e.question); assert.equal(e.options.filter((o) => code(o) === m![1]).length, 1); }
      }
      assert.equal(e.options.length, 4);
      assert.equal(new Set(e.options).size, 4);
    }
  assert.deepEqual([...kinds].sort(), ["secret", "sequence", "value"]);
});

const prime = (n: number) => { if (n < 2) return false; for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return true; };
const digits = (n: number) => String(n).split("").reduce((a, b) => a + +b, 0);
/** The property named in the German explanation, as a test of its own. */
function property(text: string): (n: number) => boolean {
  let m;
  if (text === "gerade Zahlen") return (n) => n % 2 === 0;
  if (text === "ungerade Zahlen") return (n) => n % 2 !== 0;
  if ((m = text.match(/^Vielfache von (\d+)$/))) { const k = +m[1]; return (n) => n % k === 0; }
  if (text === "Primzahlen") return prime;
  if (text === "Quadratzahlen") return (n) => range(40).some((k) => k * k === n);
  if (text.startsWith("Kubikzahlen")) return (n) => range(12).some((k) => k * k * k === n);
  if (text.startsWith("Zweierpotenzen")) return (n) => range(12).some((k) => 2 ** (k + 1) === n);
  if (text.startsWith("Dreieckszahlen")) return (n) => range(60).some((k) => (k * (k + 1)) / 2 === n);
  if (text.startsWith("Fibonacci-Zahlen")) return (n) => [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377].includes(n);
  if (text.startsWith("Zahlen, die vorwärts und rückwärts gleich sind")) return (n) => String(n) === String(n).split("").reverse().join("");
  if ((m = text.match(/^Zahlen mit der Quersumme (\d+)$/))) { const q = +m[1]; return (n) => digits(n) === q; }
  throw new Error(`unknown property: ${text}`);
}
test("odd one out: four numbers share the named property, the fifth does not – and no simple property picks another", () => {
  const families = new Set<string>();
  for (const step of STEPS)
    for (let s = 0; s < 120; s++) {
      const e = makeExercise(`odd-${step}-${s}`, "oddone", "16+", "de", step);
      const list = e.question.split("\n")[1].split(" · ").map(Number);
      assert.equal(list.length, 5);
      assert.equal(new Set(list).size, 5, e.question);
      assert.deepEqual(e.options, list.map(String));
      const [, name, odd] = e.explanation.match(/ sind (.+) – (\d+) nicht/)!;
      families.add(name.replace(/\d+/g, "n"));
      const is = property(name);
      assert.equal(String(list[e.correct]), odd);
      assert.ok(!is(list[e.correct]) && list.filter(is).length === 4, e.question + e.explanation);
      // simple properties everyone knows: none of them may single out one of the other four
      const simple = [(n: number) => n % 2 === 0, (n: number) => n % 2 !== 0, prime, property("Quadratzahlen"), ...range(10).map((k) => (n: number) => n % (k + 3) === 0)];
      for (const p of simple) { const out = list.filter((n) => !p(n)); if (out.length === 1) assert.equal(out[0], list[e.correct], e.question); }
      if (e.explanation.includes(" = ")) { const [, x, a, b] = e.explanation.match(/\((\d+) = (\d+) × (\d+)\)/)!.map(Number); assert.equal(a * b, x); }
    }
  assert.equal(families.size, 11, [...families].join(" | ")); // every kind of property comes up
});

/** Number of ways to put different digits for the letters (no number starting with 0), counted up to two. */
function solutions(puzzle: string) {
  const [a, op, b, , c] = puzzle.split(" ");
  const used = [...new Set((a + b + c).split(""))];
  assert.ok(used.length <= 5, puzzle);
  let found = 0, fit: Record<string, number> = {};
  const value = (w: string, map: Record<string, number>) => Number([...w].map((ch) => map[ch]).join(""));
  const go = (i: number, map: Record<string, number>) => {
    if (found > 1) return;
    if (i === used.length) {
      if ([a, b, c].some((w) => map[w[0]] === 0)) return;
      if ((op === "+" ? value(a, map) + value(b, map) : value(a, map) * value(b, map)) === value(c, map)) { found++; fit = { ...map }; }
      return;
    }
    for (let dgt = 0; dgt <= 9; dgt++) if (!Object.values(map).includes(dgt)) go(i + 1, { ...map, [used[i]]: dgt });
  };
  go(0, {});
  return { found, fit };
}
test("letter sums: every sum in the table has exactly one solution", () => {
  const all = [...new Set(STEPS.flatMap((s) => SUMS[s]))];
  assert.ok(all.length > 120, String(all.length));
  for (const task of all) {
    const sum = letterSum(task);
    const { found, fit } = solutions(sum.text);
    assert.equal(found, 1, `${task}: ${sum.text}`);
    for (const l of sum.letters) assert.equal(fit[l.letter], l.digit, task);
  }
  for (const step of STEPS) assert.ok(SUMS[step].length >= 9);
});
test("letter sums as exercises: the marked digit is the one the only solution gives", () => {
  for (const step of STEPS)
    for (let s = 0; s < 40; s++) {
      const e = makeExercise(`crypt-${step}-${s}`, "crypt", "16+", "de", step);
      const [, puzzle, , letter] = e.question.match(/\n(.+)\n(Für welche Ziffer steht) (\w)\?$/)!;
      const { found, fit } = solutions(puzzle);
      assert.equal(found, 1);
      assert.equal(e.options[e.correct], String(fit[letter]), e.question);
      assert.equal(new Set(e.options).size, 4);
    }
});
