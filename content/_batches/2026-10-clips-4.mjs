// Content batch (15.10.2026): two clips from Wikimedia Commons – Taiko drums at a Bon festival in Tokyo (CC BY 2.0)
// and a potter's wheel (CC BY-SA 4.0). Sources with licence and author: 2026-10-clip-sources-4.json.
// Left out after the contact sheets: a glass factory (only wide shots of the hall) and a second Taiko clip (too far away).
//   node scripts/content/apply-batch.mjs content/_batches/2026-10-clips-4.mjs && npm run clips:build -- v-taiko v-toepferscheibe
import fs from "node:fs";

export const LOCALE = "en";
export const TODAY = "2026-10-15";
export const verification = "ai_checked";

const src = JSON.parse(fs.readFileSync(new URL("./2026-10-clip-sources-4.json", import.meta.url), "utf8"));
const LICENSE = (s) => (/public/i.test(s.license) ? "Gemeinfrei" : /cc0/i.test(s.license) ? "CC0 (gemeinfrei)" : `${s.license}, ${s.by} – bearbeitet (Ausschnitt, Hochformat)`);
const AUTHOR = { taiko: "Guilhem Vellut" };

const clip = (key, id, category_id, min_age, cut, de, en, quiz, tags, format = "footage") => {
  const s = { ...src[key], by: AUTHOR[key] ?? src[key].author };
  const [start, end, mode = "crop", x = 0.5, extra = {}] = cut;
  return {
    id, category_id, min_age, tags, title: de[0], hook: de[1], description: de[2], captions: de[3], en: { title: en[0], hook: en[1], description: en[2], captions: en[3] }, quiz,
    creator_name: s.by, license: LICENSE(s), source: { name: s.source, url: s.page }, format,
    production: { provider: "external", cache: key, source_url: s.url, start, end, mode, x, ...extra },
  };
};

export const videos = [
  clip("taiko", "v-taiko", "culture", 13, [26, 36, "tall", 0.56],
    ["Trommeln mit dem ganzen Körper", "Taiko-Trommeln sind in Japan bei vielen Festen zu hören – gespielt mit Kraft, Takt und großen Bewegungen.", "Eine Taiko-Gruppe beim Bon-Tanzfest am Tempel Tsukiji Hongan-ji in Tokio, 2013. „Taiko“ heißt auf Japanisch „dicke Trommel“; in Japan meint man damit große Röhrentrommeln, die mit Schlägeln gespielt werden. Das Bon-Fest (Obon) ist ein buddhistisches Fest, an dem man der verstorbenen Vorfahren gedenkt – und für viele ein Anlass, die Familie zu besuchen.", ["Taiko heißt „dicke Trommel“.", "Getrommelt wird mit dem ganzen Körper.", "Hier beim Bon-Fest in Tokio, an dem man der verstorbenen Vorfahren gedenkt."]],
    ["Drumming with the whole body", "Taiko drums can be heard at many festivals in Japan – played with power, rhythm and big movements.", "A taiko group at the Bon dance festival at the Tsukiji Hongan-ji temple in Tokyo, 2013. \"Taiko\" means \"fat drum\" in Japanese; in Japan it refers to large barrel drums played with sticks. The Bon festival (Obon) is a Buddhist festival to remember deceased ancestors – and for many an occasion to visit their family.", ["Taiko means \"fat drum\".", "The drumming uses the whole body.", "Here at the Bon festival in Tokyo, when deceased ancestors are remembered."]],
    ["Woran erinnert das japanische Bon-Fest, bei dem oft Taiko gespielt wird?", ["An die verstorbenen Vorfahren", "An den Beginn der Kirschblüte", "An das neue Jahr", "An die Reisernte"], 0, "Obon ist ein buddhistisches Fest zu Ehren der Ahnen. Viele Familien kommen dafür zusammen, und es wird getanzt und getrommelt.", "What does the Japanese Bon festival, where taiko is often played, commemorate?", ["Deceased ancestors", "The start of the cherry blossom", "The new year", "The rice harvest"], "Obon is a Buddhist festival honouring the ancestors. Many families get together for it, and there is dancing and drumming."], ["Musik", "Japan"]),
  clip("toepfer", "v-toepferscheibe", "history", 13, [96, 106, "crop", 0.5],
    ["Eine Erfindung, die sich seit 5.000 Jahren dreht", "Auf der Töpferscheibe entsteht ein Gefäß, das rundum gleich ist – weil sich der Ton unter den Händen dreht.", "Ein Töpfer formt Ton auf einer Töpferscheibe. Weil sich die Scheibe dreht, wird jede Stelle gleich bearbeitet, und das Gefäß wird rotationssymmetrisch. Die älteste bekannte Töpferscheibe stammt aus Mesopotamien und wird auf etwa 3000 v. Chr. datiert; Funde aus dem Industal deuten darauf hin, dass man dort womöglich schon früher mit schnell drehenden Scheiben arbeitete.", ["Ton auf einer sich drehenden Scheibe.", "Durch die Drehung wird das Gefäß rundum gleichmäßig.", "Die älteste bekannte Töpferscheibe stammt aus Mesopotamien – rund 5.000 Jahre alt."]],
    ["An invention that has been turning for 5,000 years", "On the potter's wheel a vessel takes shape that is the same all the way round – because the clay turns under the hands.", "A potter shapes clay on a potter's wheel. Because the wheel turns, every point is worked the same way and the vessel becomes rotationally symmetric. The oldest known potter's wheel comes from Mesopotamia and is dated to around 3000 BC; finds from the Indus Valley suggest that fast-turning wheels may have been used there even earlier.", ["Clay on a turning wheel.", "The turning makes the vessel even all the way round.", "The oldest known potter's wheel comes from Mesopotamia – about 5,000 years old."]],
    ["Woher stammt die älteste bekannte Töpferscheibe?", ["Aus Mesopotamien", "Aus China", "Aus Griechenland", "Aus Mexiko"], 0, "Sie wird auf etwa 3000 v. Chr. datiert; deshalb schreibt man die Erfindung oft den Sumerern zu.", "Where does the oldest known potter's wheel come from?", ["From Mesopotamia", "From China", "From Greece", "From Mexico"], "It is dated to around 3000 BC, which is why the invention is often credited to the Sumerians."], ["Erfindungen", "Antike"]),
];
