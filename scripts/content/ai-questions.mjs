// Questions written by Claude from Wikipedia articles – every statement with a word-for-word quote from the article,
// checked here before anything is kept. Runs on this computer only; the API key stays in the shell environment
// (ANTHROPIC_API_KEY or an `ant auth login` profile) and never goes into the app.
//   node scripts/content/ai-questions.mjs probe          → 40 articles, about 200 questions, prints the real cost
//   node scripts/content/ai-questions.mjs probe --dry    → only fetches the articles (no API call, no cost)
// Output: content/_ai/<run>.json (kept questions + rejected ones with the reason) – reviewed before any import.
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
const PRICE = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 }; // $ per million tokens (Claude Opus 5.5, standard API)
const PER_ARTICLE = 5;
const UA = "wunder-content/1.0 (learning app; y.eccard68@gmail.com)";

// probe: 40 articles across all topics – no medicine/health, no wars, rulers or living people (content rules of the app)
const PROBE = [
  "Photosynthese", "Plattentektonik", "Schwarzes Loch", "Gezeiten", "Regenbogen", "Bienen", "Korallenriff", "Vulkan",
  "Buchdruck", "Dampfmaschine", "Transistor", "World Wide Web", "Kompass", "Glühlampe", "Künstlicher Satellit", "Brücke",
  "Hanse", "Seidenstraße", "Römerstraße", "Pyramiden von Gizeh", "Stonehenge", "Wikinger",
  "Inflation", "Börse", "Genossenschaft", "Marke (Marketing)", "Fließbandfertigung", "Franchising",
  "Impressionismus", "Oper", "Stummfilm", "Comic", "Märchen",
  "Esperanto", "Alphabet", "Dialekt", "Primzahl", "Kreiszahl", "Olympische Spiele", "Schach",
];

const SYSTEM = `Du schreibst Quizfragen für eine Lern-App für Allgemeinwissen (ab 13 Jahren). Grundlage ist allein der Wikipedia-Artikel, den du bekommst.

Regeln:
- Genau ${PER_ARTICLE} Fragen pro Artikel, verschiedene Aspekte, keine zwei Fragen zum selben Fakt.
- Jede Frage hat genau 4 Antwortmöglichkeiten, genau eine ist richtig. Die falschen sind plausibel, aber laut Artikel eindeutig falsch.
- Die Frage muss ohne die Antwortmöglichkeiten verständlich sein – nicht "Welche dieser …". Die Frage verrät die Antwort nicht.
- Erklärung: 1–2 kurze Sätze, nur mit Aussagen aus dem Artikel.
- evidence: 1–3 Zitate, jeweils WÖRTLICH und zeichengenau aus dem Artikeltext kopiert (zusammenhängende Textstelle, 8–40 Wörter). Sie müssen die richtige Antwort und jede Aussage der Erklärung belegen. Keine Auslassungen, keine eigenen Wörter.
- Nichts zu Gesundheit, Medizin, Ernährung, Krieg, Herrschern oder lebenden Personen; keine Anlageberatung.
- Schreibe einfach und klar. Keine Zahlen, die der Artikel nicht nennt.
- en: dieselbe Frage, dieselben Antworten in derselben Reihenfolge und dieselbe Erklärung auf Englisch.
- category: eine von science, technology, history, earth, economy, business, culture, math, language, sport.
- difficulty: 1 leicht, 2 mittel, 3 schwer.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "options", "correct_index", "explanation", "evidence", "category", "difficulty", "en"],
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correct_index: { type: "integer" },
          explanation: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
          category: { type: "string", enum: ["science", "technology", "history", "earth", "economy", "business", "culture", "math", "language", "sport"] },
          difficulty: { type: "integer" },
          en: {
            type: "object",
            additionalProperties: false,
            required: ["question", "options", "explanation"],
            properties: { question: { type: "string" }, options: { type: "array", items: { type: "string" } }, explanation: { type: "string" } },
          },
        },
      },
    },
  },
};

async function article(title) {
  const r = await fetch(`https://de.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&redirects=1&titles=${encodeURIComponent(title)}`, { headers: { "user-agent": UA } });
  const page = Object.values((await r.json()).query.pages)[0];
  // the first ~12 000 characters: enough for five questions, keeps the cost per article bounded
  return { title: page.title, text: (page.extract ?? "").slice(0, 12000) };
}
const norm = (s) => s.replace(/\s+/g, " ").replace(/[„“”"]/g, '"').replace(/[‚‘’']/g, "'").trim();
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/** Why a question is rejected – or null when it passes. */
function check(q, text, existing) {
  const t = norm(text);
  if (q.options.length !== 4 || new Set(q.options).size !== 4) return "nicht vier verschiedene Antworten";
  if (q.en.options.length !== 4 || new Set(q.en.options).size !== 4) return "englische Antworten unvollständig";
  if (q.correct_index < 0 || q.correct_index > 3) return "ungültige richtige Antwort";
  if (!q.evidence.length) return "kein Beleg";
  const missing = q.evidence.find((e) => !t.includes(norm(e)));
  if (missing) return `Zitat steht nicht wörtlich im Artikel: "${missing.slice(0, 60)}…"`;
  if (/\b(dies(e|er|es|en)|folgend)\b/i.test(q.question)) return "Frage braucht die Antwortmöglichkeiten";
  if (q.question.toLowerCase().includes(q.options[q.correct_index].toLowerCase())) return "Frage verrät die Antwort";
  if (existing.has(norm(q.question).toLowerCase())) return "gibt es schon";
  return null;
}

const [mode = "probe", ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");
const titles = mode === "probe" ? PROBE : fs.readFileSync(mode, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
const existing = new Set(JSON.parse(fs.readFileSync("content/questions.json", "utf8")).map((q) => norm(q.question).toLowerCase()));
const articles = [];
for (const t of titles) {
  const a = await article(t);
  if (a.text.length < 2000) console.warn(`zu kurz, übersprungen: ${t}`);
  else articles.push(a);
}
console.log(`${articles.length} Artikel, zusammen ${Math.round(articles.reduce((n, a) => n + a.text.length, 0) / 1000)}k Zeichen`);
if (dry) process.exit(0);

const client = new Anthropic();
const kept = [], rejected = [];
const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
for (const a of articles) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // if a safety check declines, the API retries on a suitable model
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `Artikel „${a.title}“ (Wikipedia, de):\n\n${a.text}` }],
  });
  usage.input += response.usage.input_tokens;
  usage.output += response.usage.output_tokens;
  usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;
  usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0;
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
    rejected.push({ article: a.title, reason: `Antwort abgebrochen (${response.stop_reason})` });
    continue;
  }
  const block = response.content.find((b) => b.type === "text");
  let questions = [];
  try {
    questions = JSON.parse(block?.text ?? "{}").questions ?? [];
  } catch {
    rejected.push({ article: a.title, reason: "kein gültiges JSON" });
    continue;
  }
  questions.forEach((q, i) => {
    const reason = check(q, a.text, existing);
    const row = { id: `ai-${slug(a.title)}-${i + 1}`, article: a.title, source_url: `https://de.wikipedia.org/wiki/${encodeURIComponent(a.title.replace(/ /g, "_"))}`, ...q };
    if (reason) rejected.push({ ...row, reason });
    else kept.push(row);
  });
  console.log(`${a.title}: ${questions.length} Fragen, behalten bis jetzt ${kept.length}`);
}
const cost = (usage.input * PRICE.input + usage.output * PRICE.output + usage.cacheRead * PRICE.cacheRead + usage.cacheWrite * PRICE.cacheWrite) / 1e6;
fs.mkdirSync("content/_ai", { recursive: true });
const out = `content/_ai/${mode === "probe" ? "probe" : slug(mode)}-${new Date().toISOString().slice(0, 10)}.json`;
fs.writeFileSync(out, JSON.stringify({ model: MODEL, usage, cost_usd: Math.round(cost * 100) / 100, kept, rejected }, null, 1));
console.log(`\nbehalten: ${kept.length}, verworfen: ${rejected.length}`);
console.log(`Tokens: Eingabe ${usage.input}, Ausgabe ${usage.output}, Cache gelesen ${usage.cacheRead}, Cache geschrieben ${usage.cacheWrite}`);
console.log(`Kosten: ${cost.toFixed(2)} $ (Standardpreis) – im Stapelbetrieb (Batch API) etwa die Hälfte; pro behaltener Frage ${(cost / Math.max(1, kept.length)).toFixed(4)} $`);
console.log(`→ ${out}`);
