// Merges a batch of "did you know" facts into content/facts.json (idempotent: same id → replaced, keeps created_at).
//   batch rows: [id, area, category, sources, deText, deDetail, enText, enDetail, minAge?]
import fs from "node:fs";

export const wiki = (title, lang = "de") => ({ name: (lang === "de" ? "Wikipedia: " : "Wikipedia (englisch): ") + title.replaceAll("_", " "), url: `https://${lang}.wikipedia.org/wiki/${title}` });

export function mergeFacts(rows, { today, verification }) {
  const file = "content/facts.json";
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  rows.forEach(([id, area, category, sources, text, detail, enText, enDetail, minAge = 10], n) => {
    const row = {
      id, category_id: category, area, min_age: minAge, text, detail, sources,
      verification_status: verification, status: "published",
      created_at: new Date(Date.parse(today + "T12:00:00Z") - n * 600_000).toISOString().replace(".000Z", "Z"),
      translations: { en: { text: enText, detail: enDetail } },
    };
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list[i] = { ...row, created_at: list[i].created_at };
    else list.push(row);
  });
  fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n");
  console.log(`${rows.length} facts merged; ${list.length} in total.`);
}
