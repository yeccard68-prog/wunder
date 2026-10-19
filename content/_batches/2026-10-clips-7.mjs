// Content batch (19.10.2026): one more own clip made with Remotion (video/). Times computed from the speed of
// light (299,792.458 km/s, exact by definition) and the distances in the linked articles, checked 19.10.2026:
// Moon 384,400 km → 1.28 s; astronomical unit 149,597,870.7 km → 499 s = 8 min 19 s; Proxima Centauri
// 4.247 light-years → about 4.2 years.
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-clips-7.mjs && npm --prefix video run render -- v-licht-reise
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
  own("v-licht-reise", "science", 10, ["Weltraum", "Licht"], [wiki("Lichtgeschwindigkeit"), wiki("Mond"), wiki("Astronomische_Einheit"), wiki("Proxima_Centauri")],
    ["So lange ist Licht unterwegs", "Vom Mond eine gute Sekunde, von der Sonne acht Minuten – und vom nächsten Stern über vier Jahre.",
      "Licht legt im Vakuum 299.792,458 Kilometer pro Sekunde zurück. Bis zum Mond (im Mittel 384.400 Kilometer) braucht es etwa 1,3 Sekunden. Von der Sonne zur Erde (eine Astronomische Einheit, rund 149,6 Millionen Kilometer) sind es etwa 8 Minuten und 19 Sekunden. Vom nächsten Stern, Proxima Centauri, rund 4,2 Lichtjahre entfernt, ist sein Licht gut vier Jahre unterwegs – wir sehen ihn also so, wie er vor über vier Jahren war.",
      ["Bis zum Mond braucht Licht 1,3 Sekunden.", "Von der Sonne zur Erde: 8 Minuten 19 Sekunden.", "Vom nächsten Stern ist es über vier Jahre unterwegs."]],
    ["How long light is on its way", "From the Moon just over a second, from the Sun eight minutes – and from the nearest star more than four years.",
      "In a vacuum light travels 299,792.458 kilometres per second. It takes about 1.3 seconds to reach the Moon (384,400 kilometres away on average). From the Sun to Earth (one astronomical unit, about 149.6 million kilometres) it takes about 8 minutes and 19 seconds. Light from the nearest star, Proxima Centauri, about 4.2 light-years away, travels for more than four years – so we see it as it was over four years ago.",
      ["Light reaches the Moon in 1.3 seconds.", "From the Sun to Earth: 8 minutes 19 seconds.", "From the nearest star it travels for more than four years."]],
    ["Wie lange ist Licht vom nächsten Stern, Proxima Centauri, zu uns unterwegs?", ["Etwa 4 Jahre", "Etwa 4 Tage", "Etwa 4 Stunden", "Etwa 400 Jahre"], 0,
      "Proxima Centauri ist rund 4,2 Lichtjahre entfernt – sein Licht ist also gut vier Jahre unterwegs. Ein Lichtjahr ist die Strecke, die Licht in einem Jahr zurücklegt.",
      "How long does light from the nearest star, Proxima Centauri, take to reach us?", ["About 4 years", "About 4 days", "About 4 hours", "About 400 years"],
      "Proxima Centauri is about 4.2 light-years away – so its light travels for just over four years. A light-year is the distance light covers in one year."]),
];

const clips = JSON.parse(fs.readFileSync(new URL("../../video/src/clips.json", import.meta.url), "utf8"));
for (const v of videos) if (!clips.some((c) => c.id === v.id)) throw new Error(`${v.id} is missing in video/src/clips.json`);
