// Applies an annotation batch to content/facts.json: adds a "myth or truth" quiz (quiz, myth, translations.en.myth)
// and/or a counting figure (figure, translations.en.figureSuffix) to existing facts. Run verify-evidence.mjs first.
//   node scripts/content/annotate-facts.mjs content/_batches/2026-10-facts-formats-1.mjs
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/content/annotate-facts.mjs <batch.mjs>");
const { annotations } = await import(pathToFileURL(path.resolve(file)).href);
const target = "content/facts.json";
const list = JSON.parse(fs.readFileSync(target, "utf8"));
let n = 0;
for (const [id, a] of Object.entries(annotations)) {
  const f = list.find((x) => x.id === id);
  if (!f) throw new Error(`no such fact: ${id}`);
  if (a.quiz) f.quiz = a.quiz;
  if (a.myth) f.myth = a.myth;
  if (a.figure) f.figure = a.figure;
  f.translations ??= {};
  f.translations.en ??= { text: f.text, detail: f.detail };
  if (a.mythEn) f.translations.en.myth = a.mythEn;
  if (a.figureSuffixEn) f.translations.en.figureSuffix = a.figureSuffixEn;
  n++;
}
fs.writeFileSync(target, JSON.stringify(list, null, 2) + "\n");
console.log(`${n} facts annotated.`);
