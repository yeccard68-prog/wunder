// Content batch (19.10.2026): two more own clips made with Remotion (video/), numbers computed from the
// facts in the linked articles (checked 18./19.10.2026).
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-clips-6.mjs && npm --prefix video run render -- v-papier-mond v-sonne-masse
import fs from "node:fs";

export const LOCALE = "en";
export const TODAY = "2026-10-19";
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
  own("v-papier-mond", "math", 10, ["Zahlen", "Mond"], [wiki("Exponentielles_Wachstum"), wiki("Mond"), wiki("Internationale_Raumstation"), wiki("Mount_Everest")],
    ["42-mal gefaltet bis zum Mond", "Jedes Falten verdoppelt die Dicke – und Verdoppeln wird schneller riesig, als man denkt.",
      "Ein Blatt Papier ist etwa 0,1 Millimeter dick. Jedes Falten verdoppelt die Dicke. Nach 27 Faltungen wäre der Stapel höher als der Mount Everest (gut 8.848 Meter), nach 32 höher, als die Raumstation ISS fliegt (rund 400 Kilometer), und nach 42 Faltungen wären es rund 440.000 Kilometer – mehr als die mittlere Entfernung zum Mond von 384.400 Kilometern. In Wirklichkeit lässt sich Papier nur wenige Male falten; der Clip zeigt, wie schnell Verdoppeln wächst.",
      ["Ein Blatt Papier: 0,1 Millimeter.", "Jedes Falten verdoppelt die Dicke – nach 27-mal höher als der Everest.", "Nach 42-mal: rund 440.000 Kilometer, weiter als bis zum Mond."]],
    ["Folded 42 times to the Moon", "Every fold doubles the thickness – and doubling gets huge faster than you think.",
      "A sheet of paper is about 0.1 millimetres thick. Each fold doubles the thickness. After 27 folds the stack would be taller than Mount Everest (just over 8,848 metres), after 32 higher than the ISS flies (about 400 kilometres), and after 42 folds it would be about 440,000 kilometres – more than the average distance to the Moon of 384,400 kilometres. In reality paper can only be folded a few times; the clip shows how fast doubling grows.",
      ["A sheet of paper: 0.1 millimetres.", "Every fold doubles the thickness – after 27 it is taller than Everest.", "After 42: about 440,000 kilometres, further than the Moon."]],
    ["Wie oft müsste man ein 0,1 mm dickes Blatt falten, damit der Stapel bis zum Mond reicht?", ["Etwa 42-mal", "Etwa 420-mal", "Etwa 4.200-mal", "Etwa 42.000-mal"], 0,
      "0,1 mm · 2⁴² ≈ 440.000 km – mehr als die mittlere Entfernung zum Mond (384.400 km). Verdoppeln wächst extrem schnell.",
      "How many times would you have to fold a 0.1 mm sheet for the stack to reach the Moon?", ["About 42 times", "About 420 times", "About 4,200 times", "About 42,000 times"],
      "0.1 mm · 2⁴² ≈ 440,000 km – more than the average distance to the Moon (384,400 km). Doubling grows extremely fast."]),

  own("v-sonne-masse", "science", 10, ["Weltraum", "Sonne"], [wiki("Sonne")],
    ["Die Sonne wiegt fast alles", "Von 1.000 Teilen der Masse im Sonnensystem gehören fast 999 der Sonne.",
      "Die Sonne enthält 99,86 % der Masse des Sonnensystems. Teilt man diese Masse in 1.000 gleiche Teile, gehören 998,6 davon der Sonne. Für alle acht Planeten, ihre Monde, die Asteroiden und Kometen zusammen bleiben nur 1,4 Teile. Ihr Durchmesser ist etwa 110-mal so groß wie der der Erde.",
      ["Die Masse des Sonnensystems in 1.000 Teilen.", "998,6 davon gehören der Sonne.", "Für alle Planeten, Monde und Kometen bleiben 1,4 Teile."]],
    ["The Sun weighs almost everything", "Of 1,000 parts of the solar system's mass, almost 999 belong to the Sun.",
      "The Sun holds 99.86% of the solar system's mass. Split that mass into 1,000 equal parts and 998.6 of them belong to the Sun. All eight planets, their moons, the asteroids and comets together share just 1.4 parts. Its diameter is about 110 times that of Earth.",
      ["The solar system's mass in 1,000 parts.", "998.6 of them belong to the Sun.", "All planets, moons and comets share 1.4 parts."]],
    ["Welcher Anteil der Masse des Sonnensystems steckt in der Sonne?", ["Rund 99,9 %", "Rund 75 %", "Rund 50 %", "Rund 10 %"], 0,
      "Es sind 99,86 %. Alle Planeten, Monde, Asteroiden und Kometen zusammen machen nur rund 0,14 % aus.",
      "What share of the solar system's mass is in the Sun?", ["About 99.9%", "About 75%", "About 50%", "About 10%"],
      "It is 99.86%. All planets, moons, asteroids and comets together make up only about 0.14%."]),
];

const clips = JSON.parse(fs.readFileSync(new URL("../../video/src/clips.json", import.meta.url), "utf8"));
for (const v of videos) if (!clips.some((c) => c.id === v.id)) throw new Error(`${v.id} is missing in video/src/clips.json`);
