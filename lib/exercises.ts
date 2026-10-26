// Maths and logic exercises – generated on the device from a seed, so there is always a new one and none needs a
// source: mental arithmetic, percentages, fractions, units, number sequences, days of the week, clock times. The answer
// is computed with the exercise, so it is checked right away (no points from the server – practice only).
// Five steps per kind, following the learner (lib/skill.ts): step 3 is what every adult got before; 4 and 5 are the
// tricky ones (percent backwards, chained changes, time zones, second-order sequences …). The age band caps the step:
// children get small numbers and no percentages or fractions.
import type { AgeBand } from "./types";
import { rng } from "./gamification";
import { START, type Step } from "./skill";
import MAP_COUNTRIES from "./map-countries.json";
import { LOGIC } from "./logic";
import { REASONING } from "./reasoning";

export type ExerciseKind = "arithmetic" | "percent" | "fraction" | "units" | "sequence" | "weekday" | "clock" | "map" | "sufficiency" | "word" | "numbers" | "knights" | "syllogism" | "order";
export interface Exercise {
  id: string;
  kind: ExerciseKind;
  step: Step; // how hard (1–5) – a result moves the learner's value for this kind
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  countries?: string[]; // map quiz: the country shown on the map (ISO code)
}

type Level = 0 | 1 | 2; // 0 = 6–9 years, 1 = 10–12, 2 = 13+ (steps 1, 2, 3)
export const levelOf = (age: AgeBand | null): Level => (age === "6-9" ? 0 : age === "10-12" ? 1 : 2);
/** The highest step for an age band. */
export const capOf = (age: AgeBand | null): Step => (age === "6-9" ? 1 : age === "10-12" ? 2 : 5);
const lv = (d: Step): Level => (d <= 1 ? 0 : d === 2 ? 1 : 2);
export const KINDS: Record<Level, ExerciseKind[]> = {
  0: ["arithmetic", "units", "sequence", "weekday", "clock", "map"],
  1: ["arithmetic", "percent", "fraction", "units", "sequence", "weekday", "clock", "map"],
  2: ["arithmetic", "percent", "fraction", "units", "sequence", "weekday", "clock", "map", "map", "sufficiency", "word", "word", "numbers", "knights", "syllogism", "order"], // tricky ones (lib/reasoning.ts, lib/logic.ts) for adults only
};

export const fmt = (n: number, locale: string) => n.toLocaleString(locale === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: 3 });
/** Four different options: the answer and three near misses, at a position drawn from the seed. */
export function choices(answer: number, near: number[], r: () => number, show: (n: number) => string) {
  const wrong = [...new Set(near.filter((n) => n !== answer && Number.isFinite(n) && n >= 0))].slice(0, 3);
  for (let d = 1; wrong.length < 3; d++) for (const n of [answer + d, answer - d]) if (n >= 0 && n !== answer && !wrong.includes(n) && wrong.length < 3) wrong.push(n);
  const at = Math.floor(r() * 4);
  const list = wrong.map(show);
  list.splice(at, 0, show(answer));
  return { options: list, correct: at };
}
/** Like choices(), for texts: the answer and three different wrong ones. */
export function textChoices(answer: string, wrong: string[], r: () => number) {
  const list = [...new Set(wrong.filter((w) => w !== answer))].slice(0, 3);
  const at = Math.floor(r() * 4);
  list.splice(at, 0, answer);
  return { options: list, correct: at };
}
export const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];

export type Make = (r: () => number, d: Step, de: boolean, locale: string) => Omit<Exercise, "id" | "kind" | "step">;

const arithmetic: Make = (r, d, de, locale) => {
  const level = lv(d);
  const op = pick(r, level === 0 ? ["+", "−"] : ["+", "−", "×", "÷"]);
  const max = d >= 4 ? [10_000, 100_000][d - 4] : [20, 100, 1000][level];
  let a = int(r, 2, max), b = int(r, 2, max), answer = 0;
  if (op === "+") answer = a + b;
  if (op === "−") { if (b > a) [a, b] = [b, a]; answer = a - b; }
  if (op === "×") {
    if (d >= 4) { a = int(r, 13, d === 4 ? 49 : 99); b = int(r, 11, d === 4 ? 19 : 29); } // two digits by two digits
    else { a = int(r, 2, level === 1 ? 12 : 25); b = int(r, 2, 12); }
    answer = a * b;
  }
  if (op === "÷") {
    if (d >= 4) { b = int(r, 3, d === 4 ? 19 : 29); answer = int(r, 12, d === 4 ? 60 : 150); }
    else { b = int(r, 2, 12); answer = int(r, 2, level === 1 ? 12 : 25); }
    a = answer * b;
  }
  const c = choices(answer, [answer + 10, answer - 10, answer + 1, answer - 2, op === "×" ? answer + b : answer + 2], r, (n) => fmt(n, locale));
  return { question: de ? `Wie viel ist ${fmt(a, locale)} ${op} ${fmt(b, locale)}?` : `What is ${fmt(a, locale)} ${op} ${fmt(b, locale)}?`, ...c, explanation: `${fmt(a, locale)} ${op} ${fmt(b, locale)} = ${fmt(answer, locale)}` };
};

const signed = (n: number, locale: string) => (n > 0 ? "+" : n < 0 ? "−" : "±") + fmt(Math.abs(n), locale) + (locale === "de" ? " %" : "%");
const percent: Make = (r, d, de, locale) => {
  if (d === 4) {
    // backwards: the price after a discount is known, the price before is asked
    const p = pick(r, [10, 20, 25, 40, 50]);
    const before = int(r, 3, 40) * 20, after = (before * (100 - p)) / 100;
    const c = choices(before, [after * (1 + p / 100), before + 20, after + p, before - 20], r, (n) => `${fmt(n, locale)} €`);
    return {
      question: de ? `Nach ${p} % Rabatt kostet etwas ${fmt(after, locale)} €. Was hat es vorher gekostet?` : `After a ${p}% discount something costs €${fmt(after, locale)}. What did it cost before?`, ...c,
      explanation: de ? `${fmt(after, locale)} € sind ${100 - p} % des alten Preises: ${fmt(after, locale)} : ${fmt((100 - p) / 100, locale)} = ${fmt(before, locale)} €. (Nicht ${p} % auf ${fmt(after, locale)} € aufschlagen – das ergibt zu wenig.)` : `€${fmt(after, locale)} is ${100 - p}% of the old price: ${fmt(after, locale)} ÷ ${fmt((100 - p) / 100, locale)} = ${fmt(before, locale)} €. (Adding ${p}% to €${fmt(after, locale)} gives too little.)`,
    };
  }
  if (d === 5) {
    // two changes in a row: up a %, then down b % – not simply a − b
    const a = pick(r, [10, 20, 25, 50]), b = pick(r, [10, 20, 25, 50]);
    const total = Math.round(((1 + a / 100) * (1 - b / 100) - 1) * 10000) / 100;
    const c = textChoices(signed(total, locale), [signed(a - b, locale), signed(total - 5, locale), signed(total + 5, locale), signed(-total, locale), signed(total - 10, locale), signed(total + 10, locale)], r);
    return {
      question: de ? `Ein Preis steigt um ${a} % und sinkt danach um ${b} %. Wie hat er sich insgesamt verändert?` : `A price rises by ${a}% and then falls by ${b}%. How has it changed overall?`, ...c,
      explanation: de ? `× ${fmt(1 + a / 100, locale)} und dann × ${fmt(1 - b / 100, locale)} = × ${fmt(1 + total / 100, locale)}, also ${signed(total, locale)}. Die zweite Änderung bezieht sich auf den schon geänderten Preis.` : `× ${fmt(1 + a / 100, locale)} then × ${fmt(1 - b / 100, locale)} = × ${fmt(1 + total / 100, locale)}, so ${signed(total, locale)}. The second change applies to the already changed price.`,
    };
  }
  const p = pick(r, d === 2 ? [10, 20, 25, 50, 75] : [5, 10, 15, 20, 25, 30, 40, 50, 75]);
  const base = int(r, 2, 40) * (p % 25 === 0 ? 4 : 10);
  const answer = (base * p) / 100;
  const c = choices(answer, [answer * 2, answer / 2, (base * (p + 10)) / 100, base - answer], r, (n) => fmt(n, locale));
  return {
    question: de ? `Wie viel sind ${p} % von ${fmt(base, locale)}?` : `What is ${p}% of ${fmt(base, locale)}?`, ...c,
    explanation: de ? `${p} % von ${fmt(base, locale)} = ${fmt(base, locale)} × ${fmt(p / 100, locale)} = ${fmt(answer, locale)}` : `${p}% of ${fmt(base, locale)} = ${fmt(base, locale)} × ${fmt(p / 100, locale)} = ${fmt(answer, locale)}`,
  };
};

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export const show = (n: number, m: number) => { const k = gcd(n, m); return m / k === 1 ? String(n / k) : `${n / k}/${m / k}`; };
const fraction: Make = (r, d, de) => {
  const dens = d <= 2 ? [2, 4, 8] : [2, 3, 4, 5, 6, 8, 10, 12];
  const b = pick(r, dens), q = pick(r, dens);
  const a = int(r, 1, b - 1), c = int(r, 1, q - 1);
  if (d >= 4) {
    // step 4: multiply, step 5: divide (times the reciprocal)
    const [num, den] = d === 4 ? [a * c, b * q] : [a * q, b * c];
    const answer = show(num, den);
    const add = show(a * q + c * b, b * q);
    const ch = textChoices(answer, [...(d === 4 ? [show(a * q, b * c), add, show(a + c, b + q)] : [show(a * c, b * q), show(b * c, a * q), add, show(a + q, b + c)]), show(num + 1, den), show(num + 2, den), show(num, den + 1), show(num + 3, den + 1)], r);
    const op = d === 4 ? "×" : "÷";
    return {
      question: de ? `Wie viel ist ${a}/${b} ${op} ${c}/${q}?` : `What is ${a}/${b} ${op} ${c}/${q}?`, ...ch,
      explanation: d === 4 ? `${a}/${b} × ${c}/${q} = ${a * c}/${b * q}${answer !== `${a * c}/${b * q}` ? ` = ${answer}` : ""}` : `${a}/${b} ÷ ${c}/${q} = ${a}/${b} × ${q}/${c} = ${num}/${den}${answer !== `${num}/${den}` ? ` = ${answer}` : ""}`,
    };
  }
  // a/b + c/q; the answer in lowest terms
  const num = a * q + c * b, den = b * q, g = gcd(num, den);
  const answer = show(num, den);
  const wrong = [show(a + c, b + q), show(num + den / g, den), show(Math.max(1, num - den / g), den), show(a * c, b * q)].filter((w) => w !== answer);
  const opts = [...new Set(wrong)].slice(0, 3);
  for (let k = 2; opts.length < 3; k++) { const w = show(num + k, den); if (w !== answer && !opts.includes(w)) opts.push(w); }
  const at = Math.floor(r() * 4);
  opts.splice(at, 0, answer);
  return { question: de ? `Wie viel ist ${a}/${b} + ${c}/${q}?` : `What is ${a}/${b} + ${c}/${q}?`, options: opts, correct: at, explanation: `${a}/${b} + ${c}/${q} = ${a * q}/${den} + ${c * b}/${den} = ${num}/${den}${answer !== `${num}/${den}` ? ` = ${answer}` : ""}` };
};

const UNITS = [
  { from: ["km", "km"], to: ["m", "m"], f: 1000 },
  { from: ["m", "m"], to: ["cm", "cm"], f: 100 },
  { from: ["kg", "kg"], to: ["g", "g"], f: 1000 },
  { from: ["l", "l"], to: ["ml", "ml"], f: 1000 },
  { from: ["Stunden", "hours"], to: ["Minuten", "minutes"], f: 60 },
  { from: ["Minuten", "minutes"], to: ["Sekunden", "seconds"], f: 60 },
];
// step 5: areas and volumes – the factor is the square or cube of the length factor
const UNITS_2D3D = [
  { from: ["m²", "m²"], to: ["cm²", "cm²"], f: 10_000, len: 100 },
  { from: ["km²", "km²"], to: ["m²", "m²"], f: 1_000_000, len: 1000 },
  { from: ["ha", "ha"], to: ["m²", "m²"], f: 10_000, len: 0 },
  { from: ["m³", "m³"], to: ["l", "l"], f: 1000, len: 0 },
  { from: ["dm³", "dm³"], to: ["cm³", "cm³"], f: 1000, len: 10 },
];
const units: Make = (r, d, de, locale) => {
  if (d === 4) {
    // speed: km/h ↔ m/s (1 m/s = 3.6 km/h)
    const ms = pick(r, [5, 10, 15, 20, 25, 30, 35, 40]), kmh = ms * 3.6;
    const back = r() < 0.5;
    const answer = back ? kmh : ms, given = back ? ms : kmh;
    const c = choices(answer, back ? [ms * 60, ms * 36, kmh - 6, ms * 3] : [kmh / 60, kmh * 3.6, kmh / 3, ms + 5], r, (n) => fmt(n, locale));
    const [fu, tu] = back ? ["m/s", "km/h"] : ["km/h", "m/s"];
    return {
      question: de ? `Wie viele ${tu} sind ${fmt(given, locale)} ${fu}?` : `How many ${tu} are ${fmt(given, locale)} ${fu}?`, ...c,
      explanation: de ? `1 m/s = 3,6 km/h (3600 s pro Stunde, 1000 m pro km), also ${fmt(given, locale)} ${back ? "×" : ":"} 3,6 = ${fmt(answer, locale)} ${tu}` : `1 m/s = 3.6 km/h (3600 s an hour, 1000 m a km), so ${fmt(given, locale)} ${back ? "×" : "÷"} 3.6 = ${fmt(answer, locale)} ${tu}`,
    };
  }
  if (d === 5) {
    const u = pick(r, UNITS_2D3D);
    const v = pick(r, [0.5, 1.5, 2, 2.5, 3, 4, 0.25]);
    const answer = Math.round(v * u.f * 1000) / 1000;
    const c = choices(answer, [u.len ? v * u.len : answer / 10, answer * 10, answer / 100, answer * 100], r, (n) => fmt(n, locale));
    const [fu, tu] = [u.from[de ? 0 : 1], u.to[de ? 0 : 1]];
    return {
      question: de ? `Wie viele ${tu} sind ${fmt(v, locale)} ${fu}?` : `How many ${tu} are ${fmt(v, locale)} ${fu}?`, ...c,
      explanation: de ? `1 ${fu} = ${fmt(u.f, locale)} ${tu}${u.len ? ` (${u.len} × ${u.len}${u.f > u.len * u.len ? ` × ${u.len}` : ""})` : ""}, also ${fmt(v, locale)} × ${fmt(u.f, locale)} = ${fmt(answer, locale)} ${tu}` : `1 ${fu} = ${fmt(u.f, locale)} ${tu}${u.len ? ` (${u.len} × ${u.len}${u.f > u.len * u.len ? ` × ${u.len}` : ""})` : ""}, so ${fmt(v, locale)} × ${fmt(u.f, locale)} = ${fmt(answer, locale)} ${tu}`,
    };
  }
  const level = lv(d);
  const u = pick(r, level === 0 ? UNITS.filter((x) => x.f !== 1000 || x.from[0] === "km") : UNITS);
  const v = level === 0 ? int(r, 1, 9) : pick(r, [int(r, 2, 12), int(r, 1, 9) + 0.5, int(r, 1, 20) / 4]);
  const answer = Math.round(v * u.f * 1000) / 1000;
  const c = choices(answer, [answer * 10, answer / 10, v * (u.f === 60 ? 100 : 60), answer + u.f], r, (n) => fmt(n, locale));
  const [fu, tu] = [u.from[de ? 0 : 1], u.to[de ? 0 : 1]];
  return { question: de ? `Wie viele ${tu} sind ${fmt(v, locale)} ${fu}?` : `How many ${tu} are ${fmt(v, locale)} ${fu}?`, ...c, explanation: de ? `1 ${u.from[0].replace(/en$/, "e")} = ${u.f} ${tu}, also ${fmt(v, locale)} × ${u.f} = ${fmt(answer, locale)} ${tu}` : `${fmt(v, locale)} × ${u.f} = ${fmt(answer, locale)} ${tu}` };
};

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const sequence: Make = (r, d, de, locale) => {
  const types = d <= 1 ? ["add"] : d === 2 ? ["add", "mul", "square"] : d === 3 ? ["add", "mul", "square", "fib", "alt"] : d === 4 ? ["diff2", "mulAdd", "fib", "alt"] : ["diff2", "mulAdd", "cube", "interleave", "prime"];
  const type = pick(r, types);
  let seq: number[] = [], rule = "", ruleEn = "";
  const s = int(r, 1, d <= 1 ? 10 : 20);
  if (type === "add") { const k = int(r, 2, d <= 1 ? 5 : 15); seq = Array.from({ length: 5 }, (_, i) => s + i * k); rule = `jedes Mal + ${k}`; ruleEn = `+ ${k} each time`; }
  if (type === "mul") { const m = pick(r, [2, 3]); const st = int(r, 1, 5); seq = Array.from({ length: 5 }, (_, i) => st * m ** i); rule = `jedes Mal × ${m}`; ruleEn = `× ${m} each time`; }
  if (type === "square") { const st = int(r, 1, 6); seq = Array.from({ length: 5 }, (_, i) => (st + i) ** 2); rule = "Quadratzahlen"; ruleEn = "square numbers"; }
  if (type === "fib") { const a = int(r, 1, 4), b = int(r, a, 6); seq = [a, b]; while (seq.length < 5) seq.push(seq[seq.length - 1] + seq[seq.length - 2]); rule = "jede Zahl ist die Summe der beiden davor"; ruleEn = "each number is the sum of the two before"; }
  if (type === "alt") { const d1 = int(r, 2, 9), d2 = int(r, 1, d1 - 1); seq = [s + 10]; for (let i = 1; i < 5; i++) seq.push(seq[i - 1] + (i % 2 ? d1 : -d2)); rule = `abwechselnd + ${d1} und − ${d2}`; ruleEn = `alternately + ${d1} and − ${d2}`; }
  if (type === "diff2") { const k0 = int(r, 1, 6), k = int(r, 2, 5); seq = Array.from({ length: 6 }, (_, i) => s + k0 * i + (k * i * (i - 1)) / 2); rule = `die Abstände wachsen jedes Mal um ${k} (+${k0}, +${k0 + k}, +${k0 + 2 * k} …)`; ruleEn = `the gaps grow by ${k} each time (+${k0}, +${k0 + k}, +${k0 + 2 * k} …)`; }
  if (type === "mulAdd") { const m = pick(r, [2, 3]), a = pick(r, [1, -1, 2]); seq = [int(r, 2, 5)]; /* from 2: × 2 − 1 would stay at 1 */ while (seq.length < 5) seq.push(seq[seq.length - 1] * m + a); rule = `jedes Mal × ${m} ${a > 0 ? "+" : "−"} ${Math.abs(a)}`; ruleEn = `× ${m} ${a > 0 ? "+" : "−"} ${Math.abs(a)} each time`; }
  if (type === "cube") { const st = int(r, 1, 4); seq = Array.from({ length: 5 }, (_, i) => (st + i) ** 3); rule = "Kubikzahlen (n × n × n)"; ruleEn = "cube numbers (n × n × n)"; }
  if (type === "prime") { const at = int(r, 2, PRIMES.length - 6); seq = PRIMES.slice(at, at + 6); rule = "Primzahlen der Reihe nach"; ruleEn = "prime numbers in order"; }
  if (type === "interleave") { const a = int(r, 1, 9), da = int(r, 2, 6), b = int(r, 20, 40), db = -int(r, 1, 4); seq = Array.from({ length: 6 }, (_, i) => (i % 2 ? b + db * ((i - 1) / 2) : a + da * (i / 2))); rule = `zwei Reihen im Wechsel: ${a}, ${a + da}, ${a + 2 * da} … (+${da}) und ${b}, ${b + db} … (−${-db})`; ruleEn = `two sequences taking turns: ${a}, ${a + da}, ${a + 2 * da} … (+${da}) and ${b}, ${b + db} … (−${-db})`; }
  const answer = seq.pop()!;
  const gap = seq[seq.length - 1] - seq[seq.length - 2];
  const c = choices(answer, [answer + 1, answer - 1, seq[seq.length - 1] + gap, answer * 2, answer + 2], r, (n) => fmt(n, locale));
  return { question: de ? `Welche Zahl kommt als Nächstes? ${seq.map((n) => fmt(n, locale)).join(", ")}, …` : `Which number comes next? ${seq.map((n) => fmt(n, locale)).join(", ")}, …`, ...c, explanation: de ? `Die Regel: ${rule}. Also ${fmt(answer, locale)}.` : `The rule: ${ruleEn}. So ${fmt(answer, locale)}.` };
};

const DAYS = [["Montag", "Monday"], ["Dienstag", "Tuesday"], ["Mittwoch", "Wednesday"], ["Donnerstag", "Thursday"], ["Freitag", "Friday"], ["Samstag", "Saturday"], ["Sonntag", "Sunday"]];
const MONTHS = [["Januar", "January", 31], ["Februar", "February", 28], ["März", "March", 31], ["April", "April", 30], ["Mai", "May", 31], ["Juni", "June", 30], ["Juli", "July", 31], ["August", "August", 31], ["September", "September", 30], ["Oktober", "October", 31], ["November", "November", 30], ["Dezember", "December", 31]] as const;
const weekday: Make = (r, d, de) => {
  const start = int(r, 0, 6);
  let plus: number, question: string, intro: string;
  if (d === 5) {
    // from one date to another in a year without 29 February
    const m1 = int(r, 0, 9), m2 = int(r, m1 + 1, 11), d1 = int(r, 1, 28), d2 = int(r, 1, 28);
    const dayOfYear = (m: number, day: number) => MONTHS.slice(0, m).reduce((n, x) => n + x[2], 0) + day;
    plus = dayOfYear(m2, d2) - dayOfYear(m1, d1);
    const date = (m: number, day: number) => (de ? `${day}. ${MONTHS[m][0]}` : `${MONTHS[m][1]} ${day}`);
    question = de ? `In einem Jahr ohne 29. Februar ist der ${date(m1, d1)} ein ${DAYS[start][0]}. Welcher Wochentag ist der ${date(m2, d2)}?` : `In a year without 29 February, ${date(m1, d1)} is a ${DAYS[start][1]}. What day of the week is ${date(m2, d2)}?`;
    intro = de ? `Vom ${date(m1, d1)} bis zum ${date(m2, d2)} sind es ${plus} Tage. ` : `From ${date(m1, d1)} to ${date(m2, d2)} is ${plus} days. `;
  } else {
    plus = d <= 1 ? int(r, 2, 9) : int(r, 8, d === 2 ? 30 : d === 3 ? 100 : 1000);
    question = de ? `Heute ist ${DAYS[start][0]}. Welcher Wochentag ist in ${plus} Tagen?` : `Today is ${DAYS[start][1]}. What day of the week is it in ${plus} days?`;
    intro = "";
  }
  const end = (start + plus) % 7;
  const c = textChoices(DAYS[end][de ? 0 : 1], [(end + 1) % 7, (end + 6) % 7, (end + 2) % 7].map((x) => DAYS[x][de ? 0 : 1]), r);
  const weeks = Math.floor(plus / 7), rest = plus % 7;
  return {
    question, ...c,
    explanation: intro + (de ? `${plus} Tage = ${weeks} ${weeks === 1 ? "Woche" : "Wochen"} und ${rest} ${rest === 1 ? "Tag" : "Tage"}. Nach vollen Wochen ist wieder ${DAYS[start][0]}, ${rest} ${rest === 1 ? "Tag" : "Tage"} weiter ist ${DAYS[end][0]}.` : `${plus} days = ${weeks} week${weeks === 1 ? "" : "s"} and ${rest} day${rest === 1 ? "" : "s"}. After whole weeks it is ${DAYS[start][1]} again; ${rest} days on it is ${DAYS[end][1]}.`),
  };
};

export const hm = (m: number) => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, "0")}:${String(((m % 60) + 60) % 60).padStart(2, "0")}`;
export const dur = (m: number) => `${Math.floor(m / 60)} h ${m % 60} min`.replace(" 0 min", "").replace(/^0 h /, "");
const clock: Make = (r, d, de) => {
  if (d === 5) {
    // a flight across time zones: departure in local time, flying time, the clock at the destination differs by k hours
    const start = int(r, 6, 22) * 60 + pick(r, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const fly = int(r, 2, 11) * 60 + pick(r, [5, 10, 20, 25, 35, 40, 50, 55]);
    const k = pick(r, [-9, -7, -6, -5, -3, 1, 2, 3, 5, 7, 8]);
    const end = start + fly + k * 60;
    const c = textChoices(hm(end), [hm(start + fly), hm(start + fly - k * 60), hm(end + 60), hm(end - 30)], r);
    const later = k > 0;
    return {
      question: de ? `Ein Flug startet um ${hm(start)} Uhr Ortszeit und dauert ${dur(fly)}. Am Ziel gehen die Uhren ${Math.abs(k)} ${Math.abs(k) === 1 ? "Stunde" : "Stunden"} ${later ? "vor" : "nach"}. Wie spät ist es dort bei der Landung?` : `A flight leaves at ${hm(start)} local time and takes ${dur(fly)}. Clocks at the destination are ${Math.abs(k)} hour${Math.abs(k) === 1 ? "" : "s"} ${later ? "ahead" : "behind"}. What time is it there on landing?`, ...c,
      explanation: de ? `${hm(start)} + ${dur(fly)} = ${hm(start + fly)} Uhr nach der Uhr am Start, am Ziel ${later ? "+" : "−"} ${Math.abs(k)} h = ${hm(end)} Uhr` : `${hm(start)} + ${dur(fly)} = ${hm(start + fly)} by the clock at the start; at the destination ${later ? "+" : "−"} ${Math.abs(k)} h = ${hm(end)}`,
    };
  }
  const level = lv(d);
  const start = d === 4 ? int(r, 19, 23) * 60 + pick(r, [5, 10, 20, 25, 35, 40, 50, 55]) : int(r, 6, 21) * 60 + pick(r, level === 0 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const plus = d === 4 ? int(r, 2, 6) * 60 + pick(r, [15, 25, 35, 45, 55]) : level === 0 ? pick(r, [15, 30, 45, 60]) : pick(r, [25, 35, 45, 50, 75, 90, 105, 135]);
  const end = start + plus;
  const c = textChoices(hm(end), [hm(end + 10), hm(end - 10), hm(end + 60)], r);
  const span = d === 4 ? dur(plus) : de ? `${plus} Minuten` : `${plus} minutes`;
  return { question: de ? `Es ist ${hm(start)} Uhr. Wie spät ist es in ${span}?` : `It is ${hm(start)}. What time is it in ${span}?`, ...c, explanation: de ? `${hm(start)} + ${span} = ${hm(end)} Uhr` : `${hm(start)} + ${span} = ${hm(end)}` };
};

// "Welches Land ist auf der Karte markiert?" – names from the browser (Intl.DisplayNames), wrong options from the same
// continent; shapes from the app's own world map (Natural Earth). The same at every step.
const COUNTRIES = MAP_COUNTRIES as Record<string, string>;
const map: Make = (r, _d, de, locale) => {
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

const MAKERS: Record<ExerciseKind, Make> = { arithmetic, percent, fraction, units, sequence, weekday, clock, map, ...REASONING, ...LOGIC };

/** One exercise. `step` is the learner's level for this kind (lib/skill.ts); the age band caps it. */
export function makeExercise(seed: string, kind: ExerciseKind, age: AgeBand | null, locale: string, step: Step = START as Step): Exercise {
  const r = rng(seed);
  const d = Math.min(step, capOf(age)) as Step;
  return { id: `ex-${kind}-${seed}`, kind, step: d, ...MAKERS[kind](r, d, locale === "de", locale) };
}
/** A set of exercises for one visit: the kinds take turns at random, each at the learner's step for that kind. */
export function exercisesFor(age: AgeBand | null, locale: string, count: number, seed: string, stepFor: (kind: ExerciseKind) => Step = () => START as Step): Exercise[] {
  const r = rng(`ex-${seed}`);
  const kinds = KINDS[levelOf(age)];
  return Array.from({ length: count }, (_, i) => {
    const kind = kinds[Math.floor(r() * kinds.length)];
    return makeExercise(`${seed}-${i}`, kind, age, locale, stepFor(kind));
  });
}
