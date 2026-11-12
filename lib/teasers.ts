// Brain teasers as exercises – small problems that need a plan, a picture in the head or a pattern. All generated from
// a seed and worked out here, so every answer is checked:
//  - jugs: measuring an amount with two buckets in as few steps as possible (found by trying every sequence of steps);
//  - cube: tipping a die over its edges – which number ends up where;
//  - nim: the matchstick game – how many to take first to be sure to win (worked out backwards from the end);
//  - directions: turning and walking by the compass – where you look, how far from the start you are;
//  - letters: letter sequences, secret writing, word values;
//  - oddone: five numbers, four share a property – only shown when no other reading singles out a different number;
//  - crypt: letter sums ("AB + BA = CAC") from a table of sums that have exactly one solution.
// Five steps each (lib/skill.ts). tests/teasers.test.ts works every answer out again from the German text.
import type { Step } from "./skill";
import { choices, fmt, gcd, int, pick, textChoices, type Make } from "./exercises";
import { cap, range, shuffle } from "./brain";

// ---------------------------------------------------------------- two buckets
export const NOT_POSSIBLE = ["Das geht gar nicht.", "It cannot be done."];
/** The shortest way to get exactly t litres into one of two buckets (sizes A and B): the state after each step, or null. */
export function pourPath(A: number, B: number, t: number): { x: number; y: number; move: number }[] | null {
  const key = (x: number, y: number) => x * (B + 1) + y;
  const from = new Map<number, { prev: number; move: number }>([[0, { prev: -1, move: -1 }]]);
  let layer: [number, number][] = [[0, 0]];
  while (layer.length) {
    const next: [number, number][] = [];
    for (const [x, y] of layer) {
      if (x === t || y === t) {
        const path: { x: number; y: number; move: number }[] = [];
        for (let k = key(x, y); from.get(k)!.prev >= 0; k = from.get(k)!.prev) path.unshift({ x: Math.floor(k / (B + 1)), y: k % (B + 1), move: from.get(k)!.move });
        return path;
      }
      const ab = Math.min(x, B - y), ba = Math.min(y, A - x);
      // 0 fill A · 1 fill B · 2 empty A · 3 empty B · 4 pour A into B · 5 pour B into A
      ([[A, y], [x, B], [0, y], [x, 0], [x - ab, y + ab], [x + ba, y - ba]] as [number, number][]).forEach(([nx, ny], move) => {
        if (from.has(key(nx, ny))) return;
        from.set(key(nx, ny), { prev: key(x, y), move });
        next.push([nx, ny]);
      });
    }
    layer = next;
  }
  return null;
}

const jugs: Make = (r, d, de, locale) => {
  const [lo, hi] = [[2, 3], [3, 4], [4, 5], [5, 7], [7, 9]][d - 1]; // how many steps the shortest way takes
  const impossible = d >= 4 && r() < 0.2;
  const L = de ? 0 : 1;
  for (;;) {
    const A = int(r, 2, d <= 2 ? 7 : 11), B = int(r, A + 1, d <= 2 ? 9 : 13), t = int(r, 1, B - 1);
    if (t === A) continue;
    const path = pourPath(A, B, t);
    if (impossible ? path !== null : !path || path.length < lo || path.length > hi) continue;
    const question = de
      ? `Du hast einen ${A}-Liter-Eimer und einen ${B}-Liter-Eimer, beide leer und ohne Markierungen, dazu einen Brunnen. Ein Schritt ist: einen Eimer am Brunnen füllen, einen Eimer ausleeren oder von einem Eimer in den anderen gießen, bis der eine leer oder der andere voll ist.\nWie viele Schritte brauchst du mindestens, bis in einem Eimer genau ${t} Liter ${t === 1 ? "ist" : "sind"}?`
      : `You have a ${A}-litre bucket and a ${B}-litre bucket, both empty and unmarked, and a well. One step is: fill a bucket at the well, empty a bucket, or pour from one bucket into the other until one is empty or the other is full.\nWhat is the smallest number of steps until one bucket holds exactly ${t} litre${t === 1 ? "" : "s"}?`;
    const n = path ? path.length : int(r, 4, 9);
    // from step 4 "it cannot be done" is always among the options
    const numbers = d >= 4 ? [n, ...shuffle([n - 2, n - 1, n + 1, n + 2].filter((v) => v > 0), r).slice(0, 2)].sort((a, b) => a - b) : [];
    const c = d >= 4 ? { options: [...numbers.map((v) => fmt(v, locale)), NOT_POSSIBLE[L]], correct: path ? numbers.indexOf(n) : 3 } : choices(n, [n + 1, n - 1, n + 2, n - 2], r, (v) => fmt(v, locale));
    if (!path) {
      const g = gcd(A, B);
      return { question, ...c, explanation: de ? `Füllen, Leeren und Umgießen ergeben immer nur Vielfache von ${g} Litern (${g} ist der größte gemeinsame Teiler von ${A} und ${B}). ${t} Liter ${t === 1 ? "gehört" : "gehören"} nicht dazu. Also: ${NOT_POSSIBLE[0]}` : `Filling, emptying and pouring only ever give multiples of ${g} litres (${g} is the greatest common divisor of ${A} and ${B}). ${t} litre${t === 1 ? " is" : "s are"} not one of them. So: ${NOT_POSSIBLE[1]}` };
    }
    const MOVES = de
      ? [`${A}-Liter-Eimer füllen`, `${B}-Liter-Eimer füllen`, `${A}-Liter-Eimer leeren`, `${B}-Liter-Eimer leeren`, `vom ${A}-Liter- in den ${B}-Liter-Eimer gießen`, `vom ${B}-Liter- in den ${A}-Liter-Eimer gießen`]
      : [`fill the ${A}-litre bucket`, `fill the ${B}-litre bucket`, `empty the ${A}-litre bucket`, `empty the ${B}-litre bucket`, `pour from the ${A}-litre into the ${B}-litre bucket`, `pour from the ${B}-litre into the ${A}-litre bucket`];
    const way = path.map((s) => `${MOVES[s.move]} (${s.x} | ${s.y})`).join(" → ");
    return { question, ...c, explanation: de ? `So geht es in ${fmt(n, locale)} Schritten – in Klammern der Stand (${A}-Liter-Eimer | ${B}-Liter-Eimer): ${way}. Schneller geht es nicht.` : `This takes ${fmt(n, locale)} steps – in brackets the contents (${A}-litre bucket | ${B}-litre bucket): ${way}. There is no quicker way.` };
  }
};

// ---------------------------------------------------------------- tipping a die
export interface Die { top: number; front: number; right: number }
/** The die after tipping it over an edge: 0 to the right, 1 to the left, 2 towards the viewer, 3 away from the viewer. */
export const tip = (d: Die, move: number): Die =>
  move === 0 ? { top: 7 - d.right, front: d.front, right: d.top } // the left side comes up
  : move === 1 ? { top: d.right, front: d.front, right: 7 - d.top }
  : move === 2 ? { top: 7 - d.front, front: d.top, right: d.right } // the back comes up
  : { top: d.front, front: 7 - d.top, right: d.right };
const FACES = [["oben", "on top"], ["vorne", "at the front"], ["rechts", "on the right"], ["unten", "underneath"], ["hinten", "at the back"], ["links", "on the left"]];
const TIPS = [["nach rechts", "to the right"], ["nach links", "to the left"], ["nach vorne (zu dir hin)", "towards you"], ["nach hinten (von dir weg)", "away from you"]];
const faceOf = (d: Die, f: number) => [d.top, d.front, d.right, 7 - d.top, 7 - d.front, 7 - d.right][f];

const cube: Make = (r, d, de) => {
  const L = de ? 0 : 1;
  const top = int(r, 1, 6), front = pick(r, range(6).map((k) => k + 1).filter((v) => v !== top && v !== 7 - top));
  const right = pick(r, range(6).map((k) => k + 1).filter((v) => ![top, 7 - top, front, 7 - front].includes(v)));
  const start: Die = { top, front, right };
  const moves: number[] = [];
  while (moves.length < d) {
    const m = int(r, 0, 3), last = moves[moves.length - 1];
    if (last !== undefined && (m ^ 1) === last) continue; // not straight back again
    moves.push(m);
  }
  const states = moves.reduce<Die[]>((list, m) => [...list, tip(list[list.length - 1], m)], [start]);
  const end = states[states.length - 1];
  const face = d <= 3 ? 0 : d === 4 ? pick(r, [0, 1]) : int(r, 0, 5);
  const answer = faceOf(end, face);
  const wrong = [7 - answer, ...shuffle(range(6).map((k) => k + 1).filter((v) => v !== answer && v !== 7 - answer), r)];
  const say = (s: Die) => (de ? `oben ${s.top}, vorne ${s.front}, rechts ${s.right}` : `${s.top} on top, ${s.front} at the front, ${s.right} on the right`);
  const list = moves.length === 1 ? `${de ? "einmal" : "once"} ${TIPS[moves[0]][L]}` : moves.map((m, i) => `${i === 0 ? (de ? "erst" : "first") : de ? "dann" : "then"} ${TIPS[m][L]}`).join(", ");
  const hidden = face >= 3 ? (de ? ` ${cap(FACES[face][0])} liegt die Seite gegenüber von ${FACES[face - 3][0]}: 7 − ${faceOf(end, face - 3)} = ${answer}.` : ` The face ${FACES[face][1]} is opposite the one ${FACES[face - 3][1]}: 7 − ${faceOf(end, face - 3)} = ${answer}.`) : "";
  return {
    question: de
      ? `Bei einem Spielwürfel ergeben gegenüberliegende Seiten zusammen immer 7. Er liegt so vor dir: oben die ${top}, vorne (zu dir) die ${front}, rechts die ${right}.\nDu kippst ihn ${list} über die Kante. Welche Zahl ist danach ${FACES[face][0]}?`
      : `On a die, opposite faces always add up to 7. It lies in front of you like this: ${top} on top, ${front} at the front (facing you), ${right} on the right.\nYou tip it over its edge ${list}. Which number is ${FACES[face][1]} afterwards?`,
    ...textChoices(String(answer), wrong.map(String), r),
    explanation: `${moves.map((m, i) => `${cap(TIPS[m][L])}: ${say(states[i + 1])}`).join(" → ")}.${hidden}${face < 3 ? (de ? ` ${cap(FACES[face][0])} ist danach die ${answer}.` : ` The number ${FACES[face][1]} is then ${answer}.`) : ""}`,
  };
};

// ---------------------------------------------------------------- the matchstick game
export const NO_WIN = ["Egal wie viele – gegen perfektes Spiel verlierst du.", "It makes no difference – against perfect play you lose."];
/** win[k]: can whoever is to move with k matches left force a win? */
export function nimWins(n: number, moves: number[], lastWins: boolean): boolean[] {
  const win = [!lastWins]; // nothing left: the other player took the last match
  for (let k = 1; k <= n; k++) win.push(moves.some((m) => m <= k && !win[k - m]));
  return win;
}
const nim: Make = (r, d, de) => {
  const L = de ? 0 : 1;
  for (;;) {
    const upTo = d <= 2 ? 3 : d === 3 ? pick(r, [3, 4]) : pick(r, [4, 5, 6]);
    const set = d === 5 ? pick(r, [[1, 3, 4], [1, 2, 5], [1, 4, 5], [1, 2, 6], [1, 3, 6]]) : range(upTo).map((k) => k + 1);
    const lastWins = d <= 2 || r() < 0.5;
    const n = d === 1 ? int(r, 5, 12) : d === 2 ? int(r, 13, 30) : d === 3 ? int(r, 10, 30) : d === 4 ? int(r, 20, 50) : int(r, 10, 26);
    const win = nimWins(n, set, lastWins);
    const good = set.filter((m) => m <= n && !win[n - m]);
    if (good.length > 1) continue; // exactly one right first move, or none at all
    const numbers = set.length <= 3 ? set : [...new Set([...good, ...shuffle(set.filter((m) => !good.includes(m)), r)])].slice(0, 3).sort((a, b) => a - b);
    const options = [...numbers.map(String), NO_WIN[L]];
    const correct = good.length ? numbers.indexOf(good[0]) : 3;
    const losing = range(n + 1).filter((k) => k > 0 && !win[k]);
    const some = `${losing.slice(0, 7).join(", ")}${losing.length > 7 ? " …" : ""}`;
    const run = d < 5 ? (de ? (lastWins ? ` – immer ein Vielfaches von ${upTo + 1}` : ` – immer 1 mehr als ein Vielfaches von ${upTo + 1}`) : lastWins ? ` – always a multiple of ${upTo + 1}` : ` – always 1 more than a multiple of ${upTo + 1}`) : "";
    const moves = d === 5 ? `${set.slice(0, -1).join(", ")} ${de ? "oder" : "or"} ${set[set.length - 1]}` : `1 ${de ? "bis" : "to"} ${upTo}`;
    const end = good.length
      ? (de ? `Nimm ${good[0]}: Dann bleiben ${n - good[0]}, und die andere Person ist in dieser Lage.` : `Take ${good[0]}: that leaves ${n - good[0]}, and the other player is in that position.`)
      : (de ? `${n} gehört selbst dazu. Also: ${NO_WIN[0]}` : `${n} is one of them. So: ${NO_WIN[1]}`);
    return {
      question: de
        ? `Auf dem Tisch liegen ${n} Streichhölzer. Zwei Personen nehmen abwechselnd ${moves} Hölzer weg. Wer das letzte Holz nimmt, ${lastWins ? "gewinnt" : "verliert"}. Du fängst an.\nWie viele Hölzer nimmst du zuerst, um sicher zu gewinnen?`
        : `There are ${n} matches on the table. Two players take turns removing ${moves} matches. Whoever takes the last match ${lastWins ? "wins" : "loses"}. You go first.\nHow many do you take first to be sure to win?`,
      options, correct,
      explanation: de ? `Wer bei ${some} Hölzern am Zug ist, verliert gegen richtiges Spiel${run}. ${end}` : `Whoever has to move with ${some} matches left loses against correct play${run}. ${end}`,
    };
  }
};

// ---------------------------------------------------------------- by the compass
const WINDS = [["Norden", "north"], ["Nordosten", "north-east"], ["Osten", "east"], ["Südosten", "south-east"], ["Süden", "south"], ["Südwesten", "south-west"], ["Westen", "west"], ["Nordwesten", "north-west"]];
const SIDE = [["nördlich", "north"], ["östlich", "east"], ["südlich", "south"], ["westlich", "west"]];
const DX = [0, 1, 0, -1], DY = [1, 0, -1, 0]; // north, east, south, west
const TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17]];

const directions: Make = (r, d, de, locale) => {
  const L = de ? 0 : 1;
  const wind = (dir: number) => WINDS[dir * 2][L];
  const start = int(r, 0, 3);
  if (d === 1 || (d === 2 && r() < 0.5)) {
    // only turning: where do you look?
    const turns = range(d === 1 ? 2 : int(r, 3, 4)).reduce<number[]>((list) => [...list, pick(r, list[list.length - 1] === 2 ? [1, 3] : [1, 3, 2])], []); // never two half turns in a row
    const words = (t: number) => (de ? (t === 2 ? "eine halbe Drehung" : `eine Vierteldrehung nach ${t === 1 ? "rechts" : "links"}`) : t === 2 ? "a half turn" : `a quarter turn to the ${t === 1 ? "right" : "left"}`);
    const path = turns.reduce<number[]>((list, t) => [...list, (list[list.length - 1] + t) % 4], [start]);
    const end = path[path.length - 1];
    return {
      question: de
        ? `Du schaust nach ${wind(start)}. Du machst ${turns.map(words).join(", dann ")}.\nIn welche Richtung schaust du jetzt?`
        : `You are facing ${wind(start)}. You make ${turns.map(words).join(", then ")}.\nWhich way are you facing now?`,
      options: range(4).map(wind), correct: end,
      explanation: de ? `Rechts herum geht es Norden → Osten → Süden → Westen. Deine Blickrichtungen: ${path.map(wind).join(" → ")}. Am Ende: ${wind(end)}.` : `Turning right goes north → east → south → west. You face: ${path.map(wind).join(" → ")}. In the end: ${wind(end)}.`,
    };
  }
  const km = (v: number) => `${fmt(v, locale)} km`;
  const where = (dx: number, dy: number, unit: string) => [dy ? `${Math.abs(dy)} ${unit} ${SIDE[dy > 0 ? 0 : 2][L]}` : "", dx ? `${Math.abs(dx)} ${unit} ${SIDE[dx > 0 ? 1 : 3][L]}` : ""].filter(Boolean).join(de ? " und " : " and ");
  if (d <= 3) {
    // walking by compass directions: how far from the start?
    let legs: [number, number][], dx: number, dy: number, far: number;
    const side = (start + (r() < 0.5 ? 1 : 3)) % 4;
    if (d === 2) {
      const a = int(r, 2, 9), b = int(r, 2, 9);
      legs = [[start, a], [side, b], [(start + 2) % 4, a]];
      far = b;
    } else {
      const [p, q, h] = pick(r, TRIPLES), extra = int(r, 0, 4);
      legs = [[start, p + extra], [side, q], ...(extra ? ([[(start + 2) % 4, extra]] as [number, number][]) : [])];
      far = h;
    }
    dx = legs.reduce((s, [dir, len]) => s + DX[dir] * len, 0);
    dy = legs.reduce((s, [dir, len]) => s + DY[dir] * len, 0);
    const total = legs.reduce((s, [, len]) => s + len, 0);
    return {
      question: de
        ? `Du gehst ${legs.map(([dir, len]) => `${len} km nach ${wind(dir)}`).join(", dann ")}.\nWie weit bist du jetzt vom Startpunkt entfernt (Luftlinie)?`
        : `You walk ${legs.map(([dir, len]) => `${len} km ${wind(dir)}`).join(", then ")}.\nHow far are you from the starting point now (as the crow flies)?`,
      ...choices(far, [total, Math.abs(dx) + Math.abs(dy), far + 1, far + 2, Math.abs(Math.abs(dx) - Math.abs(dy)), far - 1], r, km),
      explanation: de
        ? `Am Ende bist du ${where(dx, dy, "km")} vom Start.${dx && dy ? ` Luftlinie: √(${Math.abs(dx)}² + ${Math.abs(dy)}²) = √${dx * dx + dy * dy} = ${km(far)}.` : ` Das sind ${km(far)}.`}`
        : `In the end you are ${where(dx, dy, "km")} of the start.${dx && dy ? ` As the crow flies: √(${Math.abs(dx)}² + ${Math.abs(dy)}²) = √${dx * dx + dy * dy} = ${km(far)}.` : ` That is ${km(far)}.`}`,
    };
  }
  // walking with turns: where is the start now?
  for (;;) {
    const count = d === 4 ? int(r, 3, 4) : int(r, 5, 6);
    const lens = range(count).map(() => int(r, 2, 9)), turns = range(count - 1).map(() => (r() < 0.5 ? 1 : 3));
    let dir = start, dx = 0, dy = 0;
    lens.forEach((len, i) => { dx += DX[dir] * len; dy += DY[dir] * len; if (i < count - 1) dir = (dir + turns[i]) % 4; });
    if ((!dx && !dy) || (dx && dy && Math.abs(dx) !== Math.abs(dy))) continue; // the start must lie exactly in one of the eight directions
    // the direction from where you stand back to the start
    const back = dx === 0 ? (dy > 0 ? 4 : 0) : dy === 0 ? (dx > 0 ? 6 : 2) : dx > 0 ? (dy > 0 ? 5 : 7) : dy > 0 ? 3 : 1;
    const walk = lens.map((len, i) => (i === 0 ? (de ? `gehst ${len} Schritte geradeaus` : `walk ${len} steps straight ahead`) : de ? `drehst dich nach ${turns[i - 1] === 1 ? "rechts" : "links"} und gehst ${len} Schritte` : `turn ${turns[i - 1] === 1 ? "right" : "left"} and walk ${len} steps`)).join(", ");
    return {
      question: de
        ? `Du schaust nach ${wind(start)} und ${walk}. Jede Drehung ist eine Vierteldrehung.\nIn welcher Himmelsrichtung liegt der Startpunkt jetzt von dir aus?`
        : `You are facing ${wind(start)} and ${walk}. Every turn is a quarter turn.\nIn which compass direction is the starting point from where you stand now?`,
      ...textChoices(WINDS[back][L], [WINDS[(back + 4) % 8][L], WINDS[(back + 2) % 8][L], WINDS[(back + 6) % 8][L], WINDS[(back + 1) % 8][L]], r),
      explanation: de ? `Am Ende stehst du ${where(dx, dy, "Schritte")} vom Start. Der Startpunkt liegt also in Richtung ${WINDS[back][0]}.` : `In the end you stand ${where(dx, dy, "steps")} of the start. So the starting point lies to the ${WINDS[back][1]}.`,
    };
  }
};

// ---------------------------------------------------------------- letters
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const WORDS: Record<"de" | "en", string[]> = {
  de: ["HUND", "HAUS", "BAUM", "MOND", "BROT", "WALD", "BUCH", "NASE", "ROSE", "BERG", "WOLKE", "STERN", "FISCH", "TISCH", "LAMPE", "BLUME"],
  en: ["TREE", "STAR", "MOON", "FISH", "LAMP", "BOOK", "NOSE", "ROSE", "HILL", "BIRD", "SHIP", "HOUSE", "CLOUD", "BREAD", "TABLE", "RIVER"],
};
/** A word in secret writing: every letter `shift` places on in the alphabet (round the end), or the alphabet turned round. */
export const encode = (word: string, shift: number | "mirror") => [...word].map((ch) => ABC[shift === "mirror" ? 25 - ABC.indexOf(ch) : (ABC.indexOf(ch) + shift + 26) % 26]).join("");

const letters: Make = (r, d, de, locale) => {
  const lang = de ? "de" : "en";
  const kind = d === 2 && r() < 0.35 ? "value" : d >= 3 && r() < 0.35 ? "secret" : "sequence";
  if (kind === "value") {
    const word = pick(r, WORDS[lang]), values = [...word].map((ch) => ABC.indexOf(ch) + 1), sum = values.reduce((a, b) => a + b, 0);
    return {
      question: de ? `Wenn A = 1, B = 2, C = 3 … und Z = 26 ist: Welchen Wert haben die Buchstaben von ${word} zusammen?` : `If A = 1, B = 2, C = 3 … and Z = 26: what do the letters of ${word} add up to?`,
      ...choices(sum, [sum + 1, sum - 1, sum + 10, sum - 10, sum + 2], r, (v) => fmt(v, locale)),
      explanation: `${[...word].map((ch, i) => `${ch} = ${values[i]}`).join(", ")}: ${de ? "zusammen" : "together"} ${fmt(sum, locale)}.`,
    };
  }
  if (kind === "secret") {
    const mirror = d === 5 && r() < 0.5;
    const forward = d === 3 || r() < 0.6;
    const s = d === 3 ? int(r, 1, 3) : d === 4 ? (forward ? int(r, 2, 5) : int(r, 1, 3)) : int(r, 4, 9);
    const shift: number | "mirror" = mirror ? "mirror" : forward ? s : -s;
    const decode = d >= 4 && r() < 0.5;
    const word = pick(r, WORDS[lang]), secret = encode(word, shift);
    const rule = mirror
      ? (de ? "In einer Geheimschrift wird das Alphabet umgedreht: aus A wird Z, aus B wird Y, aus C wird X und so weiter." : "In a secret writing the alphabet is turned round: A becomes Z, B becomes Y, C becomes X and so on.")
      : de
        ? `In einer Geheimschrift rückt jeder Buchstabe im Alphabet um ${s} ${s === 1 ? "Stelle" : "Stellen"} ${forward ? "weiter" : "zurück"} (aus ${forward ? "A" : "Z"} wird ${encode(forward ? "A" : "Z", shift)}; ${forward ? "nach Z geht es mit A weiter" : "vor A kommt wieder Z"}).`
        : `In a secret writing every letter moves ${s} ${s === 1 ? "place" : "places"} ${forward ? "on" : "back"} in the alphabet (${forward ? "A" : "Z"} becomes ${encode(forward ? "A" : "Z", shift)}; ${forward ? "after Z it starts again at A" : "before A comes Z again"}).`;
    const map = [...word].map((ch, i) => `${ch}→${secret[i]}`).join(", ");
    if (decode) {
      const same = shuffle(WORDS[lang].filter((w) => w.length === word.length && w !== word), r);
      return { question: `${rule}\n${de ? `Welches Wort wurde zu ${secret}?` : `Which word became ${secret}?`}`, ...textChoices(word, same, r), explanation: de ? `${word} wird zu ${secret}: ${map}.` : `${word} becomes ${secret}: ${map}.` };
    }
    const off = [...secret]; off[off.length - 1] = encode(off[off.length - 1], 1);
    const wrong = mirror ? [encode(word, 1), [...secret].reverse().join(""), off.join(""), encode(word, 25)] : [encode(word, (shift as number) + 1), encode(word, Math.abs(shift as number) === 1 ? (shift as number) * 3 : (shift as number) - 1), encode(word, -(shift as number)), off.join("")];
    return { question: `${rule}\n${de ? `Wie schreibt man ${word}?` : `How do you write ${word}?`}`, ...textChoices(secret, wrong, r), explanation: de ? `${word} wird zu ${secret}: ${map}.` : `${word} becomes ${secret}: ${map}.` };
  }
  for (;;) {
    const type = pick(r, d === 1 ? ["add"] : d === 2 ? ["add", "sub"] : d === 3 ? ["grow", "alt"] : d === 4 ? ["weave", "updown", "double"] : ["weave2", "grow2"]);
    const a = int(r, 1, 4), b = int(r, 1, 4), k = d === 1 ? int(r, 1, 2) : type === "sub" ? int(r, 1, 3) : int(r, 3, 5);
    const s = int(r, 0, 25);
    let seq: number[] = [], rule = "", ruleEn = "";
    const at = (list: number[]) => list.map((p) => ABC[p] ?? "?").join(", ");
    if (type === "add") { seq = range(5).map((i) => s + i * k); rule = `im Alphabet immer ${k} weiter`; ruleEn = `always ${k} on in the alphabet`; }
    if (type === "sub") { seq = range(5).map((i) => s - i * k); rule = `im Alphabet immer ${k} zurück`; ruleEn = `always ${k} back in the alphabet`; }
    if (type === "grow") { seq = range(6).map((i) => s + (i * (i + 1)) / 2); rule = "die Sprünge werden jedes Mal um 1 größer (+1, +2, +3 …)"; ruleEn = "the jumps grow by 1 each time (+1, +2, +3 …)"; }
    if (type === "alt") { if (a === b) continue; seq = range(6).reduce<number[]>((l, i) => [...l, i ? l[i - 1] + (i % 2 ? a : b) : s], []); rule = `abwechselnd ${a} und ${b} weiter`; ruleEn = `alternately ${a} and ${b} on`; }
    if (type === "updown") { if (a <= b) continue; seq = range(6).reduce<number[]>((l, i) => [...l, i ? l[i - 1] + (i % 2 ? a : -b) : s], []); rule = `abwechselnd ${a} vor und ${b} zurück`; ruleEn = `alternately ${a} on and ${b} back`; }
    if (type === "double") { seq = range(6).map((i) => s + 2 ** i - 1); rule = "die Sprünge verdoppeln sich (+1, +2, +4, +8 …)"; ruleEn = "the jumps double (+1, +2, +4, +8 …)"; }
    if (type === "weave") {
      const e = int(r, 18, 25), f = int(r, 0, 7);
      seq = range(6).map((i) => (i % 2 ? e - (i - 1) / 2 : f + i / 2));
      rule = `zwei Reihen im Wechsel – eine läuft vorwärts (${at([f, f + 1, f + 2])} …), eine rückwärts (${at([e, e - 1, e - 2])} …)`;
      ruleEn = `two sequences taking turns – one runs forwards (${at([f, f + 1, f + 2])} …), one backwards (${at([e, e - 1, e - 2])} …)`;
    }
    if (type === "weave2") {
      const p = int(r, 2, 3), q = int(r, 1, 3), f = int(r, 0, 8), e = int(r, 10, 16);
      if (p === q) continue;
      seq = range(7).map((i) => (i % 2 ? e + ((i - 1) / 2) * q : f + (i / 2) * p));
      rule = `zwei Reihen im Wechsel: ${at([f, f + p, f + 2 * p])} … (immer +${p}) und ${at([e, e + q, e + 2 * q])} … (immer +${q})`;
      ruleEn = `two sequences taking turns: ${at([f, f + p, f + 2 * p])} … (+${p} each time) and ${at([e, e + q, e + 2 * q])} … (+${q} each time)`;
    }
    if (type === "grow2") { seq = range(6).map((i) => s + i * i); rule = "die Sprünge wachsen jedes Mal um 2 (+1, +3, +5, +7 …)"; ruleEn = "the jumps grow by 2 each time (+1, +3, +5, +7 …)"; }
    if (seq.some((p) => p < 0 || p > 25) || new Set(seq).size !== seq.length) continue; // stays inside A–Z, no letter twice
    const answer = seq.pop()!;
    const wrong = shuffle([1, -1, 2, -2, 3, -3].map((x) => answer + x).filter((p) => p >= 0 && p <= 25), r).map((p) => ABC[p]);
    return {
      question: `${de ? "Welcher Buchstabe kommt als Nächstes?" : "Which letter comes next?"}\n${seq.map((p) => ABC[p]).join(" · ")} · ?`,
      ...textChoices(ABC[answer], wrong, r),
      explanation: de ? `Die Regel: ${rule}. Also ${ABC[answer]}.` : `The rule: ${ruleEn}. So ${ABC[answer]}.`,
    };
  }
};

// ---------------------------------------------------------------- odd one out
interface Family { id: string; de: string; en: string; is: (n: number) => boolean }
const isPrime = (n: number) => n > 1 && range(Math.floor(Math.sqrt(n)) - 1).every((k) => n % (k + 2));
const digitSum = (n: number) => [...String(n)].reduce((a, b) => a + Number(b), 0);
const FIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
const whole = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;
export const FAMILIES: Family[] = [
  { id: "even", de: "gerade Zahlen", en: "even numbers", is: (n) => n % 2 === 0 },
  { id: "odd", de: "ungerade Zahlen", en: "odd numbers", is: (n) => n % 2 === 1 },
  ...range(17).map((k) => k + 3).map((k): Family => ({ id: `m${k}`, de: `Vielfache von ${k}`, en: `multiples of ${k}`, is: (n) => n % k === 0 })),
  { id: "prime", de: "Primzahlen", en: "prime numbers", is: isPrime },
  { id: "square", de: "Quadratzahlen", en: "square numbers", is: (n) => whole(Math.sqrt(n)) },
  { id: "cube", de: "Kubikzahlen (n × n × n)", en: "cube numbers (n × n × n)", is: (n) => whole(Math.cbrt(n)) },
  { id: "pow2", de: "Zweierpotenzen (2, 4, 8, 16 …)", en: "powers of two (2, 4, 8, 16 …)", is: (n) => n > 1 && (n & (n - 1)) === 0 },
  { id: "tri", de: "Dreieckszahlen (1, 3, 6, 10, 15 …)", en: "triangular numbers (1, 3, 6, 10, 15 …)", is: (n) => whole((Math.sqrt(8 * n + 1) - 1) / 2) },
  { id: "fib", de: "Fibonacci-Zahlen (1, 2, 3, 5, 8, 13 …)", en: "Fibonacci numbers (1, 2, 3, 5, 8, 13 …)", is: (n) => FIB.includes(n) },
  { id: "pal", de: "Zahlen, die vorwärts und rückwärts gleich sind", en: "numbers that read the same backwards", is: (n) => n > 10 && String(n) === [...String(n)].reverse().join("") },
  ...range(17).map((k) => k + 2).map((s): Family => ({ id: `ds${s}`, de: `Zahlen mit der Quersumme ${s}`, en: `numbers whose digits add up to ${s}`, is: (n) => n > 9 && digitSum(n) === s })),
];
// [family, smallest, largest] by step
const ODD: Record<Step, [string, number, number][]> = {
  1: [["even", 2, 40], ["odd", 1, 39], ["m5", 5, 60], ["m10", 10, 120]],
  2: [["m3", 3, 60], ["m4", 4, 80], ["m6", 6, 96], ["square", 1, 100]],
  3: [["m7", 7, 98], ["m8", 8, 120], ["m9", 9, 135], ["prime", 2, 59], ["square", 16, 225], ["ds9", 18, 99], ["ds10", 19, 99]],
  4: [["cube", 1, 216], ["pow2", 2, 256], ["tri", 3, 120], ["pal", 11, 999], ["prime", 11, 97], ["m11", 11, 150], ["m12", 12, 150]],
  5: [["fib", 2, 233], ["tri", 10, 210], ["prime", 53, 199], ["ds12", 100, 999], ["ds15", 100, 999], ["m13", 13, 300], ["m17", 17, 300], ["m19", 19, 300]],
};
/** Every (family, number) reading in which exactly this one number of the list does not belong. */
export const oddReadings = (list: number[]) => FAMILIES.flatMap((f) => list.filter((x) => !f.is(x) && list.every((y) => y === x || f.is(y))).map((x) => ({ family: f.id, x })));

const oddone: Make = (r, d, de) => {
  for (;;) {
    const [id, lo, hi] = pick(r, ODD[d]);
    const fam = FAMILIES.find((f) => f.id === id)!;
    const members = shuffle(range(hi - lo + 1).map((k) => k + lo).filter(fam.is), r).slice(0, 4);
    if (members.length < 4) continue;
    // an intruder close to the others; among primes an odd number that only looks prime
    const near = shuffle(members.flatMap((v) => [1, 2, 3].flatMap((x) => [v + x, v - x])), r);
    const pool = id === "prime" ? shuffle(range(hi - lo + 1).map((k) => k + lo).filter((v) => v % 2 === 1 && v % 5 !== 0 && !isPrime(v) && (d < 4 || v % 3 !== 0)), r) : near;
    const x = pool.find((v) => v >= Math.max(1, lo - 3) && v <= hi + 3 && !fam.is(v) && !members.includes(v));
    if (x === undefined) continue;
    const list = shuffle([...members, x], r);
    if (oddReadings(list).some((q) => q.x !== x)) continue; // another property would single out a different number
    const p = id === "prime" ? range(x).map((k) => k + 2).find((k) => x % k === 0)! : 0;
    const why = id === "prime" ? ` (${x} = ${p} × ${x / p})` : id.startsWith("ds") ? (de ? ` (Quersumme ${digitSum(x)})` : ` (its digits add up to ${digitSum(x)})`) : "";
    const sorted = [...members].sort((a, b) => a - b);
    return {
      question: `${de ? "Vier dieser Zahlen haben etwas gemeinsam. Welche gehört nicht dazu?" : "Four of these numbers have something in common. Which one does not belong?"}\n${list.join(" · ")}`,
      options: list.map(String), correct: list.indexOf(x),
      explanation: de ? `${sorted.slice(0, 3).join(", ")} und ${sorted[3]} sind ${fam.de} – ${x} nicht${why}.` : `${sorted.slice(0, 3).join(", ")} and ${sorted[3]} are ${fam.en} – ${x} is not${why}.`,
    };
  }
};

// ---------------------------------------------------------------- letter sums
// Sums with exactly one solution, as numbers; the letters are put in when the puzzle is made (scripts in the notes:
// every pattern was solved by trying all digits). By step: short sums first, three-digit sums and products last.
export const SUMS: Record<Step, string[]> = {
  1: ["1+9","9+1","89+9","91+9","92+9","95+5","99+1","99+2","99+9"],
  2: ["89+9","91+9","92+9","95+5","99+1","99+2","99+9","50+50","51+50","55+50","55+55","56+55","61+55","61+61","65+51","90+10","90+11","90+19","91+10","91+19","91+21","92+19","92+29","98+91","99+10","99+11","99+12","99+19","99+22","99+89","99+91","99+92","99+99"],
  3: ["50+50","51+50","55+50","55+55","56+55","59+51","61+55","61+61","65+51","81+19","81+21","82+18","83+18","85+15","88+12","88+13","88+18","89+11","89+19","90+10","90+11","90+19","91+10","91+11","91+18","91+19","91+21","92+19","92+29","98+11","98+91","99+10","99+11","99+12","99+19","99+22","99+89","99+91","99+92","99+99"],
  4: ["50+50","51+50","55+50","55+55","56+55","59+51","61+55","61+61","65+51","81+19","81+21","82+18","83+18","85+15","88+12","88+13","88+18","89+11","89+19","90+10","90+11","90+19","91+10","91+11","91+18","91+19","91+21","92+19","92+29","98+11","98+91","99+10","99+11","99+12","99+19","99+22","99+89","99+91","99+92","99+99","19×9","25×9","28×4","37×3","37×9","41×4","42×2","42×7","43×8","58×8","74×6","75×7","84×4","85×8","86×8","87×9","92×9","95×9","98×9","99×9"],
  5: ["111+91","191+11","818+91","902+99","909+99","911+98","912+99","915+95","918+88","919+81","919+89","920+90","920+99","921+90","921+98","922+90","922+97","928+81","929+82","929+92","938+81","949+55","950+55","951+51","951+58","952+59","954+95","955+50","955+55","955+61","956+55","959+45","959+52","959+59","965+51","979+22","981+28","981+98","982+29","988+12","988+19","988+81","989+11","989+19","989+88","990+20","990+29","990+98","991+18","991+22","991+88","991+97","992+20","992+27","994+55","995+54","997+22","998+21","998+91","999+20","999+90","28×4","42×7","58×8","84×4","85×8","87×9"],
};
/** "29+92" → the puzzle "AB + BA = CAC" and what each letter stands for. */
export function letterSum(task: string) {
  const op = task.includes("+") ? "+" : "×";
  const [x, y] = task.split(op).map(Number), z = op === "+" ? x + y : x * y;
  const map = new Map<string, string>();
  const conv = (n: number) => [...String(n)].map((dg) => { if (!map.has(dg)) map.set(dg, "ABCDEF"[map.size]); return map.get(dg)!; }).join("");
  const text = `${conv(x)} ${op} ${conv(y)} = ${conv(z)}`;
  return { text, numbers: `${x} ${op} ${y} = ${z}`, letters: [...map.entries()].map(([digit, letter]) => ({ letter, digit: Number(digit) })) };
}
const crypt: Make = (r, d, de) => {
  const sum = letterSum(pick(r, SUMS[d]));
  const asked = pick(r, sum.letters);
  const wrong = [...shuffle(sum.letters.filter((l) => l !== asked).map((l) => l.digit), r), ...shuffle(range(10).filter((v) => !sum.letters.some((l) => l.digit === v)), r)];
  return {
    question: de
      ? `Jeder Buchstabe steht für eine andere Ziffer, keine Zahl beginnt mit 0:\n${sum.text}\nFür welche Ziffer steht ${asked.letter}?`
      : `Each letter stands for a different digit, and no number starts with 0:\n${sum.text}\nWhich digit does ${asked.letter} stand for?`,
    ...textChoices(String(asked.digit), wrong.map(String), r),
    explanation: de
      ? `Es passt nur ${sum.numbers}: ${sum.letters.map((l) => `${l.letter} = ${l.digit}`).join(", ")}. ${asked.letter} steht also für ${asked.digit}.`
      : `Only ${sum.numbers} fits: ${sum.letters.map((l) => `${l.letter} = ${l.digit}`).join(", ")}. So ${asked.letter} stands for ${asked.digit}.`,
  };
};

export const TEASERS = { jugs, cube, nim, directions, letters, oddone, crypt };
