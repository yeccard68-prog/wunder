// "Stimmt das?" cards from the generated cards that already exist – no new queries, same sources. Each card becomes one
// statement, true or false (decided by its id, about half each): the true one is the card's explanation, the false one
// the same sentence with a wrong option in place of the answer. After answering, the card shows the true sentence.
// Output: public/gen/<template>-tf.json (kind "fact", options Stimmt / Stimmt nicht), imported with import_generated.
//   node scripts/content/truefalse.mjs
//
// Left out where a "false" statement might still be true in reality: official languages (many countries have several),
// capital rivers (a city can lie on more than one river), works (Botticelli painted an "Adoration of the Magi" too, not only
// Leonardo) and art movements (painters are often counted in more than one); and the reverse files (same facts again).
import fs from "node:fs";

const TEMPLATES = ["capitals", "regions", "elements", "atomicnumbers", "summits", "domains", "continents", "heritage", "companies",
  "olympics", "worldcups", "nobel", "discoverers", "instruments", "moons", "flags", "lakes", "volcanoes", "waterfalls", "carbrands", "islands", "parks", "mountains", "rivermouths"];
const before = (s) => s.split(":")[0];
const quoted = (s) => s.match(/[„"]([^“"]+)[“"]/)?.[1];
const REGION_KIND = { DE: ["Die Landeshauptstadt", "The state capital"], AT: ["Die Landeshauptstadt", "The state capital"], CH: ["Der Hauptort", "The capital"], US: ["Die Hauptstadt", "The capital"] };
/** Statements that read well with any country name ("von Vereinigte Staaten" does not) – value = the answer to check. */
const SAY = {
  capitals: (c, v) => [`${before(c.question)}: Die Hauptstadt heißt ${v.de}.`, `${before(c.translations.en.question)}: The capital is ${v.en}.`],
  regions: (c, v) => { const k = REGION_KIND[c.countries[0]]; return [`${before(c.question)}: ${k[0]} ist ${v.de}.`, `${before(c.translations.en.question)}: ${k[1]} is ${v.en}.`]; },
  summits: (c, v) => [`${before(c.question)}: Der höchste Punkt des Landes ist ${v.de}.`, `${before(c.translations.en.question)}: The highest point of the country is ${v.en}.`],
  domains: (c, v) => [`${before(c.question)}: Internetadressen enden auf ${v.de}.`, `${before(c.translations.en.question)}: Web addresses end in ${v.en}.`],
  continents: (c, v) => [`${before(c.question)}: Das Land liegt in ${v.de}.`, `${before(c.translations.en.question)}: The country is in ${v.en}.`],
  heritage: (c, v) => [`Die Welterbestätte „${quoted(c.question)}“ liegt in diesem Land: ${v.de}.`, `The World Heritage Site "${quoted(c.translations.en.question)}" is in this country: ${v.en}.`],
  companies: (c, v) => [`Das Unternehmen „${quoted(c.question)}“ hat seinen Hauptsitz in diesem Land: ${v.de}.`, `The company "${quoted(c.translations.en.question)}" is headquartered in this country: ${v.en}.`],
  flags: (c, v) => [`Diese Flagge gehört zu diesem Land: ${v.de}.`, `This flag belongs to this country: ${v.en}.`],
  worldcups: (c, v) => { const y = c.question.match(/\d{4}/)[0]; return c.id.startsWith("wd-wch") ? [`Gastgeber der Fußball-WM der Männer ${y}: ${v.de}.`, `Host of the ${y} men's World Cup: ${v.en}.`] : [`Fußball-Weltmeister der Männer ${y}: ${v.de}.`, `Men's World Cup winner ${y}: ${v.en}.`]; },
};
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const once = (text, part) => text.split(part).length === 2;

let total = 0;
for (const name of TEMPLATES) {
  const file = `public/gen/${name}.json`;
  if (!fs.existsSync(file)) continue;
  const out = [];
  for (const c of JSON.parse(fs.readFileSync(file, "utf8"))) {
    const en = c.translations.en;
    const right = { de: c.options[c.correct_index], en: en.options[c.correct_index] };
    const say = SAY[name];
    if (!say && (!once(c.explanation, right.de) || !once(en.explanation, right.en))) continue; // the answer must appear exactly once
    const truth = hash(c.id) % 2 === 0;
    const wrong = [0, 1, 2, 3].filter((i) => i !== c.correct_index).map((i) => ({ de: c.options[i], en: en.options[i] }))[hash(c.id + "w") % 3];
    const [trueDe, trueEn] = say ? say(c, right) : [c.explanation, en.explanation];
    let de = trueDe, enText = trueEn;
    if (!truth) {
      if (!wrong || (!say && c.explanation.includes(wrong.de))) continue;
      [de, enText] = say ? say(c, wrong) : [c.explanation.replace(right.de, wrong.de), en.explanation.replace(right.en, wrong.en)];
    }
    const tidy = (x) => x.replace(/\.\.$/, "."); // an answer ending in a full stop (Washington, D.C.)
    de = tidy(de); enText = tidy(enText);
    out.push({
      id: `${c.id}-f`, kind: "fact", category_id: c.category_id, difficulty: c.difficulty, min_age: c.min_age, countries: c.countries, tags: c.tags,
      question: de, options: ["Stimmt", "Stimmt nicht"], correct_index: truth ? 0 : 1,
      explanation: truth ? tidy(trueDe) : `Stimmt nicht: ${tidy(trueDe)}`,
      source_name: c.source_name, source_url: c.source_url,
      ...(c.image_url ? { image_url: c.image_url, image_credit: c.image_credit, image_source: c.image_source } : {}),
      translations: { en: { question: enText, options: ["True", "False"], explanation: truth ? tidy(trueEn) : `False: ${tidy(trueEn)}` } },
    });
  }
  fs.writeFileSync(`public/gen/${name}-tf.json`, JSON.stringify(out));
  total += out.length;
  console.log(`${name}-tf: ${out.length} (${out.filter((x) => x.correct_index === 0).length} wahr)`);
}
console.log(`zusammen ${total} Stimmt-das-Karten`);
