// Content import: validates content/*.json and writes supabase/seed/content.sql.
//
//   npm run content:check              validate only
//   npm run content:import             → SQL that adds new records, leaves existing rows untouched
//   npm run content:import -- --update → SQL that also updates existing content rows
//
// Run the generated SQL in the Supabase SQL editor (or any admin connection). It is idempotent:
// running it twice creates no duplicates. It never truncates and never writes user data.
import fs from "node:fs";
import { buildImportSql, loadContent, validateContent } from "./lib.mjs";

const args = process.argv.slice(2);
const content = loadContent();
const { errors, warnings } = validateContent(content);

console.log(`Datensatz: ${content.categories.length} Kategorien, ${content.questions.length} Fragen ` +
  `(${content.questions.filter((q) => q.show_in_feed).length} im Feed, ${content.questions.filter((q) => !q.show_in_feed).length} Video-Quiz), ${content.videos.length} Videos`);
for (const w of warnings) console.log("  Hinweis:", w);
if (errors.length) {
  for (const e of errors) console.error("  FEHLER:", e);
  console.error(`\n${errors.length} Fehler – kein Import erzeugt.`);
  process.exit(1);
}
console.log("Validierung: keine Fehler.");

if (!args.includes("--check")) {
  fs.mkdirSync("supabase/seed", { recursive: true });
  fs.writeFileSync("supabase/seed/content.sql", buildImportSql(content, { update: args.includes("--update") }) + "\n");
  console.log("→ supabase/seed/content.sql geschrieben. Im Supabase SQL-Editor ausführen.");
}
