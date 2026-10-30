// Content batch (30.10.2026): motion graphics "Das Sonnensystem im Fußball-Maßstab" (a-sonnensystem,
// components/anim/scenes.tsx SolarScale) and its check question. Model: the Sun (1.4 million km) as a football of
// 22 cm, so 1 : 6.4 billion – the figures in the animation are computed from the quoted sizes and distances:
//   Sonne: "Ihr Durchmesser ist mit 1,4 Millionen Kilometern etwa 110-mal so groß wie der der Erde"
//   Erde: "Ihr Durchmesser beträgt mehr als 12 700 Kilometer" → 2 mm · Astronomische Einheit: "149597870700 m ≈ 149,6
//   Millionen km" → 23.5 m · Jupiter: "Äquatordurchmesser von 142.976 Kilometern" → 2.3 cm, "durchschnittlichen
//   Entfernung von 778 Millionen Kilometern" → 122 m · Neptun: "Durchmesser von knapp 50.000 Kilometern" → 8 mm,
//   "durchschnittlich 4,5 Milliarden Kilometer von der Sonne entfernt" → 707 m · Proxima Centauri: "4·1013 km" → about
//   6,300 km (the Earth: 12 700 km across, so nearly half) · Fußball: "einen Umfang von mindestens 68 cm und höchstens 70"
//   cm → about 22 cm across.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-sonnensystem.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-sonnensystem.mjs   → the question
//   node content/_batches/2026-10-sonnensystem.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { balance } from "./_balance.mjs";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-10-30";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["es1", "science", 2, 10, null, "Wie viel größer ist der Durchmesser der Sonne als der der Erde – ungefähr?", ["Etwa 10-mal", "Etwa 110-mal", "Etwa 1.100-mal", "Etwa 11.000-mal"], 1,
    "Die Sonne hat einen Durchmesser von rund 1,4 Millionen Kilometern – etwa 110-mal so viel wie die Erde. Wäre die Sonne ein Fußball, wäre die Erde nur so groß wie ein Krümel von 2 Millimetern.", "Sonne",
    "Roughly how much larger is the Sun's diameter than the Earth's?", ["About 10 times", "About 110 times", "About 1,100 times", "About 11,000 times"],
    "The Sun is about 1.4 million kilometres across – about 110 times as much as the Earth. If the Sun were a football, the Earth would be a crumb of just 2 millimetres.", ["Weltraum", "Sonnensystem"]],
]);

export const evidence = {
  es1: ["de|Sonne|Ihr Durchmesser ist mit 1,4 Millionen Kilometern etwa 110-mal so groß wie der der Erde"],
};

const animations = [
  {
    id: "a-sonnensystem", scene: "solarscale", renderer: "svg-scene", category: "science", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "es1", predict: [3, 2],
    sources: [wiki("Sonne"), wiki("Erde"), wiki("Astronomische_Einheit"), wiki("Jupiter_(Planet)"), wiki("Neptun_(Planet)"), wiki("Proxima_Centauri"), wiki("Fußball_(Sportgerät)")],
    de: {
      title: "Das Sonnensystem im Fußball-Maßstab", summary: "Wäre die Sonne ein Fußball: Wie klein wären die Planeten – und wie weit weg?",
      goal: "Du kannst beschreiben, wie klein die Planeten im Vergleich zur Sonne sind und wie riesig die Abstände dazwischen.",
      labels: ["Sonne = Fußball", "22 cm", "Erde", "2 mm", "23,5 m", "Jupiter", "2,3 cm", "122 m", "Neptun", "8 mm", "707 m", "der nächste Stern", "≈ 6.300 km", "fast der halbe Durchmesser der echten Erde", "Maßstab 1 : 6,4 Milliarden"],
      steps: [
        ["Stell dir vor, die Sonne wäre so groß wie ein Fußball – rund 22 Zentimeter. Alles andere schrumpfen wir im selben Verhältnis: 1 zu 6,4 Milliarden.", 8],
        ["Die Erde wäre dann ein Krümel von 2 Millimetern – und läge 23,5 Meter vom Ball entfernt. Dazwischen: fast nichts.", 8],
        ["Jupiter, der größte Planet, wäre eine Murmel von 2,3 Zentimetern in 122 Metern Abstand. Neptun, der äußerste Planet, läge schon gut 700 Meter weit weg.", 9],
        ["Und der nächste Stern, Proxima Centauri? In unserem Modell wäre er rund 6.300 Kilometer entfernt – fast der halbe Durchmesser der echten Erde.", 9],
      ],
      predict: ["Neptun liegt im Modell gut 700 Meter entfernt. Wie weit wäre der nächste Stern?", "Rund 2 Kilometer", "Rund 60 Kilometer", "Rund 6.300 Kilometer"],
    },
    en: {
      title: "The solar system on a football scale", summary: "If the Sun were a football: how small would the planets be – and how far away?",
      goal: "You can describe how small the planets are compared with the Sun, and how huge the distances between them are.",
      labels: ["Sun = football", "22 cm", "Earth", "2 mm", "23.5 m", "Jupiter", "2.3 cm", "122 m", "Neptune", "8 mm", "707 m", "the nearest star", "≈ 6,300 km", "nearly half the diameter of the real Earth", "scale 1 : 6.4 billion"],
      steps: [
        "Imagine the Sun were as big as a football – about 22 centimetres. We shrink everything else in the same ratio: 1 to 6.4 billion.",
        "The Earth would then be a crumb of 2 millimetres – lying 23.5 metres from the ball. In between: almost nothing.",
        "Jupiter, the largest planet, would be a marble of 2.3 centimetres, 122 metres away. Neptune, the outermost planet, would already be over 700 metres away.",
        "And the nearest star, Proxima Centauri? In our model it would be about 6,300 kilometres away – nearly half the diameter of the real Earth.",
      ],
      predict: ["In the model Neptune is just over 700 metres away. How far would the nearest star be?", "About 2 kilometres", "About 60 kilometres", "About 6,300 kilometres"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
