// Tricky maths in the style of admission tests – all generated and worked out here, so every answer is checked:
//  - sufficiency: "Reichen die Angaben?" – a question about whole numbers in a stated range and two statements; which of
//    them are enough to answer it is decided by trying every possible value (so the solution is exact), and the
//    explanation names a counterexample where one statement is not enough;
//  - word: word problems (handshakes, averages, overlapping groups, pumps, mixtures, average speed, ages, dice, drawing
//    without putting back, teams, seating);
//  - numbers: number properties (common timetables, sums, remainders, divisors, last digits, zeros at the end of n!).
// Five steps each (lib/skill.ts); adults only (KINDS in exercises.ts).
import type { Step } from "./skill";
import { choices, dur, fmt, gcd, hm, int, pick, show, textChoices, type Make } from "./exercises";

const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const isPrime = (n: number) => n > 1 && range(2, Math.floor(Math.sqrt(n))).every((k) => n % k);
const mod = (a: number, m: number) => ((a % m) + m) % m;
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
/** Negative numbers with a real minus sign (−6, not -6). */
const minus = (text: string) => text.replace(/(^|[\s(=,<>])-(\d)/g, "$1−$2");

// ---------------------------------------------------------------- "Reichen die Angaben?"
type Val = number[]; // one value (x) or two (x, y)
interface Pred { id: string; de: string; en: string; test: (v: Val) => boolean }
interface Ask { id: string; de: string; en: string; value?: (v: Val) => number; yes?: (v: Val) => boolean }

export const SUFFICIENCY = [
  ["(1) allein reicht, (2) allein nicht", "(1) alone is enough, (2) alone is not"],
  ["(2) allein reicht, (1) allein nicht", "(2) alone is enough, (1) alone is not"],
  ["Nur beide zusammen reichen", "Only both together are enough"],
  ["Jede Angabe reicht schon allein", "Each statement alone is enough"],
  ["Auch beide zusammen reichen nicht", "Even both together are not enough"],
];

/** Statements and questions about one whole number x in [lo, hi]. */
function onX(r: () => number, lo: number, hi: number, d: Step): { preds: Pred[]; asks: Ask[] } {
  const a = int(r, lo + 2, hi - 2), b = int(r, lo + 2, hi - 2), k = pick(r, [3, 4, 5, 6]), m = int(r, 1, k - 1), s = pick(r, [9, 16, 25, 36]);
  const preds: Pred[] = [
    { id: "even", de: "x ist gerade.", en: "x is even.", test: ([x]) => x % 2 === 0 },
    { id: "odd", de: "x ist ungerade.", en: "x is odd.", test: ([x]) => mod(x, 2) === 1 },
    { id: "gt", de: `x > ${a}`, en: `x > ${a}`, test: ([x]) => x > a },
    { id: "lt", de: `x < ${b}`, en: `x < ${b}`, test: ([x]) => x < b },
    { id: "div", de: `x ist durch ${k} teilbar.`, en: `x is divisible by ${k}.`, test: ([x]) => x % k === 0 },
  ];
  if (d >= 3 && lo > 0) preds.push(
    { id: "rem", de: `x lässt beim Teilen durch ${k} den Rest ${m}.`, en: `x leaves remainder ${m} when divided by ${k}.`, test: ([x]) => x % k === m },
    { id: "prime", de: "x ist eine Primzahl.", en: "x is a prime number.", test: ([x]) => isPrime(x) },
    { id: "square", de: "x ist eine Quadratzahl.", en: "x is a square number.", test: ([x]) => Number.isInteger(Math.sqrt(x)) },
    { id: "lin", de: `3x − 5 > ${a}`, en: `3x − 5 > ${a}`, test: ([x]) => 3 * x - 5 > a },
  );
  if (lo < 0) preds.push(
    // the traps: a square says nothing about the sign
    { id: "sq", de: `x² = ${s}`, en: `x² = ${s}`, test: ([x]) => x * x === s },
    { id: "sqgt", de: `x² > ${s}`, en: `x² > ${s}`, test: ([x]) => x * x > s },
    { id: "pos", de: "x > 0", en: "x > 0", test: ([x]) => x > 0 },
    { id: "cube", de: `x³ < ${-s}`, en: `x³ < ${-s}`, test: ([x]) => x ** 3 < -s },
    { id: "absx", de: `|x| < ${Math.round(Math.sqrt(s))}`, en: `|x| < ${Math.round(Math.sqrt(s))}`, test: ([x]) => Math.abs(x) < Math.round(Math.sqrt(s)) },
  );
  const asks: Ask[] = [
    { id: "value", de: "Welchen Wert hat x?", en: "What is the value of x?", value: ([x]) => x },
    { id: "even", de: "Ist x gerade?", en: "Is x even?", yes: ([x]) => x % 2 === 0 },
    { id: "div", de: `Ist x durch ${k} teilbar?`, en: `Is x divisible by ${k}?`, yes: ([x]) => x % k === 0 },
    { id: "gt", de: `Ist x > ${a}?`, en: `Is x > ${a}?`, yes: ([x]) => x > a },
  ];
  if (lo < 0) asks.push({ id: "pos", de: "Ist x positiv?", en: "Is x positive?", yes: ([x]) => x > 0 });
  return { preds, asks };
}
/** Statements and questions about two whole numbers x, y in [lo, hi]. */
function onXY(r: () => number, lo: number, hi: number): { preds: Pred[]; asks: Ask[] } {
  const x0 = int(r, lo, hi), y0 = int(r, lo, hi); // a hidden pair, so the sums and products below can occur
  const s = x0 + y0, dd = x0 - y0, p = x0 * y0, v = int(r, lo, hi);
  const preds: Pred[] = [
    { id: "sum", de: `x + y = ${s}`, en: `x + y = ${s}`, test: ([x, y]) => x + y === s },
    { id: "diff", de: `x − y = ${dd}`, en: `x − y = ${dd}`, test: ([x, y]) => x - y === dd },
    { id: "prod", de: `x · y = ${p}`, en: `x · y = ${p}`, test: ([x, y]) => x * y === p },
    { id: "gt", de: "x > y", en: "x > y", test: ([x, y]) => x > y },
    { id: "double", de: "x = 2y", en: "x = 2y", test: ([x, y]) => x === 2 * y },
    { id: "xeven", de: "x ist gerade.", en: "x is even.", test: ([x]) => x % 2 === 0 },
    { id: "y", de: `y = ${v}`, en: `y = ${v}`, test: ([, y]) => y === v },
  ];
  const asks: Ask[] = [
    { id: "x", de: "Welchen Wert hat x?", en: "What is the value of x?", value: ([x]) => x },
    { id: "sum", de: "Welchen Wert hat x + y?", en: "What is the value of x + y?", value: ([x, y]) => x + y },
    { id: "prod", de: "Welchen Wert hat x · y?", en: "What is the value of x · y?", value: ([x, y]) => x * y },
    { id: "gt", de: "Ist x > y?", en: "Is x > y?", yes: ([x, y]) => x > y },
  ];
  return { preds, asks };
}
/** Whether the values left by some statements answer the question – and an example of why (not). */
function settles(ask: Ask, left: Val[]): boolean {
  if (!left.length) return false;
  return ask.value ? new Set(left.map(ask.value)).size === 1 : new Set(left.map(ask.yes!)).size === 1;
}
/** The letter A–E (as index 0–4) for the question and two statements over the domain. */
export function sufficiencyAnswer(ask: Ask, p1: Pred, p2: Pred, domain: Val[]): number {
  const one = settles(ask, domain.filter(p1.test)), two = settles(ask, domain.filter(p2.test));
  const both = settles(ask, domain.filter((v) => p1.test(v) && p2.test(v)));
  return one && two ? 3 : one ? 0 : two ? 1 : both ? 2 : 4;
}

const sufficiency: Make = (r, d, de) => {
  const two = d === 4 || (d === 5 && r() < 0.5);
  const [lo, hi] = two ? (d === 4 ? [1, 10] : [-5, 5]) : d <= 2 ? [1, 20] : d === 3 ? [1, 40] : [-10, 10];
  const target = int(r, 0, 4);
  const vars = two ? "x, y" : "x";
  let best: { ask: Ask; p1: Pred; p2: Pred; letter: number; domain: Val[] } | null = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const { preds, asks } = two ? onXY(r, lo, hi) : onX(r, lo, hi, d);
    const domain: Val[] = two ? range(lo, hi).flatMap((x) => range(lo, hi).map((y) => [x, y])) : range(lo, hi).map((x) => [x]);
    const ask = pick(r, asks);
    const p1 = pick(r, preds), p2 = pick(r, preds);
    // a statement that only repeats or negates the question is no puzzle ("Ist x gerade?" – "x ist ungerade")
    const same = (p: Pred) => p.id === ask.id || (ask.id === "even" && p.id === "odd");
    if (p1.id === p2.id || same(p1) || same(p2)) continue;
    const l1 = domain.filter(p1.test), l2 = domain.filter(p2.test), both = l1.filter(p2.test);
    if (!l1.length || !l2.length || !both.length || l1.length === domain.length || l2.length === domain.length) continue; // contradictory or empty statements
    const letter = sufficiencyAnswer(ask, p1, p2, domain);
    best = { ask, p1, p2, letter, domain };
    if (letter === target) break;
  }
  const { ask, p1, p2, letter, domain } = best!;
  const L = de ? 0 : 1;
  const name = (v: Val) => (v.length === 1 ? `x = ${v[0]}` : `(x, y) = (${v[0]}, ${v[1]})`);
  /** Why a set of statements is or is not enough, in a few words with examples. */
  const why = (label: string, left: Val[]) => {
    const ok = settles(ask, left);
    const verdict = ok ? (de ? "eindeutig" : "settled") : de ? "nicht eindeutig" : "not settled";
    if (ask.value) {
      const vals = [...new Set(left.map(ask.value))];
      if (ask.id === "value" || ask.id === "x") {
        const xs = ok ? `${de ? "nur" : "only"} x = ${vals[0]}` : vals.slice(0, 3).map((v) => `x = ${v}`).join(de ? " oder " : " or ") + (vals.length > 3 ? " …" : "");
        return `${label} ${xs} – ${verdict}.`;
      }
      // x + y or x · y: one value – or two pairs with different values
      const term = de ? ask.de.replace("Welchen Wert hat ", "").replace("?", "") : ask.en.replace("What is the value of ", "").replace("?", "");
      if (ok) return `${label} ${term} = ${vals[0]} – ${verdict}.`;
      const [a, b] = vals.slice(0, 2).map((w) => left.find((v) => ask.value!(v) === w)!);
      return `${label} ${name(a)} → ${term} = ${vals[0]}, ${name(b)} → ${term} = ${vals[1]} – ${verdict}.`;
    }
    const yes = left.find(ask.yes!), no = left.find((v) => !ask.yes!(v));
    if (ok) return de ? `${label} immer ${yes ? "ja" : "nein"} – eindeutig.` : `${label} always ${yes ? "yes" : "no"} – settled.`;
    return de ? `${label} ${name(yes!)} → ja, ${name(no!)} → nein – nicht eindeutig.` : `${label} ${name(yes!)} → yes, ${name(no!)} → no – not settled.`;
  };
  const l1 = domain.filter(p1.test), l2 = domain.filter(p2.test), both = l1.filter(p2.test);
  const lines = [why(de ? "(1) allein:" : "(1) alone:", l1), why(de ? "(2) allein:" : "(2) alone:", l2)];
  if (letter === 2 || letter === 4) lines.push(why(de ? "Beide zusammen:" : "Both together:", both));
  return {
    question: minus(de
      ? `${vars} ${two ? "sind ganze Zahlen" : "ist eine ganze Zahl"} von ${lo} bis ${hi}. ${ask.de}\n(1) ${p1.de}\n(2) ${p2.de}\nReichen die Angaben, um die Frage zu beantworten?`
      : `${vars} ${two ? "are whole numbers" : "is a whole number"} from ${lo} to ${hi}. ${ask.en}\n(1) ${p1.en}\n(2) ${p2.en}\nAre the statements enough to answer the question?`),
    options: SUFFICIENCY.map((o) => o[L]), // always in this order (A–E), as in the tests this format comes from
    correct: letter,
    explanation: minus(`${lines.join(" ")} ${de ? "Also:" : "So:"} ${SUFFICIENCY[letter][L]}.`),
  };
};

// ---------------------------------------------------------------- word problems
type Word = (r: () => number, de: boolean, locale: string) => ReturnType<Make>;
const C = (n: number, k: number): number => (k === 0 ? 1 : (C(n - 1, k - 1) * n) / k);
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));

const handshakes: Word = (r, de, locale) => {
  const n = int(r, 5, 30), answer = (n * (n - 1)) / 2;
  return {
    question: de ? `${n} Personen geben sich alle gegenseitig genau einmal die Hand. Wie viele Händedrücke sind das?` : `${n} people each shake hands with everyone else exactly once. How many handshakes is that?`,
    ...choices(answer, [n * (n - 1), n * n, ((n - 1) * (n - 2)) / 2, answer + n], r, (v) => fmt(v, locale)),
    explanation: de ? `Jede Person gibt ${n - 1} anderen die Hand: ${n} × ${n - 1}. Dabei zählt jeder Händedruck doppelt, also ${n} × ${n - 1} : 2 = ${fmt(answer, locale)}.` : `Each person shakes ${n - 1} hands: ${n} × ${n - 1}. That counts every handshake twice, so ${n} × ${n - 1} ÷ 2 = ${fmt(answer, locale)}.`,
  };
};
const average: Word = (r, de, locale) => {
  const n = int(r, 3, 9), a = int(r, 10, 40), b = a + int(r, 1, 6), answer = (n + 1) * b - n * a;
  return {
    question: de ? `Der Durchschnitt von ${n} Zahlen ist ${a}. Kommt eine weitere Zahl dazu, steigt der Durchschnitt auf ${b}. Welche Zahl kam dazu?` : `The average of ${n} numbers is ${a}. When one more number is added, the average rises to ${b}. Which number was added?`,
    ...choices(answer, [b, a + b, answer - n, answer + n, 2 * b - a], r, (v) => fmt(v, locale)),
    explanation: de ? `Vorher ist die Summe ${n} × ${a} = ${n * a}, nachher ${n + 1} × ${b} = ${(n + 1) * b}. Die neue Zahl: ${(n + 1) * b} − ${n * a} = ${fmt(answer, locale)}.` : `Before, the sum is ${n} × ${a} = ${n * a}; after, ${n + 1} × ${b} = ${(n + 1) * b}. The new number: ${(n + 1) * b} − ${n * a} = ${fmt(answer, locale)}.`,
  };
};
const groups: Word = (r, de, locale) => {
  const both = int(r, 4, 15), onlyA = int(r, 5, 30), onlyB = int(r, 5, 30), none = int(r, 0, 12);
  const A = onlyA + both, B = onlyB + both, N = onlyA + onlyB + both + none;
  return {
    question: de ? `Von ${N} Personen sprechen ${A} Englisch und ${B} Französisch. ${none === 1 ? "1 Person spricht" : `${none} sprechen`} keine der beiden Sprachen. Wie viele sprechen beide?` : `Of ${N} people, ${A} speak English and ${B} speak French. ${none} speak${none === 1 ? "s" : ""} neither language. How many speak both?`,
    ...choices(both, [A + B - N, N - none - A, Math.abs(A - B), both + none], r, (v) => fmt(v, locale)),
    explanation: de ? `Mindestens eine der Sprachen sprechen ${N} − ${none} = ${N - none}. Englisch und Französisch zusammengezählt sind ${A + B} – die Personen mit beiden Sprachen sind darin doppelt: ${A + B} − ${N - none} = ${fmt(both, locale)}.` : `At least one language: ${N} − ${none} = ${N - none}. English plus French gives ${A + B} – those who speak both are counted twice: ${A + B} − ${N - none} = ${fmt(both, locale)}.`,
  };
};
const pumps: Word = (r, de) => {
  const [h1, h2] = pick(r, [[2, 3], [3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [4, 6], [5, 20], [3, 4], [6, 9]]);
  const t = (60 * h1 * h2) / (h1 + h2);
  const c = textChoices(dur(t), [dur(60 * ((h1 + h2) / 2)), dur(60 * Math.abs(h2 - h1)), dur(t + 30), dur(60 * Math.min(h1, h2) / 2 + 15)], r);
  return {
    question: de ? `Pumpe A füllt ein Becken allein in ${h1} Stunden, Pumpe B allein in ${h2} Stunden. Wie lange brauchen beide zusammen?` : `Pump A fills a pool alone in ${h1} hours, pump B alone in ${h2} hours. How long do both take together?`, ...c,
    explanation: de ? `A schafft pro Stunde 1/${h1} des Beckens, B 1/${h2}. Zusammen ${show(h1 + h2, h1 * h2)} pro Stunde, also ${show(h1 * h2, h1 + h2)} Stunden = ${dur(t)}.` : `A fills 1/${h1} of the pool an hour, B 1/${h2}. Together ${show(h1 + h2, h1 * h2)} an hour, so ${show(h1 * h2, h1 + h2)} hours = ${dur(t)}.`,
  };
};
const mixture: Word = (r, de, locale) => {
  for (;;) {
    const x = int(r, 1, 9), y = int(r, 1, 9), a = 5 * int(r, 1, 6), b = 5 * int(r, 1, 6);
    const c = (x * a + y * b) / (x + y);
    if (a === b || x === y || !Number.isInteger(c)) continue;
    return {
      question: de ? `${x} Liter Salzwasser mit ${a} % Salz werden mit ${y} Liter Salzwasser mit ${b} % Salz gemischt. Wie viel Prozent Salz hat die Mischung?` : `${x} litres of salt water with ${a}% salt are mixed with ${y} litres with ${b}% salt. What percentage of salt does the mixture have?`,
      ...choices(c, [(a + b) / 2, c + 2, c - 2, a + b], r, (v) => `${fmt(v, locale)}${de ? " %" : "%"}`),
      explanation: de ? `Salz: ${x} × ${a} % + ${y} × ${b} % = ${fmt((x * a + y * b) / 100, locale)} Liter in ${x + y} Litern, also ${fmt(c, locale)} %. (Nicht einfach der Mittelwert – die größere Menge zählt mehr.)` : `Salt: ${x} × ${a}% + ${y} × ${b}% = ${fmt((x * a + y * b) / 100, locale)} litres in ${x + y} litres, so ${fmt(c, locale)}%. (Not simply the average – the larger amount counts more.)`,
    };
  }
};
const speed: Word = (r, de, locale) => {
  const [a, b] = pick(r, [[60, 40], [30, 60], [20, 30], [60, 90], [40, 120], [45, 90], [80, 120], [12, 6]]);
  const answer = (2 * a * b) / (a + b), dist = lcm(a, b);
  return {
    question: de ? `Ein Auto fährt eine Strecke hin mit ${a} km/h und auf demselben Weg zurück mit ${b} km/h. Wie hoch ist die Durchschnittsgeschwindigkeit für Hin- und Rückweg?` : `A car drives somewhere at ${a} km/h and back the same way at ${b} km/h. What is the average speed for the round trip?`,
    ...choices(answer, [(a + b) / 2, answer + 5, answer - 4, Math.max(a, b) - Math.min(a, b)], r, (v) => `${fmt(v, locale)} km/h`),
    explanation: de ? `Nicht ${fmt((a + b) / 2, locale)} km/h: Auf dem langsamen Weg ist das Auto länger unterwegs. Nimm eine Strecke von ${dist} km: hin ${dist / a} h, zurück ${dist / b} h – also ${2 * dist} km in ${dist / a + dist / b} h = ${fmt(answer, locale)} km/h.` : `Not ${fmt((a + b) / 2, locale)} km/h: the slow way takes longer. Take a distance of ${dist} km: there ${dist / a} h, back ${dist / b} h – so ${2 * dist} km in ${dist / a + dist / b} h = ${fmt(answer, locale)} km/h.`,
  };
};
const ages: Word = (r, de, locale) => {
  for (;;) {
    const m = int(r, 3, 6), n = int(r, 2, m - 1), t = int(r, 2, 20);
    const b = ((n - 1) * t) / (m - n);
    if (!Number.isInteger(b) || b < 2 || b > 30) continue;
    return {
      question: de ? `Eine Tante ist heute ${m}-mal so alt wie ihr Neffe. In ${t} Jahren ist sie nur noch ${n}-mal so alt wie er. Wie alt ist der Neffe heute?` : `An aunt is ${m} times as old as her nephew today. In ${t} years she will be only ${n} times as old as he is. How old is the nephew today?`,
      ...choices(b, [b + t, t, b + 2, Math.max(1, b - 2), m * b], r, (v) => fmt(v, locale)),
      explanation: de ? `Neffe heute: b, Tante: ${m}b. In ${t} Jahren: ${m}b + ${t} = ${n} × (b + ${t}). Also ${m - n}b = ${(n - 1) * t} und b = ${fmt(b, locale)}.` : `Nephew today: b, aunt: ${m}b. In ${t} years: ${m}b + ${t} = ${n} × (b + ${t}). So ${m - n}b = ${(n - 1) * t} and b = ${fmt(b, locale)}.`,
    };
  }
};
const dice: Word = (r, de) => {
  const s = int(r, 3, 11), count = 6 - Math.abs(7 - s);
  const c = textChoices(show(count, 36), [show(count + 1, 36), show(Math.max(1, count - 1), 36), show(1, s), show(count, 12), show(count + 2, 36)], r);
  return {
    question: de ? `Zwei Würfel werden geworfen. Wie wahrscheinlich ist die Augensumme ${s}?` : `Two dice are rolled. How likely is a total of ${s}?`, ...c,
    explanation: de ? `Von den 36 gleich wahrscheinlichen Paaren ergeben ${count} die Summe ${s}${count <= 3 ? ` (${range(1, 6).filter((a) => s - a >= 1 && s - a <= 6).map((a) => `${a}+${s - a}`).join(", ")})` : ""}, also ${show(count, 36)}.` : `Of the 36 equally likely pairs, ${count} give a total of ${s}${count <= 3 ? ` (${range(1, 6).filter((a) => s - a >= 1 && s - a <= 6).map((a) => `${a}+${s - a}`).join(", ")})` : ""}, so ${show(count, 36)}.`,
  };
};
const draws: Word = (r, de) => {
  const red = int(r, 2, 6), blue = int(r, 2, 7), n = red + blue;
  const answer = show(red * (red - 1), n * (n - 1));
  const c = textChoices(answer, [show(red * red, n * n), show(red - 1, n - 1), show(red * (red - 1), n * n), show(2 * red, n * (n - 1)), show(red, n)], r);
  return {
    question: de ? `In einem Beutel liegen ${red} rote und ${blue} blaue Kugeln. Du ziehst zwei Kugeln nacheinander, ohne zurückzulegen. Wie wahrscheinlich sind beide rot?` : `A bag holds ${red} red and ${blue} blue balls. You draw two, one after the other, without putting the first back. How likely are both red?`, ...c,
    explanation: de ? `Erste rot: ${red}/${n}. Dann liegen noch ${red - 1} rote unter ${n - 1}: ${red - 1}/${n - 1}. Zusammen ${red}/${n} × ${red - 1}/${n - 1} = ${answer}.` : `First red: ${red}/${n}. Then ${red - 1} red are left among ${n - 1}: ${red - 1}/${n - 1}. Together ${red}/${n} × ${red - 1}/${n - 1} = ${answer}.`,
  };
};
const teams: Word = (r, de, locale) => {
  const n = int(r, 6, 12), k = int(r, 2, 4), answer = C(n, k);
  return {
    question: de ? `Aus ${n} Personen soll ein Team aus ${k} gebildet werden. Wie viele verschiedene Teams sind möglich?` : `A team of ${k} is to be chosen from ${n} people. How many different teams are possible?`,
    ...choices(answer, [fact(n) / fact(n - k), n * k, C(n, k - 1), answer * 2], r, (v) => fmt(v, locale)),
    explanation: de ? `Die Reihenfolge im Team zählt nicht: ${range(n - k + 1, n).reverse().join(" × ")} geteilt durch ${range(1, k).reverse().join(" × ")} = ${fmt(answer, locale)}.` : `The order in the team does not count: ${range(n - k + 1, n).reverse().join(" × ")} divided by ${range(1, k).reverse().join(" × ")} = ${fmt(answer, locale)}.`,
  };
};
const seating: Word = (r, de, locale) => {
  const n = int(r, 4, 7), answer = 2 * fact(n - 1);
  return {
    question: de ? `${n} Personen setzen sich in eine Reihe. Zwei von ihnen wollen unbedingt nebeneinander sitzen. Wie viele Sitzordnungen gibt es?` : `${n} people sit in a row. Two of them insist on sitting next to each other. How many seating orders are there?`,
    ...choices(answer, [fact(n), fact(n - 1), 2 * fact(n), fact(n) - answer], r, (v) => fmt(v, locale)),
    explanation: de ? `Das Paar zählt als ein Platz: ${n - 1} „Plätze“ lassen sich auf ${fmt(fact(n - 1), locale)} Arten ordnen, und das Paar kann noch untereinander tauschen: 2 × ${fmt(fact(n - 1), locale)} = ${fmt(answer, locale)}.` : `Treat the pair as one seat: ${n - 1} "seats" can be ordered in ${fmt(fact(n - 1), locale)} ways, and the pair can swap: 2 × ${fmt(fact(n - 1), locale)} = ${fmt(answer, locale)}.`,
  };
};
const WORDS: Record<Step, Word[]> = {
  1: [handshakes, average],
  2: [handshakes, average, groups],
  3: [average, groups, pumps, mixture],
  4: [pumps, mixture, speed, ages, dice],
  5: [speed, ages, draws, teams, seating, dice],
};
const word: Make = (r, d, de, locale) => pick(r, WORDS[d])(r, de, locale);

// ---------------------------------------------------------------- number properties
const buses: Word = (r, de) => {
  const [a, b] = pick(r, [[6, 8], [8, 12], [10, 15], [12, 18], [9, 12], [15, 20], [12, 20], [8, 20], [6, 15], [18, 24]]);
  const start = 8 * 60, l = lcm(a, b);
  return {
    question: de ? `Bus A fährt alle ${a} Minuten, Bus B alle ${b} Minuten. Um 08:00 Uhr fahren beide gleichzeitig ab. Wann fahren sie das nächste Mal gleichzeitig?` : `Bus A leaves every ${a} minutes, bus B every ${b} minutes. At 08:00 both leave together. When do they next leave together?`,
    ...textChoices(hm(start + l), [hm(start + a * b), hm(start + a + b), hm(start + l / 2), hm(start + l + gcd(a, b))], r),
    explanation: de ? `Gesucht ist das kleinste gemeinsame Vielfache von ${a} und ${b}: ${l} Minuten. Also ${hm(start + l)} Uhr.` : `We need the least common multiple of ${a} and ${b}: ${l} minutes. So ${hm(start + l)}.`,
  };
};
const sums: Word = (r, de, locale) => {
  const n = pick(r, [20, 30, 40, 50, 60, 80, 100, 200]), answer = (n * (n + 1)) / 2;
  return {
    question: de ? `Wie groß ist die Summe aller Zahlen von 1 bis ${n}?` : `What is the sum of all numbers from 1 to ${n}?`,
    ...choices(answer, [(n * n) / 2, (n * (n - 1)) / 2, n * (n + 1), answer + n], r, (v) => fmt(v, locale)),
    explanation: de ? `Paare bilden: 1 + ${n}, 2 + ${n - 1}, … – ${n / 2} Paare mit je ${n + 1}, also ${n / 2} × ${n + 1} = ${fmt(answer, locale)}.` : `Make pairs: 1 + ${n}, 2 + ${n - 1}, … – ${n / 2} pairs of ${n + 1} each, so ${n / 2} × ${n + 1} = ${fmt(answer, locale)}.`,
  };
};
const remainder: Word = (r, de, locale) => {
  const k = pick(r, [5, 6, 7, 8, 9, 11]), m = int(r, 1, k - 1), a = int(r, 2, 5), c = int(r, 1, 9);
  const answer = mod(a * m + c, k);
  return {
    question: de ? `Die Zahl x lässt beim Teilen durch ${k} den Rest ${m}. Welchen Rest lässt ${a}x + ${c} beim Teilen durch ${k}?` : `The number x leaves remainder ${m} when divided by ${k}. What remainder does ${a}x + ${c} leave when divided by ${k}?`,
    ...choices(answer, [mod(m + c, k), mod(a * m, k), mod(answer + 1, k), mod(answer + k - 1, k)], r, (v) => fmt(v, locale)),
    explanation: de ? `Nur der Rest zählt: ${a} × ${m} + ${c} = ${a * m + c}, und ${a * m + c} lässt beim Teilen durch ${k} den Rest ${fmt(answer, locale)}.` : `Only the remainder matters: ${a} × ${m} + ${c} = ${a * m + c}, and ${a * m + c} leaves remainder ${fmt(answer, locale)} when divided by ${k}.`,
  };
};
const divisors: Word = (r, de, locale) => {
  const n = pick(r, [12, 18, 24, 30, 36, 40, 48, 60, 72, 84, 90, 96, 100, 120, 144]);
  const list = range(1, n).filter((k) => n % k === 0);
  return {
    question: de ? `Wie viele Teiler hat ${n} (1 und ${n} mitgezählt)?` : `How many divisors does ${n} have (counting 1 and ${n})?`,
    ...choices(list.length, [list.length - 1, list.length + 1, list.length - 2, list.length + 2], r, (v) => fmt(v, locale)),
    explanation: de ? `Die Teiler: ${list.join(", ")} – das sind ${fmt(list.length, locale)}.` : `The divisors: ${list.join(", ")} – that is ${fmt(list.length, locale)}.`,
  };
};
const lastDigit: Word = (r, de) => {
  const b = int(r, 2, 9), e = int(r, 21, 99);
  const cycle: number[] = [];
  for (let v = b % 10; !cycle.includes(v); v = (v * b) % 10) cycle.push(v);
  const answer = cycle[(e - 1) % cycle.length];
  const wrong = range(0, 9).filter((x) => x !== answer && cycle.includes(x)).concat(range(0, 9).filter((x) => x !== answer && !cycle.includes(x)));
  return {
    question: de ? `Auf welche Ziffer endet ${b}^${e}?` : `What is the last digit of ${b}^${e}?`,
    ...textChoices(String(answer), wrong.slice(0, 3).map(String), r),
    explanation: de ? `Die letzten Ziffern der Potenzen von ${b} wiederholen sich: ${cycle.join(", ")}${cycle.length > 1 ? ", …" : ""} (alle ${cycle.length}). ${b}^${e} ist die ${((e - 1) % cycle.length) + 1}. Stelle im Zyklus: ${answer}.` : `The last digits of the powers of ${b} repeat: ${cycle.join(", ")}${cycle.length > 1 ? ", …" : ""} (every ${cycle.length}). ${e} is position ${((e - 1) % cycle.length) + 1} in that cycle: ${answer}.`,
  };
};
const zeros: Word = (r, de, locale) => {
  const n = int(r, 20, 130), answer = Math.floor(n / 5) + Math.floor(n / 25) + Math.floor(n / 125);
  return {
    question: de ? `Auf wie viele Nullen endet ${n}! (= 1 × 2 × 3 × … × ${n})?` : `How many zeros does ${n}! (= 1 × 2 × 3 × … × ${n}) end in?`,
    ...choices(answer, [Math.floor(n / 5), Math.floor(n / 10), answer + 1, answer - 1], r, (v) => fmt(v, locale)),
    explanation: de ? `Jede Null braucht ein Paar 2 × 5; Fünfen sind seltener. Vielfache von 5 bis ${n}: ${Math.floor(n / 5)}, von 25 (eine Fünf mehr): ${Math.floor(n / 25)}${n >= 125 ? `, von 125: ${Math.floor(n / 125)}` : ""}. Zusammen ${fmt(answer, locale)}.` : `Each zero needs a pair 2 × 5; fives are rarer. Multiples of 5 up to ${n}: ${Math.floor(n / 5)}, of 25 (one more five): ${Math.floor(n / 25)}${n >= 125 ? `, of 125: ${Math.floor(n / 125)}` : ""}. Together ${fmt(answer, locale)}.`,
  };
};
const powerRemainder: Word = (r, de, locale) => {
  const a = int(r, 2, 9), m = pick(r, [5, 7, 9, 11, 13]), e = int(r, 20, 99);
  if (a % m === 0 || gcd(a, m) !== 1) return remainder(r, de, locale);
  const cycle: number[] = [];
  for (let v = a % m; !cycle.includes(v); v = (v * a) % m) cycle.push(v);
  const answer = cycle[(e - 1) % cycle.length];
  return {
    question: de ? `Welchen Rest lässt ${a}^${e} beim Teilen durch ${m}?` : `What remainder does ${a}^${e} leave when divided by ${m}?`,
    ...choices(answer, [cycle[e % cycle.length], cycle[(e + 1) % cycle.length], mod(answer + 1, m), mod(answer + m - 1, m)], r, (v) => fmt(v, locale)),
    explanation: de ? `Die Reste der Potenzen von ${a} beim Teilen durch ${m} wiederholen sich: ${cycle.join(", ")}, … (alle ${cycle.length}). ${a}^${e} ist die ${((e - 1) % cycle.length) + 1}. Stelle im Zyklus: Rest ${fmt(answer, locale)}.` : `The remainders of the powers of ${a} divided by ${m} repeat: ${cycle.join(", ")}, … (every ${cycle.length}). ${a}^${e} is position ${((e - 1) % cycle.length) + 1} in the cycle: remainder ${fmt(answer, locale)}.`,
  };
};
const either: Word = (r, de, locale) => {
  const N = pick(r, [100, 120, 200, 300, 500, 1000]), [a, b] = pick(r, [[2, 3], [3, 5], [4, 6], [6, 8], [4, 10], [5, 7], [3, 7]]);
  const l = lcm(a, b), answer = Math.floor(N / a) + Math.floor(N / b) - Math.floor(N / l);
  return {
    question: de ? `Wie viele Zahlen von 1 bis ${N} sind durch ${a} oder durch ${b} teilbar (oder durch beide)?` : `How many numbers from 1 to ${N} are divisible by ${a} or by ${b} (or both)?`,
    ...choices(answer, [Math.floor(N / a) + Math.floor(N / b), Math.floor(N / l), answer - 1, N - answer], r, (v) => fmt(v, locale)),
    explanation: de ? `Durch ${a}: ${Math.floor(N / a)}, durch ${b}: ${Math.floor(N / b)}. Die durch beide (also durch ${l}) sind doppelt gezählt: ${Math.floor(N / l)}. ${Math.floor(N / a)} + ${Math.floor(N / b)} − ${Math.floor(N / l)} = ${fmt(answer, locale)}.` : `By ${a}: ${Math.floor(N / a)}, by ${b}: ${Math.floor(N / b)}. Those divisible by both (that is, by ${l}) are counted twice: ${Math.floor(N / l)}. ${Math.floor(N / a)} + ${Math.floor(N / b)} − ${Math.floor(N / l)} = ${fmt(answer, locale)}.`,
  };
};
const NUMBERS: Record<Step, Word[]> = {
  1: [sums, buses],
  2: [sums, buses, divisors],
  3: [remainder, divisors, buses],
  4: [lastDigit, zeros, remainder, either],
  5: [powerRemainder, either, zeros, lastDigit],
};
const numbers: Make = (r, d, de, locale) => pick(r, NUMBERS[d])(r, de, locale);

export const REASONING = { sufficiency, word, numbers };
