// Content batch (15.10.2026): the first own clips, made with Remotion (video/). Every number in them is computed
// in the clip's code from the facts below; nothing is filmed or taken from others. One video per language,
// because the picture contains labels: <id>.mp4 (German) and <id>.en.mp4 (English).
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-clips-5.mjs && npm --prefix video run render
import fs from "node:fs";

export const LOCALE = "en";
export const TODAY = "2026-10-15";
export const verification = "ai_checked";

const W = "https://de.wikipedia.org/wiki/";
const wiki = (title) => ({ name: "Wikipedia: " + title.replaceAll("_", " "), url: W + title });
const own = (id, category_id, min_age, tags, sources, de, en, quiz) => ({
  id, category_id, min_age, tags, title: de[0], hook: de[1], description: de[2], captions: de[3],
  en: { title: en[0], hook: en[1], description: en[2], captions: en[3], file: `/clips/${id}.en.mp4`, poster: `/clips/${id}.en.jpg` },
  quiz, creator_name: "Wunder Redaktion", license: "Eigene Produktion", source: sources[0], sources, format: "animated_fact",
  production: { provider: "remotion", composition: id, start: 0, end: 10 },
});

export const videos = [
  own("v-zinseszins", "economy", 13, ["Geld", "Zinsen"], [wiki("Zinseszins")],
    ["Wie aus 1.000 € über 7.600 € werden", "Mit Zinseszins wächst Geld nicht gleichmäßig, sondern immer schneller – weil auch die Zinsen wieder Zinsen bringen.",
      "Angenommen, 1.000 € bringen 30 Jahre lang 7 % Zinsen pro Jahr, und die Zinsen bleiben angelegt. Dann wächst das Geld auf rund 7.612 €. Ohne Zinseszins – wenn man sich die Zinsen jedes Jahr auszahlen lässt – wären es nur 3.100 €: 1.000 € plus 30-mal 70 €. Der Unterschied entsteht, weil beim Zinseszins auch die Zinsen der Vorjahre mitverzinst werden. Bei 7 % verdoppelt sich der Betrag etwa alle zehn Jahre. Steuern, Gebühren und Inflation lässt die Rechnung weg.",
      ["1.000 €, 7 % Zinsen pro Jahr – und die Zinsen bleiben angelegt.", "Jedes Jahr werden auch die Zinsen der Vorjahre verzinst.", "Nach 30 Jahren: rund 7.612 € statt 3.100 € ohne Zinseszins."]],
    ["How €1,000 becomes more than €7,600", "With compound interest, money doesn't grow evenly but faster and faster – because the interest earns interest too.",
      "Suppose €1,000 earns 7% interest a year for 30 years and the interest stays invested. The money grows to about €7,612. Without compounding – taking the interest out every year – it would be just €3,100: €1,000 plus 30 times €70. The difference arises because compounding also pays interest on the interest of previous years. At 7%, the amount roughly doubles every ten years. The calculation leaves out taxes, fees and inflation.",
      ["€1,000 at 7% interest a year – and the interest stays invested.", "Every year the interest of previous years earns interest too.", "After 30 years: about €7,612 instead of €3,100 without compounding."]],
    ["1.000 € bringen 30 Jahre lang 7 % Zinsen pro Jahr, die Zinsen bleiben angelegt. Wie viel ist es am Ende ungefähr?", ["Rund 7.600 €", "Rund 3.100 €", "Rund 2.100 €", "Rund 21.000 €"], 0,
      "1.000 € · 1,07³⁰ ≈ 7.612 €. Ohne Zinseszins wären es 1.000 € + 30 · 70 € = 3.100 €.",
      "€1,000 earns 7% interest a year for 30 years, and the interest stays invested. Roughly how much is it at the end?", ["About €7,600", "About €3,100", "About €2,100", "About €21,000"],
      "€1,000 · 1.07³⁰ ≈ €7,612. Without compounding it would be €1,000 + 30 · €70 = €3,100."]),

  own("v-pyramide-mond", "history", 10, ["Antike", "Zeitgefühl"], [wiki("Kleopatra_VII."), wiki("Cheops-Pyramide"), wiki("Apollo_11")],
    ["Kleopatra lebte näher an der Mondlandung als am Bau der Pyramide", "Zwischen der Cheops-Pyramide und Kleopatra liegen rund 2.500 Jahre – zwischen Kleopatra und der Mondlandung nur gut 2.000.",
      "Die Cheops-Pyramide entstand unter Pharao Cheops, der etwa 2620 bis 2580 v. Chr. regierte. Kleopatra VII., die letzte Herrscherin der Ptolemäer, wurde 69 v. Chr. geboren – rund 2.500 Jahre später. Von ihrer Geburt bis zur ersten Mondlandung am 20. Juli 1969 vergingen dagegen nur etwa 2.040 Jahre. Für Kleopatra war die Große Pyramide also schon ein uraltes Bauwerk. Der Zeitstrahl im Clip ist maßstabsgetreu; weil es kein Jahr 0 gibt, zählt der Übergang von v. Chr. zu n. Chr. ein Jahr weniger.",
      ["Die Cheops-Pyramide entstand um 2600 v. Chr.", "Kleopatra wurde 69 v. Chr. geboren – rund 2.500 Jahre später.", "Bis zur Mondlandung 1969 vergingen nur gut 2.000 Jahre."]],
    ["Cleopatra lived closer to the Moon landing than to the building of the pyramid", "About 2,500 years separate the Great Pyramid from Cleopatra – but only just over 2,000 separate Cleopatra from the Moon landing.",
      "The Great Pyramid was built under Pharaoh Khufu, who reigned from about 2620 to 2580 BC. Cleopatra VII, the last ruler of the Ptolemies, was born in 69 BC – some 2,500 years later. From her birth to the first Moon landing on 20 July 1969, on the other hand, only about 2,040 years passed. To Cleopatra, the Great Pyramid was already an ancient monument. The timeline in the clip is to scale; since there is no year 0, the step from BC to AD counts one year less.",
      ["The Great Pyramid was built around 2600 BC.", "Cleopatra was born in 69 BC – some 2,500 years later.", "Only just over 2,000 years passed until the Moon landing in 1969."]],
    ["Was liegt zeitlich näher an Kleopatras Geburt (69 v. Chr.)?", ["Die erste Mondlandung 1969", "Der Bau der Cheops-Pyramide", "Beides ist etwa gleich weit entfernt"], 0,
      "Bis zur Mondlandung sind es rund 2.040 Jahre, zurück zum Pyramidenbau unter Cheops (etwa 2620–2580 v. Chr.) rund 2.500.",
      "Which is closer in time to Cleopatra's birth (69 BC)?", ["The first Moon landing in 1969", "The building of the Great Pyramid", "Both are about equally far away"],
      "It is about 2,040 years to the Moon landing, but about 2,500 back to the building of the pyramid under Khufu (about 2620–2580 BC)."]),

  own("v-marathon-runden", "sport", 10, ["Laufen", "Olympia"], [wiki("Marathonlauf"), { name: "Wikipedia (englisch): Running track", url: "https://en.wikipedia.org/wiki/Running_track" }],
    ["Ein Marathon im Stadion: 105 Runden und 195 Meter", "42,195 Kilometer klingen abstrakt. Auf einer 400-Meter-Bahn wären es über 105 Runden.",
      "Die Marathonstrecke ist seit 1921 auf 42,195 Kilometer festgelegt. Eine Wettkampf-Laufbahn ist auf der innersten Bahn 400 Meter lang. 42.195 geteilt durch 400 ergibt 105,49: 105 volle Runden und noch 195 Meter. Gelaufen wird ein Marathon meist auf Straßen; bei großen Meisterschaften endet die Strecke oft mit einer Runde im Stadion.",
      ["Die Marathonstrecke: seit 1921 genau 42,195 Kilometer.", "Eine Runde auf der Stadionbahn misst 400 Meter.", "Macht 105 Runden – und noch 195 Meter."]],
    ["A marathon in the stadium: 105 laps and 195 metres", "42.195 kilometres sounds abstract. On a 400-metre track it would be more than 105 laps.",
      "The marathon distance has been fixed at 42.195 kilometres since 1921. A competition running track is 400 metres long in the innermost lane. 42,195 divided by 400 is 105.49: 105 full laps plus another 195 metres. A marathon is usually run on roads; at major championships the course often ends with a lap in the stadium.",
      ["The marathon distance: exactly 42.195 kilometres since 1921.", "One lap of a stadium track is 400 metres.", "That makes 105 laps – plus another 195 metres."]],
    ["Wie viele Runden auf einer 400-Meter-Bahn ergeben ungefähr einen Marathon?", ["Gut 105", "Gut 42", "Genau 100", "Gut 210"], 0,
      "42.195 m : 400 m = 105,49 – also 105 Runden und 195 Meter.",
      "Roughly how many laps of a 400-metre track make a marathon?", ["Just over 105", "Just over 42", "Exactly 100", "Just over 210"],
      "42,195 m ÷ 400 m = 105.49 – so 105 laps and 195 metres."]),
];

// keep the Remotion clip list in step with this batch
const clips = JSON.parse(fs.readFileSync(new URL("../../video/src/clips.json", import.meta.url), "utf8"));
for (const v of videos) if (!clips.some((c) => c.id === v.id)) throw new Error(`${v.id} is missing in video/src/clips.json`);
