// One more interactive visualisation (15.10.2026): how writing came about (timeline, real data, years before Christ).
// All years from the Wikipedia article "Geschichte der Schrift" (retrieved 15.10.2026).
//   node content/_batches/2026-10-visuals-3.mjs      (idempotent; rewrites content/visuals.json)
import fs from "node:fs";

const W = (title, name = title.replaceAll("_", " ")) => ({ name: "Wikipedia: " + name, url: "https://de.wikipedia.org/wiki/" + title });

const visuals = [
  {
    id: "v-schrift-zeitleiste",
    type: "timeline",
    category_id: "language",
    min_age: 13,
    difficulty: 2,
    data_kind: "real",
    config: {
      from: -3500,
      to: 1600,
      items: [
        { key: "uruk", year: -3300 },
        { key: "hieroglyphs", year: -3200 },
        { key: "cuneiform", year: -2700 },
        { key: "oracle", year: -1400 },
        { key: "phoenician", year: -1050 },
        { key: "greek", year: -950, late: true },
        { key: "brahmi", year: -250 },
        { key: "runes", year: 150 },
        { key: "hangeul", year: 1446 },
      ],
    },
    title: "Wie die Schrift entstand",
    goal: "Du kannst frühe Schriften zeitlich einordnen und erklären, warum das Alphabet erst spät kam und sich dann von Volk zu Volk verbreitete.",
    intro: "Neun Stationen aus fast 5.000 Jahren Schriftgeschichte. Tippe eine an, blende die Abstände ein – und vergleiche maßstabsgetreu mit gleichen Abständen.",
    note: "Jahreszahlen nach dem Wikipedia-Artikel „Geschichte der Schrift“ (abgerufen am 15.10.2026). Frühe Daten sind Näherungen („um 3300 v. Chr.“). Für die Phönizier nennt die Quelle „spätestens im 11. Jahrhundert v. Chr.“, für die Übernahme durch die Griechen „vermutlich im 10. Jahrhundert v. Chr.“ – eingetragen ist jeweils die Mitte des Jahrhunderts. Runen: der Kamm von Vimose, um 150 n. Chr. die erste sicher nachweisbare Inschrift. Ein Jahr 0 gibt es nicht; die Abstände berücksichtigen das.",
    labels: { uruk: "Bilderschrift in Uruk", hieroglyphs: "Ägyptische Hieroglyphen", cuneiform: "Keilschrift auf Tontafeln", oracle: "Orakelknochen (China)", phoenician: "Phönizisches Alphabet", greek: "Griechisches Alphabet", brahmi: "Brahmi-Schrift (Indien)", runes: "Runen", hangeul: "Hangeul (Korea)", toScale: "maßstabsgetreu", even: "gleiche Abstände", showGaps: "Jahre dazwischen zeigen", year: "Jahr", gapHead: "Jahre seit dem vorigen", pick: "Tippe eine Station an.", detail: "{name}: {year}" },
    explain: "Schrift entstand an mehreren Orten der Welt – in Mesopotamien und Ägypten sehr früh, in China später; die Schrift der Maya gilt als eigenständige Erfindung. Die frühen Schriften brauchten Hunderte Zeichen für Wörter und Silben. Ein Alphabet mit wenigen Zeichen für einzelne Laute kam erst über tausend Jahre später auf – und wurde dann weitergegeben: von den Phöniziern zu den Griechen, von dort über die Etrusker zu den Römern. Hangeul ist eine Ausnahme: Es wurde 1446 bewusst entworfen.",
    predict: { question: "Wie viele Jahre liegen ungefähr zwischen den ältesten ägyptischen Hieroglyphen und dem griechischen Alphabet?", options: ["Etwa 250 Jahre", "Etwa 1.000 Jahre", "Gut 2.000 Jahre"], feedback: "Gut 2.000 Jahre: Die ältesten Hieroglyphen stammen aus der Zeit um 3200 v. Chr., die Griechen übernahmen die Buchstaben vermutlich im 10. Jahrhundert v. Chr. Das griechische Alphabet ist jetzt eingetragen." },
    predict_correct: 2,
    apply: "Blende die Jahre dazwischen ein: Zwischen welchen beiden Stationen liegt die größte Lücke? Schalte dann auf gleiche Abstände um – welche Schrift wirkt plötzlich viel näher an den anderen, als sie ist?",
    sources: [W("Geschichte_der_Schrift")],
    links: [{ kind: "question", id: "l57" }, { kind: "question", id: "l47" }],
    verification_status: "ai_checked",
    status: "published",
    translations: {
      en: {
        title: "How writing came about",
        goal: "You can place early writing systems in time and explain why the alphabet came late and then spread from people to people.",
        intro: "Nine stations from almost 5,000 years of the history of writing. Tap one, show the gaps – and compare to scale with equal spacing.",
        note: "Years according to the German Wikipedia article \"Geschichte der Schrift\" (retrieved 15 October 2026). Early dates are approximations (\"around 3300 BC\"). For the Phoenicians the source gives \"by the 11th century BC at the latest\", for the adoption by the Greeks \"probably in the 10th century BC\" – each is placed in the middle of the century. Runes: the Vimose comb, around AD 150 the first securely dated inscription. There is no year 0; the gaps take this into account.",
        labels: { uruk: "Picture writing in Uruk", hieroglyphs: "Egyptian hieroglyphs", cuneiform: "Cuneiform on clay tablets", oracle: "Oracle bones (China)", phoenician: "Phoenician alphabet", greek: "Greek alphabet", brahmi: "Brahmi script (India)", runes: "Runes", hangeul: "Hangul (Korea)", toScale: "to scale", even: "equal spacing", showGaps: "show years in between", year: "Year", gapHead: "years since the previous one", pick: "Tap a station.", detail: "{name}: {year}" },
        explain: "Writing arose in several places around the world – very early in Mesopotamia and Egypt, later in China; Maya writing is considered an independent invention. The early scripts needed hundreds of signs for words and syllables. An alphabet with a few signs for single sounds only appeared more than a thousand years later – and was then passed on: from the Phoenicians to the Greeks, and from there via the Etruscans to the Romans. Hangul is an exception: it was deliberately designed in 1446.",
        predict: { question: "Roughly how many years lie between the oldest Egyptian hieroglyphs and the Greek alphabet?", options: ["About 250 years", "About 1,000 years", "A good 2,000 years"], feedback: "A good 2,000 years: the oldest hieroglyphs date from around 3200 BC, and the Greeks probably adopted the letters in the 10th century BC. The Greek alphabet is now on the timeline." },
        apply: "Show the years in between: between which two stations is the biggest gap? Then switch to equal spacing – which script suddenly seems much closer to the others than it is?",
      },
    },
  },
];

const file = "content/visuals.json";
const list = JSON.parse(fs.readFileSync(file, "utf8"));
for (const v of visuals) {
  const i = list.findIndex((x) => x.id === v.id);
  if (i >= 0) list[i] = v;
  else list.push(v);
}
fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n");
console.log(`${visuals.length} visualisation merged; ${list.length} in total.`);
