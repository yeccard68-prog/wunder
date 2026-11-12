// More logic puzzles as exercises – each generated from a seed, solved by trying every possibility, and only shown when
// the answer is certain:
//  - code: crack a combination lock from hints about a few attempts ("one digit is right, but in the wrong place");
//  - zebra: who has which pet and plays what – a small logic grid from a few clues;
//  - conditional: "if … then" rules – what follows for certain from an observation, and which cards must be turned over;
//  - scales: balanced scales with symbols – how many of one weigh as much as another, which side is heavier;
//  - family: who is who in a family ("the brother of Mia's mother").
// Five steps each (lib/skill.ts). tests/brain.test.ts reads the German text back and solves every puzzle again.
import { choices, fmt, int, pick, textChoices, type Make } from "./exercises";

export const range = (n: number) => Array.from({ length: n }, (_, i) => i);
export const shuffle = <T,>(list: T[], r: () => number) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
export function permutations(n: number): number[][] {
  if (n === 1) return [[0]];
  return permutations(n - 1).flatMap((p) => range(n).map((k) => [...p.slice(0, k), n - 1, ...p.slice(k)]));
}
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** "1, 9 und 7" */
export const listing = (items: (string | number)[], de: boolean) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${de ? "und" : "and"} ${items[items.length - 1]}`);
const PEOPLE = ["Anna", "Ben", "Clara", "David"];
type Out = ReturnType<Make>;

// ---------------------------------------------------------------- crack the code
type Code = number[];
/** Every arrangement of n different digits from the pool. */
function arrangements(pool: number[], n: number): Code[] {
  if (n === 0) return [[]];
  return pool.flatMap((d) => arrangements(pool.filter((x) => x !== d), n - 1).map((rest) => [d, ...rest]));
}
/** [digits in the right place, right digits in the wrong place] */
export const feedback = (guess: Code, secret: Code): [number, number] => {
  let placed = 0, found = 0;
  for (let i = 0; i < guess.length; i++) {
    if (secret[i] === guess[i]) placed++;
    if (secret.includes(guess[i])) found++;
  }
  return [placed, found - placed];
};
const COUNT_DE = ["keine", "eine", "zwei", "drei", "vier"], COUNT_EN = ["no", "one", "two", "three", "four"];
/** The hint for an attempt: how many digits are right and how many of them sit in the right place. */
export function codeHint(p: number, m: number, n: number, de: boolean): string {
  const t = p + m;
  if (de) {
    if (!t) return "Keine Ziffer stimmt.";
    const head = t === n ? `Alle ${COUNT_DE[t]} Ziffern stimmen` : t === 1 ? "Eine Ziffer stimmt" : `${cap(COUNT_DE[t])} Ziffern stimmen`;
    if (p === t) return `${head} und ${t === 1 ? "steht" : "stehen"} an der richtigen Stelle.`;
    if (p === 0) return `${head}, ${t === 1 ? "steht aber" : `stehen aber ${t === 2 ? "beide" : "alle"}`} an der falschen Stelle.`;
    return `${head}, aber nur ${COUNT_DE[p]} ${p === 1 ? "steht" : "stehen"} an der richtigen Stelle.`;
  }
  if (!t) return "No digit is right.";
  const head = t === n ? `All ${COUNT_EN[t]} digits are right` : t === 1 ? "One digit is right" : `${cap(COUNT_EN[t])} digits are right`;
  if (p === t) return `${head} and in the right place.`;
  if (p === 0) return `${head}, but ${t === 1 ? "" : t === 2 ? "both " : "all "}in the wrong place.`;
  return `${head}, but only ${COUNT_EN[p]} ${p === 1 ? "is" : "are"} in the right place.`;
}

const code: Make = (r, d, de) => {
  const n = d === 5 ? 4 : 3;
  const all = arrangements(d <= 2 ? [1, 2, 3, 4, 5, 6] : range(10), n);
  const key = (c: Code) => c.join("");
  // which hints may come up: easy steps only "one digit right" and "none"; step 4 never the helpful "none"
  const allowed = (p: number, m: number) => p < n && (d === 1 ? p + m <= 1 : d <= 3 ? p + m <= 2 : d === 4 ? p + m >= 1 : true);
  const max = d === 5 ? 6 : 5;
  type Clue = { guess: Code; p: number; m: number };
  const fits = (c: Clue, x: Code) => { const [p, m] = feedback(c.guess, x); return p === c.p && m === c.m; };
  for (;;) {
    const secret = pick(r, all);
    let clues: Clue[] = [], left = all;
    while (left.length > 1 && clues.length < max) {
      // of a few random attempts, the one whose hint rules out the most
      let best: { clue: Clue; next: Code[] } | null = null;
      for (let k = 0; k < 6; k++) {
        const guess = pick(r, all);
        const [p, m] = feedback(guess, secret);
        if (!allowed(p, m) || clues.some((c) => key(c.guess) === key(guess))) continue;
        const clue = { guess, p, m }, next = left.filter((x) => fits(clue, x));
        if (next.length < left.length && (!best || next.length < best.next.length)) best = { clue, next };
      }
      if (!best) break;
      clues.push(best.clue);
      left = best.next;
    }
    if (left.length !== 1) continue;
    // drop every hint that is not needed
    for (const c of shuffle(clues, r)) {
      const rest = clues.filter((x) => x !== c);
      if (rest.length >= 3 && all.filter((x) => rest.every((k) => fits(k, x))).length === 1) clues = rest;
    }
    if (clues.length < 3 || new Set(clues.map((cl) => `${cl.p}${cl.m}`)).size < 2) continue; // not three times the same hint
    // wrong options: codes that break as few hints as possible
    const fails = (x: Code) => clues.filter((c) => !fits(c, x)).length;
    const others = shuffle(all.filter((x) => key(x) !== key(secret)), r).map((x) => ({ x, f: fails(x) })).sort((a, b) => a.f - b.f).slice(0, 3).map((o) => o.x);
    const c = textChoices(key(secret), others.map(key), r);
    const show = (cl: Clue) => {
      const P = cl.guess.filter((g, i) => secret[i] === g), M = cl.guess.filter((g, i) => secret[i] !== g && secret.includes(g));
      if (!P.length && !M.length) return `${key(cl.guess)}: ${de ? "keine Ziffer kommt vor" : "no digit occurs"}`;
      const parts = [
        P.length ? (de ? `${listing(P, de)} ${P.length === 1 ? "steht" : "stehen"} richtig` : `${listing(P, de)} ${P.length === 1 ? "is" : "are"} in the right place`) : "",
        M.length ? (de ? `${listing(M, de)} ${M.length === 1 ? "kommt" : "kommen"} vor, aber an anderer Stelle` : `${listing(M, de)} ${M.length === 1 ? "occurs" : "occur"} elsewhere in the code`) : "",
      ];
      return `${key(cl.guess)}: ${parts.filter(Boolean).join("; ")}`;
    };
    const w = others[0], broken = clues.find((cl) => !fits(cl, w))!;
    return {
      question: de
        ? `Ein Zahlenschloss hat einen Code aus ${n} verschiedenen Ziffern${d <= 2 ? " von 1 bis 6" : ""}. Zu einigen Versuchen gibt es einen Hinweis:\n${clues.map((cl) => `${key(cl.guess)} – ${codeHint(cl.p, cl.m, n, true)}`).join("\n")}\nWie lautet der Code?`
        : `A combination lock has a code of ${n} different digits${d <= 2 ? " from 1 to 6" : ""}. Some attempts come with a hint:\n${clues.map((cl) => `${key(cl.guess)} – ${codeHint(cl.p, cl.m, n, false)}`).join("\n")}\nWhat is the code?`,
      ...c,
      explanation: de
        ? `Der Code ist ${key(secret)}. Probe – ${clues.map(show).join(" · ")}. Dagegen ${key(w)}: Dazu würde der Hinweis bei ${key(broken.guess)} nicht passen.`
        : `The code is ${key(secret)}. Check – ${clues.map(show).join(" · ")}. Against ${key(w)}: the hint for ${key(broken.guess)} would not fit.`,
    };
  }
};

// ---------------------------------------------------------------- who has what?
const PETS = [
  { de: ["einen Hund", "keinen Hund", "Hund"], en: ["a dog", "dog"] },
  { de: ["eine Katze", "keine Katze", "Katze"], en: ["a cat", "cat"] },
  { de: ["einen Vogel", "keinen Vogel", "Vogel"], en: ["a bird", "bird"] },
  { de: ["einen Hasen", "keinen Hasen", "Hase"], en: ["a rabbit", "rabbit"] },
];
const GAMES = [["Schach", "chess"], ["Tennis", "tennis"], ["Fußball", "football"], ["Golf", "golf"]];
export const CANNOT_SAY = ["Das lässt sich nicht sicher sagen.", "That cannot be said for certain."];
interface World { pet: number[]; game: number[] } // pet[i], game[i]: what person i has and plays
interface Hint { type: string; de: string; en: string; test: (w: World) => boolean }

const zebra: Make = (r, d, de) => {
  const n = d >= 4 ? 4 : 3, two = d >= 2;
  const types = d === 1 ? ["pet", "noPet"] : d === 2 ? ["pet", "noPet", "game", "noGame", "link"] : d === 3 ? ["pet", "noPet", "noGame", "link", "noLink"] : d === 4 ? ["pet", "game", "noPet", "noGame", "link", "noLink"] : ["game", "noPet", "noGame", "link", "noLink"];
  const maxHints = [3, 4, 5, 6, 8][d - 1];
  const direct = (c: Hint) => c.type === "pet" || c.type === "game";
  const names = PEOPLE.slice(0, n);
  const perms = permutations(n);
  const worlds: World[] = perms.flatMap((pet) => (two ? perms : [range(n)]).map((game) => ({ pet, game })));
  const L = de ? 0 : 1;
  for (;;) {
    const sol = pick(r, worlds);
    const pool: Hint[] = [];
    for (const i of range(n)) for (const k of range(n)) {
      if (sol.pet[i] === k) pool.push({ type: "pet", de: `${names[i]} hat ${PETS[k].de[0]}.`, en: `${names[i]} has ${PETS[k].en[0]}.`, test: (w) => w.pet[i] === k });
      else pool.push({ type: "noPet", de: `${names[i]} hat ${PETS[k].de[1]}.`, en: `${names[i]} does not have ${PETS[k].en[0]}.`, test: (w) => w.pet[i] !== k });
      if (!two) continue;
      if (sol.game[i] === k) pool.push({ type: "game", de: `${names[i]} spielt ${GAMES[k][0]}.`, en: `${names[i]} plays ${GAMES[k][1]}.`, test: (w) => w.game[i] === k });
      else pool.push({ type: "noGame", de: `${names[i]} spielt nicht ${GAMES[k][0]}.`, en: `${names[i]} does not play ${GAMES[k][1]}.`, test: (w) => w.game[i] !== k });
    }
    if (two) for (const k of range(n)) for (const g of range(n)) {
      const owner = (w: World) => w.pet.indexOf(k);
      if (sol.game[owner(sol)] === g) pool.push({ type: "link", de: `Wer ${PETS[k].de[0]} hat, spielt ${GAMES[g][0]}.`, en: `Whoever has ${PETS[k].en[0]} plays ${GAMES[g][1]}.`, test: (w) => w.game[owner(w)] === g });
      else pool.push({ type: "noLink", de: `Wer ${PETS[k].de[0]} hat, spielt nicht ${GAMES[g][0]}.`, en: `Whoever has ${PETS[k].en[0]} does not play ${GAMES[g][1]}.`, test: (w) => w.game[owner(w)] !== g });
    }
    // add clues until only one distribution fits (steps 3 and 5: one direct clue at most) …
    let chosen: Hint[] = [], left = worlds;
    const usable = shuffle(pool.filter((x) => types.includes(x.type)), r);
    const allowed = (c: Hint) => !chosen.includes(c) && !((d === 3 || d === 5) && direct(c) && chosen.some(direct));
    if (d < 5) for (const c of usable) {
      if (left.length === 1) break;
      if (!allowed(c)) continue;
      const next = left.filter(c.test);
      if (next.length < left.length) { chosen.push(c); left = next; }
    }
    // … on the last step, with four people and hardly any direct clue: of a few clues always the one that rules out the most
    else while (left.length > 1 && chosen.length <= maxHints) {
      const best = shuffle(usable.filter(allowed), r).slice(0, 8).map((c) => ({ c, next: left.filter(c.test) })).sort((a, b) => a.next.length - b.next.length)[0];
      if (!best || best.next.length === left.length) break;
      chosen.push(best.c);
      left = best.next;
    }
    if (left.length !== 1) continue;
    // … then drop every clue that is not needed
    for (const c of shuffle(chosen, r)) {
      const rest = chosen.filter((x) => x !== c);
      if (rest.length >= 2 && worlds.filter((w) => rest.every((x) => x.test(w))).length === 1) chosen = rest;
    }
    if (chosen.length > maxHints) continue;
    const asks = [
      ...range(n).map((k) => ({ who: (w: World) => w.pet.indexOf(k), de: `Wer hat ${PETS[k].de[0]}?`, en: `Who has ${PETS[k].en[0]}?` })),
      ...(two ? range(n).map((g) => ({ who: (w: World) => w.game.indexOf(g), de: `Wer spielt ${GAMES[g][0]}?`, en: `Who plays ${GAMES[g][1]}?` })) : []),
    ];
    // not a question that one clue alone already answers
    const fair = asks.filter((a) => chosen.every((c) => new Set(worlds.filter(c.test).map(a.who)).size > 1));
    if (!fair.length) continue;
    const ask = pick(r, fair);
    const describe = (w: World) => names.map((p, i) => `${p}: ${PETS[w.pet[i]][de ? "de" : "en"][de ? 2 : 1]}${two ? `, ${GAMES[w.game[i]][L]}` : ""}`).join(" · ");
    const intro = de
      ? `${n === 3 ? "Drei" : "Vier"} Personen – ${names.join(", ")} – haben je ein anderes Haustier (${range(n).map((k) => PETS[k].de[2]).join(", ")})${two ? ` und spielen je etwas anderes (${range(n).map((g) => GAMES[g][0]).join(", ")})` : ""}.`
      : `${n === 3 ? "Three" : "Four"} people – ${names.join(", ")} – each have a different pet (${range(n).map((k) => PETS[k].en[1]).join(", ")})${two ? ` and each play something different (${range(n).map((g) => GAMES[g][1]).join(", ")})` : ""}.`;
    const text = (hints: Hint[]) => `${intro}\n${hints.map((x) => `– ${x[de ? "de" : "en"]}`).join("\n")}\n${ask[de ? "de" : "en"]}`;
    const options = n === 3 ? [...names, CANNOT_SAY[L]] : names;
    // step 3, now and then: one clue fewer, so that the question can no longer be answered
    if (d === 3 && r() < 0.25) {
      for (const c of shuffle(chosen, r)) {
        const rest = chosen.filter((x) => x !== c), fit = worlds.filter((w) => rest.every((x) => x.test(w)));
        const other = fit.find((w) => ask.who(w) !== ask.who(sol));
        if (rest.length < 2 || !other) continue;
        return {
          question: text(rest), options, correct: 3,
          explanation: de
            ? `Mehrere Verteilungen erfüllen alle Hinweise, zum Beispiel ${describe(sol)} – oder ${describe(other)}. Die Antwort wäre einmal ${names[ask.who(sol)]}, einmal ${names[ask.who(other)]}. Also: ${CANNOT_SAY[0]}`
            : `Several distributions fit every clue, for example ${describe(sol)} – or ${describe(other)}. The answer would be ${names[ask.who(sol)]} in one and ${names[ask.who(other)]} in the other. So: ${CANNOT_SAY[1]}`,
        };
      }
    }
    return {
      question: text(chosen), options, correct: ask.who(sol),
      explanation: de ? `Nur eine Verteilung erfüllt alle Hinweise – ${describe(sol)}. Also: ${names[ask.who(sol)]}.` : `Only one distribution fits every clue – ${describe(sol)}. So: ${names[ask.who(sol)]}.`,
    };
  }
};

// ---------------------------------------------------------------- if … then
// German word order is built from [subject, verb, rest]; English from [subject, is so, is not so]
interface Atom { de: [string, string, string]; en: [string, string, string] }
const SCENES: { de: string; en: string; atoms: Atom[] }[] = [
  { de: "An einer Maschine gilt:", en: "On a machine:", atoms: [
    { de: ["die rote Lampe", "leuchtet", ""], en: ["the red lamp", "is lit", "is not lit"] },
    { de: ["der Motor", "läuft", ""], en: ["the motor", "is running", "is not running"] },
    { de: ["die Klappe", "ist", "offen"], en: ["the hatch", "is open", "is not open"] },
    { de: ["der Alarm", "ertönt", ""], en: ["the alarm", "is sounding", "is not sounding"] },
  ] },
  { de: "In einem Haus gilt:", en: "In a house:", atoms: [
    { de: ["das Fenster", "steht", "offen"], en: ["the window", "is open", "is not open"] },
    { de: ["die Heizung", "läuft", ""], en: ["the heating", "is on", "is not on"] },
    { de: ["das Licht", "brennt", ""], en: ["the light", "is on", "is not on"] },
    { de: ["die Katze", "schläft", ""], en: ["the cat", "is asleep", "is not asleep"] },
  ] },
  { de: "In einem Garten gilt:", en: "In a garden:", atoms: [
    { de: ["der Rasensprenger", "läuft", ""], en: ["the sprinkler", "is running", "is not running"] },
    { de: ["das Tor", "ist", "geschlossen"], en: ["the gate", "is closed", "is not closed"] },
    { de: ["der Hund", "bellt", ""], en: ["the dog", "is barking", "is not barking"] },
    { de: ["die Laterne", "leuchtet", ""], en: ["the lantern", "is lit", "is not lit"] },
  ] },
];
const tail = (a: Atom) => (a.de[2] ? ` ${a.de[2]}` : "");
/** "die Klappe ist nicht offen" · "die Klappe nicht offen ist" (after "wenn") · "ist die Klappe nicht offen" (after the comma) */
export const plainDe = (a: Atom, v: boolean) => `${a.de[0]} ${a.de[1]}${v ? "" : " nicht"}${tail(a)}`;
const subDe = (a: Atom, v: boolean) => `${a.de[0]}${v ? "" : " nicht"}${tail(a)} ${a.de[1]}`;
const invDe = (a: Atom, v: boolean) => `${a.de[1]} ${a.de[0]}${v ? "" : " nicht"}${tail(a)}`;
const plainEn = (a: Atom, v: boolean) => `${a.en[0]} ${a.en[v ? 1 : 2]}`;
interface Rule { type: string; atoms: number[]; de: string; en: string; holds: (m: boolean[]) => boolean }
export const CONTRADICTION = [["Das kann nicht sein – es widerspricht der Regel.", "Das kann nicht sein – es widerspricht den Regeln."], ["That cannot be – it contradicts the rule.", "That cannot be – it contradicts the rules."]];
export const BOTH = ["Beides ist möglich.", "Both are possible."];

/** Which of four cards must be turned over to test "if one side shows X, the other shows Y" (after Wason's selection task). */
function cards(r: () => number, d: number, de: boolean): Out {
  type Cls = "V" | "K" | "E" | "O";
  const face: Record<Cls, string> = { V: pick(r, ["A", "E", "I", "O", "U"]), K: pick(r, ["B", "D", "K", "M", "R", "T"]), E: String(pick(r, [2, 4, 6, 8])), O: String(pick(r, [3, 5, 7, 9])) };
  const name: Record<Cls, [string, string]> = { V: ["ein Vokal", "a vowel"], K: ["ein Konsonant", "a consonant"], E: ["eine gerade Zahl", "an even number"], O: ["eine ungerade Zahl", "an odd number"] };
  const letters: Cls[] = ["V", "K"], numbers: Cls[] = ["E", "O"];
  const pairs: [Cls, Cls][] = [["V", "E"], ["K", "O"], ["E", "V"], ["O", "K"], ...(d >= 4 ? ([["V", "O"], ["K", "E"], ["E", "K"], ["O", "V"]] as [Cls, Cls][]) : [])];
  const [ante, cons] = pick(r, pairs);
  // a card must be turned when something on its back could break the claim
  const breaks = (a: Cls, b: Cls) => (a === ante && b !== cons) || (b === ante && a !== cons);
  const table = shuffle<Cls>(["V", "K", "E", "O"], r);
  const must = table.filter((c) => (letters.includes(c) ? numbers : letters).some((back) => breaks(c, back)));
  const L = de ? 0 : 1, and = de ? " und " : " and ";
  const list = (cs: Cls[]) => table.filter((c) => cs.includes(c)).map((c) => face[c]).join(and);
  const answer = list(must);
  const wrong = [de ? `nur ${face[ante]}` : `only ${face[ante]}`, list([ante, cons]), de ? "alle vier Karten" : "all four cards"];
  const [other] = must.filter((c) => c !== ante), idle = table.filter((c) => !must.includes(c));
  return {
    question: de
      ? `Vier Karten liegen auf dem Tisch. Jede hat auf einer Seite einen Buchstaben und auf der anderen eine Zahl. Du siehst: ${table.map((c) => face[c]).join(" · ")}\nBehauptung: Wenn auf einer Seite ${name[ante][0]} steht, steht auf der anderen ${name[cons][0]}.\nWelche Karten musst du mindestens umdrehen, um die Behauptung zu prüfen?`
      : `Four cards lie on the table. Each has a letter on one side and a number on the other. You see: ${table.map((c) => face[c]).join(" · ")}\nClaim: If one side shows ${name[ante][1]}, the other side shows ${name[cons][1]}.\nWhich cards must you turn over, at the least, to test the claim?`,
    ...textChoices(answer, wrong, r),
    explanation: de
      ? `Falsch wäre die Behauptung nur, wenn auf einer Karte ${name[ante][L]} und ${name[other][L]} stehen. Hinter ${face[ante]} könnte ${name[other][L]} stehen, hinter ${face[other]} ${name[ante][L]} – diese beiden musst du prüfen. ${idle.map((c) => face[c]).join(and)} können die Behauptung nicht widerlegen, egal was auf der Rückseite steht. Richtig: ${answer}`
      : `The claim would only be false if a card shows ${name[ante][L]} and ${name[other][L]}. Behind ${face[ante]} there could be ${name[other][L]}, behind ${face[other]} ${name[ante][L]} – these two must be checked. ${idle.map((c) => face[c]).join(and)} cannot disprove the claim, whatever is on the back. Right: ${answer}`,
  };
}

const conditional: Make = (r, d, de) => {
  if (d >= 2 && r() < 0.25) return cards(r, d, de);
  const scene = pick(r, SCENES);
  const m = d <= 3 ? 2 : d === 4 ? 3 : pick(r, [3, 4]);
  const A = shuffle(scene.atoms, r).slice(0, m);
  const worlds = range(2 ** m).map((x) => range(m).map((i) => !!(x & (1 << i))));
  const kinds = d <= 2 ? ["if"] : d === 3 ? ["if", "if", "onlyIf", "iff"] : d === 4 ? ["if", "if", "onlyIf", "or", "nand"] : ["if", "if", "onlyIf", "iff", "or", "nand"];
  const rule = (type: string, a: number, b: number, va: boolean, vb: boolean): Rule => {
    const rest = tail(A[a]);
    if (type === "onlyIf") return { type, atoms: [a, b], holds: (w) => !w[a] || w[b], de: `${cap(A[a].de[0])} ${A[a].de[1]} nur${rest}, wenn ${subDe(A[b], true)}.`, en: `${cap(plainEn(A[a], true))} only if ${plainEn(A[b], true)}.` };
    if (type === "iff") return { type, atoms: [a, b], holds: (w) => w[a] === w[b], de: `${cap(A[a].de[0])} ${A[a].de[1]} genau dann${rest}, wenn ${subDe(A[b], true)}.`, en: `${cap(plainEn(A[a], true))} exactly when ${plainEn(A[b], true)}.` };
    if (type === "or") return { type, atoms: [a, b], holds: (w) => w[a] || w[b], de: `Mindestens eines stimmt immer: ${cap(plainDe(A[a], true))}, oder ${plainDe(A[b], true)}.`, en: `At least one of these is always true: ${plainEn(A[a], true)}, or ${plainEn(A[b], true)}.` };
    if (type === "nand") return { type, atoms: [a, b], holds: (w) => !(w[a] && w[b]), de: `Nie stimmt beides zugleich: ${cap(plainDe(A[a], true))}, und ${plainDe(A[b], true)}.`, en: `These are never both true at once: ${plainEn(A[a], true)}, and ${plainEn(A[b], true)}.` };
    return { type: "if", atoms: [a, b], holds: (w) => w[a] !== va || w[b] === vb, de: `Wenn ${subDe(A[a], va)}, ${invDe(A[b], vb)}.`, en: `If ${plainEn(A[a], va)}, ${plainEn(A[b], vb)}.` };
  };
  // 0 = it holds, 1 = it does not hold, 2 = both possible, 3 = contradiction (step 5 only)
  const target = pick(r, d === 1 ? [0, 2] : d === 5 ? [0, 1, 2, 2, 3] : [0, 1, 2]);
  type Task = { rules: Rule[]; obs: { a: number; v: boolean }[]; x: number; result: number; models: boolean[][] };
  let task: Task | null = null;
  for (let attempt = 0; !task || (task.result !== target && attempt < 400); attempt++) {
    // the rules link the atoms in a chain, in a random order, so every atom is tied to the others
    const order = shuffle(range(m), r);
    const rules = range(m - 1).map((k) => {
      const [a, b] = r() < 0.5 ? [order[k], order[k + 1]] : [order[k + 1], order[k]];
      return rule(pick(r, kinds), a, b, d >= 4 ? r() < 0.75 : true, d >= 3 ? r() < 0.7 : true);
    });
    const seen = shuffle(range(m), r);
    const obs = seen.slice(0, d === 5 && m > 2 && r() < 0.4 ? 2 : 1).map((a) => ({ a, v: d === 1 ? true : r() < 0.5 }));
    const x = pick(r, seen.slice(obs.length));
    const lawful = worlds.filter((w) => rules.every((q) => q.holds(w)));
    const models = lawful.filter((w) => obs.every((o) => w[o.a] === o.v));
    const verdict = (ws: boolean[][]) => (!ws.length ? 3 : ws.every((w) => w[x]) ? 0 : ws.every((w) => !w[x]) ? 1 : 2);
    const result = verdict(models);
    if (verdict(lawful) !== 2) continue; // the rules alone must leave the question open
    if (result === 3 && d < 5) continue;
    // each observation must be possible on its own (a contradiction should come from the combination)
    if (obs.some((o) => !lawful.some((w) => w[o.a] === o.v))) continue;
    task = { rules, obs, x, result, models };
  }
  const { rules, obs, x, result, models } = task!;
  const L = de ? 0 : 1, plain = (a: Atom, v: boolean) => (de ? plainDe(a, v) : plainEn(a, v));
  const options = [`${cap(plain(A[x], true))}.`, `${cap(plain(A[x], false))}.`, BOTH[L], CONTRADICTION[L][rules.length > 1 ? 1 : 0]];
  const saw = obs.map((o) => plain(A[o.a], o.v));
  const describe = (w: boolean[]) => range(m).map((i) => plain(A[i], w[i])).join(", ");
  const oneWay = rules.length === 1 && (rules[0].type === "if" || rules[0].type === "onlyIf");
  const why = result === 3
    ? (de ? "Keine Lage erfüllt die Regeln und die Beobachtung zugleich." : "No situation fits the rules and the observation at once.")
    : (de ? `${models.length === 1 ? "Dazu passt nur eine Lage" : `Dazu passen ${models.length} Lagen`}: ${models.map(describe).join(" – oder: ")}. ` : `${models.length === 1 ? "Only one situation fits" : `${models.length} situations fit`}: ${models.map(describe).join(" – or: ")}. `)
      + (result === 2
        ? (de ? `Einmal gilt „${plain(A[x], true)}“, einmal nicht.${oneWay ? " Die Regel gilt nur in eine Richtung." : ""}` : `In one, “${plain(A[x], true)}” holds, in another it does not.${oneWay ? " The rule only works in one direction." : ""}`)
        : (de ? `${models.length > 1 ? "In jeder davon gilt" : "Also gilt"}: ${plain(A[x], result === 0)}.` : `${models.length > 1 ? "In each of them" : "So"}: ${plain(A[x], result === 0)}.`));
  return {
    question: de
      ? `${scene.de}\n${rules.map((q, i) => (rules.length > 1 ? `(${i + 1}) ${q.de}` : q.de)).join("\n")}\nDu siehst: ${cap(saw.join(", und "))}.\nWas folgt daraus sicher?`
      : `${scene.en}\n${rules.map((q, i) => (rules.length > 1 ? `(${i + 1}) ${q.en}` : q.en)).join("\n")}\nYou see: ${saw.join(", and ")}.\nWhat follows for certain?`,
    options, correct: result,
    explanation: `${why} ${de ? "Richtig:" : "Right:"} ${options[result]}`,
  };
};

// ---------------------------------------------------------------- scales
export const SYMBOLS = ["●", "▲", "■", "◆"];
type Side = number[]; // how many of each symbol
const weigh = (s: Side, w: number[]) => s.reduce((sum, k, i) => sum + k * w[i], 0);
const draw = (s: Side) => s.flatMap((k, i) => (k > 5 ? [`${k} × ${SYMBOLS[i]}`] : Array<string>(k).fill(SYMBOLS[i]))).join(" ");
const gcdAll = (list: number[]) => list.reduce((a, b) => { while (b) [a, b] = [b, a % b]; return a; });
/** Rank of a small whole-number matrix (elimination without fractions). */
export function rank(rows: number[][]): number {
  const m = rows.map((row) => [...row]);
  let rk = 0;
  for (let c = 0; c < (m[0]?.length ?? 0) && rk < m.length; c++) {
    const p = m.findIndex((row, i) => i >= rk && row[c] !== 0);
    if (p < 0) continue;
    [m[rk], m[p]] = [m[p], m[rk]];
    for (let i = rk + 1; i < m.length; i++) {
      const f = m[i][c];
      if (f) { const g = m[rk][c]; m[i] = m[i].map((v, k) => v * g - m[rk][k] * f); const q = gcdAll(m[i].map(Math.abs)) || 1; m[i] = m[i].map((v) => v / q); }
    }
    rk++;
  }
  return rk;
}
export const HEAVIER = [["Beide sind gleich schwer", "Das lässt sich nicht sagen"], ["Both weigh the same", "That cannot be said"]];

const scales: Make = (r, d, de, locale) => {
  const m = d === 1 ? 2 : d === 5 ? 4 : 3;
  const L = de ? 0 : 1;
  const sides = (limit: number, skip: number[] = []) => {
    // every way to put up to `limit` symbols on one side, leaving out the kinds in `skip`
    let list: Side[] = [[]];
    for (const i of range(m)) list = list.flatMap((s) => range(skip.includes(i) ? 1 : limit + 1).map((k) => [...s, k]));
    return list.filter((s) => { const t = s.reduce((a, b) => a + b, 0); return t >= 1 && t <= limit; });
  };
  const row = (a: Side, b: Side) => a.map((k, i) => k - b[i]);
  for (let attempt = 0; ; attempt++) {
    // hidden weights without a common factor
    let w = shuffle(range(d <= 2 ? 6 : 9).map((k) => k + 1), r).slice(0, m);
    if (d <= 2) w = d === 1 ? shuffle([1, int(r, 2, 4)], r) : (() => { const a = int(r, 2, 3), b = int(r, 2, 3); return shuffle([1, a, a * b], r); })();
    if (gcdAll(w) !== 1) continue;
    const under = d === 5 && r() < 0.15; // one scale too few: the question cannot be answered
    const need = under ? m - 2 : m - 1;
    const eqs: [Side, Side][] = [];
    for (let tries = 0; tries < 60 && eqs.length < need; tries++) {
      const left = pick(r, sides(d <= 2 ? 2 : 3));
      const used = range(m).filter((i) => left[i] > 0);
      if (d <= 2 && used.length > 1) continue; // easy steps: one kind of symbol per side
      const fitting = sides(6, used).filter((s) => weigh(s, w) === weigh(left, w) && (d > 2 || s.filter(Boolean).length === 1));
      if (!fitting.length) continue;
      const right = pick(r, fitting);
      if (rank([...eqs.map(([a, b]) => row(a, b)), row(left, right)]) > eqs.length) eqs.push(r() < 0.5 ? [left, right] : [right, left]);
    }
    if (eqs.length < need) continue;
    const E = eqs.map(([a, b]) => row(a, b));
    // what one scale alone already says (with a single scale: only exactly what it shows) – that would be no puzzle
    const given = (a: Side, b: Side) => { const q = row(a, b); return d === 1 ? E.some((e) => e.every((v, i) => v === q[i]) || e.every((v, i) => v === -q[i])) : E.some((e) => rank([e, q]) < 2); };
    const shown = `${de ? (eqs.length > 1 ? "Alle Waagen sind im Gleichgewicht:" : "Die Waage ist im Gleichgewicht:") : eqs.length > 1 ? "All the scales are balanced:" : "The scales are balanced:"}\n${eqs.map(([a, b]) => `${draw(a)} = ${draw(b)}`).join("\n")}`;
    const fitText = `${range(m).map((i) => `${SYMBOLS[i]} = ${w[i]}`).join(", ")}`;
    if (d >= 4 && (under || r() < 0.5)) {
      // which side is heavier?
      const a = pick(r, sides(3)), b = pick(r, sides(3, range(m).filter((i) => a[i] > 0)));
      if (!b || given(a, b)) continue;
      const [wa, wb] = [weigh(a, w), weigh(b, w)];
      const options = [draw(a), draw(b), HEAVIER[L][0], HEAVIER[L][1]];
      const ask = `${shown}\n${de ? `Was ist schwerer: ${draw(a)} oder ${draw(b)}?` : `Which is heavier: ${draw(a)} or ${draw(b)}?`}`;
      if (under) {
        // other weights that fit every scale but turn the comparison round
        let other: number[] | null = null;
        for (const v of shuffle(range(10 ** m), r).slice(0, 4000)) {
          const u = range(m).map((i) => (Math.floor(v / 10 ** i) % 10) + 1);
          if (E.every((e) => weigh(e, u) === 0) && Math.sign(weigh(a, u) - weigh(b, u)) !== Math.sign(wa - wb)) { other = u; break; }
        }
        if (!other) continue;
        const say = (u: number[]) => { const x = weigh(a, u), y = weigh(b, u); return `${range(m).map((i) => `${SYMBOLS[i]} = ${u[i]}`).join(", ")} (${x} ${x > y ? ">" : x < y ? "<" : "="} ${y})`; };
        return { question: ask, options, correct: 3, explanation: de ? `Die Waagen legen die Gewichte nicht fest. Es passt zum Beispiel ${say(w)} – aber auch ${say(other)}. Also: ${HEAVIER[0][1]}.` : `The scales do not settle the weights. For example ${say(w)} fits – but so does ${say(other)}. So: ${HEAVIER[1][1]}.` };
      }
      const correct = wa > wb ? 0 : wb > wa ? 1 : 2;
      return { question: ask, options, correct, explanation: de ? `Dazu passt zum Beispiel ${fitText} (und nur Vielfache davon). ${draw(a)} wiegt dann ${wa}, ${draw(b)} wiegt ${wb}. Also: ${options[correct]}.` : `For example ${fitText} fits (and only multiples of it). ${draw(a)} then weighs ${wa}, ${draw(b)} weighs ${wb}. So: ${options[correct]}.` };
    }
    if (under) continue;
    // how many of one symbol weigh as much as …?
    const u = int(r, 0, m - 1);
    const asks = sides(d <= 2 ? 3 : 2, [u]).filter((s) => weigh(s, w) % w[u] === 0 && weigh(s, w) / w[u] >= 2 && weigh(s, w) / w[u] <= 18 && !given(s, range(m).map((i) => (i === u ? weigh(s, w) / w[u] : 0))) && (d > 2 || s.filter(Boolean).length === 1));
    if (!asks.length) continue;
    const c = pick(r, asks), k = weigh(c, w) / w[u];
    return {
      question: `${shown}\n${de ? `Wie viele ${SYMBOLS[u]} wiegen so viel wie ${draw(c)}?` : `How many ${SYMBOLS[u]} weigh as much as ${draw(c)}?`}`,
      ...choices(k, [k + 1, k - 1, k * 2, k + 2, Math.round(k / 2)], r, (v) => fmt(v, locale)),
      explanation: de ? `Dazu passt zum Beispiel ${fitText} (und nur Vielfache davon). ${draw(c)} wiegt dann ${weigh(c, w)} – so viel wie ${fmt(k, locale)} × ${SYMBOLS[u]}.` : `For example ${fitText} fits (and only multiples of it). ${draw(c)} then weighs ${weigh(c, w)} – as much as ${fmt(k, locale)} × ${SYMBOLS[u]}.`,
    };
  }
};

// ---------------------------------------------------------------- family ties
type RelKind = "parent" | "sibling" | "child" | "spouse";
interface RelWord { kind: RelKind; f: boolean; de: [string, string, string]; en: string } // de: nominative, genitive, bare
const RELS: RelWord[] = [
  { kind: "parent", f: true, de: ["die Mutter", "der Mutter", "Mutter"], en: "mother" },
  { kind: "parent", f: false, de: ["der Vater", "des Vaters", "Vater"], en: "father" },
  { kind: "sibling", f: true, de: ["die Schwester", "der Schwester", "Schwester"], en: "sister" },
  { kind: "sibling", f: false, de: ["der Bruder", "des Bruders", "Bruder"], en: "brother" },
  { kind: "child", f: true, de: ["die Tochter", "der Tochter", "Tochter"], en: "daughter" },
  { kind: "child", f: false, de: ["der Sohn", "des Sohnes", "Sohn"], en: "son" },
  { kind: "spouse", f: true, de: ["die Ehefrau", "der Ehefrau", "Ehefrau"], en: "wife" },
  { kind: "spouse", f: false, de: ["der Ehemann", "des Ehemanns", "Ehemann"], en: "husband" },
];
export type Kin = "parent" | "grandparent" | "greatgrandparent" | "sibling" | "aunt" | "greataunt" | "child" | "grandchild" | "greatgrandchild" | "niece" | "greatniece" | "cousin" | "spouse" | "parentInLaw" | "siblingInLaw" | "childInLaw";
// only steps whose result has one clear name: up the line (parents, their siblings), down (children), and marriage at the ends
const NEXT: Partial<Record<Kin | "self", Partial<Record<RelKind, Kin>>>> = {
  self: { parent: "parent", sibling: "sibling", child: "child", spouse: "spouse" },
  parent: { parent: "grandparent", sibling: "aunt" },
  grandparent: { parent: "greatgrandparent", sibling: "greataunt" },
  sibling: { child: "niece", spouse: "siblingInLaw" },
  aunt: { child: "cousin" },
  child: { child: "grandchild", spouse: "childInLaw" },
  grandchild: { child: "greatgrandchild" },
  niece: { child: "greatniece" },
  spouse: { parent: "parentInLaw", sibling: "siblingInLaw" },
};
const BACK: Record<Kin, Kin> = { parent: "child", child: "parent", grandparent: "grandchild", grandchild: "grandparent", greatgrandparent: "greatgrandchild", greatgrandchild: "greatgrandparent", sibling: "sibling", aunt: "niece", niece: "aunt", greataunt: "greatniece", greatniece: "greataunt", cousin: "cousin", spouse: "spouse", parentInLaw: "childInLaw", childInLaw: "parentInLaw", siblingInLaw: "siblingInLaw" };
export const KIN: Record<Kin, { de: [string, string]; en: [string, string] }> = { // [female, male]
  parent: { de: ["Mutter", "Vater"], en: ["mother", "father"] },
  grandparent: { de: ["Großmutter", "Großvater"], en: ["grandmother", "grandfather"] },
  greatgrandparent: { de: ["Urgroßmutter", "Urgroßvater"], en: ["great-grandmother", "great-grandfather"] },
  sibling: { de: ["Schwester", "Bruder"], en: ["sister", "brother"] },
  aunt: { de: ["Tante", "Onkel"], en: ["aunt", "uncle"] },
  greataunt: { de: ["Großtante", "Großonkel"], en: ["great-aunt", "great-uncle"] },
  child: { de: ["Tochter", "Sohn"], en: ["daughter", "son"] },
  grandchild: { de: ["Enkelin", "Enkel"], en: ["granddaughter", "grandson"] },
  greatgrandchild: { de: ["Urenkelin", "Urenkel"], en: ["great-granddaughter", "great-grandson"] },
  niece: { de: ["Nichte", "Neffe"], en: ["niece", "nephew"] },
  greatniece: { de: ["Großnichte", "Großneffe"], en: ["great-niece", "great-nephew"] },
  cousin: { de: ["Cousine", "Cousin"], en: ["cousin", "cousin"] },
  spouse: { de: ["Ehefrau", "Ehemann"], en: ["wife", "husband"] },
  parentInLaw: { de: ["Schwiegermutter", "Schwiegervater"], en: ["mother-in-law", "father-in-law"] },
  siblingInLaw: { de: ["Schwägerin", "Schwager"], en: ["sister-in-law", "brother-in-law"] },
  childInLaw: { de: ["Schwiegertochter", "Schwiegersohn"], en: ["daughter-in-law", "son-in-law"] },
};
const WOMEN = ["Anna", "Clara", "Mia", "Lea", "Emma"], MEN = ["Ben", "David", "Emil", "Paul", "Tom"];
/** Every chain of `len` steps that ends on someone with a clear name. */
function chains(len: number, from: Kin | "self" = "self"): { kinds: RelKind[]; ends: Kin[] }[] {
  if (len === 0) return [{ kinds: [], ends: [] }];
  return (Object.entries(NEXT[from] ?? {}) as [RelKind, Kin][]).flatMap(([kind, to]) => chains(len - 1, to).map((c) => ({ kinds: [kind, ...c.kinds], ends: [to, ...c.ends] })));
}

const family: Make = (r, d, de) => {
  const len = d <= 2 ? 2 : d === 3 ? pick(r, [2, 3]) : 3;
  const simple: Kin[] = ["grandparent", "aunt", "grandchild", "niece"];
  const chain = pick(r, chains(len).filter((c) => d > 1 || simple.includes(c.ends[len - 1])));
  const words = chain.kinds.map((kind) => pick(r, RELS.filter((w) => w.kind === kind)));
  const reverse = d >= 3 && (len === 2 || r() < (d === 5 ? 0.5 : 0.3)); // asked the other way round
  const apart = d === 5 || (d === 4 && r() < 0.5); // one sentence per step instead of one nested sentence
  const bFemale = r() < 0.5;
  const women = shuffle(WOMEN, r), men = shuffle(MEN, r);
  const B = (bFemale ? women : men).pop()!;
  const people = words.map((w) => (w.f ? women : men).pop()!); // people[k]: the person after step k; the last one is asked about
  const A = people[len - 1];
  const L = de ? "de" : "en";
  const term = (k: Kin, female: boolean) => KIN[k][L][female ? 0 : 1];
  const end = chain.ends[len - 1];
  const answer = reverse ? term(BACK[end], bFemale) : term(end, words[len - 1].f);
  const female = reverse ? bFemale : words[len - 1].f;
  const wrong = shuffle((Object.keys(KIN) as Kin[]).map((k) => term(k, female)).filter((t) => t !== answer), r);
  const dat = (t: string) => (t === "Neffe" ? "Neffen" : t);
  let story: string;
  if (apart) {
    const lines = words.map((w, k) => { const [who, of] = [people[k], k ? people[k - 1] : B]; return de ? `${who} ist ${w.de[0]} von ${of}.` : `${who} is ${of}'s ${w.en}.`; });
    story = (d === 5 ? shuffle(lines, r) : lines).join(" ");
  } else {
    story = de
      ? `${A} ist ${words[len - 1].de[0]}${len === 3 ? ` ${words[1].de[1]}` : ""} von ${B}s ${words[0].de[2]}.`
      : `${A} is the ${words[len - 1].en}${len === 3 ? ` of the ${words[1].en}` : ""} of ${B}'s ${words[0].en}.`;
  }
  // step by step: the mother of Mia's father is Mia's grandmother …
  const steps: string[] = [];
  let prev = de ? words[0].de[2] : words[0].en; // what the person before is to B
  for (let k = 1; k < len; k++) {
    const now = term(chain.ends[k], words[k].f);
    steps.push(de ? `${cap(words[k].de[0])} von ${B}s ${dat(prev)} ist ${B}s ${now}.` : `The ${words[k].en} of ${B}'s ${prev} is ${B}'s ${now}.`);
    prev = now;
  }
  const turn = reverse ? (de ? ` Umgekehrt ist ${B} dann ${A}s ${answer}.` : ` The other way round, ${B} is ${A}'s ${answer}.`) : "";
  return {
    question: `${story}\n${de ? `Was ist ${reverse ? B : A} für ${reverse ? A : B}?` : `What is ${reverse ? B : A} to ${reverse ? A : B}?`}`,
    ...textChoices(answer, wrong, r),
    explanation: `${steps.join(" ")}${turn}`,
  };
};

export const BRAIN = { code, zebra, conditional, scales, family };
