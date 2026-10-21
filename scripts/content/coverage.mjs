// What the content routine should add next: facts per topic and area (fewest first), the ids and texts already
// there (to avoid duplicates), and the Wikipedia articles already used.
//   node scripts/content/coverage.mjs
import fs from "node:fs";

const facts = JSON.parse(fs.readFileSync("content/facts.json", "utf8"));
const categories = JSON.parse(fs.readFileSync("content/categories.json", "utf8"));
const count = {};
for (const c of categories) count[c.id] = 0;
const areas = {};
for (const f of facts) {
  count[f.category_id] = (count[f.category_id] ?? 0) + 1;
  areas[`${f.category_id}/${f.area}`] = (areas[`${f.category_id}/${f.area}`] ?? 0) + 1;
}
console.log(`${facts.length} facts.\n\nPer topic (fewest first):`);
for (const [k, n] of Object.entries(count).sort((a, b) => a[1] - b[1])) console.log(`  ${String(n).padStart(3)}  ${k}`);
console.log("\nPer topic/area:");
for (const [k, n] of Object.entries(areas).sort((a, b) => a[1] - b[1])) console.log(`  ${String(n).padStart(3)}  ${k}`);
console.log("\nArticles already used:");
console.log("  " + [...new Set(facts.flatMap((f) => f.sources.map((s) => s.name.replace(/^Wikipedia(?: \(englisch\))?: /, ""))))].sort().join(", "));
console.log("\nExisting facts (do not repeat):");
for (const f of facts) console.log(`  ${f.id}: ${f.text}`);

// "Heute vor … Jahren": which of the next 30 days have no event yet
const days = fs.existsSync("content/days.json") ? JSON.parse(fs.readFileSync("content/days.json", "utf8")) : [];
const have = new Set(days.map((d) => d.date));
const missing = [];
const now = new Date();
for (let i = 0; i < 30; i++) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
  const key = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (!have.has(key)) missing.push(key);
}
console.log(`\nHeute vor … Jahren: ${days.length} events; days without an event in the next 30 days: ${missing.length ? missing.join(", ") : "none"}`);
const covered = (() => { let n = 0; for (let i = 0; i < 366; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); if (!have.has(`${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)) break; n++; } return n; })();
console.log(`Covered in a row from today: ${covered} days${covered < 21 ? " – add a days batch (docs/CONTENT-ROUTINE.md)" : ""}`);
