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
