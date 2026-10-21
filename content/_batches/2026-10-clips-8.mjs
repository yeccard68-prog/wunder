// Content batch (21.10.2026): one more own clip made with Remotion (video/). Numbers computed from the resting heart
// rate the article gives as an example ("ein 70-Jähriger eine Frequenz um die 70 Schläge pro Minute", Herzfrequenz,
// checked 21.10.2026): 70 × 60 = 4,200 an hour, × 24 = 100,800 a day, × 365 = 36,792,000 a year,
// × 80 = 2,943,360,000 in 80 years.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-clips-8.mjs && npm --prefix video run render -- v-herz-schlaege
import fs from "node:fs";

export const LOCALE = "en";
export const TODAY = "2026-10-21";
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
  own("v-herz-schlaege", "science", 10, ["Körper", "Herz"], [wiki("Herzfrequenz"), wiki("Herz")],
    ["So oft schlägt dein Herz", "Pro Tag über 100.000-mal – und in einem langen Leben fast drei Milliarden Mal.",
      "Bei rund 70 Schlägen pro Minute – so viel nennt die Quelle etwa für einen 70-Jährigen in Ruhe – schlägt ein Herz 100.800-mal am Tag und rund 36,8 Millionen Mal im Jahr. In 80 Jahren sind das etwa 2,9 Milliarden Schläge. Der echte Wert schwankt: Er hängt von Belastung, Alter und Fitness ab.",
      ["Rund 70 Schläge pro Minute.", "Das sind über 100.000 am Tag.", "In 80 Jahren: fast drei Milliarden Schläge."]],
    ["How often your heart beats", "More than 100,000 times a day – and almost three billion times in a long life.",
      "At about 70 beats a minute – the source gives this, for example, for a 70-year-old at rest – a heart beats 100,800 times a day and about 36.8 million times a year. In 80 years that is about 2.9 billion beats. The real value varies: it depends on effort, age and fitness.",
      ["About 70 beats a minute.", "That is more than 100,000 a day.", "In 80 years: almost three billion beats."]],
    ["Wie oft schlägt ein Herz in einem 80-jährigen Leben ungefähr?", ["Rund 3 Milliarden Mal", "Rund 3 Millionen Mal", "Rund 30 Millionen Mal", "Rund 300 Milliarden Mal"], 0,
      "Bei 70 Schlägen pro Minute: 70 × 60 × 24 × 365 × 80 ≈ 2,9 Milliarden.",
      "About how often does a heart beat in an 80-year life?", ["About 3 billion times", "About 3 million times", "About 30 million times", "About 300 billion times"],
      "At 70 beats a minute: 70 × 60 × 24 × 365 × 80 ≈ 2.9 billion."]),
];

const clips = JSON.parse(fs.readFileSync(new URL("../../video/src/clips.json", import.meta.url), "utf8"));
for (const v of videos) if (!clips.some((c) => c.id === v.id)) throw new Error(`${v.id} is missing in video/src/clips.json`);
