// Logic puzzles as exercises – each generated, solved by trying every possibility, and only shown when exactly one
// answer fits:
//  - knights: some people always tell the truth, the others always lie; who is which? ("ehrlich" / "lügt" instead of
//    knights and knaves, so no role word has to be gendered)
//  - syllogism: two statements about three made-up groups (so no world knowledge helps or misleads) – what follows for
//    certain? Checked over every possible arrangement of the groups;
//  - order: who finished where, from a few clues – reduced to the clues that are really needed.
// Five steps each (lib/skill.ts); adults only (KINDS in exercises.ts).
import type { Step } from "./skill";
import { int, pick, textChoices, type Make } from "./exercises";

const shuffle = <T,>(list: T[], r: () => number) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const PEOPLE = ["Anna", "Ben", "Clara", "David", "Emil"];

// ---------------------------------------------------------------- truth-tellers and liars
interface Claim { de: string; en: string; truth: (honest: boolean[]) => boolean }
function claims(i: number, n: number, d: Step, r: () => number): Claim[] {
  const others = range(n).filter((j) => j !== i);
  const j = pick(r, others), l = pick(r, others.filter((x) => x !== j));
  const count = (h: boolean[]) => h.filter(Boolean).length;
  const list: Claim[] = [
    { de: `${PEOPLE[j]} lügt.`, en: `${PEOPLE[j]} is lying.`, truth: (h) => !h[j] },
    { de: `${PEOPLE[j]} sagt die Wahrheit.`, en: `${PEOPLE[j]} tells the truth.`, truth: (h) => h[j] },
    { de: `${PEOPLE[j]} und ich sind gleich: beide ehrlich oder beide Lügner.`, en: `${PEOPLE[j]} and I are alike: both honest or both liars.`, truth: (h) => h[i] === h[j] },
  ];
  if (d >= 2) list.push(
    { de: "Mindestens eine Person hier lügt.", en: "At least one person here is lying.", truth: (h) => count(h) < n },
    { de: "Wir lügen alle.", en: "We are all lying.", truth: (h) => count(h) === 0 },
  );
  if (d >= 3 && l !== undefined) list.push(
    { de: `${PEOPLE[j]} und ${PEOPLE[l]} sind gleich: beide ehrlich oder beide Lügner.`, en: `${PEOPLE[j]} and ${PEOPLE[l]} are alike: both honest or both liars.`, truth: (h) => h[j] === h[l] },
    { de: "Genau eine Person hier ist ehrlich.", en: "Exactly one person here is honest.", truth: (h) => count(h) === 1 },
  );
  if (d >= 4) list.push(
    { de: `Ich lüge, oder ${PEOPLE[j]} ist ehrlich.`, en: `I am lying, or ${PEOPLE[j]} is honest.`, truth: (h) => !h[i] || h[j] },
    { de: "Genau zwei Personen hier sind ehrlich.", en: "Exactly two people here are honest.", truth: (h) => count(h) === 2 },
  );
  return list;
}
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const assignments = (n: number) => range(2 ** n).map((m) => range(n).map((i) => !!(m & (1 << i))));

const knights: Make = (r, d, de) => {
  const n = d <= 2 ? 2 : d <= 4 ? 3 : 4;
  for (;;) {
    const said = range(n).map((i) => pick(r, claims(i, n, d, r)));
    const fits = (h: boolean[]) => said.every((c, i) => c.truth(h) === h[i]);
    const ok = assignments(n).filter(fits);
    if (ok.length !== 1) continue;
    const truth = ok[0];
    const label = (h: boolean[]) => range(n).map((i) => `${PEOPLE[i]} ${h[i] ? (de ? "ehrlich" : "honest") : de ? "lügt" : "lies"}`).join(" · ");
    // wrong options: the closest other distributions first (one person different)
    const others = shuffle(assignments(n).filter((h) => !fits(h)), r).sort((a, b) => a.filter((x, k) => x !== truth[k]).length - b.filter((x, k) => x !== truth[k]).length);
    const c = textChoices(label(truth), others.slice(0, 3).map(label), r);
    const check = range(n).map((i) => (de ? `${PEOPLE[i]} ${truth[i] ? "ist ehrlich – „" + said[i].de + "“ stimmt" : "lügt – „" + said[i].de + "“ ist falsch"}.` : `${PEOPLE[i]} ${truth[i] ? "is honest – “" + said[i].en + "” is true" : "lies – “" + said[i].en + "” is false"}.`)).join(" ");
    // one wrong option and where it breaks
    const w = others[0], k = range(n).find((i) => said[i].truth(w) !== w[i])!;
    const broken = de ? `Dagegen etwa „${label(w)}“: Dann wäre „${said[k].de}“ ${said[k].truth(w) ? "wahr" : "falsch"} – obwohl ${PEOPLE[k]} ${w[k] ? "ehrlich ist" : "lügt"}.` : `Against “${label(w)}”: then “${said[k].en}” would be ${said[k].truth(w) ? "true" : "false"} – although ${PEOPLE[k]} ${w[k] ? "is honest" : "lies"}.`;
    return {
      question: de
        ? `Ehrliche sagen immer die Wahrheit, Lügner lügen immer.\n${range(n).map((i) => `${PEOPLE[i]}: „${said[i].de}“`).join("\n")}\nWer ist ehrlich, wer lügt?`
        : `Honest people always tell the truth, liars always lie.\n${range(n).map((i) => `${PEOPLE[i]}: “${said[i].en}”`).join("\n")}\nWho is honest, who is lying?`,
      ...c,
      explanation: `${de ? "Nur so passt alles:" : "Only this fits:"} ${label(truth)}. ${check} ${broken}`,
    };
  }
};

// ---------------------------------------------------------------- what follows? (syllogisms)
// made-up groups (German singular and plural, English plural and singular) – so knowledge of the world neither helps nor misleads
const TERMS: [string, string, string, string][] = [["Blimp", "Blimps", "blimps", "blimp"], ["Drax", "Draxe", "draxes", "drax"], ["Gork", "Gorks", "gorks", "gork"], ["Plinse", "Plinsen", "plinses", "plinse"], ["Zappler", "Zappler", "zapplers", "zappler"], ["Wuffel", "Wuffel", "wuffles", "wuffle"], ["Quabbe", "Quabben", "quabbles", "quabble"], ["Fümpel", "Fümpel", "fumples", "fumple"]];
type Form = "all" | "no" | "some" | "someNot";
interface Sentence { form: Form; x: number; y: number } // x, y: 0, 1, 2 = the three groups
const inside = (region: number, g: number) => !!(region & (1 << g));
/** Does the sentence hold in a world where exactly the given regions (combinations of groups) have members? */
function holds(s: Sentence, world: number[]) {
  const xy = world.some((g) => inside(g, s.x) && inside(g, s.y)), xNotY = world.some((g) => inside(g, s.x) && !inside(g, s.y));
  return s.form === "all" ? !xNotY : s.form === "no" ? !xy : s.form === "some" ? xy : xNotY;
}
// every world in which all three groups have members (8 regions, each with or without members)
const WORLDS = range(256).map((m) => range(8).filter((g) => m & (1 << g))).filter((w) => [0, 1, 2].every((k) => w.some((g) => inside(g, k))));

const syllogism: Make = (r, d, de) => {
  const forms: Form[] = d <= 2 ? ["all"] : d === 3 ? ["all", "no"] : d === 4 ? ["all", "no", "some"] : ["all", "no", "some", "someNot"];
  const t = shuffle(TERMS, r).slice(0, 3);
  const say = (s: Sentence) => {
    const [X, Y] = [t[s.x], t[s.y]];
    return de
      ? { all: `Alle ${X[1]} sind ${Y[1]}.`, no: `Keine ${X[1]} sind ${Y[1]}.`, some: `Einige ${X[1]} sind ${Y[1]}.`, someNot: `Einige ${X[1]} sind keine ${Y[1]}.` }[s.form]
      : { all: `All ${X[2]} are ${Y[2]}.`, no: `No ${X[2]} are ${Y[2]}.`, some: `Some ${X[2]} are ${Y[2]}.`, someNot: `Some ${X[2]} are not ${Y[2]}.` }[s.form];
  };
  for (;;) {
    const p1: Sentence = { form: pick(r, forms), ...(r() < 0.5 ? { x: 0, y: 1 } : { x: 1, y: 0 }) };
    const p2: Sentence = { form: pick(r, forms), ...(r() < 0.5 ? { x: 1, y: 2 } : { x: 2, y: 1 }) };
    const worlds = WORLDS.filter((w) => holds(p1, w) && holds(p2, w));
    if (!worlds.length) continue;
    const candidates: Sentence[] = (["all", "no", "some", "someNot"] as Form[]).flatMap((form) => [{ form, x: 0, y: 2 }, { form, x: 2, y: 0 }]);
    const valid = candidates.filter((c) => worlds.every((w) => holds(c, w)));
    const invalid = shuffle(candidates.filter((c) => !valid.includes(c)), r);
    if (invalid.length < 3) continue;
    const nothing = de ? "Nichts davon folgt sicher." : "None of these follows for certain.";
    const right = valid.length && r() < (d === 5 ? 0.6 : 0.8) ? pick(r, valid) : null;
    const shown = right ? [right, ...invalid.slice(0, 2)] : invalid.slice(0, 3);
    const order = shuffle(shown, r).map(say);
    const options = [...order, nothing];
    const correct = right ? order.indexOf(say(right)) : 3;
    // a counterexample to one wrong option: the smallest world where both statements hold but it does not
    const wrong = shown.find((s) => s !== right)!;
    const world = worlds.filter((w) => !holds(wrong, w)).sort((a, b) => a.length - b.length)[0];
    // one kind of thing in that world, by the groups it belongs to ("Blimp und Drax", "nur Gork")
    const thing = (g: number) => {
      const has = [0, 1, 2].filter((k) => inside(g, k)).map((k) => t[k][de ? 0 : 3]);
      return has.length === 1 ? `${de ? "nur" : "only"} ${has[0]}` : has.join(de ? " und " : " and ");
    };
    const counter = de
      ? `Gegenbeispiel zu „${say(wrong)}“: Es könnte nur solche Dinge geben – ${world.map(thing).join("; ")}. Dann stimmen beide Aussagen, dieser Satz aber nicht.`
      : `Counterexample to “${say(wrong)}”: there could be only these things – ${world.map(thing).join("; ")}. Then both statements hold, but this sentence does not.`;
    const why = right
      ? (de ? `„${say(right)}“ stimmt in jeder Lage, in der beide Aussagen stimmen – also folgt es sicher.` : `“${say(right)}” holds whenever both statements hold – so it follows for certain.`)
      : (de ? "Keiner der drei Sätze muss stimmen, wenn beide Aussagen stimmen." : "None of the three sentences has to hold when both statements hold.");
    return {
      question: de
        ? `Es gibt ${t[0][1]}, ${t[1][1]} und ${t[2][1]}.\n(1) ${say(p1)}\n(2) ${say(p2)}\nWas folgt daraus sicher?`
        : `There are ${t[0][2]}, ${t[1][2]} and ${t[2][2]}.\n(1) ${say(p1)}\n(2) ${say(p2)}\nWhat follows for certain?`,
      options, correct,
      explanation: `${why} ${counter} ${de ? "Richtig:" : "Right:"} ${options[correct]}`,
    };
  }
};

// ---------------------------------------------------------------- who finished where?
interface Clue { de: string; en: string; test: (order: number[]) => boolean; type: string }
function permutations(n: number): number[][] {
  if (n === 1) return [[0]];
  return permutations(n - 1).flatMap((p) => range(n).map((k) => [...p.slice(0, k), n - 1, ...p.slice(k)]));
}
const order: Make = (r, d, de) => {
  const n = d <= 2 ? 4 : 5;
  const names = PEOPLE.slice(0, n);
  const types = d <= 2 ? ["before", "pos", "next"] : d <= 4 ? ["before", "pos", "next", "notPos", "adjacent", "gap"] : ["before", "next", "notPos", "adjacent", "gap"];
  const all = permutations(n);
  for (;;) {
    const sol = shuffle(range(n), r); // sol[place] = person
    const place = (o: number[], p: number) => o.indexOf(p);
    const pool: Clue[] = [];
    for (const a of range(n)) for (const b of range(n)) {
      if (a === b) continue;
      const [A, B] = [names[a], names[b]];
      if (place(sol, a) < place(sol, b)) pool.push({ type: "before", de: `${A} ist vor ${B} im Ziel.`, en: `${A} finishes before ${B}.`, test: (o) => place(o, a) < place(o, b) });
      if (place(sol, a) + 1 === place(sol, b)) pool.push({ type: "next", de: `${A} kommt direkt vor ${B} ins Ziel.`, en: `${A} finishes right before ${B}.`, test: (o) => place(o, a) + 1 === place(o, b) });
      if (a < b && Math.abs(place(sol, a) - place(sol, b)) === 1) pool.push({ type: "adjacent", de: `${A} und ${B} kommen direkt nacheinander ins Ziel.`, en: `${A} and ${B} finish one right after the other.`, test: (o) => Math.abs(place(o, a) - place(o, b)) === 1 });
      if (a < b && Math.abs(place(sol, a) - place(sol, b)) === 2) pool.push({ type: "gap", de: `Zwischen ${A} und ${B} kommt genau eine Person ins Ziel.`, en: `Exactly one person finishes between ${A} and ${B}.`, test: (o) => Math.abs(place(o, a) - place(o, b)) === 2 });
    }
    for (const a of range(n)) {
      pool.push({ type: "pos", de: `${names[a]} landet auf Platz ${place(sol, a) + 1}.`, en: `${names[a]} comes ${place(sol, a) + 1}${["st", "nd", "rd"][place(sol, a)] ?? "th"}.`, test: (o) => place(o, a) === place(sol, a) });
      for (const p of range(n)) if (p !== place(sol, a)) pool.push({ type: "notPos", de: `${names[a]} landet nicht auf Platz ${p + 1}.`, en: `${names[a]} does not come ${p + 1}${["st", "nd", "rd"][p] ?? "th"}.`, test: (o) => place(o, a) !== p });
    }
    const usable = shuffle(pool.filter((c) => types.includes(c.type)), r);
    // add clues until only one order fits …
    const chosen: Clue[] = [];
    let left = all;
    for (const c of usable) {
      if (left.length === 1) break;
      const next = left.filter(c.test);
      if (next.length < left.length) { chosen.push(c); left = next; }
    }
    if (left.length !== 1) continue;
    // … then, from step 2, drop every clue that is not needed
    if (d >= 2) for (const c of shuffle(chosen, r)) {
      const rest = chosen.filter((x) => x !== c);
      if (all.filter((o) => rest.every((x) => x.test(o))).length === 1) chosen.splice(chosen.indexOf(c), 1);
    }
    if (chosen.length > 6) continue; // too long to read
    const q = int(r, 0, n - 1);
    const answer = names[sol[q]];
    const c = textChoices(answer, shuffle(names.filter((x) => x !== answer), r), r);
    const listing = sol.map((p, k) => `${k + 1}. ${names[p]}`).join(", ");
    return {
      question: de
        ? `${n} Personen laufen um die Wette, niemand kommt gleichzeitig an.\n${chosen.map((x) => `– ${x.de}`).join("\n")}\nWer landet auf Platz ${q + 1}?`
        : `${n} people run a race; no two finish at the same time.\n${chosen.map((x) => `– ${x.en}`).join("\n")}\nWho comes ${q + 1}${["st", "nd", "rd"][q] ?? "th"}?`,
      ...c,
      explanation: de ? `Nur eine Reihenfolge erfüllt alle Hinweise: ${listing}. Auf Platz ${q + 1}: ${answer}.` : `Only one order fits every clue: ${listing}. In place ${q + 1}: ${answer}.`,
    };
  }
};

export const LOGIC = { knights, syllogism, order };
