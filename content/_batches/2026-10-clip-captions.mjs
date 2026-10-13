// Audit of the clip questions (18.10.2026): a question about a clip must be answerable from the
// clip itself. In eight clips the question asked for something the on-screen captions never said
// (it was only in the description). The captions now say it. Every statement was already part of
// the clip's description and of the question's sourced explanation – nothing new is claimed.
//   node content/_batches/2026-10-clip-captions.mjs      (idempotent; rewrites content/videos.json)
import fs from "node:fs";

// id: [caption index, German, English]
const captions = {
  "v-sonne": [2, "Sie besteht vor allem aus Wasserstoff und Helium.", "It consists mainly of hydrogen and helium."],
  "v-keimung": [2, "Wasser, Wärme und Sauerstoff wecken den Keimling – Licht braucht er noch nicht.", "Water, warmth and oxygen wake the embryo – it does not need light yet."],
  "v-erdaufgang": [2, "Die drei von Apollo 8 sehen das als erste Menschen.", "The three of Apollo 8 are the first humans to see it."],
  "v-titanic": [2, "Im April 1912 sinkt sie auf ihrer ersten Fahrt.", "In April 1912 she sinks on her first voyage."],
  "v-orchester": [1, "Vorn die Streicher – die größte Gruppe –, dahinter die Bläser.", "Strings at the front – the largest group – wind players behind."],
  "v-stare": [1, "Im dichten Schwarm kann ein Greifvogel kaum ein Tier fassen.", "In the dense flock a bird of prey can hardly single one out."],
  "v-tropfen": [2, "Die Oberflächenspannung hält ihn zusammen – und zieht das Wasser als Säule zurück.", "Surface tension holds it together – and pulls the water back up as a column."],
  "v-container": [2, "Schiff, Zug, Lkw: Umladen dauert Minuten statt Tage.", "Ship, train, lorry: transfer takes minutes instead of days."],
};

const file = "content/videos.json";
const videos = JSON.parse(fs.readFileSync(file, "utf8"));
let changed = 0;
for (const [id, [i, de, en]] of Object.entries(captions)) {
  const v = videos.find((x) => x.id === id);
  if (!v) throw new Error(`clip ${id} not found`);
  if (v.captions[i] !== de || v.translations.en.captions[i] !== en) changed++;
  v.captions[i] = de;
  v.translations.en.captions[i] = en;
}
fs.writeFileSync(file, JSON.stringify(videos, null, 2) + "\n");
console.log(`${changed} clips changed.`);
