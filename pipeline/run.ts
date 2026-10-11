/**
 * Content pipeline (runs server-side / in CI / as a cron job – never in the app).
 *
 *   npm run pipeline                 → sample sources, writes pipeline/output.json
 *   (with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set) → inserts into Supabase as status "review"
 *
 * Claude is used for exactly two steps: generation and verification.
 * Nothing is invented: every question must be backed by a verbatim quote from its source.
 */
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES } from "../lib/categories";
import type { GeneratedQuestion, QuestionSink, SourceDocument, SourceProvider, VerifiedQuestion } from "./types";

const MODEL = "claude-opus-5-5";
const MAX_SOURCES_PER_RUN = 20; // two Claude calls per source at most
const client = new Anthropic();

// ---------- 1. Sources ----------
const sampleProvider: SourceProvider = {
  name: "sample",
  fetch: async () => JSON.parse(fs.readFileSync("./pipeline/sample-sources.json", "utf8")) as SourceDocument[],
};
// Later: add an RSS/news provider implementing SourceProvider and list it here.
const providers: SourceProvider[] = [sampleProvider];

// ---------- helpers ----------
async function askJson<T>(system: string, user: string, schema: Record<string, unknown>): Promise<T> {
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    system,
    messages: [{ role: "user", content: user }],
  } as Parameters<typeof client.beta.messages.create>[0] & { stream?: false });
  if (res.stop_reason === "refusal") throw new Error("Claude declined this source");
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No text in response");
  return JSON.parse(text.text) as T;
}

// ---------- 2+3. Fact extraction + quiz generation (one call) ----------
const questionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["categoryId", "question", "options", "correctIndex", "explanation", "difficulty", "tags", "supportingQuote"],
        properties: {
          categoryId: { type: "string", enum: CATEGORIES.map((c) => c.id) },
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          explanation: { type: "string" },
          difficulty: { type: "integer", enum: [1, 2, 3] },
          tags: { type: "array", items: { type: "string" } },
          supportingQuote: { type: "string" },
        },
      },
    },
  },
};

async function generate(doc: SourceDocument): Promise<GeneratedQuestion[]> {
  const { questions } = await askJson<{ questions: GeneratedQuestion[] }>(
    "Du erstellst kurze Allgemeinwissen-Quizfragen auf Deutsch für eine Lern-App. " +
      "Nutze ausschließlich Fakten, die wörtlich im gelieferten Quelltext stehen – kein Vorwissen, keine Vermutungen. " +
      "Jede Frage hat genau 4 Antwortoptionen, davon genau eine richtig, plausible falsche Optionen, und eine Erklärung in 1–2 Sätzen. " +
      "supportingQuote muss ein wörtliches Zitat aus dem Quelltext sein, das die richtige Antwort belegt. " +
      "Erzeuge 1–3 Fragen. Wenn der Text keine prüfbaren Fakten enthält, gib eine leere Liste zurück.",
    `Titel: ${doc.title}\nQuelle: ${doc.publisher}\nDatum: ${doc.publishedAt}\n\n<quelltext>\n${doc.text}\n</quelltext>`,
    questionSchema
  );
  // Cheap deterministic checks before spending a verification call.
  return questions.filter(
    (q) => q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4 && doc.text.includes(q.supportingQuote.trim())
  );
}

// ---------- 4. Verification ----------
async function verify(doc: SourceDocument, qs: GeneratedQuestion[]): Promise<GeneratedQuestion[]> {
  if (!qs.length) return [];
  const { verdicts } = await askJson<{ verdicts: { index: number; ok: boolean; reason: string }[] }>(
    "Du bist Faktenprüfer. Prüfe jede Quizfrage streng gegen den Quelltext: Ist die markierte Antwort laut Text eindeutig richtig, " +
      "sind alle anderen Optionen laut Text oder offensichtlich falsch, und behauptet die Erklärung nichts, was nicht im Text steht? " +
      "Im Zweifel ok=false.",
    `<quelltext>\n${doc.text}\n</quelltext>\n\n<fragen>\n${JSON.stringify(qs.map((q, index) => ({ index, ...q })), null, 2)}\n</fragen>`,
    {
      type: "object",
      additionalProperties: false,
      required: ["verdicts"],
      properties: {
        verdicts: {
          type: "array",
          items: { type: "object", additionalProperties: false, required: ["index", "ok", "reason"], properties: { index: { type: "integer" }, ok: { type: "boolean" }, reason: { type: "string" } } },
        },
      },
    }
  );
  for (const v of verdicts.filter((v) => !v.ok)) console.log(`  ✗ verworfen: ${qs[v.index]?.question} – ${v.reason}`);
  const ok = new Set(verdicts.filter((v) => v.ok).map((v) => v.index));
  return qs.filter((_, i) => ok.has(i));
}

// ---------- 5. Sinks ----------
const jsonSink: QuestionSink = {
  save: async (qs) => {
    fs.writeFileSync("./pipeline/output.json", JSON.stringify(qs, null, 2));
    console.log(`→ ${qs.length} Fragen in pipeline/output.json`);
  },
};

function supabaseSink(url: string, serviceKey: string): QuestionSink {
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  return {
    save: async (qs) => {
      for (const q of qs) {
        const { data: row, error } = await db
          .from("questions")
          .insert({
            category_id: q.categoryId,
            question: q.question,
            difficulty: q.difficulty,
            tags: q.tags,
            source_name: `${q.source.publisher}: ${q.source.title}`,
            source_url: q.source.url,
            source_published_at: q.source.publishedAt,
            verification_status: "ai_checked", // becomes "verified" only after human review
            options: q.options,
            status: "review", // a human (or a later rule) flips this to "published"
          })
          .select("id")
          .single();
        if (error) throw error;
        // the answer key lives in its own private table
        const { error: aErr } = await db.from("question_answers").insert({ question_id: row.id, correct_index: q.correctIndex, explanation: q.explanation });
        if (aErr) throw aErr;
      }
      console.log(`→ ${qs.length} Fragen in Supabase (status=review)`);
    },
  };
}

// ---------- run ----------
async function main() {
  const sink = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseSink(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : jsonSink;
  const out: VerifiedQuestion[] = [];
  for (const p of providers) {
    // Rate limit: capped number of sources per run, processed one after another.
    for (const doc of (await p.fetch()).slice(0, MAX_SOURCES_PER_RUN)) {
      console.log(`• ${doc.title}`);
      try {
        const verified = await verify(doc, await generate(doc));
        out.push(...verified.map((q) => ({ ...q, source: doc })));
      } catch (e) {
        if (e instanceof Anthropic.APIError) console.error(`  API-Fehler ${e.status}: ${e.message}`);
        else console.error(`  Fehler: ${(e as Error).message}`);
      }
    }
  }
  await sink.save(out);
}

main();
