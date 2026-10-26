// Maths and logic exercises – generated on the device from a seed, so there is always a new one and none needs a
// source: mental arithmetic, percentages, fractions, units, number sequences, days of the week, clock times. The answer
// is computed with the exercise, so it is checked right away (no points from the server – practice only).
// The level follows the age band: children get small numbers and no percentages or fractions.
import type { AgeBand } from "./types";
import { rng } from "./gamification";
import MAP_COUNTRIES from "./map-countries.json";

export type ExerciseKind = "arithmetic" | "percent" | "fraction" | "units" | "sequence" | "weekday" | "clock" | "map";
export interface Exercise {
  id: string;
  kind: ExerciseKind;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  countries?: string[]; // map quiz: the country shown on the map (ISO code)
}

type Level = 0 | 1 | 2; // 0 = 6–9 years, 1 = 10–12, 2 = 13+
export const levelOf = (age: AgeBand | null): Level => (age === "6-9" ? 0 : age === "10-12" ? 1 : 2);
export const KINDS: Record<Level, ExerciseKind[]> = {
  0: ["arithmetic", "units", "sequence", "weekday", "clock", "map"],
  1: ["arithmetic", "percent", "fraction", "units", "sequence", "weekday", "clock", "map"],
  2: ["arithmetic", "percent", "fraction", "units", "sequence", "weekday", "clock", "map", "map"],
};

const fmt = (n: number, locale: string) => n.toLocaleString(locale === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: 3 });
/** Four different options: the answer and three near misses, at a position drawn from the seed. */
function choices(answer: number, near: number[], r: () => number, show: (n: number) => string) {
  const wrong = [...new Set(near.filter((n) => n !== answer && Number.isFinite(n) && n >= 0))].slice(0, 3);
  for (let d = 1; wrong.length < 3; d++) for (const n of [answer + d, answer - d]) if (n >= 0 && n !== answer && !wrong.includes(n) && wrong.length < 3) wrong.push(n);
  const at = Math.floor(r() * 4);
  const list = wrong.map(show);
  list.splice(at, 0, show(answer));
  return { options: list, correct: at };
}
const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];

type Make = (r: () => number, level: Level, de: boolean, locale: string) => Omit<Exercise, "id" | "kind">;

const arithmetic: Make = (r, level, de, locale) => {
  const op = pick(r, level === 0 ? ["+", "−"] : ["+", "−", "×", "÷"]);
  const max = [20, 100, 1000][level];
  let a = int(r, 2, max), b = int(r, 2, max), answer = 0;
  if (op === "+") answer = a + b;
  if (op === "−") { if (b > a) [a, b] = [b, a]; answer = a - b; }
  if (op === "×") { a = int(r, 2, level === 1 ? 12 : 25); b = int(r, 2, 12); answer = a * b; }
  if (op === "÷") { b = int(r, 2, 12); answer = int(r, 2, level === 1 ? 12 : 25); a = answer * b; }
  const c = choices(answer, [answer + 10, answer - 10, answer + 1, answer - 2, op === "×" ? answer + b : answer + 2], r, (n) => fmt(n, locale));
  return { question: de ? `Wie viel ist ${fmt(a, locale)} ${op} ${fmt(b, locale)}?` : `What is ${fmt(a, locale)} ${op} ${fmt(b, locale)}?`, ...c, explanation: `${fmt(a, locale)} ${op} ${fmt(b, locale)} = ${fmt(answer, locale)}` };
};

const percent: Make = (r, level, de, locale) => {
  const p = pick(r, level === 1 ? [10, 20, 25, 50, 75] : [5, 10, 15, 20, 25, 30, 40, 50, 75]);
  const base = int(r, 2, 40) * (p % 25 === 0 ? 4 : 10);
  const answer = (base * p) / 100;
  const c = choices(answer, [answer * 2, answer / 2, (base * (p + 10)) / 100, base - answer], r, (n) => fmt(n, locale));
  return {
    question: de ? `Wie viel sind ${p} % von ${fmt(base, locale)}?` : `What is ${p}% of ${fmt(base, locale)}?`, ...c,
    explanation: de ? `${p} % von ${fmt(base, locale)} = ${fmt(base, locale)} × ${fmt(p / 100, locale)} = ${fmt(answer, locale)}` : `${p}% of ${fmt(base, locale)} = ${fmt(base, locale)} × ${fmt(p / 100, locale)} = ${fmt(answer, locale)}`,
  };
};

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const fraction: Make = (r, level, de) => {
  // a/b + c/d with small denominators; the answer in lowest terms
  const dens = level === 1 ? [2, 4, 8] : [2, 3, 4, 5, 6, 8, 10, 12];
  const b = pick(r, dens), d = pick(r, dens);
  const a = int(r, 1, b - 1), c = int(r, 1, d - 1);
  const num = a * d + c * b, den = b * d, g = gcd(num, den);
  const show = (n: number, m: number) => { const k = gcd(n, m); return m / k === 1 ? String(n / k) : `${n / k}/${m / k}`; };
  const answer = show(num, den);
  const wrong = [show(a + c, b + d), show(num + den / g, den), show(Math.max(1, num - den / g), den), show(a * c, b * d)].filter((w) => w !== answer);
  const opts = [...new Set(wrong)].slice(0, 3);
  for (let k = 2; opts.length < 3; k++) { const w = show(num + k, den); if (w !== answer && !opts.includes(w)) opts.push(w); }
  const at = Math.floor(r() * 4);
  opts.splice(at, 0, answer);
  return { question: de ? `Wie viel ist ${a}/${b} + ${c}/${d}?` : `What is ${a}/${b} + ${c}/${d}?`, options: opts, correct: at, explanation: `${a}/${b} + ${c}/${d} = ${a * d}/${den} + ${c * b}/${den} = ${num}/${den}${answer !== `${num}/${den}` ? ` = ${answer}` : ""}` };
};

const UNITS = [
  { from: ["km", "km"], to: ["m", "m"], f: 1000 },
  { from: ["m", "m"], to: ["cm", "cm"], f: 100 },
  { from: ["kg", "kg"], to: ["g", "g"], f: 1000 },
  { from: ["l", "l"], to: ["ml", "ml"], f: 1000 },
  { from: ["Stunden", "hours"], to: ["Minuten", "minutes"], f: 60 },
  { from: ["Minuten", "minutes"], to: ["Sekunden", "seconds"], f: 60 },
];
const units: Make = (r, level, de, locale) => {
  const u = pick(r, level === 0 ? UNITS.filter((x) => x.f !== 1000 || x.from[0] === "km") : UNITS);
  const v = level === 0 ? int(r, 1, 9) : pick(r, [int(r, 2, 12), int(r, 1, 9) + 0.5, int(r, 1, 20) / 4]);
  const answer = Math.round(v * u.f * 1000) / 1000;
  const c = choices(answer, [answer * 10, answer / 10, v * (u.f === 60 ? 100 : 60), answer + u.f], r, (n) => fmt(n, locale));
  const [fu, tu] = [u.from[de ? 0 : 1], u.to[de ? 0 : 1]];
  return { question: de ? `Wie viele ${tu} sind ${fmt(v, locale)} ${fu}?` : `How many ${tu} are ${fmt(v, locale)} ${fu}?`, ...c, explanation: de ? `1 ${u.from[0].replace(/en$/, "e")} = ${u.f} ${tu}, also ${fmt(v, locale)} × ${u.f} = ${fmt(answer, locale)} ${tu}` : `${fmt(v, locale)} × ${u.f} = ${fmt(answer, locale)} ${tu}` };
};

const sequence: Make = (r, level, de, locale) => {
  const type = pick(r, level === 0 ? ["add"] : level === 1 ? ["add", "mul", "square"] : ["add", "mul", "square", "fib", "alt"]);
  let seq: number[] = [], rule = "", ruleEn = "";
  const s = int(r, 1, level === 0 ? 10 : 20);
  if (type === "add") { const d = int(r, 2, level === 0 ? 5 : 15); seq = Array.from({ length: 5 }, (_, i) => s + i * d); rule = `jedes Mal + ${d}`; ruleEn = `+ ${d} each time`; }
  if (type === "mul") { const m = pick(r, [2, 3]); const st = int(r, 1, 5); seq = Array.from({ length: 5 }, (_, i) => st * m ** i); rule = `jedes Mal × ${m}`; ruleEn = `× ${m} each time`; }
  if (type === "square") { const st = int(r, 1, 6); seq = Array.from({ length: 5 }, (_, i) => (st + i) ** 2); rule = "Quadratzahlen"; ruleEn = "square numbers"; }
  if (type === "fib") { const a = int(r, 1, 4), b = int(r, a, 6); seq = [a, b]; while (seq.length < 5) seq.push(seq[seq.length - 1] + seq[seq.length - 2]); rule = "jede Zahl ist die Summe der beiden davor"; ruleEn = "each number is the sum of the two before"; }
  if (type === "alt") { const d1 = int(r, 2, 9), d2 = int(r, 1, d1 - 1); seq = [s + 10]; for (let i = 1; i < 5; i++) seq.push(seq[i - 1] + (i % 2 ? d1 : -d2)); rule = `abwechselnd + ${d1} und − ${d2}`; ruleEn = `alternately + ${d1} and − ${d2}`; }
  const answer = seq.pop()!;
  const c = choices(answer, [answer + 1, answer - 1, answer + (seq[1] - seq[0]), answer * 2], r, (n) => fmt(n, locale));
  return { question: de ? `Welche Zahl kommt als Nächstes? ${seq.map((n) => fmt(n, locale)).join(", ")}, …` : `Which number comes next? ${seq.map((n) => fmt(n, locale)).join(", ")}, …`, ...c, explanation: de ? `Die Regel: ${rule}. Also ${fmt(answer, locale)}.` : `The rule: ${ruleEn}. So ${fmt(answer, locale)}.` };
};

const DAYS = [["Montag", "Monday"], ["Dienstag", "Tuesday"], ["Mittwoch", "Wednesday"], ["Donnerstag", "Thursday"], ["Freitag", "Friday"], ["Samstag", "Saturday"], ["Sonntag", "Sunday"]];
const weekday: Make = (r, level, de) => {
  const start = int(r, 0, 6), plus = level === 0 ? int(r, 2, 9) : int(r, 8, level === 1 ? 30 : 100);
  const end = (start + plus) % 7;
  const wrong = [(end + 1) % 7, (end + 6) % 7, (end + 2) % 7];
  const at = Math.floor(r() * 4);
  const list = wrong.map((d) => DAYS[d][de ? 0 : 1]);
  list.splice(at, 0, DAYS[end][de ? 0 : 1]);
  const weeks = Math.floor(plus / 7), rest = plus % 7;
  return {
    question: de ? `Heute ist ${DAYS[start][0]}. Welcher Wochentag ist in ${plus} Tagen?` : `Today is ${DAYS[start][1]}. What day of the week is it in ${plus} days?`, options: list, correct: at,
    explanation: de ? `${plus} Tage = ${weeks} ${weeks === 1 ? "Woche" : "Wochen"} und ${rest} ${rest === 1 ? "Tag" : "Tage"}. Nach vollen Wochen ist wieder ${DAYS[start][0]}, ${rest} Tage weiter ist ${DAYS[end][0]}.` : `${plus} days = ${weeks} week${weeks === 1 ? "" : "s"} and ${rest} day${rest === 1 ? "" : "s"}. After whole weeks it is ${DAYS[start][1]} again; ${rest} days on it is ${DAYS[end][1]}.`,
  };
};

const hm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const clock: Make = (r, level, de) => {
  const start = int(r, 6, 21) * 60 + pick(r, level === 0 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const plus = level === 0 ? pick(r, [15, 30, 45, 60]) : pick(r, [25, 35, 45, 50, 75, 90, 105, 135]);
  const end = start + plus;
  const wrong = [end + 10, end - 10, end + 60];
  const at = Math.floor(r() * 4);
  const list = wrong.map(hm);
  list.splice(at, 0, hm(end));
  return { question: de ? `Es ist ${hm(start)} Uhr. Wie spät ist es in ${plus} Minuten?` : `It is ${hm(start)}. What time is it in ${plus} minutes?`, options: list, correct: at, explanation: de ? `${hm(start)} + ${plus} Minuten = ${hm(end)} Uhr` : `${hm(start)} + ${plus} minutes = ${hm(end)}` };
};

// "Welches Land ist auf der Karte markiert?" – names from the browser (Intl.DisplayNames), wrong options from the same
// continent; shapes from the app's own world map (Natural Earth)
const COUNTRIES = MAP_COUNTRIES as Record<string, string>;
const map: Make = (r, _level, de, locale) => {
  const codes = Object.keys(COUNTRIES);
  const iso = pick(r, codes);
  const name = (c: string) => new Intl.DisplayNames([locale], { type: "region" }).of(c) ?? c;
  const near = codes.filter((c) => c !== iso && COUNTRIES[c] === COUNTRIES[iso]);
  const pool = near.length >= 3 ? near : codes.filter((c) => c !== iso);
  const wrong: string[] = [];
  while (wrong.length < 3) { const c = pick(r, pool); if (!wrong.includes(c)) wrong.push(c); }
  const at = Math.floor(r() * 4);
  const list = wrong.map(name);
  list.splice(at, 0, name(iso));
  return { question: de ? "Welches Land ist auf der Karte markiert?" : "Which country is marked on the map?", options: list, correct: at, explanation: de ? `Markiert ist ${name(iso)}.` : `The marked country is ${name(iso)}.`, countries: [iso] };
};

const MAKERS: Record<ExerciseKind, Make> = { arithmetic, percent, fraction, units, sequence, weekday, clock, map };

export function makeExercise(seed: string, kind: ExerciseKind, age: AgeBand | null, locale: string): Exercise {
  const r = rng(seed);
  return { id: `ex-${kind}-${seed}`, kind, ...MAKERS[kind](r, levelOf(age), locale === "de", locale) };
}
/** A set of exercises for one visit: the kinds take turns at random, all suited to the age band. */
export function exercisesFor(age: AgeBand | null, locale: string, count: number, seed: string): Exercise[] {
  const r = rng(`ex-${seed}`);
  const kinds = KINDS[levelOf(age)];
  return Array.from({ length: count }, (_, i) => makeExercise(`${seed}-${i}`, kinds[Math.floor(r() * kinds.length)], age, locale));
}
