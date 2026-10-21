// The social media package: renders the own clips with a quiz end card and "Did you know?" picture posts from the
// source-checked facts, and writes a 30-day posting plan with captions and hashtags (docs/SOCIAL-PLAN.md).
// Everything is rendered on this machine; the files land in video/out/social/ (not in git – upload them by hand).
//   npm --prefix video run social            → German (default)
//   npm --prefix video run social -- en      → English
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const CLI = path.join(here, "node_modules/@remotion/cli/remotion-cli.js");
const locale = process.argv[2] === "en" ? "en" : "de";
const read = (f) => JSON.parse(fs.readFileSync(path.join(app, "content", f), "utf8"));
const videos = read("videos.json");
const questions = read("questions.json");
const facts = read("facts.json");
const clipIds = JSON.parse(fs.readFileSync(path.join(here, "src/clips.json"), "utf8")).map((c) => c.id);

const COLORS = { science: "#41c7b4", technology: "#9794ff", history: "#e2ab4f", earth: "#7fc66a", economy: "#6db3f2", business: "#f08a6c", culture: "#e58bb8", math: "#d6c35a", language: "#6ccbdc", sport: "#f09a6e" };
const AREA = {
  de: { animals: "Tiere", body: "Körper", space: "Weltraum", food: "Essen & Trinken", nature: "Natur & Erde", tech: "Technik", history: "Geschichte", language: "Sprache", money: "Geld", culture: "Kunst & Kultur", sport: "Sport", numbers: "Zahlen", curious: "Kurioses" },
  en: { animals: "Animals", body: "Body", space: "Space", food: "Food & drink", nature: "Nature & Earth", tech: "Technology", history: "History", language: "Language", money: "Money", culture: "Art & culture", sport: "Sport", numbers: "Numbers", curious: "Curious" },
}[locale];
const TAGS = {
  de: { base: "#wusstestdu #allgemeinwissen #fakten #lernen", science: "#wissenschaft #weltraum", technology: "#technik", history: "#geschichte", earth: "#natur #tiere", economy: "#wirtschaft #geld", business: "#marken #business", culture: "#kultur", math: "#mathe #zahlen", language: "#sprache #wörter", sport: "#sport" },
  en: { base: "#didyouknow #generalknowledge #facts #learnontiktok", science: "#science #space", technology: "#tech", history: "#history", earth: "#nature #animals", economy: "#economics #money", business: "#brands #business", culture: "#culture", math: "#math #numbers", language: "#language #words", sport: "#sports" },
}[locale];
const tr = (row, key) => (locale === "en" ? row.translations?.en?.[key] : null) ?? row[key];
const LINK = "wunder-one.vercel.app";

// clips: own productions with their quiz question
const clips = clipIds.map((id) => {
  const v = videos.find((x) => x.id === id);
  const q = questions.find((x) => x.id === v.quiz_question_id);
  return { clipId: id, locale, question: tr(q, "question"), options: tr(q, "options"), title: tr(v, "title"), hook: tr(v, "hook"), category: v.category_id };
});

// facts: 24, spread over the topics (round robin), newest first within a topic
const byCat = new Map();
for (const f of [...facts].filter((f) => f.status === "published" && (f.min_age ?? 10) <= 13).sort((a, b) => b.created_at.localeCompare(a.created_at))) {
  if (!byCat.has(f.category_id)) byCat.set(f.category_id, []);
  byCat.get(f.category_id).push(f);
}
const picked = [];
while (picked.length < 24 && [...byCat.values()].some((l) => l.length)) for (const l of byCat.values()) if (l.length && picked.length < 24) picked.push(l.shift());
const factPosts = picked.map((f) => ({
  id: f.id, locale, color: COLORS[f.category_id] ?? "#ff6d48",
  kicker: `${locale === "de" ? "Wusstest du?" : "Did you know?"} · ${AREA[f.area] ?? f.area}`,
  text: tr(f, "text"), detail: tr(f, "detail"),
  source: (locale === "de" ? "Quelle: " : "Source: ") + f.sources.map((s) => s.name.replace(/^Wikipedia(?: \(englisch\))?: /, "Wikipedia – ")).join(", "),
  category: f.category_id,
}));

fs.writeFileSync(path.join(here, "src/social.json"), JSON.stringify({ clips: clips.map(({ clipId, locale, question, options }) => ({ clipId, locale, question, options })), facts: factPosts.map(({ category, ...p }) => p) }, null, 2) + "\n");

// render
const out = path.join(here, "out/social", locale);
fs.mkdirSync(path.join(out, "clips"), { recursive: true });
fs.mkdirSync(path.join(out, "facts"), { recursive: true });
const remotion = (...args) => execFileSync(process.execPath, [CLI, ...args], { cwd: here, stdio: "inherit" });
if (!process.argv.includes("--plan-only")) {
  for (const c of clips) remotion("render", "src/index.ts", `social-${c.clipId}-${locale}`, path.join(out, "clips", `${c.clipId}.mp4`), "--codec=h264", "--crf=20", "--pixel-format=yuv420p", "--muted", "--log=error");
  for (const f of factPosts) remotion("still", "src/index.ts", `fact-${f.id}-${locale}`, path.join(out, "facts", `${f.id}.png`), "--log=error");
}

// the 30-day plan: a clip every fifth day, facts in between
const days = [];
let ci = 0, fi = 0;
for (let d = 1; d <= 30; d++) {
  if ((d % 5 === 1 && ci < clips.length) || fi >= factPosts.length) {
    const c = clips[ci++];
    if (!c) break;
    days.push({ d, kind: locale === "de" ? "Video" : "Video", file: `clips/${c.clipId}.mp4`, caption: `${c.hook}\n\n${locale === "de" ? "Weißt du die Antwort? Schreib sie in die Kommentare – auflösen tut die App." : "Know the answer? Drop it in the comments – the app has the solution."}\n${LINK}\n\n${TAGS.base} ${TAGS[c.category] ?? ""}` });
  } else {
    const f = factPosts[fi++];
    days.push({ d, kind: locale === "de" ? "Bild" : "Picture", file: `facts/${f.id}.png`, caption: `${f.text}\n\n${locale === "de" ? "Mehr überraschendes Wissen – mit Quelle – jeden Tag in der App." : "More surprising knowledge – with sources – every day in the app."}\n${LINK}\n\n${TAGS.base} ${TAGS[f.category] ?? ""}` });
  }
}
const plan = [
  `## ${locale === "de" ? "Plan (Deutsch)" : "Plan (English)"} – Dateien in \`video/out/social/${locale}/\``,
  "",
  ...days.flatMap((x) => [`### Tag ${x.d} · ${x.kind} · \`${x.file}\``, "", "```", x.caption.trim(), "```", ""]),
].join("\n");
const planFile = path.join(app, "docs", `SOCIAL-PLAN.${locale}.md`);
fs.writeFileSync(planFile, plan + "\n");
console.log(`${clips.length} clips, ${factPosts.length} picture posts → ${out}\nplan → ${planFile}`);
