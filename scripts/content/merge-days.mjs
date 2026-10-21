// Merges a "Heute vor … Jahren" batch into content/days.json (idempotent: same id → replaced, keeps created_at).
//   batch rows: [id, "MM-DD", year, category, sources, text de, detail de, text en, detail en, minAge?]
//   node scripts/content/merge-days.mjs content/_batches/2026-10-days-1.mjs   (run verify-evidence.mjs first)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export { day } from "./wiki.mjs";

const file = process.argv[2];
if (file && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { events, TODAY, verification = "ai_checked" } = await import(pathToFileURL(path.resolve(file)).href);
  const target = "content/days.json";
  const list = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, "utf8")) : [];
  for (const [id, date, year, category, sources, text, detail, enText, enDetail, minAge = 10] of events) {
    const row = { id, date, year, category_id: category, min_age: minAge, text, detail, sources, verification_status: verification, status: "published", created_at: `${TODAY}T12:00:00Z`, translations: { en: { text: enText, detail: enDetail } } };
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list[i] = { ...row, created_at: list[i].created_at };
    else list.push(row);
  }
  list.sort((a, b) => a.date.localeCompare(b.date) || a.year - b.year);
  fs.writeFileSync(target, JSON.stringify(list, null, 2) + "\n");
  console.log(`${events.length} events merged; ${list.length} in total.`);
}
