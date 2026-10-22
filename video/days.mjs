// "On this day" clips for social media: renders the events of the next days from content/days.json (DayClip.tsx)
// into video/out/social/<locale>/days/ (not in git – upload by hand) and writes days.md there with a ready caption
// per post. Bundles once, then renders each clip; everything happens on this machine.
//   npm --prefix video run days                 → German, the next 14 days from today
//   npm --prefix video run days -- en 30        → English, the next 30 days
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const args = process.argv.slice(2);
const locale = args.includes("en") ? "en" : "de";
const span = Number(args.find((a) => /^\d+$/.test(a)) ?? 14);
const days = JSON.parse(fs.readFileSync(path.join(app, "content/days.json"), "utf8")).filter((d) => d.status === "published");
const LINK = "wunder-one.vercel.app";
const TAGS = {
  de: "#heuteindergeschichte #geschichte #wusstestdu #allgemeinwissen",
  en: "#onthisday #history #didyouknow #generalknowledge",
}[locale];

const pad = (n) => String(n).padStart(2, "0");
const today = new Date();
const wanted = Array.from({ length: span }, (_, i) => {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
});
const events = wanted.flatMap((date) => days.filter((d) => d.date === date));
if (!events.length) {
  console.log(`No events for the next ${span} days – add some to content/days.json first.`);
  process.exit(0);
}

const out = path.join(here, "out/social", locale, "days");
fs.mkdirSync(out, { recursive: true });
console.log(`Bundling … then ${events.length} clips (${locale}).`);
const serveUrl = await bundle({ entryPoint: path.join(here, "src/index.ts") });
const plan = [`# ${locale === "de" ? "An diesem Tag – Posts" : "On this day – posts"}\n`];
for (const e of events) {
  const id = `day-${e.id}-${locale}`;
  const file = path.join(out, `${e.date}-${e.id}.mp4`);
  const composition = await selectComposition({ serveUrl, id });
  await renderMedia({ composition, serveUrl, codec: "h264", crf: 20, muted: true, outputLocation: file });
  const text = locale === "de" ? e.text : e.translations.en.text;
  const detail = locale === "de" ? e.detail : e.translations.en.detail;
  const [m, d] = e.date.split("-").map(Number);
  const when = new Date(e.year, m - 1, d).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  plan.push(`## ${e.date} · ${path.basename(file)}\n\n${when}: ${text}\n\n${detail}\n\n${locale === "de" ? "Jeden Tag ein Stück Geschichte – mit Quelle – in der App:" : "A piece of history every day – with sources – in the app:"} ${LINK}\n\n${TAGS}\n`);
  console.log(`${e.date}  ${path.basename(file).padEnd(44)} ${(fs.statSync(file).size / 1e6).toFixed(2)} MB`);
}
fs.writeFileSync(path.join(out, "days.md"), plan.join("\n"));
console.log(`Captions: ${path.join(out, "days.md")}`);
