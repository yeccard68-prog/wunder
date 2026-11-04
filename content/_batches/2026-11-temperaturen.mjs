// Content batch (04.11.2026): motion graphics "Von eiskalt bis glühend heiß" (a-temperaturen, scene temps) and its check
// question. Temperatures quoted from: Absoluter Nullpunkt "die kleinste mögliche Temperatur, −273,15 Grad Celsius" ·
// Wostok-Station "wurde mit −89,2 °C die bisher (Stand November 2018) tiefste meteorologisch bestimmte Lufttemperatur der
// Erde gemessen" · Siedepunkt "nur der Wert von 100 °C auch die Siedetemperatur unter Normaldruck" · Lava "zwischen 800 °C
// (rhyolithische Lava) und 1200 °C (basaltische Lava)" · Sonne "Diese effektive Strahlungstemperatur beträgt 5778 Kelvin"
// (≈ 5505 °C) and "mit 15,6 Mio. K" in the core · Blitz "auf bis zu 30.000 °C erhitzt".
//   node scripts/content/verify-evidence.mjs content/_batches/2026-11-temperaturen.mjs
//   node scripts/content/apply-batch.mjs content/_batches/2026-11-temperaturen.mjs   → the question
//   node content/_batches/2026-11-temperaturen.mjs                                   → the animation (idempotent)
import { pathToFileURL } from "node:url";
import { balance } from "./_balance.mjs";
import { mergeAnimations, wiki } from "../../scripts/content/merge-animations.mjs";

export const LOCALE = "en";
export const TODAY = "2026-11-04";
export const verification = "ai_checked";

// [id, category, difficulty, minAge, maxAge, question, options, correct, explanation, wiki, enQuestion, enOptions, enExplanation, tags]
export const questions = balance([
  ["wk1", "earth", 2, 10, null, "Wo wurde die tiefste Lufttemperatur der Erde gemessen?", ["An der Wostok-Station in der Antarktis", "In Oimjakon in Sibirien", "Am Nordpol", "Auf dem Gipfel des Mount Everest"], 0,
    "Am 21. Juli 1983, mitten in der Polarnacht, maß man an der russischen Forschungsstation Wostok −89,2 °C – die bisher tiefste meteorologisch bestimmte Lufttemperatur der Erde.", "Wostok-Station",
    "Where was the lowest air temperature on Earth measured?", ["At Vostok Station in Antarctica", "In Oymyakon in Siberia", "At the North Pole", "On the summit of Mount Everest"],
    "On 21 July 1983, in the middle of the polar night, −89.2 °C was measured at the Russian research station Vostok – the lowest air temperature on Earth determined by meteorologists so far.", ["Antarktis", "Klima"]],
]);

export const evidence = {
  wk1: [
    "de|Wostok-Station|Am 21. Juli 1983 – zu Zeiten der antarktischen Polarnacht – wurde mit −89,2 °C die bisher (Stand November 2018) tiefste meteorologisch bestimmte Lufttemperatur der Erde gemessen",
    "de|Wostok-Station|früher sowjetische, heute russische Forschungsstation im Wilkesland in der Ostantarktis",
  ],
};

const animations = [
  {
    id: "a-temperaturen", scene: "temps", renderer: "svg-scene", category: "science", minAge: 10, difficulty: 1, timing: [0.7, 1.0], quiz: "wk1", predict: [6, 2],
    sources: [wiki("Absoluter_Nullpunkt"), wiki("Wostok-Station"), wiki("Siedepunkt"), wiki("Lava"), wiki("Sonne"), wiki("Blitz")],
    de: {
      title: "Von eiskalt bis glühend heiß", summary: "Ein Thermometer, das immer weiter herauszoomt – vom absoluten Nullpunkt bis in den Kern der Sonne.",
      goal: "Du kannst Temperaturen vom absoluten Nullpunkt bis zum Sonnenkern einordnen und siehst, wie weit sie auseinanderliegen.",
      labels: ["absoluter Nullpunkt: −273,15 °C", "Kälterekord, Wostok: −89,2 °C", "Wasser siedet: 100 °C", "Lava: 800 bis 1200 °C", "Sonnenoberfläche: rund 5500 °C", "Blitz: bis 30.000 °C", "Sonnenkern: rund 15,6 Mio. °C", "°C"],
      steps: [
        ["Kälter geht es nicht: Der absolute Nullpunkt liegt bei −273,15 Grad Celsius. Dort beginnt die Kelvin-Skala bei null – eine tiefere Temperatur gibt es nicht.", 6],
        ["Die tiefste je auf der Erde gemessene Lufttemperatur: −89,2 °C, am 21. Juli 1983 an der Wostok-Station in der Antarktis, mitten in der Polarnacht.", 7],
        ["Unter Normaldruck siedet Wasser bei 100 °C. Das ist schon ein weiter Weg vom Kälterekord – aber es geht noch viel heißer.", 6],
        ["Lava kommt mit 800 bis 1200 °C aus dem Vulkan. Damit sie auf das Thermometer passt, zoomt die Skala heraus.", 7],
        ["Die Oberfläche der Sonne strahlt mit 5778 Kelvin – das sind rund 5500 °C.", 7],
        ["Ein Blitz erhitzt die Luft in seinem Kanal schlagartig auf bis zu 30.000 °C – mehr als fünfmal so heiß wie die Oberfläche der Sonne.", 7],
        ["Und im Kern der Sonne herrschen rund 15,6 Millionen Kelvin, praktisch ebenso viele Grad Celsius. Alles bisher Gezeigte schrumpft auf der Skala zu einem Strich am Boden.", 9],
      ],
      predict: ["Die Oberfläche der Sonne hat rund 5500 °C. Wie heiß ist es in ihrem Kern?", "Rund 50.000 °C", "Rund 1 Million °C", "Rund 15 Millionen °C"],
    },
    en: {
      title: "From ice cold to white hot", summary: "A thermometer that keeps zooming out – from absolute zero to the core of the Sun.",
      goal: "You can place temperatures from absolute zero to the core of the Sun and see how far apart they are.",
      labels: ["absolute zero: −273.15 °C", "cold record, Vostok: −89.2 °C", "water boils: 100 °C", "lava: 800 to 1,200 °C", "surface of the Sun: about 5,500 °C", "lightning: up to 30,000 °C", "core of the Sun: about 15.6 m °C", "°C"],
      steps: [
        "It cannot get colder: absolute zero lies at −273.15 degrees Celsius. That is where the kelvin scale starts at zero – there is no lower temperature.",
        "The lowest air temperature ever measured on Earth: −89.2 °C, on 21 July 1983 at Vostok Station in Antarctica, in the middle of the polar night.",
        "At normal pressure, water boils at 100 °C. That is already a long way from the cold record – but it gets much hotter.",
        "Lava comes out of the volcano at 800 to 1,200 °C. To fit it on the thermometer, the scale zooms out.",
        "The surface of the Sun shines at 5,778 kelvin – that is about 5,500 °C.",
        "A lightning bolt suddenly heats the air in its channel to up to 30,000 °C – more than five times as hot as the surface of the Sun.",
        "And in the core of the Sun it is about 15.6 million kelvin, practically as many degrees Celsius. Everything shown so far shrinks to a line at the bottom of the scale.",
      ],
      predict: ["The surface of the Sun is about 5,500 °C. How hot is it in its core?", "About 50,000 °C", "About 1 million °C", "About 15 million °C"],
    },
  },
];

if (import.meta.url === pathToFileURL(process.argv[1]).href) mergeAnimations(animations, { today: TODAY, verification });
