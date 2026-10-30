// Content batch (30.10.2026): the check question for the motion-graphics animation "Die Erdgeschichte als ein Tag"
// (a-erdtag, components/anim/scenes.tsx EarthDay). Every statement is quoted word for word from the linked articles.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-erdtag.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-erdtag.mjs
import { balance } from "./_balance.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-30";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["et1", "earth", 2, 10, null, "Seit wann ist unsere Art, Homo sapiens, in Afrika fossil belegt?", ["Seit rund 30.000 Jahren", "Seit rund 300.000 Jahren", "Seit rund 3 Millionen Jahren", "Seit rund 30 Millionen Jahren"], 1,
    "Homo sapiens ist in Afrika seit rund 300.000 Jahren fossil belegt. Gemessen an der Erde, die vor etwa 4,54 Milliarden Jahren entstand, ist das winzig: Auf einen einzigen Tag umgerechnet wären es nicht einmal sechs Sekunden.", "Homo_sapiens",
    "Since when has our species, Homo sapiens, been documented by fossils in Africa?", ["For about 30,000 years", "For about 300,000 years", "For about 3 million years", "For about 30 million years"],
    "Homo sapiens has been documented by fossils in Africa for about 300,000 years. Compared with the Earth, which formed about 4.54 billion years ago, that is tiny: squeezed into a single day it would be less than six seconds.", ["Erdgeschichte", "Evolution"]],
]);

export const evidence = {
  et1: [
    "de|Homo_sapiens|Die Art ist in Afrika seit rund 300.000 Jahren fossil belegt",
    "de|Erde|Die Erde entstand wie die Sonne und ihre anderen Planeten vor etwa 4,54 Milliarden Jahren, als sich der Sonnennebel verdichtete.",
  ],
};

// The animation (motion graphics, a 2D scene): 4.54 billion years on a 24-hour clock. Times on the clock are computed
// from the years (components/anim/scenes.tsx EARTH_DAY); the years are quoted from:
//   Erde: "Die Erde entstand … vor etwa 4,54 Milliarden Jahren" · "Die ältesten direkten, allerdings umstrittenen Hinweise
//   auf Leben sind Strukturen in 3,5 Milliarden Jahre alten Gesteinen" · Kambrische Explosion: "zu Beginn des Kambriums vor
//   etwa 541 Millionen Jahren" · Dinosaurier: "von der Oberen Trias vor rund 235 Millionen Jahren bis zur Kreide-Paläogen-
//   Grenze vor etwa 66 Millionen Jahren" · Homo sapiens: "seit rund 300.000 Jahren fossil belegt".
//   node content/_batches/2026-10-erdtag.mjs   → merges the animation (idempotent)
import { pathToFileURL } from "node:url";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

const animations = [
  {
    id: "a-erdtag", scene: "earthday", renderer: "svg-scene", category: "earth", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "et1", predict: [4, 2],
    sources: [wiki("Erde"), wiki("Kambrische_Explosion"), wiki("Dinosaurier"), wiki("Homo_sapiens")],
    de: {
      title: "Die Erdgeschichte als ein Tag", summary: "4,54 Milliarden Jahre auf einer 24-Stunden-Uhr – und der Mensch kommt erst ganz am Schluss.",
      goal: "Du kannst einordnen, wie jung Tiere, Dinosaurier und Menschen im Vergleich zum Alter der Erde sind.",
      labels: ["Erde entsteht", "erste Spuren von Leben", "die Tiere kommen", "Dinosaurier", "Mensch (Homo sapiens)", "die letzte Minute vor Mitternacht", "24 Stunden = 4,54 Milliarden Jahre", "1 Sekunde ≈ 52.500 Jahre", "nicht einmal sechs Sekunden"],
      steps: [
        ["Stell dir vor, die ganze Geschichte der Erde passt in einen einzigen Tag. Um Mitternacht entsteht die Erde – vor etwa 4,54 Milliarden Jahren. Jede Sekunde dieses Tages steht dann für rund 52.500 Jahre.", 8],
        ["Die ältesten, noch umstrittenen Spuren von Leben stecken in 3,5 Milliarden Jahre alten Gesteinen. Auf unserer Uhr ist es da schon kurz vor halb sechs am Morgen.", 8],
        ["Danach vergeht fast der ganze Tag mit winzigem, einfachem Leben. Erst um 21:08 Uhr – vor etwa 541 Millionen Jahren – tauchen in kurzer Zeit fast alle heutigen Tierstämme auf.", 9],
        ["Ab etwa 22:45 Uhr, vor rund 235 Millionen Jahren, beherrschen die Dinosaurier das Land. Um 23:39 Uhr, vor etwa 66 Millionen Jahren, ist ihre Zeit vorbei.", 9],
        ["Und der Mensch? Homo sapiens ist seit rund 300.000 Jahren belegt. Auf dieser Uhr ist das nicht einmal sechs Sekunden her: Er erscheint um 23:59:54 Uhr.", 9],
      ],
      predict: ["Gleich kommt der Mensch. Wann erscheint Homo sapiens auf dieser Uhr?", "Gegen 18 Uhr", "Gegen 23 Uhr", "In den letzten Sekunden vor Mitternacht"],
    },
    en: {
      title: "The Earth's history as one day", summary: "4.54 billion years on a 24-hour clock – and humans only come at the very end.",
      goal: "You can place how young animals, dinosaurs and humans are compared with the age of the Earth.",
      labels: ["Earth forms", "first traces of life", "the animals arrive", "dinosaurs", "humans (Homo sapiens)", "the last minute before midnight", "24 hours = 4.54 billion years", "1 second ≈ 52,500 years", "less than six seconds"],
      steps: [
        "Imagine the whole history of the Earth fits into a single day. At midnight the Earth forms – about 4.54 billion years ago. Each second of this day then stands for about 52,500 years.",
        "The oldest, still disputed traces of life are found in rocks 3.5 billion years old. On our clock it is already nearly half past five in the morning.",
        "After that almost the whole day passes with tiny, simple life. Only at 21:08 – about 541 million years ago – do almost all of today's animal groups appear within a short time.",
        "From about 22:45, around 235 million years ago, the dinosaurs rule the land. At 23:39, about 66 million years ago, their time is over.",
        "And humans? Homo sapiens has been documented for about 300,000 years. On this clock that is less than six seconds ago: we appear at 23:59:54.",
      ],
      predict: ["Humans are coming next. When does Homo sapiens appear on this clock?", "Around 6 pm", "Around 11 pm", "In the last seconds before midnight"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
