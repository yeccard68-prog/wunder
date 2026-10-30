// Content batch (30.10.2026): two motion-graphics animations with their check questions.
//   a-weltbevoelkerung (scene population): the world population from one to eight billion. Years quoted from
//     Weltbevölkerung: "Um das Jahr 1804 überschritt die Weltbevölkerung die Anzahl von einer Milliarde Menschen." ·
//     "Juli 1987 überschritt die Weltbevölkerung nach UN-Berechnungen die Zahl von fünf Milliarden Menschen." ·
//     "Die im Jahr 2011 lebenden sieben Milliarden Menschen" · "die Acht-Milliarden-Menschen-Marke am 15. November 2022
//     überschritten" · "im August 2026 rund 8,4 Milliarden" · "Es liegt bei ca. 80 Millionen pro Jahr." · "Das Wachstum
//     soll sich bis 2084 fortsetzen auf 10,3 Milliarden Menschen." · World population (en): "reached two billion in
//     1927 … three billion in 1960 … four billion in 1974 … six billion in 1999".
//   a-wasser (scene water): all water as 100 litres. Shares quoted from Water distribution on Earth (en): "1.386
//     billion km3 … with 97.5% being salt water and 2.5% being freshwater" · "Of the freshwater, only 0.3% is in liquid
//     form on the surface." · "Of the liquid surface fresh water, 87% is contained in lakes, 11% in swamps, and only 2%
//     in rivers." The litres are computed from them.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-zeitraffer.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-zeitraffer.mjs   → the questions
//   node content/_batches/2026-10-zeitraffer.mjs                                   → the animations (idempotent)
import { pathToFileURL } from "node:url";
import { balance } from "./_balance.mjs";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-30";
export const verification = "ai_checked";
const wikiEn = (title) => ({ name: "Wikipedia (englisch): " + title.replaceAll("_", " "), url: "https://en.wikipedia.org/wiki/" + title });

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["wb1", "culture", 2, 10, null, "Um welches Jahr lebten erstmals eine Milliarde Menschen auf der Erde?", ["Um 1500", "Um 1804", "Um 1900", "Um 1950"], 1,
    "Um das Jahr 1804 überschritt die Weltbevölkerung erstmals eine Milliarde Menschen. Im November 2022 wurde die Marke von acht Milliarden überschritten.", "Weltbevölkerung",
    "Around which year did a billion people live on Earth for the first time?", ["Around 1500", "Around 1804", "Around 1900", "Around 1950"],
    "Around the year 1804 the world population passed one billion people for the first time. In November 2022 it passed the mark of eight billion.", ["Bevölkerung", "Geschichte"]],
  ["wa1", "earth", 2, 10, null, "Welcher Anteil des Wassers auf der Erde ist Süßwasser?", ["Nur wenige Prozent", "Etwa ein Viertel", "Etwa die Hälfte", "Etwa drei Viertel"], 0,
    "Nur ein kleiner Teil: Je nach Schätzung sind es etwa 2,6 bis 3,5 % – der Rest ist Salzwasser. Und ein erheblicher Teil des Süßwassers ist als Eis in Gletschern und Polkappen gebunden.", "Süßwasser",
    "What share of the water on Earth is fresh water?", ["Only a few percent", "About a quarter", "About half", "About three quarters"],
    "Only a small part: depending on the estimate about 2.6 to 3.5% – the rest is salt water. And a large part of the fresh water is locked up as ice in glaciers and polar ice caps.", ["Wasser", "Erde"]],
]);

export const evidence = {
  wb1: [
    "de|Weltbevölkerung|Um das Jahr 1804 überschritt die Weltbevölkerung die Anzahl von einer Milliarde Menschen.",
    "de|Weltbevölkerung|Nach dem Weltbevölkerungsbericht des Bevölkerungsfonds der Vereinten Nationen wurde die Acht-Milliarden-Menschen-Marke am 15.",
    "de|Weltbevölkerung|November 2022 überschritten",
  ],
  wa1: [
    "de|Süßwasser|Der Anteil des Süßwassers am Wasserhaushalt der Erde ist je nach Schätzung mit 2,6 bis 3,5 % sehr gering; ein erheblicher Anteil des globalen Süßwasservorkommen ist in Eis in Form von Gletschern, im Eis der Polkappen oder in Permafrostböden gebunden",
  ],
};

const animations = [
  {
    id: "a-weltbevoelkerung", scene: "population", renderer: "svg-scene", category: "culture", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "wb1", predict: [3, 2],
    sources: [wiki("Weltbevölkerung"), wikiEn("World_population")],
    de: {
      title: "Die Weltbevölkerung im Zeitraffer", summary: "Von einer auf acht Milliarden Menschen – und warum jede Milliarde schneller kam als die vorige.",
      goal: "Du kannst beschreiben, wie die Weltbevölkerung seit 1804 gewachsen ist und warum das Wachstum heute langsamer wird.",
      labels: ["Menschen auf der Erde", "1 Milliarde", "2 Milliarden", "3 Milliarden", "4 Milliarden", "5 Milliarden", "6 Milliarden", "7 Milliarden", "8 Milliarden", "Jahre bis zur nächsten Milliarde", "Prognose", "10,3 Milliarden (2084)"],
      steps: [
        ["Um das Jahr 1804 lebten erstmals eine Milliarde Menschen auf der Erde – nach Jahrtausenden langsamen Wachstums.", 7],
        ["Bis zur zweiten Milliarde dauerte es noch 123 Jahre: Sie war 1927 erreicht.", 7],
        ["Dann ging es immer schneller: 3 Milliarden 1960, 4 Milliarden 1974, 5 Milliarden 1987, 6 Milliarden 1999 – alle 12 bis 14 Jahre eine Milliarde mehr.", 9],
        ["7 Milliarden waren es 2011, und im November 2022 wurde die Marke von 8 Milliarden überschritten. Im August 2026 lebten rund 8,4 Milliarden Menschen auf der Erde.", 9],
        ["Das Wachstum wird aber langsamer: Seit Ende der 1980er Jahre kommen jedes Jahr ungefähr gleich viele Menschen hinzu, rund 80 Millionen – anteilig also immer weniger. Nach Prognosen geht das Wachstum bis etwa 2084 weiter, auf rund 10,3 Milliarden.", 10],
      ],
      predict: ["Von 1 auf 2 Milliarden dauerte es 123 Jahre. Wie lange dauerte es von 7 auf 8 Milliarden?", "Rund 60 Jahre", "Rund 30 Jahre", "Rund 11 Jahre"],
    },
    en: {
      title: "The world population in time-lapse", summary: "From one to eight billion people – and why each billion came faster than the last.",
      goal: "You can describe how the world population has grown since 1804 and why the growth is slowing today.",
      labels: ["people on Earth", "1 billion", "2 billion", "3 billion", "4 billion", "5 billion", "6 billion", "7 billion", "8 billion", "years to the next billion", "forecast", "10.3 billion (2084)"],
      steps: [
        "Around the year 1804, a billion people lived on Earth for the first time – after thousands of years of slow growth.",
        "It took another 123 years to reach the second billion: in 1927.",
        "Then it went faster and faster: 3 billion in 1960, 4 billion in 1974, 5 billion in 1987, 6 billion in 1999 – another billion every 12 to 14 years.",
        "It was 7 billion in 2011, and in November 2022 the mark of 8 billion was passed. In August 2026 about 8.4 billion people lived on Earth.",
        "But growth is slowing: since the late 1980s about the same number of people have been added each year, around 80 million – so a smaller and smaller share. Forecasts see growth continuing until about 2084, to around 10.3 billion.",
      ],
      predict: ["Going from 1 to 2 billion took 123 years. How long did it take from 7 to 8 billion?", "About 60 years", "About 30 years", "About 11 years"],
    },
  },
  {
    id: "a-wasser", scene: "water", renderer: "svg-scene", category: "earth", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "wa1", predict: [2, 2],
    sources: [wikiEn("Water_distribution_on_Earth"), wiki("Süßwasser")],
    de: {
      title: "Wie viel Wasser hat die Erde?", summary: "Alles Wasser der Erde als 100 Liter – und wie wenig davon in Seen und Flüssen fließt.",
      goal: "Du kannst erklären, wie wenig des Wassers auf der Erde Süßwasser ist und wie wenig davon flüssig an der Oberfläche liegt.",
      labels: ["alles Wasser der Erde", "1,386 Milliarden km³ – hier als 100 Liter", "Salzwasser: 97,5 l", "Süßwasser: 2,5 l", "fast alles Eis, Schnee, Grundwasser", "flüssig an der Oberfläche: 7,5 ml", "Seen 87 %", "Sümpfe 11 %", "Flüsse 2 % = 0,15 ml"],
      steps: [
        ["Alles Wasser der Erde zusammen sind rund 1,386 Milliarden Kubikkilometer. Stell es dir als 100 Liter vor.", 7],
        ["Davon sind 97,5 Liter Salzwasser – vor allem in den Meeren. Nur 2,5 Liter sind Süßwasser.", 8],
        ["Und auch davon ist fast alles Eis, Schnee, Grundwasser oder Bodenfeuchte. Flüssig an der Oberfläche liegen nur 0,3 % des Süßwassers – von unseren 100 Litern gerade 7,5 Milliliter.", 9],
        ["Diese 7,5 Milliliter verteilen sich auf Seen (87 %), Sümpfe (11 %) und Flüsse (nur 2 %). Alle Flüsse der Erde wären in unserem Bild 0,15 Milliliter.", 9],
      ],
      predict: ["Von den 2,5 Litern Süßwasser: Wie viel liegt flüssig an der Oberfläche – in Seen, Sümpfen und Flüssen?", "Gut die Hälfte, rund 1,5 Liter", "Rund ein Zehntel, 0,25 Liter", "Nur 7,5 Milliliter"],
    },
    en: {
      title: "How much water does the Earth have?", summary: "All the water on Earth as 100 litres – and how little of it flows in lakes and rivers.",
      goal: "You can explain how little of the water on Earth is fresh water and how little of that is liquid on the surface.",
      labels: ["all the water on Earth", "1.386 billion km³ – here as 100 litres", "salt water: 97.5 l", "fresh water: 2.5 l", "almost all ice, snow, groundwater", "liquid on the surface: 7.5 ml", "lakes 87%", "swamps 11%", "rivers 2% = 0.15 ml"],
      steps: [
        "All the water on Earth together is about 1.386 billion cubic kilometres. Imagine it as 100 litres.",
        "Of that, 97.5 litres are salt water – mostly in the oceans. Only 2.5 litres are fresh water.",
        "And almost all of that is ice, snow, groundwater or soil moisture. Only 0.3% of the fresh water is liquid on the surface – from our 100 litres just 7.5 millilitres.",
        "These 7.5 millilitres are shared by lakes (87%), swamps (11%) and rivers (only 2%). All the rivers on Earth would be 0.15 millilitres in our picture.",
      ],
      predict: ["Of the 2.5 litres of fresh water: how much is liquid on the surface – in lakes, swamps and rivers?", "Over half, about 1.5 litres", "About a tenth, 0.25 litres", "Only 7.5 millilitres"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
