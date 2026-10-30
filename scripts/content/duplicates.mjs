// Finds hand-written content that says nearly the same thing twice: questions among each other and questions
// against "Wusstest du?" facts. Compares the words of the question and its answer (or of the fact) and lists
// pairs that share most of them, or that have the same answer and share many words. A list for a person to
// read – nothing is changed.
//   node scripts/content/duplicates.mjs [min similarity, default 0.45]
import fs from "node:fs";

const MIN = Number(process.argv[2] ?? 0.45);
const STOP = new Set("aber alle also auch beim bevor dabei damit dann darum dass dein deine denen dessen diese diesem diesen dieser dieses doch eine einem einen einer eines etwa euch gibt habe haben hatte hatten heute hier ihre ihrem ihren ihrer immer jede jedem jeden jeder jedes kann kein keine können mehr meist mich nach nicht noch oder ohne schon sehr sein seine seit selbst sich sind sondern über unter viele vier vom von wann warum was weil welche welchem welchen welcher welches wenn werden wieder wird wurde wurden zwei drei zwischen stimmt bitte etwa rund ungefähr heißt nennt".split(" "));
const words = (text) =>
  new Set(text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ß ]+/g, " ").split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w))
    .map((w) => (w.length > 6 ? w.replace(/(en|er|es|em|e|n|s)$/, "") : w)));
const jaccard = (a, b) => {
  let both = 0;
  for (const w of a) if (b.has(w)) both++;
  return both / (a.size + b.size - both || 1);
};

const questions = JSON.parse(fs.readFileSync("content/questions.json", "utf8")).filter((q) => q.status === "published");
const facts = JSON.parse(fs.readFileSync("content/facts.json", "utf8")).filter((f) => f.status === "published");
const answer = (q) => (q.kind === "question" || !q.kind ? q.options?.[q.correct_index] ?? "" : q.kind === "fact" ? "" : "");
const entries = [
  ...questions.map((q) => ({ id: q.id, what: "Frage", text: `${q.question} → ${answer(q)}`, words: words(`${q.question} ${answer(q)}`), answer: answer(q).toLowerCase().trim() })),
  ...facts.map((f) => ({ id: f.id, what: "Fakt", text: f.text, words: words(f.text), answer: "" })),
];

const pairs = [];
for (let i = 0; i < entries.length; i++)
  for (let j = i + 1; j < entries.length; j++) {
    const a = entries[i], b = entries[j];
    if (a.words.size < 2 || b.words.size < 2) continue;
    const s = jaccard(a.words, b.words);
    const sameAnswer = a.answer && a.answer === b.answer && a.answer.length > 3;
    if (s >= MIN || (sameAnswer && s >= 0.25)) pairs.push({ s, sameAnswer, a, b });
  }
pairs.sort((x, y) => y.s - x.s);
for (const { s, sameAnswer, a, b } of pairs)
  console.log(`${s.toFixed(2)}${sameAnswer ? " gleiche Antwort" : ""}\n  ${a.what} ${a.id}: ${a.text}\n  ${b.what} ${b.id}: ${b.text}`);
console.log(`\n${pairs.length} Paare (${entries.length} Inhalte geprüft, Schwelle ${MIN}).`);
