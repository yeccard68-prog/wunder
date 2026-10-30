// Content batch (30.10.2026): motion graphics "Von der Tiefsee bis zur Raumstation" (a-hoehen, scene heights) and its
// check question. Heights quoted from: Burj Khalifa "die Endhöhe von 828 Metern" · "Seit April 2008 ist er das höchste
// Bauwerk der Welt" · Mount Everest "mit einer Höhe von über 8848 m … der höchste Berg der Erde" · Marianengraben "mit
// einer Maximaltiefe von etwa 11.000 Metern unterhalb des Meeresspiegels die tiefste Stelle des Weltmeeres" ·
// Verkehrsflugzeug "Boeing 777 … mit 896 km/h (auf 10.670 Meter)" · Kármán-Linie "in einer Höhe von 100 km über dem
// Meeresspiegel … um die Luftfahrt von der Raumfahrt zu unterscheiden" · Internationale Raumstation "Die ISS kreist in
// rund 400 km Höhe".
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-hoehen.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-hoehen.mjs   → the question
//   node content/_batches/2026-10-hoehen.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { balance } from "./_balance.mjs";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-30";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["hz1", "earth", 2, 10, null, "Wie tief liegt die tiefste Stelle des Weltmeers im Marianengraben ungefähr?", ["Rund 4.000 Meter", "Rund 8.000 Meter", "Rund 11.000 Meter", "Rund 20.000 Meter"], 2,
    "Mit einer Maximaltiefe von etwa 11.000 Metern unter dem Meeresspiegel liegt im Marianengraben die tiefste Stelle des Weltmeeres – tiefer, als der Mount Everest mit über 8848 Metern hoch ist.", "Marianengraben",
    "Roughly how deep is the deepest point of the ocean, in the Mariana Trench?", ["About 4,000 metres", "About 8,000 metres", "About 11,000 metres", "About 20,000 metres"],
    "With a maximum depth of about 11,000 metres below sea level, the Mariana Trench holds the deepest point of the ocean – deeper than Mount Everest, at over 8,848 metres, is high.", ["Meer", "Geografie"]],
]);

export const evidence = {
  hz1: [
    "de|Marianengraben|in der mit einer Maximaltiefe von etwa 11.000 Metern unterhalb des Meeresspiegels die tiefste Stelle des Weltmeeres liegt",
    "de|Mount_Everest|Der Mount Everest ist ein Berg im Himalaya und mit einer Höhe von über 8848 m (genauer: siehe Höhenangaben) der höchste Berg der Erde.",
  ],
};

const animations = [
  {
    id: "a-hoehen", scene: "heights", renderer: "svg-scene", category: "earth", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "hz1", predict: [4, 1],
    sources: [wiki("Burj_Khalifa"), wiki("Mount_Everest"), wiki("Marianengraben"), wiki("Verkehrsflugzeug"), wiki("Kármán-Linie"), wiki("Internationale_Raumstation")],
    de: {
      title: "Von der Tiefsee bis zur Raumstation", summary: "Hochhaus, Everest, Tiefsee, Flugzeug, Weltraum – auf einer Skala, die immer weiter herauszoomt.",
      goal: "Du kannst die Höhen und Tiefen der Erde einordnen – vom höchsten Gebäude bis zur Raumstation.",
      labels: ["Meeresspiegel", "Burj Khalifa: 828 m", "Mount Everest: über 8848 m", "Marianengraben: −11.000 m", "Verkehrsflugzeug: rund 10,7 km", "Grenze zum Weltraum: 100 km", "Raumstation ISS: rund 400 km"],
      steps: [
        ["Das höchste Bauwerk der Welt, der Burj Khalifa in Dubai, ist 828 Meter hoch.", 7],
        ["Der Mount Everest ist mit über 8848 Metern der höchste Berg der Erde – mehr als zehnmal so hoch. Das Hochhaus wird daneben zum Strich.", 8],
        ["Doch der Meeresgrund reicht noch tiefer: Die tiefste Stelle im Marianengraben liegt rund 11.000 Meter unter dem Meeresspiegel. Der Everest würde darin komplett versinken.", 9],
        ["Ein Verkehrsflugzeug wie die Boeing 777 fliegt in rund 10,7 Kilometern Höhe – fast so hoch, wie der Marianengraben tief ist.", 8],
        ["Und die Raumstation ISS? Sie kreist in rund 400 Kilometern Höhe, weit über der Grenze zum Weltraum bei 100 Kilometern. Von dort aus schrumpfen Berg, Flugzeug und Tiefsee zu einem dünnen Strich.", 10],
      ],
      predict: ["Ein Flugzeug fliegt in rund 10,7 km Höhe. Wie hoch kreist die Raumstation ISS?", "Rund 40 km", "Rund 400 km", "Rund 4.000 km"],
    },
    en: {
      title: "From the deep sea to the space station", summary: "Skyscraper, Everest, deep sea, aeroplane, space – on one scale that keeps zooming out.",
      goal: "You can place the heights and depths of the Earth – from the tallest building to the space station.",
      labels: ["sea level", "Burj Khalifa: 828 m", "Mount Everest: over 8,848 m", "Mariana Trench: −11,000 m", "airliner: about 10.7 km", "edge of space: 100 km", "space station ISS: about 400 km"],
      steps: [
        "The tallest structure in the world, the Burj Khalifa in Dubai, is 828 metres high.",
        "Mount Everest, at over 8,848 metres the highest mountain on Earth, is more than ten times as high. Next to it the skyscraper becomes a line.",
        "But the sea floor goes even deeper: the deepest point in the Mariana Trench lies about 11,000 metres below sea level. Everest would sink in it completely.",
        "An airliner such as the Boeing 777 flies at about 10.7 kilometres – almost as high as the Mariana Trench is deep.",
        "And the space station ISS? It orbits at about 400 kilometres, far above the edge of space at 100 kilometres. From up there, mountain, aeroplane and deep sea shrink to a thin line.",
      ],
      predict: ["An aeroplane flies at about 10.7 km. How high does the space station ISS orbit?", "About 40 km", "About 400 km", "About 4,000 km"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
