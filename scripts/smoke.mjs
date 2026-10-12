// Smoke test of a deployed version: pages answer, and every published clip is delivered as a
// video file that supports byte ranges (needed for playback on phones).
//   npm run smoke -- https://wunder-one.vercel.app
import fs from "node:fs";

const base = (process.argv[2] ?? "https://wunder-one.vercel.app").replace(/\/$/, "");
const videos = JSON.parse(fs.readFileSync("content/videos.json", "utf8")).filter((v) => v.status === "published");
const problems = [];

for (const page of ["/", "/clips/", "/quiz/", "/profile/", "/social/"]) {
  const r = await fetch(base + page, { redirect: "manual" });
  if (r.status !== 200) problems.push(`${page}: HTTP ${r.status}${r.status === 302 || r.status === 401 ? " (login required – deployment protection?)" : ""}`);
}
for (const v of videos) {
  for (const [file, type] of [[v.video_url, "video/mp4"], [v.thumbnail_url, "image/jpeg"]]) {
    if (!file) continue;
    const url = file.startsWith("http") ? file : base + file;
    const r = await fetch(url, { headers: { Range: "bytes=0-1023" }, redirect: "manual" });
    await r.arrayBuffer();
    if (![200, 206].includes(r.status)) problems.push(`${v.id}: ${file} → HTTP ${r.status}`);
    else if (!(r.headers.get("content-type") ?? "").startsWith(type)) problems.push(`${v.id}: ${file} → type ${r.headers.get("content-type")}`);
    else if (type === "video/mp4" && r.status !== 206) problems.push(`${v.id}: ${file} → no byte-range support`);
  }
}
console.log(`${base}: 5 pages, ${videos.length} clips checked`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("ok");
