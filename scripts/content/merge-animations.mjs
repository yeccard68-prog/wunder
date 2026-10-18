// Merges 3D animations written in the compact batch form into content/animations.json (idempotent).
// One animation: { id, scene, category, timing: [pace, motion], sources, quiz, predict: [step, correct],
//   de: { title, summary, goal, labels, steps: [text, seconds][], predict: [question, …options] },
//   en: { title, summary, goal, labels, steps: text[], predict: [question, …options] } }
import fs from "node:fs";

export const wiki = (title) => ({ name: "Wikipedia: " + title.replaceAll("_", " "), url: "https://de.wikipedia.org/wiki/" + title });

export function mergeAnimations(animations, { today, verification }) {
  const file = "content/animations.json";
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  animations.forEach((a, n) => {
    const [step, correct] = a.predict;
    const row = {
      language: "de", renderer: "three", fallback_scene: a.fallback ?? null, min_age: a.minAge ?? 10, difficulty: a.difficulty ?? 2, verification_status: verification, status: "published",
      created_at: new Date(Date.parse(today + "T12:00:00Z") - n * 3_600_000).toISOString().replace(".000Z", "Z"),
      id: a.id, category_id: a.category, scene: a.scene, title: a.de.title, summary: a.de.summary, goal: a.de.goal, labels: a.de.labels,
      steps: a.de.steps.map(([text, seconds]) => ({ text, seconds })), sources: a.sources, quiz_question_id: a.quiz,
      translations: { en: { title: a.en.title, summary: a.en.summary, goal: a.en.goal, labels: a.en.labels, steps: a.en.steps, predict: { question: a.en.predict[0], options: a.en.predict.slice(1) } } },
      timing: { pace: a.timing[0], motion: a.timing[1] },
      predict: { step, question: a.de.predict[0], options: a.de.predict.slice(1), correct },
    };
    if (row.labels.length !== row.translations.en.labels.length || row.steps.length !== row.translations.en.steps.length) throw new Error(`${a.id}: languages differ`);
    if (step < 1 || step >= row.steps.length || !row.predict.options[correct] || row.predict.options.length !== row.translations.en.predict.options.length) throw new Error(`${a.id}: prediction`);
    const i = list.findIndex((x) => x.id === a.id);
    if (i >= 0) list[i] = { ...row, created_at: list[i].created_at };
    else list.push(row);
  });
  fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n");
  console.log(`${animations.length} animations merged; ${list.length} in total.`);
}
