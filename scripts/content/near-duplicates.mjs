// Lists pairs of feed questions that share most of their words – candidates for the same fact asked twice.
//   node scripts/content/near-duplicates.mjs [minShare=0.75]
// Many hits are fine (e.g. "Wofür steht die Abkürzung …?" for different abbreviations); read the pairs and
// rewrite only those that really ask the same thing.
import { loadContent } from "./lib.mjs";

const min = Number(process.argv[2] ?? 0.75);
const STOP = new Set("der die das ein eine einer eines einem einen und oder in im ist sind wie viele was welche welcher welches wer wo wann auf dem den des mit von zu für bei nach am an es sich man hat haben wird werden heißt".split(" "));
const words = (s) => new Set(s.toLowerCase().replace(/[^a-zäöüß0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const qs = loadContent().questions.filter((q) => q.show_in_feed && q.kind !== "fact").map((q) => [q, words(q.question)]);
let n = 0;
for (let i = 0; i < qs.length; i++)
  for (let j = i + 1; j < qs.length; j++) {
    const [a, A] = qs[i];
    const [b, B] = qs[j];
    if (A.size < 3 || B.size < 3) continue;
    const share = [...A].filter((w) => B.has(w)).length / Math.min(A.size, B.size);
    if (share < min) continue;
    n++;
    console.log(`${share.toFixed(2)}  ${a.id} „${a.question}“\n      ${b.id} „${b.question}“`);
  }
console.log(`${n} pairs with at least ${Math.round(min * 100)} % shared words`);
