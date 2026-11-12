// Logic puzzles from lib/brain.ts, read back from their German text and solved again here – independently of the
// generator: crack the code, who has what, if–then rules and cards, scales, family ties.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { makeExercise } from "../lib/exercises";
import { codeHint, plainDe, rank } from "../lib/brain";

const STEPS = [1, 2, 3, 4, 5] as const;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const perms = (k: number): number[][] => (k === 1 ? [[0]] : perms(k - 1).flatMap((p) => range(k).map((i) => [...p.slice(0, i), k - 1, ...p.slice(i)])));

// ---------------------------------------------------------------- crack the code
const WORD: Record<string, number> = { eine: 1, zwei: 2, drei: 3, vier: 4 };
/** [right place, wrong place] from the German hint. */
function readHint(t: string, n: number): [number, number] {
  if (t === "Keine Ziffer stimmt.") return [0, 0];
  const m = t.match(/^(Eine|Zwei|Drei|Alle drei|Alle vier) Ziffern? stimm(?:t|en)(.*)$/);
  assert.ok(m, t);
  const total = m[1].startsWith("Alle") ? n : WORD[m[1].toLowerCase()];
  if (/^ und steh(t|en) an der richtigen Stelle\.$/.test(m[2])) return [total, 0];
  if (/^, steh(t|en) aber( beide| alle)? an der falschen Stelle\.$/.test(m[2])) return [0, total];
  const k = m[2].match(/^, aber nur (eine|zwei|drei) steh(?:t|en) an der richtigen Stelle\.$/);
  assert.ok(k, t);
  return [WORD[k[1]], total - WORD[k[1]]];
}
test("crack the code: exactly one code fits every hint – the one marked right; every wrong option breaks a hint", () => {
  for (const step of STEPS)
    for (let s = 0; s < 40; s++) {
      const e = makeExercise(`code-${step}-${s}`, "code", "16+", "de", step);
      const n = Number(e.question.match(/Code aus (\d) verschiedenen Ziffern/)![1]);
      const digits = e.question.includes("von 1 bis 6") ? [1, 2, 3, 4, 5, 6] : range(10);
      const hints = [...e.question.matchAll(/^(\d+) – (.+)$/gm)].map((m) => ({ guess: [...m[1]].map(Number), want: readHint(m[2], n) }));
      assert.ok(hints.length >= 3 && hints.length <= 6, e.question);
      const fits = (code: number[]) => hints.every((h) => {
        const placed = h.guess.filter((g, i) => code[i] === g).length, there = h.guess.filter((g) => code.includes(g)).length;
        return placed === h.want[0] && there - placed === h.want[1];
      });
      const codes = (len: number): number[][] => (len === 0 ? [[]] : codes(len - 1).flatMap((c) => digits.filter((x) => !c.includes(x)).map((x) => [...c, x])));
      const solutions = codes(n).filter(fits).map((c) => c.join(""));
      assert.deepEqual(solutions, [e.options[e.correct]], e.question);
      assert.equal(new Set(e.options).size, 4);
      for (const o of e.options) assert.equal(o.length, n);
    }
});
test("the hints say what they mean, in both languages", () => {
  assert.equal(codeHint(1, 0, 3, true), "Eine Ziffer stimmt und steht an der richtigen Stelle.");
  assert.equal(codeHint(0, 1, 3, true), "Eine Ziffer stimmt, steht aber an der falschen Stelle.");
  assert.equal(codeHint(0, 2, 3, true), "Zwei Ziffern stimmen, stehen aber beide an der falschen Stelle.");
  assert.equal(codeHint(1, 1, 3, true), "Zwei Ziffern stimmen, aber nur eine steht an der richtigen Stelle.");
  assert.equal(codeHint(0, 3, 3, true), "Alle drei Ziffern stimmen, stehen aber alle an der falschen Stelle.");
  assert.equal(codeHint(2, 1, 4, false), "Three digits are right, but only two are in the right place.");
  assert.equal(codeHint(0, 0, 4, false), "No digit is right.");
  for (const n of [3, 4]) for (let p = 0; p <= n; p++) for (let m = 0; p + m <= n; m++) if (p < n) assert.deepEqual(readHint(codeHint(p, m, n, true), n), [p, m]);
});

// ---------------------------------------------------------------- who has what?
const NAMES = ["Anna", "Ben", "Clara", "David"];
const PET: Record<string, number> = { Hund: 0, Katze: 1, Vogel: 2, Hasen: 3, Hase: 3 }, GAME: Record<string, number> = { Schach: 0, Tennis: 1, Fußball: 2, Golf: 3 };
test("who has what: the clues leave one distribution – or the marked answer says that the question stays open", () => {
  let open = 0;
  for (const step of STEPS)
    for (let s = 0; s < 60; s++) {
      const e = makeExercise(`zebra-${step}-${s}`, "zebra", "16+", "de", step);
      const n = e.question.startsWith("Drei") ? 3 : 4, two = e.question.includes("spielen je");
      type W = { pet: number[]; game: number[] };
      const clues = [...e.question.matchAll(/^– (.+)$/gm)].map((m) => m[1]).map((t): ((w: W) => boolean) => {
        let m;
        if ((m = t.match(/^(\w+) hat (?:einen|eine) (\w+)\.$/))) { const [i, k] = [NAMES.indexOf(m[1]), PET[m[2]]]; return (w) => w.pet[i] === k; }
        if ((m = t.match(/^(\w+) hat (?:keinen|keine) (\w+)\.$/))) { const [i, k] = [NAMES.indexOf(m[1]), PET[m[2]]]; return (w) => w.pet[i] !== k; }
        if ((m = t.match(/^(\w+) spielt nicht (\S+)\.$/))) { const [i, g] = [NAMES.indexOf(m[1]), GAME[m[2]]]; return (w) => w.game[i] !== g; }
        if ((m = t.match(/^(\w+) spielt (\S+)\.$/))) { const [i, g] = [NAMES.indexOf(m[1]), GAME[m[2]]]; return (w) => w.game[i] === g; }
        if ((m = t.match(/^Wer (?:einen|eine) (\w+) hat, spielt (nicht )?(\S+)\.$/))) { const [k, g, not] = [PET[m[1]], GAME[m[3]], !!m[2]]; return (w) => (w.game[w.pet.indexOf(k)] === g) !== not; }
        throw new Error(`unknown clue: ${t}`);
      });
      assert.ok(clues.length >= 2 && clues.length <= 8, e.question);
      const worlds: W[] = perms(n).flatMap((pet) => (two ? perms(n) : [range(n)]).map((game) => ({ pet, game })));
      const fit = worlds.filter((w) => clues.every((c) => c(w)));
      const ask = e.question.match(/^Wer (?:hat (?:einen|eine) (\w+)|spielt (\S+))\?$/m)!;
      const who = (w: W) => (ask[1] ? w.pet.indexOf(PET[ask[1]]) : w.game.indexOf(GAME[ask[2]]));
      const answers = new Set(fit.map(who));
      assert.ok(fit.length >= 1, e.question);
      if (e.options[e.correct] === "Das lässt sich nicht sicher sagen.") { open++; assert.ok(answers.size > 1, e.question); }
      else { assert.equal(fit.length, 1, e.question); assert.equal(e.options[e.correct], NAMES[[...answers][0]], e.question); }
      assert.equal(e.options.length, 4);
      assert.equal(new Set(e.options).size, 4);
    }
  assert.ok(open > 0, "now and then the question cannot be answered");
});

// ---------------------------------------------------------------- if … then
type A3 = [string, string, string];
const ATOMS: A3[] = [["die rote Lampe", "leuchtet", ""], ["der Motor", "läuft", ""], ["die Klappe", "ist", "offen"], ["der Alarm", "ertönt", ""], ["das Fenster", "steht", "offen"], ["die Heizung", "läuft", ""], ["das Licht", "brennt", ""], ["die Katze", "schläft", ""], ["der Rasensprenger", "läuft", ""], ["das Tor", "ist", "geschlossen"], ["der Hund", "bellt", ""], ["die Laterne", "leuchtet", ""]];
const up = (s: string) => s[0].toUpperCase() + s.slice(1);
const tail = (a: A3) => (a[2] ? ` ${a[2]}` : "");
const plain = (a: A3, v: boolean) => `${a[0]} ${a[1]}${v ? "" : " nicht"}${tail(a)}`;
const sub = (a: A3, v: boolean) => `${a[0]}${v ? "" : " nicht"}${tail(a)} ${a[1]}`;
const inv = (a: A3, v: boolean) => `${a[1]} ${a[0]}${v ? "" : " nicht"}${tail(a)}`;
/** What a German rule sentence says, as a test on a situation (atom index → true/false). */
function readRule(t: string): (w: Record<number, boolean>) => boolean {
  for (const a of range(ATOMS.length)) for (const b of range(ATOMS.length)) {
    if (a === b) continue;
    const [A, B] = [ATOMS[a], ATOMS[b]];
    for (const va of [true, false]) for (const vb of [true, false]) if (t === `Wenn ${sub(A, va)}, ${inv(B, vb)}.`) return (w) => w[a] !== va || w[b] === vb;
    if (t === `${up(A[0])} ${A[1]} nur${tail(A)}, wenn ${sub(B, true)}.`) return (w) => !w[a] || w[b];
    if (t === `${up(A[0])} ${A[1]} genau dann${tail(A)}, wenn ${sub(B, true)}.`) return (w) => w[a] === w[b];
    if (t === `Mindestens eines stimmt immer: ${up(plain(A, true))}, oder ${plain(B, true)}.`) return (w) => w[a] || w[b];
    if (t === `Nie stimmt beides zugleich: ${up(plain(A, true))}, und ${plain(B, true)}.`) return (w) => !(w[a] && w[b]);
  }
  throw new Error(`unknown rule: ${t}`);
}
const readFact = (t: string) => { for (const a of range(ATOMS.length)) for (const v of [true, false]) if (t.toLowerCase() === plain(ATOMS[a], v).toLowerCase()) return { a, v }; throw new Error(`unknown statement: ${t}`); };

test("if–then: every situation is tried – the marked answer is what holds in all that fit", () => {
  const seen = new Set<number>();
  let cardTasks = 0;
  for (const step of STEPS)
    for (let s = 0; s < 80; s++) {
      const e = makeExercise(`if-${step}-${s}`, "conditional", "16+", "de", step);
      assert.equal(e.options.length, 4);
      assert.equal(new Set(e.options).size, 4);
      if (e.question.startsWith("Vier Karten")) {
        cardTasks++;
        const shown = e.question.match(/Du siehst: (.+)$/m)![1].split(" · ");
        const [, anteText, consText] = e.question.match(/Wenn auf einer Seite (.+) steht, steht auf der anderen (.+)\.$/m)!;
        const is: Record<string, (x: string) => boolean> = { "ein Vokal": (x) => /^[AEIOU]$/.test(x), "ein Konsonant": (x) => /^[B-DF-HJ-NP-TV-Z]$/.test(x), "eine gerade Zahl": (x) => /^\d$/.test(x) && +x % 2 === 0, "eine ungerade Zahl": (x) => /^\d$/.test(x) && +x % 2 === 1 };
        const [ante, cons] = [is[anteText], is[consText]];
        // a card breaks the claim if one side is the "if" and the other side is not the "then"
        const breaks = (x: string, y: string) => (ante(x) && !cons(y)) || (ante(y) && !cons(x));
        const backs = (x: string) => (/\d/.test(x) ? ["A", "E", "K", "T"] : ["2", "4", "5", "7"]);
        const must = shown.filter((x) => backs(x).some((y) => breaks(x, y)));
        assert.equal(must.length, 2, e.question);
        assert.equal(e.options[e.correct], must.join(" und "), e.question);
        continue;
      }
      const lines = e.question.split("\n");
      const rules = lines.slice(1, -2).map((l) => readRule(l.replace(/^\(\d\) /, "")));
      assert.equal(rules.length, step <= 3 ? 1 : rules.length);
      const facts = lines[lines.length - 2].replace(/^Du siehst: /, "").replace(/\.$/, "").split(", und ").map(readFact);
      const asked = readFact(e.options[0].replace(/\.$/, ""));
      assert.equal(asked.v, true);
      assert.deepEqual(readFact(e.options[1].replace(/\.$/, "")), { a: asked.a, v: false });
      // every situation of the twelve statements that matter: only those named in the rules, the facts and the question
      const used = [...new Set(range(ATOMS.length).filter((a) => e.question.includes(ATOMS[a][0]) || e.question.includes(up(ATOMS[a][0]))))];
      const worlds = range(2 ** used.length).map((x) => Object.fromEntries(used.map((a, i) => [a, !!(x & (1 << i))])) as Record<number, boolean>);
      const fit = worlds.filter((w) => rules.every((q) => q(w)) && facts.every((f) => w[f.a] === f.v));
      const expected = !fit.length ? 3 : fit.every((w) => w[asked.a]) ? 0 : fit.every((w) => !w[asked.a]) ? 1 : 2;
      assert.equal(e.correct, expected, `${e.question}\n${e.options}`);
      if (expected === 3) assert.equal(step, 5, "a contradiction only on the last step");
      seen.add(expected);
    }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3], "all four answers come up");
  assert.ok(cardTasks > 10, "the card task comes up too");
});
test("German word order of the statements", () => {
  const klappe = { de: ["die Klappe", "ist", "offen"] as A3, en: ["the hatch", "is open", "is not open"] as A3 };
  assert.equal(plainDe(klappe, false), "die Klappe ist nicht offen");
  const e = makeExercise("if-1-0", "conditional", "16+", "de", 1);
  assert.match(e.question, /^(An einer Maschine|In einem Haus|In einem Garten) gilt:\nWenn .+, .+\.\nDu siehst: [A-ZÄÖÜ].+\.\nWas folgt daraus sicher\?$/);
});

// ---------------------------------------------------------------- scales
const SYM = ["●", "▲", "■", "◆"];
const side = (t: string) => { const s = [0, 0, 0, 0]; for (const part of t.trim().split(" ")) { if (SYM.includes(part)) s[SYM.indexOf(part)]++; } for (const m of t.matchAll(/(\d+) × (\S)/g)) s[SYM.indexOf(m[2])] += Number(m[1]) - 1; return s; };
test("scales: the weights that fit every scale give the marked answer – or really leave it open", () => {
  let open = 0, compare = 0;
  for (const step of STEPS)
    for (let s = 0; s < 50; s++) {
      const e = makeExercise(`scales-${step}-${s}`, "scales", "16+", "de", step);
      const lines = e.question.split("\n");
      const eqs = lines.slice(1, -1).map((l) => l.split(" = ").map(side));
      assert.equal(eqs.length >= 1 && eqs.every((q) => q.length === 2), true, e.question);
      const kinds = SYM.filter((x) => e.question.includes(x)).length;
      const weigh = (sd: number[], w: number[]) => sd.reduce((sum, k, i) => sum + k * w[i], 0);
      // every way to give the symbols whole weights from 1 to 12
      const fits = range(12 ** kinds).map((x) => range(4).map((i) => (i < kinds ? (Math.floor(x / 12 ** i) % 12) + 1 : 0))).filter((w) => eqs.every(([a, b]) => weigh(a, w) === weigh(b, w)));
      assert.ok(fits.length > 0, e.question);
      const last = lines[lines.length - 1];
      let m;
      if ((m = last.match(/^Wie viele (\S) wiegen so viel wie (.+)\?$/))) {
        const unit = SYM.indexOf(m[1]), combo = side(m[2]);
        const values = new Set(fits.map((w) => weigh(combo, w) / w[unit]));
        assert.deepEqual([...values], [Number(e.options[e.correct])], e.question);
      } else {
        compare++;
        m = last.match(/^Was ist schwerer: (.+) oder (.+)\?$/)!;
        const [a, b] = [side(m[1]), side(m[2])];
        const signs = new Set(fits.map((w) => Math.sign(weigh(a, w) - weigh(b, w))));
        if (e.correct === 3) { open++; assert.ok(signs.size > 1, e.question); }
        else assert.deepEqual([...signs], [[1, -1, 0][e.correct]], e.question);
        assert.deepEqual(e.options.slice(0, 2), [m[1], m[2]]);
      }
      assert.equal(new Set(e.options).size, 4);
    }
  assert.ok(compare > 10 && open > 0, `${compare} comparisons, ${open} left open`);
});
test("rank of small matrices", () => {
  assert.equal(rank([[1, 2], [2, 4]]), 1);
  assert.equal(rank([[1, 2], [2, 5]]), 2);
  assert.equal(rank([[2, -3, 0], [0, 1, -3], [2, -2, -3]]), 2); // the third row is the sum of the first two
  assert.equal(rank([[1, 0, -2, 0], [0, 1, 0, -3], [1, 1, 1, 1]]), 3);
  assert.equal(rank([[0, 0, 0]]), 0);
});

// ---------------------------------------------------------------- family ties
const KIND: Record<string, string> = { Mutter: "P", Vater: "P", Schwester: "S", Bruder: "S", Tochter: "C", Sohn: "C", Sohnes: "C", Vaters: "P", Bruders: "S", Ehefrau: "E", Ehemann: "E", Ehemanns: "E" };
const FEMALE = new Set(["Mutter", "Schwester", "Tochter", "Ehefrau"]);
const WOMEN = ["Anna", "Clara", "Mia", "Lea", "Emma"];
// what the last person of a chain is to the first, written out by hand: [she, he]
const TERM: Record<string, [string, string]> = {
  PP: ["Großmutter", "Großvater"], PS: ["Tante", "Onkel"], SC: ["Nichte", "Neffe"], SE: ["Schwägerin", "Schwager"], CC: ["Enkelin", "Enkel"], CE: ["Schwiegertochter", "Schwiegersohn"],
  EP: ["Schwiegermutter", "Schwiegervater"], ES: ["Schwägerin", "Schwager"],
  PPP: ["Urgroßmutter", "Urgroßvater"], PPS: ["Großtante", "Großonkel"], PSC: ["Cousine", "Cousin"], SCC: ["Großnichte", "Großneffe"], CCC: ["Urenkelin", "Urenkel"],
};
const BACK: Record<string, [string, string]> = {
  PP: ["Enkelin", "Enkel"], PS: ["Nichte", "Neffe"], SC: ["Tante", "Onkel"], SE: ["Schwägerin", "Schwager"], CC: ["Großmutter", "Großvater"], CE: ["Schwiegermutter", "Schwiegervater"],
  EP: ["Schwiegertochter", "Schwiegersohn"], ES: ["Schwägerin", "Schwager"],
  PPP: ["Urenkelin", "Urenkel"], PPS: ["Großnichte", "Großneffe"], PSC: ["Cousine", "Cousin"], SCC: ["Großtante", "Großonkel"], CCC: ["Urgroßmutter", "Urgroßvater"],
};
test("family ties: the chain of relatives, read from the sentence, gives the marked word (table written by hand)", () => {
  const chains = new Set<string>();
  for (const step of STEPS)
    for (let s = 0; s < 120; s++) {
      const e = makeExercise(`family-${step}-${s}`, "family", "16+", "de", step);
      const [story, ask] = e.question.split("\n");
      const [, about, of] = ask.match(/^Was ist (\w+) für (\w+)\?$/)!;
      let words: string[], first: string, lastPerson: string;
      const nested = story.match(/^(\w+) ist (?:der|die) (\w+)(?: (?:der|des) (\w+))? von (\w+)s (\w+)\.$/);
      if (nested) {
        words = [nested[5], nested[3], nested[2]].filter(Boolean); // from the person the sentence starts from, outwards
        [first, lastPerson] = [nested[4], nested[1]];
      } else {
        // one sentence per step, in any order: follow them from the one person who is nobody's relative here
        const links = [...story.matchAll(/(\w+) ist (?:der|die) (\w+) von (\w+)\./g)].map((m) => ({ who: m[1], word: m[2], of: m[3] }));
        first = links.find((l) => !links.some((x) => x.who === l.of))!.of;
        words = [];
        let at = first;
        for (let k = 0; k < links.length; k++) { const l = links.find((x) => x.of === at)!; words.push(l.word); at = l.who; }
        lastPerson = at;
      }
      const key = words.map((w) => KIND[w]).join("");
      assert.ok(TERM[key], `${key}: ${story}`);
      chains.add(key);
      const reverse = about === first;
      assert.equal(reverse ? of : about, lastPerson, e.question);
      const expected = reverse ? BACK[key][WOMEN.includes(first) ? 0 : 1] : TERM[key][FEMALE.has(words[words.length - 1].replace(/s$|es$/, "")) || FEMALE.has(words[words.length - 1]) ? 0 : 1];
      assert.equal(e.options[e.correct], expected, e.question);
      assert.equal(new Set(e.options).size, 4);
      assert.ok(e.explanation.includes(expected), e.explanation);
      if (step === 1) assert.ok(["PP", "PS", "CC", "SC"].includes(key), key);
    }
  assert.equal(chains.size, Object.keys(TERM).length, `every chain comes up: ${[...chains].sort()}`);
});
