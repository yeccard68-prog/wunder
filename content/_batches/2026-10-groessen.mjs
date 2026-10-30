// Content batch (30.10.2026): motion graphics "Vom Virus bis zum Blauwal" (a-groessen, scene sizes) and its check
// question. Sizes quoted from: Influenzavirus "mit einem Durchmesser von 80 bis 120 nm" · Escherichia coli "Der
// Durchmesser beträgt 1,1–1,5 µm und die Länge 2,0–6,0 µm." · Erythrozyt "Durchmesser: im Mittel 7,5 μm" · Kopfhaar
// "Die Haardicke liegt bei gesunden, jungen Erwachsenen im Durchschnitt zwischen 69 ± 8 µm und 89 ± 7 µm." · Sand
// "Mineralkörnern mit einer Korngröße von 0,063 bis 2 Millimeter" · Rote Waldameise "den Arbeiterinnen 4,5 bis neun
// Millimeter" · Blauwal "Mit einer Körperlänge von bis zu 33 Metern … eines der größten und schwersten bekannten Tiere
// der Erdgeschichte". Ratios (about 800 viruses across a hair, the whale over 3,000 times an ant) are computed.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-groessen.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-groessen.mjs   → the question
//   node content/_batches/2026-10-groessen.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { balance } from "./_balance.mjs";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-30";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["gr1", "earth", 1, 10, null, "Wie lang kann ein Blauwal werden?", ["Bis etwa 10 Meter", "Bis etwa 20 Meter", "Bis etwa 33 Meter", "Bis etwa 60 Meter"], 2,
    "Mit einer Körperlänge von bis zu 33 Metern und bis zu 200 Tonnen ist der Blauwal eines der größten und schwersten bekannten Tiere der Erdgeschichte.", "Blauwal",
    "How long can a blue whale grow?", ["Up to about 10 metres", "Up to about 20 metres", "Up to about 33 metres", "Up to about 60 metres"],
    "At up to 33 metres long and up to 200 tonnes, the blue whale is one of the largest and heaviest animals known in the history of the Earth.", ["Tiere", "Meer"]],
]);

export const evidence = {
  gr1: ["de|Blauwal|Mit einer Körperlänge von bis zu 33 Metern und einer Körpermasse von bis zu 200 Tonnen ist der Blauwal eines der größten und schwersten bekannten Tiere der Erdgeschichte."],
};

const animations = [
  {
    id: "a-groessen", scene: "sizes", renderer: "svg-scene", category: "earth", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "gr1", predict: [2, 2],
    sources: [wiki("Influenzavirus"), wiki("Escherichia_coli"), wiki("Erythrozyt"), wiki("Kopfhaar"), wiki("Sand"), wiki("Rote_Waldameise"), wiki("Blauwal")],
    de: {
      title: "Vom Virus bis zum Blauwal", summary: "Ein Zoom durch die Größen der Natur – vom Grippevirus bis zum größten Tier.",
      goal: "Du kannst einordnen, wie klein Viren, Bakterien und Zellen sind und wie riesig der Abstand bis zum Blauwal ist.",
      labels: ["Grippevirus: 80–120 nm", "Bakterium E. coli: 2–6 µm", "rote Blutzelle: 7,5 µm", "Haar: 69–89 µm dick", "Sandkorn: bis 2 mm", "Waldameise: 4,5–9 mm", "Blauwal: bis 33 m"],
      steps: [
        ["Ein Grippevirus ist winzig: 80 bis 120 Nanometer. Ein Nanometer ist ein Millionstel Millimeter.", 7],
        ["Das Darmbakterium E. coli ist schon 2 bis 6 Mikrometer lang – daneben wird das Virus zum Punkt.", 7],
        ["Eine rote Blutzelle misst im Mittel 7,5 Mikrometer. Und ein Haar ist zwischen 69 und 89 Mikrometer dick – nebeneinander hätten darauf rund 800 Grippeviren Platz.", 9],
        ["Ein Sandkorn ist bis zu 2 Millimeter groß, eine Arbeiterin der Roten Waldameise 4,5 bis 9 Millimeter lang. Alles Bisherige ist daneben unsichtbar klein.", 9],
        ["Und der Blauwal? Mit bis zu 33 Metern ist er eines der größten Tiere der Erdgeschichte – über 3.000-mal so lang wie die Ameise.", 9],
      ],
      predict: ["Gleich kommt ein Haar. Wie viele Grippeviren hätten nebeneinander auf seiner Dicke Platz?", "Rund 8", "Rund 80", "Rund 800"],
    },
    en: {
      title: "From a virus to the blue whale", summary: "A zoom through the sizes of nature – from a flu virus to the largest animal.",
      goal: "You can place how small viruses, bacteria and cells are, and how huge the gap up to the blue whale is.",
      labels: ["flu virus: 80–120 nm", "E. coli bacterium: 2–6 µm", "red blood cell: 7.5 µm", "hair: 69–89 µm thick", "grain of sand: up to 2 mm", "wood ant: 4.5–9 mm", "blue whale: up to 33 m"],
      steps: [
        "A flu virus is tiny: 80 to 120 nanometres. A nanometre is a millionth of a millimetre.",
        "The gut bacterium E. coli is already 2 to 6 micrometres long – next to it the virus becomes a dot.",
        "A red blood cell measures 7.5 micrometres on average. And a hair is between 69 and 89 micrometres thick – about 800 flu viruses would fit side by side across it.",
        "A grain of sand is up to 2 millimetres, a worker of the red wood ant 4.5 to 9 millimetres long. Everything before is invisibly small next to them.",
        "And the blue whale? At up to 33 metres it is one of the largest animals in the history of the Earth – over 3,000 times as long as the ant.",
      ],
      predict: ["A hair is coming next. How many flu viruses would fit side by side across its thickness?", "About 8", "About 80", "About 800"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
