// Which clip titles give away the answer of the clip's quiz? The live app never receives the answers, so it cannot
// check this itself – this script does it with the local content and writes only the clip ids (per language) to
// content/quiz-leaks.json. Until its quiz is answered, such a clip shows a neutral heading instead of its title.
//   node scripts/content/quiz-leaks.mjs          → writes the file
//   node scripts/content/quiz-leaks.mjs --check  → exit 1 if the file is out of date (used by the tests)
import fs from "node:fs";

const read = (n) => JSON.parse(fs.readFileSync(`content/${n}.json`, "utf8"));
const questions = new Map(read("questions").map((q) => [q.id, q]));
// titles that hint at the answer in other words – checked by hand (both languages)
const MANUAL = new Set(["v-person-beethoven", "v-person-vangogh"]);
const STOP = new Set(["wird", "wurde", "werden", "sich", "sind", "dass", "with", "they", "them", "that", "this", "were","etwa", "rund", "mehr", "als", "nicht", "eine", "einer", "einen", "einem", "the", "about", "more", "than", "with", "from", "into", "over"]);
const norm = (s) => s.toLowerCase().normalize("NFC").replace(/(\d)[.,\s](?=\d{3}\b)/g, "$1");
const tokens = (answer) => {
  const a = norm(answer);
  const numbers = a.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const words = (a.match(/\p{L}{4,}/gu) ?? []).filter((w) => !STOP.has(w));
  return { numbers, words };
};
export function givesAway(title, answer) {
  const t = norm(title);
  const { numbers, words } = tokens(answer);
  return numbers.some((n) => new RegExp(`(^|\\D)${n.replace(".", "\\.")}(\\D|$)`).test(t)) || words.some((w) => t.includes(w.slice(0, Math.max(4, w.length - 2))));
}

const out = { de: [], en: [] };
for (const v of read("videos")) {
  const q = v.quiz_question_id && questions.get(v.quiz_question_id);
  if (!q || q.correct_index == null) continue;
  if (MANUAL.has(v.id) || givesAway(v.title, q.options[q.correct_index])) out.de.push(v.id);
  const en = q.translations?.en;
  if (en && v.translations?.en?.title && (MANUAL.has(v.id) || givesAway(v.translations.en.title, en.options[q.correct_index]))) out.en.push(v.id);
}
out.de.sort();
out.en.sort();
const text = JSON.stringify(out, null, 2) + "\n";
if (process.argv.includes("--check")) {
  const now = fs.existsSync("content/quiz-leaks.json") ? fs.readFileSync("content/quiz-leaks.json", "utf8") : "";
  if (now !== text) { console.log("content/quiz-leaks.json is out of date – run node scripts/content/quiz-leaks.mjs"); process.exit(1); }
  console.log("quiz-leaks ok");
} else {
  fs.writeFileSync("content/quiz-leaks.json", text);
  console.log(`titles that give the answer away: ${out.de.length} (de), ${out.en.length} (en)`);
}
