// Merges a "Studie kurz erklärt" batch into content/studies.json (after verify-evidence.mjs reported every study "ok").
//   node scripts/content/merge-studies.mjs content/_batches/2026-10-studies-1.mjs
// Safe to run again: existing ids are updated in place, nothing is deleted.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/content/merge-studies.mjs <batch.mjs>");
const batch = await import(pathToFileURL(path.resolve(file)).href);
const DATA = "content/studies.json";
const rows = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, "utf8")) : [];
const today = batch.TODAY ?? new Date().toISOString().slice(0, 10);
batch.studies.forEach((s, i) => {
  const row = {
    id: s.id,
    category_id: s.category,
    min_age: s.minAge,
    year: s.year,
    name: s.name.de,
    question: s.de.question,
    method: s.de.method,
    result: s.de.result,
    caveat: s.de.caveat,
    sources: s.sources,
    verification_status: batch.verification ?? "ai_checked",
    status: "published",
    created_at: new Date(Date.parse(today + "T12:00:00Z") - i * 3_600_000).toISOString().replace(".000Z", "Z"),
    translations: { en: { name: s.name.en, ...s.en } },
  };
  const at = rows.findIndex((r) => r.id === s.id);
  if (at >= 0) rows[at] = { ...rows[at], ...row, created_at: rows[at].created_at };
  else rows.push(row);
});
fs.writeFileSync(DATA, JSON.stringify(rows, null, 2) + "\n");
console.log(`${batch.studies.length} studies merged; ${rows.length} in total.`);
