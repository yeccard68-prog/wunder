// Content batch (05.11.2026): motion graphics "Wie tief haben wir gebohrt?" (a-bohrung, scene depths) and its check
// question. Depths quoted from: Mponeng "Mit einer Tiefe von über vier Kilometern ist sie die tiefste Mine der Welt" ·
// Kola-Bohrung "Sie erreichte 12.262 Meter Teufe (1989)" · Erdkruste "Die kontinentale Erdkruste hat eine Dicke von 30 bis
// 60 Kilometer" and the Moho "nach moderner Seismik 38 km" (drawn at 38 km) · Erdkern "Der äußere Kern beginnt ab einer Tiefe
// von im Mittel 2900 km und endet an der Grenze zum inneren Erdkern bei 5150 km" and "rund 0,2 % der Strecke zum
// Erdmittelpunkt" · Erdradius "Er beträgt im Mittel 6.371 Kilometer".
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-bohrung.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-11-bohrung.mjs   → the question
//   node content/_batches/2026-11-bohrung.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { balance } from "./_balance.mjs";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-11-05";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["kb1", "earth", 2, 10, null, "Wie tief reicht die tiefste Bohrung der Welt, die Kola-Bohrung in Russland?", ["Rund 1,2 Kilometer", "Rund 12 Kilometer", "Rund 120 Kilometer", "Rund 1200 Kilometer"], 1,
    "Die Kola-Bohrung erreichte 1989 eine Tiefe von 12.262 Metern – das sind nur rund 0,2 Prozent des Weges bis zum Erdmittelpunkt.", "Kola-Bohrung",
    "How deep does the deepest borehole in the world, the Kola borehole in Russia, go?", ["About 1.2 kilometres", "About 12 kilometres", "About 120 kilometres", "About 1,200 kilometres"],
    "The Kola borehole reached a depth of 12,262 metres in 1989 – only about 0.2 per cent of the way to the centre of the Earth.", ["Erde", "Rekorde"]],
]);

export const evidence = {
  kb1: [
    "de|Kola-Bohrung|Sie erreichte 12.262 Meter Teufe (1989) und ist seit 1979 die tiefste Bohrung der Welt.",
    "de|Kola-Bohrung|auf der russischen Halbinsel Kola",
    "de|Erdkern|Die Kola-Bohrung, die das tiefste jemals gebohrte Loch darstellt, war 12,3 km tief, was lediglich 1⁄518 und damit rund 0,2 % der Strecke zum Erdmittelpunkt entspricht.",
  ],
};

const animations = [
  {
    id: "a-bohrung", scene: "depths", renderer: "svg-scene", category: "earth", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "kb1", predict: [4, 0],
    sources: [wiki("Mponeng"), wiki("Kola-Bohrung"), wiki("Erdkruste"), wiki("Erdkern"), wiki("Erdradius")],
    de: {
      title: "Wie tief haben wir gebohrt?", summary: "Von der tiefsten Mine bis zum Erdmittelpunkt – und wie winzig unser tiefstes Loch ist.",
      goal: "Du kannst einordnen, wie tief Menschen in die Erde vorgedrungen sind und wie weit es bis zum Erdmittelpunkt ist.",
      labels: ["tiefste Mine: über 4 km", "Kola-Bohrung: 12.262 m", "Erdkruste", "Erdmantel", "äußerer Erdkern", "innerer Erdkern", "Erdmittelpunkt: 6371 km", "m", "Kola-Bohrung: nur 0,2 % des Weges"],
      steps: [
        ["Die tiefste Mine der Welt, die Goldmine Mponeng in Südafrika, reicht über vier Kilometer in die Erde – nirgends sonst gelangen Menschen tiefer unter die Erdoberfläche.", 7],
        ["Noch tiefer kam ein Bohrer: Die Kola-Bohrung in Russland erreichte 1989 eine Tiefe von 12.262 Metern. In 12 Kilometern Tiefe war es dort schon 205 °C heiß – viel heißer als erwartet.", 8],
        ["Und doch durchstößt das nicht einmal die Erdkruste: Unter den Kontinenten ist sie 30 bis 60 Kilometer dick. Die Bohrung schrumpft zu einem Strich.", 7],
        ["Darunter folgt der Erdmantel. Er reicht bis in rund 2900 Kilometer Tiefe, wo der äußere Erdkern beginnt.", 7],
        ["Ab 5150 Kilometern folgt der innere Kern, und nach 6371 Kilometern ist der Erdmittelpunkt erreicht. Die tiefste Bohrung schafft gerade einmal 0,2 Prozent dieses Weges.", 9],
      ],
      predict: ["Die Kola-Bohrung ist 12,3 Kilometer tief. Welcher Anteil des Weges zum Erdmittelpunkt ist das?", "Rund 0,2 Prozent", "Rund 2 Prozent", "Rund 20 Prozent"],
    },
    en: {
      title: "How deep have we drilled?", summary: "From the deepest mine to the centre of the Earth – and how tiny our deepest hole is.",
      goal: "You can place how deep people have got into the Earth and how far it is to its centre.",
      labels: ["deepest mine: over 4 km", "Kola borehole: 12,262 m", "Earth's crust", "Earth's mantle", "outer core", "inner core", "centre of the Earth: 6,371 km", "m", "Kola borehole: only 0.2 % of the way"],
      steps: [
        "The deepest mine in the world, the Mponeng gold mine in South Africa, reaches over four kilometres into the Earth – nowhere else do people get deeper below the surface.",
        "A drill got even deeper: in 1989 the Kola borehole in Russia reached a depth of 12,262 metres. At 12 kilometres down it was already 205 °C – far hotter than expected.",
        "And yet that does not even get through the Earth's crust: under the continents it is 30 to 60 kilometres thick. The borehole shrinks to a line.",
        "Below lies the Earth's mantle. It reaches down to about 2,900 kilometres, where the outer core begins.",
        "From 5,150 kilometres comes the inner core, and after 6,371 kilometres the centre of the Earth is reached. The deepest borehole manages just 0.2 per cent of that way.",
      ],
      predict: ["The Kola borehole is 12.3 kilometres deep. What share of the way to the centre of the Earth is that?", "About 0.2 per cent", "About 2 per cent", "About 20 per cent"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
